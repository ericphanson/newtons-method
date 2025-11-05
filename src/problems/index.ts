import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, illConditionedQuadratic } from './quadratic';
import { rosenbrockProblem } from './rosenbrock';
import { saddleProblem } from './saddle';

export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

export {
  quadraticProblem,
  illConditionedQuadratic,
  rosenbrockProblem,
  saddleProblem
};
