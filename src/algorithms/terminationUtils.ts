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
  }
): string {
  switch (criterion) {
    case 'gradient':
      return `Converged: gradient norm ${values.gradNorm.toExponential(2)} < ${values.gtol.toExponential(2)}`;

    case 'ftol':
      return `Stalled: relative function change ${values.funcChange!.toExponential(2)} < ${values.ftol!.toExponential(2)}`;

    case 'xtol':
      return `Stalled: relative step size ${values.stepSize!.toExponential(2)} < ${values.xtol!.toExponential(2)}`;

    case 'maxiter':
      return `Not converged: maximum iterations (${values.maxIter}) reached (grad norm: ${values.gradNorm.toExponential(2)})`;

    case 'diverged':
      return `Diverged: NaN or Inf detected`;
  }
}
