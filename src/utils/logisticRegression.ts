import { DataPoint } from '../shared-utils';

/**
 * Logistic regression helper functions for binary classification
 *
 * These functions implement the objective, gradient, and Hessian for
 * logistic regression with L2 regularization.
 *
 * Model: P(y=1|x) = sigmoid(w0*x1 + w1*x2 + bias)
 * Loss: -[y*log(p) + (1-y)*log(1-p)] + (λ/2)(w0² + w1²)
 *
 * Note: Uses 2D weights [w0, w1] with bias as a separate parameter.
 * The bias is not trained during optimization - it's a user-configurable parameter.
 */

const sigmoid = (z: number): number => {
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
};

const clip = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

/**
 * Compute logistic regression objective (loss)
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data points
 * @param lambda - L2 regularization parameter
 * @param bias - Bias term (not trained)
 */
export function logisticObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number {
  const [w0, w1] = w;
  let loss = 0;

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + bias;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));
  }

  loss = loss / dataPoints.length + (lambda / 2) * (w0 * w0 + w1 * w1);

  return loss;
}

/**
 * Compute logistic regression gradient
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data points
 * @param lambda - L2 regularization parameter
 * @param bias - Bias term (not trained)
 * @returns 2D gradient vector [dw0, dw1]
 */
export function logisticGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[] {
  const [w0, w1] = w;
  const grad = [0, 0];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + bias;
    const pred = sigmoid(z);
    const error = pred - point.y;

    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
  }

  grad[0] = grad[0] / dataPoints.length + lambda * w0;
  grad[1] = grad[1] / dataPoints.length + lambda * w1;

  return grad;
}

/**
 * Compute logistic regression Hessian matrix (for Newton's method)
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data points
 * @param lambda - L2 regularization parameter
 * @param bias - Bias term (not trained)
 * @returns 2x2 Hessian matrix
 */
export function logisticHessian(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[][] {
  const [w0, w1] = w;
  const H: number[][] = [
    [0, 0],
    [0, 0]
  ];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + bias;
    const sig = sigmoid(z);
    const factor = sig * (1 - sig);

    const x = [point.x1, point.x2];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        H[i][j] += factor * x[i] * x[j];
      }
    }
  }

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
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
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data points
 * @param lambda - L2 regularization parameter
 * @param bias - Bias term (not trained)
 * @returns Object with loss (number) and 2D gradient vector [dw0, dw1]
 */
export function logisticLossAndGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): { loss: number; grad: number[] } {
  const [w0, w1] = w;
  let loss = 0;
  const grad = [0, 0];

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + bias;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));

    const error = pred - point.y;
    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
  }

  loss = loss / dataPoints.length + (lambda / 2) * (w0 * w0 + w1 * w1);
  grad[0] = grad[0] / dataPoints.length + lambda * w0;
  grad[1] = grad[1] / dataPoints.length + lambda * w1;

  return { loss, grad };
}
