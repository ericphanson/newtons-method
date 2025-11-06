import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  norm,
  scale,
  add
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';
import { ProblemFunctions, AlgorithmOptions } from './types';

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
): GDLineSearchIteration[] => {
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

  return iterations;
};

/**
 * @deprecated Use runGradientDescentLineSearch with ProblemFunctions interface instead
 * Kept for backward compatibility during migration
 */
export const runGradientDescentLineSearchLegacy = (
  data: DataPoint[],
  maxIter: number = 80,
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
