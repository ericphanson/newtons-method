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

export type ConvergenceCriterion =
  | 'gradient'      // ||grad|| < gtol (optimal convergence)
  | 'ftol'          // |f(x_k) - f(x_{k-1})| < ftol (stalled on function value)
  | 'xtol'          // ||x_k - x_{k-1}|| < xtol (stalled on step size)
  | 'maxiter'       // Hit maximum iterations (not converged)
  | 'diverged';     // NaN/Inf detected (failure)

export interface TerminationThresholds {
  gtol?: number;      // Gradient norm tolerance (default: 1e-5)
  ftol?: number;      // Function value change tolerance (default: 1e-9)
  xtol?: number;      // Step size tolerance (default: 1e-9)
}

export interface AlgorithmOptions {
  maxIter: number;
  initialPoint?: number[]; // If not provided, use default [0.1, 0.1] or [0.1, 0.1, 0.0]
  tolerance?: number; // DEPRECATED: Use termination.gtol instead. Kept for backward compatibility.
  termination?: TerminationThresholds; // Enhanced termination criteria
}

export interface AlgorithmSummary {
  converged: boolean;              // True if gradient/ftol/xtol triggered
  diverged: boolean;               // True if NaN/Inf detected
  stalled: boolean;                // True if ftol or xtol triggered (suboptimal convergence)
  finalLocation: number[];         // Where it ended up [w0, w1, ...]
  finalLoss: number;
  finalGradNorm: number;
  finalStepSize?: number;          // ||x_k - x_{k-1}|| at termination
  finalFunctionChange?: number;    // |f(x_k) - f(x_{k-1})| at termination
  iterationCount: number;
  convergenceCriterion: ConvergenceCriterion;
  terminationMessage: string;      // Human-readable explanation
}

export interface AlgorithmResult<T> {
  iterations: T[];                 // Full iteration history
  summary: AlgorithmSummary;
}
