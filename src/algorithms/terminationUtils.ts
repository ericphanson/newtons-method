// src/algorithms/terminationUtils.ts

import { ConvergenceCriterion } from './types';

/**
 * Generate human-readable termination message
 */
export function getTerminationMessage(
  criterion: ConvergenceCriterion,
  values: {
    gradNorm: number;
    gtol: number;
    stepSize?: number;
    xtol?: number;
    funcChange?: number;
    ftol?: number;
    iters: number;
    maxIter: number;
    eigenvalues?: number[];
    isSecondOrder?: boolean;  // True for Newton/L-BFGS, false/undefined for GD
  }
): string {
  switch (criterion) {
    case 'gradient': {
      // Check for saddle point (negative eigenvalue at stationary point)
      if (values.eigenvalues && values.eigenvalues.length > 0) {
        const minEigenvalue = values.eigenvalues[values.eigenvalues.length - 1];
        if (minEigenvalue < 0) {
          return `⚠️ SADDLE POINT DETECTED: Converged to stationary point with negative eigenvalue (${minEigenvalue.toExponential(2)}). This is NOT a local minimum! Gradient norm ${values.gradNorm.toExponential(2)} < ${values.gtol.toExponential(2)}`;
        }
      }

      // Second-order convergence requires:
      // 1. Algorithm uses second-order information (isSecondOrder=true)
      // 2. Eigenvalues are available to verify positive-definiteness
      // 3. All eigenvalues are positive (confirming it's a local minimum)
      const hasPositiveEigenvalues = values.eigenvalues && values.eigenvalues.length > 0 &&
                                      values.eigenvalues.every(lambda => lambda > 0);
      const convergenceType = (values.isSecondOrder && hasPositiveEigenvalues)
        ? 'Second-order'
        : 'First-order';
      return `${convergenceType} convergence: gradient norm ${values.gradNorm.toExponential(2)} < ${values.gtol.toExponential(2)}`;
    }

    case 'ftol':
      return `Converged: relative function change ${values.funcChange!.toExponential(2)} < ${values.ftol!.toExponential(2)}`;

    case 'xtol':
      return `Converged: relative step size ${values.stepSize!.toExponential(2)} < ${values.xtol!.toExponential(2)}`;

    case 'maxiter':
      return `Not converged: maximum iterations (${values.maxIter}) reached (grad norm: ${values.gradNorm.toExponential(2)})`;

    case 'diverged':
      return `Diverged: NaN or Inf detected`;
  }
}
