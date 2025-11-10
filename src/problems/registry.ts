import { ProblemRegistryEntry, ProblemDefinition, ParameterMetadata } from '../types/experiments';
import { createRotatedQuadratic, createIllConditionedQuadratic, quadraticExplainer, illConditionedExplainer } from './quadratic';
import { createRosenbrockProblem, rosenbrockExplainer } from './rosenbrock';
import { saddleProblem, saddleExplainer, saddleKeyInsights } from './saddle';
import { himmelblauProblem, himmelblauExplainer } from './himmelblau';
import { threeHumpCamelProblem, threeHumpCamelExplainer } from './threeHumpCamel';
import { createLogisticRegressionProblem, logisticRegressionExplainer } from './logisticRegression';
import { createSeparatingHyperplaneProblem, separatingHyperplaneExplainer } from './separatingHyperplane';
import { DataPoint } from '../shared-utils';

/**
 * Parameter-aware problem registry
 * Maps problem type to registry entry with factory and metadata
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  'logistic-regression': {
    datasetFactory: (params, dataset) => {
      const lambda = (params.lambda as number) ?? 0.0001;
      const bias = (params.bias as number) ?? 0;
      return createLogisticRegressionProblem(lambda, bias, dataset);
    },
    parameters: [
      {
        key: 'lambda',
        label: 'Regularization (λ)',
        type: 'range',
        min: 0,
        max: 5,
        step: 0.01,
        default: 0.0001,
        scale: 'linear',
        description: 'L2 regularization strength'
      },
      {
        key: 'bias',
        label: 'Bias (b)',
        type: 'range',
        min: -3,
        max: 3,
        step: 0.1,
        default: 0,
        scale: 'linear',
        description: 'Shifts decision boundary perpendicular to normal vector'
      }
    ],
    displayName: 'Logistic Regression',
    category: 'classification',
    requiresDataset: true,
    explainerContent: logisticRegressionExplainer,
  },

  'separating-hyperplane': {
    datasetFactory: (params, dataset) => {
      const variant = (params.variant as 'soft-margin' | 'perceptron' | 'squared-hinge') ?? 'soft-margin';
      const lambda = (params.lambda as number) ?? 0.0001;
      const bias = (params.bias as number) ?? 0;
      return createSeparatingHyperplaneProblem(variant, lambda, bias, dataset);
    },
    parameters: [
      {
        key: 'variant',
        label: 'SVM Variant',
        type: 'select',
        options: [
          { value: 'soft-margin', label: 'Soft Margin SVM' },
          { value: 'perceptron', label: 'Perceptron' },
          { value: 'squared-hinge', label: 'Squared Hinge' }
        ],
        default: 'soft-margin',
        description: 'Loss function variant'
      },
      {
        key: 'lambda',
        label: 'Regularization (λ)',
        type: 'range',
        min: 0,
        max: 5,
        step: 0.01,
        default: 0.0001,
        scale: 'linear',
        description: 'L2 regularization strength'
      },
      {
        key: 'bias',
        label: 'Bias (b)',
        type: 'range',
        min: -3,
        max: 3,
        step: 0.1,
        default: 0,
        scale: 'linear',
        description: 'Shifts decision boundary perpendicular to normal vector'
      }
    ],
    displayName: 'Separating Hyperplane',
    category: 'classification',
    requiresDataset: true,
    variants: [
      { id: 'soft-margin', displayName: 'Soft Margin SVM', description: 'L1 hinge loss' },
      { id: 'perceptron', displayName: 'Perceptron', description: 'Max-margin with ReLU' },
      { id: 'squared-hinge', displayName: 'Squared Hinge', description: 'L2 hinge loss' }
    ],
    defaultVariant: 'soft-margin',
    explainerContent: separatingHyperplaneExplainer,
  },

  'quadratic': {
    factory: (params) => createRotatedQuadratic(
      (params.rotationAngle as number) || 0,
      (params.kappa as number) || 5
    ),
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
      },
      {
        key: 'kappa',
        label: 'Condition Number',
        type: 'range',
        min: 1,
        max: 100,
        step: 1,
        default: 5,
        unit: '',
        scale: 'linear',
        description: 'Controls ellipse elongation (1 = circle, higher = more elongated)'
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
 * @example
 * // Dataset-based problem (logistic regression)
 * const testData = [{ x1: 1, x2: 1, y: 1 }];
 * const problem = resolveProblem('logistic-regression', { lambda: 1.0, bias: 0 }, testData);
 *
 * @param problemType - Problem type identifier (e.g., 'quadratic', 'rosenbrock', 'logistic-regression')
 * @param parameters - Parameter values as key-value pairs (defaults to empty object)
 * @param dataset - Optional dataset for dataset-based problems (e.g., logistic regression, separating hyperplane)
 * @returns Resolved problem definition with parameter values applied
 * @throws Error if problem not found in registry, if registry entry is incomplete, or if dataset required but not provided
 */
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {},
  dataset?: DataPoint[]
): ProblemDefinition {
  const entry = problemRegistryV2[problemType];

  if (!entry) {
    throw new Error(`Problem not found in registry: ${problemType}`);
  }

  // Dataset-based problems
  if (entry.requiresDataset) {
    if (!dataset || dataset.length === 0) {
      throw new Error(`Problem '${problemType}' requires a dataset`);
    }
    if (!entry.datasetFactory) {
      throw new Error(`Problem '${problemType}' missing datasetFactory`);
    }
    return entry.datasetFactory(parameters, dataset);
  }

  // Regular parametrized problems
  if (entry.factory) {
    return entry.factory(parameters);
  }

  // Static problems
  if (entry.defaultInstance) {
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

/**
 * Check if a problem requires a dataset
 */
export function requiresDataset(problemType: string): boolean {
  const entry = problemRegistryV2[problemType];
  return !!entry?.requiresDataset;
}

/**
 * Get problem variants (if any)
 */
export function getProblemVariants(problemType: string): Array<{ id: string; displayName: string; description?: string }> {
  const entry = problemRegistryV2[problemType];
  return entry?.variants || [];
}

/**
 * Get default variant for a problem
 */
export function getDefaultVariant(problemType: string): string | undefined {
  const entry = problemRegistryV2[problemType];
  return entry?.defaultVariant;
}
