import { ProblemRegistryEntry, ProblemDefinition, ParameterMetadata } from '../types/experiments';
import { quadraticProblem, createRotatedQuadratic } from './quadratic';
import { illConditionedQuadratic, createIllConditionedQuadratic } from './quadratic';
import { rosenbrockProblem, createRosenbrockProblem } from './rosenbrock';
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
 * Central resolution function that replaces scattered if-else chains
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
