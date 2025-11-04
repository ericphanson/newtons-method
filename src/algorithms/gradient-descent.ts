import {
  DataPoint,
  computeLossAndGradient,
  norm,
  scale,
  add
} from '../shared-utils';

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
 * @param data Training data points
 * @param maxIter Maximum number of iterations
 * @param alpha Fixed step size (learning rate)
 * @param lambda Regularization parameter
 * @returns Array of iteration objects tracking the optimization trajectory
 */
export const runGradientDescent = (
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
