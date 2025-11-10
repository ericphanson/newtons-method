import { ProblemDefinition } from '../types/experiments';
import { ProblemFunctions } from '../algorithms/types';
import { DataPoint } from '../shared-utils';
import { logisticObjective, logisticGradient, logisticHessian } from './logisticRegression';
import * as SH from './separatingHyperplane';
import { SeparatingHyperplaneVariant } from '../types/experiments';

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
 * Uses 2D weights [w0, w1] with bias as a separate parameter
 */
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number,
  bias: number
): ProblemFunctions {
  return {
    objective: (w: number[]) => logisticObjective(w, data, lambda, bias),
    gradient: (w: number[]) => logisticGradient(w, data, lambda, bias),
    hessian: (w: number[]) => logisticHessian(w, data, lambda, bias),
    dimensionality: 2, // Uses 2D weights [w0, w1] with bias as parameter
  };
}

/**
 * Adapter for separating hyperplane problems.
 * Converts variant-specific functions to ProblemFunctions format.
 * Uses 2D weights [w0, w1] with bias as a separate parameter
 */
export function separatingHyperplaneToProblemFunctions(
  data: DataPoint[],
  variant: SeparatingHyperplaneVariant,
  lambda: number,
  bias: number
): ProblemFunctions {
  let objective: (w: number[]) => number;
  let gradient: (w: number[]) => number[];
  let hessian: (w: number[]) => number[][];

  switch (variant) {
    case 'soft-margin':
      objective = (w) => SH.softMarginObjective(w, data, lambda, bias);
      gradient = (w) => SH.softMarginGradient(w, data, lambda, bias);
      hessian = () => SH.softMarginHessian();
      break;
    case 'perceptron':
      objective = (w) => SH.perceptronObjective(w, data, lambda, bias);
      gradient = (w) => SH.perceptronGradient(w, data, lambda, bias);
      hessian = () => SH.perceptronHessian(lambda);
      break;
    case 'squared-hinge':
      objective = (w) => SH.squaredHingeObjective(w, data, lambda, bias);
      gradient = (w) => SH.squaredHingeGradient(w, data, lambda, bias);
      hessian = (w) => SH.squaredHingeHessian(w, data, lambda, bias);
      break;
  }

  return { objective, gradient, hessian, dimensionality: 2 };
}
