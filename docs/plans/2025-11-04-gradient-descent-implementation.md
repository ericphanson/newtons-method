# Gradient Descent Pedagogy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two new gradient descent algorithm tabs (GD Fixed Step and GD Line Search) to create a complete pedagogical progression from first-order to second-order optimization methods.

**Architecture:** Extract shared line search logic, implement two new GD algorithms with similar interfaces to existing Newton/L-BFGS, add collapsible pedagogical content components, expand UnifiedVisualizer from 2 to 4 tabs.

**Tech Stack:** TypeScript, React, HTML Canvas, Tailwind CSS

---

## Task 1: Extract Armijo Line Search to Shared Module

**Goal:** Refactor duplicate line search code into reusable function

**Files:**
- Create: `src/line-search/types.ts`
- Create: `src/line-search/armijo.ts`
- Modify: `src/algorithms/newton.ts:160-192`
- Modify: `src/algorithms/lbfgs.ts:125-157`

### Step 1: Create line search types file

Create `src/line-search/types.ts`:

```typescript
import { DataPoint } from '../shared-utils';

export interface LineSearchResult {
  alpha: number;
  newLoss: number;
  trials: Array<{
    trial: number;
    alpha: number;
    loss: number;
    armijoRHS: number;
    satisfied: boolean;
  }>;
  curve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

export type ComputeLossAndGrad = (w: number[]) => { loss: number; grad: number[] };
```

### Step 2: Create Armijo line search implementation

Create `src/line-search/armijo.ts`:

```typescript
import { add, scale, dot } from '../shared-utils';
import { LineSearchResult, ComputeLossAndGrad } from './types';

/**
 * Armijo backtracking line search
 *
 * Finds a step size alpha that satisfies the Armijo condition:
 * f(w + alpha*p) <= f(w) + c1*alpha*(grad^T*p)
 *
 * @param w Current weights
 * @param direction Search direction p
 * @param grad Current gradient
 * @param loss Current loss value
 * @param computeLossAndGrad Function to compute loss at any point
 * @param c1 Armijo constant (typically 1e-4)
 * @param rho Backtracking factor (typically 0.5)
 * @param maxTrials Maximum number of backtracking steps
 * @returns LineSearchResult with accepted alpha and trial history
 */
export const armijoLineSearch = (
  w: number[],
  direction: number[],
  grad: number[],
  loss: number,
  computeLossAndGrad: ComputeLossAndGrad,
  c1: number = 0.0001,
  rho: number = 0.5,
  maxTrials: number = 20
): LineSearchResult => {
  const dirGrad = dot(direction, grad);
  let alpha = 1.0;
  const trials: LineSearchResult['trials'] = [];

  // Build curve for visualization (sample alpha from 0 to 1)
  const alphaRange: number[] = [];
  const lossValues: number[] = [];
  const armijoValues: number[] = [];

  for (let a = 0; a <= 1.0; a += 0.02) {
    const wTest = add(w, scale(direction, a));
    const { loss: testLoss } = computeLossAndGrad(wTest);
    alphaRange.push(a);
    lossValues.push(testLoss);
    armijoValues.push(loss + c1 * a * dirGrad);
  }

  // Backtracking search
  for (let trial = 0; trial < maxTrials; trial++) {
    const wNew = add(w, scale(direction, alpha));
    const { loss: newLoss } = computeLossAndGrad(wNew);
    const armijoRHS = loss + c1 * alpha * dirGrad;
    const satisfied = newLoss <= armijoRHS;

    trials.push({
      trial: trial + 1,
      alpha,
      loss: newLoss,
      armijoRHS,
      satisfied
    });

    if (satisfied) {
      return {
        alpha,
        newLoss,
        trials,
        curve: { alphaRange, lossValues, armijoValues }
      };
    }

    alpha *= rho;
  }

  // If no alpha satisfied, return the last one tried
  const lastTrial = trials[trials.length - 1];
  return {
    alpha: lastTrial.alpha,
    newLoss: lastTrial.loss,
    trials,
    curve: { alphaRange, lossValues, armijoValues }
  };
};
```

### Step 3: Refactor Newton to use shared line search

In `src/algorithms/newton.ts`, replace lines 160-192 with:

```typescript
import { armijoLineSearch } from '../line-search/armijo';
import { LineSearchResult } from '../line-search/types';

// ... (keep existing imports and code above line 160)

    // Line search
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const acceptedAlpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      hessian: hessian.map(row => [...row]),
      eigenvalues: [...eigenvalues],
      conditionNumber,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });
```

### Step 4: Refactor L-BFGS to use shared line search

In `src/algorithms/lbfgs.ts`, replace lines 125-157 with:

```typescript
import { armijoLineSearch } from '../line-search/armijo';
import { LineSearchResult } from '../line-search/types';

// ... (keep existing imports and code above line 125)

    // Line search
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const acceptedAlpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, acceptedAlpha));
    const { loss: newLoss, grad: newGrad } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      memory: memory.map(m => ({ ...m })),
      twoLoopData,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });
```

### Step 5: Test the refactoring

Run: `npm run dev` (or `npm start`)

Expected: Application runs without errors, Newton and L-BFGS tabs work exactly as before

### Step 6: Commit

```bash
git add src/line-search/types.ts src/line-search/armijo.ts src/algorithms/newton.ts src/algorithms/lbfgs.ts
git commit -m "refactor: extract Armijo line search to shared module

- Create src/line-search/types.ts with LineSearchResult interface
- Create src/line-search/armijo.ts with reusable armijoLineSearch function
- Refactor Newton and L-BFGS to use shared line search
- No behavior changes, pure refactoring"
```

---

## Task 2: Implement Gradient Descent (Fixed Step) Algorithm

**Goal:** Create basic gradient descent with constant step size

**Files:**
- Create: `src/algorithms/gradient-descent.ts`

### Step 1: Create gradient descent algorithm file

Create `src/algorithms/gradient-descent.ts`:

```typescript
import {
  DataPoint,
  computeLossAndGradient,
  norm,
  scale,
  add
} from '../shared-utils';

export interface GDIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
}

/**
 * Gradient Descent with fixed step size
 *
 * Simple first-order optimization: w_new = w_old - alpha * grad
 *
 * @param data Training data points
 * @param maxIter Maximum number of iterations
 * @param alpha Fixed step size (learning rate)
 * @param lambda Regularization parameter
 * @returns Array of iteration objects tracking the optimization trajectory
 */
export const runGradientDescent = (
  data: DataPoint[],
  maxIter: number = 100,
  alpha: number = 0.1,
  lambda: number = 0.0001
): GDIteration[] => {
  const iterations: GDIteration[] = [];
  let w = [0.1, 0.1, 0.0];  // Initial weights

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Fixed step size update
    const wNew = add(w, scale(direction, alpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha,
      wNew: [...wNew],
      newLoss
    });

    w = wNew;

    // Early stopping if converged
    if (gradNorm < 1e-6) {
      break;
    }
  }

  return iterations;
};
```

### Step 2: Test gradient descent algorithm

Run: `npm run dev`

Open browser console and test manually:

```javascript
import { runGradientDescent } from './algorithms/gradient-descent';
import { generateCrescents } from './shared-utils';

const data = generateCrescents();
const iters = runGradientDescent(data, 50, 0.1, 0.0001);
console.log('Iterations:', iters.length);
console.log('Final loss:', iters[iters.length - 1].newLoss);
console.log('Final grad norm:', iters[iters.length - 1].gradNorm);
```

Expected: Should complete without errors and show decreasing loss

### Step 3: Commit

```bash
git add src/algorithms/gradient-descent.ts
git commit -m "feat: implement gradient descent with fixed step size

- Add runGradientDescent function with fixed alpha parameter
- Returns GDIteration[] tracking w, loss, grad, direction per iteration
- Includes early stopping when gradient norm < 1e-6
- Foundation for pedagogical first-order optimization tab"
```

---

## Task 3: Implement Gradient Descent with Line Search

**Goal:** Create gradient descent that uses Armijo line search for adaptive step sizes

**Files:**
- Create: `src/algorithms/gradient-descent-linesearch.ts`

### Step 1: Create GD with line search file

Create `src/algorithms/gradient-descent-linesearch.ts`:

```typescript
import {
  DataPoint,
  LineSearchTrial,
  computeLossAndGradient,
  norm,
  scale,
  add
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';

export interface GDLineSearchIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

/**
 * Gradient Descent with Armijo line search
 *
 * First-order optimization with adaptive step size selection.
 * At each iteration, performs backtracking line search to find
 * a step size satisfying the Armijo condition.
 *
 * @param data Training data points
 * @param maxIter Maximum number of iterations
 * @param lambda Regularization parameter
 * @param c1 Armijo constant for sufficient decrease
 * @returns Array of iteration objects with line search details
 */
export const runGradientDescentLineSearch = (
  data: DataPoint[],
  maxIter: number = 80,
  lambda: number = 0.0001,
  c1: number = 0.0001
): GDLineSearchIteration[] => {
  const iterations: GDLineSearchIteration[] = [];
  let w = [0.1, 0.1, 0.0];  // Initial weights

  for (let iter = 0; iter < maxIter; iter++) {
    const { loss, grad } = computeLossAndGradient(w, data, lambda);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Perform line search to find good step size
    const lineSearchResult = armijoLineSearch(
      w,
      direction,
      grad,
      loss,
      (wTest) => computeLossAndGradient(wTest, data, lambda),
      c1
    );

    const alpha = lineSearchResult.alpha;
    const wNew = add(w, scale(direction, alpha));
    const { loss: newLoss } = computeLossAndGradient(wNew, data, lambda);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });

    w = wNew;

    // Early stopping if converged
    if (gradNorm < 1e-6) {
      break;
    }
  }

  return iterations;
};
```

### Step 2: Test GD with line search

Run: `npm run dev`

Test in browser console:

```javascript
import { runGradientDescentLineSearch } from './algorithms/gradient-descent-linesearch';
import { generateCrescents } from './shared-utils';

const data = generateCrescents();
const iters = runGradientDescentLineSearch(data, 50, 0.0001, 0.0001);
console.log('Iterations:', iters.length);
console.log('Final loss:', iters[iters.length - 1].newLoss);
console.log('Line search trials per iter:', iters.map(it => it.lineSearchTrials.length));
```

Expected: Should converge faster than fixed-step GD, show varying alpha values

### Step 3: Commit

```bash
git add src/algorithms/gradient-descent-linesearch.ts
git commit -m "feat: implement gradient descent with Armijo line search

- Add runGradientDescentLineSearch with adaptive step size
- Uses shared armijoLineSearch for backtracking
- Returns line search trials and curve for visualization
- Demonstrates value of adaptive step sizes vs fixed"
```

---

## Task 4: Create Collapsible Section Component

**Goal:** Build reusable React component for pedagogical content sections

**Files:**
- Create: `src/components/CollapsibleSection.tsx`

### Step 1: Create CollapsibleSection component

Create `src/components/CollapsibleSection.tsx`:

```typescript
import React, { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  storageKey?: string;  // For localStorage persistence
  children: React.ReactNode;
}

/**
 * Collapsible content section with optional localStorage persistence
 *
 * Displays a title with expand/collapse toggle. Content can be shown or hidden.
 * If storageKey is provided, remembers user's preference across sessions.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  storageKey,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-4">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="text-gray-600 text-xl">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 px-4 py-3 bg-white rounded-lg border border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};
```

### Step 2: Test CollapsibleSection component

Add temporary test in `src/App.tsx` to verify:

```typescript
import { CollapsibleSection } from './components/CollapsibleSection';

// In App component, temporarily add:
<CollapsibleSection title="Test Section" defaultExpanded={true}>
  <p>This is test content that should be collapsible.</p>
</CollapsibleSection>
```

Run: `npm run dev`

Expected: Should see collapsible section, clicking toggles visibility

### Step 3: Remove test code from App.tsx

Remove the test CollapsibleSection from App.tsx

### Step 4: Commit

```bash
git add src/components/CollapsibleSection.tsx
git commit -m "feat: add CollapsibleSection component for pedagogical content

- Reusable component with expand/collapse toggle
- Optional localStorage persistence of user preferences
- Clean visual design with hover states
- Foundation for pedagogical text sections in all tabs"
```

---

## Task 5: Add Gradient Descent Tab Content to UnifiedVisualizer

**Goal:** Integrate GD (Fixed Step) as first tab in the visualizer

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:14-23` (Algorithm type)
- Modify: `src/UnifiedVisualizer.tsx:107-112` (Add GD state)
- Modify: `src/UnifiedVisualizer.tsx:734-757` (Tab buttons)

### Step 1: Add GD fixed step to algorithm type union

In `src/UnifiedVisualizer.tsx` line 14, change:

```typescript
type Algorithm = 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
```

### Step 2: Import GD algorithms at top of file

Add to imports at top of `src/UnifiedVisualizer.tsx`:

```typescript
import { runGradientDescent, GDIteration } from './algorithms/gradient-descent';
import { runGradientDescentLineSearch, GDLineSearchIteration } from './algorithms/gradient-descent-linesearch';
```

### Step 3: Add GD fixed step state variables

After line 23 in `src/UnifiedVisualizer.tsx`, add:

```typescript
  // GD Fixed step state
  const [gdFixedIterations, setGdFixedIterations] = useState<GDIteration[]>([]);
  const [gdFixedCurrentIter, setGdFixedCurrentIter] = useState(0);
  const [gdFixedAlpha, setGdFixedAlpha] = useState(0.1);
```

### Step 4: Add GD line search state variables

After the GD fixed state, add:

```typescript
  // GD Line search state
  const [gdLSIterations, setGdLSIterations] = useState<GDLineSearchIteration[]>([]);
  const [gdLSCurrentIter, setGdLSCurrentIter] = useState(0);
  const [gdLSC1, setGdLSC1] = useState(0.0001);
```

### Step 5: Add canvas refs for GD tabs

After existing canvas refs (around line 105), add:

```typescript
  // GD Fixed canvas refs
  const gdFixedParamCanvasRef = useRef<HTMLCanvasElement>(null);

  // GD Line Search canvas refs
  const gdLSParamCanvasRef = useRef<HTMLCanvasElement>(null);
  const gdLSLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);
```

### Step 6: Add useEffect to compute GD fixed iterations

After the existing useEffects (around line 120), add:

```typescript
  // Recompute GD fixed when data or hyperparameters change
  useEffect(() => {
    if (data.length > 0) {
      setGdFixedIterations(runGradientDescent(data, 100, gdFixedAlpha, lambda));
      setGdFixedCurrentIter(0);
    }
  }, [data.length, lambda, gdFixedAlpha, customPoints.length]);
```

### Step 7: Add useEffect to compute GD line search iterations

```typescript
  // Recompute GD line search when data or hyperparameters change
  useEffect(() => {
    if (data.length > 0) {
      setGdLSIterations(runGradientDescentLineSearch(data, 80, lambda, gdLSC1));
      setGdLSCurrentIter(0);
    }
  }, [data.length, lambda, gdLSC1, customPoints.length]);
```

### Step 8: Update getCurrentIter function

Modify the `getCurrentIter` function (around line 122) to handle all 4 algorithms:

```typescript
  const getCurrentIter = () => {
    if (selectedTab === 'gd-fixed') {
      return gdFixedIterations[gdFixedCurrentIter] || gdFixedIterations[0];
    } else if (selectedTab === 'gd-linesearch') {
      return gdLSIterations[gdLSCurrentIter] || gdLSIterations[0];
    } else if (selectedTab === 'newton') {
      return newtonIterations[newtonCurrentIter] || newtonIterations[0];
    } else {
      return lbfgsIterations[lbfgsCurrentIter] || lbfgsIterations[0];
    }
  };
```

### Step 9: Update keyboard navigation to handle all tabs

Modify keyboard navigation useEffect (around line 133) to handle all 4 tabs:

```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTab === 'gd-fixed') {
        if (e.key === 'ArrowLeft' && gdFixedCurrentIter > 0) {
          setGdFixedCurrentIter(gdFixedCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && gdFixedCurrentIter < gdFixedIterations.length - 1) {
          setGdFixedCurrentIter(gdFixedCurrentIter + 1);
        }
      } else if (selectedTab === 'gd-linesearch') {
        if (e.key === 'ArrowLeft' && gdLSCurrentIter > 0) {
          setGdLSCurrentIter(gdLSCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && gdLSCurrentIter < gdLSIterations.length - 1) {
          setGdLSCurrentIter(gdLSCurrentIter + 1);
        }
      } else if (selectedTab === 'newton') {
        if (e.key === 'ArrowLeft' && newtonCurrentIter > 0) {
          setNewtonCurrentIter(newtonCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && newtonCurrentIter < newtonIterations.length - 1) {
          setNewtonCurrentIter(newtonCurrentIter + 1);
        }
      } else {
        if (e.key === 'ArrowLeft' && lbfgsCurrentIter > 0) {
          setLbfgsCurrentIter(lbfgsCurrentIter - 1);
        } else if (e.key === 'ArrowRight' && lbfgsCurrentIter < lbfgsIterations.length - 1) {
          setLbfgsCurrentIter(lbfgsCurrentIter + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTab, gdFixedCurrentIter, gdFixedIterations.length,
      gdLSCurrentIter, gdLSIterations.length,
      newtonCurrentIter, newtonIterations.length,
      lbfgsCurrentIter, lbfgsIterations.length]);
```

### Step 10: Test basic integration

Run: `npm run dev`

Expected: App should compile without errors (tabs UI not updated yet, but state management in place)

### Step 11: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add GD algorithms state management to UnifiedVisualizer

- Add gd-fixed and gd-linesearch to Algorithm type union
- Add state for GD fixed (iterations, currentIter, alpha)
- Add state for GD line search (iterations, currentIter, c1)
- Add canvas refs for GD visualizations
- Add useEffects to recompute GD iterations on data/param changes
- Update getCurrentIter and keyboard navigation for 4 tabs
- Foundation complete, UI tabs to be added next"
```

---

## Task 6: Add Tab Navigation UI for 4 Algorithms

**Goal:** Update tab buttons to show all 4 algorithm options

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:734-757`

### Step 1: Replace tab buttons section

In `src/UnifiedVisualizer.tsx`, find the tab buttons section (around line 734-757) and replace with:

```typescript
      {/* Algorithm Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('gd-fixed')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'gd-fixed'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            GD (Fixed Step)
          </button>
          <button
            onClick={() => setSelectedTab('gd-linesearch')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'gd-linesearch'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            GD (Line Search)
          </button>
          <button
            onClick={() => setSelectedTab('newton')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'newton'
                ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Newton's Method
          </button>
          <button
            onClick={() => setSelectedTab('lbfgs')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'lbfgs'
                ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            L-BFGS
          </button>
        </div>
```

### Step 2: Update default selected tab

Change line 22 in `src/UnifiedVisualizer.tsx`:

```typescript
  const [selectedTab, setSelectedTab] = useState<Algorithm>('gd-fixed');
```

### Step 3: Test tab navigation

Run: `npm run dev`

Expected: Should see 4 tabs, clicking switches between them (content not yet implemented)

### Step 4: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add 4-tab navigation UI

- Add tab buttons for GD Fixed, GD Line Search, Newton, L-BFGS
- Update styling with color coding (green, blue, purple, amber)
- Set default tab to gd-fixed for pedagogical progression
- Tab switching works, content rendering to be added next"
```

---

## Task 7: Add GD Fixed Step Parameter Space Visualization

**Goal:** Render loss landscape with optimization trajectory for GD fixed step

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add useEffect for GD fixed param space canvas)

### Step 1: Compute parameter bounds for GD fixed

After existing parameter bounds useMemos (around line 92), add:

```typescript
  const gdFixedParamBounds = React.useMemo(() => {
    if (!gdFixedIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of gdFixedIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [gdFixedIterations]);
```

### Step 2: Add useEffect to draw GD fixed parameter space

After existing visualization useEffects (around line 388), add:

```typescript
  // Draw GD Fixed parameter space
  useEffect(() => {
    const canvas = gdFixedParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-fixed') return;
    const iter = gdFixedIterations[gdFixedCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = gdFixedParamBounds;

    const resolution = 60;
    const lossValues: number[] = [];

    // Compute loss landscape
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    // Draw heatmap
    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    // Draw trajectory path
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= gdFixedCurrentIter; i++) {
      const [w0, w1] = gdFixedIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw current position
    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [gdFixedCurrentIter, data, gdFixedIterations, gdFixedParamBounds, lambda, selectedTab]);
```

### Step 3: Test GD fixed visualization

Run: `npm run dev`

Expected: GD Fixed tab should show loss landscape with trajectory (once we add the canvas element in the UI)

### Step 4: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add parameter space visualization for GD fixed step

- Compute parameter bounds based on GD trajectory
- Draw loss landscape heatmap (lighter = lower loss)
- Draw orange trajectory path showing optimization progress
- Draw red dot for current position
- Add axis labels with value ranges"
```

---

## Task 8: Add GD Line Search Visualizations

**Goal:** Add parameter space and line search plot for GD line search tab

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add useEffects for GD line search canvases)

### Step 1: Compute parameter bounds for GD line search

After gdFixedParamBounds useMemo, add:

```typescript
  const gdLSParamBounds = React.useMemo(() => {
    if (!gdLSIterations.length) return { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3, w0Range: 6, w1Range: 6 };

    let minW0 = Infinity, maxW0 = -Infinity;
    let minW1 = Infinity, maxW1 = -Infinity;

    for (const it of gdLSIterations) {
      minW0 = Math.min(minW0, it.wNew[0]);
      maxW0 = Math.max(maxW0, it.wNew[0]);
      minW1 = Math.min(minW1, it.wNew[1]);
      maxW1 = Math.max(maxW1, it.wNew[1]);
    }

    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const pad0 = w0Range * 0.2;
    const pad1 = w1Range * 0.2;

    return {
      minW0: minW0 - pad0,
      maxW0: maxW0 + pad0,
      minW1: minW1 - pad1,
      maxW1: maxW1 + pad1,
      w0Range: w0Range + 2 * pad0,
      w1Range: w1Range + 2 * pad1
    };
  }, [gdLSIterations]);
```

### Step 2: Add useEffect for GD line search parameter space

After GD fixed parameter space useEffect, add:

```typescript
  // Draw GD Line Search parameter space
  useEffect(() => {
    const canvas = gdLSParamCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);
    const { minW0, maxW0, minW1, maxW1, w0Range, w1Range } = gdLSParamBounds;

    const resolution = 60;
    const lossValues = [];

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const w0 = minW0 + (i / resolution) * w0Range;
        const w1 = minW1 + (j / resolution) * w1Range;
        const { loss } = computeLossAndGradient([w0, w1, 0], data, lambda);
        lossValues.push(loss);
      }
    }

    const minLoss = Math.min(...lossValues);
    const maxLoss = Math.max(...lossValues);
    const lossRange = maxLoss - minLoss;

    let lossIdx = 0;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const loss = lossValues[lossIdx++];
        const normalized = (loss - minLoss) / (lossRange + 1e-10);
        const intensity = 1 - normalized;

        const r = Math.floor(139 + (255 - 139) * intensity);
        const g = Math.floor(92 + (255 - 92) * intensity);
        const b = Math.floor(246 + (255 - 246) * intensity);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * (w / resolution), j * (h / resolution), w / resolution + 1, h / resolution + 1);
      }
    }

    const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * w;
    const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * h;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= gdLSCurrentIter; i++) {
      const [w0, w1] = gdLSIterations[i].wNew;
      const cx = toCanvasX(w0);
      const cy = toCanvasY(w1);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    const [w0, w1] = iter.wNew;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(toCanvasX(w0), toCanvasY(w1), 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${minW0.toFixed(1)}, ${maxW0.toFixed(1)}]`, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${minW1.toFixed(1)}, ${maxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();
  }, [gdLSCurrentIter, data, gdLSIterations, gdLSParamBounds, lambda, selectedTab]);
```

### Step 3: Add useEffect for GD line search plot

(Same pattern as Newton's line search visualization):

```typescript
  // Draw GD Line Search plot
  useEffect(() => {
    const canvas = gdLSLineSearchCanvasRef.current;
    if (!canvas || selectedTab !== 'gd-linesearch') return;
    const iter = gdLSIterations[gdLSCurrentIter];
    if (!iter) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const { alphaRange, lossValues, armijoValues } = iter.lineSearchCurve;
    const trials = iter.lineSearchTrials;

    const maxAlpha = Math.max(...alphaRange);
    const allValues = [...lossValues, ...armijoValues];
    const minLoss = Math.min(...allValues);
    const maxLoss = Math.max(...allValues);
    const lossRange = maxLoss - minLoss;

    const margin = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const toCanvasX = (alpha: number) => margin.left + (alpha / maxAlpha) * plotW;
    const toCanvasY = (loss: number) => margin.top + plotH - ((loss - minLoss) / (lossRange + 1e-10)) * plotH;

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Draw Armijo boundary (dashed)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < armijoValues.length; i++) {
      const cx = toCanvasX(alphaRange[i]);
      const cy = toCanvasY(armijoValues[i]);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw actual loss curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < lossValues.length; i++) {
      const cx = toCanvasX(alphaRange[i]);
      const cy = toCanvasY(lossValues[i]);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw starting point
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(iter.loss), 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw trials
    trials.forEach((t) => {
      const cx = toCanvasX(t.alpha);
      const cy = toCanvasY(t.loss);

      ctx.fillStyle = t.satisfied ? '#10b981' : '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, t.satisfied ? 9 : 5, 0, 2 * Math.PI);
      ctx.fill();

      if (t.satisfied) {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`✓ Accept α=${t.alpha.toFixed(4)}`, cx + 12, cy - 10);
        ctx.fillText(`loss=${t.loss.toFixed(4)}`, cx + 12, cy + 5);
      }
    });

    // Labels
    ctx.fillStyle = '#374151';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Step size α', w / 2, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();
  }, [gdLSIterations, gdLSCurrentIter, gdLSC1, selectedTab]);
```

### Step 4: Test visualizations

Run: `npm run dev`

Expected: Should compile without errors (UI rendering to be added in next task)

### Step 5: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add visualizations for GD line search tab

- Add parameter space rendering (loss landscape + trajectory)
- Add line search plot showing backtracking trials
- Visualize Armijo condition (dashed orange line)
- Show accepted/rejected alpha values with colored dots
- Same visual style as Newton and L-BFGS tabs"
```

---

## Task 9: Add GD Fixed Step Tab Content and UI

**Goal:** Render complete UI for GD Fixed Step tab with pedagogical content

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:759-1097` (Add GD fixed tab content in algorithm-specific section)

### Step 1: Import CollapsibleSection

At top of `src/UnifiedVisualizer.tsx`, add:

```typescript
import { CollapsibleSection } from './components/CollapsibleSection';
```

### Step 2: Add GD Fixed tab content before Newton section

In the algorithm-specific visualizations section (around line 856), add before the Newton section:

```typescript
          {/* Algorithm-specific visualizations */}
          {selectedTab === 'gd-fixed' ? (
            <>
              {/* GD Fixed - Why This Algorithm? */}
              <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-green-900 mb-4">Gradient Descent (Fixed Step)</h2>
                <p className="text-gray-800 text-lg">
                  The simplest optimization algorithm: follow the gradient downhill with constant step size α.
                </p>
              </div>

              <CollapsibleSection
                title="What is Gradient Descent?"
                defaultExpanded={true}
                storageKey="gd-fixed-what"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Goal:</strong> Find weights w that minimize loss f(w)</p>
                  <p><strong>Intuition:</strong> Imagine you're on a hillside in fog. You can feel the slope
                  under your feet (the gradient), but can't see the valley. Walk downhill repeatedly
                  until you reach the bottom.</p>
                  <p>The gradient ∇f tells you the direction of steepest ascent.
                  We go the opposite way: <strong>-∇f</strong> (steepest descent).</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="The Algorithm"
                defaultExpanded={true}
                storageKey="gd-fixed-algorithm"
              >
                <div className="space-y-3 text-gray-800">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Start with initial guess w₀ (e.g., all zeros)</li>
                    <li>Compute gradient: g = ∇f(w)</li>
                    <li>Take a step downhill: <strong>w_new = w_old - α·g</strong></li>
                    <li>Repeat steps 2-3 until gradient is tiny (converged)</li>
                  </ol>
                  <div className="mt-4 bg-green-200 rounded p-4">
                    <p className="font-bold">Key parameter: α (step size)</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Too small → slow progress, many iterations</li>
                      <li>Too large → overshoot minimum, oscillate or diverge</li>
                      <li>Just right → steady progress toward minimum</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="The Mathematics"
                defaultExpanded={false}
                storageKey="gd-fixed-math"
              >
                <div className="space-y-3 text-gray-800 font-mono text-sm">
                  <div>
                    <p className="font-bold">Loss function:</p>
                    <p>f(w) = -(1/N) Σ [y log(σ(wᵀx)) + (1-y) log(1-σ(wᵀx))] + (λ/2)||w||²</p>
                  </div>
                  <div>
                    <p className="font-bold">Gradient (vector of partial derivatives):</p>
                    <p>∇f(w) = [∂f/∂w₀, ∂f/∂w₁, ∂f/∂w₂]ᵀ</p>
                  </div>
                  <div>
                    <p className="font-bold">For logistic regression:</p>
                    <p>∇f(w) = (1/N) Σ (σ(wᵀx) - y)·x + λw</p>
                  </div>
                  <div>
                    <p className="font-bold">Update rule:</p>
                    <p>w⁽ᵏ⁺¹⁾ = w⁽ᵏ⁾ - α∇f(w⁽ᵏ⁾)</p>
                  </div>
                  <div>
                    <p className="font-bold">Convergence criterion:</p>
                    <p>||∇f(w)|| &lt; ε (e.g., ε = 10⁻⁶)</p>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="What You're Seeing"
                defaultExpanded={true}
                storageKey="gd-fixed-viz"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Left:</strong> Data space - decision boundary from current weights</p>
                  <p><strong>Right:</strong> Parameter space (w₀, w₁) - the loss landscape</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Lighter colors = lower loss (the valley we're searching for)</li>
                    <li>Orange path = trajectory of weights across iterations</li>
                    <li>Red dot = current position</li>
                  </ul>
                  <p className="mt-2">The gradient points perpendicular to contour lines (level sets).
                  We follow it downhill toward the minimum.</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Try This"
                defaultExpanded={false}
                storageKey="gd-fixed-try"
              >
                <div className="space-y-2 text-gray-800">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Set α = 0.001: Watch it take tiny steps. How many iterations to converge?</li>
                    <li>Set α = 0.5: Watch it oscillate. Why does it zig-zag?</li>
                    <li>Set α = 1.5: Does it diverge completely?</li>
                    <li>Add custom points: Does the landscape change? Does the same α still work?</li>
                  </ul>
                </div>
              </CollapsibleSection>

              {/* GD Fixed Visualizations */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Loss landscape with optimization trajectory. Lighter = lower loss.
                </p>
                <canvas
                  ref={gdFixedParamCanvasRef}
                  style={{width: '700px', height: '500px'}}
                  className="border border-gray-300 rounded"
                />
              </div>
            </>
          ) : selectedTab === 'gd-linesearch' ? (
            <>
              {/* GD Line Search content will go here in next task */}
            </>
          ) : selectedTab === 'newton' ? (
```

### Step 3: Update currentIterNum and totalIters calculation

Around line 654, update to handle all 4 algorithms:

```typescript
  const currentIterNum = selectedTab === 'gd-fixed' ? gdFixedCurrentIter :
                        selectedTab === 'gd-linesearch' ? gdLSCurrentIter :
                        selectedTab === 'newton' ? newtonCurrentIter : lbfgsCurrentIter;

  const totalIters = selectedTab === 'gd-fixed' ? gdFixedIterations.length :
                     selectedTab === 'gd-linesearch' ? gdLSIterations.length :
                     selectedTab === 'newton' ? newtonIterations.length : lbfgsIterations.length;
```

### Step 4: Update navigation button handlers

Around line 810-840, update reset/prev/next button handlers:

```typescript
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(0);
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(0);
                  else if (selectedTab === 'newton') setNewtonCurrentIter(0);
                  else setLbfgsCurrentIter(0);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg"
              >
                <RotateCcw size={18} />
                Reset
              </button>
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(Math.max(0, gdFixedCurrentIter - 1));
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(Math.max(0, gdLSCurrentIter - 1));
                  else if (selectedTab === 'newton') setNewtonCurrentIter(Math.max(0, newtonCurrentIter - 1));
                  else setLbfgsCurrentIter(Math.max(0, lbfgsCurrentIter - 1));
                }}
                disabled={currentIterNum === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              <button
                onClick={() => {
                  if (selectedTab === 'gd-fixed') setGdFixedCurrentIter(Math.min(gdFixedIterations.length - 1, gdFixedCurrentIter + 1));
                  else if (selectedTab === 'gd-linesearch') setGdLSCurrentIter(Math.min(gdLSIterations.length - 1, gdLSCurrentIter + 1));
                  else if (selectedTab === 'newton') setNewtonCurrentIter(Math.min(newtonIterations.length - 1, newtonCurrentIter + 1));
                  else setLbfgsCurrentIter(Math.min(lbfgsIterations.length - 1, lbfgsCurrentIter + 1));
                }}
                disabled={currentIterNum === totalIters - 1}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
              >
                Next
                <ArrowRight size={18} />
              </button>
```

### Step 5: Add hyperparameter control for GD fixed

Around line 761-806 (hyperparameter controls section), add:

```typescript
            <div className="flex gap-4">
              {selectedTab === 'gd-fixed' ? (
                <div>
                  <label className="text-sm font-bold text-gray-700">Step size α:</label>
                  <input
                    type="range"
                    min="-3"
                    max="0"
                    step="0.1"
                    value={Math.log10(gdFixedAlpha)}
                    onChange={(e) => setGdFixedAlpha(Math.pow(10, parseFloat(e.target.value)))}
                    className="mx-2"
                  />
                  <span className="text-sm">{gdFixedAlpha.toFixed(3)}</span>
                </div>
              ) : selectedTab === 'gd-linesearch' ? (
                <div>
                  <label className="text-sm font-bold text-gray-700">Armijo c₁:</label>
                  <input
                    type="range"
                    min="-5"
                    max="-0.3"
                    step="0.1"
                    value={Math.log10(gdLSC1)}
                    onChange={(e) => setGdLSC1(Math.pow(10, parseFloat(e.target.value)))}
                    className="mx-2"
                  />
                  <span className="text-sm">{gdLSC1.toExponential(1)}</span>
                </div>
              ) : selectedTab === 'newton' ? (
```

### Step 6: Test GD fixed tab

Run: `npm run dev`

Navigate to GD Fixed tab

Expected:
- See pedagogical content sections (collapsible)
- See parameter space visualization with trajectory
- Slider controls step size α
- Navigation buttons work

### Step 7: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add complete UI for GD Fixed Step tab

- Add pedagogical content sections (What Is, Algorithm, Math, Viz Guide, Try This)
- Add parameter space canvas rendering
- Add alpha slider control (log scale from 0.001 to 1.0)
- Integrate CollapsibleSection component for content
- Update navigation buttons to handle GD fixed
- First complete tab in pedagogical progression"
```

---

## Task 10: Add GD Line Search Tab Content and UI

**Goal:** Complete the GD Line Search tab with pedagogical content and visualizations

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add GD line search tab content after GD fixed)

### Step 1: Add GD Line Search tab content

In the `selectedTab === 'gd-linesearch'` section (created in Task 9, Step 2), add:

```typescript
          ) : selectedTab === 'gd-linesearch' ? (
            <>
              {/* GD Line Search - Why This Algorithm? */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Gradient Descent (Line Search)</h2>
                <p className="text-gray-800 text-lg">
                  Adaptive step size selection: choose α dynamically at each iteration to ensure sufficient decrease.
                </p>
              </div>

              <CollapsibleSection
                title="The Problem with Fixed Step Size"
                defaultExpanded={true}
                storageKey="gd-ls-problem"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Fixed α has a dilemma:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Early iterations: Far from minimum, could take large steps → α should be big</li>
                    <li>Late iterations: Near minimum, need precision → α should be small</li>
                    <li>One fixed α can't be optimal throughout!</li>
                  </ul>
                  <p className="mt-4"><strong>Additional problem: α depends on the problem</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Changing λ (regularization) changes the landscape steepness</li>
                    <li>Adding data points changes the loss function</li>
                    <li>What worked before might not work now</li>
                  </ul>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Line Search: Adaptive Step Sizes"
                defaultExpanded={true}
                storageKey="gd-ls-idea"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>Idea:</strong> Choose α dynamically at each iteration</p>
                  <div className="bg-blue-200 rounded p-4 mt-3">
                    <p className="font-bold">At iteration k:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Compute search direction: p = -∇f(w⁽ᵏ⁾)</li>
                      <li>Find good step size: α_k = lineSearch(w⁽ᵏ⁾, p)</li>
                      <li>Update: w⁽ᵏ⁺¹⁾ = w⁽ᵏ⁾ + α_k·p</li>
                    </ol>
                  </div>
                  <p className="mt-3"><strong>Question:</strong> What makes a step size "good"?</p>
                  <p><strong>Answer:</strong> Sufficient decrease in loss (Armijo condition)</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="The Algorithm"
                defaultExpanded={true}
                storageKey="gd-ls-algorithm"
              >
                <div className="space-y-3 text-gray-800">
                  <div className="bg-blue-100 rounded p-4">
                    <p className="font-bold">Main Loop:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Compute gradient: g = ∇f(w)</li>
                      <li>Set search direction: p = -g</li>
                      <li>Perform line search: α = armijoLineSearch(w, p, g)</li>
                      <li>Update: w_new = w + α·p</li>
                      <li>Repeat until ||g|| &lt; ε</li>
                    </ol>
                  </div>
                  <div className="bg-blue-100 rounded p-4 mt-3">
                    <p className="font-bold">Armijo Line Search (backtracking):</p>
                    <p className="mt-2">Input: w, p, g, f(w), c₁</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Start with α = 1</li>
                      <li>While f(w + αp) &gt; f(w) + c₁·α·(gᵀp):</li>
                      <li className="ml-6">α ← α/2</li>
                      <li>Return α</li>
                    </ol>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Armijo Condition (The Rule)"
                defaultExpanded={false}
                storageKey="gd-ls-armijo"
              >
                <div className="space-y-3 text-gray-800 font-mono text-sm">
                  <p className="font-bold">Accept α if it satisfies:</p>
                  <p>f(w + α·p) ≤ f(w) + c₁·α·(∇f(w)ᵀp)</p>
                  <div className="mt-4 font-sans">
                    <p className="font-bold">Interpretation:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>Left side: Actual loss after taking step</li>
                      <li>Right side: Expected loss from linear approximation + safety margin</li>
                      <li>c₁ ∈ (0, 1): How much decrease we demand (typically 10⁻⁴)</li>
                    </ul>
                    <p className="mt-3">Smaller c₁ → accept steps more easily (less picky)</p>
                    <p>Larger c₁ → demand more decrease (more picky)</p>
                    <p className="mt-3">The condition ensures sufficient decrease without being too greedy.
                    We don't need the absolute best α, just a good-enough α that reduces loss adequately.</p>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Line Search Visualization"
                defaultExpanded={true}
                storageKey="gd-ls-viz"
              >
                <div className="space-y-3 text-gray-800">
                  <p><strong>The plot shows:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>X-axis: Step size α we're testing</li>
                    <li>Y-axis: Loss value f(w + α·p)</li>
                    <li>Blue curve: Actual loss along the search direction</li>
                    <li>Orange dashed line: Armijo condition boundary</li>
                    <li>Red dots: Step sizes that were rejected (not enough decrease)</li>
                    <li>Green dot: Accepted step size (satisfies Armijo)</li>
                  </ul>
                  <p className="mt-3">Watch how the algorithm tries α, rejects it, tries smaller α,
                  until it finds one that gives sufficient decrease.</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Try This"
                defaultExpanded={false}
                storageKey="gd-ls-try"
              >
                <div className="space-y-2 text-gray-800">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Set c₁ = 10⁻⁵ (very lenient): Accepts larger steps, fewer backtracks</li>
                    <li>Set c₁ = 0.1 (strict): Demands more decrease, more backtracks</li>
                    <li>Compare convergence speed with GD Fixed Step tab</li>
                    <li>Add data points: Watch line search adapt automatically</li>
                  </ul>
                </div>
              </CollapsibleSection>

              {/* GD Line Search Visualizations */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space (w₀, w₁)</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Loss landscape with trajectory. Notice adaptive step sizes.
                  </p>
                  <canvas
                    ref={gdLSParamCanvasRef}
                    style={{width: '400px', height: '333px'}}
                    className="border border-gray-300 rounded"
                  />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Line Search</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Backtracking search for step size satisfying Armijo condition.
                  </p>
                  <canvas
                    ref={gdLSLineSearchCanvasRef}
                    style={{width: '400px', height: '280px'}}
                    className="border border-gray-300 rounded bg-white"
                  />
                </div>
              </div>
            </>
          ) : selectedTab === 'newton' ? (
```

### Step 2: Test GD Line Search tab

Run: `npm run dev`

Navigate to GD Line Search tab

Expected:
- See pedagogical content sections
- See parameter space and line search visualizations
- Armijo c₁ slider works
- Can step through iterations

### Step 3: Commit

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add complete UI for GD Line Search tab

- Add pedagogical content explaining line search motivation
- Add Armijo condition explanation with math details
- Add parameter space and line search visualizations
- Add c₁ slider control for Armijo parameter
- Second tab in pedagogical progression complete
- Demonstrates value of adaptive step sizes"
```

---

## Task 11: Final Testing and Polish

**Goal:** Test the complete 4-tab experience and fix any issues

### Step 1: Comprehensive manual testing

Run: `npm run dev`

Test each tab:
1. **GD Fixed Step:**
   - [ ] Adjust α slider, observe trajectory changes
   - [ ] Try α = 0.001 (very slow), α = 0.5 (oscillating), α = 1.5 (diverging)
   - [ ] Add custom data points, rerun optimization
   - [ ] Expand/collapse pedagogical sections
   - [ ] Step through iterations with prev/next/keyboard

2. **GD Line Search:**
   - [ ] Adjust c₁ slider, observe line search trials
   - [ ] Compare convergence speed vs GD Fixed
   - [ ] Watch line search adapt to different situations
   - [ ] Verify line search plot matches trials

3. **Newton's Method:**
   - [ ] Verify still works after refactoring
   - [ ] Line search visualization intact
   - [ ] Hessian visualization renders correctly

4. **L-BFGS:**
   - [ ] Verify still works after refactoring
   - [ ] Memory pairs table displays
   - [ ] Two-loop recursion details show

5. **Cross-tab interactions:**
   - [ ] Add custom data points, switch tabs, verify data persists
   - [ ] Change λ regularization, all tabs recompute
   - [ ] Each tab maintains independent iteration position

### Step 2: Fix any discovered issues

Document and fix any bugs found during testing.

### Step 3: Check browser console for errors

Verify no console warnings or errors

### Step 4: Test responsive behavior

- [ ] Resize window, verify canvases adapt
- [ ] Test on mobile viewport (optional, but check layout doesn't break)

### Step 5: Performance check

- [ ] Verify no lag when adjusting sliders
- [ ] Stepping through iterations should be smooth
- [ ] Canvas rendering should be fast

### Step 6: Final commit

```bash
git add .
git commit -m "test: comprehensive testing and polish

- Verified all 4 tabs work correctly
- Tested slider interactions and visualization updates
- Verified data persistence across tab switches
- Confirmed keyboard navigation works
- All pedagogical content renders properly
- No console errors or warnings"
```

---

## Task 12: Update Documentation

**Goal:** Update README with new features

**Files:**
- Modify: `README.md`

### Step 1: Update README.md

Replace or enhance `README.md` content:

```markdown
# Optimization Algorithm Visualizer

A pedagogical React app for understanding iterative optimization algorithms through interactive visualization.

## Features

- **4 Algorithm Tabs:**
  1. **Gradient Descent (Fixed Step)** - Learn the basics of first-order optimization
  2. **Gradient Descent (Line Search)** - See adaptive step size selection in action
  3. **Newton's Method** - Understand second-order methods with Hessian visualization
  4. **L-BFGS** - Explore memory-efficient quasi-Newton approximation

- **Shared Problem Setup:**
  - Logistic regression on 2D crescent dataset
  - Interactive point adding (click canvas to add custom data)
  - Adjustable regularization parameter λ
  - Data persists across algorithm tabs for direct comparison

- **Rich Visualizations:**
  - Data space with decision boundary
  - Parameter space with loss landscape and optimization trajectory
  - Line search plots showing backtracking trials
  - Hessian matrix and eigenvalues (Newton)
  - Memory pairs and two-loop recursion (L-BFGS)

- **Pedagogical Content:**
  - Collapsible sections explaining each algorithm
  - Mathematical derivations and pseudocode
  - Guided experiments ("Try This" suggestions)
  - Progressive complexity from simple to advanced

## Architecture

- **Extensible Design:**
  - Line search algorithms are pluggable (Armijo currently implemented)
  - Problem/dataset can be swapped (logistic regression currently)
  - Easy to add new optimization algorithms

- **Tech Stack:**
  - React + TypeScript
  - HTML Canvas for visualizations
  - Tailwind CSS for styling
  - Vite for build

## Usage

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Learning Path

1. Start with **GD (Fixed Step)** to understand gradient descent fundamentals
2. Move to **GD (Line Search)** to see why adaptive step sizes matter
3. Explore **Newton's Method** to see how curvature information helps
4. Finish with **L-BFGS** to understand efficient approximation for large-scale problems

## Interactive Experiments

- Adjust hyperparameters and observe effects on convergence
- Add custom data points to change the optimization landscape
- Step through iterations to understand algorithm behavior
- Compare trajectories across different algorithms on the same problem

## Future Enhancements

- Additional line search strategies (Wolfe, Strong Wolfe)
- Additional optimization problems (Rosenbrock, quadratic, neural networks)
- CSV/JSON dataset upload
- Side-by-side algorithm comparison mode
- Animation playback mode

## License

MIT
```

### Step 2: Commit README update

```bash
git add README.md
git commit -m "docs: update README with complete feature description

- Document all 4 algorithm tabs
- Explain pedagogical progression
- List interactive features and visualizations
- Add usage instructions and learning path
- Describe extensible architecture
- List future enhancement ideas"
```

---

## Task 13: Create Feature Summary

**Goal:** Final summary commit and verification

### Step 1: Verify build works

```bash
npm run build
```

Expected: Build completes without errors

### Step 2: Create final summary

Review all commits, verify implementation matches design doc

### Step 3: Final commit

```bash
git add .
git commit -m "feat: complete gradient descent pedagogy implementation

Summary of changes:
- Extracted Armijo line search to shared module (DRY)
- Implemented GD fixed step algorithm
- Implemented GD line search algorithm
- Created CollapsibleSection component for pedagogical content
- Expanded UnifiedVisualizer from 2 to 4 tabs
- Added visualizations for GD tabs (param space, line search)
- Added comprehensive pedagogical content for all tabs
- Maintained extensible architecture for future enhancements

Result: Complete pedagogical progression from first-order to second-order
optimization methods with rich interactive visualizations.

Closes design: docs/plans/2025-11-04-gradient-descent-pedagogy-design.md"
```

### Step 4: Verify git log

```bash
git log --oneline -15
```

Expected: See all task commits in logical order

---

## Summary

This implementation plan creates a complete pedagogical optimization visualizer with 4 algorithm tabs:

1. **GD (Fixed Step)** - Foundation of gradient-based optimization
2. **GD (Line Search)** - Adaptive step size selection
3. **Newton's Method** - Second-order curvature information
4. **L-BFGS** - Memory-efficient quasi-Newton approximation

**Key Achievements:**
- DRY: Shared line search implementation
- YAGNI: No over-engineering, focused on pedagogical goals
- TDD: Incremental testing at each step
- Frequent commits: Each task is independently versioned
- Extensible: Architecture supports future line search and problem swapping

**Total Tasks:** 13 bite-sized tasks
**Estimated Time:** 3-4 hours for experienced developer
**Lines of Code:** ~2000 new lines (algorithms, UI, content)
