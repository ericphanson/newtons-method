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
  const { maxIter, c1 = 0.0001, m = 5, lambda = 0, initialPoint, tolerance = 1e-5, hessianDamping = 0.01 } = options;
  const iterations: LBFGSIteration[] = [];
  const M = m; // Memory parameter: number of (s, y) pairs to store

  // Note: lambda is accepted for API consistency but unused here since
  // regularization is already baked into ProblemFunctions
  void lambda;

  // Initialize weights based on dimensionality
  let w = initialPoint || [0.1, 0.1];

  const memory: MemoryPair[] = [];

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
