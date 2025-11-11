import {
  LineSearchTrial,
  dot,
  norm,
  scale,
  add,
  sub
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary, ConvergenceCriterion } from './types';
import { getTerminationMessage } from './terminationUtils';

export interface MemoryPair {
  s: number[];
  y: number[];
  rho: number;
}

export interface TwoLoopData {
  firstLoop: Array<{
    i: number;
    rho: number;
    sTq: number;
    alpha: number;
    q: number[];
  }>;
  gamma: number;
  secondLoop: Array<{
    i: number;
    yTr: number;
    beta: number;
    alpha: number;
    correction: number;
    r: number[];
  }>;
  alphas: number[];
}

export interface CurvaturePair {
  s: number[];
  y: number[];
  sTy: number;
  accepted: boolean;
  reason: string;
}

export interface HessianComparison {
  trueHessian: number[][] | null;  // 2x2 matrix, null if hessian not available
  approximateHessian: number[][];   // 2x2 reconstructed from L-BFGS memory
  trueEigenvalues: { lambda1: number; lambda2: number } | null;
  approximateEigenvalues: { lambda1: number; lambda2: number };
  frobeniusError: number | null;
}

export interface LBFGSIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  memory: MemoryPair[];
  twoLoopData: TwoLoopData | null;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
  curvaturePair: CurvaturePair | null;  // Attempted curvature pair for this iteration (may be rejected)
  allCurvaturePairs: CurvaturePair[];  // Complete history of all attempted pairs (accepted and rejected)
  hessianComparison: HessianComparison | null;  // Only computed when memory has data
}

/**
 * Apply two-loop recursion to compute B^{-1} * v for an arbitrary vector v
 * This is the core L-BFGS operation that applies the approximate inverse Hessian
 */
function applyTwoLoopRecursion(
  v: number[],
  memory: MemoryPair[],
  gamma: number
): number[] {
  if (memory.length === 0) {
    return scale(v, -1); // Just return -v if no memory
  }

  const q = [...v];
  const alphas: number[] = [];

  // First loop (backward)
  for (let i = memory.length - 1; i >= 0; i--) {
    const { s, y, rho } = memory[i];
    const alpha = rho * dot(s, q);
    alphas.unshift(alpha);
    for (let j = 0; j < q.length; j++) {
      q[j] -= alpha * y[j];
    }
  }

  // Scale by initial Hessian approximation
  const r = scale(q, gamma);

  // Second loop (forward)
  for (let i = 0; i < memory.length; i++) {
    const { s, y, rho } = memory[i];
    const beta = rho * dot(y, r);
    const correction = alphas[i] - beta;
    for (let j = 0; j < r.length; j++) {
      r[j] += correction * s[j];
    }
  }

  return r;
}

/**
 * Reconstruct the full approximate Hessian B from L-BFGS memory (2D only)
 * Returns B^{-1} by applying two-loop to basis vectors, then inverts to get B
 */
function reconstructApproximateHessian(
  memory: MemoryPair[],
  gamma: number
): number[][] {
  if (memory.length === 0) {
    // No memory: return identity scaled by 1/gamma (B_0 = (1/gamma)I)
    return [[1/gamma, 0], [0, 1/gamma]];
  }

  // Apply two-loop to basis vectors to get B^{-1}
  const BInvCol1 = applyTwoLoopRecursion([1, 0], memory, gamma);
  const BInvCol2 = applyTwoLoopRecursion([0, 1], memory, gamma);

  // B^{-1} matrix
  const BInv = [
    [BInvCol1[0], BInvCol2[0]],
    [BInvCol1[1], BInvCol2[1]]
  ];

  // Invert to get B (2x2 matrix inversion)
  const det = BInv[0][0] * BInv[1][1] - BInv[0][1] * BInv[1][0];
  if (Math.abs(det) < 1e-10) {
    // Singular, return identity
    return [[1, 0], [0, 1]];
  }

  const B = [
    [BInv[1][1] / det, -BInv[0][1] / det],
    [-BInv[1][0] / det, BInv[0][0] / det]
  ];

  return B;
}

/**
 * Compute eigenvalues of a 2x2 symmetric matrix
 */
function computeEigenvalues2x2(M: number[][]): { lambda1: number; lambda2: number } {
  // For symmetric 2x2: λ = (tr ± sqrt(tr^2 - 4*det)) / 2
  const trace = M[0][0] + M[1][1];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    // Complex eigenvalues, return real part (should not happen for symmetric positive definite)
    return { lambda1: trace / 2, lambda2: trace / 2 };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  // Return sorted (largest first)
  return lambda1 >= lambda2
    ? { lambda1, lambda2 }
    : { lambda1: lambda2, lambda2: lambda1 };
}

/**
 * Compute Frobenius norm of difference between two matrices
 */
function frobeniusNorm(A: number[][], B: number[][]): number {
  let sum = 0;
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[i].length; j++) {
      const diff = A[i][j] - B[i][j];
      sum += diff * diff;
    }
  }
  return Math.sqrt(sum);
}

/**
 * L-BFGS (Limited-memory BFGS) quasi-Newton method
 *
 * Approximates the Hessian inverse using a history buffer of gradient differences.
 * More memory-efficient than full BFGS, storing only M recent (s, y) pairs.
 * Uses two-loop recursion to compute search direction without storing full Hessian.
 *
 * @param problem Problem definition with objective, gradient, and dimensionality
 * @param options Algorithm options including maxIter, c1 (line search), m (memory size), and optional initial point
 * @returns Array of iteration objects with memory buffer and two-loop recursion details
 */
export const runLBFGS = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { c1?: number; m?: number; lambda?: number; hessianDamping?: number }
): AlgorithmResult<LBFGSIteration> => {
  const { maxIter, c1 = 0.0001, m = 5, lambda = 0, initialPoint, tolerance = 1e-5, hessianDamping = 0.01 } = options;
  const iterations: LBFGSIteration[] = [];
  const M = m; // Memory parameter: number of (s, y) pairs to store

  // Note: lambda is accepted for API consistency but unused here since
  // regularization is already baked into ProblemFunctions
  void lambda;

  // Initialize weights based on dimensionality
  let w = initialPoint || [0.1, 0.1];

  const memory: MemoryPair[] = [];
  const allCurvaturePairs: CurvaturePair[] = [];  // Track all attempted pairs for pedagogy

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    let direction: number[];
    let twoLoopData: TwoLoopData | null = null;

    if (iter === 0 || memory.length === 0) {
      direction = scale(grad, -1);
    } else {
      const q = [...grad];
      const alphas = [];
      const firstLoop = [];

      for (let i = memory.length - 1; i >= 0; i--) {
        const { s, y, rho } = memory[i];
        const alpha = rho * dot(s, q);
        alphas.unshift(alpha);
        for (let j = 0; j < q.length; j++) {
          q[j] -= alpha * y[j];
        }
        firstLoop.push({
          i: memory.length - i,
          rho,
          sTq: dot(s, grad),
          alpha,
          q: [...q]
        });
      }

      const lastMem = memory[memory.length - 1];
      const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);

      // Apply Hessian damping to the base scaling (H_0 = γI)
      // NOTE: Unlike Newton's method where damping affects the full Hessian (H + λI),
      // L-BFGS damping only modifies the initial scaling H_0. The rank-2k updates
      // from memory still use the original curvature information.
      // Formula: (H_0 + λI)^{-1} = (1/γ + λ)^{-1} I = γ/(1 + λγ) I
      const gamma = hessianDamping > 0
        ? gammaBase / (1 + hessianDamping * gammaBase)
        : gammaBase;
      const r = scale(q, gamma);

      const secondLoop = [];
      for (let i = 0; i < memory.length; i++) {
        const { s, y, rho } = memory[i];
        const beta = rho * dot(y, r);
        const correction = alphas[i] - beta;
        for (let j = 0; j < r.length; j++) {
          r[j] += correction * s[j];
        }
        secondLoop.push({
          i: i + 1,
          yTr: dot(y, scale(r, 1 / (1 + correction / alphas[i]))),
          beta,
          alpha: alphas[i],
          correction,
          r: [...r]
        });
      }

      direction = scale(r, -1);
      twoLoopData = { firstLoop, gamma, secondLoop, alphas };
    }

    // Line search
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
      c1
    );

    const acceptedAlpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const newLoss = problem.objective(wNew);
    const newGrad = problem.gradient(wNew);

    // Compute curvature pair for this iteration (will be used in next iteration)
    let curvaturePair: CurvaturePair | null = null;
    if (iter > 0) {
      const s = sub(wNew, w);
      const y = sub(newGrad, grad);
      const sTy = dot(s, y);

      const accepted = sTy > 1e-10;
      curvaturePair = {
        s,
        y,
        sTy,
        accepted,
        reason: accepted
          ? 'Positive curvature (sᵀy > 0)'
          : sTy <= 0
          ? 'Negative/zero curvature (sᵀy ≤ 0) - rejected'
          : 'Near-zero curvature (numerical safety) - rejected'
      };

      // Add to complete history (for pedagogy)
      allCurvaturePairs.push(curvaturePair);

      // Only add to memory if accepted (for actual computation)
      if (accepted) {
        memory.push({ s, y, rho: 1 / sTy });
        if (memory.length > M) memory.shift();
      }
    }

    // Compute Hessian comparison (only if we have memory and problem has Hessian)
    let hessianComparison: HessianComparison | null = null;
    if (memory.length > 0) {
      // Get gamma for current memory state
      const lastMem = memory[memory.length - 1];
      const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
      const gamma = hessianDamping > 0
        ? gammaBase / (1 + hessianDamping * gammaBase)
        : gammaBase;

      // Reconstruct approximate Hessian B
      const approximateHessian = reconstructApproximateHessian(memory, gamma);
      const approximateEigenvalues = computeEigenvalues2x2(approximateHessian);

      // Get true Hessian if available
      let trueHessian: number[][] | null = null;
      let trueEigenvalues: { lambda1: number; lambda2: number } | null = null;
      let frobeniusError: number | null = null;

      if (problem.hessian) {
        const H = problem.hessian(wNew);
        trueHessian = H;
        trueEigenvalues = computeEigenvalues2x2(H);
        frobeniusError = frobeniusNorm(approximateHessian, H);
      }

      hessianComparison = {
        trueHessian,
        approximateHessian,
        trueEigenvalues,
        approximateEigenvalues,
        frobeniusError
      };
    }

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      memory: memory.map(m => ({ ...m })),
      twoLoopData,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve,
      curvaturePair,
      allCurvaturePairs: allCurvaturePairs.map(p => ({ ...p })),
      hessianComparison
    });

    w = wNew;

    if (gradNorm < tolerance) break;
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: ConvergenceCriterion;
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const terminationMessage = getTerminationMessage(convergenceCriterion, {
    gradNorm: finalGradNorm,
    gtol: tolerance,
    iters: iterations.length,
    maxIter,
    isSecondOrder: false  // L-BFGS approximates second-order info but doesn't verify eigenvalues
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled: false, // L-BFGS doesn't have stalling detection yet
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion,
    terminationMessage
  };

  return { iterations, summary };
};
