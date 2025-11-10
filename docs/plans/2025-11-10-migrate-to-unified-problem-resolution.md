# Migrate to Unified Problem Resolution

**Date:** 2025-11-10
**Status:** PLANNED
**Prerequisite:** `docs/logs/2025-11-10-registry-migration-followup-plan.md` (Task 3.1 complete)
**Estimated Effort:** 4-4.5 hours (includes thorough parameter reactivity testing)
**Risk Level:** Medium-High (React dependency verification critical)

---

## Executive Summary

Eliminate the dual registry system by migrating all `getProblem()` calls to use the unified `resolveProblem()` function. This migration directly addresses three critical goals:

### Primary Goals

1. **Centralize problem definitions, remove inconsistencies**
   - Single source of truth: V2 registry only
   - Eliminate mathematical inconsistency in quadratic problem
   - Remove dual registry system entirely

2. **Remove potential mismatches (slider bugs)**
   - Ensure React hooks properly track `problemParameters` dependencies
   - Verify global minimum markers update when sliders change
   - Test that contours/formulas reflect current parameter values

3. **Cleanup codebase, remove dead code**
   - Delete ~50 lines of legacy code
   - Remove old `problemRegistry` and `getProblem()`
   - Delete static `quadraticProblem` instance

### How This Plan Achieves These Goals

**Goal 1 (Centralization):**
- Phase 5: Complete removal of old registry system
- Phase 5, Step 5.3: **REQUIRED deletion of static `quadraticProblem`** (not optional)
- Single code path for all problem resolution

**Goal 2 (Slider Bug Prevention):**
- **NEW Phase 1, Step 1.5:** Explicit React dependency verification
- **NEW Phase 6.5:** Dedicated parameter reactivity testing
- Manual slider testing: κ changes, θ changes, cross-slider validation

**Goal 3 (Cleanup):**
- Removes 11 import sites, ~50 lines of dead code
- Eliminates conditional logic based on problem type
- Simplified, maintainable architecture

### Current State

**Two coexisting registry systems:**

```typescript
// OLD (V1): Static problem instances
export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,  // f(w) = w₀² + w₁² (no ½ factor!)
  'rosenbrock': rosenbrockProblem,
  // ...
};
export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

// NEW (V2): Parametrized problem factories
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  'quadratic': {
    factory: (params) => createRotatedQuadratic(
      (params.rotationAngle as number) || 0,
      (params.kappa as number) || 5
    ),  // f(w) = ½(κw₀² + w₁²) (correct!)
    parameters: [/* metadata */],
  },
  // ...
};
export function resolveProblem(type, params, dataset?): ProblemDefinition { /* ... */ }
```

**Problem:** `getProblem('quadratic')` and `resolveProblem('quadratic', {kappa: 1, rotationAngle: 0})` return mathematically different problems!

### Success Criteria

**Code Migration:**
- ✅ All 11 `getProblem()` callsites migrated to `resolveProblem()`
- ✅ Old `problemRegistry` and `getProblem()` deleted from `src/problems/index.ts`
- ✅ Static `quadraticProblem` **DELETED** (required, not optional)
- ✅ No compilation errors, all tests pass

**Parameter Reactivity (Critical for Goal 2):**
- ✅ React dependency arrays verified: `problemParameters` included where needed
- ✅ κ slider changes: contours elongate/contract immediately, star marker stays at [0,0]
- ✅ θ slider changes: contours rotate immediately, formula updates
- ✅ Problem switching: parameters reset correctly, no stale values
- ✅ No console warnings about missing dependencies

**UI Correctness:**
- ✅ Minima markers (★ and ◆) display at correct locations
- ✅ Problem names and formulas render correctly
- ✅ All problems load correctly with parameters from presets
- ✅ Dataset problems (logistic-regression, separating-hyperplane) work with dataset context

---

## Current Usage Analysis

### Where `getProblem()` is Used (11 callsites)

| File | Lines | Usage | Context Available |
|------|-------|-------|-------------------|
| `UnifiedVisualizer.tsx` | 469 | Get global minimum for bounds | `problemParameters`, `dataset` ✅ |
| `UnifiedVisualizer.tsx` | 825 | Check problem exists when loading preset | `experiment.problemParameters` ✅ |
| `UnifiedVisualizer.tsx` | 886 | Get problem name for display | `experiment.problemParameters` ✅ |
| `UnifiedVisualizer.tsx` | 1463 | Get global minimum for bounds (duplicate) | `problemParameters`, `dataset` ✅ |
| `StoryBanner.tsx` | 38 | Get problem name for banner | `currentExperiment.problemParameters` ✅ |
| `ProblemConfiguration.tsx` | 72 | Check problem exists on selection | Need defaults ⚠️ |
| `GdFixedTab.tsx` | 121 | Get minima for legend | `problemParameters` ✅ |
| `GdLineSearchTab.tsx` | 120 | Get minima for legend | `problemParameters` ✅ |
| `NewtonTab.tsx` | 146 | Get minima for legend | `problemParameters` ✅ |
| `LbfgsTab.tsx` | 133 | Get minima for legend | `problemParameters` ✅ |
| `DiagonalPrecondTab.tsx` | 143 | Get minima for legend | `problemParameters` ✅ |

**Key insight:** Most callsites already have access to `problemParameters` state! Only `ProblemConfiguration.tsx` needs special handling.

---

## Implementation Plan

### Phase 1: Update UnifiedVisualizer.tsx (1.25 hours)

**File:** `src/UnifiedVisualizer.tsx`

**CRITICAL for Goal #2:** This phase includes React dependency verification to prevent slider mismatches.

#### Step 1.1: Line 469 - Bounds Calculation

**Current code:**
```typescript
const problemDef = currentProblem !== 'logistic-regression' ? getProblem(currentProblem) : null;
const globalMin = problemDef?.globalMinimum || (requiresDataset(currentProblem) ? logisticGlobalMin : null);
```

**New code:**
```typescript
// Note: After prerequisite task 3.1, this will use requiresDataset()
const problemDef = !requiresDataset(currentProblem)
  ? resolveProblem(currentProblem, problemParameters)
  : null;
const globalMin = problemDef?.globalMinimum || (requiresDataset(currentProblem) ? logisticGlobalMin : null);
```

**Better approach (eliminate conditional entirely):**
```typescript
// resolveProblem handles both dataset and non-dataset problems!
const problemDef = resolveProblem(currentProblem, problemParameters, dataset);
const globalMin = problemDef?.globalMinimum || logisticGlobalMin;
```

**Import changes:**
```typescript
// Remove:
import { getProblem } from './problems';

// Add:
import { resolveProblem, getDefaultParameters } from './problems/registry';
```

---

#### Step 1.2: Line 825 - Experiment Loading

**Current code:**
```typescript
const problem = getProblem(experiment.problem);
if (problem) {
  // Problem is now active via getCurrentProblem()
}
```

**New code:**
```typescript
// Experiment already provides problemParameters
const problem = resolveProblem(
  experiment.problem,
  experiment.problemParameters || getDefaultParameters(experiment.problem),
  dataset
);
// Problem is now active via getCurrentProblem()
```

**Note:** Remove the `if (problem)` check - `resolveProblem()` throws on invalid problem type, which is better error handling.

---

#### Step 1.3: Line 886 - Problem Name Display

**Current code:**
```typescript
const problemName = getProblem(experiment.problem)?.name || experiment.problem;
```

**New code:**
```typescript
const problemName = resolveProblem(
  experiment.problem,
  experiment.problemParameters || getDefaultParameters(experiment.problem),
  dataset
).name;
```

**Alternative (if defensive coding preferred):**
```typescript
const problemName = (() => {
  try {
    return resolveProblem(
      experiment.problem,
      experiment.problemParameters || getDefaultParameters(experiment.problem),
      dataset
    ).name;
  } catch {
    return experiment.problem;
  }
})();
```

---

#### Step 1.4: Line 1463 - Duplicate Bounds Logic

**Current code:**
```typescript
const problemDef = currentProblem !== 'logistic-regression' ? getProblem(currentProblem) : null;
```

**New code (same as Step 1.1):**
```typescript
const problemDef = resolveProblem(currentProblem, problemParameters, dataset);
```

---

#### Step 1.5: Verify React Dependencies (CRITICAL FOR GOAL #2)

**Purpose:** Prevent slider mismatches by ensuring React properly tracks `problemParameters` changes.

**Search pattern:**
```bash
grep -A10 -B5 "resolveProblem" src/UnifiedVisualizer.tsx
```

**For each `resolveProblem()` call, verify:**

1. **If inside `useMemo` / `useEffect` / `useCallback`:**
   - Dependency array MUST include `problemParameters`
   - Example correct pattern:
     ```typescript
     const problem = useMemo(
       () => resolveProblem(currentProblem, problemParameters, dataset),
       [currentProblem, problemParameters, dataset]  // ✅ All deps included
     );
     ```
   - Example WRONG pattern:
     ```typescript
     const problem = useMemo(
       () => resolveProblem(currentProblem, problemParameters, dataset),
       [currentProblem, dataset]  // ❌ Missing problemParameters!
     );
     ```

2. **If NOT inside a hook:**
   - Acceptable - will recalculate on every render (cheap operation)
   - No action needed

3. **Check console for dependency warnings:**
   - Run dev server, load quadratic problem
   - Open browser console
   - Drag κ slider
   - Look for React warnings about missing dependencies
   - Fix any warnings before proceeding

**Expected locations to check:**
- Lines 469, 1463: Likely inside component body (no memo needed)
- Line 825: Inside experiment loading effect (check deps)
- Line 886: Inside component render (no memo needed)

**Time estimate:** 15 minutes

**Verification:**
- No console warnings about exhaustive-deps
- Dragging κ slider: `problemParameters` state updates, triggering recalculation

---

### Phase 2: Update StoryBanner.tsx (15 minutes)

**File:** `src/components/StoryBanner.tsx`

**Current code (line 38):**
```typescript
const problemName = getProblem(currentExperiment.problem)?.name || currentExperiment.problem;
```

**New code:**
```typescript
const problemName = resolveProblem(
  currentExperiment.problem,
  currentExperiment.problemParameters || getDefaultParameters(currentExperiment.problem)
).name;
```

**Import changes:**
```typescript
// Remove:
import { getProblem } from '../problems';

// Add:
import { resolveProblem, getDefaultParameters } from '../problems/registry';
```

**Note:** StoryBanner doesn't have dataset context, but that's OK - dataset-based experiments will have `problemParameters` set.

---

### Phase 3: Update ProblemConfiguration.tsx (20 minutes)

**File:** `src/components/ProblemConfiguration.tsx`

**Current code (line 72):**
```typescript
const problem = getProblem(newProblem);
if (problem) {
  // Reset initial point to problem's default...
}
```

**Challenge:** This is called when user selects a problem from dropdown, *before* parameters are set.

**Solution:** Use default parameters from registry:
```typescript
const problemParams = getDefaultParameters(newProblem);
const problem = resolveProblem(newProblem, problemParams);
// Reset initial point to problem's default...
```

**Import changes:**
```typescript
// Remove:
import { getProblem } from '../problems';

// Add:
import { resolveProblem, getDefaultParameters, requiresDataset } from '../problems/registry';
```

**Note:** After prerequisite task 3.1, `requiresDataset` will already be imported.

---

### Phase 4: Update Algorithm Tabs (30 minutes)

All 5 tabs have identical usage pattern - get `globalMinimum` and `localMinima` for legend markers.

**Files:**
- `src/components/tabs/GdFixedTab.tsx` (line 121)
- `src/components/tabs/GdLineSearchTab.tsx` (line 120)
- `src/components/tabs/NewtonTab.tsx` (line 146)
- `src/components/tabs/LbfgsTab.tsx` (line 133)
- `src/components/tabs/DiagonalPrecondTab.tsx` (line 143)

**Current pattern (example from GdLineSearchTab.tsx):**
```typescript
{currentProblem !== 'logistic-regression' && (
  <div className="mt-3 flex gap-4 text-sm text-gray-700">
    {(() => {
      const problem = getProblem(currentProblem);
      if (!problem) return null;
      return (
        <>
          {problem.globalMinimum && (
            <div className="flex items-center gap-2">
              <span className="text-xl">★</span>
              <span>Global minimum</span>
            </div>
          )}
          {problem.localMinima && problem.localMinima.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xl">◆</span>
              <span>Local minima</span>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
```

**New pattern:**
```typescript
{!requiresDataset(currentProblem) && (
  <div className="mt-3 flex gap-4 text-sm text-gray-700">
    {(() => {
      const problem = resolveProblem(currentProblem, problemParameters);
      return (
        <>
          {problem.globalMinimum && (
            <div className="flex items-center gap-2">
              <span className="text-xl">★</span>
              <span>Global minimum</span>
            </div>
          )}
          {problem.localMinima && problem.localMinima.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xl">◆</span>
              <span>Local minima</span>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
```

**Import changes (all 5 files):**
```typescript
// Remove:
import { getProblem } from '../problems';

// Add:
import { resolveProblem, requiresDataset } from '../problems/registry';
```

**Access to context:**
All tabs receive `problemParameters` from parent context:
```typescript
const { problemParameters } = useExperimentContext();
```

**Note:** After prerequisite task 3.1, `requiresDataset` will replace the string literal check.

---

### Phase 5: Remove Old Registry System (30 minutes)

**File:** `src/problems/index.ts`

#### Step 5.1: Remove Old Registry

**Delete lines 12-27:**
```typescript
// DELETE THIS:
export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
  'himmelblau': himmelblauProblem,
  'three-hump-camel': threeHumpCamelProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}
```

#### Step 5.2: Remove Exports

**Current exports (lines 29-37):**
```typescript
export {
  quadraticProblem,  // DELETE - no longer needed
  createRotatedQuadratic,
  rosenbrockProblem,
  createRosenbrockProblem,
  saddleProblem,
  himmelblauProblem,
  threeHumpCamelProblem
};
```

**New exports:**
```typescript
export {
  createRotatedQuadratic,
  rosenbrockProblem,
  createRosenbrockProblem,
  saddleProblem,
  himmelblauProblem,
  threeHumpCamelProblem
};
```

**Rationale:** `quadraticProblem` is only used by the old registry. Once `getProblem()` is gone, nothing needs it.

---

#### Step 5.3: Remove Static Quadratic (REQUIRED FOR GOAL #1)

**File:** `src/problems/quadratic.tsx`

**DELETE lines 6-37** (the static `quadraticProblem` instance):
```typescript
// DELETE THIS:
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  objectiveFormula: <InlineMath>{String.raw`f(w) = w_0^2 + w_1^2`}</InlineMath>,
  description: (/* ... */),
  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + w1 * w1;  // NO ½ factor - mathematically inconsistent!
  },
  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 2 * w1];
  },
  hessian: (): number[][] => {
    return [[2, 0], [0, 2]];
  },
  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },
  globalMinimum: [0, 0],
};
```

**Why this is REQUIRED (not optional):**
1. **Goal #1: Centralization** - Leaving this creates dual definitions of "quadratic problem"
2. **Prevents confusion** - Developers might accidentally use wrong version
3. **Mathematical consistency** - Old version has `f(w) = w₀² + w₁²`, new has `f(w) = ½(κw₀² + w₁²)`
4. **Dead code elimination** - No longer used after old registry removal
5. **Single source of truth** - Only `createRotatedQuadratic()` should exist

**After deletion:**
- Only `createRotatedQuadratic(thetaDegrees, kappa)` remains
- Default call: `createRotatedQuadratic(0, 5)` gives axis-aligned quadratic with κ=5
- Consistent ½ factor in all cases

---

### Phase 6: Verification & Testing (1 hour)

#### Step 6.1: Compilation

```bash
npm run build
```

**Expected:** No TypeScript errors, clean build.

**Common issues:**
- Missing imports of `resolveProblem`, `getDefaultParameters`, `requiresDataset`
- Incorrect import paths (`../problems/registry` vs `./problems/registry`)

---

#### Step 6.2: Automated Verification

```bash
# No references to deleted functions
! grep -r "getProblem" src/ --exclude-dir=node_modules

# quadraticProblem only in quadratic.tsx (if kept) or nowhere (if deleted)
grep -rn "quadraticProblem" src/ --exclude-dir=node_modules

# problemRegistry only appears in comments or this doc
grep -rn "problemRegistry[^V]" src/ --exclude-dir=node_modules
```

---

#### Step 6.3: Manual Testing

**Test Matrix:**

| Problem | Action | Expected Result |
|---------|--------|-----------------|
| Quadratic (κ=5, θ=0°) | Load default | Formula shows `f(w) = ½(κw₀² + w₁²)`, star marker at origin |
| **Quadratic** | **Drag κ: 5→100** | **Contours elongate, star stays at [0,0], formula shows κ=100** |
| **Quadratic** | **Drag θ: 0°→45°** | **Contours rotate, formula changes to rotated form** |
| Quadratic (κ=100, θ=0°) | Load preset "Newton vs GD" | Loads correctly, Newton converges ~5 iters |
| Quadratic (κ=5, θ=45°) | Load preset "Rotated" | Formula shows rotation matrix, diagonal precond struggles |
| Rosenbrock | Load default | Loads correctly, shows valley |
| Saddle | Run GD | Diverges to -∞, no star marker (unbounded) |
| Himmelblau | Load default | Shows 4 minima markers |
| Three-Hump Camel | Load default | Shows global + 2 local minima |
| Logistic Regression | Add data points | Decision boundary updates, runs correctly |
| Separating Hyperplane | Switch variants | Formula updates, different loss functions |

**Focus areas:**
1. **Problem loading:** All problems load without errors
2. **Parameter propagation:** Changing κ or θ updates the problem correctly
3. **Minima markers:** ★ and ◆ symbols appear in correct locations
4. **Preset loading:** All experiment presets work correctly
5. **Problem names:** Display correctly in banner and UI
6. **Formulas:** Render correctly (especially quadratic with/without rotation)

---

#### Step 6.4: Edge Cases

**Test these scenarios:**

1. **Missing parameters:** Load experiment with `problemParameters: {}`
   - Should fall back to defaults via `getDefaultParameters()`

2. **Invalid problem type:** Try `resolveProblem('nonexistent')`
   - Should throw clear error (not undefined behavior)

3. **Dataset problems without dataset:** Load logistic-regression with no data
   - Should throw clear error from `resolveProblem()`

4. **Switch between problems:** Go from quadratic → rosenbrock → quadratic
   - Parameters should reset appropriately

5. **Story mode:** Navigate through experiment presets
   - All transitions smooth, names display correctly

---

### Phase 6.5: Parameter Reactivity Testing (CRITICAL FOR GOAL #2) (30 minutes)

**Purpose:** Ensure slider changes immediately update the problem, preventing mismatches between UI state and displayed problem.

**This is the ONLY test that catches React dependency bugs.** Loading presets tests initial resolution, but slider changes test live updates.

---

#### Test 6.5.1: κ (Condition Number) Slider

**Setup:**
1. Load quadratic problem with default parameters (κ=5, θ=0°)
2. Run any algorithm to see initial trajectory

**Test procedure:**
1. Drag κ slider from 5 → 100
2. **Immediately observe (without re-running algorithm):**
   - ✅ Contour plot elongates (ellipse becomes more elongated)
   - ✅ Formula updates to show κ=100 in UI
   - ✅ Star marker (★) stays at [0, 0]
   - ✅ Previous algorithm trajectory still visible (unchanged)
3. Drag κ slider from 100 → 1
4. **Observe:**
   - ✅ Contour plot becomes circular (κ=1 is a circle)
   - ✅ Formula updates to show κ=1
   - ✅ Star marker still at [0, 0]

**FAIL criteria:**
- ❌ Contours don't change when slider moves
- ❌ Formula still shows old κ value
- ❌ Console warning: "Hook useEffect has a missing dependency: 'problemParameters'"

**If test fails:** React dependency array is missing `problemParameters` - go back to Phase 1, Step 1.5

---

#### Test 6.5.2: θ (Rotation Angle) Slider

**Setup:**
1. Load quadratic with κ=5, θ=0°
2. Note that formula shows simplified form: `f(w) = ½(κw₀² + w₁²)`

**Test procedure:**
1. Drag θ slider from 0° → 45°
2. **Immediately observe:**
   - ✅ Contour plot rotates 45 degrees
   - ✅ Formula changes to rotated form with R(θ) matrix
   - ✅ Star marker stays at [0, 0]
3. Drag θ back to 0°
4. **Observe:**
   - ✅ Contours rotate back to axis-aligned
   - ✅ Formula simplifies back to `f(w) = ½(κw₀² + w₁²)`

**FAIL criteria:**
- ❌ Contours don't rotate when slider moves
- ❌ Formula stays in rotated form when θ=0°
- ❌ Formula shows simplified form when θ=45°

---

#### Test 6.5.3: Cross-Slider Validation

**Setup:**
1. Load quadratic with κ=100, θ=0° (elongated, axis-aligned)

**Test procedure:**
1. Drag θ to 45° while keeping κ=100
2. **Observe:**
   - ✅ Contours are both elongated (κ=100) AND rotated (θ=45°)
   - ✅ Star marker at [0, 0]
   - ✅ Formula shows rotation matrix with κ in diagonal
3. Drag κ to 1 while keeping θ=45°
4. **Observe:**
   - ✅ Contours become circular but still rotated
   - ✅ Visual appearance: circle rotated 45° (looks same as θ=0°, κ=1)
   - ✅ Formula still shows rotation (even though visually symmetric)

**This test verifies:** Both parameters work together correctly, no interference

---

#### Test 6.5.4: Problem Switching with Parameters

**Setup:**
1. Load quadratic with κ=250, θ=45° (extreme elongation, rotated)
2. Note the visual appearance

**Test procedure:**
1. Switch to Rosenbrock problem
2. **Observe:**
   - ✅ Contours change to Rosenbrock's banana valley
   - ✅ Quadratic parameters (κ, θ) disappear from UI
   - ✅ Rosenbrock parameters (valley steepness) appear
3. Switch back to quadratic
4. **Observe:**
   - ✅ Parameters reset to defaults (κ=5, θ=0°), NOT the previous values
   - ✅ Contours show default quadratic bowl
   - ✅ No stale parameter values

**FAIL criteria:**
- ❌ Quadratic still shows κ=250, θ=45° after switching back
- ❌ Parameters from previous problem persist

---

#### Test 6.5.5: Console Verification

**Throughout all tests above:**
1. Keep browser console open (F12)
2. **Look for React warnings:**
   - "Hook useEffect has a missing dependency"
   - "Hook useMemo has a missing dependency"
   - Any warnings mentioning `problemParameters`

3. **If warnings appear:**
   - ❌ STOP - do not proceed
   - Go back to Phase 1, Step 1.5
   - Fix dependency arrays
   - Re-test from 6.5.1

4. **Expected console state:**
   - ✅ No React warnings
   - ✅ No errors
   - ✅ Clean console (info messages OK)

---

**Time estimate:** 30 minutes (thorough testing is critical)

**Success criteria:**
- All 5 sub-tests pass
- No console warnings
- Visual confirmation that sliders immediately update visualization

**If any test fails:**
- DO NOT proceed to Phase 7
- Fix dependency issues in Phase 1, Step 1.5
- Re-run all Phase 6.5 tests

---

### Phase 7: Documentation (15 minutes)

#### Step 7.1: Update This Plan

Mark status as **COMPLETE** and add completion date.

#### Step 7.2: Document Migration in Registry

**File:** `src/problems/registry.ts`

Add comment at top:
```typescript
/**
 * Parameter-aware problem registry (V2)
 *
 * This registry replaced the old static problemRegistry in November 2024.
 * All problems are now resolved via resolveProblem() with parameters.
 *
 * Historical note: The old system had a mathematical inconsistency where
 * quadraticProblem used f(w) = w₀² + w₁² while createRotatedQuadratic
 * used f(w) = ½(κw₀² + w₁²). The unified system corrects this.
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  // ...
};
```

#### Step 7.3: Add Migration Note to Changelog

**File:** `CHANGELOG.md` (if exists) or create migration note

```markdown
## 2025-11-10 - Unified Problem Resolution

### Changed
- **BREAKING (internal):** Removed old `problemRegistry` and `getProblem()` function
- All problems now resolved via unified `resolveProblem()` function
- Fixed mathematical inconsistency in quadratic problem (now includes ½ factor)

### Removed
- `getProblem()` function from `src/problems/index.ts`
- Old `problemRegistry` static registry
- `quadraticProblem` static instance (use `createRotatedQuadratic(0, 1)` instead)

### Migration Guide
If external code used `getProblem()`:
```typescript
// Old:
const problem = getProblem('quadratic');

// New:
const problem = resolveProblem('quadratic', { rotationAngle: 0, kappa: 5 });
```
```

---

## Risk Assessment & Mitigation

### Risk 1: Mathematical Inconsistency Impact (Medium)

**Risk:** Changing from `f(w) = w₀² + w₁²` to `f(w) = ½(w₀² + w₁²)` affects objective values.

**Impact:**
- Function values differ by 2x
- Gradients are the same (∇f multiplied by constant = same direction)
- Convergence behavior identical
- Final solution identical (both minimize at origin)

**Mitigation:**
- Only affects displayed objective values, not algorithm behavior
- No stored data depends on exact objective values
- Test that convergence still works

**Verdict:** LOW ACTUAL RISK - cosmetic difference only.

---

### Risk 2: Missing Context (Medium)

**Risk:** Some callsites might not have access to `problemParameters` or `dataset`.

**Analysis:**
- ✅ UnifiedVisualizer: Has both `problemParameters` state and `dataset`
- ✅ Algorithm tabs: All receive `problemParameters` from context
- ✅ StoryBanner: Gets `problemParameters` from experiment
- ⚠️ ProblemConfiguration: Needs to use `getDefaultParameters()`

**Mitigation:**
- Use `getDefaultParameters()` as fallback
- Test problem switching thoroughly

**Verdict:** LOW RISK - defaults available for all cases.

---

### Risk 3: Dataset Problems (Medium)

**Risk:** Dataset-based problems need dataset passed to `resolveProblem()`.

**Analysis:**
- Dataset is available in UnifiedVisualizer context
- Need to ensure it's passed through correctly
- `requiresDataset()` check helps identify when dataset needed

**Mitigation:**
- Always pass `dataset` parameter (even if undefined)
- `resolveProblem()` will throw clear error if dataset required but missing
- Test logistic-regression and separating-hyperplane thoroughly

**Verdict:** MEDIUM RISK - requires careful testing.

---

### Risk 4: Regression in UI (Low)

**Risk:** Minima markers or problem names might not display after migration.

**Analysis:**
- Same data available from `resolveProblem()` as from `getProblem()`
- Problem structure unchanged (`globalMinimum`, `localMinima`, `name` all present)

**Mitigation:**
- Visual inspection during manual testing
- Test all 7 problems individually

**Verdict:** LOW RISK - structure identical.

---

### Risk 5: Performance (Very Low)

**Risk:** `resolveProblem()` creates new problem instances vs returning cached static instances.

**Analysis:**
- Problem creation is cheap (just math, no network/disk)
- Only happens on parameter changes or problem switches
- Not in hot path (not called per iteration)

**Mitigation:**
- Could add memoization later if needed
- Monitor for performance issues during testing

**Verdict:** VERY LOW RISK - negligible performance impact.

---

## Rollback Plan

If critical issues discovered after deployment:

### Immediate Rollback (5 minutes)

```bash
git revert <migration-commit-sha>
npm run build
```

This restores the old system immediately.

### Partial Rollback (30 minutes)

If only specific components have issues:

1. Keep `resolveProblem()` migration in most places
2. Temporarily restore `getProblem()` and `problemRegistry`:
   ```typescript
   // Temporary compatibility shim
   export function getProblem(type: string): ProblemDefinition | undefined {
     return resolveProblem(type, getDefaultParameters(type));
   }
   ```
3. Fix broken components
4. Re-migrate when fixed

---

## Follow-up Work

### Optional Improvements (Future)

1. **Memoization:** Cache resolved problems to avoid recreating on every render
   ```typescript
   const memoizedProblem = useMemo(
     () => resolveProblem(currentProblem, problemParameters, dataset),
     [currentProblem, problemParameters, dataset]
   );
   ```

2. **Type safety:** Make problem parameters strongly typed
   ```typescript
   type QuadraticParams = { rotationAngle: number; kappa: number };
   type RosenbrockParams = { rosenbrockB: number };
   // ...
   ```

3. **Error boundaries:** Wrap problem resolution in React error boundaries
   ```typescript
   <ErrorBoundary fallback={<InvalidProblemMessage />}>
     {resolveProblem(currentProblem, problemParameters, dataset)}
   </ErrorBoundary>
   ```

---

## Success Metrics

### Goal #1: Centralize Problem Definitions
- ✅ Single source of truth: Only V2 registry exists
- ✅ Old `problemRegistry` and `getProblem()` deleted
- ✅ Static `quadraticProblem` deleted (REQUIRED)
- ✅ No mathematical inconsistencies: Unified ½ factor in all quadratics
- ✅ Zero TypeScript errors, no linter warnings

### Goal #2: Remove Slider Mismatches
- ✅ React dependency arrays verified: `problemParameters` included where needed
- ✅ κ slider test passes: Contours elongate/contract immediately
- ✅ θ slider test passes: Contours rotate, formula updates
- ✅ Cross-slider test passes: Both parameters work together
- ✅ No console warnings about missing dependencies
- ✅ Star marker (★) stays at [0,0] during parameter changes

### Goal #3: Cleanup Codebase
- ✅ ~50 lines of dead code deleted
- ✅ 11 import sites migrated to unified system
- ✅ Dual registry system eliminated
- ✅ Conditional logic simplified (no `if (problem === 'logistic-regression')` needed)
- ✅ Clear, maintainable architecture

### Functionality (Cross-Cutting)
- ✅ All 7 problems load correctly
- ✅ All 30+ experiment presets work
- ✅ Problem parameters update correctly on slider changes
- ✅ Minima markers display at correct locations
- ✅ Problem names and formulas render correctly
- ✅ Dataset problems (logistic-regression, separating-hyperplane) work with dataset context

---

## Timeline

| Phase | Duration | Cumulative | Notes |
|-------|----------|------------|-------|
| 1. UnifiedVisualizer | 1.25 hours | 1.25 hours | **+15 min for React deps (Step 1.5)** |
| 2. StoryBanner | 15 min | 1.5 hours | |
| 3. ProblemConfiguration | 20 min | 1.75 hours | |
| 4. Algorithm Tabs | 30 min | 2.25 hours | |
| 5. Remove Old Registry | 30 min | 2.75 hours | **Step 5.3 now REQUIRED** |
| 6. Testing | 1 hour | 3.75 hours | Basic compilation & manual |
| **6.5. Parameter Reactivity** | **30 min** | **4.25 hours** | **NEW: Slider testing (Goal #2)** |
| 7. Documentation | 15 min | 4.5 hours | |

**Total: ~4.5 hours** (conservative estimate with thorough parameter testing)

**Aggressive: ~3 hours** (if everything goes smoothly, but skip slider testing at your own risk!)

**Recommendation:** Budget 4.5 hours. The extra 30 minutes for Phase 6.5 is critical for Goal #2 - preventing slider mismatches is worth the time investment.

---

## Appendix: Example Migrations

### Example 1: Simple Case (StoryBanner)

**Before:**
```typescript
import { getProblem } from '../problems';

const problemName = getProblem(currentExperiment.problem)?.name || currentExperiment.problem;
```

**After:**
```typescript
import { resolveProblem, getDefaultParameters } from '../problems/registry';

const problemName = resolveProblem(
  currentExperiment.problem,
  currentExperiment.problemParameters || getDefaultParameters(currentExperiment.problem)
).name;
```

---

### Example 2: With Dataset (UnifiedVisualizer)

**Before:**
```typescript
const problemDef = currentProblem !== 'logistic-regression' ? getProblem(currentProblem) : null;
const globalMin = problemDef?.globalMinimum || (requiresDataset(currentProblem) ? logisticGlobalMin : null);
```

**After:**
```typescript
const problemDef = resolveProblem(currentProblem, problemParameters, dataset);
const globalMin = problemDef?.globalMinimum || logisticGlobalMin;
```

**Improvement:** Conditional eliminated entirely!

---

### Example 3: Minima Display (Algorithm Tabs)

**Before:**
```typescript
{currentProblem !== 'logistic-regression' && (
  <div>
    {(() => {
      const problem = getProblem(currentProblem);
      if (!problem) return null;
      return (
        <>
          {problem.globalMinimum && <div>★ Global minimum</div>}
        </>
      );
    })()}
  </div>
)}
```

**After:**
```typescript
{!requiresDataset(currentProblem) && (
  <div>
    {(() => {
      const problem = resolveProblem(currentProblem, problemParameters);
      return (
        <>
          {problem.globalMinimum && <div>★ Global minimum</div>}
        </>
      );
    })()}
  </div>
)}
```

**Improvements:**
- No string literal check (`!== 'logistic-regression'` → `!requiresDataset()`)
- No null check (`if (!problem)` removed - `resolveProblem()` throws on error)
- Parameters respected (κ and θ affect which problem is displayed)

---

## References

- **Prerequisite plan:** `docs/logs/2025-11-10-registry-migration-followup-plan.md`
- **Registry V2 implementation:** `src/problems/registry.ts`
- **Problem factories:** `src/problems/quadratic.tsx`, `rosenbrock.tsx`, etc.
- **Usage examples:** See `resolveProblem()` JSDoc in registry.ts

---

## Notes

### Why This Matters

The dual registry system creates confusion and bugs:

1. **Mathematical inconsistency:** Different quadratic formulas depending on which registry is used
2. **Maintenance burden:** Two places to update when adding problems
3. **Feature limitations:** Old registry can't handle parameters, blocks future improvements
4. **Code smell:** `if (problem === 'logistic-regression')` checks scattered everywhere

This migration eliminates all these issues with a clean, unified approach.

### Why Now

This migration should happen **after** the prerequisite cleanup because:

1. Task 3.1 eliminates `isDatasetProblem()` → we can use `requiresDataset()` consistently
2. Cleaner codebase = easier to see what needs changing
3. Both migrations touch similar code areas = better to sequence them

### Post-Migration State

After this migration, problem resolution is **simple and consistent**:

```typescript
// For everything:
const problem = resolveProblem(problemType, parameters, dataset);

// That's it! No conditionals, no special cases, no dual systems.
```

This is the architectural simplicity we want.
