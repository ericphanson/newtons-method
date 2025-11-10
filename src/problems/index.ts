import { createRotatedQuadratic } from './quadratic.tsx';
import { rosenbrockProblem, createRosenbrockProblem } from './rosenbrock.tsx';
import { saddleProblem } from './saddle.tsx';
import { himmelblauProblem } from './himmelblau.tsx';
import { threeHumpCamelProblem } from './threeHumpCamel.tsx';


export {
  createRotatedQuadratic,
  rosenbrockProblem,
  createRosenbrockProblem,
  saddleProblem,
  himmelblauProblem,
  threeHumpCamelProblem
};

// Export new registry V2 (parameter-aware)
export {
  problemRegistryV2,
  PROBLEM_ORDER,
  resolveProblem,
  getProblemParameters,
  getDefaultParameters,
  isProblemParametrized,
  requiresDataset,
  getProblemVariants,
  getDefaultVariant,
  getProblemKeyInsights,
  getProblemExplainerContent,
  shouldCenterOnGlobalMin
} from './registry';
