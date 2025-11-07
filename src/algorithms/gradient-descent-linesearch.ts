import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  norm,
  scale,
  add,
  sub
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary, ConvergenceCriterion } from './types';
import { getTerminationMessage } from './terminationUtils';

export interface GDLineSearchIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

/**
 * Gradient Descent with Armijo line search
 *
 * First-order optimization with adaptive step size selection.
 * At each iteration, performs backtracking line search to find
 * a step size satisfying the Armijo condition.
 *
 * @param problem Problem definition with objective, gradient, and dimensionality
 * @param options Algorithm options including maxIter, c1, and optional initial point
 * @returns Array of iteration objects with line search details
 */
export const runGradientDescentLineSearch = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { c1?: number; lambda?: number }
): AlgorithmResult<GDLineSearchIteration> => {
  const { maxIter, c1 = 0.0001, lambda = 0, initialPoint, tolerance = 1e-6, termination } = options;
  const iterations: GDLineSearchIteration[] = [];
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

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Perform line search to find good step size
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
      c1
    );

    const alpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, alpha));
    const newLoss = problem.objective(wNew);

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
      alpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });

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
 * @deprecated Use runGradientDescentLineSearch with ProblemFunctions interface instead
 * Kept for backward compatibility during migration
 */
export const runGradientDescentLineSearchLegacy = (
  data: DataPoint[],
  maxIter: number = 100,
  lambda: number = 0.0001,
  c1: number = 0.0001
): GDLineSearchIteration[] => {
  const iterations: GDLineSearchIteration[] = [];
  let w = [0.1, 0.1, 0.0];  // Initial weights

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Perform line search to find good step size
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const alpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, alpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });

    w = wNew;

    // Early stopping if converged
    if (gradNorm < 1e-6) {
      break;
    }
  }

  return iterations;
};
