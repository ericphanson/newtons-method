import { ProblemRegistryEntry, ProblemDefinition, ParameterMetadata } from '../types/experiments';
import { createRotatedQuadratic, createIllConditionedQuadratic } from './quadratic';
import { createRosenbrockProblem } from './rosenbrock';
import { saddleProblem } from './saddle';
import { himmelblauProblem } from './himmelblau';
import { threeHumpCamelProblem } from './threeHumpCamel';

/**
 * Parameter-aware problem registry
 * Maps problem type to registry entry with factory and metadata
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
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
  },

  // Non-parametrized problems
  'non-convex-saddle': {
    defaultInstance: saddleProblem,
    parameters: [],
    displayName: 'Saddle Point',
    category: 'non-convex',
  },

  'himmelblau': {
    defaultInstance: himmelblauProblem,
    parameters: [],
    displayName: "Himmelblau's Function",
    category: 'non-convex',
  },

  'three-hump-camel': {
    defaultInstance: threeHumpCamelProblem,
    parameters: [],
    displayName: 'Three-Hump Camel',
    category: 'non-convex',
  },
};

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
