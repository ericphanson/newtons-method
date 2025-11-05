# Algorithm Abstraction and Feature Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete 100% of remaining functionality with NO TODOs, NO @ts-expect-error comments, NO incomplete features. Every algorithm must work with every problem type. Side-by-side comparison must be fully functional.

**Current State:**
- ✅ Experiment buttons wired up and functional
- ✅ Problem switching UI complete
- ✅ Visualization infrastructure works for all problems
- ❌ Algorithms hardcoded to logistic regression only
- ❌ Side-by-side comparison not implemented
- ❌ Several @ts-expect-error suppressions in code
- ❌ Initial point and maxIter not wired to UI controls

**Target State:**
- ✅ All 4 algorithms work with all 5 problem types (20 combinations total)
- ✅ Side-by-side comparison view functional
- ✅ All @ts-expect-error comments removed
- ✅ Initial point controls wired to experiments
- ✅ MaxIter controls properly integrated
- ✅ Zero TODOs, zero incomplete features

---

## Phase 1: Algorithm Abstraction

### Task 1: Create Generic Algorithm Runner Interface

**Objective:** Define a unified interface that all algorithms will use, supporting both dataset-based (logistic regression) and pure optimization problems.

**Files to create:**
- `src/algorithms/types.ts`

**Implementation:**

```typescript
// src/algorithms/types.ts

export interface ObjectiveFunction {
  /**
   * Compute objective value at point w
   * For logistic regression: this wraps the dataset
   * For pure optimization: this is just f(w)
   */
  (w: number[]): number;
}

export interface GradientFunction {
  /**
   * Compute gradient at point w
   */
  (w: number[]): number[];
}

export interface HessianFunction {
  /**
   * Compute Hessian matrix at point w
   */
  (w: number[]): number[][];
}

export interface ProblemFunctions {
  objective: ObjectiveFunction;
  gradient: GradientFunction;
  hessian?: HessianFunction; // Optional, only needed for Newton
  dimensionality: number; // 2 for pure optimization, 3 for logistic regression
}

export interface AlgorithmOptions {
  maxIter: number;
  initialPoint?: number[]; // If not provided, use default [0.1, 0.1] or [0.1, 0.1, 0.0]
}
```

**Commit:** `feat(algorithms): add generic algorithm runner interface`

---

### Task 2: Refactor Gradient Descent (Fixed Step)

**Objective:** Make gradient descent work with any problem via ProblemFunctions interface.

**Files to modify:**
- `src/algorithms/gradient-descent.ts`

**Changes:**

1. **Update function signature:**
```typescript
export const runGradientDescent = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { alpha: number; lambda?: number }
): GDIteration[] => {
  const { maxIter, alpha, lambda = 0, initialPoint } = options;
  const iterations: GDIteration[] = [];

  // Initialize weights based on dimensionality
  let w = initialPoint || (problem.dimensionality === 3
    ? [0.1, 0.1, 0.0]
    : [0.1, 0.1]);
```

2. **Replace hardcoded computations:**
```typescript
  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Fixed step size update
    const wNew = add(w, scale(direction, alpha));
    const newLoss = problem.objective(wNew);
```

3. **Remove DataPoint dependency:**
- Delete `import { DataPoint, computeLossAndGradient } from '../shared-utils'`
- Keep only math utilities: `norm, scale, add`

**Testing:**
- Should compile without errors
- Keep old function as deprecated export for backward compatibility

**Commit:** `refactor(gd-fixed): use generic problem interface`

---

### Task 3: Refactor Gradient Descent with Line Search

**Objective:** Same as Task 2, but for line search variant.

**Files to modify:**
- `src/algorithms/gradient-descent-linesearch.ts`

**Changes:** Same pattern as Task 2
- Update signature to accept `ProblemFunctions`
- Replace `computeLossAndGradient` with `problem.objective` and `problem.gradient`
- Support initial point from options
- Remove DataPoint dependency

**Armijo line search loop:**
```typescript
// Backtracking line search
let alpha = 1.0;
const maxLineSearchIter = 20;
for (let j = 0; j < maxLineSearchIter; j++) {
  const wTrial = add(w, scale(direction, alpha));
  const lossTrial = problem.objective(wTrial);

  // Armijo condition: f(w_new) <= f(w) + c1 * alpha * grad^T * direction
  if (lossTrial <= loss + c1 * alpha * dot(grad, direction)) {
    wNew = wTrial;
    newLoss = lossTrial;
    break;
  }
  alpha *= 0.5;
}
```

**Commit:** `refactor(gd-linesearch): use generic problem interface`

---

### Task 4: Refactor Newton's Method

**Objective:** Make Newton work with any problem via Hessian interface.

**Files to modify:**
- `src/algorithms/newton.ts`

**Changes:**

1. **Update signature:**
```typescript
export const runNewton = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { c1?: number; lambda?: number }
): NewtonIteration[] => {
  if (!problem.hessian) {
    throw new Error('Newton method requires Hessian function');
  }
```

2. **Replace hardcoded Hessian computation:**
```typescript
  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const hess = problem.hessian(w);
    const gradNorm = norm(grad);

    // Solve Hessian * direction = -grad (Newton direction)
    const direction = solveLinearSystem(hess, scale(grad, -1));
```

**Key consideration:** Hessian is required. All problems in registry have Hessian defined.

**Commit:** `refactor(newton): use generic problem interface`

---

### Task 5: Refactor L-BFGS

**Objective:** Make L-BFGS work with any problem.

**Files to modify:**
- `src/algorithms/lbfgs.ts`

**Changes:** Same pattern
- Accept `ProblemFunctions`
- Replace `computeLossAndGradient` with problem functions
- L-BFGS doesn't need Hessian (quasi-Newton method)
- Keep history buffer logic intact

**Two-loop recursion update:**
```typescript
// Same algorithm, just use:
const grad = problem.gradient(w);
const loss = problem.objective(w);
// Instead of computeLossAndGradient
```

**Commit:** `refactor(lbfgs): use generic problem interface`

---

## Phase 2: Integrate Refactored Algorithms with UI

### Task 6: Create Problem-to-Functions Adapter

**Objective:** Convert ProblemDefinition and logistic regression into ProblemFunctions format.

**Files to create:**
- `src/utils/problemAdapter.ts`

**Implementation:**

```typescript
import { ProblemDefinition } from '../types/experiments';
import { ProblemFunctions } from '../algorithms/types';
import { DataPoint } from '../shared-utils';
import { logisticObjective, logisticGradient, logisticHessian } from './logisticRegression';

/**
 * Convert a ProblemDefinition from the problem registry into ProblemFunctions format
 */
export function problemToProblemFunctions(problem: ProblemDefinition): ProblemFunctions {
  return {
    objective: problem.objective,
    gradient: problem.gradient,
    hessian: problem.hessian,
    dimensionality: 2, // All registry problems are 2D
  };
}

/**
 * Convert logistic regression with dataset into ProblemFunctions format
 */
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number
): ProblemFunctions {
  return {
    objective: (w: number[]) => logisticObjective(w, data, lambda),
    gradient: (w: number[]) => logisticGradient(w, data, lambda),
    hessian: (w: number[]) => logisticHessian(w, data, lambda),
    dimensionality: 3, // Logistic regression uses [w0, w1, w2] with bias
  };
}
```

**Commit:** `feat(utils): add problem adapter for algorithm integration`

---

### Task 7: Update UnifiedVisualizer to Use Refactored Algorithms

**Objective:** Wire the new algorithm functions to the UI, making all 20 problem×algorithm combinations work.

**Files to modify:**
- `src/UnifiedVisualizer.tsx`

**Changes:**

1. **Import new dependencies:**
```typescript
import { runGradientDescent } from './algorithms/gradient-descent';
import { runGradientDescentLineSearch } from './algorithms/gradient-descent-linesearch';
import { runNewton } from './algorithms/newton';
import { runLBFGS } from './algorithms/lbfgs';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions } from './utils/problemAdapter';
```

2. **Create helper to get current problem functions:**
```typescript
const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
  if (currentProblem === 'logistic-regression') {
    return logisticRegressionToProblemFunctions(data, lambda);
  } else {
    const problem = getProblem(currentProblem);
    if (!problem) {
      throw new Error(`Problem not found: ${currentProblem}`);
    }
    return problemToProblemFunctions(problem);
  }
}, [currentProblem, data, lambda]);
```

3. **Update algorithm execution useEffects:**

**GD Fixed:**
```typescript
useEffect(() => {
  try {
    const problemFuncs = getCurrentProblemFunctions();
    const iterations = runGradientDescent(problemFuncs, {
      maxIter: 80,
      alpha: gdFixedAlpha,
      lambda,
      initialPoint: undefined, // Use default for now
    });
    setGdFixedIterations(iterations);
    setGdFixedCurrentIter(0);
  } catch (error) {
    console.error('GD Fixed error:', error);
    setGdFixedIterations([]);
  }
}, [currentProblem, lambda, gdFixedAlpha, getCurrentProblemFunctions]);
```

**GD Line Search, Newton, L-BFGS:** Same pattern

4. **Remove @ts-expect-error comments:**
- These will be addressed when we add proper state management in next tasks

**Testing checklist:**
- [ ] Switch to Quadratic problem → GD Fixed works
- [ ] Switch to Rosenbrock → All 4 algorithms work
- [ ] Switch back to Logistic Regression → Still works
- [ ] Load experiment "Advantage: Varying Curvature" → Rosenbrock problem runs
- [ ] All 20 combinations functional

**Commit:** `feat(ui): integrate refactored algorithms with all problems`

---

## Phase 3: Fix State Management TODOs

### Task 8: Add Missing State Setters

**Objective:** Remove all @ts-expect-error comments by adding the missing state variables.

**Files to modify:**
- `src/UnifiedVisualizer.tsx`

**Changes:**

1. **Add maxIter state and UI control:**
```typescript
// Add state
const [maxIter, setMaxIter] = useState(100);

// Add UI control in each algorithm's controls section:
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Max Iterations
  </label>
  <input
    type="number"
    min="10"
    max="500"
    step="10"
    value={maxIter}
    onChange={(e) => setMaxIter(Number(e.target.value))}
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
  />
</div>
```

2. **Add initial point state and UI controls:**
```typescript
// Add state
const [initialW0, setInitialW0] = useState(-1);
const [initialW1, setInitialW1] = useState(1);

// Add UI controls in each algorithm's controls section:
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Initial Point
  </label>
  <div className="grid grid-cols-2 gap-2">
    <div>
      <label className="text-xs text-gray-600">
        <InlineMath>w_0</InlineMath>
      </label>
      <input
        type="number"
        step="0.1"
        value={initialW0}
        onChange={(e) => setInitialW0(Number(e.target.value))}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
      />
    </div>
    <div>
      <label className="text-xs text-gray-600">
        <InlineMath>w_1</InlineMath>
      </label>
      <input
        type="number"
        step="0.1"
        value={initialW1}
        onChange={(e) => setInitialW1(Number(e.target.value))}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
      />
    </div>
  </div>
</div>
```

3. **Update algorithm calls to use initial point:**
```typescript
const iterations = runGradientDescent(problemFuncs, {
  maxIter,
  alpha: gdFixedAlpha,
  lambda,
  initialPoint: [initialW0, initialW1], // or [initialW0, initialW1, 0] for logistic
});
```

4. **Remove all @ts-expect-error comments:**
- Line 301: `setMaxIter` - NOW EXISTS
- Lines 307, 309: `setInitialW0/W1` - NOW EXIST
- Line 330: DataPoint type mismatch - FIXED (no longer using DataPoint in new system)
- Lines 335, 337: `setCurrentIteration` and `setHistory` - NOT NEEDED (iterations computed in useEffect)

5. **Update defaultConfig ref:**
```typescript
const defaultConfig = useRef({
  gdFixedAlpha: 0.1,
  gdLSC1: 0.0001,
  newtonC1: 0.0001,
  lbfgsC1: 0.0001,
  lambda: 0.0001,
  lbfgsM: 5,
  maxIter: 100,
  initialW0: -1,
  initialW1: 1,
});
```

6. **Update resetToDefaults:**
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
  setCurrentExperiment(null);
  // Reset iterations computed automatically via useEffect
  setCurrentProblem('logistic-regression');
  setCustomPoints([]);
}, []);
```

**Commit:** `feat(ui): add maxIter and initial point controls, remove all @ts-expect-error`

---

## Phase 4: Side-by-Side Comparison View

### Task 9: Design Comparison View Component

**Objective:** Create a reusable component for displaying two algorithm runs side-by-side.

**Files to create:**
- `src/components/ComparisonView.tsx`

**Implementation:**

```typescript
import React from 'react';
import { InlineMath } from './Math';

export interface ComparisonRun {
  name: string;
  iterations: any[]; // Algorithm-specific iteration type
  currentIter: number;
  color: string; // For visual distinction
}

interface ComparisonViewProps {
  left: ComparisonRun;
  right: ComparisonRun;
  onLeftIterChange: (iter: number) => void;
  onRightIterChange: (iter: number) => void;
}

export function ComparisonView({ left, right, onLeftIterChange, onRightIterChange }: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Left Algorithm */}
      <div className="border-2 border-blue-500 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-700 mb-3">{left.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Iteration:</span>
            <span className="font-mono">{left.currentIter + 1} / {left.iterations.length}</span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(0, left.iterations.length - 1)}
            value={left.currentIter}
            onChange={(e) => onLeftIterChange(Number(e.target.value))}
            className="w-full"
          />

          {left.iterations[left.currentIter] && (
            <>
              <div className="text-sm">
                <span className="font-medium">Loss:</span>{' '}
                <span className="font-mono">{left.iterations[left.currentIter].loss.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Gradient Norm:</span>{' '}
                <span className="font-mono">{left.iterations[left.currentIter].gradNorm.toFixed(6)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Algorithm */}
      <div className="border-2 border-green-500 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-700 mb-3">{right.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Iteration:</span>
            <span className="font-mono">{right.currentIter + 1} / {right.iterations.length}</span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(0, right.iterations.length - 1)}
            value={right.currentIter}
            onChange={(e) => onRightIterChange(Number(e.target.value))}
            className="w-full"
          />

          {right.iterations[right.currentIter] && (
            <>
              <div className="text-sm">
                <span className="font-medium">Loss:</span>{' '}
                <span className="font-mono">{right.iterations[right.currentIter].loss.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Gradient Norm:</span>{' '}
                <span className="font-mono">{right.iterations[right.currentIter].gradNorm.toFixed(6)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Commit:** `feat(components): add ComparisonView for side-by-side algorithm comparison`

---

### Task 10: Add Comparison Canvas

**Objective:** Create a dual-canvas component that shows both algorithm trajectories.

**Files to create:**
- `src/components/ComparisonCanvas.tsx`

**Implementation:**

```typescript
import React, { useRef, useEffect } from 'react';

interface ComparisonCanvasProps {
  leftIterations: any[];
  leftCurrentIter: number;
  leftColor: string;
  rightIterations: any[];
  rightCurrentIter: number;
  rightColor: string;
  width?: number;
  height?: number;
  title: string;
}

export function ComparisonCanvas({
  leftIterations,
  leftCurrentIter,
  leftColor,
  rightIterations,
  rightCurrentIter,
  rightColor,
  width = 600,
  height = 400,
  title,
}: ComparisonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw axes, grid, etc.
    // ... (similar to parameter space canvas)

    // Draw left algorithm trajectory
    ctx.strokeStyle = leftColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= leftCurrentIter && i < leftIterations.length; i++) {
      const iter = leftIterations[i];
      const x = /* map w0 to canvas x */;
      const y = /* map w1 to canvas y */;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw right algorithm trajectory
    ctx.strokeStyle = rightColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= rightCurrentIter && i < rightIterations.length; i++) {
      const iter = rightIterations[i];
      const x = /* map w0 to canvas x */;
      const y = /* map w1 to canvas y */;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw current positions as larger dots
    // ...

  }, [leftIterations, leftCurrentIter, rightIterations, rightCurrentIter, leftColor, rightColor, width, height]);

  return (
    <div>
      <h4 className="text-center font-semibold mb-2">{title}</h4>
      <canvas ref={canvasRef} width={width} height={height} className="border border-gray-300" />
    </div>
  );
}
```

**Commit:** `feat(components): add ComparisonCanvas for dual trajectory visualization`

---

### Task 11: Wire Comparison Experiments

**Objective:** Implement the comparison experiments that currently have TODO comments.

**Files to modify:**
- `src/UnifiedVisualizer.tsx`
- `src/experiments/gd-linesearch-presets.ts`
- `src/experiments/lbfgs-presets.ts`

**Changes:**

1. **Add comparison mode state:**
```typescript
const [comparisonMode, setComparisonMode] = useState<'none' | 'gd-ls-compare' | 'lbfgs-compare' | 'newton-compare'>('none');
const [comparisonLeftIter, setComparisonLeftIter] = useState(0);
const [comparisonRightIter, setComparisonRightIter] = useState(0);
```

2. **Create comparison experiment presets:**

In `gd-linesearch-presets.ts`:
```typescript
{
  id: 'gd-ls-compare',
  name: 'Compare: Fixed vs Adaptive',
  description: 'Side-by-side: fixed step (α=0.1) vs line search',
  problem: 'quadratic',
  hyperparameters: {
    c1: 0.0001,
    lambda: 0,
    maxIter: 50,
  },
  initialPoint: [2, 2],
  expectation: 'Observe: Line search adapts step size, fixed step is consistent but slower',
  comparisonConfig: {
    left: { algorithm: 'gd-fixed', alpha: 0.1 },
    right: { algorithm: 'gd-linesearch', c1: 0.0001 },
  },
},
```

3. **Update experiment type to support comparison:**
```typescript
// In src/types/experiments.ts
export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  problem: ProblemType;
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number;
    maxIter?: number;
  };
  initialPoint?: [number, number];
  dataset?: DataPoint[];
  expectation: string;
  comparisonConfig?: {
    left: { algorithm: string; [key: string]: any };
    right: { algorithm: string; [key: string]: any };
  };
}
```

4. **Handle comparison mode in loadExperiment:**
```typescript
// In loadExperiment function:
if (experiment.comparisonConfig) {
  setComparisonMode(experiment.id as any);
  // Run both algorithms
  // Set up comparison state
} else {
  setComparisonMode('none');
  // Normal single-algorithm mode
}
```

5. **Render comparison view when active:**
```typescript
{comparisonMode !== 'none' ? (
  <ComparisonView
    left={{
      name: /* left algorithm name */,
      iterations: /* left iterations */,
      currentIter: comparisonLeftIter,
      color: '#3b82f6',
    }}
    right={{
      name: /* right algorithm name */,
      iterations: /* right iterations */,
      currentIter: comparisonRightIter,
      color: '#10b981',
    }}
    onLeftIterChange={setComparisonLeftIter}
    onRightIterChange={setComparisonRightIter}
  />
) : (
  /* Normal single-algorithm controls */
)}
```

6. **Update experiment buttons to remove TODO comments:**
```typescript
// Replace:
// TODO: Implement side-by-side comparison view

// With actual functionality:
onClick={() => {
  const experiments = getExperimentsForAlgorithm('gd-linesearch');
  const exp = experiments.find(e => e.id === 'gd-ls-compare');
  if (exp) loadExperiment(exp);
}}
```

**Commit:** `feat(experiments): implement side-by-side comparison view`

---

## Phase 5: Final Polish and Testing

### Task 12: Update Documentation

**Objective:** Update all documentation to reflect 100% completion.

**Files to modify:**
- `docs/known-issues.md`
- `docs/experiments-guide.md`
- `docs/plans/2025-11-05-pedagogical-content-completion-notes.md`

**Changes:**

1. **Update known-issues.md:**
```markdown
# Known Issues

## None! 🎉

All planned features are fully implemented:
- ✅ All 20 problem × algorithm combinations working
- ✅ Side-by-side comparison mode functional
- ✅ Problem switching fully integrated
- ✅ All controls wired to experiments

## Future Enhancements (Optional)

These are NOT issues, just ideas for future expansion:
- Animation playback of experiment trajectories
- Experiment result recording and replay
- Custom experiment creation UI
- Experiment sharing via URL parameters
- Additional problem types (Himmelblau, Beale, etc.)
```

2. **Update experiments-guide.md:**
- Add section on comparison mode
- Document all 20 working combinations
- Add troubleshooting section

3. **Update completion notes:**
```markdown
## Phase 3: Algorithm Abstraction (Complete)

**Completed:** 2025-11-05

All algorithms now work with all problem types through generic ProblemFunctions interface.

### Implementation Summary
- Refactored 4 algorithm modules
- Created problem adapter utility
- Added initial point and maxIter controls
- Implemented side-by-side comparison mode
- Removed all @ts-expect-error suppressions
- Removed all TODO comments

### Test Matrix (All Green)
All 20 combinations verified working:
- Logistic Regression: GD Fixed ✅, GD LS ✅, Newton ✅, L-BFGS ✅
- Quadratic Bowl: GD Fixed ✅, GD LS ✅, Newton ✅, L-BFGS ✅
- Ill-Conditioned: GD Fixed ✅, GD LS ✅, Newton ✅, L-BFGS ✅
- Rosenbrock: GD Fixed ✅, GD LS ✅, Newton ✅, L-BFGS ✅
- Saddle Point: GD Fixed ✅, GD LS ✅, Newton ✅, L-BFGS ✅

### Comparison Mode
- GD Fixed vs GD Line Search ✅
- L-BFGS (M=3) vs L-BFGS (M=10) ✅
- Newton vs GD on Ill-Conditioned ✅
```

**Commit:** `docs: update documentation for 100% feature completion`

---

### Task 13: Comprehensive Testing

**Objective:** Verify every feature works perfectly.

**Testing Checklist:**

**Problem Switching:**
- [ ] Switch to each of 5 problems via dropdown
- [ ] Verify parameter space shows correct landscape
- [ ] Verify data space handles dataset correctly

**Algorithm Execution:**
- [ ] Run GD Fixed on all 5 problems
- [ ] Run GD Line Search on all 5 problems
- [ ] Run Newton on all 5 problems (verify Hessian works)
- [ ] Run L-BFGS on all 5 problems

**Experiment Loading:**
- [ ] Load each of 17 experiments
- [ ] Verify problem switches correctly
- [ ] Verify hyperparameters update
- [ ] Verify initial points work
- [ ] Verify toast notifications appear

**Comparison Mode:**
- [ ] Load GD comparison experiment
- [ ] Load L-BFGS comparison experiment
- [ ] Load Newton comparison experiment
- [ ] Verify both trajectories render
- [ ] Verify independent iteration controls

**UI Controls:**
- [ ] maxIter slider updates algorithm
- [ ] Initial point inputs update algorithm
- [ ] Reset button clears everything
- [ ] Keyboard shortcuts work (Cmd+E, Cmd+R)

**Edge Cases:**
- [ ] Switch problem mid-iteration (should reset)
- [ ] Load experiment while comparison mode active (should switch modes)
- [ ] Change hyperparameter while algorithm running (should recompute)

**Build & Performance:**
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run build` has zero TypeScript errors
- [ ] No console errors in browser
- [ ] No @ts-expect-error comments remain
- [ ] No TODO comments remain

**Documentation:**
```bash
# Verify no TODOs
grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx"
# Should return: (no results)

# Verify no @ts-expect-error
grep -r "@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
# Should return: (no results)
```

**Commit:** `test: verify 100% feature completion - all tests pass`

---

### Task 14: Final Code Cleanup

**Objective:** Remove any dead code, clean up comments, ensure professional quality.

**Files to review:**
- All files in `src/`

**Cleanup tasks:**
- [ ] Remove commented-out code
- [ ] Remove debug console.logs (except intentional logging)
- [ ] Ensure all functions have JSDoc comments
- [ ] Verify consistent code style
- [ ] Remove unused imports
- [ ] Remove unused variables

**Run linter:**
```bash
npm run lint
# Fix any issues
```

**Commit:** `chore: final code cleanup and polish`

---

## Success Criteria

✅ **Zero TODOs** in source code
✅ **Zero @ts-expect-error** suppressions
✅ **Zero TypeScript errors** in build
✅ **All 20 problem×algorithm combinations** working
✅ **All 17 experiments** functional
✅ **Side-by-side comparison** mode complete
✅ **All UI controls** wired and functional
✅ **Documentation** updated and accurate
✅ **Build passes** with no warnings
✅ **Browser console** clean (no errors)

## Estimated Timeline

- **Phase 1 (Algorithm Abstraction):** 5 tasks, ~2-3 hours
- **Phase 2 (UI Integration):** 2 tasks, ~1 hour
- **Phase 3 (State Management):** 1 task, ~30 mins
- **Phase 4 (Comparison View):** 3 tasks, ~2 hours
- **Phase 5 (Polish & Testing):** 3 tasks, ~1 hour

**Total:** ~6-7 hours for complete implementation

---

## Implementation Notes

**For Claude implementing this plan:**

1. Execute tasks sequentially - each builds on previous
2. Test after each commit - don't accumulate broken states
3. If you encounter issues, document them and adjust approach
4. Keep commits atomic and well-described
5. After Phase 2 Task 7, you should be able to run all algorithms on all problems
6. Comparison mode (Phase 4) is independent and can be done separately if needed
7. Final testing (Phase 5 Task 13) is MANDATORY - verify every checkbox

**Success = 100% completion, zero exceptions, production ready.**
