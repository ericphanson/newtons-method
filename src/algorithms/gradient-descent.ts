import { DataPoint, computeLossAndGradient, norm, scale, add } from '../shared-utils';
import { ProblemFunctions, AlgorithmOptions } from './types';

export interface GDIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
}

/**
 * Gradient Descent with fixed step size
 *
 * Simple first-order optimization: w_new = w_old - alpha * grad
 *
 * @param problem Problem definition with objective, gradient, and dimensionality
 * @param options Algorithm options including maxIter, alpha, and optional initial point
 * @returns Array of iteration objects tracking the optimization trajectory
 */
export const runGradientDescent = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { alpha: number; lambda?: number }
): GDIteration[] => {
  const { maxIter, alpha, lambda = 0, initialPoint, tolerance = 1e-6 } = options;
  const iterations: GDIteration[] = [];

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

    // Fixed step size update
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
      newLoss
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
 * @deprecated Use runGradientDescent with ProblemFunctions interface instead
 * Kept for backward compatibility during migration
 */
export const runGradientDescentLegacy = (
  data: DataPoint[],
  maxIter: number = 100,
  alpha: number = 0.1,
  lambda: number = 0.0001
): GDIteration[] => {
  const iterations: GDIteration[] = [];
  let w = [0.1, 0.1, 0.0];  // Initial weights

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Fixed step size update
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
      newLoss
    });

    w = wNew;

    // Early stopping if converged
    if (gradNorm < 1e-6) {
      break;
    }
  }

  return iterations;
};
