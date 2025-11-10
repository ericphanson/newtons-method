# Custom Algorithm Hook Refactoring

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract algorithm iteration management into a reusable custom hook to eliminate code duplication and enable clean "jump to end" behavior when experiments load.

**Architecture:** Create `useAlgorithmIterations` hook that encapsulates the pattern of running algorithms, preserving iteration position percentage across parameter changes, and managing iterations/currentIter/summary state. Use this hook 5 times (once per algorithm) in UnifiedVisualizer. Add `jumpToEnd` flag to control whether we preserve position percentage or jump to the last iteration.

**Tech Stack:** React custom hooks, TypeScript generics, useEffect dependencies

---

## 🚨 IMPORTANT: Read This First

### Prerequisites

**1. Create backup branch:**
```bash
git checkout -b backup-before-refactor
git checkout main  # or your working branch
```

**2. Verify src/hooks/ directory exists:**
```bash
ls -la src/hooks/
# If it doesn't exist:
mkdir -p src/hooks
```

**3. Run initial type check:**
```bash
npm run build
# Verify it passes before starting
```

### Critical Warnings

⚠️ **LINE NUMBERS BECOME INVALID:** After Task 2, all line numbers shift because we're deleting/adding code. Use grep/search for code patterns, NOT line numbers.

⚠️ **Use Find All to verify replacements:** After replacing references (e.g., `gdFixedIterations` → `gdFixed.iterations`), use Cmd+Shift+F (Find All) to verify NO references remain.

⚠️ **Run type-check after each task:** Don't wait until Task 8. Catch TypeScript errors immediately after each task.

### State Migration Overview

```
┌──────────────────────────────┬──────────────────────────────┐
│ OLD (useState)               │ NEW (useAlgorithmIterations) │
├──────────────────────────────┼──────────────────────────────┤
│ gdFixedIterations            │ gdFixed.iterations           │
│ gdFixedCurrentIter           │ gdFixed.currentIter          │
│ setGdFixedCurrentIter        │ gdFixed.setCurrentIter       │
│ gdFixedSummary               │ gdFixed.summary              │
│ (manual reset in functions)  │ gdFixed.resetIter()          │
├──────────────────────────────┼──────────────────────────────┤
│ gdFixedAlpha (useState)      │ gdFixedAlpha (UNCHANGED)     │
│ gdFixedTolerance (useState)  │ gdFixedTolerance (UNCHANGED) │
│ maxIter, initialW0, etc.     │ (ALL UNCHANGED)              │
└──────────────────────────────┴──────────────────────────────┘

Repeat this pattern for all 5 algorithms:
- GD Fixed
- GD Line Search
- Newton's Method
- L-BFGS
- Diagonal Preconditioner
```

### Dependency Array Rules

**RULE FOR DEPENDENCIES ARRAY:**

Include EVERY variable used inside the `runAlgorithm` callback:
- `currentProblem` - determines which objective function to use
- `lambda` - regularization parameter (used in all algorithms)
- Algorithm-specific params: `alpha`, `c1`, `m`, `hessianDamping`, `lineSearch`, etc.
- `maxIter` - maximum iterations
- `initialW0`, `initialW1` - starting point coordinates
- `getCurrentProblemFunctions` - the callback that creates the problem (it's a `useCallback`, so it changes when ITS dependencies change)

**DO NOT INCLUDE:**
- `iterations`, `currentIter`, `summary` - these are outputs, not inputs
- Setter functions - React guarantees these are stable

**⚠️ CRITICAL:** `getCurrentProblemFunctions` MUST be in the dependency array even though it's a function. It's a `useCallback` that changes when its dependencies change. DO NOT remove it or you'll have stale closure bugs (algorithm won't re-run when problem parameters change).

### The setTimeout(0) Timing Trick

In Task 7, we use `setTimeout(() => setExperimentJustLoaded(false), 0)`.

**WHY?**

React batches state updates. When we call:
1. `setExperimentJustLoaded(true)`
2. Update 20 other state variables (`alpha`, `lambda`, `initialW0`, etc.)
3. `setExperimentJustLoaded(false)`

React might batch all these updates and the hooks never see the `true` value!

**The Fix:**

`setTimeout(0)` pushes the reset to the next event loop tick, AFTER all the `useEffect` hooks in our custom hook have had a chance to read `experimentJustLoaded: true`.

This is a microtask queue trick. Without it, the hooks might never see `jumpToEnd: true`.

---

## Task 1: Create Custom Hook Foundation

**Files:**
- Create: `src/hooks/useAlgorithmIterations.ts`

**Step 1: Verify directory exists**

```bash
mkdir -p src/hooks
```

**Step 2: Create the hook file with TypeScript types**

Create `src/hooks/useAlgorithmIterations.ts`:

```typescript
import { useState, useEffect } from 'react';
import type { AlgorithmSummary } from '../algorithms/types';

// Options for controlling hook behavior
export interface UseAlgorithmIterationsOptions {
  jumpToEnd?: boolean;
}

// Result type returned by algorithm runner functions
// NOTE: This is a NEW type we're defining here, not imported from anywhere
export interface AlgorithmRunResult<TIteration> {
  iterations: TIteration[];
  summary: AlgorithmSummary;
}

/**
 * Custom hook for managing algorithm iterations
 *
 * @param algorithmName - Name for debugging (appears in console.error)
 * @param runAlgorithm - Function that executes the algorithm and returns iterations + summary
 * @param dependencies - Array of values that trigger algorithm re-run when changed
 * @param options - Control flags (e.g., jumpToEnd)
 *
 * TIteration must have w and wNew fields because visualization code needs these for drawing trajectories
 */
export function useAlgorithmIterations<TIteration extends { w: number[]; wNew: number[] }>(
  algorithmName: string,
  runAlgorithm: () => AlgorithmRunResult<TIteration>,
  dependencies: any[],
  options?: UseAlgorithmIterationsOptions
) {
  const [iterations, setIterations] = useState<TIteration[]>([]);
  const [currentIter, setCurrentIter] = useState(0);
  const [summary, setSummary] = useState<AlgorithmSummary | null>(null);

  useEffect(() => {
    try {
      // Preserve current position as percentage (unless jumpToEnd is set)
      // Example: If at iteration 10/50 (20%), and algorithm now produces 30 iterations,
      // we want to be at iteration 6 (20% of 30)
      const oldPercentage = iterations.length > 0 && !options?.jumpToEnd
        ? currentIter / Math.max(1, iterations.length - 1)
        : 0;

      const result = runAlgorithm();
      setIterations(result.iterations);
      setSummary(result.summary);

      // Restore position at same percentage or jump to end
      const newIter = result.iterations.length > 0
        ? (options?.jumpToEnd
            ? result.iterations.length - 1
            : Math.min(result.iterations.length - 1, Math.round(oldPercentage * Math.max(0, result.iterations.length - 1))))
        : 0;
      setCurrentIter(newIter);
    } catch (error) {
      console.error(`${algorithmName} error:`, error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      setIterations([]);
      setSummary(null);
    }
    // We disable exhaustive-deps because we deliberately spread the dependencies array parameter.
    // This is safe because the caller provides the full dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, options?.jumpToEnd]);

  const resetIter = () => setCurrentIter(0);

  return {
    iterations,
    currentIter,
    setCurrentIter,
    summary,
    resetIter
  };
}
```

**Step 3: Verify import path**

The import `from '../algorithms/types'` assumes we're in `src/hooks/`. Verify:

```bash
cat src/algorithms/types.ts | grep "AlgorithmSummary"
# Should show: export interface AlgorithmSummary
```

**Step 4: Commit the hook foundation**

```bash
git add src/hooks/useAlgorithmIterations.ts
git commit -m "feat: create useAlgorithmIterations custom hook"
```

---

## Task 2: Refactor GD Fixed Algorithm (Proof of Concept)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Import the custom hook**

Search for the React imports (around line 1):
```typescript
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
```

Add AFTER React imports and BEFORE algorithm imports:
```typescript
import { useAlgorithmIterations } from './hooks/useAlgorithmIterations';
```

**Step 2: Comment out GD Fixed state**

Search for: `// GD Fixed step state`

You'll find (around line 58-63):
```typescript
// GD Fixed step state
const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);
```

Replace with:
```typescript
// GD Fixed step state - iterations/currentIter/summary now managed by useAlgorithmIterations hook
// const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
// const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
// const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);
```

Note: We'll delete these commented lines in Task 8. Keep them for now as reference.

**Step 3: Add experimentJustLoaded state**

Search for: `const [experimentLoading, setExperimentLoading] = useState(false);`

Add AFTER that line:
```typescript
const [experimentLoading, setExperimentLoading] = useState(false);
const [experimentJustLoaded, setExperimentJustLoaded] = useState(false);
```

**Step 4: Add the hook call**

Search for: `// Shared algorithm state` comment (around line 106)

Add AFTER all `useState` declarations but BEFORE any `useEffect`/`useCallback` hooks (should be around line 114):

```typescript
// Use custom hook for GD Fixed algorithm
const gdFixed = useAlgorithmIterations(
  'GD Fixed',
  () => {
    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    return runGradientDescent(problemFuncs, {
      maxIter,
      alpha: gdFixedAlpha,
      lambda,
      initialPoint,
      tolerance: gdFixedTolerance,
    });
  },
  [currentProblem, lambda, gdFixedAlpha, gdFixedTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
  { jumpToEnd: experimentJustLoaded }
);
```

**Step 5: Delete the old GD Fixed useEffect**

Search for: `// Recompute algorithms when shared state changes`

Then find the first `useEffect` block that contains `gdFixedIterations`. It should look like:

```typescript
useEffect(() => {
  try {
    // Preserve current position as percentage
    const oldPercentage = gdFixedIterations.length > 0
      ? gdFixedCurrentIter / Math.max(1, gdFixedIterations.length - 1)
      : 0;

    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    const result = runGradientDescent(problemFuncs, {
      maxIter,
      alpha: gdFixedAlpha,
      lambda,
      initialPoint,
      tolerance: gdFixedTolerance,
    });
    const iterations = result.iterations;
    setGdFixedIterations(iterations);
    setGdFixedSummary(result.summary);

    // Restore position at same percentage
    const newIter = iterations.length > 0
      ? Math.min(iterations.length - 1, Math.round(oldPercentage * Math.max(0, iterations.length - 1)))
      : 0;
    setGdFixedCurrentIter(newIter);
  } catch (error) {
    console.error('GD Fixed error:', error);
    setGdFixedIterations([]);
  }
  // eslint-disable-next-line ...
}, [currentProblem, lambda, gdFixedAlpha, gdFixedTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);
```

**DELETE THE ENTIRE BLOCK** including the closing `}, [...]);`

**Step 6: Update all references**

Use Find & Replace (Cmd+F or Ctrl+F):

1. Find: `gdFixedIterations` → Replace: `gdFixed.iterations`
2. Find: `gdFixedCurrentIter` → Replace: `gdFixed.currentIter`
3. Find: `setGdFixedCurrentIter` → Replace: `gdFixed.setCurrentIter`
4. Find: `gdFixedSummary` → Replace: `gdFixed.summary`

**CRITICAL:** Use Find All (Cmd+Shift+F) after replacements to verify NO old references remain:
- Search for `gdFixedIterations` - should find ZERO matches (except the commented line)
- Search for `setGdFixedCurrentIter` - should find ZERO matches

Key locations where changes occur:
1. `calculateParamBounds(gdFixed.iterations, 'GD Fixed')`
2. `resetToDefaults`: Will update in Task 9
3. Keyboard navigation: `if (e.key === 'ArrowLeft' && gdFixed.currentIter > 0)`
4. Canvas drawing: `const iter = gdFixed.iterations[gdFixed.currentIter];`
5. GdFixedTab props: `iterations={gdFixed.iterations}`

**Step 7: Run type check**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

**Step 8: Test that GD Fixed still works**

```bash
npm run dev
```

Manual test checklist:
1. ✅ Open browser to localhost (usually http://localhost:5173)
2. ✅ Click "GD (Fixed Step)" tab
3. ✅ **PASSING TEST:** You see iterations counting from 0 to ~50, slider moves smoothly, visualization shows orange path from start point to end, no console errors
4. ✅ Move slider to iteration 10 (out of 50 = 20%)
5. ✅ Change alpha slider to 0.05
6. ✅ **PASSING TEST:** Algorithm reruns with ~30 iterations, slider is now at iteration 6 (20% of 30). This proves percentage preservation works.
7. ✅ Click an experiment card (e.g., "Too Large")
8. ✅ **PASSING TEST:** Experiment loads, parameters change. Slider position preserves percentage (NOT jumping to end yet - we add that in Task 7).

**Step 9: Commit GD Fixed refactoring**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate GD Fixed to useAlgorithmIterations hook"
```

---

## Task 3: Refactor GD Line Search Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Comment out GD Line Search state**

⚠️ **Don't trust line numbers!** Search for: `// GD Line search state`

You'll find:
```typescript
// GD Line search state
const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
const [gdLSSummary, setGdLSSummary] = useState<AlgorithmSummary | null>(null);
const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
const [gdLSC1, setGdLSC1] = useState(0.0001);
const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);
```

Replace with:
```typescript
// GD Line search state - iterations/currentIter/summary now managed by useAlgorithmIterations hook
// const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
// const [gdLSSummary, setGdLSSummary] = useState<AlgorithmSummary | null>(null);
// const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
const [gdLSC1, setGdLSC1] = useState(0.0001);
const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);
```

**Step 2: Add the hook call**

Add AFTER the `gdFixed` hook call:

```typescript
// Use custom hook for GD Line Search algorithm
const gdLS = useAlgorithmIterations(
  'GD Line Search',
  () => {
    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    return runGradientDescentLineSearch(problemFuncs, {
      maxIter,
      c1: gdLSC1,
      lambda,
      initialPoint,
      tolerance: gdLSTolerance,
    });
  },
  [currentProblem, lambda, gdLSC1, gdLSTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
  { jumpToEnd: experimentJustLoaded }
);
```

**Step 3: Delete the old GD Line Search useEffect**

Search for the useEffect that contains `gdLSIterations`. Look for:
```typescript
useEffect(() => {
  try {
    // Preserve current position as percentage
    const oldPercentage = gdLSIterations.length > 0
```

**DELETE THE ENTIRE BLOCK** up to and including the closing `}, [...]);`

**Step 4: Update all references**

Find & Replace:
1. `gdLSIterations` → `gdLS.iterations`
2. `gdLSCurrentIter` → `gdLS.currentIter`
3. `setGdLSCurrentIter` → `gdLS.setCurrentIter`
4. `gdLSSummary` → `gdLS.summary`

**Verify with Find All:** Search for `gdLSIterations` - should find ZERO matches (except commented line).

Key update locations:
1. `calculateParamBounds` call
2. Keyboard navigation: `else if (selectedTab === 'gd-linesearch')`
3. Data canvas drawing: `selectedTab === 'gd-linesearch' ? gdLS.iterations[gdLS.currentIter]`
4. Canvas drawing useEffect: dependency on `gdLS.iterations`, `gdLS.currentIter`
5. Line search plot drawing useEffect
6. GdLineSearchTab props

**Step 5: Test GD Line Search**

```bash
npm run dev
```

Manual test:
1. ✅ Click "GD (Line Search)" tab
2. ✅ **PASSING TEST:** Iterations appear (usually fewer than fixed step), line search plot shows on right side
3. ✅ Use arrow keys to navigate iterations
4. ✅ **PASSING TEST:** Line search plot updates showing trial points and Armijo curve

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate GD Line Search to useAlgorithmIterations hook"
```

---

## Task 4: Refactor Newton's Method Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Comment out Newton state**

Search for: `// Newton state`

You'll find:
```typescript
// Newton state
const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
const [newtonSummary, setNewtonSummary] = useState<AlgorithmSummary | null>(null);
const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
const [newtonC1, setNewtonC1] = useState(0.0001);
const [newtonLineSearch, setNewtonLineSearch] = useState<'armijo' | 'none'>('none');
const [newtonHessianDamping, setNewtonHessianDamping] = useState(0);
const [newtonTolerance, setNewtonTolerance] = useState(1e-4);
const [newtonFtol, setNewtonFtol] = useState(2.22e-9);
const [newtonXtol, setNewtonXtol] = useState(1e-5);
```

Replace first 3 lines:
```typescript
// Newton state - iterations/currentIter/summary now managed by useAlgorithmIterations hook
// const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
// const [newtonSummary, setNewtonSummary] = useState<AlgorithmSummary | null>(null);
// const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
const [newtonC1, setNewtonC1] = useState(0.0001);
const [newtonLineSearch, setNewtonLineSearch] = useState<'armijo' | 'none'>('none');
const [newtonHessianDamping, setNewtonHessianDamping] = useState(0);
const [newtonTolerance, setNewtonTolerance] = useState(1e-4);
const [newtonFtol, setNewtonFtol] = useState(2.22e-9);
const [newtonXtol, setNewtonXtol] = useState(1e-5);
```

Note: Parameters like `newtonC1`, `newtonLineSearch`, etc. are already defined as state variables. Do NOT modify those lines.

**Step 2: Add the hook call**

After the `gdLS` hook call:

```typescript
// Use custom hook for Newton's Method algorithm
const newton = useAlgorithmIterations(
  'Newton',
  () => {
    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    return runNewton(problemFuncs, {
      maxIter,
      c1: newtonC1,
      lambda,
      hessianDamping: newtonHessianDamping,
      lineSearch: newtonLineSearch,
      initialPoint,
      termination: {
        gtol: newtonTolerance,
        ftol: newtonFtol,
        xtol: newtonXtol,
      },
    });
  },
  [currentProblem, lambda, newtonC1, newtonLineSearch, newtonHessianDamping, newtonTolerance, newtonFtol, newtonXtol, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
  { jumpToEnd: experimentJustLoaded }
);
```

**Step 3: Delete the old Newton useEffect**

Search for useEffect containing `newtonIterations`. DELETE THE ENTIRE BLOCK.

**Step 4: Update all references**

Find & Replace:
1. `newtonIterations` → `newton.iterations`
2. `newtonCurrentIter` → `newton.currentIter`
3. `setNewtonCurrentIter` → `newton.setCurrentIter`
4. `newtonSummary` → `newton.summary`

**Important for Hessian drawing:** Search for `newtonIterations[newtonCurrentIter]` in the Hessian canvas drawing code. Replace ALL occurrences with `newton.iterations[newton.currentIter]`.

**Verify:** Use Find All for `newtonIterations` - should be ZERO matches.

**Step 5: Test Newton's Method**

```bash
npm run dev
```

Manual test:
1. ✅ Click "Newton's Method" tab
2. ✅ **PASSING TEST:** Iterations appear (usually very few - Newton converges fast!), Hessian matrix shows on left, line search plot on right (if line search enabled)
3. ✅ Verify Hessian matrix values update as you navigate iterations

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate Newton to useAlgorithmIterations hook"
```

---

## Task 5: Refactor L-BFGS Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Comment out L-BFGS state**

Search for: `// L-BFGS state`

Replace first 3 lines:
```typescript
// L-BFGS state - iterations/currentIter/summary now managed by useAlgorithmIterations hook
// const [lbfgsIterations, setLbfgsIterations] = useState<LBFGSIteration[]>([]);
// const [lbfgsSummary, setLbfgsSummary] = useState<AlgorithmSummary | null>(null);
// const [lbfgsCurrentIter, setLbfgsCurrentIter] = useState(0);
```

**Step 2: Add the hook call**

After the `newton` hook call:

```typescript
// Use custom hook for L-BFGS algorithm
const lbfgs = useAlgorithmIterations(
  'L-BFGS',
  () => {
    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    console.log('Running L-BFGS with:', { problem: currentProblem, initialPoint, maxIter, m: lbfgsM, c1: lbfgsC1, hessianDamping: lbfgsHessianDamping });
    const result = runLBFGS(problemFuncs, {
      maxIter,
      m: lbfgsM,
      c1: lbfgsC1,
      lambda,
      hessianDamping: lbfgsHessianDamping,
      initialPoint,
      tolerance: lbfgsTolerance,
    });
    console.log('L-BFGS completed:', result.iterations.length, 'iterations');
    if (result.iterations.length > 0) {
      console.log('First iteration:', result.iterations[0]);
      console.log('Last iteration:', result.iterations[result.iterations.length - 1]);
    }
    return result;
  },
  [currentProblem, lambda, lbfgsC1, lbfgsM, lbfgsHessianDamping, lbfgsTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions],
  { jumpToEnd: experimentJustLoaded }
);
```

**Note:** L-BFGS includes extra console.log statements for debugging. These already exist in the current code - keep them.

**Step 3: Delete the old L-BFGS useEffect**

Search for useEffect containing `lbfgsIterations`. DELETE THE ENTIRE BLOCK.

**Step 4: Update all references**

Find & Replace:
1. `lbfgsIterations` → `lbfgs.iterations`
2. `lbfgsCurrentIter` → `lbfgs.currentIter`
3. `setLbfgsCurrentIter` → `lbfgs.setCurrentIter`
4. `lbfgsSummary` → `lbfgs.summary`

**Verify:** Find All for `lbfgsIterations` - ZERO matches.

**Step 5: Test L-BFGS**

```bash
npm run dev
```

Manual test:
1. ✅ Click "L-BFGS" tab
2. ✅ **PASSING TEST:** Iterations appear, line search plot shows, console shows debug logs
3. ✅ Check browser console - should see "Running L-BFGS with:" and "L-BFGS completed:" messages

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate L-BFGS to useAlgorithmIterations hook"
```

---

## Task 6: Refactor Diagonal Preconditioner Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Comment out Diagonal Preconditioner state**

Search for: `// Diagonal Preconditioner state`

Replace first 3 lines:
```typescript
// Diagonal Preconditioner state - iterations/currentIter/summary now managed by useAlgorithmIterations hook
// const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
// const [diagPrecondSummary, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
// const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
```

**Step 2: Add the hook call**

After the `lbfgs` hook call:

```typescript
// Use custom hook for Diagonal Preconditioner algorithm
const diagPrecond = useAlgorithmIterations(
  'Diagonal Preconditioner',
  () => {
    const problemFuncs = getCurrentProblemFunctions();
    const initialPoint = (currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane')
      ? [initialW0, initialW1, 0]
      : [initialW0, initialW1];
    console.log('Running Diagonal Preconditioner with:', { problem: currentProblem, initialPoint, maxIter, c1: diagPrecondC1 });
    const result = runDiagonalPreconditioner(problemFuncs, {
      lineSearch: diagPrecondLineSearch,
      lambda: lambda,
      hessianDamping: diagPrecondHessianDamping,
      maxIter,
      c1: diagPrecondC1,
      initialPoint,
      termination: {
        gtol: diagPrecondTolerance,
        ftol: diagPrecondFtol,
        xtol: diagPrecondXtol
      },
    });
    console.log('Diagonal Preconditioner completed:', result.iterations.length, 'iterations');
    if (result.iterations.length > 0) {
      console.log('First iteration:', result.iterations[0]);
      console.log('Last iteration:', result.iterations[result.iterations.length - 1]);
    }
    return result;
  },
  [currentProblem, diagPrecondLineSearch, lambda, diagPrecondHessianDamping, maxIter, diagPrecondC1, diagPrecondTolerance, diagPrecondFtol, diagPrecondXtol, initialW0, initialW1, getCurrentProblemFunctions],
  { jumpToEnd: experimentJustLoaded }
);
```

**Step 3: Delete the old Diagonal Preconditioner useEffect**

Search for useEffect containing `diagPrecondIterations`. DELETE THE ENTIRE BLOCK.

**Step 4: Update all references**

Find & Replace:
1. `diagPrecondIterations` → `diagPrecond.iterations`
2. `diagPrecondCurrentIter` → `diagPrecond.currentIter`
3. `setDiagPrecondCurrentIter` → `diagPrecond.setCurrentIter`
4. `diagPrecondSummary` → `diagPrecond.summary`

**Verify:** Find All for `diagPrecondIterations` - ZERO matches.

Key update: Keyboard navigation has TWO places for diagPrecond - one for arrow keys, one for the length check. Make sure to update both.

**Step 5: Test Diagonal Preconditioner**

```bash
npm run dev
```

Manual test:
1. ✅ Click "Diagonal Precond" tab
2. ✅ **PASSING TEST:** Iterations appear, visualizations render correctly
3. ✅ Verify playback controls work

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate Diagonal Preconditioner to useAlgorithmIterations hook"
```

---

## Task 7: Implement "Jump to End" on Experiment Load

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Verify experimentJustLoaded state exists**

⚠️ **If you skipped Task 2 Step 3**, go back and add:
```typescript
const [experimentJustLoaded, setExperimentJustLoaded] = useState(false);
```

Search for it to verify it's there.

**Step 2: Set experimentJustLoaded flag in loadExperiment**

Search for: `const loadExperiment = useCallback((experiment: ExperimentPreset) => {`

You'll find:
```typescript
const loadExperiment = useCallback((experiment: ExperimentPreset) => {
  setExperimentLoading(true);

  try {
```

Change to:
```typescript
const loadExperiment = useCallback((experiment: ExperimentPreset) => {
  setExperimentLoading(true);

  // Signal all algorithms to jump to end on next update
  setExperimentJustLoaded(true);

  try {
```

**Step 3: Reset the flag after experiment loads**

Search for: `setExperimentLoading(false);`

You'll find (in the same `loadExperiment` function):
```typescript
// Clear loading state immediately (no artificial delay to avoid race conditions)
setExperimentLoading(false);

// Show success toast
setToast({
  message: `Loaded: ${experiment.name}`,
  type: 'success'
});
```

Change to:
```typescript
// Clear loading state immediately (no artificial delay to avoid race conditions)
setExperimentLoading(false);

// Reset jump-to-end flag after a tick so all useEffects can read it
// This uses the event loop to ensure hooks see experimentJustLoaded: true before it resets
setTimeout(() => setExperimentJustLoaded(false), 0);

// Show success toast
setToast({
  message: `Loaded: ${experiment.name}`,
  type: 'success'
});
```

**Step 4: Test the jump to end behavior**

```bash
npm run dev
```

Manual test (DETAILED PASSING CRITERIA):

**Test 1: Jump to end on experiment load**
1. ✅ Click "GD (Fixed Step)" tab
2. ✅ Wait for iterations to finish running (you'll see ~50 iterations)
3. ✅ Use slider to move to iteration 5
4. ✅ Click an experiment card (e.g., "Too Large" under "Try This")
5. ✅ **PASSING TEST:** Slider IMMEDIATELY jumps to rightmost position. Iteration counter shows max (e.g., "50 / 50" or whatever the new total is). You did NOT have to manually drag the slider.

**Test 2: Preserve percentage on parameter change**
1. ✅ Use slider to go to iteration 10 (out of 50 = 20%)
2. ✅ Change alpha slider to 0.05 (this is a parameter change, NOT an experiment load)
3. ✅ **PASSING TEST:** Algorithm reruns (might now have 30 iterations). Slider is at iteration 6 (20% of 30). It did NOT jump to the end.

**Test 3: Verify all algorithms**
Repeat Test 1 for all 5 algorithm tabs:
- ✅ GD (Fixed Step)
- ✅ GD (Line Search)
- ✅ Diagonal Precond
- ✅ Newton's Method
- ✅ L-BFGS

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: jump to end of iterations when experiment loads"
```

---

## Task 8: Clean Up Commented State Declarations

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Remove all commented state declarations**

Search for these patterns and DELETE the commented lines (15 lines total):

```typescript
// const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
// const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
// const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
```

Delete similar comments for:
- GD Line Search (3 lines)
- Newton (3 lines)
- L-BFGS (3 lines)
- Diagonal Preconditioner (3 lines)

**Step 2: Add a single explanatory comment**

Search for: `// GD Fixed step state`

Replace the entire comment block with:
```typescript
// Algorithm state (hyperparameters only - iterations/currentIter/summary managed by useAlgorithmIterations hook)
```

Then update comments for other algorithms to just:
```typescript
// GD Line Search hyperparameters
// Newton hyperparameters
// L-BFGS hyperparameters
// Diagonal Preconditioner hyperparameters
```

**Step 3: Verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

If you get errors, use Find All to search for the old state variable names and fix any remaining references.

**Step 4: Final comprehensive test**

```bash
npm run dev
```

Test each tab thoroughly:

**GD (Fixed Step):**
- ✅ Playback works (slider, arrow keys, next/previous buttons)
- ✅ Parameter changes (alpha slider) preserve percentage position
- ✅ Experiment loads jump to end
- ✅ Parameter space visualization renders correctly

**GD (Line Search):**
- ✅ Playback works
- ✅ Line search plot renders and updates
- ✅ Experiment loads jump to end

**Diagonal Precond:**
- ✅ Playback works
- ✅ Experiment loads jump to end

**Newton's Method:**
- ✅ Playback works
- ✅ Hessian matrix renders and updates
- ✅ Line search plot (if line search enabled)
- ✅ Experiment loads jump to end

**L-BFGS:**
- ✅ Playback works
- ✅ Line search plot renders
- ✅ Experiment loads jump to end
- ✅ Console shows debug logs

**Step 5: Final commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: clean up commented state declarations"
```

---

## Task 9: Update resetToDefaults Function

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Update resetToDefaults**

Search for: `const resetToDefaults = useCallback(() => {`

You'll find:
```typescript
const resetToDefaults = useCallback(() => {
  const cfg = defaultConfig.current;
  setGdFixedAlpha(cfg.gdFixedAlpha);
  setGdLSC1(cfg.gdLSC1);
  setNewtonC1(cfg.newtonC1);
  setLbfgsC1(cfg.lbfgsC1);
  setLambda(cfg.lambda);
  setLbfgsM(cfg.lbfgsM);
  setMaxIter(cfg.maxIter);
  setInitialW0(cfg.initialW0);
  setInitialW1(cfg.initialW1);
  setGdFixedCurrentIter(0);
  setGdLSCurrentIter(0);
  setDiagPrecondCurrentIter(0);
  setNewtonCurrentIter(0);
  setLbfgsCurrentIter(0);
  setCustomPoints([]);
}, []);
```

**FIND AND DELETE these 5 lines:**
```typescript
setGdFixedCurrentIter(0);
setGdLSCurrentIter(0);
setDiagPrecondCurrentIter(0);
setNewtonCurrentIter(0);
setLbfgsCurrentIter(0);
```

**REPLACE WITH these 5 lines:**
```typescript
// Reset all algorithm iterations to 0
gdFixed.resetIter();
gdLS.resetIter();
diagPrecond.resetIter();
newton.resetIter();
lbfgs.resetIter();
```

**Update dependency array** from `[], []` to:
```typescript
}, [gdFixed, gdLS, diagPrecond, newton, lbfgs]);
```

**Why this dependency array change?** We now depend on the hook return values. This ensures `resetToDefaults` stays fresh if the hooks change (though in practice they're stable).

**Step 2: Test reset functionality**

```bash
npm run dev
```

Manual test:
1. ✅ Click any algorithm tab
2. ✅ Advance playback to iteration 25 (middle of iterations)
3. ✅ Press Ctrl+R (or Ctrl+E on some systems)
4. ✅ **PASSING TEST:** Iteration counter shows "1 / [total]" (iteration 0). Slider is at leftmost position. Visualization shows starting point only (no trajectory yet).

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: use hook resetIter in resetToDefaults"
```

---

## Task 10: Update Problem Change Handler

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Update problem change handler**

Search for: `onProblemChange={(newProblem, defaults, bounds) => {`

You'll find (in the ProblemConfiguration component props):
```typescript
onProblemChange={(newProblem, defaults, bounds) => {
  setCurrentProblem(newProblem);

  // Reset algorithm state when problem changes
  setGdFixedCurrentIter(0);
  setGdFixedIterations([]);
  setGdLSCurrentIter(0);
  setGdLSIterations([]);
  setDiagPrecondCurrentIter(0);
  setDiagPrecondIterations([]);
  setNewtonCurrentIter(0);
  setNewtonIterations([]);
  setLbfgsCurrentIter(0);
  setLbfgsIterations([]);

  // Apply problem-specific defaults
  setGdFixedAlpha(defaults.gdFixedAlpha);
  setMaxIter(defaults.maxIter);
  setInitialW0(defaults.initialPoint[0]);
  setInitialW1(defaults.initialPoint[1]);

  // Update visualization bounds
  setVisualizationBounds(bounds);
}}
```

**DELETE these 10 lines:**
```typescript
setGdFixedCurrentIter(0);
setGdFixedIterations([]);
setGdLSCurrentIter(0);
setGdLSIterations([]);
setDiagPrecondCurrentIter(0);
setDiagPrecondIterations([]);
setNewtonCurrentIter(0);
setNewtonIterations([]);
setLbfgsCurrentIter(0);
setLbfgsIterations([]);
```

**REPLACE WITH these 5 lines:**
```typescript
// Reset algorithm state when problem changes
gdFixed.resetIter();
gdLS.resetIter();
diagPrecond.resetIter();
newton.resetIter();
lbfgs.resetIter();
```

**Note about iterations arrays:** We don't manually reset the iterations arrays (e.g., `setGdFixedIterations([])`) because changing the problem triggers the `useEffect` in each hook (since `currentProblem` is in the dependency array), which will regenerate the iterations automatically.

Final code should look like:
```typescript
onProblemChange={(newProblem, defaults, bounds) => {
  setCurrentProblem(newProblem);

  // Reset algorithm state when problem changes
  gdFixed.resetIter();
  gdLS.resetIter();
  diagPrecond.resetIter();
  newton.resetIter();
  lbfgs.resetIter();

  // Apply problem-specific defaults
  setGdFixedAlpha(defaults.gdFixedAlpha);
  setMaxIter(defaults.maxIter);
  setInitialW0(defaults.initialPoint[0]);
  setInitialW1(defaults.initialPoint[1]);

  // Update visualization bounds
  setVisualizationBounds(bounds);
}}
```

**Step 2: Test problem switching**

```bash
npm run dev
```

Manual test:
1. ✅ Click "GD (Fixed Step)" tab
2. ✅ Advance to iteration 20
3. ✅ Change problem from dropdown (e.g., "Logistic Regression" → "Rosenbrock")
4. ✅ **PASSING TEST:** Iteration resets to 0 (counter shows "1 / [new total]"). Visualization shows new problem landscape. No errors in console.

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: use hook resetIter in problem change handler"
```

---

## Summary

**Total lines removed:** ~500 (5 duplicate useEffect hooks)
**Total lines added:** ~200 (1 custom hook + 5 hook usages)
**Net reduction:** ~300 lines

**Benefits achieved:**
✅ Single source of truth for iteration management
✅ Jump to end on experiment load (original requirement)
✅ Consistent behavior across all 5 algorithms
✅ Easier to add 6th algorithm (just call the hook)
✅ Better separation of concerns (state management vs. visualization)

**Final testing checklist:**
- [ ] All 5 algorithm tabs load correctly
- [ ] Playback controls work (next, previous, slider, arrow keys)
- [ ] Parameter changes preserve percentage position
- [ ] Experiment loads jump to end
- [ ] Problem changes reset to iteration 0
- [ ] Reset to defaults (Ctrl+R) works
- [ ] Keyboard navigation works (arrow keys)
- [ ] Algorithm-specific visualizations render (Hessian, line search plots)
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] No console errors in browser
