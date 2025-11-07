import { DataPoint } from '../shared-utils';

/**
 * Separating Hyperplane variants for binary classification
 *
 * Four variants demonstrating different objective functions:
 * - Hard-Margin: ||w||²/2 (fails on non-separable data)
 * - Soft-Margin: ||w||²/2 + C·Σmax(0, 1-y·z) (C=1.0)
 * - Perceptron: Σmax(0, -y·z)
 * - Squared-Hinge: ||w||²/2 + C·Σ[max(0, 1-y·z)]² (C=1.0)
 *
 * Model: y_i ∈ {-1, +1}, z_i = w0*x1 + w1*x2 + w2
 * Uses 3D weights [w0, w1, w2] where w2 is the bias term.
 */

// Fixed regularization parameter for soft-margin and squared-hinge
const C = 1.0;

/**
 * Convert binary labels from {0,1} to {-1,+1} format for SVM
 */
function convertLabel(y: number): number {
  return y === 0 ? -1 : 1;
}

/**
 * Compute decision value z = w·x + b
 */
function computeZ(w: number[], point: DataPoint): number {
  const [w0, w1, w2] = w;
  return w0 * point.x1 + w1 * point.x2 + w2;
}

/**
 * Hard-Margin SVM: Minimize ||w||²/2
 * Assumes data is linearly separable.
 * Will produce large gradients if data is not separable.
 */
export function hardMarginObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  // Just the regularization term (margin maximization)
  return 0.5 * (w0 * w0 + w1 * w1);
}

export function hardMarginGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  // Add constraint violations as penalties
  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const margin = y * z;

    // If point violates margin constraint (y·z < 1), add large penalty gradient
    if (margin < 1) {
      const penalty = 1000 * (1 - margin); // Large penalty for violations
      grad0 -= penalty * y * point.x1;
      grad1 -= penalty * y * point.x2;
      grad2 -= penalty * y;
    }
  }

  return [grad0, grad1, grad2];
}

export function hardMarginHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Hessian of ||w||²/2 is identity for w0, w1
  // For simplicity, return approximate Hessian
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0.01] // Small value for bias to avoid singularity
  ];
}

/**
 * Soft-Margin SVM: ||w||²/2 + C·Σmax(0, 1-y·z)
 * Uses hinge loss. C=1.0 fixed.
 */
export function softMarginObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += C * hingeLoss;
  }

  return loss / dataPoints.length;
}

export function softMarginGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    // Subgradient: if 1 - y·z > 0, gradient is -C·y·x
    if (1 - y * z > 0) {
      grad0 -= C * y * point.x1;
      grad1 -= C * y * point.x2;
      grad2 -= C * y;
    }
  }

  return [
    grad0 / dataPoints.length,
    grad1 / dataPoints.length,
    grad2 / dataPoints.length
  ];
}

export function softMarginHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Hinge loss is not twice differentiable, return approximate Hessian
  // Use identity for regularization term
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0.01]
  ];
}

/**
 * Perceptron Criterion: Σmax(0, -y·z) + small regularization
 * Minimizes misclassification loss.
 * Note: Added small regularization (0.01 * ||w||²/2) to prevent weights collapsing to zero.
 */
export function perceptronObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  let loss = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    loss += Math.max(0, -y * z);
  }

  // Add small regularization to prevent weights from going to zero
  const regularization = 0.01 * 0.5 * (w0 * w0 + w1 * w1);

  return loss / dataPoints.length + regularization;
}

export function perceptronGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;
  let grad0 = 0;
  let grad1 = 0;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    // If misclassified (y·z < 0), gradient is -y·x
    if (y * z < 0) {
      grad0 -= y * point.x1;
      grad1 -= y * point.x2;
      grad2 -= y;
    }
  }

  // Add regularization gradient: 0.01 * w (but not for bias)
  grad0 = grad0 / dataPoints.length + 0.01 * w0;
  grad1 = grad1 / dataPoints.length + 0.01 * w1;
  grad2 = grad2 / dataPoints.length;

  return [grad0, grad1, grad2];
}

export function perceptronHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Perceptron loss is piecewise linear, Hessian is from regularization term
  // H = 0.01 * I for w0, w1; small value for bias to avoid singularity
  return [
    [0.01, 0, 0],
    [0, 0.01, 0],
    [0, 0, 0.01]
  ];
}

/**
 * Squared-Hinge Loss: ||w||²/2 + C·Σ[max(0, 1-y·z)]²
 * Smooth variant of hinge loss. C=1.0 fixed.
 */
export function squaredHingeObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += C * hingeLoss * hingeLoss;
  }

  return loss / dataPoints.length;
}

export function squaredHingeGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const margin = 1 - y * z;

    if (margin > 0) {
      // Gradient: -2C·(1-y·z)·y·x
      const factor = -2 * C * margin * y;
      grad0 += factor * point.x1;
      grad1 += factor * point.x2;
      grad2 += factor;
    }
  }

  return [
    grad0 / dataPoints.length,
    grad1 / dataPoints.length,
    grad2 / dataPoints.length
  ];
}

export function squaredHingeHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Squared hinge is twice differentiable
  // H = I + 2C·Σ[1(margin>0)·x·x^T]
  let h00 = 1;
  let h01 = 0;
  let h02 = 0;
  let h11 = 1;
  let h12 = 0;
  let h22 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    if (1 - y * z > 0) {
      const factor = 2 * C * y * y; // y² = 1 always
      h00 += factor * point.x1 * point.x1;
      h01 += factor * point.x1 * point.x2;
      h02 += factor * point.x1;
      h11 += factor * point.x2 * point.x2;
      h12 += factor * point.x2;
      h22 += factor;
    }
  }

  const n = dataPoints.length;
  return [
    [h00 / n, h01 / n, h02 / n],
    [h01 / n, h11 / n, h12 / n],
    [h02 / n, h12 / n, h22 / n]
  ];
}
