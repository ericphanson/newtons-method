import { DataPoint } from '../shared-utils';

/**
 * Logistic regression helper functions for binary classification
 *
 * These functions implement the objective, gradient, and Hessian for
 * logistic regression with L2 regularization.
 *
 * Model: P(y=1|x) = sigmoid(w0*x1 + w1*x2 + w2)
 * Loss: -[y*log(p) + (1-y)*log(1-p)] + (λ/2)(w0² + w1²)
 *
 * Note: Uses 3D weights [w0, w1, w2] where w2 is the bias term.
 * This differs from the 2D problem registry which doesn't include bias.
 */

const sigmoid = (z: number): number => {
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
};

const clip = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

/**
 * Compute logistic regression objective (loss)
 */
export function logisticObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number {
  const [w0, w1, w2] = w;
  let loss = 0;

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));
  }

  loss = loss / dataPoints.length + (lambda / 2) * (w0 * w0 + w1 * w1);

  return loss;
}

/**
 * Compute logistic regression gradient
 */
export function logisticGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number[] {
  const [w0, w1, w2] = w;
  const grad = [0, 0, 0];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const error = pred - point.y;

    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
    grad[2] += error;
  }

  grad[0] = grad[0] / dataPoints.length + lambda * w0;
  grad[1] = grad[1] / dataPoints.length + lambda * w1;
  grad[2] = grad[2] / dataPoints.length;

  return grad;
}

/**
 * Compute logistic regression Hessian matrix (for Newton's method)
 */
export function logisticHessian(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number[][] {
  const [w0, w1, w2] = w;
  const H: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const sig = sigmoid(z);
    const factor = sig * (1 - sig);

    const x = [point.x1, point.x2, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        H[i][j] += factor * x[i] * x[j];
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      H[i][j] /= dataPoints.length;
    }
  }

  H[0][0] += lambda;
  H[1][1] += lambda;

  return H;
}

/**
 * Combined loss and gradient computation (optimized version)
 * This is more efficient than calling objective and gradient separately.
 */
export function logisticLossAndGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): { loss: number; grad: number[] } {
  const [w0, w1, w2] = w;
  let loss = 0;
  const grad = [0, 0, 0];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));

    const error = pred - point.y;
    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
    grad[2] += error;
  }

  loss = loss / dataPoints.length + (lambda / 2) * (w0 * w0 + w1 * w1);
  grad[0] = grad[0] / dataPoints.length + lambda * w0;
  grad[1] = grad[1] / dataPoints.length + lambda * w1;
  grad[2] = grad[2] / dataPoints.length;

  return { loss, grad };
}
