import { ProblemRegistryEntry, ProblemDefinition, ParameterMetadata } from '../types/experiments';
import { createRotatedQuadratic, createIllConditionedQuadratic, quadraticExplainer, illConditionedExplainer } from './quadratic';
import { createRosenbrockProblem, rosenbrockExplainer } from './rosenbrock';
import { saddleProblem, saddleExplainer, saddleKeyInsights } from './saddle';
import { himmelblauProblem, himmelblauExplainer } from './himmelblau';
import { threeHumpCamelProblem, threeHumpCamelExplainer } from './threeHumpCamel';
import { logisticRegressionExplainer } from './logisticRegression';
import { separatingHyperplaneExplainer } from './separatingHyperplane';

/**
 * Parameter-aware problem registry
 * Maps problem type to registry entry with factory and metadata
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  'logistic-regression': {
    // No factory or defaultInstance (special handling elsewhere)
    parameters: [],
    displayName: 'Logistic Regression',
    category: 'classification',
    explainerContent: logisticRegressionExplainer,
  },

  'separating-hyperplane': {
    // No factory or defaultInstance (special handling elsewhere)
    parameters: [],
    displayName: 'Separating Hyperplane',
    category: 'classification',
    explainerContent: separatingHyperplaneExplainer,
  },

  'quadratic': {
    factory: (params) => createRotatedQuadratic((params.rotationAngle as number) || 0),
    parameters: [
      {
        key: 'rotationAngle',
        label: 'Rotation Angle',
        type: 'range',
        min: 0,
        max: 90,
        step: 5,
        default: 0,
        unit: '°',
        scale: 'linear',
        description: 'Rotation of the ellipse axes (0° = aligned, 45° = maximum misalignment)'
      }
    ],
    displayName: 'Rotated Quadratic',
    category: 'convex',
    explainerContent: quadraticExplainer,
  },

  'ill-conditioned-quadratic': {
    factory: (params) => createIllConditionedQuadratic((params.conditionNumber as number) || 100),
    parameters: [
      {
        key: 'conditionNumber',
        label: 'Condition Number',
        type: 'range',
        min: 1,
        max: 500,
        step: 1,
        default: 100,
        unit: '',
        scale: 'linear',
        description: 'Higher κ creates more elongated ellipses (1 = circle, 500 = extreme elongation)'
      }
    ],
    displayName: 'Ill-Conditioned Quadratic',
    category: 'convex',
    explainerContent: illConditionedExplainer,
  },

  'rosenbrock': {
    factory: (params) => createRosenbrockProblem((params.rosenbrockB as number) || 100),
    parameters: [
      {
        key: 'rosenbrockB',
        label: 'Valley Steepness',
        type: 'range',
        min: 1,
        max: 3,
        step: 0.1,
        default: 100,
        unit: '',
        scale: 'log10',
        description: 'Controls valley steepness (10 = gentle, 1000 = extreme)'
      }
    ],
    displayName: 'Rosenbrock Function',
    category: 'non-convex',
    explainerContent: rosenbrockExplainer,
  },

  // Non-parametrized problems
  'non-convex-saddle': {
    defaultInstance: saddleProblem,
    parameters: [],
    displayName: 'Saddle Point',
    category: 'non-convex',
    keyInsights: saddleKeyInsights,
    explainerContent: saddleExplainer,
  },

  'himmelblau': {
    defaultInstance: himmelblauProblem,
    parameters: [],
    displayName: "Himmelblau's Function",
    category: 'non-convex',
    explainerContent: himmelblauExplainer,
  },

  'three-hump-camel': {
    defaultInstance: threeHumpCamelProblem,
    parameters: [],
    displayName: 'Three-Hump Camel',
    category: 'non-convex',
    explainerContent: threeHumpCamelExplainer,
  },
};

/**
 * Canonical ordering of problems for UI display
 * Single source of truth for problem ordering in ProblemExplainer and other components
 */
export const PROBLEM_ORDER = [
  'logistic-regression',
  'separating-hyperplane',
  'quadratic',
  'ill-conditioned-quadratic',
  'rosenbrock',
  'non-convex-saddle',
  'himmelblau',
  'three-hump-camel',
] as const;

/**
 * Resolve a problem with given parameters
 *
 * This is the central function for problem resolution. It replaces
 * all scattered if-else chains that previously handled parametrized problems.
 *
 * @example
 * // Rotated quadratic at 45°
 * const problem = resolveProblem('quadratic', { rotationAngle: 45 });
 *
 * @example
 * // Ill-conditioned with κ=250
 * const problem = resolveProblem('ill-conditioned-quadratic', { conditionNumber: 250 });
 *
 * @example
 * // Rosenbrock with custom steepness
 * const problem = resolveProblem('rosenbrock', { rosenbrockB: 500 });
 *
 * @example
 * // Non-parametrized problem (parameters can be omitted or empty)
 * const problem = resolveProblem('himmelblau');
 * const problem2 = resolveProblem('non-convex-saddle', {});
 *
 * @param problemType - Problem type identifier (e.g., 'quadratic', 'rosenbrock')
 * @param parameters - Parameter values as key-value pairs (defaults to empty object)
 * @returns Resolved problem definition with parameter values applied
 * @throws Error if problem not found in registry or if registry entry is incomplete
 */
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {}
): ProblemDefinition {
  const entry = problemRegistryV2[problemType];

  if (!entry) {
    throw new Error(`Problem not found in registry: ${problemType}`);
  }

  // Use factory if available, otherwise return static instance
  if (entry.factory) {
    return entry.factory(parameters);
  } else if (entry.defaultInstance) {
    return entry.defaultInstance;
  }

  throw new Error(`Problem registry entry incomplete for: ${problemType}`);
}

/**
 * Get parameter metadata for a problem
 */
export function getProblemParameters(problemType: string): ParameterMetadata[] {
  return problemRegistryV2[problemType]?.parameters || [];
}

/**
 * Get default parameter values for a problem
 */
export function getDefaultParameters(problemType: string): Record<string, number | string> {
  const params = getProblemParameters(problemType);
  const defaults: Record<string, number | string> = {};

  for (const param of params) {
    defaults[param.key] = param.default;
  }

  return defaults;
}

/**
 * Check if a problem has parameters
 */
export function isProblemParametrized(problemType: string): boolean {
  const entry = problemRegistryV2[problemType];
  return !!entry && entry.parameters.length > 0;
}

/**
 * Get key insights for a problem (if any)
 */
export function getProblemKeyInsights(problemType: string): React.ReactNode | undefined {
  return problemRegistryV2[problemType]?.keyInsights;
}

/**
 * Get explainer content for a problem (if any)
 */
export function getProblemExplainerContent(problemType: string): ProblemRegistryEntry['explainerContent'] | undefined {
  return problemRegistryV2[problemType]?.explainerContent;
}
