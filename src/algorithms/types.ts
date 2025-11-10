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
  dimensionality: number; // Always 2 for all problems (bias is a separate parameter for dataset problems)
}

export type ConvergenceCriterion =
  | 'gradient'      // ||grad|| < gtol (first-order stationary point - may be saddle point!)
  | 'ftol'          // Relative function change < ftol (converged, scipy-style)
  | 'xtol'          // Relative step size < xtol (converged, scipy-style)
  | 'maxiter'       // Hit maximum iterations (not converged)
  | 'diverged';     // NaN/Inf detected (failure)

export interface TerminationThresholds {
  gtol?: number;      // Gradient norm tolerance (absolute)
  ftol?: number;      // Relative function change tolerance
  xtol?: number;      // Relative step size tolerance
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
  finalStepSize?: number;          // Relative step size: ||x_k - x_{k-1}|| / max(||x_k||, 1)
  finalFunctionChange?: number;    // Relative function change: |f(x_k) - f(x_{k-1})| / max(|f(x_k)|, 1e-8)
  iterationCount: number;
  convergenceCriterion: ConvergenceCriterion;
  terminationMessage: string;      // Human-readable explanation
}

export interface AlgorithmResult<T> {
  iterations: T[];                 // Full iteration history
  summary: AlgorithmSummary;
}
