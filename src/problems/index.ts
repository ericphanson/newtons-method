import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, illConditionedQuadratic } from './quadratic';
import { rosenbrockProblem } from './rosenbrock';

export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

export { quadraticProblem, illConditionedQuadratic, rosenbrockProblem };
