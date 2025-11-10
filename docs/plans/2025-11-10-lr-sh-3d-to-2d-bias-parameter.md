# Logistic Regression & Separating Hyperplane: 3D to 2D Conversion with Bias as Parameter

**Date:** 2025-11-10
**Objective:** Convert LR and SH from 3D problems (trainable bias) to 2D problems (bias as configurable parameter)
**Status:** PLANNED
**Estimated Effort:** 12-16 hours (4-5 days phased execution with reviews)

---

## Executive Summary

Currently, Logistic Regression (LR) and Separating Hyperplane (SH) are implemented as **3D optimization problems** with weights `[w0, w1, w2]` where `w2` is the trainable bias term. This creates complexity throughout the codebase with 15+ locations checking for `dimensionality === 3` and special visualization logic for "2D slices of 3D space."

This plan converts these to **2D optimization problems** with weights `[w0, w1]` where bias is a **user-configurable parameter** (range: -3 to 3, default: 0), similar to how Rosenbrock has a configurable `b` parameter.

**Key Benefits:**
- ✅ Cleaner math: 2x2 Hessian instead of 3x3
- ✅ Type safety: No more union types `[number, number] | [number, number, number]`
- ✅ ML convention: Bias separate from feature weights (aligns with standard practice)
- ✅ Simpler visualization: No "2D slice of 3D space" confusion
- ✅ Removes ~80 lines of 3D special-case logic
- ✅ Extensible: Sets pattern for future non-trainable parameters
- ✅ Easier registry migration: Makes LR/SH "less special" for future integration

**This work is a prerequisite for the registry migration plan** - once 3D is removed, LR/SH become simpler to integrate into the unified registry system.

---

## Current State Analysis

### Current Architecture

**3D Implementation:**
```typescript
// Weights include bias as trainable parameter
w = [w0, w1, w2]  // w0, w1 = feature weights, w2 = bias

// Decision boundary: w0*x1 + w1*x2 + w2 = 0
const z = w0 * point.x1 + w1 * point.x2 + w2;

// Regularization: Only w0, w1 regularized (bias excluded)
loss += (lambda / 2) * (w0*w0 + w1*w1);  // w2 NOT included

// Visualization: Compute 2D slice at optimal w2*
biasSlice = logisticGlobalMin[2];  // Extract optimal bias
loss_2d[i,j] = objective([w0_i, w1_j, biasSlice]);
```

### Files with 3D Special Casing

**Core Logic (2 files):**
1. `src/utils/logisticRegression.ts` - 4 functions with 3D weights
2. `src/utils/separatingHyperplane.ts` - 9 functions (3 variants × 3 functions each)

**Adapters (1 file):**
3. `src/utils/problemAdapter.ts` - Sets `dimensionality: 3`

**State Management (3 files):**
4. `src/UnifiedVisualizer.tsx` - 3D state, bias slice computation, visualization
5. `src/utils/problemDefaults.ts` - 3D initial points
6. `src/utils/problemHelpers.ts` - 3D initial point construction

**Algorithms (5 files):**
7. `src/algorithms/gradient-descent.ts`
8. `src/algorithms/newton.ts`
9. `src/algorithms/lbfgs.ts`
10. `src/algorithms/gradient-descent-linesearch.ts`
11. `src/algorithms/diagonal-preconditioner.ts`

**UI Components (7 files):**
12. `src/components/BasinPicker.tsx`
13. `src/components/AlgorithmConfiguration.tsx`
14. `src/components/tabs/GdFixedTab.tsx`
15. `src/components/tabs/NewtonTab.tsx`
16. `src/components/tabs/LbfgsTab.tsx`
17. `src/components/tabs/GdLineSearchTab.tsx`
18. `src/components/tabs/DiagonalPrecondTab.tsx`

**Support Files (2 files):**
19. `src/utils/basinComputation.ts`
20. `src/types/experiments.ts`

**Problem Definitions (2 files):**
21. `src/problems/logisticRegression.tsx`
22. `src/problems/separatingHyperplane.tsx`

**Registry (1 file):**
23. `src/problems/registry.ts`

**Total: 23 files requiring changes**

---

## Target Architecture

### 2D Implementation with Bias Parameter

```typescript
// Weights are 2D only
w = [w0, w1]  // Feature weights only

// Bias is a separate configuration parameter
bias: number  // User-configurable, range [-3, 3], default 0

// Decision boundary: w0*x1 + w1*x2 + bias = 0
const z = w0 * point.x1 + w1 * point.x2 + bias;

// Regularization: Same as before (only feature weights)
loss += (lambda / 2) * (w0*w0 + w1*w1);

// Visualization: Direct 2D computation (no slicing)
loss_2d[i,j] = objective([w0_i, w1_j]);  // Uses current bias from state
```

### Bias Parameter Specification

Following the parametrized problems pattern (like Rosenbrock's `b`):

```typescript
{
  key: 'bias',
  label: 'Bias (b)',
  type: 'range',
  min: -3,
  max: 3,
  step: 0.1,
  default: 0,
  scale: 'linear',
  description: 'Bias term for decision boundary (shifts hyperplane perpendicular to normal)'
}
```

**User Interaction:**
- Slider in ProblemConfiguration (like lambda slider)
- Changes trigger problem recreation (new objective function with new bias)
- Decision boundary updates interactively as bias changes
- Initial value: 0 (matches current default initialization)

---

## Implementation Plan

### Phase 1: Core Logic - Update Objective Functions (2D Weights)

**Files:**
- `src/utils/logisticRegression.ts`
- `src/utils/separatingHyperplane.ts`
- `src/utils/problemAdapter.ts`

**Changes:**

#### Task 1.1: Update Logistic Regression Functions

**File:** `src/utils/logisticRegression.ts`

Update all 4 functions to accept 2D weights + bias parameter:

```typescript
// BEFORE
export function logisticObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number {
  const [w0, w1, w2] = w;
  // ... w2 used as bias
}

// AFTER
export function logisticObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number,
  bias: number
): number {
  const [w0, w1] = w;
  // ... bias parameter used instead of w[2]
}
```

**Functions to update:**
1. `logisticObjective` (Lines 27-46)
2. `logisticGradient` (Lines 51-74) - Returns `[dw0, dw1]` (2D)
3. `logisticHessian` (Lines 79-114) - Returns 2x2 matrix
4. `logisticLossAndGradient` (Lines 120-148)

**Key changes:**
- Destructure only `[w0, w1]` from weights array
- Add `bias: number` parameter to all function signatures
- Use `bias` parameter instead of `w[2]` in `z` computation
- Gradient returns 2-element array (no bias gradient)
- Hessian returns 2x2 matrix (was 3x3)
- Update JSDoc comments to reflect 2D weights

**Success Criteria:**
- ✅ All functions accept `bias` parameter
- ✅ All functions use 2D weight arrays
- ✅ Hessian is 2x2 (not 3x3)
- ✅ TypeScript compiles without errors
- ✅ No references to `w[2]` or `w2` as bias

#### Task 1.2: Update Separating Hyperplane Functions

**File:** `src/utils/separatingHyperplane.ts`

Update `computeZ` helper and all 9 variant functions:

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

**Functions to update (3 variants × 3 functions each):**

**Soft-Margin SVM:**
1. `softMarginObjective` (Lines 35-46)
2. `softMarginGradient` (Lines 51-74)
3. `softMarginHessian` (Lines 79-93) - Return constant 2x2

**Perceptron:**
4. `perceptronObjective` (Lines 94-106)
5. `perceptronGradient` (Lines 111-133)
6. `perceptronHessian` (Lines 138-142) - Return constant 2x2

**Squared-Hinge:**
7. `squaredHingeObjective` (Lines 160-171)
8. `squaredHingeGradient` (Lines 176-201)
9. `squaredHingeHessian` (Lines 206-240) - Compute 2x2 dynamic Hessian

**Key changes:**
- Add `bias: number` parameter to all 9 functions
- Update `computeZ` to accept bias
- Pass bias to `computeZ` in all calls
- Gradient returns 2-element array
- Hessian returns 2x2 matrix
- Update comments

**Success Criteria:**
- ✅ All 9 functions accept `bias` parameter
- ✅ `computeZ` helper uses bias parameter
- ✅ All Hessians are 2x2
- ✅ TypeScript compiles
- ✅ No references to `w[2]`

#### Task 1.3: Update Problem Adapters

**File:** `src/utils/problemAdapter.ts`

Update both adapter functions to accept bias and set `dimensionality: 2`:

```typescript
// BEFORE
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number
): ProblemFunctions {
  return {
    objective: (w) => logisticObjective(w, data, lambda),
    gradient: (w) => logisticGradient(w, data, lambda),
    hessian: (w) => logisticHessian(w, data, lambda),
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
    objective: (w) => logisticObjective(w, data, lambda, bias),
    gradient: (w) => logisticGradient(w, data, lambda, bias),
    hessian: (w) => logisticHessian(w, data, lambda, bias),
    dimensionality: 2,  // ✅
  };
}
```

**Functions to update:**
1. `logisticRegressionToProblemFunctions` (Lines 23-33)
2. `separatingHyperplaneToProblemFunctions` (Lines 39-67)

**Success Criteria:**
- ✅ Both functions accept `bias: number` parameter
- ✅ Both pass bias to objective/gradient/hessian
- ✅ Both set `dimensionality: 2`
- ✅ TypeScript compiles
- ✅ Function signatures updated

**Phase 1 Completion Criteria:**
- ✅ All core functions use 2D weights
- ✅ All functions accept bias parameter
- ✅ All Hessians are 2x2
- ✅ Adapters set `dimensionality: 2`
- ✅ TypeScript compiles without errors
- ✅ No references to 3D weights in core logic

---

### Phase 2: State Management - Add Bias State

**Files:**
- `src/UnifiedVisualizer.tsx`
- `src/utils/problemDefaults.ts`
- `src/utils/problemHelpers.ts`

**Changes:**

#### Task 2.1: Add Bias State to UnifiedVisualizer

**File:** `src/UnifiedVisualizer.tsx`

**Add bias state variable:**
```typescript
// Add after lambda state (around Line 46)
const [bias, setBias] = useState<number>(0);
```

**Remove 3D global minimum state:**
```typescript
// BEFORE (Line 164-165)
const [logisticGlobalMin, setLogisticGlobalMin] = useState<
  [number, number] | [number, number, number] | null
>(null);

// AFTER
const [logisticGlobalMin, setLogisticGlobalMin] = useState<
  [number, number] | null
>(null);
```

**Update global minimum computation:**
```typescript
// In useEffect (Lines 246-280)
// Remove 3D handling, store only 2D:
if (lastIter.wNew.length >= 2) {
  setLogisticGlobalMin([lastIter.wNew[0], lastIter.wNew[1]]);
}
```

**Remove bias slice computation:**
```typescript
// DELETE Lines 595-600
// const biasSlice = React.useMemo(() => { ... }, []);
// No longer needed - bias comes from state
```

**Update getCurrentProblem:**
```typescript
// Lines 173-215
const getCurrentProblem = useCallback(() => {
  if (currentProblem === 'logistic-regression') {
    return {
      name: 'Logistic Regression',
      description: 'Binary classification with L2 regularization',
      objective: (w: number[]) => logisticObjective(w, data, lambda, bias),  // Add bias
      gradient: (w: number[]) => logisticGradient(w, data, lambda, bias),
      hessian: (w: number[]) => logisticHessian(w, data, lambda, bias),
      domain: { w0: [-3, 3], w1: [-3, 3] },
      requiresDataset: true,
      dimensionality: 2,  // Change from 3
    };
  } else if (currentProblem === 'separating-hyperplane') {
    const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(
      data,
      separatingHyperplaneVariant,
      lambda,
      bias  // Add bias
    );
    return {
      name: 'Separating Hyperplane',
      description: `Separating hyperplane (${separatingHyperplaneVariant})`,
      objective, gradient, hessian,
      domain: { w0: [-3, 3], w1: [-3, 3] },
      requiresDataset: true,
      dimensionality: 2,  // Change from 3
    };
  }
  // ... rest unchanged
}, [currentProblem, data, lambda, bias, problemParameters, separatingHyperplaneVariant]);
```

**Update getCurrentProblemFunctions similarly.**

**Update drawParameterSpacePlot - Remove 3D slicing:**
```typescript
// Lines 1308-1377
// BEFORE (Lines 1308-1322)
const biasSlice: number = ((currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
  && logisticGlobalMin && logisticGlobalMin.length >= 3)
  ? (logisticGlobalMin as [number, number, number])[2]
  : 0;

for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const loss = problem.dimensionality === 3
      ? problem.objective([w0, w1, biasSlice])
      : problem.objective([w0, w1]);
  }
}

// AFTER
for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const loss = problem.objective([w0, w1]);  // Always 2D
  }
}
```

**Success Criteria:**
- ✅ `bias` state variable added
- ✅ Global minimum stored as 2D only
- ✅ Bias slice logic removed
- ✅ `getCurrentProblem` passes bias to functions
- ✅ `getCurrentProblemFunctions` passes bias
- ✅ Visualization uses direct 2D objective (no slicing)
- ✅ TypeScript compiles
- ✅ No references to `biasSlice` or 3D global min

#### Task 2.2: Update Problem Defaults

**File:** `src/utils/problemDefaults.ts`

Change separating-hyperplane initial point from 3D to 2D:

```typescript
// Lines 79-95
case 'separating-hyperplane':
  return {
    gdFixedAlpha: 0.1,
    maxIter: 50,
    initialPoint: [0.2, 0.2],  // Was: [0.2, 0.2, 0]
    c1: 1e-4,
    lbfgsM: 10,
  };
```

**Success Criteria:**
- ✅ Initial point is 2D `[0.2, 0.2]`
- ✅ TypeScript compiles

#### Task 2.3: Update Problem Helpers

**File:** `src/utils/problemHelpers.ts`

Simplify `constructInitialPoint` to always return 2D:

```typescript
// Lines 20-28
// BEFORE
export function constructInitialPoint(
  problemType: string,
  w0: number,
  w1: number
): [number, number] | [number, number, number] {
  return isDatasetProblem(problemType)
    ? [w0, w1, 0]
    : [w0, w1];
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

**Success Criteria:**
- ✅ Return type is `[number, number]` only
- ✅ Always returns 2D array
- ✅ No special case for dataset problems
- ✅ TypeScript compiles

**Phase 2 Completion Criteria:**
- ✅ Bias state managed in UnifiedVisualizer
- ✅ 3D global minimum logic removed
- ✅ Bias slice logic removed
- ✅ All initial points are 2D
- ✅ Helper functions simplified
- ✅ TypeScript compiles without errors

---

### Phase 3: Algorithm Updates - Remove 3D Checks

**Files:**
- `src/algorithms/gradient-descent.ts`
- `src/algorithms/newton.ts`
- `src/algorithms/lbfgs.ts`
- `src/algorithms/gradient-descent-linesearch.ts`
- `src/algorithms/diagonal-preconditioner.ts`

**Changes:**

#### Task 3.1: Update Gradient Descent

**File:** `src/algorithms/gradient-descent.ts`

```typescript
// Lines 41-43
// BEFORE
let w = initialPoint || (problem.dimensionality === 3
  ? [0.1, 0.1, 0.0]
  : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];
```

**Success Criteria:**
- ✅ Removed `dimensionality === 3` check
- ✅ Always uses 2D default
- ✅ TypeScript compiles

#### Task 3.2: Update Newton's Method

**File:** `src/algorithms/newton.ts`

```typescript
// Lines 256-258
// BEFORE
let w = initialPoint || (problem.dimensionality === 3
  ? [0.1, 0.1, 0.0]
  : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];
```

**Success Criteria:**
- ✅ Removed `dimensionality === 3` check
- ✅ Always uses 2D default
- ✅ TypeScript compiles

#### Task 3.3: Update L-BFGS

**File:** `src/algorithms/lbfgs.ts`

```typescript
// Lines 83-85
// BEFORE
let w = initialPoint || (problem.dimensionality === 3
  ? [0.1, 0.1, 0.0]
  : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];
```

**Success Criteria:**
- ✅ Removed `dimensionality === 3` check
- ✅ Always uses 2D default
- ✅ TypeScript compiles

#### Task 3.4: Update Gradient Descent with Line Search

**File:** `src/algorithms/gradient-descent-linesearch.ts`

```typescript
// Lines 52-54
// BEFORE
let w = initialPoint || (problem.dimensionality === 3
  ? [0.1, 0.1, 0.0]
  : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];
```

**Success Criteria:**
- ✅ Removed `dimensionality === 3` check
- ✅ Always uses 2D default
- ✅ TypeScript compiles

#### Task 3.5: Update Diagonal Preconditioner

**File:** `src/algorithms/diagonal-preconditioner.ts`

```typescript
// Line 83
// BEFORE
let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

// AFTER
let w = initialPoint || [0.1, 0.1];

// Line 108 - Remove Hessian diagonal extraction check
// BEFORE
const hessianDiagonal = problem.dimensionality === 3
  ? [H[0][0], H[1][1], H[2][2]]
  : [H[0][0], H[1][1]];

// AFTER
const hessianDiagonal = [H[0][0], H[1][1]];
```

**Success Criteria:**
- ✅ Removed initial point `dimensionality === 3` check
- ✅ Removed Hessian diagonal `dimensionality === 3` check
- ✅ Always uses 2D
- ✅ TypeScript compiles

**Phase 3 Completion Criteria:**
- ✅ All 5 algorithm files updated
- ✅ No references to `dimensionality === 3`
- ✅ All default to 2D initial points
- ✅ TypeScript compiles without errors
- ✅ Algorithms work with 2D problems

---

### Phase 4: UI Components - Remove 3D Special Casing

**Files:**
- `src/components/BasinPicker.tsx`
- `src/components/AlgorithmConfiguration.tsx`
- `src/components/tabs/GdFixedTab.tsx`
- `src/components/tabs/NewtonTab.tsx`
- `src/components/tabs/LbfgsTab.tsx`
- `src/components/tabs/GdLineSearchTab.tsx`
- `src/components/tabs/DiagonalPrecondTab.tsx`
- `src/utils/basinComputation.ts`

**Changes:**

#### Task 4.1: Update BasinPicker

**File:** `src/components/BasinPicker.tsx`

Remove 3D handling and bias slice display:

```typescript
// Lines 472-488
// BEFORE
if (problemFuncs.dimensionality === 3) {
  onInitialPointChange([w0, w1, algorithmParams.biasSlice || 0]);
} else {
  onInitialPointChange([w0, w1]);
}

// Display
Current: w₀ = {initialPoint[0].toFixed(3)}, w₁ = {initialPoint[1].toFixed(3)}
{problemFuncs.dimensionality === 3 && `, w₂ = ${(algorithmParams.biasSlice || 0).toFixed(3)}`}

// AFTER
onInitialPointChange([w0, w1]);  // Always 2D

// Display
Current: w₀ = {initialPoint[0].toFixed(3)}, w₁ = {initialPoint[1].toFixed(3)}
```

```typescript
// Lines 491-496 - Remove 2D slice notation display
// DELETE this entire section
{problemFuncs.dimensionality === 3 && isDatasetProblem(currentProblem) && (
  <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
    <span className="font-medium">2D slice:</span>
    w₂ = {(algorithmParams.biasSlice || 0).toFixed(3)} (bias from optimal solution)
  </div>
)}
```

**Success Criteria:**
- ✅ Always calls `onInitialPointChange` with 2D array
- ✅ Removed 3D display logic
- ✅ Removed "2D slice notation" display
- ✅ TypeScript compiles
- ✅ UI displays only w₀ and w₁

#### Task 4.2: Update AlgorithmConfiguration

**File:** `src/components/AlgorithmConfiguration.tsx`

Remove bias parameter passing (now comes from problem state):

```typescript
// Lines 659-667
// BEFORE
biasSlice: props.biasSlice

initialPoint={[props.initialW0, props.initialW1, props.biasSlice || 0]}
onInitialPointChange={(point) => {
  props.onInitialW0Change(point[0]);
  props.onInitialW1Change(point[1]);
}}

// AFTER
initialPoint={[props.initialW0, props.initialW1]}
onInitialPointChange={(point) => {
  props.onInitialW0Change(point[0]);
  props.onInitialW1Change(point[1]);
}}
```

**Success Criteria:**
- ✅ Removed `biasSlice` prop passing
- ✅ Initial point always 2D
- ✅ TypeScript compiles

#### Task 4.3: Update Algorithm Tabs (5 files)

**Files:**
- `src/components/tabs/GdFixedTab.tsx` (Line 145)
- `src/components/tabs/NewtonTab.tsx` (Line 146)
- `src/components/tabs/LbfgsTab.tsx` (Line 133)
- `src/components/tabs/GdLineSearchTab.tsx` (Line 121)
- `src/components/tabs/DiagonalPrecondTab.tsx` (Line 145)

Remove "2D slice notation" displays:

```typescript
// BEFORE (pattern in all 5 files)
{problemFuncs.dimensionality === 3 && (
  <div className="text-xs text-gray-500 mt-1">
    Note: Showing 2D slice at w₂ = {biasSlice.toFixed(3)} (bias from optimal)
  </div>
)}

// AFTER
// DELETE - No longer needed
```

**Success Criteria:**
- ✅ All 5 tab files updated
- ✅ No "2D slice notation" displays
- ✅ TypeScript compiles
- ✅ UI displays correctly

#### Task 4.4: Update Basin Computation

**File:** `src/utils/basinComputation.ts`

Remove 3D handling in convergence location:

```typescript
// Lines 63-66
// BEFORE
convergenceLoc: result.summary.finalLocation.length === 2
  ? (result.summary.finalLocation.slice(0, 2) as [number, number])
  : (result.summary.finalLocation.slice(0, 3) as [number, number, number]),

// AFTER
convergenceLoc: result.summary.finalLocation.slice(0, 2) as [number, number],
```

```typescript
// Lines 184-186
// BEFORE
if (problemFuncs.dimensionality === 3) {
  // 3D handling
}

// AFTER
// DELETE - Always 2D
```

**Success Criteria:**
- ✅ Always stores 2D convergence location
- ✅ Removed `dimensionality === 3` check
- ✅ TypeScript compiles

**Phase 4 Completion Criteria:**
- ✅ All UI components updated
- ✅ No "2D slice notation" displays
- ✅ No `biasSlice` references
- ✅ Basin computation simplified
- ✅ TypeScript compiles without errors
- ✅ UI renders correctly

---

### Phase 5: Type System Updates

**Files:**
- `src/types/experiments.ts`

**Changes:**

#### Task 5.1: Update Type Definitions

**File:** `src/types/experiments.ts`

Update initial point type from union to single type:

```typescript
// Line 67
// BEFORE
initialPoint?: [number, number] | [number, number, number];

// AFTER
initialPoint?: [number, number];
```

**Success Criteria:**
- ✅ Type is single `[number, number]` (not union)
- ✅ TypeScript compiles across entire codebase
- ✅ No type errors in any file

**Phase 5 Completion Criteria:**
- ✅ Type system reflects 2D-only architecture
- ✅ No union types for initial points
- ✅ Full codebase compiles
- ✅ No type errors

---

### Phase 6: Add Bias Parameter UI

**Files:**
- `src/UnifiedVisualizer.tsx`
- `src/components/ProblemConfiguration.tsx`

**Changes:**

#### Task 6.1: Add Bias Slider to ProblemConfiguration

**File:** `src/components/ProblemConfiguration.tsx`

Add bias slider similar to lambda slider:

```typescript
// After lambda slider section (around Line 250)
{isDatasetProblem(currentProblem) && (
  <div className="mt-3">
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
      Shifts the decision boundary perpendicular to the normal vector
    </p>
  </div>
)}
```

**Update component props:**
```typescript
interface ProblemConfigurationProps {
  // ... existing props
  bias: number;
  onBiasChange: (bias: number) => void;
}
```

**Success Criteria:**
- ✅ Bias slider renders for dataset problems
- ✅ Range: -3 to 3, step 0.1
- ✅ Current value displayed
- ✅ Description explains bias effect
- ✅ TypeScript compiles
- ✅ Slider updates state correctly

#### Task 6.2: Connect Bias State to UI

**File:** `src/UnifiedVisualizer.tsx`

Pass bias state to ProblemConfiguration:

```typescript
<ProblemConfiguration
  // ... existing props
  bias={bias}
  onBiasChange={setBias}
/>
```

**Success Criteria:**
- ✅ Bias state passed to component
- ✅ Slider changes update state
- ✅ State changes trigger re-renders
- ✅ Decision boundary updates when bias changes

**Phase 6 Completion Criteria:**
- ✅ Bias slider visible for LR/SH problems
- ✅ Slider functional (updates state)
- ✅ Decision boundary updates interactively
- ✅ UI matches existing parameter control style
- ✅ TypeScript compiles without errors

---

### Phase 7: Update Educational Content

**Files:**
- `src/problems/logisticRegression.tsx`
- `src/problems/separatingHyperplane.tsx`

**Changes:**

#### Task 7.1: Update Logistic Regression Explainer

**File:** `src/problems/logisticRegression.tsx`

Update educational content to explain bias as parameter:

```typescript
// Update formula display (Line 22)
// Add explanation that bias is now a parameter, not trained

<p>
  <strong>Parameters:</strong>
</p>
<ul className="text-sm list-disc ml-5 space-y-1">
  <li>
    <InlineMath>\lambda</InlineMath> (regularization): Controls model complexity
  </li>
  <li>
    <InlineMath>b</InlineMath> (bias): Shifts the decision boundary. Unlike feature weights,
    bias is a configuration parameter (not learned during optimization).
  </li>
</ul>

<p>
  <strong>Decision boundary:</strong> The line where <InlineMath>w_0 x_1 + w_1 x_2 + b = 0</InlineMath>.
  Changing <InlineMath>b</InlineMath> shifts this line perpendicular to <InlineMath>(w_0, w_1)</InlineMath>.
</p>
```

**Success Criteria:**
- ✅ Explains bias is a parameter (not trained)
- ✅ Shows decision boundary formula with bias
- ✅ Explains effect of changing bias
- ✅ Clear and educational

#### Task 7.2: Update Separating Hyperplane Explainer

**File:** `src/problems/separatingHyperplane.tsx`

Update notation and explanation:

```typescript
// Update weight notation (Lines 26-28)
// BEFORE
<p>Let <InlineMath>w = [w_0, w_1, w_2]</InlineMath> be the weights being optimized.</p>

// AFTER
<p>
  Let <InlineMath>w = [w_0, w_1]</InlineMath> be the feature weights (optimized) and
  <InlineMath>b</InlineMath> be the bias (configuration parameter).
</p>

// Update decision function (Line 38)
// BEFORE
<InlineMath>z = w_0 x_1 + w_1 x_2 + w_2</InlineMath>

// AFTER
<InlineMath>z = w_0 x_1 + w_1 x_2 + b</InlineMath>
```

Add explanation of bias parameter similar to LR.

**Success Criteria:**
- ✅ Notation uses `w = [w_0, w_1]` and separate `b`
- ✅ Explains bias is configuration parameter
- ✅ Decision function formula updated
- ✅ Consistent with LR explanation

**Phase 7 Completion Criteria:**
- ✅ Both explainers updated
- ✅ Clear explanation of bias as parameter
- ✅ Formulas use correct notation
- ✅ Educational content accurate

---

### Phase 8: Integration Testing

**Changes:**

#### Task 8.1: Manual UI Testing

Test all functionality with both problems:

**Logistic Regression Tests:**
```
1. Load page, select "Logistic Regression"
2. Verify bias slider appears (range -3 to 3, default 0)
3. Data canvas displays with crescent data
4. Run GD Fixed (α=0.1, 50 iters)
   - Should converge to reasonable weights
   - Final loss should be low
5. Change bias to 1.0
   - Decision boundary should shift
   - Loss landscape should update
6. Change bias to -1.0
   - Decision boundary shifts opposite direction
7. Run Newton's method
   - Should converge faster than GD
   - 2x2 Hessian should be used
8. Change lambda to 5.0
   - Problem should update
   - Stronger regularization visible
9. Add/remove data points
   - Problem updates
   - Algorithms still work
10. Switch to quadratic
    - No bias slider
    - No errors
```

**Separating Hyperplane Tests:**
```
1. Select "Separating Hyperplane"
2. Verify bias slider appears
3. Verify variant selector works (3 variants)
4. Run algorithm on each variant
   - All should converge
   - Different loss functions visible
5. Change bias, verify boundary shifts
6. Test all 5 algorithms on all 3 variants
   - 15 combinations should all work
7. Verify decision boundary renders correctly
```

**Basin Visualization Tests:**
```
1. For LR and SH:
2. Open basin picker
3. Click multiple starting points
4. Verify all converge (no 3D issues)
5. Verify basin boundaries render
6. No "2D slice notation" displays
```

**Success Criteria:**
- ✅ All manual tests pass
- ✅ No console errors
- ✅ No visual glitches
- ✅ Bias slider functional
- ✅ Decision boundary updates correctly
- ✅ All algorithms converge
- ✅ All 3 SH variants work

#### Task 8.2: Verify No Regressions

Test all other (non-dataset) problems:

```
1. Quadratic (Rotated)
   - Parameter slider works
   - Algorithms converge
2. Ill-Conditioned Quadratic
   - Condition number slider works
   - Algorithms handle ill-conditioning
3. Rosenbrock
   - Valley steepness parameter works
   - Algorithms navigate valley
4. Saddle Point
   - Algorithms behave correctly
5. Himmelblau
   - Multiple minima found
6. Three-Hump Camel
   - Algorithms converge
```

**Success Criteria:**
- ✅ No regressions in other problems
- ✅ All problems still work
- ✅ No 3D artifacts in any problem

#### Task 8.3: Code Quality Checks

```bash
# TypeScript compilation
npm run type-check
# Should pass with no errors

# Linting
npm run lint
# Should pass with no warnings

# Build
npm run build
# Should succeed

# Bundle size
ls -lh dist/assets/*.js
# Should be same or smaller than before
```

**Success Criteria:**
- ✅ TypeScript compiles cleanly
- ✅ Linter passes
- ✅ Build succeeds
- ✅ Bundle size acceptable

**Phase 8 Completion Criteria:**
- ✅ All manual tests pass
- ✅ No regressions
- ✅ Code quality checks pass
- ✅ Ready for final review

---

## Final Verification Checklist

Before marking complete:

### Functionality
- [ ] LR loads and displays correctly
- [ ] SH loads and displays correctly
- [ ] Bias slider appears for both
- [ ] Bias slider range: -3 to 3, default 0
- [ ] Decision boundary updates when bias changes
- [ ] All 5 algorithms work on LR
- [ ] All 5 algorithms work on all 3 SH variants
- [ ] No "2D slice notation" displays
- [ ] Basin picker works (no 3D issues)
- [ ] Other problems still work (no regressions)

### Code Quality
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] No TypeScript errors in IDE
- [ ] No unused imports
- [ ] No dead code

### Architecture
- [ ] All problems use 2D weights
- [ ] Bias is a parameter (not trained)
- [ ] No references to `dimensionality === 3`
- [ ] No references to `biasSlice`
- [ ] No union types for initial points
- [ ] Hessians are 2x2 (not 3x3)
- [ ] Educational content updated

### Files Changed (Expected)
- [ ] 23 files modified
- [ ] ~80 lines removed (3D special casing)
- [ ] ~50 lines added (bias parameter UI)
- [ ] Net: ~30 lines removed

---

## Success Metrics

### Quantitative
- **Code removed:** ~80 lines of 3D special-case logic
- **Code added:** ~50 lines (bias parameter, UI)
- **Net change:** -30 lines
- **Files modified:** 23 files
- **Type complexity reduced:** No more union types
- **Hessian size:** 3x3 → 2x2 (faster computation)

### Qualitative
- ✅ Cleaner architecture (no 3D special casing)
- ✅ ML convention (bias separate from weights)
- ✅ Simpler visualization (direct 2D, no slicing)
- ✅ User-configurable bias (interactive boundary)
- ✅ Easier future registry migration

---

## Rollback Plan

If critical issues arise:

### Incremental Rollback

**If Phase N fails:**
```bash
# Identify commit before Phase N
git log --oneline | head -20

# Revert to before that phase
git revert <commit-sha> --no-commit
git commit -m "Rollback Phase N: <reason>"
```

### Full Rollback

```bash
# Find commit before entire migration
git log --oneline | grep "Start 3D to 2D conversion"

# Revert everything
git revert <commit-sha>..HEAD --no-commit
git commit -m "Full rollback: 3D to 2D conversion"
```

### Emergency Fix

If production issue discovered:
1. Hot-fix on main branch (skip phases)
2. Document issue
3. Resume phased approach on separate branch
4. Merge hot-fix into development branch

---

## Dependencies

### This Plan Depends On
- None (standalone refactoring)

### This Plan Enables
- **Registry Migration Plan** (docs/plans/2025-11-10-dataset-problems-registry-migration.md)
  - Simpler integration (no 3D special cases)
  - Bias as registry parameter
  - Cleaner factory functions

---

## Open Questions

### Resolved
1. ✅ Should bias be configurable? **Yes, range -3 to 3**
2. ✅ Use parametrized problems pattern? **Yes, like Rosenbrock's b**
3. ✅ Do this before registry migration? **Yes, simplifies that work**

### Remaining
None

---

## Notes

- This is a **pure refactoring** - no algorithmic changes
- Visual behavior should be **nearly identical**
  - Loss landscapes look the same (bias from optimal solution)
  - Decision boundaries look the same (at default bias=0)
  - Convergence behavior identical (same math)
- **New capability:** User can now explore how bias affects decision boundary
- Performance impact: Negligible (2x2 vs 3x3 Hessian is faster)
- Sets up cleaner registry migration (fewer special cases)

---

## Approval

- [ ] Plan reviewed
- [ ] Timeline approved
- [ ] Rollback plan understood
- [ ] Ready to execute

**Status:** PLANNED
**Next Step:** Execute Phase 1 (Core Logic Updates)
