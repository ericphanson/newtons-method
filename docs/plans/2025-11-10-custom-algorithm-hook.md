# Custom Algorithm Hook Refactoring

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract algorithm iteration management into a reusable custom hook to eliminate code duplication and enable clean "jump to end" behavior when experiments load.

**Architecture:** Create `useAlgorithmIterations` hook that encapsulates the pattern of running algorithms, preserving iteration position percentage across parameter changes, and managing iterations/currentIter/summary state. Use this hook 5 times (once per algorithm) in UnifiedVisualizer. Add `jumpToEnd` flag to control whether we preserve position percentage or jump to the last iteration.

**Tech Stack:** React custom hooks, TypeScript generics, useEffect dependencies

---

## Task 1: Create Custom Hook Foundation

**Files:**
- Create: `src/hooks/useAlgorithmIterations.ts`

**Step 1: Create the hook file with TypeScript types**

Create `src/hooks/useAlgorithmIterations.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import type { AlgorithmSummary } from '../algorithms/types';

export interface UseAlgorithmIterationsOptions {
  jumpToEnd?: boolean;
}

export interface AlgorithmRunResult<TIteration> {
  iterations: TIteration[];
  summary: AlgorithmSummary;
}

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

**Step 2: Commit the hook foundation**

```bash
git add src/hooks/useAlgorithmIterations.ts
git commit -m "feat: create useAlgorithmIterations custom hook"
```

---

## Task 2: Refactor GD Fixed Algorithm (Proof of Concept)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:58-612`

**Step 1: Import the custom hook**

At the top of `src/UnifiedVisualizer.tsx`, add:

```typescript
import { useAlgorithmIterations } from './hooks/useAlgorithmIterations';
```

**Step 2: Replace GD Fixed state with hook usage**

Find these lines (around 58-63):
```typescript
// GD Fixed step state
const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);
```

Replace the first 3 lines with a comment:
```typescript
// GD Fixed step state - now managed by useAlgorithmIterations hook
// const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
// const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
// const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
const [gdFixedTolerance, setGdFixedTolerance] = useState(1e-6);
```

**Step 3: Add jumpToEnd state flag**

After the experimentLoading state (around line 112), add:

```typescript
// Experiment state
const [experimentLoading, setExperimentLoading] = useState(false);
const [experimentJustLoaded, setExperimentJustLoaded] = useState(false);
```

**Step 4: Add the hook call after all useState declarations**

After line 112 (experimentLoading state), add:

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

Delete lines 578-612 (the entire GD Fixed useEffect hook):

```typescript
// Delete this entire block:
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
  // IMPORTANT: Keep dependency array in sync with ALL parameters passed to runGradientDescentFixedStep above
  // eslint-disable-next-line react-hooks/exhaustive-deps -- gdFixedCurrentIter and gdFixedIterations.length are intentionally excluded to prevent infinite loop (they are set by this effect)
}, [currentProblem, lambda, gdFixedAlpha, gdFixedTolerance, maxIter, initialW0, initialW1, getCurrentProblemFunctions]);
```

**Step 6: Update references to use hook return values**

Find all references to `gdFixedIterations`, `gdFixedCurrentIter`, `setGdFixedCurrentIter`, `gdFixedSummary` and replace:
- `gdFixedIterations` → `gdFixed.iterations`
- `gdFixedCurrentIter` → `gdFixed.currentIter`
- `setGdFixedCurrentIter` → `gdFixed.setCurrentIter`
- `gdFixedSummary` → `gdFixed.summary`

Key locations:
1. Line 400-403: `calculateParamBounds` call
2. Line 570: `resetToDefaults` function
3. Line 829-834: Keyboard navigation
4. Line 1437-1445: Canvas drawing useEffect
5. Line 1640-1664: GdFixedTab props

**Step 7: Test that GD Fixed still works**

```bash
npm run dev
```

Manual test:
1. Open browser to localhost
2. Click "GD (Fixed Step)" tab
3. Verify iterations appear and playback works
4. Change alpha slider - verify it preserves position percentage
5. Click an experiment card - verify it loads (we'll add jump to end later)

**Step 8: Commit GD Fixed refactoring**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate GD Fixed to useAlgorithmIterations hook"
```

---

## Task 3: Refactor GD Line Search Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:66-647`

**Step 1: Replace GD Line Search state with hook usage**

Find these lines (around 66-70):
```typescript
// GD Line search state
const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
const [gdLSSummary, setGdLSSummary] = useState<AlgorithmSummary | null>(null);
const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
const [gdLSC1, setGdLSC1] = useState(0.0001);
const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);
```

Replace the first 3 lines with comments:
```typescript
// GD Line search state - now managed by useAlgorithmIterations hook
// const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
// const [gdLSSummary, setGdLSSummary] = useState<AlgorithmSummary | null>(null);
// const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
const [gdLSC1, setGdLSC1] = useState(0.0001);
const [gdLSTolerance, setGdLSTolerance] = useState(1e-6);
```

**Step 2: Add the hook call after GD Fixed hook**

After the `gdFixed` hook call, add:

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

Delete lines 614-647 (the entire GD Line Search useEffect hook).

**Step 4: Update all references**

Replace:
- `gdLSIterations` → `gdLS.iterations`
- `gdLSCurrentIter` → `gdLS.currentIter`
- `setGdLSCurrentIter` → `gdLS.setCurrentIter`
- `gdLSSummary` → `gdLS.summary`

Key locations:
1. Line 405-408: `calculateParamBounds` call
2. Line 571: `resetToDefaults` function
3. Line 835-841: Keyboard navigation
4. Line 948-951: Data canvas drawing
5. Line 1447-1457: GD Line Search canvas drawing
6. Line 1459-1467: GD Line Search line search plot
7. Line 1666-1693: GdLineSearchTab props

**Step 5: Test GD Line Search**

```bash
npm run dev
```

Manual test:
1. Click "GD (Line Search)" tab
2. Verify iterations and line search plot appear
3. Test playback and parameter changes

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate GD Line Search to useAlgorithmIterations hook"
```

---

## Task 4: Refactor Newton's Method Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:73-689`

**Step 1: Replace Newton state with hook usage**

Find these lines (around 73-81):
```typescript
// Newton state
const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
const [newtonSummary, setNewtonSummary] = useState<AlgorithmSummary | null>(null);
const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
```

Replace first 3 lines with comments:
```typescript
// Newton state - now managed by useAlgorithmIterations hook
// const [newtonIterations, setNewtonIterations] = useState<NewtonIteration[]>([]);
// const [newtonSummary, setNewtonSummary] = useState<AlgorithmSummary | null>(null);
// const [newtonCurrentIter, setNewtonCurrentIter] = useState(0);
```

**Step 2: Add the hook call**

After the `gdLS` hook call, add:

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

Delete lines 649-689 (the entire Newton useEffect hook).

**Step 4: Update all references**

Replace:
- `newtonIterations` → `newton.iterations`
- `newtonCurrentIter` → `newton.currentIter`
- `setNewtonCurrentIter` → `newton.setCurrentIter`
- `newtonSummary` → `newton.summary`

Key locations:
1. Line 390-393: `calculateParamBounds` call
2. Line 573: `resetToDefaults` function
3. Line 847-853: Keyboard navigation
4. Line 1010-1076: Hessian canvas drawing
5. Line 1225-1235: Newton parameter space drawing
6. Line 1403-1411: Newton line search drawing
7. Line 1695-1731: NewtonTab props

**Step 5: Test Newton's Method**

```bash
npm run dev
```

Manual test:
1. Click "Newton's Method" tab
2. Verify iterations, Hessian matrix, and line search appear
3. Test playback and parameter changes

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate Newton to useAlgorithmIterations hook"
```

---

## Task 5: Refactor L-BFGS Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:84-733`

**Step 1: Replace L-BFGS state with hook usage**

Find these lines (around 84-90):
```typescript
// L-BFGS state
const [lbfgsIterations, setLbfgsIterations] = useState<LBFGSIteration[]>([]);
const [lbfgsSummary, setLbfgsSummary] = useState<AlgorithmSummary | null>(null);
const [lbfgsCurrentIter, setLbfgsCurrentIter] = useState(0);
```

Replace first 3 lines with comments:
```typescript
// L-BFGS state - now managed by useAlgorithmIterations hook
// const [lbfgsIterations, setLbfgsIterations] = useState<LBFGSIteration[]>([]);
// const [lbfgsSummary, setLbfgsSummary] = useState<AlgorithmSummary | null>(null);
// const [lbfgsCurrentIter, setLbfgsCurrentIter] = useState(0);
```

**Step 2: Add the hook call**

After the `newton` hook call, add:

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

**Step 3: Delete the old L-BFGS useEffect**

Delete lines 691-733 (the entire L-BFGS useEffect hook).

**Step 4: Update all references**

Replace:
- `lbfgsIterations` → `lbfgs.iterations`
- `lbfgsCurrentIter` → `lbfgs.currentIter`
- `setLbfgsCurrentIter` → `lbfgs.setCurrentIter`
- `lbfgsSummary` → `lbfgs.summary`

Key locations:
1. Line 395-398: `calculateParamBounds` call
2. Line 574: `resetToDefaults` function
3. Line 854-860: Keyboard navigation
4. Line 948-951: Data canvas drawing (lbfgs case)
5. Line 1413-1423: L-BFGS parameter space drawing
6. Line 1425-1433: L-BFGS line search drawing
7. Line 1733-1764: LbfgsTab props

**Step 5: Test L-BFGS**

```bash
npm run dev
```

Manual test:
1. Click "L-BFGS" tab
2. Verify iterations and line search appear
3. Test playback and parameter changes

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate L-BFGS to useAlgorithmIterations hook"
```

---

## Task 6: Refactor Diagonal Preconditioner Algorithm

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:93-785`

**Step 1: Replace Diagonal Preconditioner state with hook usage**

Find these lines (around 93-100):
```typescript
// Diagonal Preconditioner state
const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
const [diagPrecondSummary, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
```

Replace first 3 lines with comments:
```typescript
// Diagonal Preconditioner state - now managed by useAlgorithmIterations hook
// const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
// const [diagPrecondSummary, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
// const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
```

**Step 2: Add the hook call**

After the `lbfgs` hook call, add:

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

Delete lines 736-785 (the entire Diagonal Preconditioner useEffect hook).

**Step 4: Update all references**

Replace:
- `diagPrecondIterations` → `diagPrecond.iterations`
- `diagPrecondCurrentIter` → `diagPrecond.currentIter`
- `setDiagPrecondCurrentIter` → `diagPrecond.setCurrentIter`
- `diagPrecondSummary` → `diagPrecond.summary`

Key locations:
1. Line 410-413: `calculateParamBounds` call
2. Line 572: `resetToDefaults` function
3. Line 841-846: Keyboard navigation
4. Line 864: Keyboard navigation (diagPrecondIterations.length)
5. Line 1469-1479: Diagonal Preconditioner parameter space drawing
6. Line 1481-1489: Diagonal Preconditioner line search drawing
7. Line 1766-1801: DiagonalPrecondTab props

**Step 5: Test Diagonal Preconditioner**

```bash
npm run dev
```

Manual test:
1. Click "Diagonal Precond" tab
2. Verify iterations and visualizations appear
3. Test playback and parameter changes

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: migrate Diagonal Preconditioner to useAlgorithmIterations hook"
```

---

## Task 7: Implement "Jump to End" on Experiment Load

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:470-556`

**Step 1: Set experimentJustLoaded flag in loadExperiment**

Find the `loadExperiment` function (around line 470-556). At the very beginning, after `setExperimentLoading(true)`, add:

```typescript
const loadExperiment = useCallback((experiment: ExperimentPreset) => {
  setExperimentLoading(true);

  // Signal all algorithms to jump to end on next update
  setExperimentJustLoaded(true);

  try {
    // ... existing code ...
```

**Step 2: Reset the flag after experiment loads**

Find the line `setExperimentLoading(false);` (around line 544). Right after it, add:

```typescript
// Clear loading state immediately (no artificial delay to avoid race conditions)
setExperimentLoading(false);

// Reset jump-to-end flag after a tick so all useEffects can read it
setTimeout(() => setExperimentJustLoaded(false), 0);
```

**Step 3: Test the jump to end behavior**

```bash
npm run dev
```

Manual test:
1. Open any algorithm tab
2. Use playback controls to go to iteration 5 (middle of the run)
3. Click an experiment card in "Try This" section
4. Verify playback **jumps to the last iteration** automatically
5. Now change a parameter (e.g., alpha slider)
6. Verify playback **preserves percentage position** (not jumping to end)

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: jump to end of iterations when experiment loads"
```

---

## Task 8: Clean Up Commented State Declarations

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:58-104`

**Step 1: Remove all commented state declarations**

Delete the commented lines:
```typescript
// const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
// const [gdFixedSummary, setGdFixedSummary] = useState<AlgorithmSummary | null>(null);
// const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
```

And similar comments for the other 4 algorithms.

**Step 2: Add a single explanatory comment**

At line 58 (where algorithm state begins), add:

```typescript
// Algorithm state (hyperparameters only - iterations/currentIter/summary managed by useAlgorithmIterations hook)
```

**Step 3: Verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Final manual test of all algorithms**

```bash
npm run dev
```

Test each tab:
1. GD (Fixed Step) - verify playback, parameter changes, experiment loads
2. GD (Line Search) - verify playback, line search plot, experiment loads
3. Diagonal Precond - verify playback, experiment loads
4. Newton's Method - verify playback, Hessian matrix, line search plot, experiment loads
5. L-BFGS - verify playback, line search plot, experiment loads

**Step 5: Final commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: clean up commented state declarations"
```

---

## Task 9: Update resetToDefaults Function

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:559-576`

**Step 1: Simplify resetToDefaults**

Find the `resetToDefaults` function (around line 559-576). Replace the iteration reset lines:

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

  // Reset all algorithm iterations to 0
  gdFixed.resetIter();
  gdLS.resetIter();
  diagPrecond.resetIter();
  newton.resetIter();
  lbfgs.resetIter();

  setCustomPoints([]);
}, [gdFixed, gdLS, diagPrecond, newton, lbfgs]);
```

**Step 2: Test reset functionality**

```bash
npm run dev
```

Manual test:
1. Advance playback to middle of iterations
2. Press Ctrl+R or Ctrl+E (reset keyboard shortcut)
3. Verify all iterations reset to 0

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: use hook resetIter in resetToDefaults"
```

---

## Task 10: Update Problem Change Handler

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:1504-1529`

**Step 1: Simplify problem change state resets**

Find the `onProblemChange` handler (around line 1506-1529). Replace the manual iteration resets:

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
1. Advance to middle of iterations
2. Change problem from dropdown (e.g., Quadratic → Rosenbrock)
3. Verify iterations reset to 0

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

**Testing checklist:**
- [ ] All 5 algorithm tabs load correctly
- [ ] Playback controls work (next, previous, slider)
- [ ] Parameter changes preserve percentage position
- [ ] Experiment loads jump to end
- [ ] Problem changes reset to iteration 0
- [ ] Reset to defaults works
- [ ] Keyboard navigation works
- [ ] Algorithm-specific visualizations render (Hessian, line search plots)
