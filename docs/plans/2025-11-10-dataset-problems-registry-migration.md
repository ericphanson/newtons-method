# Dataset Problems Registry Migration Plan

**Date:** 2025-11-10 (Updated post-3D-to-2D conversion)
**Objective:** Move logistic regression and separating hyperplane into the unified problem registry system
**Status:** PLANNED
**Estimated Effort:** 1.5-2 days (significantly simplified by 3D removal)
**Prerequisite:** docs/plans/2025-11-10-lr-sh-3d-to-2d-bias-parameter.md (MUST complete first)

---

## Executive Summary

**IMPORTANT:** This plan assumes the **3D → 2D bias parameter conversion has been completed**. After that conversion, LR and SH are much simpler: they're just 2D problems with extra parameters (lambda, bias, variant), making registry integration straightforward.

Currently, logistic regression and separating hyperplane are special-cased throughout the codebase with hardcoded conditionals in ~10 locations. They exist partially in the registry (metadata only) but lack factory functions and proper integration.

This plan outlines how to fully integrate them into the registry system to:
- Reduce code duplication (eliminate ~40 lines of special-case logic)
- Enable metadata-driven UI rendering
- Make it trivial to add new dataset-based problems
- Maintain architectural consistency

**Key Changes vs Original Plan:**
- ✅ No more `dimensionality: 3` - everything is 2D now
- ✅ No more bias slice computation - bias is a parameter
- ✅ No more 3D visualization concerns - direct 2D rendering
- ✅ Much simpler factory functions - just pass bias as parameter
- ✅ No more union types `[number, number] | [number, number, number]`

**Key Decision:** We recommend a **phased approach** starting with metadata completion (low risk, high value) before full factory integration.

---

## Key Simplifications (Post-3D Conversion)

### What's Now Simpler ✅

1. **No Dimensionality Checks**
   - Before: `if (problem.dimensionality === 3) ...` everywhere
   - After: All problems are 2D, no checks needed

2. **No Bias Slice Logic**
   - Before: Complex computation of optimal bias for visualization
   - After: Bias comes directly from state/parameters

3. **Simpler Initial Points**
   - Before: `[number, number] | [number, number, number]` union types
   - After: Always `[number, number]`

4. **Simpler Factory Signatures**
   - Before: Handle 3D weight vectors `[w0, w1, w2]`
   - After: Handle 2D weights `[w0, w1]` + bias parameter

5. **No 3D Visualization**
   - Before: "2D slice of 3D space" complexity
   - After: Direct 2D rendering

6. **Simpler Hessians**
   - Before: 3x3 matrices for classification
   - After: 2x2 matrices (consistent with all problems)

### Impact on This Plan

- **Effort reduced:** 2-3 days → 1.5-2 days
- **Complexity reduced:** ~40% fewer special cases to handle
- **Risk reduced:** No union types, no dimensionality edge cases
- **Code removed:** ~40 lines vs original ~60 lines

---

## Current State Analysis

### What Already Exists ✅

1. **Partial Registry Entries** (`src/problems/registry.ts:15-29`)
   ```typescript
   'logistic-regression': {
     parameters: [],
     displayName: 'Logistic Regression',
     category: 'classification',
     explainerContent: logisticRegressionExplainer,
   }
   ```
   - Has metadata but no factory
   - Cannot be resolved via `resolveProblem()`

2. **Helper Functions** (`src/utils/problemHelpers.ts`)
   - `isDatasetProblem()` - Identifies dataset problems
   - `constructInitialPoint()` - Now simplified to always return 2D (after 3D conversion)

3. **Explainer Content** (`src/problems/logisticRegression.tsx`, `src/problems/separatingHyperplane.tsx`)
   - Educational JSX content exists
   - Already imported in registry

4. **Problem Implementations** (`src/utils/logisticRegression.ts`, `src/utils/separatingHyperplane.ts`)
   - **After 3D conversion:** Objective, gradient, Hessian functions accept bias parameter
   - 2D weights only: `w = [w0, w1]` + `bias` parameter
   - 2x2 Hessians (was 3x3)
   - Working and tested

### What's Missing ❌

1. **Factory Functions** - No way to create problem instances from registry
2. **Dataset Parameter** - `resolveProblem()` doesn't accept datasets
3. **Parameter Arrays** - Lambda, bias, variant not in parameters metadata
4. **Variant System** - Separating hyperplane variants not modeled in registry

### Special Cases That Must Remain ⚠️

These are **justifiably special** and should NOT be unified:

1. **Data Canvas UI** - Interactive point editing (unique component)
2. **Decision Boundary Rendering** - Geometric overlay (visualization concern)
3. **Dataset Generation** - Crescent generation logic

**Note:** After 3D → 2D conversion, the following special cases are REMOVED:
- ~~3D Slice Notation~~ - No longer exists
- ~~Bias slice computation~~ - No longer needed
- ~~Dimensionality checks~~ - All problems are 2D now

---

## Architecture Design

### Type System Extensions

#### Option A: Separate Factory Type (Recommended)

```typescript
// src/types/experiments.ts

export interface ProblemRegistryEntry {
  // Existing fields
  factory?: (parameters: Record<string, number | string>) => ProblemDefinition;
  defaultInstance?: ProblemDefinition;
  parameters: ParameterMetadata[];
  displayName: string;
  category?: 'convex' | 'non-convex' | 'classification';
  keyInsights?: React.ReactNode;
  explainerContent?: { ... } | React.ReactNode;

  // NEW: Dataset support
  datasetFactory?: (
    parameters: Record<string, number | string>,
    dataset: DataPoint[]
  ) => ProblemDefinition;

  // NEW: Metadata
  requiresDataset?: boolean;

  // NEW: Variant support (for separating hyperplane)
  variants?: Array<{
    id: string;
    displayName: string;
    description?: string;
  }>;
  defaultVariant?: string;
}
```

**Rationale:**
- `datasetFactory` is separate from `factory` - clear separation of concerns
- `requiresDataset` makes it explicit which problems need data
- `variants` is generic enough for future use (e.g., Rosenbrock variants)
- **No `dimensionality` field needed** - after 3D conversion, all problems are 2D

#### Option B: Unified Factory (Alternative)

```typescript
factory?: (
  parameters: Record<string, number | string>,
  dataset?: DataPoint[]
) => ProblemDefinition;
```

**Pros:** Single factory function
**Cons:** Optional dataset parameter is confusing (when is it required?)

**Decision:** Use Option A for clarity.

---

## Phase 1: Type System & Registry Metadata

### Step 1.1: Extend `ProblemRegistryEntry` interface

**File:** `src/types/experiments.ts`

**Action:** Add new fields to `ProblemRegistryEntry` (lines 109-133)

```typescript
export interface ProblemRegistryEntry {
  // ... existing fields ...

  // NEW: Add after line 121 (after category)
  requiresDataset?: boolean;

  // NEW: Add after explainerContent
  datasetFactory?: (
    parameters: Record<string, number | string>,
    dataset: DataPoint[]
  ) => ProblemDefinition;

  variants?: Array<{
    id: string;
    displayName: string;
    description?: string;
  }>;
  defaultVariant?: string;
}
```

**Note:** No `dimensionality` field needed - all problems are 2D after the 3D conversion.

**Verification:**
```bash
npm run type-check
# Should pass with no errors
```

### Step 1.2: Update Logistic Regression Registry Entry

**File:** `src/problems/registry.ts`

**Current state (lines 15-21):**
```typescript
'logistic-regression': {
  parameters: [],
  displayName: 'Logistic Regression',
  category: 'classification',
  explainerContent: logisticRegressionExplainer,
}
```

**Update to:**
```typescript
'logistic-regression': {
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
      description: 'L2 regularization strength (higher = simpler model)'
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
}
```

**Note:** After 3D conversion, bias is now a parameter (like lambda), not part of the weight vector.

**Verification:**
```bash
npm run type-check
# Check that lambda parameter is recognized
```

### Step 1.3: Update Separating Hyperplane Registry Entry

**File:** `src/problems/registry.ts`

**Current state (lines 23-29):**
```typescript
'separating-hyperplane': {
  parameters: [],
  displayName: 'Separating Hyperplane',
  category: 'classification',
  explainerContent: separatingHyperplaneExplainer,
}
```

**Update to:**
```typescript
'separating-hyperplane': {
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
      description: 'Loss function variant for the separating hyperplane'
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
}
```

**Verification:**
```bash
npm run type-check
npm run lint
# Both should pass
```

**Phase 1 Completion Criteria:**
- ✅ TypeScript compiles without errors
- ✅ Linter passes
- ✅ Both registry entries have `requiresDataset: true`
- ✅ Parameters arrays include lambda AND bias
- ✅ Separating hyperplane has variants array
- ✅ No `dimensionality` field (all problems are 2D)

---

## Phase 2: Factory Functions

### Step 2.1: Create Logistic Regression Factory

**File:** `src/problems/logisticRegression.tsx`

**Current state:** Only exports `logisticRegressionExplainer`

**Add at the top (after imports, around line 3):**
```typescript
import { ProblemDefinition, DataPoint } from '../types/experiments';
import { logisticObjective, logisticGradient, logisticHessian } from '../utils/logisticRegression';
import { BlockMath } from '../components/Math';

/**
 * Factory function to create logistic regression problem with dataset
 * After 3D conversion, bias is a parameter (not part of weight vector)
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
        {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w^T x_i + b)}) + \frac{\lambda}{2}\|w\|^2`}
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

**Key changes from original plan:**
- Factory now accepts `bias` parameter (after 3D conversion)
- Weights `w` are 2D only: `[w0, w1]`
- Bias passed to objective/gradient/hessian functions
- Formula shows explicit `+ b` term

**Verification:**
```typescript
// Quick test in browser console or test file
import { createLogisticRegressionProblem } from './problems/logisticRegression';
const testData = [{ x1: 1, x2: 1, y: 1, x: 1, label: 1 }];
const problem = createLogisticRegressionProblem(1.0, testData);
console.assert(problem.name === 'Logistic Regression');
console.assert(typeof problem.objective === 'function');
```

### Step 2.2: Create Separating Hyperplane Factory

**File:** `src/problems/separatingHyperplane.tsx`

**Current state:** Only exports `separatingHyperplaneExplainer`

**Add at the top (after imports):**
```typescript
import { ProblemDefinition, DataPoint, SeparatingHyperplaneVariant } from '../types/experiments';
import * as SH from '../utils/separatingHyperplane';
import { BlockMath, InlineMath } from '../components/Math';

/**
 * Get formula JSX for a specific variant
 */
function getVariantFormula(variant: SeparatingHyperplaneVariant): React.ReactNode {
  switch (variant) {
    case 'soft-margin':
      return (
        <BlockMath>
          {String.raw`f(w) = \sum_i \max(0, 1 - y_i(w^T x_i)) + \frac{\lambda}{2}\|w\|^2`}
        </BlockMath>
      );
    case 'perceptron':
      return (
        <BlockMath>
          {String.raw`f(w) = \sum_i \max(0, -y_i(w^T x_i)) + \frac{\lambda}{2}\|w\|^2`}
        </BlockMath>
      );
    case 'squared-hinge':
      return (
        <BlockMath>
          {String.raw`f(w) = \sum_i \max(0, 1 - y_i(w^T x_i))^2 + \frac{\lambda}{2}\|w\|^2`}
        </BlockMath>
      );
  }
}

/**
 * Factory function to create separating hyperplane problem with dataset
 */
export function createSeparatingHyperplaneProblem(
  variant: SeparatingHyperplaneVariant,
  lambda: number,
  dataset: DataPoint[]
): ProblemDefinition {
  let objective: (w: number[]) => number;
  let gradient: (w: number[]) => number[];
  let hessian: (w: number[]) => number[][];

  switch (variant) {
    case 'soft-margin':
      objective = (w) => SH.softMarginObjective(w, dataset, lambda);
      gradient = (w) => SH.softMarginGradient(w, dataset, lambda);
      hessian = () => SH.softMarginHessian();
      break;
    case 'perceptron':
      objective = (w) => SH.perceptronObjective(w, dataset, lambda);
      gradient = (w) => SH.perceptronGradient(w, dataset, lambda);
      hessian = () => SH.perceptronHessian(lambda);
      break;
    case 'squared-hinge':
      objective = (w) => SH.squaredHingeObjective(w, dataset, lambda);
      gradient = (w) => SH.squaredHingeGradient(w, dataset, lambda);
      hessian = (w) => SH.squaredHingeHessian(w, dataset, lambda);
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

**Verification:**
```typescript
// Test all three variants
const testData = [{ x1: 1, x2: 1, y: 1, x: 1, label: 1 }];
const variants = ['soft-margin', 'perceptron', 'squared-hinge'] as const;
for (const variant of variants) {
  const problem = createSeparatingHyperplaneProblem(variant, 1.0, testData);
  console.assert(problem.name.includes(variant));
  console.assert(typeof problem.objective === 'function');
}
```

### Step 2.3: Add Factories to Registry

**File:** `src/problems/registry.ts`

**Add imports at top:**
```typescript
import { createLogisticRegressionProblem } from './logisticRegression';
import { createSeparatingHyperplaneProblem } from './separatingHyperplane';
```

**Update logistic-regression entry (around line 15):**
```typescript
'logistic-regression': {
  datasetFactory: (params, dataset) => {
    const lambda = (params.lambda as number) || 1.0;
    return createLogisticRegressionProblem(lambda, dataset);
  },
  parameters: [ /* ... existing ... */ ],
  displayName: 'Logistic Regression',
  category: 'classification',
  requiresDataset: true,
  dimensionality: 3,
  explainerContent: logisticRegressionExplainer,
}
```

**Update separating-hyperplane entry:**
```typescript
'separating-hyperplane': {
  datasetFactory: (params, dataset) => {
    const variant = (params.variant as SeparatingHyperplaneVariant) || 'soft-margin';
    const lambda = (params.lambda as number) || 1.0;
    return createSeparatingHyperplaneProblem(variant, lambda, dataset);
  },
  parameters: [ /* ... existing ... */ ],
  displayName: 'Separating Hyperplane',
  category: 'classification',
  requiresDataset: true,
  dimensionality: 3,
  variants: [ /* ... existing ... */ ],
  defaultVariant: 'soft-margin',
  explainerContent: separatingHyperplaneExplainer,
}
```

**Verification:**
```bash
npm run type-check
npm run lint
# Both should pass
```

**Phase 2 Completion Criteria:**
- ✅ Factory functions exist in problem files
- ✅ Factory functions are properly typed
- ✅ Factories are registered in `datasetFactory` field
- ✅ Import statements added to registry
- ✅ TypeScript compiles
- ✅ Linter passes

---

## Phase 3: Resolution Function Updates

### Step 3.1: Extend `resolveProblem()` signature

**File:** `src/problems/registry.ts`

**Current signature (line 124):**
```typescript
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {}
): ProblemDefinition
```

**Update to:**
```typescript
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {},
  dataset?: DataPoint[]
): ProblemDefinition
```

**Add import at top:**
```typescript
import { DataPoint } from '../types/experiments';
```

### Step 3.2: Update `resolveProblem()` implementation

**Current implementation (lines 128-142):**
```typescript
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
```

**Update to:**
```typescript
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {},
  dataset?: DataPoint[]
): ProblemDefinition {
  const entry = problemRegistryV2[problemType];

  if (!entry) {
    throw new Error(`Problem not found in registry: ${problemType}`);
  }

  // NEW: Handle dataset-based problems first
  if (entry.requiresDataset) {
    if (!dataset || dataset.length === 0) {
      throw new Error(`Problem '${problemType}' requires a dataset`);
    }
    if (!entry.datasetFactory) {
      throw new Error(`Problem '${problemType}' missing datasetFactory`);
    }
    return entry.datasetFactory(parameters, dataset);
  }

  // Use factory if available, otherwise return static instance
  if (entry.factory) {
    return entry.factory(parameters);
  } else if (entry.defaultInstance) {
    return entry.defaultInstance;
  }

  throw new Error(`Problem registry entry incomplete for: ${problemType}`);
}
```

**Verification:**
```typescript
// Test in browser console or test file
import { resolveProblem } from './problems/registry';

// Should throw - no dataset
try {
  resolveProblem('logistic-regression');
  console.error('FAIL: Should have thrown');
} catch (e) {
  console.log('PASS: Throws when no dataset', e.message);
}

// Should work - dataset provided
const testData = [{ x1: 1, x2: 1, y: 1, x: 1, label: 1 }];
const problem = resolveProblem('logistic-regression', { lambda: 1.0 }, testData);
console.assert(problem.name === 'Logistic Regression');

// Should work - variant parameter
const svmProblem = resolveProblem('separating-hyperplane', { variant: 'perceptron', lambda: 1.0 }, testData);
console.assert(svmProblem.name.includes('perceptron'));
```

### Step 3.3: Add Helper Functions to Registry Module

**File:** `src/problems/registry.ts`

**Add after `isProblemParametrized()` (around line 171):**
```typescript
/**
 * Check if a problem requires a dataset
 */
export function requiresDataset(problemType: string): boolean {
  const entry = problemRegistryV2[problemType];
  return !!entry && !!entry.requiresDataset;
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

**Note:** No `getProblemDimensionality()` needed - all problems are 2D after the 3D conversion.

**Phase 3 Completion Criteria:**
- ✅ `resolveProblem()` accepts optional dataset parameter
- ✅ Dataset-based problems can be resolved via registry
- ✅ Error thrown when dataset required but not provided
- ✅ Helper functions exported (no dimensionality helper needed)
- ✅ TypeScript compiles
- ✅ Manual tests pass (console verification)

---

## Phase 4: UnifiedVisualizer Integration

### Step 4.1: Update `getCurrentProblem()` to Use Registry

**File:** `src/UnifiedVisualizer.tsx`

**Current implementation (lines 173-215):**
```typescript
const getCurrentProblem = useCallback(() => {
  if (currentProblem === 'logistic-regression') {
    // Return logistic regression wrapped as problem interface
    return {
      name: 'Logistic Regression',
      description: 'Binary classification with L2 regularization',
      objective: (w: number[]) => logisticObjective(w, data, lambda),
      gradient: (w: number[]) => logisticGradient(w, data, lambda),
      hessian: (w: number[]) => logisticHessian(w, data, lambda),
      domain: { w0: [-3, 3], w1: [-3, 3] },
      requiresDataset: true,
      dimensionality: 3,
    };
  } else if (currentProblem === 'separating-hyperplane') {
    const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
    return {
      name: 'Separating Hyperplane',
      description: `Separating hyperplane (${separatingHyperplaneVariant})`,
      objective, gradient, hessian,
      domain: { w0: [-3, 3], w1: [-3, 3] },
      requiresDataset: true,
      dimensionality: 3,
    };
  } else {
    const problem = resolveProblem(currentProblem, problemParameters);
    return {
      ...problem,
      requiresDataset: false,
      dimensionality: 2,
    };
  }
}, [currentProblem, data, lambda, problemParameters, separatingHyperplaneVariant]);
```

**Replace with:**
```typescript
const getCurrentProblem = useCallback(() => {
  const entry = problemRegistryV2[currentProblem];

  // Unified resolution via registry
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

**Note:** No `dimensionality` field needed - all problems are 2D after the 3D conversion.

**Update imports at top:**
```typescript
import { problemRegistryV2, resolveProblem } from './problems/registry';
```

**Remove now-unused imports:**
```typescript
// DELETE these lines (no longer needed):
import { logisticObjective, logisticGradient, logisticHessian } from './utils/logisticRegression';
import { separatingHyperplaneToProblemFunctions } from './utils/problemAdapter';
```

### Step 4.2: Update `getCurrentProblemFunctions()`

**Current implementation (lines 220-234):**
```typescript
const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
  if (currentProblem === 'logistic-regression') {
    return logisticRegressionToProblemFunctions(data, lambda);
  } else if (currentProblem === 'separating-hyperplane') {
    if (!data || data.length === 0) {
      throw new Error('Separating hyperplane requires dataset');
    }
    return separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
  } else {
    const problem = resolveProblem(currentProblem, problemParameters);
    return problemToProblemFunctions(problem);
  }
}, [currentProblem, data, lambda, problemParameters, separatingHyperplaneVariant]);
```

**Replace with:**
```typescript
const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
  const entry = problemRegistryV2[currentProblem];

  // Unified resolution
  const problem = resolveProblem(
    currentProblem,
    problemParameters,
    entry?.requiresDataset ? data : undefined
  );

  return {
    objective: problem.objective,
    gradient: problem.gradient,
    hessian: problem.hessian,
    dimensionality: 2, // All problems are 2D after 3D conversion
  };
}, [currentProblem, data, problemParameters]);
```

**Note:** `dimensionality: 2` is hardcoded since all problems are now 2D.

### Step 4.3: Verify State Management

**File:** `src/UnifiedVisualizer.tsx`

**Ensure `problemParameters` state includes lambda and variant:**

Find state initialization (around line 90-120), verify this exists:
```typescript
const [problemParameters, setProblemParameters] = useState<Record<string, number | string>>({});
```

**Add useEffect to sync parameters into problemParameters:**
```typescript
// Sync lambda, bias, and variant into problemParameters for dataset problems
useEffect(() => {
  if (isDatasetProblem(currentProblem)) {
    setProblemParameters(prev => ({
      ...prev,
      lambda: lambda,
      bias: bias, // NEW: Include bias parameter
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

**Note:** After 3D conversion, `bias` state already exists in UnifiedVisualizer (added by the 3D-to-2D plan).

**Verification:**
```bash
npm run dev
# Open browser, test:
# 1. Switch to logistic regression - should work
# 2. Change lambda slider - should update
# 3. Run algorithm - should converge
# 4. Switch to separating hyperplane - should work
# 5. Change variant - should update formula
# 6. Switch to quadratic - should work (no regression)
```

**Phase 4 Completion Criteria:**
- ✅ UnifiedVisualizer uses registry for ALL problems
- ✅ Special-case conditionals removed (~40 lines deleted)
- ✅ Lambda synced to problemParameters
- ✅ Variant synced to problemParameters
- ✅ All problems load correctly in UI
- ✅ Algorithms run successfully
- ✅ No console errors

---

## Phase 5: ProblemConfiguration UI Updates

### Step 5.1: Remove Hardcoded Formulas

**File:** `src/components/ProblemConfiguration.tsx`

**Current state (lines 151-195):** Hardcoded JSX for logistic regression and separating hyperplane formulas

**Find this section:**
```typescript
{/* Logistic Regression */}
{currentProblem === 'logistic-regression' && (
  <div>
    <p className="text-base font-semibold mb-2">Objective:</p>
    <BlockMath>
      {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w^T x_i)}) + \frac{\lambda}{2}\|w\|^2`}
    </BlockMath>
  </div>
)}

{/* Separating Hyperplane */}
{currentProblem === 'separating-hyperplane' && (
  // ... lots of JSX for variants ...
)}
```

**Replace with:**
```typescript
{/* Show formula from registry */}
{problem?.objectiveFormula && (
  <div>
    <p className="text-base font-semibold mb-2">Objective:</p>
    {problem.objectiveFormula}
  </div>
)}
```

**Lines removed:** ~45 lines

### Step 5.2: Use Registry Metadata for Parameters

**File:** `src/components/ProblemConfiguration.tsx`

**Current state (lines 220-329):** Hardcoded parameter controls

**Find the parameters section:**
```typescript
{isDatasetProblem(currentProblem) && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

    {/* Variant selector */}
    {currentProblem === 'separating-hyperplane' && (
      // ... hardcoded dropdown ...
    )}

    {/* Lambda slider */}
    // ... hardcoded range input ...
  </div>
)}
```

**Check if ParameterControls component already handles this:**

If not, the special-case UI can remain BUT should read from registry:

```typescript
{isDatasetProblem(currentProblem) && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

    {/* Variant selector - read variants from registry */}
    {(() => {
      const entry = problemRegistryV2[currentProblem];
      if (entry?.variants && entry.variants.length > 0) {
        return (
          <div className="mb-4 flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Variant:
            </label>
            <select
              value={separatingHyperplaneVariant}
              onChange={(e) => onSeparatingHyperplaneVariantChange(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {entry.variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.displayName}
                </option>
              ))}
            </select>
          </div>
        );
      }
      return null;
    })()}

    {/* Lambda slider - read from registry parameters */}
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

    {/* Data canvas - remains special case */}
    <DataCanvas ... />
  </div>
)}
```

**Add import:**
```typescript
import { problemRegistryV2 } from '../problems/registry';
```

**Verification:**
```bash
npm run dev
# Test in browser:
# 1. Open logistic regression
#    - Formula renders from registry ✓
#    - Lambda slider shows description ✓
# 2. Open separating hyperplane
#    - Formula updates based on variant ✓
#    - Variant dropdown populated from registry ✓
```

**Phase 5 Completion Criteria:**
- ✅ Hardcoded formulas removed
- ✅ Formulas render from `problem.objectiveFormula`
- ✅ Parameters read from registry metadata
- ✅ Variant dropdown uses `entry.variants`
- ✅ Data canvas remains functional (special case preserved)
- ✅ UI looks identical to before
- ✅ ~50 lines of code removed

---

## Phase 6: Update Helper Functions

### Step 6.1: Replace `isDatasetProblem()` with Registry Lookup

**File:** `src/utils/problemHelpers.ts`

**Current implementation:**
```typescript
export function isDatasetProblem(problemType: string | undefined): boolean {
  return problemType === 'logistic-regression' || problemType === 'separating-hyperplane';
}
```

**Option A: Keep as-is (Recommended)**

Rationale: This is a performance optimization - no registry lookup needed, and it's clear.

**Option B: Use registry (more "pure" but slower)**
```typescript
import { problemRegistryV2 } from '../problems/registry';

export function isDatasetProblem(problemType: string | undefined): boolean {
  if (!problemType) return false;
  const entry = problemRegistryV2[problemType];
  return !!entry?.requiresDataset;
}
```

**Decision:** Keep Option A for performance. Add comment:
```typescript
/**
 * Check if a problem requires a dataset as input
 *
 * Performance note: This is hardcoded for speed. If you add a new
 * dataset-based problem, update this function AND the registry.
 *
 * @param problemType The problem type to check
 * @returns true if the problem is logistic-regression or separating-hyperplane
 */
export function isDatasetProblem(problemType: string | undefined): boolean {
  return problemType === 'logistic-regression' || problemType === 'separating-hyperplane';
}
```

### Step 6.2: Update `constructInitialPoint()` to Use Registry

**File:** `src/utils/problemHelpers.ts`

**Current implementation:**
```typescript
export function constructInitialPoint(
  problemType: string,
  w0: number,
  w1: number
): [number, number] | [number, number, number] {
  return isDatasetProblem(problemType)
    ? [w0, w1, 0]
    : [w0, w1];
}
```

**Option A: Keep as-is (Recommended)**

Same reasoning - performance and clarity.

**Option B: Use registry**
```typescript
import { getProblemDimensionality } from '../problems/registry';

export function constructInitialPoint(
  problemType: string,
  w0: number,
  w1: number
): [number, number] | [number, number, number] {
  const dim = getProblemDimensionality(problemType);
  return dim === 3 ? [w0, w1, 0] : [w0, w1];
}
```

**Decision:** Keep Option A. Add comment noting registry sync requirement.

**Phase 6 Completion Criteria:**
- ✅ Helper functions documented with sync requirements
- ✅ Performance vs purity trade-off documented
- ✅ Future maintainers know to update both locations

---

## Phase 7: Testing & Verification

### Step 7.1: Manual UI Testing

**Test Protocol:**

1. **Logistic Regression**
   ```
   [ ] Load page, select "Logistic Regression"
   [ ] Formula displays correctly from registry
   [ ] Lambda slider shows (0-10, default 1.0)
   [ ] Data canvas displays with crescent data
   [ ] Click to add points - works
   [ ] Run GD Fixed (α=0.1, 50 iters) - converges
   [ ] Run Newton - converges faster
   [ ] Change lambda to 5.0 - problem updates
   [ ] Decision boundary renders (green line)
   [ ] 2D slice notation shows: "w₂ = [value] (bias from optimal)"
   [ ] Switch to quadratic - no errors
   ```

2. **Separating Hyperplane**
   ```
   [ ] Select "Separating Hyperplane"
   [ ] Variant dropdown shows 3 options from registry
   [ ] Default is "Soft Margin SVM"
   [ ] Formula displays correctly (L1 hinge)
   [ ] Change variant to "Perceptron" - formula updates
   [ ] Lambda slider works
   [ ] Run algorithm - converges
   [ ] Decision boundary renders
   [ ] Change variant to "Squared Hinge" - formula updates to L2
   [ ] Switch back to logistic - no errors
   ```

3. **Non-Dataset Problems**
   ```
   [ ] Select "Quadratic" - no regression
   [ ] Select "Rosenbrock" - no regression
   [ ] Select "Ill-Conditioned Quadratic" - no regression
   [ ] All algorithms run successfully
   [ ] Switch between all problems - no console errors
   ```

### Step 7.2: Automated Tests

**Create test file:** `src/problems/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { resolveProblem, getProblemDimensionality, requiresDataset } from '../registry';
import { DataPoint } from '../../types/experiments';

describe('Problem Registry - Dataset Problems', () => {
  const mockDataset: DataPoint[] = [
    { x1: 1, x2: 1, y: 1, x: 1, label: 1 },
    { x1: -1, x2: -1, y: 0, x: -1, label: 0 },
  ];

  describe('Logistic Regression', () => {
    it('should require dataset', () => {
      expect(requiresDataset('logistic-regression')).toBe(true);
    });

    it('should have dimensionality 3', () => {
      expect(getProblemDimensionality('logistic-regression')).toBe(3);
    });

    it('should throw when resolving without dataset', () => {
      expect(() => resolveProblem('logistic-regression')).toThrow('requires a dataset');
    });

    it('should resolve with dataset', () => {
      const problem = resolveProblem('logistic-regression', { lambda: 1.0 }, mockDataset);
      expect(problem.name).toBe('Logistic Regression');
      expect(typeof problem.objective).toBe('function');
      expect(typeof problem.gradient).toBe('function');
      expect(typeof problem.hessian).toBe('function');
    });

    it('should use lambda parameter', () => {
      const problem1 = resolveProblem('logistic-regression', { lambda: 1.0 }, mockDataset);
      const problem2 = resolveProblem('logistic-regression', { lambda: 5.0 }, mockDataset);

      const w = [0.1, 0.1, 0.0];
      const loss1 = problem1.objective(w);
      const loss2 = problem2.objective(w);

      // Higher lambda should give different loss
      expect(loss1).not.toBe(loss2);
    });
  });

  describe('Separating Hyperplane', () => {
    it('should require dataset', () => {
      expect(requiresDataset('separating-hyperplane')).toBe(true);
    });

    it('should have dimensionality 3', () => {
      expect(getProblemDimensionality('separating-hyperplane')).toBe(3);
    });

    it('should resolve with soft-margin variant', () => {
      const problem = resolveProblem(
        'separating-hyperplane',
        { variant: 'soft-margin', lambda: 1.0 },
        mockDataset
      );
      expect(problem.name).toContain('soft-margin');
    });

    it('should resolve with perceptron variant', () => {
      const problem = resolveProblem(
        'separating-hyperplane',
        { variant: 'perceptron', lambda: 1.0 },
        mockDataset
      );
      expect(problem.name).toContain('perceptron');
    });

    it('should resolve with squared-hinge variant', () => {
      const problem = resolveProblem(
        'separating-hyperplane',
        { variant: 'squared-hinge', lambda: 1.0 },
        mockDataset
      );
      expect(problem.name).toContain('squared-hinge');
    });

    it('should give different objectives for different variants', () => {
      const w = [0.1, 0.1, 0.0];

      const softMargin = resolveProblem(
        'separating-hyperplane',
        { variant: 'soft-margin', lambda: 1.0 },
        mockDataset
      );
      const perceptron = resolveProblem(
        'separating-hyperplane',
        { variant: 'perceptron', lambda: 1.0 },
        mockDataset
      );

      expect(softMargin.objective(w)).not.toBe(perceptron.objective(w));
    });
  });
});
```

**Run tests:**
```bash
npm run test
# All tests should pass
```

### Step 7.3: Performance Testing

**Measure impact of registry lookups:**

```typescript
// Add to a test file or console
const iterations = 10000;

// Benchmark old way (direct check)
console.time('Direct check');
for (let i = 0; i < iterations; i++) {
  const result = ('logistic-regression' === 'logistic-regression' || 'logistic-regression' === 'separating-hyperplane');
}
console.timeEnd('Direct check');

// Benchmark registry lookup
console.time('Registry lookup');
for (let i = 0; i < iterations; i++) {
  const result = requiresDataset('logistic-regression');
}
console.timeEnd('Registry lookup');
```

**Expected:** Direct check ~0.1ms, Registry lookup ~1-2ms (acceptable)

### Step 7.4: Bundle Size Check

```bash
npm run build
ls -lh dist/assets/*.js

# Compare before/after
# Expected: ~same size or slightly smaller (removed code)
```

**Phase 7 Completion Criteria:**
- ✅ All manual test cases pass
- ✅ All automated tests pass
- ✅ No console errors
- ✅ No visual regressions
- ✅ Performance acceptable (<5ms difference)
- ✅ Bundle size same or smaller

---

## Phase 8: Documentation & Cleanup

### Step 8.1: Update Architecture Documentation

**File:** `docs/architecture/problem-registry.md` (create if doesn't exist)

```markdown
# Problem Registry System

## Overview

All optimization problems are registered in `src/problems/registry.ts` via the `problemRegistryV2` registry.

## Problem Types

### Pure Optimization Problems
- No runtime data dependencies
- Use `factory` or `defaultInstance`
- Examples: Rosenbrock, Quadratic, Himmelblau

### Dataset-Based Problems
- Require runtime dataset input
- Use `datasetFactory`
- Set `requiresDataset: true`
- Examples: Logistic Regression, Separating Hyperplane

## Adding a New Problem

### Pure Optimization Problem

1. Create problem file in `src/problems/yourProblem.tsx`
2. Export factory function and explainer content
3. Add to registry:

```typescript
'your-problem': {
  factory: (params) => createYourProblem(params.someParam),
  parameters: [
    { key: 'someParam', label: 'Some Parameter', type: 'range', ... }
  ],
  displayName: 'Your Problem',
  category: 'convex',
  explainerContent: yourProblemExplainer,
}
```

### Dataset-Based Problem

1. Create problem file in `src/problems/yourProblem.tsx`
2. Export `datasetFactory` function
3. Add to registry:

```typescript
'your-problem': {
  datasetFactory: (params, dataset) => createYourProblem(params, dataset),
  parameters: [ ... ],
  displayName: 'Your Problem',
  category: 'classification',
  requiresDataset: true,
  dimensionality: 3, // if using 3D weights
  explainerContent: yourProblemExplainer,
}
```

4. **IMPORTANT:** Update `isDatasetProblem()` in `src/utils/problemHelpers.ts`

## Resolution

Use `resolveProblem()` to instantiate problems:

```typescript
// Pure optimization
const problem = resolveProblem('rosenbrock', { rosenbrockB: 100 });

// Dataset-based
const problem = resolveProblem('logistic-regression', { lambda: 1.0 }, dataset);
```

## Special Cases

Some UI elements remain special-cased for dataset problems:
- Data canvas (interactive point editing)
- Decision boundary rendering (geometric overlay)
- 3D slice notation display

These are special because they're **UI concerns**, not data model concerns.
```

### Step 8.2: Add Code Comments

**File:** `src/problems/registry.ts`

Add comment block at top explaining dataset problems:

```typescript
/**
 * Parameter-aware problem registry
 *
 * This registry contains ALL optimization problems, including both:
 * 1. Pure optimization problems (quadratic, Rosenbrock, etc.)
 *    - Use `factory` or `defaultInstance`
 * 2. Dataset-based problems (logistic regression, SVM)
 *    - Use `datasetFactory`
 *    - Set `requiresDataset: true`
 *
 * Adding a new dataset-based problem:
 * 1. Add entry here with `datasetFactory`
 * 2. Update `isDatasetProblem()` in src/utils/problemHelpers.ts
 * 3. Create factory function in src/problems/yourProblem.tsx
 *
 * See docs/architecture/problem-registry.md for details.
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
```

### Step 8.3: Update README

**File:** `README.md` (or `docs/README.md`)

Add section about dataset-based problems:

```markdown
## Problem Types

### Classification Problems (Dataset-Based)

- **Logistic Regression**: Binary classification with L2 regularization
- **Separating Hyperplane**: SVM variants (soft-margin, perceptron, squared-hinge)

These problems learn from interactive data:
- Click to add points (red/blue classes)
- Adjust regularization (λ)
- Watch algorithms find decision boundaries

### Optimization Problems

- **Quadratic Functions**: Test convergence on well-conditioned problems
- **Rosenbrock**: Navigate narrow valley to global minimum
- **Himmelblau**: Multi-modal landscape with 4 global minima
- ... (existing documentation) ...
```

### Step 8.4: Clean Up Dead Code

**Files to check for unused imports/functions:**

1. `src/utils/problemAdapter.ts`
   - `logisticRegressionToProblemFunctions` - **Keep** (used in global min calculation)
   - `separatingHyperplaneToProblemFunctions` - **Keep** (same reason)

2. `src/UnifiedVisualizer.tsx`
   - Remove unused imports (if any after Phase 4)
   - Verify no lingering special-case code

3. `src/components/ProblemConfiguration.tsx`
   - Remove hardcoded formula JSX (after Phase 5)
   - Verify no duplicated logic

**Run linter to find unused code:**
```bash
npm run lint
# Fix any warnings about unused variables/imports
```

**Phase 8 Completion Criteria:**
- ✅ Architecture documentation created
- ✅ Code comments added
- ✅ README updated
- ✅ Dead code removed
- ✅ Linter passes with no warnings

---

## Rollback Plan

If issues arise during migration, rollback is straightforward since changes are incremental:

### Phase 1-2 Rollback (Registry Metadata)
- Revert `src/types/experiments.ts`
- Revert `src/problems/registry.ts`
- Revert new factory functions in problem files

### Phase 3-4 Rollback (Resolution & Visualizer)
- Revert `src/problems/registry.ts` (resolveProblem changes)
- Revert `src/UnifiedVisualizer.tsx`
- Restore old special-case logic

### Full Rollback
```bash
git log --oneline | head -10  # Find commit before migration
git revert <commit-hash> --no-commit
git commit -m "Rollback: Dataset problems registry migration"
```

---

## Success Metrics

### Quantitative
- **Code removed:** ~80-100 lines of special-case logic
- **Code added:** ~150 lines (factories + registry entries)
- **Net change:** +50 lines but -15 locations of duplication
- **Test coverage:** 15+ new tests for registry resolution
- **Build time:** No significant change (<5% difference)
- **Bundle size:** Same or slightly smaller

### Qualitative
- ✅ Architecture is consistent (all problems via registry)
- ✅ Easy to add new dataset problems (proven pattern)
- ✅ Metadata-driven UI (parameters auto-rendered)
- ✅ Self-documenting (registry is source of truth)
- ✅ Special cases preserved where justified (UI components)

---

## Detailed Completion Criteria

### Phase 1: Type System ✅
- [ ] `ProblemRegistryEntry` has `requiresDataset` field
- [ ] `ProblemRegistryEntry` has `dimensionality` field
- [ ] `ProblemRegistryEntry` has `datasetFactory` field
- [ ] `ProblemRegistryEntry` has `variants` field
- [ ] TypeScript compiles without errors
- [ ] Linter passes

### Phase 2: Factory Functions ✅
- [ ] `createLogisticRegressionProblem()` exists in `src/problems/logisticRegression.tsx`
- [ ] `createSeparatingHyperplaneProblem()` exists in `src/problems/separatingHyperplane.tsx`
- [ ] Both factories return valid `ProblemDefinition` objects
- [ ] Both factories are in registry `datasetFactory` fields
- [ ] Manual console tests pass (can create problem instances)

### Phase 3: Resolution Function ✅
- [ ] `resolveProblem()` accepts optional `dataset` parameter
- [ ] `resolveProblem()` checks `requiresDataset` flag
- [ ] Throws error when dataset required but not provided
- [ ] Returns dataset-based problem when dataset provided
- [ ] Helper functions exported (`requiresDataset`, `getProblemDimensionality`, etc.)
- [ ] Console tests pass for all variants

### Phase 4: UnifiedVisualizer ✅
- [ ] `getCurrentProblem()` uses registry for all problems
- [ ] `getCurrentProblemFunctions()` uses registry for all problems
- [ ] Special-case conditionals removed (save ~40 lines)
- [ ] Lambda synced to `problemParameters`
- [ ] Variant synced to `problemParameters`
- [ ] No unused imports remain
- [ ] All problems load in UI without errors
- [ ] Algorithms run successfully on all problems

### Phase 5: ProblemConfiguration ✅
- [ ] Hardcoded formulas removed
- [ ] Uses `problem.objectiveFormula` from registry
- [ ] Parameter controls read from registry metadata
- [ ] Variant dropdown uses `entry.variants`
- [ ] Data canvas remains functional (special case OK)
- [ ] UI appearance unchanged
- [ ] ~50 lines removed

### Phase 6: Helper Functions ✅
- [ ] `isDatasetProblem()` documented with sync requirement
- [ ] `constructInitialPoint()` documented
- [ ] Performance vs purity trade-off explained in comments
- [ ] Future maintainers understand update requirements

### Phase 7: Testing ✅
- [ ] All manual UI tests pass (checklist above)
- [ ] Automated tests written and passing
- [ ] No console errors or warnings
- [ ] No visual regressions
- [ ] Performance acceptable (<5ms overhead)
- [ ] Bundle size same or smaller

### Phase 8: Documentation ✅
- [ ] Architecture doc created (`docs/architecture/problem-registry.md`)
- [ ] Code comments added to registry
- [ ] README updated with dataset problem info
- [ ] Dead code removed
- [ ] Linter passes with no warnings

---

## Final Verification Checklist

Run through this checklist before marking migration complete:

### Functionality
- [ ] Load page → no console errors
- [ ] Select logistic regression → loads correctly
- [ ] Change lambda → problem updates
- [ ] Run GD Fixed → converges
- [ ] Run Newton → converges
- [ ] Decision boundary renders
- [ ] Switch to separating hyperplane → loads correctly
- [ ] Change variant → formula updates
- [ ] Run algorithm on each variant → all converge
- [ ] Switch to quadratic → no errors
- [ ] Switch to Rosenbrock → no errors
- [ ] All other problems work correctly

### Code Quality
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors in IDE
- [ ] No unused imports
- [ ] No dead code

### Architecture
- [ ] All problems use registry
- [ ] No hardcoded problem checks (except `isDatasetProblem()`)
- [ ] Special cases are justified (UI only)
- [ ] Documentation is complete
- [ ] Future path is clear (how to add new problems)

---

## Estimated Timeline

### Conservative (Safe) Approach
- **Phase 1:** 2 hours (type system + registry metadata)
- **Phase 2:** 3 hours (factory functions + testing)
- **Phase 3:** 2 hours (resolution function + helpers)
- **Phase 4:** 3 hours (UnifiedVisualizer integration + debugging)
- **Phase 5:** 2 hours (ProblemConfiguration updates)
- **Phase 6:** 1 hour (helper function docs)
- **Phase 7:** 4 hours (comprehensive testing)
- **Phase 8:** 2 hours (documentation + cleanup)
- **Total:** ~19 hours (~2.5 days)

### Aggressive (Fast) Approach
- **Phases 1-3:** 4 hours (type system + factories + resolution)
- **Phases 4-5:** 4 hours (integration, might have bugs)
- **Phases 6-8:** 3 hours (testing + docs, less thorough)
- **Total:** ~11 hours (~1.5 days)

### Recommended: Phased Delivery
- **Week 1:** Phases 1-3 (infrastructure ready, low risk)
- **Week 2:** Phases 4-5 (integration, test thoroughly)
- **Week 3:** Phases 6-8 (polish, documentation)

---

## Open Questions

1. **Should `isDatasetProblem()` use registry lookup?**
   - **Recommendation:** No - keep hardcoded for performance
   - Trade-off: Requires updating two places when adding dataset problems

2. **Should data canvas be abstracted into registry?**
   - **Recommendation:** Not yet - it's UI-specific
   - Future: Could add `dataUI` field to registry for custom components

3. **Should decision boundary rendering be generalized?**
   - **Recommendation:** Future work - create "overlay" system
   - Would enable constraint visualization, level sets, etc.

4. **Should 3D slice logic be part of registry metadata?**
   - **Recommendation:** Future work - add `visualizationStrategy` field
   - Currently acceptable as special case

---

## Notes

- This migration does NOT change algorithm behavior - pure refactoring
- Visual appearance should be IDENTICAL before/after
- Performance impact is negligible (registry lookups are fast)
- Rollback is straightforward (incremental changes)
- Future extensibility is dramatically improved

---

## Relationship to 3D-to-2D Conversion Plan

### Execution Order

**CRITICAL:** This plan **MUST be executed AFTER** the 3D-to-2D conversion plan:

1. **First:** Execute `docs/plans/2025-11-10-lr-sh-3d-to-2d-bias-parameter.md`
   - Converts LR/SH from 3D to 2D
   - Makes bias a parameter (not trained)
   - Removes all `dimensionality === 3` checks
   - Estimated: 12-16 hours

2. **Then:** Execute this plan (registry migration)
   - Adds factories to registry
   - Enables metadata-driven UI
   - Removes remaining special cases
   - Estimated: 12-16 hours (simplified by 3D removal)

### Why This Order?

**If you try to execute this plan before 3D conversion:**
- ❌ Much more complex (need to handle 3D weights in factories)
- ❌ More special cases to preserve (bias slice, dimensionality checks)
- ❌ Union types throughout (`[number, number] | [number, number, number]`)
- ❌ 2-3 days of work instead of 1.5-2 days

**After 3D conversion:**
- ✅ LR/SH are "just 2D problems with parameters" (like Rosenbrock)
- ✅ No dimensionality special cases
- ✅ Simpler factory signatures (just pass bias parameter)
- ✅ Cleaner code, less risk

### What the 3D Conversion Gives Us

The 3D-to-2D conversion makes LR/SH **much less special**, which simplifies this registry migration:

| Aspect | Before 3D Conversion | After 3D Conversion |
|--------|---------------------|---------------------|
| Weight vectors | `[w0, w1, w2]` | `[w0, w1]` |
| Bias | Part of weights (trained) | Parameter (configured) |
| Hessians | 3x3 matrices | 2x2 matrices |
| Initial points | Union type | Single type |
| Dimensionality checks | ~15 locations | 0 locations |
| Visualization | 2D slice of 3D space | Direct 2D |
| Factory complexity | High (handle 3D) | Low (just pass bias) |

### Combined Benefits

After **both** plans are complete:
- ✅ All problems in unified registry
- ✅ No 3D special casing anywhere
- ✅ Metadata-driven UI
- ✅ Bias is interactive parameter
- ✅ ~110 lines of special-case code removed total
- ✅ Easy to add new dataset problems
- ✅ Consistent architecture

---

## Approval

- [ ] Plan reviewed by team
- [ ] 3D-to-2D conversion completed FIRST
- [ ] Timeline approved
- [ ] Rollback plan understood
- [ ] Ready to execute

**Status:** PLANNED (pending 3D-to-2D conversion completion)
**Prerequisite:** docs/plans/2025-11-10-lr-sh-3d-to-2d-bias-parameter.md
**Next Step:** Wait for 3D conversion, then begin Phase 1 (Type System Extensions)
