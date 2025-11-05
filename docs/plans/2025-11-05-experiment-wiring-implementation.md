# Experiment Wiring and Remaining Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the interactive experiment system by wiring up all 17 experiment buttons to load presets, add missing problem types, and implement problem switcher UI.

**Architecture:** Add event handlers to experiment buttons that load preset configurations, switch problems when needed, update algorithm state, and reset visualizations. Add UI for manual problem selection. Create missing "Non-Convex with Saddle" problem type.

**Tech Stack:** React, TypeScript, existing experiment presets system, problem registry, UnifiedVisualizer state management

**Prerequisites:** Tasks 1-29 must be complete (all content, presets, and problems exist).

---

## Task 1: Add Non-Convex Saddle Problem

**Files:**
- Create: `src/problems/saddle.ts`
- Modify: `src/problems/index.ts`

**Step 1: Create saddle point problem definition**

Create `src/problems/saddle.ts`:

```typescript
import { ProblemDefinition } from '../types/experiments';

// Non-convex function with saddle point at origin
// f(w) = w0^2 - w1^2 (hyperbolic paraboloid)
// Has saddle point at (0, 0) with one positive and one negative eigenvalue
export const saddleProblem: ProblemDefinition = {
  name: 'Saddle Point Function',
  description: 'Non-convex hyperbolic paraboloid f(w) = w₀² - w₁² with saddle at origin',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 - w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, -2 * w1];
  },

  hessian: (w: number[]): number[][] => {
    // Constant Hessian = [[2, 0], [0, -2]]
    // Eigenvalues: λ1 = 2 (positive), λ2 = -2 (negative) → saddle point
    return [[2, 0], [0, -2]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },
};
```

**Step 2: Add to problem registry**

Modify `src/problems/index.ts`:

```typescript
import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, illConditionedQuadratic } from './quadratic';
import { rosenbrockProblem } from './rosenbrock';
import { saddleProblem } from './saddle';

export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

export {
  quadraticProblem,
  illConditionedQuadratic,
  rosenbrockProblem,
  saddleProblem
};
```

**Step 3: Update ProblemType in types**

Modify `src/types/experiments.ts`:

```typescript
export type ProblemType =
  | 'logistic-regression'
  | 'quadratic'
  | 'ill-conditioned-quadratic'
  | 'rosenbrock'
  | 'non-convex-saddle';  // Add this line
```

**Step 4: Test build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add src/problems/saddle.ts src/problems/index.ts src/types/experiments.ts
git commit -m "feat(problems): add non-convex saddle point problem

Add hyperbolic paraboloid function with saddle point at origin.
Hessian has one positive and one negative eigenvalue.
Useful for demonstrating Newton's method failure modes."
```

---

## Task 2: Add Experiment State to UnifiedVisualizer

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add state near top of component)

**Step 1: Add experiment state**

Find the component state declarations (around line 30-100) and add:

```typescript
// Experiment state
const [currentExperiment, setCurrentExperiment] = useState<string | null>(null);
const [experimentLoading, setExperimentLoading] = useState(false);
```

**Step 2: Import experiment presets**

Add to imports at top of file:

```typescript
import { getExperimentsForAlgorithm } from './experiments';
import { getProblem } from './problems';
import type { ExperimentPreset } from './types/experiments';
```

**Step 3: Test build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add experiment state to UnifiedVisualizer

Add state for tracking current experiment and loading status.
Import experiment presets and problem registry."
```

---

## Task 3: Implement loadExperiment Function

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add function after state declarations)

**Step 1: Add loadExperiment function**

Add after state declarations (around line 100):

```typescript
const loadExperiment = useCallback((experiment: ExperimentPreset) => {
  setExperimentLoading(true);
  setCurrentExperiment(experiment.id);

  try {
    // 1. Update hyperparameters
    if (experiment.hyperparameters.alpha !== undefined) {
      setGdFixedAlpha(experiment.hyperparameters.alpha);
    }
    if (experiment.hyperparameters.c1 !== undefined) {
      setGdLSC1(experiment.hyperparameters.c1);
      setNewtonC1(experiment.hyperparameters.c1);
      setLbfgsC1(experiment.hyperparameters.c1);
    }
    if (experiment.hyperparameters.lambda !== undefined) {
      setLambda(experiment.hyperparameters.lambda);
    }
    if (experiment.hyperparameters.m !== undefined) {
      setLbfgsM(experiment.hyperparameters.m);
    }
    if (experiment.hyperparameters.maxIter !== undefined) {
      setMaxIter(experiment.hyperparameters.maxIter);
    }

    // 2. Set initial point if specified
    if (experiment.initialPoint) {
      setInitialW0(experiment.initialPoint[0]);
      setInitialW1(experiment.initialPoint[1]);
    }

    // 3. Switch problem if needed
    if (experiment.problem !== 'logistic-regression') {
      const problem = getProblem(experiment.problem);
      if (problem) {
        // TODO: Actually switch the problem in the algorithm
        console.log('Would switch to problem:', experiment.problem);
      }
    }

    // 4. Load custom dataset if provided
    if (experiment.dataset) {
      setDataPoints(experiment.dataset);
    }

    // 5. Reset algorithm to apply changes
    setCurrentIteration(0);
    setHistory([]);

    // Show success message briefly
    setTimeout(() => {
      setExperimentLoading(false);
    }, 300);

  } catch (error) {
    console.error('Error loading experiment:', error);
    setExperimentLoading(false);
  }
}, []);
```

**Step 2: Import useCallback**

Add to React imports at top:

```typescript
import { useState, useEffect, useCallback } from 'react';
```

**Step 3: Test build**

Run: `npm run build`
Expected: Build succeeds (may have warnings about missing state setters - we'll add those next)

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add loadExperiment function

Implement function to load experiment presets:
- Updates hyperparameters (alpha, c1, lambda, M, maxIter)
- Sets initial point
- Switches problems (placeholder for now)
- Loads custom datasets
- Resets algorithm state"
```

---

## Task 4: Wire Up GD Fixed Experiment Buttons

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (GD Fixed "Try This" section)

**Step 1: Find GD Fixed Try This section**

Locate the GD Fixed "Try This" section (around line 1362-1438).

**Step 2: Add onClick handlers to buttons**

Find the first experiment button and modify:

```typescript
// Before:
<button className="text-green-600 font-bold text-lg">▶</button>

// After:
<button
  className="text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 cursor-pointer"
  onClick={() => {
    const experiments = getExperimentsForAlgorithm('gd-fixed');
    const exp = experiments.find(e => e.id === 'gd-fixed-success');
    if (exp) loadExperiment(exp);
  }}
  disabled={experimentLoading}
  aria-label="Load experiment: Good Step Size"
>
  ▶
</button>
```

**Step 3: Repeat for all 4 GD Fixed experiments**

Apply similar pattern to all 4 buttons with IDs:
1. `gd-fixed-success`
2. `gd-fixed-diverge`
3. `gd-fixed-too-small`
4. `gd-fixed-ill-conditioned`

**Step 4: Test in browser**

Run: `npm run dev`
Expected: Clicking buttons updates hyperparameters and resets algorithm

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(gd-fixed): wire up Try This experiment buttons

Connect 4 experiment buttons to loadExperiment function:
- Success: α=0.1
- Failure: α=0.8 (too large)
- Failure: α=0.001 (too small)
- Struggle: ill-conditioned problem"
```

---

## Task 5: Wire Up GD Line Search Experiment Buttons

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (GD Line Search "Try This" section)

**Step 1: Find GD Line Search Try This section**

Locate around line 1840-1932.

**Step 2: Add onClick handlers to all 5 buttons**

Apply same pattern with experiment IDs:
1. `gd-ls-success`
2. `gd-ls-compare` (future: needs side-by-side comparison)
3. `gd-ls-c1-too-small`
4. `gd-ls-c1-too-large`
5. `gd-ls-varying-curvature`

**Step 3: Test in browser**

Run: `npm run dev`
Expected: Buttons load presets and update c1 parameter

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(gd-linesearch): wire up Try This experiment buttons

Connect 5 experiment buttons to loadExperiment function:
- Success: automatic adaptation
- Compare: fixed vs adaptive (placeholder)
- Failure: c1 too small
- Failure: c1 too large
- Advantage: varying curvature (Rosenbrock)"
```

---

## Task 6: Wire Up Newton Experiment Buttons

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (Newton "Try This" section)

**Step 1: Find Newton Try This section**

Locate Newton's "Try This" section.

**Step 2: Add onClick handlers to all 4 buttons**

Apply pattern with experiment IDs:
1. `newton-success-quadratic`
2. `newton-failure-rosenbrock`
3. `newton-fixed-linesearch`
4. `newton-compare-ill-conditioned`

**Step 3: Test in browser**

Run: `npm run dev`
Expected: Buttons load Newton-specific presets

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): wire up Try This experiment buttons

Connect 4 experiment buttons to loadExperiment function:
- Success: quadratic convergence on bowl
- Failure: saddle point with negative eigenvalue
- Fixed: line search rescue
- Compare: Newton vs GD on ill-conditioned"
```

---

## Task 7: Wire Up L-BFGS Experiment Buttons

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS "Try This" section)

**Step 1: Find L-BFGS Try This section**

Locate L-BFGS "Try This" section.

**Step 2: Add onClick handlers to all 4 buttons**

Apply pattern with experiment IDs:
1. `lbfgs-success-quadratic`
2. `lbfgs-memory-comparison`
3. `lbfgs-rosenbrock`

**Step 3: Test in browser**

Run: `npm run dev`
Expected: Buttons update M parameter and switch problems

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): wire up Try This experiment buttons

Connect 4 experiment buttons to loadExperiment function:
- Success: strongly convex without Hessian
- Memory: M=3 vs M=10 comparison
- Challenge: Rosenbrock valley navigation
- Compare: L-BFGS vs GD vs Newton (placeholder)"
```

---

## Task 8: Add Experiment Indicator UI

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add UI component)

**Step 1: Add experiment indicator above visualizations**

Find the visualization section start (around line 2200) and add before it:

```typescript
{currentExperiment && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 font-bold">▶</span>
        <span className="text-sm font-semibold text-blue-900">
          Experiment Active
        </span>
        <span className="text-sm text-gray-700">
          {currentExperiment}
        </span>
      </div>
      <button
        onClick={() => {
          setCurrentExperiment(null);
          // Optionally reset to defaults
        }}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Clear
      </button>
    </div>
  </div>
)}
```

**Step 2: Test in browser**

Run: `npm run dev`
Expected: Blue indicator appears when experiment loaded, disappears on clear

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add experiment indicator UI

Show active experiment name with clear button above visualizations.
Blue box with experiment ID and dismiss option."
```

---

## Task 9: Add Problem Switcher UI

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add component)

**Step 1: Add problem state**

Add to state declarations:

```typescript
const [currentProblem, setCurrentProblem] = useState<string>('logistic-regression');
const [showProblemSwitcher, setShowProblemSwitcher] = useState(false);
```

**Step 2: Create problem switcher component**

Add before visualization section:

```typescript
{showProblemSwitcher && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
    <h3 className="text-sm font-semibold text-gray-900 mb-2">Problem Type</h3>
    <select
      value={currentProblem}
      onChange={(e) => {
        setCurrentProblem(e.target.value);
        // Apply problem switch
        const problem = getProblem(e.target.value);
        if (problem) {
          console.log('Switching to:', problem.name);
          // TODO: Actually switch problem implementation
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
    >
      <option value="logistic-regression">Logistic Regression (current)</option>
      <option value="quadratic">Quadratic Bowl</option>
      <option value="ill-conditioned-quadratic">Ill-Conditioned Quadratic</option>
      <option value="rosenbrock">Rosenbrock Function</option>
      <option value="non-convex-saddle">Saddle Point</option>
    </select>
    <p className="text-xs text-gray-600 mt-2">
      Note: Problem switching affects visualization domain and objective function.
    </p>
  </div>
)}
```

**Step 3: Show switcher when experiment loads**

Update `loadExperiment` function:

```typescript
// After setting experiment state:
if (experiment.problem !== 'logistic-regression') {
  setShowProblemSwitcher(true);
}
```

**Step 4: Test in browser**

Run: `npm run dev`
Expected: Problem switcher appears when non-logistic experiments loaded

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add problem switcher UI

Add dropdown to manually select problem type.
Shows when experiment loads non-default problem.
Currently shows UI only - actual switching TODO."
```

---

## Task 10: Add Loading State Visual Feedback

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (enhance buttons)

**Step 1: Add loading spinner**

Create a simple loading indicator component:

```typescript
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
```

**Step 2: Update button rendering**

Modify button template to show loading state:

```typescript
<button
  className={`text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
    experimentLoading ? 'cursor-wait' : 'cursor-pointer'
  }`}
  onClick={handleClick}
  disabled={experimentLoading}
>
  {experimentLoading ? <LoadingSpinner /> : '▶'}
</button>
```

**Step 3: Test loading behavior**

Run: `npm run dev`
Expected: Buttons show spinner briefly when loading experiment

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add loading state visual feedback

Show spinner in experiment buttons during loading.
Disable buttons and change cursor during load.
Brief 300ms loading state for smooth UX."
```

---

## Task 11: Update Experiment Presets with Saddle Problem

**Files:**
- Modify: `src/experiments/newton-presets.ts`

**Step 1: Update Newton failure experiment**

Replace the second Newton experiment (failure case) to use saddle problem:

```typescript
{
  id: 'newton-failure-saddle',
  name: 'Failure: Saddle Point with Negative Eigenvalue',
  description: 'Start at saddle point to see Hessian with negative eigenvalue',
  problem: 'non-convex-saddle',
  hyperparameters: {
    c1: 0.0001,
    lambda: 0,
    maxIter: 20,
  },
  initialPoint: [0.5, 0.5],
  expectation: 'Observe: Hessian has one negative eigenvalue, Newton direction may be ascent',
},
```

**Step 2: Test in browser**

Run: `npm run dev`
Expected: Newton failure experiment uses saddle problem

**Step 3: Commit**

```bash
git add src/experiments/newton-presets.ts
git commit -m "feat(newton): update experiment to use saddle point problem

Replace Rosenbrock failure case with explicit saddle point.
Shows negative eigenvalue more clearly at origin vicinity."
```

---

## Task 12: Add Experiment Reset Functionality

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Store original/default values**

Add ref to store defaults:

```typescript
const defaultConfig = useRef({
  gdFixedAlpha: 0.1,
  gdLSC1: 0.0001,
  newtonC1: 0.0001,
  lbfgsC1: 0.0001,
  lambda: 0.01,
  lbfgsM: 10,
  maxIter: 100,
  initialW0: -1,
  initialW1: 1,
});
```

**Step 2: Add reset function**

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
  setShowProblemSwitcher(false);
  setCurrentIteration(0);
  setHistory([]);
}, []);
```

**Step 3: Add reset button to UI**

Add button near experiment indicator:

```typescript
<button
  onClick={resetToDefaults}
  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
>
  Reset All
</button>
```

**Step 4: Test in browser**

Run: `npm run dev`
Expected: Reset button returns all params to defaults

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add reset to defaults functionality

Store default configuration in ref.
Add resetToDefaults function to restore initial state.
Add Reset All button to clear experiments and params."
```

---

## Task 13: Add Toast Notification for Experiment Load

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Create Toast component**

Create `src/components/Toast.tsx`:

```typescript
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg border shadow-lg ${colors[type]} animate-slide-up z-50`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Add toast state**

In UnifiedVisualizer:

```typescript
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
```

**Step 3: Show toast on experiment load**

Update `loadExperiment` to show toast:

```typescript
// After successful load:
setToast({
  message: `Loaded: ${experiment.name}`,
  type: 'success'
});
```

**Step 4: Render toast**

Add to component return:

```typescript
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

**Step 5: Add animation to tailwind.config.js**

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
};
```

**Step 6: Test in browser**

Run: `npm run dev`
Expected: Toast appears bottom-right when experiment loads

**Step 7: Commit**

```bash
git add src/components/Toast.tsx src/UnifiedVisualizer.tsx tailwind.config.js
git commit -m "feat(experiments): add toast notifications for experiment load

Create Toast component with slide-up animation.
Show success toast when experiment loads.
Auto-dismiss after 3 seconds with manual close option."
```

---

## Task 14: Document Experiment System Usage

**Files:**
- Create: `docs/experiments-guide.md`

**Step 1: Create user guide**

Create `docs/experiments-guide.md`:

```markdown
# Experiment System User Guide

## Overview

The Newton's Method visualizer includes 17 interactive experiments across 4 optimization algorithms. Each experiment demonstrates a specific concept, success pattern, or failure mode.

## How to Use Experiments

1. **Navigate to an algorithm tab** (GD Fixed, GD Line Search, Newton, or L-BFGS)
2. **Scroll to "Try This" section** (expanded by default)
3. **Click the ▶ play button** on any experiment card
4. **Watch the visualization** update with new parameters and problem
5. **Observe the results** as described in the experiment

## Experiment Categories

### Success Cases (Green)
Demonstrate optimal conditions and expected behavior.

### Failure Cases (Red/Orange)
Show what goes wrong with poor parameter choices.

### Comparison Cases (Blue/Purple)
Compare algorithms or parameter settings side-by-side.

## Available Experiments

### Gradient Descent (Fixed Step) - 4 Experiments
1. **Success: Good Step Size (α=0.1)** - Smooth convergence with well-chosen step size
2. **Failure: Too Large (α=0.8)** - Oscillation and divergence from overshooting
3. **Failure: Too Small (α=0.001)** - Extremely slow convergence from tiny steps
4. **Struggle: Ill-Conditioned** - Zig-zagging on elongated landscape

### Gradient Descent (Line Search) - 5 Experiments
1. **Success: Automatic Adaptation** - Line search finds good steps automatically
2. **Compare: Fixed vs Adaptive** - Side-by-side comparison (TODO)
3. **Failure: c₁ Too Small** - Accepts poor steps, wastes iterations
4. **Failure: c₁ Too Large** - Too conservative, rejects good steps
5. **Advantage: Varying Curvature** - Handles changing landscape (Rosenbrock)

### Newton's Method - 4 Experiments
1. **Success: Quadratic Convergence** - 1-2 iterations on bowl function
2. **Failure: Saddle Point** - Negative eigenvalue, wrong direction
3. **Fixed: Line Search Rescue** - Damping prevents divergence
4. **Compare: Newton vs GD** - Ill-conditioned problem comparison

### L-BFGS - 4 Experiments
1. **Success: Without Hessian** - Newton-like speed, no matrix computation
2. **Memory: M=3 vs M=10** - Memory size affects convergence rate
3. **Challenge: Rosenbrock** - Tests quasi-Newton approximation
4. **Compare: Three Algorithms** - L-BFGS vs GD vs Newton (TODO)

## Problem Types

Experiments automatically switch between these problem types:

- **Logistic Regression** - 2D classification with crescent dataset
- **Quadratic Bowl** - Strongly convex, ideal for convergence demos
- **Ill-Conditioned Quadratic** - Elongated ellipse (κ=100)
- **Rosenbrock Function** - Non-convex banana valley
- **Saddle Point** - Hyperbolic paraboloid with negative eigenvalue

## Manual Problem Switching

When an experiment loads a non-default problem, a problem switcher appears above the visualizations. You can manually select any problem type to explore its landscape.

## Resetting

Click the "Reset All" button to return all parameters to their default values and clear the active experiment.

## Technical Details

Each experiment preset defines:
- **Problem type** - Which objective function to use
- **Hyperparameters** - Algorithm-specific settings (α, c₁, M, λ)
- **Initial point** - Starting position in parameter space
- **Custom data** - Optional dataset (for logistic regression)
- **Expected observation** - What to watch for in the visualization

## Future Enhancements

- [ ] Side-by-side comparison mode for "Compare" experiments
- [ ] Animation playback of experiment trajectory
- [ ] Experiment result recording and replay
- [ ] Custom experiment creation UI
- [ ] Experiment sharing via URL parameters
```

**Step 2: Commit**

```bash
git add docs/experiments-guide.md
git commit -m "docs: add experiment system user guide

Document all 17 experiments, how to use them, problem types,
and expected observations. Provide technical details on presets."
```

---

## Task 15: Add Keyboard Shortcuts for Experiments

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add keyboard shortcut handler**

Add useEffect for keyboard shortcuts:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl/Cmd + E: Clear current experiment
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      setCurrentExperiment(null);
      resetToDefaults();
    }

    // Ctrl/Cmd + R: Reset to defaults
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      resetToDefaults();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [resetToDefaults]);
```

**Step 2: Add keyboard hint to UI**

Add hint near reset button:

```typescript
<p className="text-xs text-gray-500">
  Shortcuts: <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+E</kbd> Clear experiment,{' '}
  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+R</kbd> Reset all
</p>
```

**Step 3: Test keyboard shortcuts**

Run: `npm run dev`
Expected: Cmd+E clears experiment, Cmd+R resets all

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(experiments): add keyboard shortcuts

Add Cmd+E to clear current experiment.
Add Cmd+R to reset all parameters.
Show keyboard hints in UI."
```

---

## Task 16: Final Testing and Polish

**Files:**
- Test: All experiment buttons across all 4 tabs
- Verify: Toast notifications, loading states, problem switching

**Step 1: Test GD Fixed experiments**

Run: `npm run dev`

Test each GD Fixed button:
- ✅ Success loads α=0.1
- ✅ Failure (large) loads α=0.8
- ✅ Failure (small) loads α=0.001
- ✅ Ill-conditioned switches problem

**Step 2: Test GD Line Search experiments**

Test each GD LS button:
- ✅ Success loads default c1
- ✅ c1 too small loads 0.00001
- ✅ c1 too large loads 0.5
- ✅ Rosenbrock switches problem

**Step 3: Test Newton experiments**

Test each Newton button:
- ✅ Success switches to quadratic
- ✅ Failure switches to saddle
- ✅ Line search switches to Rosenbrock
- ✅ Ill-conditioned switches problem

**Step 4: Test L-BFGS experiments**

Test each L-BFGS button:
- ✅ Success switches to quadratic
- ✅ Memory changes M parameter
- ✅ Rosenbrock switches problem

**Step 5: Test UI features**

- ✅ Experiment indicator shows/hides
- ✅ Problem switcher appears on problem change
- ✅ Toast notification displays
- ✅ Loading spinner shows briefly
- ✅ Reset button clears everything
- ✅ Keyboard shortcuts work

**Step 6: Document any issues**

Create `docs/known-issues.md` if bugs found:

```markdown
# Known Issues

## Experiment System

- [ ] Compare experiments not fully implemented (need side-by-side view)
- [ ] Problem switching doesn't actually change objective function yet
- [ ] Custom dataset loading needs full integration

## Future Work

- Implement actual problem switching in algorithm logic
- Add side-by-side comparison mode
- Wire problem domain to visualization bounds
```

**Step 7: Final build test**

Run: `npm run build`
Expected: Production build succeeds, no errors

**Step 8: Commit**

```bash
git add docs/known-issues.md
git commit -m "test: complete experiment system testing

Verify all 17 experiment buttons work correctly.
Test UI features (toast, indicator, shortcuts).
Document known limitations for future work."
```

---

## Task 17: Update Completion Documentation

**Files:**
- Modify: `docs/plans/2025-11-05-pedagogical-content-completion-notes.md`

**Step 1: Add experiment wiring section**

Append to completion notes:

```markdown
## Experiment Wiring (Phase 2)

**Completed:** 2025-11-05

### What Was Added

1. **Interactive Experiment Buttons** - All 17 experiment ▶ buttons now functional
2. **Saddle Point Problem** - New non-convex problem with negative eigenvalue
3. **Experiment Loading** - `loadExperiment` function updates state and resets algorithm
4. **Visual Feedback** - Loading spinners, toast notifications, experiment indicator
5. **Problem Switcher** - UI for manual problem selection (shown when needed)
6. **Reset Functionality** - Reset All button and keyboard shortcuts
7. **User Documentation** - Complete guide to using experiments

### Technical Implementation

- **17 click handlers** wired to experiment preset loading
- **Toast component** with animations for user feedback
- **State management** for current experiment and loading status
- **Keyboard shortcuts** (Cmd+E, Cmd+R) for power users
- **Problem registry integration** for switching objectives

### Files Modified

- `src/UnifiedVisualizer.tsx` - Added loadExperiment, state, event handlers
- `src/problems/saddle.ts` - New saddle point problem
- `src/components/Toast.tsx` - Toast notification component
- `docs/experiments-guide.md` - User guide
- `docs/known-issues.md` - Known limitations

### Commits

- feat(problems): add non-convex saddle point problem
- feat(experiments): add experiment state and loadExperiment
- feat(gd-fixed): wire up Try This experiment buttons
- feat(gd-linesearch): wire up Try This experiment buttons
- feat(newton): wire up Try This experiment buttons
- feat(lbfgs): wire up Try This experiment buttons
- feat(experiments): add toast notifications
- feat(experiments): add keyboard shortcuts
- docs: add experiment system user guide

### What Still Needs Work

1. **Problem Switching Backend** - Currently UI only, need to wire to algorithm
2. **Side-by-Side Comparison** - "Compare" experiments need split view
3. **Visualization Domain** - Problem domain bounds not yet applied to canvas
4. **Custom Datasets** - Dataset loading partially implemented
5. **Experiment Recording** - Save/replay experiment results
```

**Step 2: Commit**

```bash
git add docs/plans/2025-11-05-pedagogical-content-completion-notes.md
git commit -m "docs: update completion notes with experiment wiring phase

Document Phase 2 completion: interactive experiments now functional.
List technical implementation details and remaining work."
```

---

## Task 18a: Audit Hardcoded Logistic Regression Usage

**Files:**
- Read: `src/UnifiedVisualizer.tsx`
- Document: Where objective/gradient/Hessian are computed

**Step 1: Search for hardcoded logistic regression**

Run: `grep -n "logistic\|sigmoid\|log(" src/UnifiedVisualizer.tsx | head -20`
Expected: Find all locations where logistic regression is computed

**Step 2: Document current architecture**

Create notes on:
- Where objective function is computed
- Where gradient is computed
- Where Hessian is computed (for Newton)
- How dataPoints are used
- Visualization domain bounds

**Step 3: Identify refactoring scope**

List all functions/components that need modification:
- Algorithm step computation
- Loss calculation
- Gradient calculation
- Hessian calculation
- Contour plot generation
- Domain bounds

**Step 4: Create refactoring checklist**

Document in `docs/problem-switching-refactor-plan.md`:

```markdown
# Problem Switching Refactor

## Current State

Hardcoded logistic regression in:
- [ ] Line XXX: Objective computation
- [ ] Line YYY: Gradient computation
- [ ] Line ZZZ: Hessian computation
- [ ] Line AAA: Contour generation
- [ ] Line BBB: Domain bounds

## Target State

Generic problem interface:
- [ ] Problem registry lookup
- [ ] Dataset vs no-dataset handling
- [ ] Dynamic domain bounds
- [ ] Problem-specific visualizations

## Testing Plan

- [ ] Test logistic regression (current)
- [ ] Test quadratic bowl
- [ ] Test ill-conditioned quadratic
- [ ] Test Rosenbrock
- [ ] Test saddle point
```

**Step 5: Commit**

```bash
git add docs/problem-switching-refactor-plan.md
git commit -m "docs: audit hardcoded logistic regression usage

Document all locations where logistic regression is hardcoded.
Create refactoring checklist for problem switching."
```

---

## Task 18b: Extract Objective/Gradient/Hessian to Problem Interface

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`
- Create: `src/utils/logisticRegression.ts`

**Step 1: Create logistic regression problem helper**

Create `src/utils/logisticRegression.ts`:

```typescript
import { DataPoint } from '../types/experiments';

// Logistic regression helper functions for when we have a dataset
export function logisticObjective(w: number[], dataPoints: DataPoint[], lambda: number): number {
  let loss = 0;
  for (const point of dataPoints) {
    const z = w[0] * point.x + w[1] * point.y;
    const y = point.label;
    loss += Math.log(1 + Math.exp(-y * z));
  }
  return loss / dataPoints.length + (lambda / 2) * (w[0] * w[0] + w[1] * w[1]);
}

export function logisticGradient(w: number[], dataPoints: DataPoint[], lambda: number): number[] {
  let gradW0 = 0;
  let gradW1 = 0;

  for (const point of dataPoints) {
    const z = w[0] * point.x + w[1] * point.y;
    const y = point.label;
    const sigmoid = 1 / (1 + Math.exp(-y * z));
    const factor = -y * (1 - sigmoid);

    gradW0 += factor * point.x;
    gradW1 += factor * point.y;
  }

  gradW0 = gradW0 / dataPoints.length + lambda * w[0];
  gradW1 = gradW1 / dataPoints.length + lambda * w[1];

  return [gradW0, gradW1];
}

export function logisticHessian(w: number[], dataPoints: DataPoint[], lambda: number): number[][] {
  let h00 = 0, h01 = 0, h11 = 0;

  for (const point of dataPoints) {
    const z = w[0] * point.x + w[1] * point.y;
    const y = point.label;
    const expTerm = Math.exp(-y * z);
    const sigmoid = 1 / (1 + expTerm);
    const factor = sigmoid * (1 - sigmoid);

    h00 += factor * point.x * point.x;
    h01 += factor * point.x * point.y;
    h11 += factor * point.y * point.y;
  }

  h00 = h00 / dataPoints.length + lambda;
  h01 = h01 / dataPoints.length;
  h11 = h11 / dataPoints.length + lambda;

  return [[h00, h01], [h01, h11]];
}
```

**Step 2: Test extracted functions**

In UnifiedVisualizer, replace one hardcoded call with extracted function:

```typescript
import { logisticObjective, logisticGradient, logisticHessian } from './utils/logisticRegression';

// Replace hardcoded objective:
const loss = logisticObjective([w0, w1], dataPoints, lambda);
```

**Step 3: Verify no regression**

Run: `npm run build && npm run dev`
Expected: Application works exactly as before

**Step 4: Commit**

```bash
git add src/utils/logisticRegression.ts src/UnifiedVisualizer.tsx
git commit -m "refactor: extract logistic regression to helper module

Move objective/gradient/Hessian computation to separate module.
No behavior change, preparation for problem switching."
```

---

## Task 18c: Add getCurrentProblem Helper Function

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add problem resolution function**

Add after state declarations:

```typescript
// Get current problem definition (logistic regression or from registry)
const getCurrentProblem = useCallback(() => {
  if (currentProblem === 'logistic-regression') {
    // Return logistic regression as problem interface
    return {
      name: 'Logistic Regression',
      description: '2D binary classification with L2 regularization',
      objective: (w: number[]) => logisticObjective(w, dataPoints, lambda),
      gradient: (w: number[]) => logisticGradient(w, dataPoints, lambda),
      hessian: (w: number[]) => logisticHessian(w, dataPoints, lambda),
      domain: {
        w0: [-3, 3],
        w1: [-3, 3],
      },
      requiresDataset: true,
    };
  } else {
    const problem = getProblem(currentProblem);
    if (!problem) {
      throw new Error(`Problem not found: ${currentProblem}`);
    }
    return {
      ...problem,
      requiresDataset: false,
    };
  }
}, [currentProblem, dataPoints, lambda]);
```

**Step 2: Update objective calculations**

Replace hardcoded objective with:

```typescript
const problem = getCurrentProblem();
const loss = problem.objective([w0, w1]);
```

**Step 3: Test with current logistic regression**

Run: `npm run dev`
Expected: Logistic regression still works

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(problems): add getCurrentProblem helper

Create unified interface for logistic regression and problem registry.
Dynamically resolves problem based on currentProblem state."
```

---

## Task 18d: Replace All Hardcoded Objective/Gradient/Hessian Calls

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (multiple locations)

**Step 1: Find all algorithm step computations**

Search for gradient descent step:
```typescript
// OLD:
const grad = computeGradient(w, dataPoints, lambda);

// NEW:
const problem = getCurrentProblem();
const grad = problem.gradient([w0, w1]);
```

**Step 2: Update Gradient Descent Fixed Step**

Replace hardcoded gradient calculation in GD Fixed algorithm.

**Step 3: Update Gradient Descent Line Search**

Replace hardcoded gradient and objective in GD LS algorithm.

**Step 4: Update Newton's Method**

Replace hardcoded gradient and Hessian in Newton algorithm.

**Step 5: Update L-BFGS**

Replace hardcoded gradient in L-BFGS algorithm.

**Step 6: Update visualization contour generation**

Replace hardcoded objective in contour plot generation:

```typescript
// Generate contour data
const problem = getCurrentProblem();
for (let i = 0; i < gridSize; i++) {
  for (let j = 0; j < gridSize; j++) {
    const w0 = minX + i * stepX;
    const w1 = minY + j * stepY;
    contourData[i][j] = problem.objective([w0, w1]);
  }
}
```

**Step 7: Test each algorithm**

Run: `npm run dev`

Test each tab:
- GD Fixed: ✓ Still works
- GD Line Search: ✓ Still works
- Newton: ✓ Still works
- L-BFGS: ✓ Still works

**Step 8: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: replace all hardcoded computations with problem interface

Replace objective/gradient/Hessian calls throughout:
- Gradient Descent Fixed Step algorithm
- Gradient Descent Line Search algorithm
- Newton's Method algorithm
- L-BFGS algorithm
- Contour plot generation

All algorithms now use getCurrentProblem() interface."
```

---

## Task 18e: Wire Problem Switcher to Actually Switch Problems

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (problem switcher)

**Step 1: Update problem switcher onChange**

Find problem switcher component and update:

```typescript
<select
  value={currentProblem}
  onChange={(e) => {
    const newProblem = e.target.value;
    setCurrentProblem(newProblem);

    // Reset algorithm when problem changes
    setCurrentIteration(0);
    setHistory([]);

    // Update domain bounds if problem defines them
    const problem = getProblem(newProblem);
    if (problem) {
      // TODO: Update visualization bounds (Task 18f)
      console.log('Switched to:', problem.name, 'Domain:', problem.domain);
    }

    // Show notification
    setToast({
      message: `Switched to: ${problem?.name || newProblem}`,
      type: 'info'
    });
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
>
  {/* options */}
</select>
```

**Step 2: Update loadExperiment to switch problems**

Modify loadExperiment function:

```typescript
// 3. Switch problem if needed
if (experiment.problem !== 'logistic-regression') {
  setCurrentProblem(experiment.problem);
  setShowProblemSwitcher(true);

  const problem = getProblem(experiment.problem);
  if (problem) {
    console.log('Loaded problem:', problem.name);
    // Problem is now active via getCurrentProblem()
  }
} else {
  setCurrentProblem('logistic-regression');
  setShowProblemSwitcher(false);
}
```

**Step 3: Test problem switching**

Run: `npm run dev`

Test switching manually via dropdown:
- ✓ Select Quadratic Bowl
- ✓ Select Rosenbrock
- ✓ Observe contours change
- ✓ Algorithm optimizes new function

Test via experiment button:
- ✓ Click Newton "Success: Quadratic"
- ✓ Problem switches to quadratic
- ✓ Visualization shows bowl shape

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(problems): wire problem switcher to actually switch problems

Connect problem switcher dropdown to problem state.
Update loadExperiment to switch problems.
Algorithms now optimize selected problem, not just logistic regression.

Problem switching fully functional!"
```

---

## Task 18f: Update Visualization Domain Bounds Dynamically

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (visualization bounds)

**Step 1: Find current hardcoded bounds**

Search for visualization domain:
```bash
grep -n "domain\|bounds\|-3, 3\|-2, 2" src/UnifiedVisualizer.tsx | head -10
```

**Step 2: Create visualization bounds state**

Add to state declarations:

```typescript
const [visualizationBounds, setVisualizationBounds] = useState({
  w0: [-3, 3] as [number, number],
  w1: [-3, 3] as [number, number],
});
```

**Step 3: Update bounds when problem changes**

In problem switcher onChange:

```typescript
const problem = getProblem(newProblem);
if (problem && problem.domain) {
  setVisualizationBounds({
    w0: problem.domain.w0,
    w1: problem.domain.w1,
  });
}
```

**Step 4: Use dynamic bounds in visualization**

Update canvas rendering to use `visualizationBounds` instead of hardcoded values:

```typescript
// Contour generation:
const minX = visualizationBounds.w0[0];
const maxX = visualizationBounds.w0[1];
const minY = visualizationBounds.w1[0];
const maxY = visualizationBounds.w1[1];
```

**Step 5: Test with different problem domains**

Run: `npm run dev`

- Quadratic: domain [-3, 3] × [-3, 3]
- Ill-conditioned: domain [-0.5, 0.5] × [-3, 3] (compressed x-axis)
- Rosenbrock: domain [-2, 2] × [-1, 3]
- Saddle: domain [-3, 3] × [-3, 3]

Verify visualization adapts to each domain.

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(visualization): update domain bounds dynamically

Use problem.domain to set visualization bounds.
Canvas adapts to each problem's natural domain.
Ill-conditioned quadratic now shows compressed x-axis."
```

---

## Task 18g: Handle Dataset vs No-Dataset Problems

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add conditional rendering for dataset visualization**

When problem doesn't require dataset, hide data points:

```typescript
const problem = getCurrentProblem();
const showDataPoints = problem.requiresDataset && currentProblem === 'logistic-regression';

// In canvas rendering:
if (showDataPoints) {
  // Draw data points
  dataPoints.forEach(point => {
    ctx.beginPath();
    ctx.arc(/* ... */);
    // ...
  });
}
```

**Step 2: Update problem switcher description**

Add helper text based on problem type:

```typescript
<p className="text-xs text-gray-600 mt-2">
  {currentProblem === 'logistic-regression'
    ? 'Classification problem with dataset visualization'
    : 'Pure optimization problem (no dataset)'}
</p>
```

**Step 3: Test both problem types**

Run: `npm run dev`

- Logistic regression: ✓ Shows crescent dataset
- Quadratic bowl: ✓ No data points, just contours
- Rosenbrock: ✓ No data points
- All algorithms: ✓ Work on both types

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(visualization): handle dataset vs no-dataset problems

Conditionally render data points only for logistic regression.
Pure optimization functions show contours without dataset.
Both problem types fully supported."
```

---

## Task 18h: Test All Problem Types with All Algorithms

**Files:**
- Test: Manual testing across all combinations

**Step 1: Create test matrix**

Test each problem with each algorithm:

```
Problem | GD Fixed | GD LS | Newton | L-BFGS
--------|----------|-------|--------|--------
LogReg  |    ✓     |   ✓   |   ✓    |   ✓
Quad    |    ✓     |   ✓   |   ✓    |   ✓
IllCond |    ✓     |   ✓   |   ✓    |   ✓
Rosen   |    ✓     |   ✓   |   ✓    |   ✓
Saddle  |    ✓     |   ✓   |   ✓    |   ✓
```

**Step 2: Test systematically**

For each combination:
1. Switch to algorithm tab
2. Select problem via dropdown
3. Click "Step" multiple times
4. Verify: algorithm makes progress, contours correct, no errors

**Step 3: Document any issues**

Update `docs/known-issues.md` if problems found.

**Step 4: Test experiment buttons with problem switching**

Click experiments that switch problems:
- ✓ Newton "Success: Quadratic"
- ✓ Newton "Failure: Saddle"
- ✓ Newton "Compare: Ill-Conditioned"
- ✓ L-BFGS "Success: Quadratic"
- ✓ L-BFGS "Challenge: Rosenbrock"
- ✓ GD LS "Varying Curvature"

**Step 5: Commit (if fixes needed)**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "fix: resolve issues found in problem switching testing

- Fix issue A
- Fix issue B
All 5 problems now work with all 4 algorithms."
```

---

## Task 19: Add Problem Explanation Page

**Files:**
- Create: `src/components/ProblemExplainer.tsx`
- Modify: `src/UnifiedVisualizer.tsx` (add new tab or section)

**Step 1: Create problem explainer component**

Create `src/components/ProblemExplainer.tsx`:

```typescript
import { InlineMath, BlockMath } from './Math';
import { CollapsibleSection } from './CollapsibleSection';

export function ProblemExplainer() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900">Problem Types</h2>
      <p className="text-gray-700">
        The visualizer supports 5 different optimization problems. Each demonstrates
        different algorithmic behaviors and challenges.
      </p>

      {/* Logistic Regression */}
      <CollapsibleSection
        title="Logistic Regression (2D Classification)"
        defaultExpanded={true}
        storageKey="problem-explainer-logreg"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Convex (with L2 regularization)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w^T x_i)}) + \frac{\lambda}{2}\|w\|^2`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Finds a linear decision boundary to separate
            two classes (red and blue crescents).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Real-world machine learning problem.
            Shows how optimization enables learning from data.
          </p>

          <p>
            <strong>Challenge:</strong> Non-quadratic, but convex. Guaranteed global minimum
            but requires many iterations with gradient descent.
          </p>

          <div className="bg-blue-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Try this:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Fixed Step with α=0.1 (smooth convergence)</li>
              <li>Newton's Method (quadratic convergence near minimum)</li>
              <li>L-BFGS (efficient for classification)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quadratic Bowl */}
      <CollapsibleSection
        title="Quadratic Bowl (Strongly Convex)"
        defaultExpanded={false}
        storageKey="problem-explainer-quadratic"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Strongly Convex
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}(w_0^2 + w_1^2)`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian (constant):</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Simplest possible convex function - a perfect bowl
            centered at origin.
          </p>

          <p>
            <strong>Why it's interesting:</strong> Ideal conditions for demonstrating convergence.
            Newton's method finds minimum in exactly 1 step!
          </p>

          <p>
            <strong>Challenge:</strong> None - this is the "easy mode" that shows what
            success looks like.
          </p>

          <div className="bg-green-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Perfect for demonstrating:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Newton's quadratic convergence (1-2 iterations)</li>
              <li>L-BFGS superlinear convergence</li>
              <li>GD with optimal step size (smooth spiral)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Ill-Conditioned Quadratic */}
      <CollapsibleSection
        title="Ill-Conditioned Quadratic (High κ)"
        defaultExpanded={false}
        storageKey="problem-explainer-illcond"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Strongly Convex (but ill-conditioned)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}(100w_0^2 + w_1^2)`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian:</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 100 & 0 \\ 0 & 1 \end{bmatrix}`}
            </BlockMath>
            <p className="text-sm mt-1">
              Condition number: <InlineMath>\kappa = 100</InlineMath>
            </p>
          </div>

          <p>
            <strong>What it does:</strong> Creates an elongated ellipse (100:1 aspect ratio).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Shows what goes wrong with poor scaling.
            Gradient descent zig-zags perpendicular to contours.
          </p>

          <p>
            <strong>Challenge:</strong> Gradient descent is very slow. Newton's method handles
            ill-conditioning gracefully.
          </p>

          <div className="bg-purple-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Compare algorithms:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Fixed: 100+ iterations, zig-zagging</li>
              <li>Newton: ~5 iterations, ignores ill-conditioning</li>
              <li>L-BFGS: Learns curvature, adapts quickly</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Rosenbrock */}
      <CollapsibleSection
        title="Rosenbrock Function (Banana Valley)"
        defaultExpanded={false}
        storageKey="problem-explainer-rosenbrock"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Non-Convex
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = (1-w_0)^2 + 100(w_1-w_0^2)^2`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Creates a narrow curved valley (banana shape).
            Global minimum at (1, 1).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Classic non-convex test function. The valley
            is easy to find but hard to follow. Curvature changes dramatically.
          </p>

          <p>
            <strong>Challenge:</strong> Non-convexity means Newton's Hessian can have negative
            eigenvalues. Fixed step size that works in flat regions overshoots in the valley.
          </p>

          <div className="bg-orange-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">What to observe:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Line Search adapts to varying curvature</li>
              <li>Newton needs damping (line search) to stay stable</li>
              <li>L-BFGS builds curvature approximation over time</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Saddle Point */}
      <CollapsibleSection
        title="Saddle Point (Hyperbolic Paraboloid)"
        defaultExpanded={false}
        storageKey="problem-explainer-saddle"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Non-Convex (indefinite)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = w_0^2 - w_1^2`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian:</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 2 & 0 \\ 0 & -2 \end{bmatrix}`}
            </BlockMath>
            <p className="text-sm mt-1">
              Eigenvalues: λ₁ = 2 (positive), λ₂ = -2 (negative)
            </p>
          </div>

          <p>
            <strong>What it does:</strong> Creates a saddle point at origin - minimum in w₀
            direction, maximum in w₁ direction.
          </p>

          <p>
            <strong>Why it's interesting:</strong> Pure failure mode for Newton's method!
            Negative eigenvalue means Hessian suggests going uphill.
          </p>

          <p>
            <strong>Challenge:</strong> Newton's direction is not a descent direction.
            Line search is essential to prevent divergence.
          </p>

          <div className="bg-red-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Demonstrates failure modes:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Newton without line search: diverges upward</li>
              <li>Newton with line search: damping saves it</li>
              <li>All algorithms: Can't find minimum (saddle isn't a minimum!)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* How to Use */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">How to Choose a Problem</h3>
        <p className="text-sm text-gray-700 mb-3">
          Use the problem selector (dropdown) that appears above visualizations when you
          load an experiment. Or click experiment buttons that automatically switch problems.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900">For learning basics:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Start with Logistic Regression</li>
              <li>Try Quadratic Bowl for "ideal" behavior</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">For understanding failures:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Ill-Conditioned for scaling issues</li>
              <li>Rosenbrock for varying curvature</li>
              <li>Saddle Point for Newton failures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add "Problems" tab to main interface**

In UnifiedVisualizer, add a new tab:

```typescript
<div className="tabs">
  <button onClick={() => setActiveTab('problems')}>Problems</button>
  <button onClick={() => setActiveTab('gd-fixed')}>GD Fixed</button>
  {/* other tabs */}
</div>

{activeTab === 'problems' && <ProblemExplainer />}
```

**Step 3: Test problem explainer**

Run: `npm run dev`

- ✓ Problems tab appears
- ✓ All 5 problems documented
- ✓ Math renders correctly
- ✓ Collapsible sections work
- ✓ Helpful for understanding differences

**Step 4: Commit**

```bash
git add src/components/ProblemExplainer.tsx src/UnifiedVisualizer.tsx
git commit -m "feat(problems): add problem explanation page

Create new 'Problems' tab with detailed explanations of all 5 problem types:
- Logistic Regression (convex classification)
- Quadratic Bowl (ideal conditions)
- Ill-Conditioned Quadratic (scaling issues)
- Rosenbrock (non-convex valley)
- Saddle Point (Newton failure mode)

Each problem includes:
- Mathematical definition
- Hessian analysis
- Why it's interesting
- What to observe
- Recommended algorithms"
```

---

## Task 20: Update Documentation with Problem Switching

**Files:**
- Modify: `docs/experiments-guide.md`
- Modify: `docs/plans/2025-11-05-pedagogical-content-completion-notes.md`

**Step 1: Update experiment guide**

Add section to experiments-guide.md:

```markdown
## Problem Switching

As of Task 18, the visualizer fully supports switching between 5 different optimization
problems. This enables experiments to demonstrate algorithm behavior on different landscapes.

### How It Works

1. **Automatic Switching** - Click an experiment button that specifies a problem
2. **Manual Switching** - Use the problem dropdown that appears above visualizations
3. **Dynamic Updates** - Objective, gradient, Hessian, and domain bounds all update

### Backend Implementation

The system uses a unified problem interface:
- `getCurrentProblem()` resolves to logistic regression or problem registry
- All algorithms call `problem.objective()`, `problem.gradient()`, `problem.hessian()`
- Visualization bounds adapt to `problem.domain`
- Dataset visualization only shown for logistic regression

### Supported Combinations

All 5 problems work with all 4 algorithms:
- Logistic Regression (default, with dataset)
- Quadratic Bowl (ideal convergence conditions)
- Ill-Conditioned Quadratic (scaling challenge)
- Rosenbrock Function (non-convex valley)
- Saddle Point (Newton failure mode)

See the "Problems" tab for detailed explanations of each problem type.
```

**Step 2: Update completion notes**

Add Task 18 summary to completion notes.

**Step 3: Commit**

```bash
git add docs/experiments-guide.md docs/plans/2025-11-05-pedagogical-content-completion-notes.md
git commit -m "docs: update guides with problem switching feature

Document Task 18 completion: full problem switching backend.
Explain how automatic and manual switching work.
List all supported problem × algorithm combinations."
```

---

## Task 21: Audit and Convert All Unicode Math to KaTeX

**Files:**
- Audit: All `src/**/*.tsx` files
- Modify: Any files with Unicode math symbols

**Step 1: Search for Unicode math symbols**

Run comprehensive search for common Unicode math:

```bash
# Search for common Unicode math symbols
grep -rn "∇\|α\|β\|γ\|λ\|≤\|≥\|≈\|≠\|×\|÷\|∞\|∂\|∑\|∏\|√\|∫\|≡\|⊂\|⊃\|∈\|∉\|∪\|∩\|⁰\|¹\|²\|³\|⁴\|⁵\|⁶\|⁷\|⁸\|⁹\|₀\|₁\|₂\|₃\|₄\|κ\|θ\|φ\|ψ\|ω\|Δ\|Θ\|Λ\|Ξ\|Π\|Σ\|Φ\|Ψ\|Ω" src/ --include="*.tsx" --include="*.ts" > unicode-math-audit.txt

# Count occurrences
wc -l unicode-math-audit.txt
```

Expected: Find all locations with Unicode math

**Step 2: Review audit results**

Check `unicode-math-audit.txt` for:
- Algorithm descriptions
- Parameter labels
- UI text
- Comments
- Variable names (leave these as-is)

Common patterns to replace:
- `∇` → `<InlineMath>\nabla</InlineMath>`
- `α` → `<InlineMath>\alpha</InlineMath>`
- `λ` → `<InlineMath>\lambda</InlineMath>`
- `≤` → `<InlineMath>\leq</InlineMath>`
- `w⁽ᵏ⁺¹⁾` → `<InlineMath>w_{k+1}</InlineMath>`
- `H⁻¹` → `<InlineMath>H^{-1}</InlineMath>`

**Step 3: Update UnifiedVisualizer.tsx**

Search specifically in the main file:

```bash
grep -n "∇\|α\|β\|λ" src/UnifiedVisualizer.tsx | head -30
```

Common locations:
- Parameter slider labels
- Algorithm step descriptions
- Loss function displays
- Hyperparameter labels

Example fixes:

```typescript
// BEFORE:
<label>Step size α:</label>

// AFTER:
<label>Step size <InlineMath>\alpha</InlineMath>:</label>

// BEFORE:
<p>Current loss: {loss.toFixed(4)}</p>

// AFTER:
<p>Current loss <InlineMath>f(w)</InlineMath>: {loss.toFixed(4)}</p>

// BEFORE:
<span>∇f(w) = ...</span>

// AFTER:
<span><InlineMath>\nabla f(w)</InlineMath> = ...</span>
```

**Step 4: Update problem descriptions**

If logistic regression or other problems have Unicode in descriptions:

```typescript
// In problem registry or helper text:
// BEFORE:
description: "Minimize f(w) = ... with L2 regularization λ"

// AFTER:
description: (
  <>
    Minimize <InlineMath>f(w) = ...</InlineMath> with L2 regularization{' '}
    <InlineMath>\lambda</InlineMath>
  </>
)
```

**Step 5: Update any remaining UI components**

Check these components:
- Slider labels
- Tooltip text
- Help text
- Algorithm status displays
- Iteration info displays

**Step 6: Test all tabs**

Run: `npm run dev`

Visit each tab and verify:
- No Unicode math visible
- All math renders via KaTeX
- No rendering errors
- Proper spacing around inline math

**Step 7: Clean up and commit**

```bash
rm unicode-math-audit.txt
git add src/**/*.tsx src/**/*.ts
git commit -m "refactor: convert all Unicode math to KaTeX

Replace Unicode math symbols with KaTeX components throughout:
- ∇, α, β, γ, λ, κ, θ, etc. → InlineMath
- Superscripts/subscripts → proper LaTeX notation
- Mathematical operators → LaTeX equivalents

Ensures consistent, professional math rendering everywhere.
All math now uses KaTeX instead of Unicode fallbacks."
```

---

## Execution Options

Plan complete and saved to `docs/plans/2025-11-05-experiment-wiring-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration with quality gates

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with review checkpoints

**Which approach?**
