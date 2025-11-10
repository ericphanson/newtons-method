import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, createRotatedQuadratic, illConditionedQuadratic, createIllConditionedQuadratic } from './quadratic.tsx';
import { rosenbrockProblem, createRosenbrockProblem } from './rosenbrock.tsx';
import { saddleProblem } from './saddle.tsx';
import { himmelblauProblem } from './himmelblau.tsx';
import { threeHumpCamelProblem } from './threeHumpCamel.tsx';

/**
 * Registry of all available optimization problems
 * Maps problem type string to problem definition
 */
export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
  'himmelblau': himmelblauProblem,
  'three-hump-camel': threeHumpCamelProblem,
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
  saddleProblem,
  himmelblauProblem,
  threeHumpCamelProblem
};

// Export new registry V2 (parameter-aware)
export {
  problemRegistryV2,
  resolveProblem,
  getProblemParameters,
  getDefaultParameters,
  isProblemParametrized,
  getProblemKeyInsights,
  getProblemExplainerContent
} from './registry';
