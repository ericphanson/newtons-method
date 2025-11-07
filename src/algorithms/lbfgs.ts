import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
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
  const { maxIter, c1 = 0.0001, m = 5, lambda = 0, initialPoint, tolerance = 1e-5, hessianDamping = 0.01, termination } = options;
  const iterations: LBFGSIteration[] = [];
  const M = m; // Memory parameter: number of (s, y) pairs to store
  let previousLoss: number | null = null;
  let previousW: number[] | null = null;
  let terminationReason: ConvergenceCriterion | null = null;

  // Extract termination thresholds (backward compatible with tolerance parameter)
  const gtol = termination?.gtol ?? tolerance;
  const ftol = termination?.ftol ?? 1e-9;
  const xtol = termination?.xtol ?? 1e-9;

  // Note: lambda is accepted for API consistency but unused here since
  // regularization is already baked into ProblemFunctions
  void lambda;

  // Initialize weights based on dimensionality
  let w = initialPoint || (problem.dimensionality === 3
    ? [0.1, 0.1, 0.0]
    : [0.1, 0.1]);

  const memory: MemoryPair[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Early divergence detection
    if (!isFinite(loss) || !isFinite(gradNorm)) {
      terminationReason = 'diverged';
      // Still store the iteration data before breaking
      iterations.push({
        iter,
        w: [...w],
        loss,
        grad: [...grad],
        gradNorm,
        direction: [0, 0],
        alpha: 0,
        wNew: [...w],
        newLoss: loss,
        memory: memory.map(m => ({ ...m })),
        twoLoopData: null,
        lineSearchTrials: [],
        lineSearchCurve: { alphaRange: [], lossValues: [], armijoValues: [] }
      });
      break;
    }

    // Check gradient norm convergence
    if (gradNorm < gtol) {
      terminationReason = 'gradient';
    }

    // Check function value stalling (scipy-style: relative tolerance)
    if (previousLoss !== null && ftol > 0) {
      const funcChange = Math.abs(loss - previousLoss);
      const relativeFuncChange = funcChange / Math.max(Math.abs(loss), 1e-8);
      if (relativeFuncChange < ftol && terminationReason === null) {
        terminationReason = 'ftol';
      }
    }

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
      // Apply Hessian damping: exact analog to Newton's (H + λI)
      // For L-BFGS: B_0 + λI where B_0 = (1/γ)I, so (B_0 + λI)^{-1} = γ/(1 + λγ) I
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

    // Check step size stalling (scipy-style: relative tolerance)
    if (xtol > 0) {
      const stepSize = norm(sub(wNew, w));
      const relativeStepSize = stepSize / Math.max(norm(wNew), 1.0);
      if (relativeStepSize < xtol && terminationReason === null) {
        terminationReason = 'xtol';
      }
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
      lineSearchCurve: lineSearchResult.curve
    });

    if (iter > 0) {
      const s = sub(wNew, w);
      const y = sub(newGrad, grad);
      const sTy = dot(s, y);

      if (sTy > 1e-10) {
        memory.push({ s, y, rho: 1 / sTy });
        if (memory.length > M) memory.shift();
      }
    }

    // Update for next iteration
    previousLoss = newLoss;
    previousW = [...w];
    w = wNew;

    // Early stopping if any termination criterion met
    if (terminationReason !== null) {
      break;
    }
  }

  // If loop completed without early termination
  if (terminationReason === null) {
    terminationReason = 'maxiter';
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  // Compute final step size and function change (absolute and relative)
  const absoluteStepSize = previousW ? norm(sub(finalLocation, previousW)) : undefined;
  const absoluteFuncChange = previousLoss !== null ? Math.abs(finalLoss - previousLoss) : undefined;

  // Compute relative values (for scipy-style tolerance checking)
  const finalStepSize = absoluteStepSize !== undefined
    ? absoluteStepSize / Math.max(norm(finalLocation), 1.0)
    : undefined;
  const finalFunctionChange = absoluteFuncChange !== undefined
    ? absoluteFuncChange / Math.max(Math.abs(finalLoss), 1e-8)
    : undefined;

  // Determine convergence flags
  const converged = ['gradient', 'ftol', 'xtol'].includes(terminationReason);
  const diverged = terminationReason === 'diverged';
  const stalled = ['ftol', 'xtol'].includes(terminationReason);

  // Generate human-readable termination message
  const terminationMessage = getTerminationMessage(terminationReason, {
    gradNorm: finalGradNorm,
    gtol,
    stepSize: finalStepSize,
    xtol,
    funcChange: finalFunctionChange,
    ftol,
    iters: iterations.length,
    maxIter
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled,
    finalLocation,
    finalLoss,
    finalGradNorm,
    finalStepSize,
    finalFunctionChange,
    iterationCount: iterations.length,
    convergenceCriterion: terminationReason,
    terminationMessage
  };

  return { iterations, summary };
};

/**
 * @deprecated Use runLBFGS with ProblemFunctions interface instead
 * Kept for backward compatibility during migration
 */
export const runLBFGSLegacy = (
  data: DataPoint[],
  maxIter = 25,
  M = 5,
  lambda = 0.0001,
  c1 = 0.0001,
  hessianDamping = 0.01
): LBFGSIteration[] => {
  const iterations: LBFGSIteration[] = [];
  let w = [0.1, 0.1, 0.0];
  const memory: MemoryPair[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
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
      // Apply Hessian damping: exact analog to Newton's (H + λI)
      // For L-BFGS: B_0 + λI where B_0 = (1/γ)I, so (B_0 + λI)^{-1} = γ/(1 + λγ) I
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
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const acceptedAlpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const { loss: newLoss, grad: newGrad } = computeLossAndGradient(wNew, data, lambda);

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
      lineSearchCurve: lineSearchResult.curve
    });

    if (iter > 0) {
      const s = sub(wNew, w);
      const y = sub(newGrad, grad);
      const sTy = dot(s, y);

      if (sTy > 1e-10) {
        memory.push({ s, y, rho: 1 / sTy });
        if (memory.length > M) memory.shift();
      }
    }

    w = wNew;

    if (gradNorm < 1e-5) break;
  }

  return iterations;
};
