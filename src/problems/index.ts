import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, createRotatedQuadratic, illConditionedQuadratic, createIllConditionedQuadratic } from './quadratic';
import { rosenbrockProblem, createRosenbrockProblem } from './rosenbrock';
import { saddleProblem } from './saddle';

/**
 * Registry of all available optimization problems
 * Maps problem type string to problem definition
 */
export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
};

/**
 * Get problem definition by type
 * @param type Problem type identifier
 * @returns Problem definition or undefined if not found
 */
export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

export {
  quadraticProblem,
  createRotatedQuadratic,
  illConditionedQuadratic,
  createIllConditionedQuadratic,
  rosenbrockProblem,
  createRosenbrockProblem,
  saddleProblem
};
