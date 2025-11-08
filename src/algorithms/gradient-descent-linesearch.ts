import {
  LineSearchTrial,
  norm,
  scale,
  add
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
  const { maxIter, c1 = 0.0001, lambda = 0, initialPoint, tolerance = 1e-6 } = options;
  const iterations: GDLineSearchIteration[] = [];

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
    if (gradNorm < tolerance) {
      break;
    }
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
    maxIter
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled: false, // GD with line search doesn't have stalling detection yet
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion,
    terminationMessage
  };

  return { iterations, summary };
};
