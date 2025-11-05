import { ProblemDefinition } from '../types/experiments';
import { ProblemFunctions } from '../algorithms/types';
import { DataPoint } from '../shared-utils';
import { logisticObjective, logisticGradient, logisticHessian } from './logisticRegression';

/**
 * Convert a ProblemDefinition from the problem registry into ProblemFunctions format
 */
export function problemToProblemFunctions(problem: ProblemDefinition): ProblemFunctions {
  return {
    objective: problem.objective,
    gradient: problem.gradient,
    hessian: problem.hessian,
    dimensionality: 2, // All registry problems are 2D
  };
}

/**
 * Convert logistic regression with dataset into ProblemFunctions format
 */
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number
): ProblemFunctions {
  return {
    objective: (w: number[]) => logisticObjective(w, data, lambda),
    gradient: (w: number[]) => logisticGradient(w, data, lambda),
    hessian: (w: number[]) => logisticHessian(w, data, lambda),
    dimensionality: 3, // Logistic regression uses [w0, w1, w2] with bias
  };
}
