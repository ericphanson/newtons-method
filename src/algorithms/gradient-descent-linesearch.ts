import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  norm,
  scale,
  add
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';

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
 * @param data Training data points
 * @param maxIter Maximum number of iterations
 * @param lambda Regularization parameter
 * @param c1 Armijo constant for sufficient decrease
 * @returns Array of iteration objects with line search details
 */
export const runGradientDescentLineSearch = (
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
