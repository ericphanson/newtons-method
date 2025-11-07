// Shared types and utilities for optimization visualizers

export interface DataPoint {
  x1: number;
  x2: number;
  y: number;
}

export interface LineSearchTrial {
  trial: number;
  alpha: number;
  loss: number;
  armijoRHS: number;
  satisfied: boolean;
}

/**
 * Sigmoid activation function with numerical stability
 * @param z Input value
 * @returns Sigmoid output in range (0, 1)
 */
export const sigmoid = (z: number): number => {
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
};

/**
 * Clip value to specified range
 * @param val Value to clip
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clipped value
 */
export const clip = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

/**
 * Generate properly interleaved crescent dataset for binary classification
 * Creates two interleaved crescent-shaped clusters with labels 0 and 1
 * @returns Array of data points with x1, x2 coordinates and y labels
 */
export const generateCrescents = (): DataPoint[] => {
  const points: DataPoint[] = [];
  const n = 70;
  const noise = 0.25;
  const seed = 42;

  let rng = seed;
  const random = () => {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return rng / 4294967296;
  };

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angle = Math.PI * 0.65 * t + Math.PI * 0.25;
    const radius = 2.2;
    const x1 = radius * Math.cos(angle) + (random() - 0.5) * noise;
    const x2 = radius * Math.sin(angle) + 0.5 + (random() - 0.5) * noise;
    points.push({ x1, x2, y: 0 });
  }

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angle = -Math.PI * 0.65 * t + Math.PI * 0.75;
    const radius = 2.2;
    const x1 = radius * Math.cos(angle) + (random() - 0.5) * noise;
    const x2 = radius * Math.sin(angle) - 0.5 + (random() - 0.5) * noise;
    points.push({ x1, x2, y: 1 });
  }

  return points;
};

/**
 * Compute logistic regression loss and gradient
 * @param w Weight vector [w0, w1, w2]
 * @param data Training data points
 * @param lambda L2 regularization parameter
 * @returns Object containing loss value and gradient vector
 */
export const computeLossAndGradient = (
  w: number[],
  data: DataPoint[],
  lambda: number
): { loss: number; grad: number[] } => {
  const [w0, w1, w2] = w;
  let loss = 0;
  const grad = [0, 0, 0];

  for (const point of data) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);

    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));

    const error = pred - point.y;
    grad[0] += error * point.x1;
    grad[1] += error * point.x2;
    grad[2] += error;
  }

  loss = loss / data.length + (lambda / 2) * (w0 * w0 + w1 * w1);
  grad[0] = grad[0] / data.length + lambda * w0;
  grad[1] = grad[1] / data.length + lambda * w1;
  grad[2] = grad[2] / data.length;

  return { loss, grad };
};

/**
 * Dot product of two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Dot product sum
 */
export const dot = (a: number[], b: number[]): number =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

/**
 * Euclidean norm (L2 norm) of a vector
 * @param v Input vector
 * @returns L2 norm
 */
export const norm = (v: number[]): number =>
  Math.sqrt(dot(v, v));

/**
 * Scale vector by scalar
 * @param v Input vector
 * @param s Scalar multiplier
 * @returns Scaled vector
 */
export const scale = (v: number[], s: number): number[] =>
  v.map(x => x * s);

/**
 * Add two vectors element-wise
 * @param a First vector
 * @param b Second vector
 * @returns Sum vector
 */
export const add = (a: number[], b: number[]): number[] =>
  a.map((x, i) => x + b[i]);

/**
 * Subtract two vectors element-wise
 * @param a First vector
 * @param b Second vector
 * @returns Difference vector (a - b)
 */
export const sub = (a: number[], b: number[]): number[] =>
  a.map((x, i) => x - b[i]);

/**
 * Set up canvas with proper DPI scaling
 * @param canvas HTML canvas element
 * @returns Object containing context and dimensions
 */
export const setupCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
};

/**
 * Format number to 6 decimal places
 * @param val Number to format
 * @returns Formatted string
 */
export const fmt = (val: number): string => val.toFixed(6);

/**
 * Format vector to string with 3 decimal places per element
 * @param vec Vector to format
 * @returns Formatted string like "[1.000, 2.000]"
 */
export const fmtVec = (vec: number[]): string =>
  `[${vec.map(v => v.toFixed(3)).join(', ')}]`;
