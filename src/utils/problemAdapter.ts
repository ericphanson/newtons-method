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

/**
 * Adapter for separating hyperplane problems.
 * Converts variant-specific functions to ProblemFunctions format.
 */
export function separatingHyperplaneToProblemFunctions(
  data: DataPoint[],
  variant: SeparatingHyperplaneVariant,
  lambda: number
): ProblemFunctions {
  let objective: (w: number[]) => number;
  let gradient: (w: number[]) => number[];
  let hessian: (w: number[]) => number[][];

  switch (variant) {
    case 'soft-margin':
      objective = (w) => SH.softMarginObjective(w, data, lambda);
      gradient = (w) => SH.softMarginGradient(w, data, lambda);
      hessian = (_w) => SH.softMarginHessian();
      break;
    case 'perceptron':
      objective = (w) => SH.perceptronObjective(w, data, lambda);
      gradient = (w) => SH.perceptronGradient(w, data, lambda);
      hessian = (_w) => SH.perceptronHessian(lambda);
      break;
    case 'squared-hinge':
      objective = (w) => SH.squaredHingeObjective(w, data, lambda);
      gradient = (w) => SH.squaredHingeGradient(w, data, lambda);
      hessian = (w) => SH.squaredHingeHessian(w, data, lambda);
      break;
  }

  return { objective, gradient, hessian, dimensionality: 3 };
}
