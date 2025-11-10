# Dataset Problems Registry Migration

**Date:** 2025-11-10
**Status:** READY FOR IMPLEMENTATION
**Prerequisites:** ✅ 3D-to-2D conversion complete
**Effort:** 1-2 days

---

## Overview

This plan integrates logistic regression and separating hyperplane into the unified problem registry system. These problems are **parametrized problems** where one parameter happens to be a dataset (interactive data) instead of a scalar (slider).

### Philosophy

After 3D-to-2D conversion, LR and SH are conceptually identical to other parametrized problems:

| Problem | Parameters | UI Controls |
|---------|-----------|-------------|
| **Rosenbrock** | `b` (valley steepness) | Slider |
| **Rotated Quadratic** | `rotationAngle` | Slider |
| **Logistic Regression** | `dataset`, `lambda`, `bias` | Data canvas, sliders |
| **Separating Hyperplane** | `dataset`, `variant`, `lambda`, `bias` | Data canvas, dropdown, sliders |

**Key insight:** Dataset is just another parameter that happens to be edited via data canvas instead of a slider. Algorithmically and architecturally, it's treated the same way.

### What Gets Unified

✅ Problem resolution via `resolveProblem()`
✅ Factory pattern via `datasetFactory`
✅ Parameter metadata in registry
✅ Formula rendering from registry
✅ Variant selection (generic system)

### What Remains Special

#### UI Only (Justified)
✅ Data canvas component (interactive point editing)
✅ Decision boundary rendering (geometric visualization)

These are **UI concerns**, not algorithmic or structural special cases.

#### Non-UI Special Cases (Being Addressed)
⚠️ Global minimum calculation (only for dataset problems) - marked as QUESTIONABLE in code
⚠️ Separate state management (lambda, bias, variant) - not yet unified into problemParameters

#### Previously Special, Now Unified
✅ Bounds centering logic - now controlled via registry metadata (`visualization.centerOnGlobalMin`)
✅ Problem type detection - now uses `requiresDataset()` from registry (deleted `isDatasetProblem()`)
✅ String literal comparisons - replaced with registry queries

#### Follow-up Work
See `docs/logs/2025-11-10-registry-migration-followup-plan.md` for cleanup tasks.

---

## Current State (Verified)

**3D-to-2D conversion complete:**
- Weights are 2D: `[w0, w1]`
- Bias is a parameter (not trained)
- All problems have `dimensionality: 2`
- Helper functions return `[number, number]`

**Already exists:**
- `problemRegistryV2` entries with metadata
- `logisticObjective()`, `logisticGradient()`, `logisticHessian()` - accept bias parameter
- `softMarginObjective()`, `perceptronObjective()`, `squaredHingeObjective()` etc. - accept bias parameter
- Explainer content for both problems

**What's missing:**
- Factory functions in registry
- `datasetFactory` support in registry
- Parameter arrays (lambda, bias, variant)
- Dataset parameter in `resolveProblem()`

---

## Implementation

### Phase 1: Type System

**File:** `src/types/experiments.ts`

Add to `ProblemRegistryEntry` interface:

```typescript
export interface ProblemRegistryEntry {
  // Existing fields...
  factory?: (parameters: Record<string, number | string>) => ProblemDefinition;
  defaultInstance?: ProblemDefinition;
  parameters: ParameterMetadata[];
  displayName: string;
  category?: 'convex' | 'non-convex' | 'classification';
  keyInsights?: React.ReactNode;
  explainerContent?: React.ReactNode;

  // NEW: Dataset support
  requiresDataset?: boolean;
  datasetFactory?: (
    parameters: Record<string, number | string>,
    dataset: DataPoint[]
  ) => ProblemDefinition;

  // NEW: Variant support
  variants?: Array<{
    id: string;
    displayName: string;
    description?: string;
  }>;
  defaultVariant?: string;
}
```

**Verification:** `npm run build` (type-check happens during build)

---

### Phase 2: Factory Functions

**File:** `src/problems/logisticRegression.tsx`

Add factory function:

```typescript
import { ProblemDefinition } from '../types/experiments';
import { DataPoint } from '../shared-utils';
import { logisticObjective, logisticGradient, logisticHessian } from '../utils/logisticRegression';
import { BlockMath } from '../components/Math';

/**
 * Factory function for logistic regression problem
 * Dataset is passed as a parameter (just like lambda or bias)
 */
export function createLogisticRegressionProblem(
  lambda: number,
  bias: number,
  dataset: DataPoint[]
): ProblemDefinition {
  return {
    name: 'Logistic Regression',
    objectiveFormula: (
      <BlockMath>
        {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w_0 x_{i1} + w_1 x_{i2} + b)}) + \frac{\lambda}{2}(w_0^2 + w_1^2)`}
      </BlockMath>
    ),
    description: 'Binary classification with L2 regularization',
    objective: (w: number[]) => logisticObjective(w, dataset, lambda, bias),
    gradient: (w: number[]) => logisticGradient(w, dataset, lambda, bias),
    hessian: (w: number[]) => logisticHessian(w, dataset, lambda, bias),
    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },
  };
}
```

**File:** `src/problems/separatingHyperplane.tsx`

Add factory function:

```typescript
import { ProblemDefinition, SeparatingHyperplaneVariant } from '../types/experiments';
import { DataPoint } from '../shared-utils';
import * as SH from '../utils/separatingHyperplane';
import { BlockMath } from '../components/Math';

function getVariantFormula(variant: SeparatingHyperplaneVariant): React.ReactNode {
  switch (variant) {
    case 'soft-margin':
      return <BlockMath>{String.raw`f(w) = \frac{1}{2}(w_0^2 + w_1^2) + \lambda \sum_i \max(0, 1 - y_i(w_0 x_{i1} + w_1 x_{i2} + b))`}</BlockMath>;
    case 'perceptron':
      return <BlockMath>{String.raw`f(w) = \sum_i \max(0, -y_i(w_0 x_{i1} + w_1 x_{i2} + b)) + \frac{\lambda}{2}(w_0^2 + w_1^2)`}</BlockMath>;
    case 'squared-hinge':
      return <BlockMath>{String.raw`f(w) = \frac{1}{2}(w_0^2 + w_1^2) + \lambda \sum_i [\max(0, 1 - y_i(w_0 x_{i1} + w_1 x_{i2} + b))]^2`}</BlockMath>;
  }
}

export function createSeparatingHyperplaneProblem(
  variant: SeparatingHyperplaneVariant,
  lambda: number,
  bias: number,
  dataset: DataPoint[]
): ProblemDefinition {
  let objective: (w: number[]) => number;
  let gradient: (w: number[]) => number[];
  let hessian: (w: number[]) => number[][];

  switch (variant) {
    case 'soft-margin':
      objective = (w) => SH.softMarginObjective(w, dataset, lambda, bias);
      gradient = (w) => SH.softMarginGradient(w, dataset, lambda, bias);
      hessian = () => SH.softMarginHessian();
      break;
    case 'perceptron':
      objective = (w) => SH.perceptronObjective(w, dataset, lambda, bias);
      gradient = (w) => SH.perceptronGradient(w, dataset, lambda, bias);
      hessian = () => SH.perceptronHessian(lambda);
      break;
    case 'squared-hinge':
      objective = (w) => SH.squaredHingeObjective(w, dataset, lambda, bias);
      gradient = (w) => SH.squaredHingeGradient(w, dataset, lambda, bias);
      hessian = (w) => SH.squaredHingeHessian(w, dataset, lambda, bias);
      break;
  }

  return {
    name: `Separating Hyperplane (${variant})`,
    objectiveFormula: getVariantFormula(variant),
    description: `Find optimal separating hyperplane using ${variant} loss`,
    objective,
    gradient,
    hessian,
    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },
  };
}
```

**Verification:** Factory functions compile and export correctly.

---

### Phase 3: Registry Integration

**File:** `src/problems/registry.ts`

Add imports:

```typescript
import { createLogisticRegressionProblem } from './logisticRegression';
import { createSeparatingHyperplaneProblem } from './separatingHyperplane';
import { DataPoint } from '../shared-utils';
```

Update registry entries:

```typescript
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  'logistic-regression': {
    datasetFactory: (params, dataset) => {
      const lambda = (params.lambda as number) ?? 1.0;
      const bias = (params.bias as number) ?? 0;
      return createLogisticRegressionProblem(lambda, bias, dataset);
    },
    parameters: [
      {
        key: 'lambda',
        label: 'Regularization (λ)',
        type: 'range',
        min: 0,
        max: 10,
        step: 0.1,
        default: 1.0,
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
      const variant = (params.variant as SeparatingHyperplaneVariant) ?? 'soft-margin';
      const lambda = (params.lambda as number) ?? 1.0;
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
        max: 10,
        step: 0.1,
        default: 1.0,
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

  // ... other problems remain the same
};
```

**Verification:** TypeScript compiles, registry entries are valid.

---

### Phase 4: Resolution Function

**File:** `src/problems/registry.ts`

Update `resolveProblem()` signature and implementation:

```typescript
/**
 * Resolve a problem with given parameters
 * Dataset is passed as optional third parameter for dataset-based problems
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
```

Add helper functions:

```typescript
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
```

Export new functions in `src/problems/index.ts`:

```typescript
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
  getProblemExplainerContent
} from './registry';
```

**Verification:** Console test:

```typescript
const testData = [{ x1: 1, x2: 1, y: 1 }];
const problem = resolveProblem('logistic-regression', { lambda: 1.0, bias: 0 }, testData);
console.assert(problem.name === 'Logistic Regression');
```

---

### Phase 5: UnifiedVisualizer Integration

**File:** `src/UnifiedVisualizer.tsx`

**Step 5.1:** Update imports

```typescript
import { problemRegistryV2, resolveProblem, requiresDataset } from './problems/registry';
```

Remove unused imports:

```typescript
// DELETE:
import { logisticObjective, logisticGradient, logisticHessian } from './utils/logisticRegression';
import { separatingHyperplaneToProblemFunctions } from './utils/problemAdapter';
```

**Step 5.2:** Simplify `getCurrentProblem()`

Replace special-case logic with unified resolution:

```typescript
const getCurrentProblem = useCallback(() => {
  const entry = problemRegistryV2[currentProblem];

  // Unified resolution for all problems
  const problem = resolveProblem(
    currentProblem,
    problemParameters,
    entry?.requiresDataset ? data : undefined
  );

  return {
    ...problem,
    requiresDataset: entry?.requiresDataset || false,
  };
}, [currentProblem, data, problemParameters]);
```

**Step 5.3:** Simplify `getCurrentProblemFunctions()`

```typescript
const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
  const entry = problemRegistryV2[currentProblem];

  const problem = resolveProblem(
    currentProblem,
    problemParameters,
    entry?.requiresDataset ? data : undefined
  );

  return {
    objective: problem.objective,
    gradient: problem.gradient,
    hessian: problem.hessian,
    dimensionality: 2, // All problems are 2D
  };
}, [currentProblem, data, problemParameters]);
```

**Step 5.4:** Sync parameters to `problemParameters` state

Add useEffect hooks to sync lambda, bias, and variant:

```typescript
// Sync lambda and bias for dataset problems
useEffect(() => {
  if (requiresDataset(currentProblem)) {
    setProblemParameters(prev => ({
      ...prev,
      lambda,
      bias,
    }));
  }
}, [currentProblem, lambda, bias]);

// Sync variant for separating hyperplane
useEffect(() => {
  if (currentProblem === 'separating-hyperplane') {
    setProblemParameters(prev => ({
      ...prev,
      variant: separatingHyperplaneVariant
    }));
  }
}, [currentProblem, separatingHyperplaneVariant]);
```

**Verification:** Run app, test all problems load and algorithms converge.

---

### Phase 6: ProblemConfiguration UI

**File:** `src/components/ProblemConfiguration.tsx`

**Step 6.1:** Remove hardcoded formulas

Find and replace hardcoded formula JSX with:

```typescript
{/* Show formula from registry */}
{problem?.objectiveFormula && (
  <div>
    <p className="text-base font-semibold mb-2">Objective:</p>
    {problem.objectiveFormula}
  </div>
)}
```

**Step 6.2:** Use registry metadata for parameters

For variant dropdown:

```typescript
{(() => {
  const entry = problemRegistryV2[currentProblem];
  if (entry?.variants && entry.variants.length > 0) {
    return (
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Variant:</label>
        <select
          value={separatingHyperplaneVariant}
          onChange={(e) => onSeparatingHyperplaneVariantChange(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          {entry.variants.map(v => (
            <option key={v.id} value={v.id}>{v.displayName}</option>
          ))}
        </select>
      </div>
    );
  }
  return null;
})()}
```

For lambda slider:

```typescript
{(() => {
  const entry = problemRegistryV2[currentProblem];
  const lambdaParam = entry?.parameters.find(p => p.key === 'lambda');
  if (lambdaParam && lambdaParam.type === 'range') {
    return (
      <div>
        <h4 className="font-medium text-gray-700 mb-2">
          Regularization (<InlineMath>\lambda</InlineMath>)
        </h4>
        <input
          type="range"
          min={lambdaParam.min}
          max={lambdaParam.max}
          step={lambdaParam.step}
          value={lambda}
          onChange={(e) => onLambdaChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{lambdaParam.min}</span>
          <span className="font-semibold">{lambda.toFixed(1)}</span>
          <span>{lambdaParam.max}</span>
        </div>
        {lambdaParam.description && (
          <p className="text-xs text-gray-500 mt-1">{lambdaParam.description}</p>
        )}
      </div>
    );
  }
  return null;
})()}
```

For bias slider (similar pattern):

```typescript
{(() => {
  const entry = problemRegistryV2[currentProblem];
  const biasParam = entry?.parameters.find(p => p.key === 'bias');
  if (biasParam && biasParam.type === 'range') {
    return (
      <div>
        <h4 className="font-medium text-gray-700 mb-2">
          Bias (<InlineMath>b</InlineMath>)
        </h4>
        <input
          type="range"
          min={biasParam.min}
          max={biasParam.max}
          step={biasParam.step}
          value={bias}
          onChange={(e) => onBiasChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{biasParam.min}</span>
          <span className="font-semibold">{bias.toFixed(1)}</span>
          <span>{biasParam.max}</span>
        </div>
        {biasParam.description && (
          <p className="text-xs text-gray-500 mt-1">{biasParam.description}</p>
        )}
      </div>
    );
  }
  return null;
})()}
```

Add import:

```typescript
import { problemRegistryV2 } from '../problems/registry';
```

**Verification:** UI renders correctly, parameters update problems.

---

## Success Criteria

### Functionality
- ✅ All problems resolve via `resolveProblem()`
- ✅ LR and SH load with datasets
- ✅ Parameters (lambda, bias, variant) update problems
- ✅ Formulas render from registry
- ✅ Algorithms converge on all problems
- ✅ Decision boundaries render correctly

### Code Quality
- ✅ `npm run build` succeeds
- ✅ `npm run lint` passes
- ✅ No special-case conditionals for LR/SH (except UI: data canvas, decision boundary)

### Architecture
- ✅ LR and SH use `datasetFactory` pattern
- ✅ Parameter metadata in registry
- ✅ Formula rendering from registry
- ✅ Variant system is generic
- ✅ Only justified UI special cases remain

---

## Summary

This migration treats dataset problems as **parametrized problems** where dataset is one of the parameters. After completion:

- **Problem resolution:** Unified via `resolveProblem()`
- **Factory pattern:** Dataset as third parameter
- **Parameters:** Lambda, bias, variant in registry metadata
- **Formulas:** From registry `objectiveFormula`
- **Special cases:** Only data canvas and decision boundary (UI concerns)

The result is a clean, consistent architecture where dataset problems are no longer algorithmically special - they're just parametrized problems with an unusual parameter type (interactive data instead of a scalar).
