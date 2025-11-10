# Dataset Problems: 3D → 2D Conversion with Bias as Parameter

**Date:** 2025-11-10
**Objective:** Convert Logistic Regression and Separating Hyperplane from 3D problems (trainable bias) to 2D problems (bias as configurable parameter)
**Status:** READY FOR IMPLEMENTATION
**Estimated Effort:** 8-12 hours in phases
**Prerequisite for:** Registry migration plan (2025-11-10-dataset-problems-registry-migration.md)

---

## Executive Summary

Currently, Logistic Regression (LR) and Separating Hyperplane (SH) treat bias as a **trainable parameter** `w[2]`, making them 3D optimization problems with weights `[w0, w1, w2]`. This creates ~15 special cases throughout the codebase for dimensionality checks, 3D slice visualization, and type unions.

**Goal:** Convert to 2D problems with weights `[w0, w1]` where bias is a **user-configurable parameter** (like Rosenbrock's `b` parameter).

**Why do this first:** Once 3D is removed, the registry migration becomes simpler because LR/SH will be "less special" - just regular 2D problems with extra parameters.

---

## Configuration

**Bias Parameter Specification:**
- **Type:** User-configurable slider
- **Range:** -3 to 3
- **Default:** 0
- **Step:** 0.1
- **Pattern:** Integrated into parametrized problems framework (like existing `rosenbrockB`, `rotationAngle`, etc.)

---

## Benefits

1. ✅ **Cleaner Math**: 2x2 Hessian instead of 3x3
2. ✅ **Type Safety**: No more union types `[number, number] | [number, number, number]`
3. ✅ **ML Convention**: Bias separate from feature weights (standard practice)
4. ✅ **Simpler Visualization**: No "2D slice of 3D space" at fixed bias value
5. ✅ **Removes ~80 lines** of 3D special-case logic across 23 files
6. ✅ **Interactive Boundary**: Decision boundary updates when user changes bias
7. ✅ **Extensible**: Sets pattern for future non-trainable parameters

---

## Architecture Changes

### Before (3D)
```typescript
// Weights: [w0, w1, w2] where w2 is trainable bias
objective([w0, w1, w2]) → loss
// Decision boundary: w0*x1 + w1*x2 + w2 = 0
// Visualization: 2D slice at fixed w2* from optimal solution
// dimensionality: 3
```

### After (2D + Parameter)
```typescript
// Weights: [w0, w1], bias as parameter
objective([w0, w1], bias=0.5) → loss
// Decision boundary: w0*x1 + w1*x2 + bias = 0
// Visualization: Native 2D (no slicing needed)
// dimensionality: 2
```

---

## Implementation Plan

### Phase 1: Core Logic - Update Objective Functions (CRITICAL)

These changes are the foundation - all other phases depend on this.

#### Task 1.1: Update Logistic Regression Functions
**File:** `src/utils/logisticRegression.ts`

**Changes:**
1. Add `bias: number` parameter to all 4 functions
2. Remove `w2` from weight destructuring (change `[w0, w1, w2]` → `[w0, w1]`)
3. Use `bias` parameter in computations instead of `w[2]`
4. Update regularization (already correct - excludes bias)
5. Update Hessian to return 2x2 instead of 3x3
6. Update gradient to return 2D array `[dw0, dw1]`

**Functions to update:**
- `logisticObjective(w, dataPoints, lambda)` → add `bias` param (Line 27)
- `logisticGradient(w, dataPoints, lambda)` → add `bias` param (Line 51)
- `logisticHessian(w, dataPoints, lambda)` → add `bias` param, return 2x2 (Line 79)
- `logisticLossAndGradient(w, dataPoints, lambda)` → add `bias` param (Line 120)

**Example change:**
```typescript
// BEFORE
export function logisticObjective(w: number[], dataPoints: DataPoint[], lambda: number): number {
  const [w0, w1, w2] = w;
  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;  // w2 from weights
    // ...
  }
  loss += (lambda / 2) * (w0 * w0 + w1 * w1);  // Already excludes bias
}

// AFTER
export function logisticObjective(w: number[], dataPoints: DataPoint[], lambda: number, bias: number): number {
  const [w0, w1] = w;  // Only 2D
  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + bias;  // bias from parameter
    // ...
  }
  loss += (lambda / 2) * (w0 * w0 + w1 * w1);  // Same - excludes bias
}
```

**Verification:**
- TypeScript compiles (will have errors in callers, fixed in later tasks)
- Math is correct: gradient/hessian match new 2D formulation
- Regularization still only applies to w0, w1 (not bias)

---

#### Task 1.2: Update Separating Hyperplane Functions
**File:** `src/utils/separatingHyperplane.ts`

**Changes:**
1. Update helper `computeZ()` to accept `bias` parameter (Line 27)
2. Update all 3 variants (soft-margin, perceptron, squared-hinge) to:
   - Add `bias` parameter to objective/gradient/hessian
   - Change weight destructuring to 2D
   - Pass `bias` to `computeZ()`
   - Update Hessian dimensions to 2x2

**Functions to update:**
- `computeZ(w, point)` → add `bias` param (Line 27)
- **Soft-Margin SVM** (Lines 35-77):
  - `softMarginObjective(w, dataPoints, lambda)` → add `bias`
  - `softMarginGradient(w, dataPoints, lambda)` → add `bias`
  - `softMarginHessian()` → return 2x2
- **Perceptron** (Lines 94-142):
  - `perceptronObjective(w, dataPoints, lambda)` → add `bias`
  - `perceptronGradient(w, dataPoints, lambda)` → add `bias`
  - `perceptronHessian(lambda)` → return 2x2
- **Squared-Hinge** (Lines 160-204):
  - `squaredHingeObjective(w, dataPoints, lambda)` → add `bias`
  - `squaredHingeGradient(w, dataPoints, lambda)` → add `bias`
  - `squaredHingeHessian(w, dataPoints, lambda)` → add `bias`, return 2x2

**Example:**
```typescript
// BEFORE
function computeZ(w: number[], point: DataPoint): number {
  const [w0, w1, w2] = w;
  return w0 * point.x1 + w1 * point.x2 + w2;
}

// AFTER
function computeZ(w: number[], point: DataPoint, bias: number): number {
  const [w0, w1] = w;
  return w0 * point.x1 + w1 * point.x2 + bias;
}
```

**Verification:**
- TypeScript compiles (with caller errors)
- All 3 variants updated consistently
- Math correct for each variant

---

#### Task 1.3: Update Problem Adapters
**File:** `src/utils/problemAdapter.ts`

**Changes:**
1. Add `bias` parameter to adapter functions
2. Update `dimensionality: 3` → `dimensionality: 2`
3. Pass `bias` to objective/gradient/hessian closures

**Functions to update:**
- `logisticRegressionToProblemFunctions(data, lambda)` → add `bias` param (Line 23)
- `separatingHyperplaneToProblemFunctions(data, variant, lambda)` → add `bias` param (Line 39)

**Example:**
```typescript
// BEFORE
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number
): ProblemFunctions {
  return {
    objective: (w: number[]) => logisticObjective(w, data, lambda),
    gradient: (w: number[]) => logisticGradient(w, data, lambda),
    hessian: (w: number[]) => logisticHessian(w, data, lambda),
    dimensionality: 3,  // ❌
  };
}

// AFTER
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number,
  bias: number
): ProblemFunctions {
  return {
    objective: (w: number[]) => logisticObjective(w, data, lambda, bias),
    gradient: (w: number[]) => logisticGradient(w, data, lambda, bias),
    hessian: (w: number[]) => logisticHessian(w, data, lambda, bias),
    dimensionality: 2,  // ✅
  };
}
```

**Verification:**
- TypeScript compiles (with caller errors)
- Both adapters return `dimensionality: 2`

---

### Phase 2: State Management & UnifiedVisualizer

#### Task 2.1: Add Bias State and Remove 3D Logic
**File:** `src/UnifiedVisualizer.tsx`

**Changes:**
1. **Add bias state** (around line 46-52 where lambda is):
   ```typescript
   const [bias, setBias] = useState<number>(0);
   ```

2. **Remove 3D global minimum storage** (Line 164-165):
   ```typescript
   // DELETE THIS:
   const [logisticGlobalMin, setLogisticGlobalMin] = useState<[number, number] | [number, number, number] | null>(null);

   // REPLACE WITH:
   const [logisticGlobalMin, setLogisticGlobalMin] = useState<[number, number] | null>(null);
   ```

3. **Remove biasSlice computation** (Lines 595-600):
   ```typescript
   // DELETE entire useMemo for biasSlice
   ```

4. **Remove 3D global minimum computation** (Lines 246-280):
   ```typescript
   // MODIFY useEffect to compute 2D global minimum only
   // Remove condition checking `lastIter.wNew.length >= 3`
   // Store only [w0, w1]:
   setLogisticGlobalMin([lastIter.wNew[0], lastIter.wNew[1]]);
   ```

5. **Update `getCurrentProblem()`** (Lines 173-215):
   ```typescript
   // Change from special-casing logistic-regression and separating-hyperplane
   // to passing bias through problemAdapter

   if (currentProblem === 'logistic-regression') {
     return {
       name: 'Logistic Regression',
       description: `Binary classification (λ=${lambda}, b=${bias})`,
       objective: (w: number[]) => logisticObjective(w, data, lambda, bias),  // Add bias
       gradient: (w: number[]) => logisticGradient(w, data, lambda, bias),
       hessian: (w: number[]) => logisticHessian(w, data, lambda, bias),
       domain: { w0: [-3, 3], w1: [-3, 3] },
       requiresDataset: true,
       dimensionality: 2,  // Changed from 3
     };
   }
   // Similar for separating-hyperplane
   ```

6. **Update `getCurrentProblemFunctions()`** (Lines 220-234):
   ```typescript
   // Pass bias to adapters
   if (currentProblem === 'logistic-regression') {
     return logisticRegressionToProblemFunctions(data, lambda, bias);  // Add bias
   } else if (currentProblem === 'separating-hyperplane') {
     return separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda, bias);  // Add bias
   }
   ```

7. **Remove 3D slice logic in visualization** (Lines 1308-1377):
   ```typescript
   // In drawParameterSpacePlot():
   // DELETE biasSlice extraction (lines 1309-1311)
   // DELETE check for problem.dimensionality === 3 (lines 1320-1322)
   // REPLACE WITH simple 2D call:
   const loss = problem.objective([w0, w1]);
   ```

**Verification:**
- TypeScript compiles
- No references to `biasSlice` remain
- All visualizations treat dataset problems as 2D
- `logisticGlobalMin` is always 2D tuple

---

#### Task 2.2: Update Problem Defaults
**File:** `src/utils/problemDefaults.ts`

**Changes:**
- Line 83: Change `initialPoint: [0.2, 0.2, 0]` → `initialPoint: [0.2, 0.2]`

**Verification:**
- TypeScript compiles
- separating-hyperplane defaults to 2D initial point

---

#### Task 2.3: Simplify Problem Helpers
**File:** `src/utils/problemHelpers.ts`

**Changes:**
- `constructInitialPoint()` (Lines 20-28):
  ```typescript
  // BEFORE
  export function constructInitialPoint(
    problemType: string,
    w0: number,
    w1: number
  ): [number, number] | [number, number, number] {
    return isDatasetProblem(problemType) ? [w0, w1, 0] : [w0, w1];
  }

  // AFTER
  export function constructInitialPoint(
    problemType: string,
    w0: number,
    w1: number
  ): [number, number] {
    return [w0, w1];  // Always 2D
  }
  ```

**Verification:**
- TypeScript compiles
- Function always returns 2D tuple
- No special casing for dataset problems

---

### Phase 3: Algorithm Files (Remove Dimensionality Checks)

#### Task 3.1: Update All Algorithm Files
**Files to update (5 files):**
1. `src/algorithms/gradient-descent.ts` (Lines 41-43)
2. `src/algorithms/newton.ts` (Lines 256-258)
3. `src/algorithms/lbfgs.ts` (Lines 83-85)
4. `src/algorithms/gradient-descent-linesearch.ts` (Lines 52-54)
5. `src/algorithms/diagonal-preconditioner.ts` (Lines 83, 108)

**Changes for each:**
```typescript
// BEFORE
let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];
```

**Additional for diagonal-preconditioner.ts (Line 108):**
```typescript
// BEFORE
const hessianDiagonal = problem.dimensionality === 3
  ? [H[0][0], H[1][1], H[2][2]]
  : [H[0][0], H[1][1]];

// AFTER
const hessianDiagonal = [H[0][0], H[1][1]];
```

**Verification:**
- TypeScript compiles
- All algorithms always use 2D initialization
- No `dimensionality === 3` checks remain

---

### Phase 4: UI Components (Remove 3D Special Casing)

#### Task 4.1: Update BasinPicker
**File:** `src/components/BasinPicker.tsx`

**Changes (Lines 472-496):**
1. Remove 3D dimensionality checks
2. Remove bias slice display
3. Always treat as 2D

```typescript
// DELETE these lines:
if (problemFuncs.dimensionality === 3) {
  onInitialPointChange([w0, w1, algorithmParams.biasSlice || 0]);
} else {
  onInitialPointChange([w0, w1]);
}

// REPLACE WITH:
onInitialPointChange([w0, w1]);

// DELETE bias display:
{problemFuncs.dimensionality === 3 && `, w₂ = ${(algorithmParams.biasSlice || 0).toFixed(3)}`}

// DELETE 2D slice notation UI:
{problemFuncs.dimensionality === 3 && isDatasetProblem(currentProblem) && (
  <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
    ...
  </div>
)}
```

**Verification:**
- TypeScript compiles
- BasinPicker always treats problems as 2D
- No bias slice UI shown

---

#### Task 4.2: Update AlgorithmConfiguration
**File:** `src/components/AlgorithmConfiguration.tsx`

**Changes (Lines 659-667):**
```typescript
// DELETE biasSlice parameter passing:
biasSlice: props.biasSlice

// DELETE from initialPoint:
initialPoint={[props.initialW0, props.initialW1, props.biasSlice || 0]}

// REPLACE WITH:
initialPoint={[props.initialW0, props.initialW1]}
```

**Verification:**
- TypeScript compiles
- AlgorithmConfiguration passes 2D initial points

---

#### Task 4.3: Update Algorithm Tab Files
**Files to update (5 files):**
1. `src/components/tabs/GdFixedTab.tsx` (Line 145)
2. `src/components/tabs/NewtonTab.tsx` (Line 146)
3. `src/components/tabs/LbfgsTab.tsx` (Line 133)
4. `src/components/tabs/GdLineSearchTab.tsx` (Line 121)
5. `src/components/tabs/DiagonalPrecondTab.tsx` (Line 145)

**Changes for each:**
Remove the "2D slice notation" display:
```typescript
// DELETE:
{problemFuncs.dimensionality === 3 && (
  <div className="text-xs text-gray-600 mt-1">
    2D slice: w₂ = {biasSlice.toFixed(3)} (bias from optimal)
  </div>
)}
```

**Verification:**
- TypeScript compiles
- No 2D slice notation shown in any tab

---

#### Task 4.4: Update Basin Computation
**File:** `src/utils/basinComputation.ts`

**Changes:**
1. Lines 63-66: Remove 3D handling in convergence location:
   ```typescript
   // BEFORE
   convergenceLoc: result.summary.finalLocation.length === 2
     ? (result.summary.finalLocation.slice(0, 2) as [number, number])
     : (result.summary.finalLocation.slice(0, 3) as [number, number, number]),

   // AFTER
   convergenceLoc: result.summary.finalLocation.slice(0, 2) as [number, number],
   ```

2. Lines 184-186: Remove 3D check:
   ```typescript
   // DELETE:
   if (problemFuncs.dimensionality === 3) {
     // Uses full 3D point for algorithm execution
   }
   ```

**Verification:**
- TypeScript compiles
- Basin computation always stores 2D convergence locations

---

### Phase 5: Type System Updates

#### Task 5.1: Update Type Definitions
**File:** `src/types/experiments.ts`

**Changes (Line 67-68):**
```typescript
// BEFORE
initialPoint?: [number, number] | [number, number, number];

// AFTER
initialPoint?: [number, number];
```

**Verification:**
- TypeScript compiles throughout entire codebase
- No more union types for initial points

---

### Phase 6: UI for Bias Parameter

#### Task 6.1: Add Bias Parameter to ProblemConfiguration
**File:** `src/components/ProblemConfiguration.tsx`

**Changes:**
Add bias slider for dataset problems (similar to lambda slider around lines 220-329):

```typescript
{isDatasetProblem(currentProblem) && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

    {/* Lambda slider - already exists */}

    {/* NEW: Bias slider */}
    <div className="mb-4">
      <h4 className="font-medium text-gray-700 mb-2">
        Bias (<InlineMath>b</InlineMath>)
      </h4>
      <input
        type="range"
        min={-3}
        max={3}
        step={0.1}
        value={bias}
        onChange={(e) => onBiasChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>-3</span>
        <span className="font-semibold">{bias.toFixed(1)}</span>
        <span>3</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Shifts the decision boundary. Positive values move it away from origin.
      </p>
    </div>
  </div>
)}
```

**Also need to:**
1. Add `bias` prop to ProblemConfiguration component interface
2. Add `onBiasChange` prop handler
3. Pass these from UnifiedVisualizer (where bias state lives)

**Verification:**
- Bias slider renders for logistic-regression and separating-hyperplane
- Changing slider updates bias state in UnifiedVisualizer
- Decision boundary updates interactively

---

### Phase 7: Educational Content Updates

#### Task 7.1: Update Logistic Regression Explainer
**File:** `src/problems/logisticRegression.tsx`

**Changes:**
Update educational content to explain bias as a parameter (around lines 10-50):

```typescript
// Update title (Line 10) - already says "2D Classification", keep it
// Update formula display to show bias explicitly (around Line 22):

<BlockMath>
  {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w_0 x_{i1} + w_1 x_{i2} + b)}) + \frac{\lambda}{2}(w_0^2 + w_1^2)`}
</BlockMath>

// Add explanation:
<p>
  <strong>Parameters:</strong>
</p>
<ul className="list-disc ml-5 space-y-1">
  <li>
    <InlineMath>w_0, w_1</InlineMath>: Feature weights (optimized during training)
  </li>
  <li>
    <InlineMath>b</InlineMath>: Bias term (configurable parameter, not trained)
  </li>
  <li>
    <InlineMath>\lambda</InlineMath>: Regularization strength (higher = simpler model)
  </li>
</ul>

<p>
  <strong>Note:</strong> The bias <InlineMath>b</InlineMath> is treated as a
  configuration parameter rather than a trainable weight. This is a common
  approach in ML that separates the decision boundary's orientation (controlled
  by <InlineMath>w_0, w_1</InlineMath>) from its position (controlled by <InlineMath>b</InlineMath>).
  Regularization is applied only to feature weights, not the bias.
</p>
```

**Verification:**
- Explainer clearly distinguishes trainable vs configurable parameters
- Formula shows bias explicitly

---

#### Task 7.2: Update Separating Hyperplane Explainer
**File:** `src/problems/separatingHyperplane.tsx`

**Changes:**
Update notation and explanations (around lines 26-50):

```typescript
// Update the "Notation" section (Lines 26-28):
// BEFORE:
<p>
  <strong>Notation:</strong> We optimize <InlineMath>w = [w_0, w_1, w_2]</InlineMath>
</p>

// AFTER:
<p>
  <strong>Notation:</strong> We optimize <InlineMath>w = [w_0, w_1]</InlineMath> (feature weights)
  with bias <InlineMath>b</InlineMath> as a configurable parameter.
</p>

// Update decision boundary formula (Line 38):
// BEFORE:
<InlineMath>z = w_0 x_1 + w_1 x_2 + w_2</InlineMath>

// AFTER:
<InlineMath>z = w_0 x_1 + w_1 x_2 + b</InlineMath>

// Add clarification about bias:
<p className="text-sm text-gray-600 bg-blue-50 rounded p-2 mt-2">
  <strong>Why separate bias?</strong> In ML, bias is often treated separately
  from feature weights because it has a different geometric meaning: feature
  weights <InlineMath>w_0, w_1</InlineMath> control the hyperplane's orientation,
  while bias <InlineMath>b</InlineMath> controls its position. Regularization
  typically applies only to feature weights to avoid penalizing the boundary's location.
</p>
```

**Verification:**
- Explainer uses `b` for bias, not `w_2`
- Clear explanation of why bias is separate
- All formulas updated consistently

---

### Phase 8: Integration Testing & Cleanup

#### Task 8.1: Manual Integration Testing
**Test protocol:**

1. **Logistic Regression:**
   - [ ] Load page, select "Logistic Regression"
   - [ ] Verify bias slider shows (range -3 to 3, default 0)
   - [ ] Lambda slider works
   - [ ] Data canvas displays with crescent data
   - [ ] Click to add points - works
   - [ ] Change bias to 1.0 - decision boundary shifts
   - [ ] Change bias to -1.0 - decision boundary shifts opposite direction
   - [ ] Run GD Fixed (α=0.1, 50 iters) - converges to 2D solution
   - [ ] Run Newton - converges faster
   - [ ] Verify Hessian visualization shows 2x2 matrix (not 3x3)
   - [ ] Change lambda to 5.0 - problem updates
   - [ ] Decision boundary renders correctly
   - [ ] NO "2D slice notation" displayed anywhere
   - [ ] Switch to quadratic - no errors

2. **Separating Hyperplane:**
   - [ ] Select "Separating Hyperplane"
   - [ ] Bias slider shows
   - [ ] Variant dropdown shows 3 options
   - [ ] Default is "Soft Margin SVM"
   - [ ] Change variant to "Perceptron" - formula updates
   - [ ] Change bias - boundary shifts
   - [ ] Lambda slider works
   - [ ] Run algorithm - converges to 2D solution
   - [ ] Hessian is 2x2
   - [ ] Decision boundary renders
   - [ ] Change variant to "Squared Hinge" - works
   - [ ] NO "2D slice notation" shown
   - [ ] Switch back to logistic - no errors

3. **Non-Dataset Problems:**
   - [ ] Select "Quadratic" - no regression
   - [ ] Select "Rosenbrock" - no regression
   - [ ] All algorithms run successfully
   - [ ] Switch between all problems - no console errors

**Create test checklist file:**
Write results to `docs/testing/2025-11-10-dataset-2d-conversion-test-results.md`

---

#### Task 8.2: Code Cleanup
**Search for and remove:**

1. Search codebase for `dimensionality === 3`:
   ```bash
   grep -r "dimensionality === 3" src/
   ```
   Verify all occurrences removed.

2. Search for `biasSlice`:
   ```bash
   grep -r "biasSlice" src/
   ```
   Verify all occurrences removed (except in comments explaining the change).

3. Search for `[number, number, number]` type:
   ```bash
   grep -r "\[number, number, number\]" src/
   ```
   Verify all unions with `[number, number]` removed.

4. Search for `w[2]` or `w2` in context of bias:
   ```bash
   grep -r "w\[2\]" src/utils/logistic
   grep -r "w\[2\]" src/utils/separating
   ```
   Verify all replaced with `bias` parameter.

5. Run linter:
   ```bash
   npm run lint
   ```
   Fix any warnings about unused variables/imports.

6. Run type checker:
   ```bash
   npm run type-check
   ```
   Verify no TypeScript errors.

**Document cleanup:**
Create `docs/cleanup/2025-11-10-3d-removal-verification.md` with results.

---

#### Task 8.3: Update This Plan's Status
**File:** `docs/plans/2025-11-10-dataset-problems-2d-bias-parameter.md`

**Changes:**
- Update status from "READY FOR IMPLEMENTATION" → "COMPLETED"
- Add completion date
- Add summary of changes
- Link to test results and cleanup verification docs

---

## Files Changed Summary

### Core Logic (Phase 1)
- `src/utils/logisticRegression.ts` - 4 functions updated
- `src/utils/separatingHyperplane.ts` - 9 functions updated (3 variants × 3 each)
- `src/utils/problemAdapter.ts` - 2 adapters updated

### State Management (Phase 2)
- `src/UnifiedVisualizer.tsx` - Major refactoring, ~100 lines changed
- `src/utils/problemDefaults.ts` - 1 line changed
- `src/utils/problemHelpers.ts` - Function simplified

### Algorithms (Phase 3)
- `src/algorithms/gradient-descent.ts` - 1 check removed
- `src/algorithms/newton.ts` - 1 check removed
- `src/algorithms/lbfgs.ts` - 1 check removed
- `src/algorithms/gradient-descent-linesearch.ts` - 1 check removed
- `src/algorithms/diagonal-preconditioner.ts` - 2 checks removed

### UI Components (Phase 4)
- `src/components/BasinPicker.tsx` - 3D logic removed
- `src/components/AlgorithmConfiguration.tsx` - Bias param passing removed
- `src/components/tabs/GdFixedTab.tsx` - Notation removed
- `src/components/tabs/NewtonTab.tsx` - Notation removed
- `src/components/tabs/LbfgsTab.tsx` - Notation removed
- `src/components/tabs/GdLineSearchTab.tsx` - Notation removed
- `src/components/tabs/DiagonalPrecondTab.tsx` - Notation removed
- `src/utils/basinComputation.ts` - 3D handling removed

### Types (Phase 5)
- `src/types/experiments.ts` - Union type removed

### UI Parameters (Phase 6)
- `src/components/ProblemConfiguration.tsx` - Bias slider added

### Educational (Phase 7)
- `src/problems/logisticRegression.tsx` - Explainer updated
- `src/problems/separatingHyperplane.tsx` - Explainer updated

**Total: 23 files modified**

---

## Success Criteria

### Functional Requirements
- ✅ LR and SH use 2D weights `[w0, w1]`
- ✅ Bias is user-configurable parameter (-3 to 3, default 0)
- ✅ All algorithms work with 2D problems
- ✅ Decision boundary updates when bias changes
- ✅ Hessian is 2x2 for Newton's method
- ✅ No "2D slice" visualization needed
- ✅ Educational content explains bias as parameter

### Code Quality
- ✅ No `dimensionality === 3` checks remain
- ✅ No `biasSlice` references remain
- ✅ No `[number, number] | [number, number, number]` union types
- ✅ TypeScript compiles with no errors
- ✅ Linter passes with no warnings
- ✅ All manual tests pass

### Architecture
- ✅ Cleaner separation: trainable (w0, w1) vs configurable (bias, lambda)
- ✅ Consistent with ML conventions
- ✅ Simpler visualization (native 2D)
- ✅ Sets pattern for future parameter-based problems
- ✅ Prerequisite complete for registry migration

---

## Risk Mitigation

### High Risk: UnifiedVisualizer Refactoring
**Risk:** Many interconnected changes in visualization logic
**Mitigation:**
- Test visualization after Task 2.1
- Verify contour plots render correctly
- Check decision boundary still displays

### Medium Risk: Algorithm Behavior Changes
**Risk:** 2x2 Hessian may behave differently than 3x3
**Mitigation:**
- Compare convergence before/after on same dataset
- Verify Newton's method still converges
- Check eigenvalues of 2x2 Hessian are reasonable

### Low Risk: Type Errors
**Risk:** Removing union types may cause errors
**Mitigation:**
- Run type-check after each phase
- Fix errors before moving to next phase

---

## Next Steps After Completion

Once this plan is complete:

1. **Registry Migration** (`docs/plans/2025-11-10-dataset-problems-registry-migration.md`)
   - Will be simpler now that LR/SH are 2D
   - Add `datasetFactory` with bias parameter
   - No need for `dimensionality` metadata (default 2)

2. **Factory Functions**
   - Create `createLogisticRegressionProblem(lambda, bias, dataset)`
   - Create `createSeparatingHyperplaneProblem(variant, lambda, bias, dataset)`

3. **Registry Integration**
   - Add bias to `parameters` array in registry
   - Auto-render bias slider from metadata
   - Full unification with other problems

---

## Rollback Plan

If issues arise, rollback is straightforward:

```bash
# Find commit before this work started
git log --oneline | grep "Start 2D conversion" | head -1

# Revert all changes
git revert <commit-hash>..HEAD --no-commit
git commit -m "Rollback: 2D conversion - revert to 3D approach"
```

Or revert individual phases:
- Phase 1: Revert core logic changes
- Phase 2-4: Revert state/UI changes
- Phase 5-8: Revert types/docs/tests

---

## Notes

- This is pure refactoring - no algorithm behavior changes intended
- Visual appearance should be nearly identical (minus 2D slice notation)
- Performance impact negligible (one fewer dimension in arrays)
- Bias slider adds new interactivity (feature, not regression)
- Sets foundation for cleaner registry integration

---

## Approval

- [x] Plan reviewed
- [x] Architecture approved
- [x] Ready to execute with subagent-driven development

**Status:** READY FOR IMPLEMENTATION
**Next Step:** Begin Phase 1, Task 1.1
