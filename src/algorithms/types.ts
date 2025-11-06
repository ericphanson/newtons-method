// src/algorithms/types.ts

export interface ObjectiveFunction {
  /**
   * Compute objective value at point w
   * For logistic regression: this wraps the dataset
   * For pure optimization: this is just f(w)
   */
  (w: number[]): number;
}

export interface GradientFunction {
  /**
   * Compute gradient at point w
   */
  (w: number[]): number[];
}

export interface HessianFunction {
  /**
   * Compute Hessian matrix at point w
   */
  (w: number[]): number[][];
}

export interface ProblemFunctions {
  objective: ObjectiveFunction;
  gradient: GradientFunction;
  hessian?: HessianFunction; // Optional, only needed for Newton
  dimensionality: number; // 2 for pure optimization, 3 for logistic regression
}

export interface AlgorithmOptions {
  maxIter: number;
  initialPoint?: number[]; // If not provided, use default [0.1, 0.1] or [0.1, 0.1, 0.0]
  tolerance?: number; // Convergence tolerance for gradient norm (default varies by algorithm)
}
