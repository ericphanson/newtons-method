import { DataPoint } from '../shared-utils';

/**
 * Separating Hyperplane variants for binary classification
 *
 * Three variants demonstrating different objective functions:
 * - Soft-Margin: ||w||²/2 + λ·Σmax(0, 1-y·z)
 * - Perceptron: Σmax(0, -y·z) + (λ/2)||w||²
 * - Squared-Hinge: ||w||²/2 + λ·Σ[max(0, 1-y·z)]²
 *
 * Model: y_i ∈ {-1, +1}, z_i = w0*x1 + w1*x2 + bias
 * Uses 2D weights [w0, w1] for features, bias is a separate parameter.
 * Parameter λ (lambda) controls regularization strength.
 */

/**
 * Convert binary labels from {0,1} to {-1,+1} format for SVM
 */
function convertLabel(y: number): number {
  return y === 0 ? -1 : 1;
}

/**
 * Compute decision value z = w·x + bias
 */
function computeZ(w: number[], point: DataPoint, bias: number): number {
  const [w0, w1] = w;
  return w0 * point.x1 + w1 * point.x2 + bias;
}

/**
 * Soft-Margin SVM: ||w||²/2 + λ·Σmax(0, 1-y·z)
 * Uses hinge loss with adjustable regularization λ.
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 */
export function softMarginObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += lambda * hingeLoss;
  }

  return loss;
}

/**
 * Gradient of soft-margin objective
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 * @returns 2D gradient vector [dw0, dw1]
 */
export function softMarginGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[] {
  const [w0, w1] = w;

  let grad0 = w0;
  let grad1 = w1;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);

    // Subgradient: if 1 - y·z > 0, gradient is -λ·y·x
    if (1 - y * z > 0) {
      grad0 -= lambda * y * point.x1;
      grad1 -= lambda * y * point.x2;
    }
  }

  return [grad0, grad1];
}

/**
 * Hessian of soft-margin objective (approximate)
 *
 * @returns 2x2 Hessian matrix (identity for regularization term)
 */
export function softMarginHessian(
): number[][] {
  // Hinge loss is not twice differentiable, return approximate Hessian
  // Use identity for regularization term
  return [
    [1, 0],
    [0, 1]
  ];
}

/**
 * Perceptron Criterion: Σmax(0, -y·z) + (λ/2)||w||²
 * Minimizes misclassification loss with adjustable regularization λ.
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 */
export function perceptronObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number {
  const [w0, w1] = w;
  let loss = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);
    loss += Math.max(0, -y * z);
  }

  // Add regularization to prevent weights from going to zero
  const regularization = lambda * 0.5 * (w0 * w0 + w1 * w1);

  return loss + regularization;
}

/**
 * Gradient of perceptron objective
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 * @returns 2D gradient vector [dw0, dw1]
 */
export function perceptronGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[] {
  const [w0, w1] = w;
  let grad0 = 0;
  let grad1 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);

    // If misclassified (y·z < 0), gradient is -y·x
    if (y * z < 0) {
      grad0 -= y * point.x1;
      grad1 -= y * point.x2;
    }
  }

  // Add regularization gradient: λ * w
  grad0 = grad0 + lambda * w0;
  grad1 = grad1 + lambda * w1;

  return [grad0, grad1];
}

/**
 * Hessian of perceptron objective
 *
 * @param lambda - Regularization parameter
 * @returns 2x2 Hessian matrix (from regularization term)
 */
export function perceptronHessian(
  lambda: number
): number[][] {
  // Perceptron loss is piecewise linear, Hessian is from regularization term
  // H = λ * I for w0, w1
  return [
    [lambda, 0],
    [0, lambda]
  ];
}

/**
 * Squared-Hinge Loss: ||w||²/2 + λ·Σ[max(0, 1-y·z)]²
 * Smooth variant of hinge loss with adjustable regularization λ.
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 */
export function squaredHingeObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += lambda * hingeLoss * hingeLoss;
  }

  return loss;
}

/**
 * Gradient of squared-hinge objective
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 * @returns 2D gradient vector [dw0, dw1]
 */
export function squaredHingeGradient(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[] {
  const [w0, w1] = w;

  let grad0 = w0;
  let grad1 = w1;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);
    const margin = 1 - y * z;

    if (margin > 0) {
      // Gradient: -2λ·(1-y·z)·y·x
      const factor = -2 * lambda * margin * y;
      grad0 += factor * point.x1;
      grad1 += factor * point.x2;
    }
  }

  return [grad0, grad1];
}

/**
 * Hessian of squared-hinge objective
 *
 * @param w - 2D weight vector [w0, w1]
 * @param dataPoints - Training data
 * @param lambda - Regularization parameter
 * @param bias - Bias term (not optimized)
 * @returns 2x2 Hessian matrix
 */
export function squaredHingeHessian(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number[][] {
  // Squared hinge is twice differentiable
  // H = I + 2λ·Σ[1(margin>0)·x·x^T]
  let h00 = 1;
  let h01 = 0;
  let h11 = 1;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point, bias);

    if (1 - y * z > 0) {
      const factor = 2 * lambda * y * y; // y² = 1 always
      h00 += factor * point.x1 * point.x1;
      h01 += factor * point.x1 * point.x2;
      h11 += factor * point.x2 * point.x2;
    }
  }

  return [
    [h00, h01],
    [h01, h11]
  ];
}
