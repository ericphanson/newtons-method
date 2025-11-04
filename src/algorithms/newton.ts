import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  sigmoid,
  dot,
  norm,
  scale,
  add
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';

export interface NewtonIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  hessian: number[][];
  eigenvalues: number[];
  conditionNumber: number;
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

// Compute Hessian matrix (second derivatives) for logistic regression
const computeHessian = (w: number[], data: DataPoint[], lambda: number): number[][] => {
  const [w0, w1, w2] = w;
  const H: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (const point of data) {
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
      H[i][j] /= data.length;
    }
  }

  H[0][0] += lambda;
  H[1][1] += lambda;

  return H;
};

const invertMatrix = (A: number[][]): number[][] | null => {
  const n = A.length;
  const augmented: number[][] = A.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }

    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  for (let i = n - 1; i >= 0; i--) {
    for (let k = i - 1; k >= 0; k--) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
    const divisor = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= divisor;
    }
  }

  return augmented.map(row => row.slice(n));
};

const computeEigenvalues = (A: number[][]): number[] => {
  const n = A.length;
  const eigenvalues: number[] = [];
  const AMat = A.map(row => [...row]);

  for (let eig = 0; eig < n; eig++) {
    let v = Array(n).fill(1);
    let lambda = 0;

    for (let iter = 0; iter < 50; iter++) {
      const Av = v.map((_, i) => AMat[i].reduce((sum, val, j) => sum + val * v[j], 0));
      lambda = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0));
      v = Av.map(val => val / lambda);
    }

    eigenvalues.push(lambda);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        AMat[i][j] -= lambda * v[i] * v[j];
      }
    }
  }

  return eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
};

export const runNewton = (
  data: DataPoint[],
  maxIter = 15,
  lambda = 0.0001,
  c1 = 0.0001
): NewtonIteration[] => {
  const iterations: NewtonIteration[] = [];
  let w = [0.1, 0.1, 0.0];

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);
    const hessian = computeHessian(w, data, lambda);
    const eigenvalues = computeEigenvalues(hessian);
    const conditionNumber = Math.abs(eigenvalues[0]) / Math.abs(eigenvalues[eigenvalues.length - 1]);

    const HInv = invertMatrix(hessian);
    let direction: number[];

    if (HInv === null) {
      direction = scale(grad, -1);
    } else {
      direction = HInv.map(row => -dot(row, grad));
    }

    // Line search
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const acceptedAlpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      hessian: hessian.map(row => [...row]),
      eigenvalues: [...eigenvalues],
      conditionNumber,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });

    w = wNew;

    if (gradNorm < 1e-5) break;
  }

  return iterations;
};
