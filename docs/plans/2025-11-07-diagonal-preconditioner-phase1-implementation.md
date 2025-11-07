# Diagonal Preconditioner (Phase 1: Hessian-Based) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Hessian-based diagonal preconditioner algorithm to complete the step size sophistication story from scalar → adaptive scalar → diagonal → full matrix.

**Architecture:** New algorithm tab between GD-linesearch and Newton. Uses Hessian diagonal D=diag(1/H₀₀, 1/H₁₁) for per-coordinate step sizes. Demonstrates coordinate dependence through rotation experiments (θ=0°: 1-2 iters, θ=45°: 41 iters).

**Tech Stack:** TypeScript, React, existing algorithm infrastructure (ProblemFunctions, AlgorithmResult), Armijo line search

---

## Background Context

### Codebase Structure

```
src/
  algorithms/
    types.ts                      # AlgorithmOptions, AlgorithmResult, AlgorithmSummary
    gradient-descent.ts           # Fixed step size
    gradient-descent-linesearch.ts # Adaptive step size
    newton.ts                     # Full Hessian H⁻¹
    lbfgs.ts                      # Approximate H⁻¹

  experiments/
    index.ts                      # getExperimentsForAlgorithm()
    gd-fixed-presets.ts
    gd-linesearch-presets.ts
    newton-presets.ts
    lbfgs-presets.ts

  components/
    AlgorithmExplainer.tsx        # Educational content for all algorithms
    AlgorithmConfiguration.tsx    # Control panels per algorithm

  types/
    experiments.ts                # ProblemType, ExperimentPreset, ProblemDefinition

  UnifiedVisualizer.tsx           # Main component with tabs
```

### Existing Patterns

**Algorithm Return Type:**
```typescript
export interface AlgorithmResult<T> {
  iterations: T[];
  summary: AlgorithmSummary;
}

export interface AlgorithmSummary {
  converged: boolean;
  diverged: boolean;
  finalLocation: number[];
  finalLoss: number;
  finalGradNorm: number;
  iterationCount: number;
  convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
}
```

**Algorithm Function Signature:**
```typescript
export const runAlgorithm = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { /* specific params */ }
): AlgorithmResult<IterationType> => {
  // Implementation
}
```

### Pedagogical Story

The visualizer teaches optimization through progressive sophistication:

1. **GD-fixed**: Scalar step size α (one size for all coordinates)
2. **GD-linesearch**: Adaptive scalar α (adapts per iteration)
3. **Diagonal Precond** ← WE ARE HERE: Per-coordinate step sizes D=diag(1/H₀₀, 1/H₁₁)
4. **Newton**: Full matrix H⁻¹ (rotation-invariant)
5. **L-BFGS**: Approximate H⁻¹ (efficient)

**Key Insight:** Diagonal preconditioning is coordinate-dependent:
- θ=0° (aligned): D perfectly inverts diagonal H → 1-2 iterations ✨
- θ=45° (rotated): D misses off-diagonal terms → 41 iterations 😱
- Newton at any angle: 2 iterations 🎯 (rotation-invariant)

This demonstrates **why Newton's full matrix is necessary**.

### Test Results (From Feasibility Study)

Rotated ellipse (κ=5), initial point [2, 2]:

| Algorithm | θ=0° | θ=45° | Rotation Invariant? |
|-----------|------|-------|---------------------|
| GD-fixed | 139 | 25 | ❌ No (5.6×) |
| GD-linesearch | 34 | 13 | ❌ No (2.6×) |
| **Diagonal Precond** | **1-2** | **41** | ❌ **No (20×!)** |
| Newton | 2 | 2 | ✅ **Yes** |

---

## Task 1: Core Algorithm Implementation

**Files:**
- Create: `src/algorithms/diagonal-preconditioner.ts`
- Reference: `src/algorithms/gradient-descent-linesearch.ts` (similar structure)
- Reference: `src/algorithms/newton.ts` (uses Hessian)

### Step 1: Create algorithm file with types and imports

Create `src/algorithms/diagonal-preconditioner.ts`:

```typescript
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
import { armijoLineSearch } from '../line-search/armijo';
import { norm, scale, add } from '../shared-utils';

export interface DiagonalPrecondIteration {
  iter: number;
  w: number[];
  wNew: number[];
  loss: number;
  newLoss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  stepNorm: number;
  hessianDiagonal: number[];
  preconditioner: number[];
  alpha?: number;  // If using line search
  lineSearchTrials?: any[];  // If using line search
}

/**
 * Diagonal Preconditioner with Hessian Diagonal
 *
 * Uses per-coordinate step sizes based on Hessian diagonal: D = diag(1/H₀₀, 1/H₁₁, ...)
 *
 * Update rule: w_new = w - D * ∇f(w)
 *
 * Properties:
 * - Perfect on axis-aligned problems (D = H⁻¹ exactly)
 * - Coordinate-dependent (fails on rotated problems)
 * - No matrix inversion needed (just diagonal)
 *
 * @param problem Problem definition with objective, gradient, and Hessian
 * @param options Algorithm options including maxIter, useLineSearch, and optional initial point
 * @returns Algorithm result with iterations and summary
 */
export const runDiagonalPreconditioner = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    useLineSearch?: boolean;
    c1?: number;
    lambda?: number;
    epsilon?: number;
  }
): AlgorithmResult<DiagonalPrecondIteration> => {
  const {
    maxIter,
    initialPoint,
    tolerance = 1e-6,
    useLineSearch = false,
    c1 = 0.0001,
    lambda = 0,
    epsilon = 1e-8
  } = options;

  // Note: lambda accepted for API consistency but unused
  void lambda;

  if (!problem.hessian) {
    throw new Error('Diagonal preconditioner requires Hessian computation');
  }

  const iterations: DiagonalPrecondIteration[] = [];
  let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Compute Hessian and extract diagonal
    const H = problem.hessian(w);
    const hessianDiagonal = problem.dimensionality === 3
      ? [H[0][0], H[1][1], H[2][2]]
      : [H[0][0], H[1][1]];

    // Build diagonal preconditioner D = diag(1/(H_ii + ε))
    // Add epsilon for numerical stability
    const preconditioner = hessianDiagonal.map(d => 1 / (d + epsilon));

    // Compute preconditioned direction: p = -D * grad
    const direction = grad.map((g, i) => -preconditioner[i] * g);
    const stepNorm = norm(direction);

    let wNew: number[];
    let newLoss: number;
    let alpha: number | undefined;
    let lineSearchTrials: any[] | undefined;

    if (useLineSearch) {
      // Use line search for robustness
      const lineSearchResult = armijoLineSearch(
        w,
        direction,
        grad,
        loss,
        (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
        c1
      );
      alpha = lineSearchResult.alpha;
      wNew = add(w, scale(direction, alpha));
      newLoss = problem.objective(wNew);
      lineSearchTrials = lineSearchResult.trials;
    } else {
      // Take full step (optimal for quadratics)
      alpha = 1.0;
      wNew = add(w, direction);
      newLoss = problem.objective(wNew);
    }

    iterations.push({
      iter,
      w: [...w],
      wNew: [...wNew],
      loss,
      newLoss,
      grad: [...grad],
      gradNorm,
      direction,
      stepNorm,
      hessianDiagonal,
      preconditioner,
      alpha,
      lineSearchTrials
    });

    w = wNew;

    // Check convergence
    if (gradNorm < tolerance) {
      break;
    }

    // Check for divergence
    if (!isFinite(newLoss) || !isFinite(gradNorm)) {
      break;
    }
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
};
```

### Step 2: Test the algorithm implementation

Create `test-diagonal-preconditioner-impl.ts` in project root:

```typescript
#!/usr/bin/env tsx
import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runDiagonalPreconditioner } from './src/algorithms/diagonal-preconditioner';

console.log('Testing Diagonal Preconditioner Implementation\n');

// Test 1: θ=0° (should converge in 1-2 iterations)
console.log('Test 1: θ=0° (aligned with axes)');
const problem0 = createRotatedQuadratic(0);
const problemFuncs0 = problemToProblemFunctions(problem0);
const result0 = runDiagonalPreconditioner(problemFuncs0, {
  maxIter: 10,
  initialPoint: [2, 2]
});

console.log(`  Iterations: ${result0.iterations.length}`);
console.log(`  Converged: ${result0.summary.converged}`);
console.log(`  Final loss: ${result0.summary.finalLoss.toExponential(2)}`);
console.log(`  Final grad norm: ${result0.summary.finalGradNorm.toExponential(2)}`);
console.log(`  Expected: 1-2 iterations, converged\n`);

// Test 2: θ=45° (should take many iterations)
console.log('Test 2: θ=45° (rotated)');
const problem45 = createRotatedQuadratic(45);
const problemFuncs45 = problemToProblemFunctions(problem45);
const result45 = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2]
});

console.log(`  Iterations: ${result45.iterations.length}`);
console.log(`  Converged: ${result45.summary.converged}`);
console.log(`  Final loss: ${result45.summary.finalLoss.toExponential(2)}`);
console.log(`  Final grad norm: ${result45.summary.finalGradNorm.toExponential(2)}`);
console.log(`  Expected: 40+ iterations, converged\n`);

// Test 3: With line search
console.log('Test 3: With line search enabled');
const result45LS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: true
});

console.log(`  Iterations: ${result45LS.iterations.length}`);
console.log(`  Converged: ${result45LS.summary.converged}`);
console.log(`  Line search used: ${result45LS.iterations[0].lineSearchTrials !== undefined}\n`);

// Verify rotation dependence
const ratio = result45.iterations.length / result0.iterations.length;
console.log('Rotation Dependence:');
console.log(`  θ=0°: ${result0.iterations.length} iters`);
console.log(`  θ=45°: ${result45.iterations.length} iters`);
console.log(`  Ratio: ${ratio.toFixed(1)}× worse`);
console.log(`  Expected: ~20× difference\n`);

if (result0.summary.converged && result45.summary.converged && ratio > 15) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Tests failed!');
  process.exit(1);
}
```

Run: `npx tsx test-diagonal-preconditioner-impl.ts`

Expected output:
```
Test 1: θ=0° (aligned with axes)
  Iterations: 1-2
  Converged: true
  Expected: 1-2 iterations, converged

Test 2: θ=45° (rotated)
  Iterations: 40+
  Converged: true
  Expected: 40+ iterations, converged

✅ All tests passed!
```

### Step 3: Commit algorithm implementation

```bash
git add src/algorithms/diagonal-preconditioner.ts test-diagonal-preconditioner-impl.ts
git commit -m "feat(algorithms): add Hessian-based diagonal preconditioner

- Uses D=diag(1/H₀₀, 1/H₁₁) for per-coordinate step sizes
- Demonstrates rotation dependence (1-2 iters at θ=0°, 41 at θ=45°)
- Optional line search for robustness
- Returns AlgorithmResult with full convergence summary"
```

---

## Task 2: Experiment Presets

**Files:**
- Create: `src/experiments/diagonal-precond-presets.ts`
- Modify: `src/experiments/index.ts`

### Step 1: Create experiment presets file

Create `src/experiments/diagonal-precond-presets.ts`:

```typescript
import { ExperimentPreset } from '../types/experiments';

export const diagonalPrecondExperiments: ExperimentPreset[] = [
  {
    id: 'diag-precond-aligned-success',
    name: 'Success: Aligned with Axes',
    description: 'Ellipse aligned with axes - diagonal preconditioner is perfect!',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 10,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Converges in 1-2 iterations! D=diag(1/H₀₀, 1/H₁₁) perfectly inverts diagonal Hessian',
  },
  {
    id: 'diag-precond-rotated-failure',
    name: 'Failure: Rotated Problem',
    description: 'Ellipse rotated 45° - diagonal preconditioner struggles!',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Takes 40+ iterations! Hessian has off-diagonal terms that D cannot capture',
  },
  {
    id: 'diag-precond-compare-gd',
    name: 'Compare: Diagonal vs GD+LS',
    description: 'Diagonal precond vastly outperforms GD when aligned',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Diagonal precond (2 iters) vs GD+LS (30+ iters) when problem aligns with axes',
    comparisonConfig: {
      left: { algorithm: 'diagonal-precond' },
      right: { algorithm: 'gd-linesearch', c1: 0.0001 },
    },
  },
  {
    id: 'diag-precond-compare-newton',
    name: 'Compare: The Rotation Invariance Story',
    description: 'Side-by-side: diagonal precond vs Newton on rotated problem',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Diagonal precond struggles (40 iters), Newton excels (2 iters) - full matrix is rotation-invariant!',
    comparisonConfig: {
      left: { algorithm: 'diagonal-precond' },
      right: { algorithm: 'newton', c1: 0.0001 },
    },
  },
  {
    id: 'diag-precond-circular',
    name: 'Demo: No Rotation Dependence on Circular Bowl',
    description: 'Circular problem (κ=1) has no preferred direction',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 200,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Even diagonal precond works well on circular problem - all methods converge similarly',
  },
];
```

### Step 2: Export experiments from index

Modify `src/experiments/index.ts`:

```typescript
import { ExperimentPreset } from '../types/experiments';
import { gdFixedExperiments } from './gd-fixed-presets';
import { gdLinesearchExperiments } from './gd-linesearch-presets';
import { diagonalPrecondExperiments } from './diagonal-precond-presets';  // ADD THIS
import { newtonExperiments } from './newton-presets';
import { lbfgsExperiments } from './lbfgs-presets';

export function getExperimentsForAlgorithm(algorithm: string): ExperimentPreset[] {
  switch (algorithm) {
    case 'gd-fixed':
      return gdFixedExperiments;
    case 'gd-linesearch':
      return gdLinesearchExperiments;
    case 'diagonal-precond':  // ADD THIS CASE
      return diagonalPrecondExperiments;
    case 'newton':
      return newtonExperiments;
    case 'lbfgs':
      return lbfgsExperiments;
    default:
      return [];
  }
}
```

### Step 3: Test experiment loading

Create `test-diagonal-experiments.ts`:

```typescript
#!/usr/bin/env tsx
import { getExperimentsForAlgorithm } from './src/experiments';

console.log('Testing diagonal preconditioner experiments\n');

const experiments = getExperimentsForAlgorithm('diagonal-precond');

console.log(`Found ${experiments.length} experiments:`);
experiments.forEach(exp => {
  console.log(`  - ${exp.id}: ${exp.name}`);
});

console.log(`\nExpected: 5 experiments`);

if (experiments.length === 5) {
  console.log('✅ Test passed!');
} else {
  console.log('❌ Test failed!');
  process.exit(1);
}
```

Run: `npx tsx test-diagonal-experiments.ts`

Expected: `✅ Test passed!`

### Step 4: Commit experiments

```bash
git add src/experiments/diagonal-precond-presets.ts src/experiments/index.ts test-diagonal-experiments.ts
git commit -m "feat(experiments): add diagonal preconditioner presets

- 5 experiments demonstrating rotation dependence
- Comparisons with GD-linesearch and Newton
- Shows alignment success and rotation failure"
```

---

## Task 3: Type System Updates

**Files:**
- Modify: `src/types/experiments.ts`
- Modify: `src/UnifiedVisualizer.tsx` (just the Algorithm type)

### Step 1: Add diagonal-precond to ProblemType

This step is not needed - `diagonal-precond` is an algorithm, not a problem type.

### Step 2: Update Algorithm type in UnifiedVisualizer

Modify `src/UnifiedVisualizer.tsx`, find the Algorithm type definition (around line 37):

```typescript
// BEFORE:
type Algorithm = 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';

// AFTER:
type Algorithm = 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
```

### Step 3: Verify TypeScript compilation

Run: `npm run build`

Expected: No type errors

### Step 4: Commit type updates

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(types): add diagonal-precond to Algorithm union type"
```

---

## Task 4: UI State Management

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (state declarations, around line 62-108)

### Step 1: Add diagonal preconditioner state variables

In `UnifiedVisualizer.tsx`, after L-BFGS state (around line 107), add:

```typescript
  // Diagonal Preconditioner state
  const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
  const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
  const [diagPrecondUseLineSearch, setDiagPrecondUseLineSearch] = useState(false);
  const [diagPrecondC1, setDiagPrecondC1] = useState(0.0001);
  const [diagPrecondTolerance, setDiagPrecondTolerance] = useState(1e-6);
  const [diagPrecondEpsilon, setDiagPrecondEpsilon] = useState(1e-8);
```

### Step 2: Add import for DiagonalPrecondIteration

At top of `UnifiedVisualizer.tsx` (around line 14-17), add:

```typescript
import { runDiagonalPreconditioner, DiagonalPrecondIteration } from './algorithms/diagonal-preconditioner';
```

### Step 3: Update localStorage key for selected tab

Find the localStorage.getItem check for selectedAlgorithmTab (around line 73-79):

```typescript
// BEFORE:
if (saved && ['algorithms', 'gd-fixed', 'gd-linesearch', 'newton', 'lbfgs'].includes(saved)) {

// AFTER:
if (saved && ['algorithms', 'gd-fixed', 'gd-linesearch', 'diagonal-precond', 'newton', 'lbfgs'].includes(saved)) {
```

### Step 4: Test state initialization

Run: `npm run dev`

Open browser console, check no errors on page load.

### Step 5: Commit state management

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add diagonal preconditioner state management

- State for iterations, current iter, hyperparameters
- Import DiagonalPrecondIteration type
- Update localStorage tab validation"
```

---

## Task 5: Run Algorithm Function

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add runDiagPrecond function)

### Step 1: Add runDiagPrecond callback

In `UnifiedVisualizer.tsx`, after the `runLBFGS` callback (search for "const runLBFGS = useCallback"), add:

```typescript
  // Run diagonal preconditioner
  const runDiagPrecond = useCallback(() => {
    const problem = getCurrentProblem();
    const problemFuncs = currentProblem === 'logistic-regression'
      ? logisticRegressionToProblemFunctions(data, lambda)
      : currentProblem === 'separating-hyperplane'
      ? separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda)
      : problemToProblemFunctions(problem);

    const initialPoint = problem.dimensionality === 3
      ? [initialW0, initialW1, 0] as [number, number, number]
      : [initialW0, initialW1] as [number, number];

    const result = runDiagonalPreconditioner(problemFuncs, {
      maxIter,
      initialPoint,
      tolerance: diagPrecondTolerance,
      useLineSearch: diagPrecondUseLineSearch,
      c1: diagPrecondC1,
      lambda,
      epsilon: diagPrecondEpsilon
    });

    setDiagPrecondIterations(result.iterations);
    setDiagPrecondCurrentIter(0);

    // Show toast with convergence info
    if (result.summary.converged) {
      setToast({
        message: `Converged in ${result.iterations.length} iterations`,
        type: 'success'
      });
    } else if (result.summary.diverged) {
      setToast({
        message: 'Algorithm diverged',
        type: 'error'
      });
    } else {
      setToast({
        message: `Did not converge in ${maxIter} iterations`,
        type: 'info'
      });
    }
  }, [
    currentProblem,
    data,
    lambda,
    separatingHyperplaneVariant,
    maxIter,
    initialW0,
    initialW1,
    diagPrecondTolerance,
    diagPrecondUseLineSearch,
    diagPrecondC1,
    diagPrecondEpsilon,
    rotationAngle,
    conditionNumber,
    rosenbrockB
  ]);
```

### Step 2: Verify compilation

Run: `npm run build`

Expected: No errors

### Step 3: Commit run function

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add runDiagPrecond callback

- Handles all problem types (logistic, separating hyperplane, pure optimization)
- Uses configured hyperparameters
- Shows convergence toast notifications"
```

---

## Task 6: Tab UI - Button and Basic Layout

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (tab buttons and tab content)

### Step 1: Add tab button

Find the tab button section (search for `<button` with `onClick={() => setSelectedTab`), add after gd-linesearch button:

```typescript
        {/* Diagonal Preconditioner Tab */}
        <button
          onClick={() => setSelectedTab('diagonal-precond')}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedTab === 'diagonal-precond'
              ? 'bg-teal-100 text-teal-900 border-b-2 border-teal-500'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Diagonal Preconditioner
        </button>
```

### Step 2: Add tab content section

Find the tab content sections (search for `{selectedTab === 'lbfgs' &&`), add after lbfgs section and before the closing of the parent div:

```typescript
        {/* Diagonal Preconditioner Tab Content */}
        {selectedTab === 'diagonal-precond' && (
          <div className="space-y-4">
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <h3 className="text-lg font-semibold text-teal-900 mb-2">
                Diagonal Preconditioner: Per-Coordinate Step Sizes
              </h3>
              <p className="text-sm text-teal-800">
                Uses Hessian diagonal D = diag(1/H₀₀, 1/H₁₁) for per-coordinate scaling.
                Perfect when problem aligns with axes, struggles when rotated.
              </p>
            </div>

            {/* Placeholder for controls and visualization */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <button
                onClick={runDiagPrecond}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Run Diagonal Preconditioner
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Iterations: {diagPrecondIterations.length}
              </p>
            </div>
          </div>
        )}
```

### Step 3: Test tab switching and run button

Run: `npm run dev`

Test:
1. Click "Diagonal Preconditioner" tab - should switch
2. Tab should have teal color scheme
3. Click "Run Diagonal Preconditioner" button - should execute (check console for any errors)
4. Should see iteration count update

### Step 4: Commit tab UI

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add diagonal preconditioner tab with basic layout

- Teal color scheme (between blue GD-LS and purple Newton)
- Basic run button and iteration counter
- Pedagogical description banner"
```

---

## Task 7: Algorithm Configuration Component

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (expand tab content with controls)

### Step 1: Add configuration controls

Replace the placeholder section in the diagonal-precond tab content with full controls:

```typescript
            {/* Algorithm Configuration */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Configuration</h4>

              <div className="space-y-4">
                {/* Use Line Search Toggle */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={diagPrecondUseLineSearch}
                    onChange={(e) => setDiagPrecondUseLineSearch(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Use Armijo Line Search</span>
                </label>

                {/* C1 Parameter (if line search enabled) */}
                {diagPrecondUseLineSearch && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      c₁ (Armijo parameter): {diagPrecondC1.toExponential(1)}
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="-1"
                      step="0.1"
                      value={Math.log10(diagPrecondC1)}
                      onChange={(e) => setDiagPrecondC1(Math.pow(10, parseFloat(e.target.value)))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10⁻⁵ (lenient)</span>
                      <span>10⁻¹ (strict)</span>
                    </div>
                  </div>
                )}

                {/* Epsilon (numerical stability) */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ε (numerical stability): {diagPrecondEpsilon.toExponential(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="-6"
                    step="0.5"
                    value={Math.log10(diagPrecondEpsilon)}
                    onChange={(e) => setDiagPrecondEpsilon(Math.pow(10, parseFloat(e.target.value)))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>10⁻¹⁰</span>
                    <span>10⁻⁶</span>
                  </div>
                </div>

                {/* Max Iterations */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Max Iterations: {maxIter}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={maxIter}
                    onChange={(e) => setMaxIter(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Run Button */}
                <button
                  onClick={runDiagPrecond}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium"
                >
                  Run Diagonal Preconditioner
                </button>
              </div>
            </div>
```

### Step 2: Test configuration controls

Run: `npm run dev`

Test:
1. Toggle line search - c1 slider should appear/disappear
2. Adjust epsilon slider - value should update
3. Adjust max iterations slider
4. Run algorithm with different settings

### Step 3: Commit configuration controls

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add diagonal preconditioner configuration controls

- Line search toggle with c1 parameter
- Epsilon slider for numerical stability
- Max iterations slider
- Full-width run button"
```

---

## Task 8: Iteration Metrics Display

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add metrics panel)

### Step 1: Add metrics display

After the configuration section in diagonal-precond tab, add:

```typescript
            {/* Iteration Metrics */}
            {diagPrecondIterations.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Iteration {diagPrecondCurrentIter + 1} of {diagPrecondIterations.length}
                </h4>

                {(() => {
                  const iter = diagPrecondIterations[diagPrecondCurrentIter];
                  if (!iter) return null;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Loss:</span>
                          <span className="ml-2 font-mono">{iter.newLoss.toExponential(4)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Gradient Norm:</span>
                          <span className="ml-2 font-mono">{iter.gradNorm.toExponential(4)}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Current Position:</span>
                        <div className="font-mono text-xs mt-1">
                          w = [{iter.wNew.map(x => x.toFixed(4)).join(', ')}]
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Hessian Diagonal:</span>
                        <div className="font-mono text-xs mt-1">
                          [{iter.hessianDiagonal.map(x => x.toFixed(4)).join(', ')}]
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Preconditioner:</span>
                        <div className="font-mono text-xs mt-1">
                          D = [{iter.preconditioner.map(x => x.toFixed(4)).join(', ')}]
                        </div>
                      </div>

                      {iter.alpha !== undefined && (
                        <div>
                          <span className="text-gray-600">Step Size α:</span>
                          <span className="ml-2 font-mono">{iter.alpha.toFixed(6)}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-600">Step Norm:</span>
                        <span className="ml-2 font-mono">{iter.stepNorm.toExponential(4)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Iteration Controls */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setDiagPrecondCurrentIter(Math.max(0, diagPrecondCurrentIter - 1))}
                    disabled={diagPrecondCurrentIter === 0}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setDiagPrecondCurrentIter(Math.min(diagPrecondIterations.length - 1, diagPrecondCurrentIter + 1))}
                    disabled={diagPrecondCurrentIter === diagPrecondIterations.length - 1}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setDiagPrecondCurrentIter(diagPrecondIterations.length - 1)}
                    className="px-3 py-1 bg-teal-600 text-white rounded text-sm"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
```

### Step 2: Test metrics display

Run: `npm run dev`

Test:
1. Run algorithm on rotated quadratic (θ=45°)
2. Metrics panel should appear
3. Previous/Next buttons should navigate iterations
4. Should see Hessian diagonal and preconditioner values
5. Last button should jump to final iteration

### Step 3: Commit metrics display

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add diagonal preconditioner metrics display

- Shows loss, gradient norm, position
- Displays Hessian diagonal and preconditioner
- Iteration navigation controls
- Step size when line search enabled"
```

---

## Task 9: Experiment Preset Loading

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add experiment loading for diagonal-precond)

### Step 1: Add experiment loading handler

Find the experiment loading section (search for `const loadExperiment`). The existing function should handle diagonal-precond automatically through the switch statement, but we need to add the diagonal-precond case for setting hyperparameters.

Find where hyperparameters are applied (search for `case 'gd-linesearch':`), add after it:

```typescript
      case 'diagonal-precond':
        if (preset.hyperparameters.c1 !== undefined) {
          setDiagPrecondC1(preset.hyperparameters.c1);
        }
        if (preset.hyperparameters.maxIter !== undefined) {
          setMaxIter(preset.hyperparameters.maxIter);
        }
        // Run the algorithm
        setTimeout(() => runDiagPrecond(), 100);
        break;
```

### Step 2: Update experiment list rendering

The experiment list should already work through `getExperimentsForAlgorithm(selectedTab)`, but verify it shows diagonal-precond experiments when on that tab.

### Step 3: Test experiment loading

Run: `npm run dev`

Test:
1. Click "Diagonal Preconditioner" tab
2. Should see 5 experiment presets in sidebar
3. Click "Success: Aligned with Axes" - should run and converge quickly
4. Click "Failure: Rotated Problem" - should run and take many iterations

### Step 4: Commit experiment loading

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(ui): add experiment loading for diagonal preconditioner

- Loads hyperparameters from presets
- Automatically runs algorithm when preset selected
- Works with comparison mode presets"
```

---

## Task 10: AlgorithmExplainer Content

**Files:**
- Modify: `src/components/AlgorithmExplainer.tsx`

### Step 1: Add diagonal preconditioner section

Find the section after GD Line Search (search for `<CollapsibleSection` with `title="Gradient Descent (Line Search)"`), add after its closing tag:

```typescript
      {/* Diagonal Preconditioner */}
      <CollapsibleSection
        title="Diagonal Preconditioner"
        defaultExpanded={false}
        storageKey="algorithm-explainer-diagonal-precond"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> First-order method with per-coordinate step sizes
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - D_k \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>D_k</InlineMath> is a diagonal matrix with per-coordinate step sizes
            </p>
          </div>

          <div>
            <p className="font-semibold">Diagonal Preconditioner (using Hessian):</p>
            <BlockMath>
              {String.raw`D = \text{diag}(1/H_{00}, 1/H_{11}, ...)`}
            </BlockMath>
            <p className="text-sm mt-1">
              Extracts diagonal from Hessian H and inverts it
            </p>
          </div>

          <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
            <p className="font-semibold">Connection to Adam/RMSprop/AdaGrad:</p>
            <p className="text-sm mt-1">
              Modern adaptive optimizers use diagonal preconditioning! They estimate
              the diagonal from gradient history rather than computing the Hessian:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li>
                <strong>AdaGrad:</strong> <InlineMath>D = \text{diag}(1/\sqrt{\sum g_i^2})</InlineMath>
              </li>
              <li>
                <strong>RMSprop:</strong> <InlineMath>D = \text{diag}(1/\sqrt{\text{EMA}(g^2)})</InlineMath>
              </li>
              <li>
                <strong>Adam:</strong> RMSprop + momentum
              </li>
            </ul>
            <p className="text-sm mt-2">
              These methods work well because ML feature spaces usually have meaningful
              coordinate axes (pixels, word embeddings, etc.)
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Uses different step sizes for each coordinate
            based on local curvature. Our implementation uses the exact Hessian diagonal
            (pedagogical). In practice, Adam/RMSprop estimate this from gradient history
            without computing Hessians (scalable to millions of parameters).
          </p>

          <p>
            <strong>Convergence rate:</strong> Can achieve quadratic convergence on
            axis-aligned problems! But degrades to linear on rotated problems.
          </p>

          <p>
            <strong>Cost per iteration:</strong>
          </p>
          <ul className="text-sm list-disc ml-5">
            <li><strong>Our implementation:</strong> Gradient + Hessian (same as Newton), no matrix inversion</li>
            <li><strong>Adam/RMSprop:</strong> Just gradient + O(n) accumulator updates (very cheap!)</li>
          </ul>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Perfect on axis-aligned problems (1-2 iterations!)</li>
              <li>Adapts step size to each coordinate independently</li>
              <li>No matrix inversion needed (just divide by diagonal)</li>
              <li>Widely used in practice (Adam, RMSprop, AdaGrad)</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li><strong>Coordinate-dependent</strong> - performance varies with rotation</li>
              <li>Ignores off-diagonal Hessian structure</li>
              <li>Struggles on rotated problems (can be 20× slower!)</li>
              <li>Requires Hessian computation (expensive) - our pedagogical implementation</li>
              <li>Gradient-based variants (Adam/RMSprop) avoid Hessian but are approximate</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Problems where coordinates are meaningful</li>
              <li>Axis-aligned or nearly axis-aligned problems</li>
              <li>Understanding why Adam/RMSprop work (and when they don't)</li>
              <li>Seeing the limitations of diagonal approximations</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded p-3 mt-2 border border-purple-200">
            <p className="text-sm font-semibold mb-1">The Rotation Invariance Story:</p>
            <p className="text-sm">
              This algorithm demonstrates the critical limitation of diagonal methods:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li><strong>θ=0° (aligned):</strong> H is diagonal → D=H⁻¹ exactly → 1-2 iterations!</li>
              <li><strong>θ=45° (rotated):</strong> H has off-diagonals → D misses them → 40+ iterations</li>
              <li><strong>Newton:</strong> Full H⁻¹ works identically at any angle → 2 iterations always</li>
            </ul>
            <p className="text-sm mt-2 font-semibold">
              Only Newton's full matrix achieves rotation invariance!
            </p>
          </div>
        </div>
      </CollapsibleSection>
```

### Step 2: Update comparison table

Find the comparison table (search for `<tbody className="text-gray-700">`), add row after GD Line Search:

```typescript
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium">Diag. Precond</td>
                <td className="py-2">Quadratic*</td>
                <td className="py-2">High (grad + Hessian)</td>
                <td className="py-2">Axis-aligned problems, understanding Adam</td>
              </tr>
```

Add footnote after table:

```typescript
          <p className="text-xs text-gray-500 mt-2">
            *Quadratic convergence only on axis-aligned problems
          </p>
```

### Step 3: Update "Exploring the Algorithms" section

Find "Exploring the Algorithms" section, update both columns to mention diagonal precond:

```typescript
              <div>
                <p className="font-semibold text-gray-900">For learning:</p>
                <ul className="text-gray-700 list-disc ml-5">
                  <li>Start with GD Fixed on Quadratic Bowl</li>
                  <li>Add Line Search to see adaptive step sizes</li>
                  <li>Try Diagonal Precond to see per-coordinate adaptation</li>
                  <li>See Newton's rotation invariance on Rotated Quadratic</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900">The rotation story:</p>
                <ul className="text-gray-700 list-disc ml-5">
                  <li>Diagonal Precond tab: Run at θ=0° then θ=45°</li>
                  <li>Watch convergence degrade dramatically</li>
                  <li>Compare with Newton tab: identical at all angles</li>
                  <li>Understand why Adam works (meaningful axes)</li>
                </ul>
              </div>
```

### Step 4: Test explainer content

Run: `npm run dev`

Test:
1. Click "Algorithms" tab
2. Scroll to find "Diagonal Preconditioner" section
3. Expand it - should see full content
4. Math should render correctly
5. Comparison table should include diagonal precond row

### Step 5: Commit explainer content

```bash
git add src/components/AlgorithmExplainer.tsx
git commit -m "feat(docs): add diagonal preconditioner to algorithm explainer

- Full mathematical description with KaTeX
- Connection to Adam/RMSprop/AdaGrad
- Rotation invariance story
- Updated comparison table
- Exploration guide for rotation experiments"
```

---

## Task 11: Testing and Validation

**Files:**
- Create: `test-diagonal-full-integration.ts`

### Step 1: Create comprehensive integration test

Create `test-diagonal-full-integration.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Comprehensive integration test for diagonal preconditioner
 *
 * Tests:
 * 1. Algorithm implementation correctness
 * 2. Rotation dependence (key pedagogical point)
 * 3. Comparison with other algorithms
 * 4. Experiment presets load correctly
 */

import { createRotatedQuadratic, illConditionedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runDiagonalPreconditioner } from './src/algorithms/diagonal-preconditioner';
import { runNewton } from './src/algorithms/newton';
import { runGradientDescentLineSearch } from './src/algorithms/gradient-descent-linesearch';
import { getExperimentsForAlgorithm } from './src/experiments';

console.log('='.repeat(70));
console.log('DIAGONAL PRECONDITIONER - COMPREHENSIVE INTEGRATION TEST');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

// Test 1: Rotation Dependence
console.log('\n📊 Test 1: Rotation Dependence');
console.log('-'.repeat(70));

const problem0 = createRotatedQuadratic(0);
const problemFuncs0 = problemToProblemFunctions(problem0);
const result0 = runDiagonalPreconditioner(problemFuncs0, {
  maxIter: 10,
  initialPoint: [2, 2]
});

const problem45 = createRotatedQuadratic(45);
const problemFuncs45 = problemToProblemFunctions(problem45);
const result45 = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2]
});

console.log(`θ=0° (aligned):  ${result0.iterations.length} iterations`);
console.log(`θ=45° (rotated): ${result45.iterations.length} iterations`);
console.log(`Ratio: ${(result45.iterations.length / result0.iterations.length).toFixed(1)}×`);

if (result0.iterations.length <= 2 && result45.iterations.length >= 35) {
  console.log('✅ PASS: Rotation dependence verified');
  passed++;
} else {
  console.log('❌ FAIL: Expected 1-2 iters at θ=0°, 35+ at θ=45°');
  failed++;
}

// Test 2: Convergence Quality
console.log('\n📊 Test 2: Convergence Quality');
console.log('-'.repeat(70));

console.log(`θ=0° final loss: ${result0.summary.finalLoss.toExponential(2)}`);
console.log(`θ=0° converged: ${result0.summary.converged}`);
console.log(`θ=45° final loss: ${result45.summary.finalLoss.toExponential(2)}`);
console.log(`θ=45° converged: ${result45.summary.converged}`);

if (result0.summary.converged && result45.summary.converged) {
  console.log('✅ PASS: Both configurations converged');
  passed++;
} else {
  console.log('❌ FAIL: Expected both to converge');
  failed++;
}

// Test 3: Comparison with Newton (Rotation Invariance)
console.log('\n📊 Test 3: Comparison with Newton');
console.log('-'.repeat(70));

const newton0 = runNewton(problemFuncs0, {
  maxIter: 20,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [2, 2]
});

const newton45 = runNewton(problemFuncs45, {
  maxIter: 20,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [2, 2]
});

console.log(`Newton at θ=0°: ${newton0.iterations.length} iterations`);
console.log(`Newton at θ=45°: ${newton45.iterations.length} iterations`);

if (newton0.iterations.length === newton45.iterations.length && newton0.iterations.length === 2) {
  console.log('✅ PASS: Newton is rotation-invariant (both 2 iters)');
  passed++;
} else {
  console.log('❌ FAIL: Expected Newton to take 2 iterations at both angles');
  failed++;
}

// Test 4: Superior to GD on Aligned Problems
console.log('\n📊 Test 4: Performance vs GD on Aligned Problem');
console.log('-'.repeat(70));

const illCondProblem = problemToProblemFunctions(illConditionedQuadratic);
const diagIllCond = runDiagonalPreconditioner(illCondProblem, {
  maxIter: 10,
  initialPoint: [0.3, 2.5]
});

const gdIllCond = runGradientDescentLineSearch(illCondProblem, {
  maxIter: 100,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [0.3, 2.5]
});

console.log(`Diagonal Precond: ${diagIllCond.iterations.length} iterations`);
console.log(`GD + Line Search: ${gdIllCond.iterations.length} iterations`);
console.log(`Speedup: ${(gdIllCond.iterations.length / diagIllCond.iterations.length).toFixed(1)}×`);

if (diagIllCond.iterations.length < 5 && gdIllCond.iterations.length > 20) {
  console.log('✅ PASS: Diagonal precond vastly outperforms GD on aligned problem');
  passed++;
} else {
  console.log('❌ FAIL: Expected diagonal precond to be much faster');
  failed++;
}

// Test 5: Experiment Presets
console.log('\n📊 Test 5: Experiment Presets');
console.log('-'.repeat(70));

const experiments = getExperimentsForAlgorithm('diagonal-precond');
console.log(`Found ${experiments.length} experiment presets`);

experiments.forEach(exp => {
  console.log(`  - ${exp.id}`);
});

if (experiments.length === 5) {
  console.log('✅ PASS: All 5 experiment presets loaded');
  passed++;
} else {
  console.log('❌ FAIL: Expected 5 experiment presets');
  failed++;
}

// Test 6: Line Search Option
console.log('\n📊 Test 6: Line Search Option');
console.log('-'.repeat(70));

const withLS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: true
});

const withoutLS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: false
});

console.log(`With line search: ${withLS.iterations.length} iterations`);
console.log(`Without line search: ${withoutLS.iterations.length} iterations`);
console.log(`Line search trials in iter 0: ${withLS.iterations[0].lineSearchTrials !== undefined}`);

if (withLS.iterations[0].alpha !== undefined && withLS.iterations[0].lineSearchTrials !== undefined) {
  console.log('✅ PASS: Line search option works correctly');
  passed++;
} else {
  console.log('❌ FAIL: Line search data not present');
  failed++;
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passed}/6`);
console.log(`❌ Failed: ${failed}/6`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
}
```

### Step 2: Run integration tests

Run: `npx tsx test-diagonal-full-integration.ts`

Expected:
```
✅ Passed: 6/6
🎉 ALL TESTS PASSED!
```

### Step 3: Manual UI testing checklist

Open browser at `http://localhost:5173`:

- [ ] Diagonal Preconditioner tab appears between GD-linesearch and Newton
- [ ] Tab has teal color scheme
- [ ] Click "Run Diagonal Preconditioner" on quadratic (θ=0°) - converges in 1-2 iters
- [ ] Adjust rotation angle to 45° - converges in 40+ iters
- [ ] Load "Success: Aligned with Axes" preset - runs automatically, converges quickly
- [ ] Load "Failure: Rotated Problem" preset - runs automatically, takes many iters
- [ ] Load "Compare: The Rotation Invariance Story" preset - shows side-by-side
- [ ] Toggle line search on - algorithm still works
- [ ] Adjust epsilon slider - algorithm still works
- [ ] Previous/Next iteration buttons work
- [ ] Metrics show Hessian diagonal and preconditioner values
- [ ] Algorithms tab shows Diagonal Preconditioner section in explainer
- [ ] Comparison table includes diagonal precond row

### Step 4: Commit integration tests

```bash
git add test-diagonal-full-integration.ts
git commit -m "test: add comprehensive integration tests for diagonal preconditioner

- Rotation dependence verification
- Comparison with Newton and GD
- Experiment presets loading
- Line search option
- All 6 tests passing"
```

---

## Task 12: Documentation and Cleanup

**Files:**
- Modify: `README.md` (update algorithm list)
- Create: `docs/diagonal-preconditioner-guide.md`
- Delete: `test-*.ts` (temporary test files)

### Step 1: Update README

Modify `README.md`, find the algorithms section, add diagonal preconditioner:

```markdown
## Algorithms

The visualizer implements 5 optimization algorithms:

1. **Gradient Descent (Fixed Step)** - Scalar step size α
2. **Gradient Descent (Line Search)** - Adaptive scalar step size
3. **Diagonal Preconditioner** - Per-coordinate step sizes (Hessian diagonal)
4. **Newton's Method** - Full Hessian matrix H⁻¹
5. **L-BFGS** - Limited-memory quasi-Newton approximation

### Key Pedagogical Story: Step Size Sophistication

The progression shows increasing sophistication in adapting to problem geometry:
- **Scalar**: Same step everywhere
- **Adaptive Scalar**: Adapts per iteration
- **Diagonal**: Per-coordinate step sizes (what Adam does!)
- **Full Matrix**: Rotation-invariant (Newton)
- **Approximate Matrix**: Efficient approximation (L-BFGS)

**Rotation Invariance Demo:** The diagonal preconditioner demonstrates coordinate dependence perfectly - it takes 1-2 iterations on axis-aligned problems but 40+ iterations on rotated problems. Newton takes 2 iterations regardless of rotation.
```

### Step 2: Create diagonal preconditioner guide

Create `docs/diagonal-preconditioner-guide.md`:

```markdown
# Diagonal Preconditioner Guide

## Overview

The diagonal preconditioner uses per-coordinate step sizes based on the Hessian diagonal:

```
D = diag(1/H₀₀, 1/H₁₁, ...)
w_new = w - D * ∇f(w)
```

## Key Pedagogical Insights

### 1. Coordinate Dependence

**The Main Story:** Diagonal preconditioning is coordinate-dependent.

- **θ=0° (aligned):** H is diagonal → D = H⁻¹ exactly → 1-2 iterations
- **θ=45° (rotated):** H has off-diagonals → D misses them → 40+ iterations
- **Newton (any angle):** Full H⁻¹ → 2 iterations

This demonstrates why Newton's full matrix approach is necessary.

### 2. Connection to Adam/RMSprop

Modern optimizers use diagonal preconditioning estimated from gradient history:

- **AdaGrad:** v = Σg²
- **RMSprop:** v = βv + (1-β)g²
- **Adam:** RMSprop + momentum

Our Hessian-based implementation shows the mathematical foundation, while these gradient-based variants avoid expensive Hessian computation.

### 3. When Diagonal Methods Excel

Diagonal preconditioning works exceptionally well when:
- Problem is axis-aligned (or nearly so)
- Coordinates have meaningful semantic interpretation
- Features have different scales (pixels vs probabilities)

This explains Adam's success in deep learning!

## Experiments

### Success: Aligned with Axes
- Problem: Ill-conditioned quadratic (θ=0°)
- Result: 1-2 iterations
- Lesson: Perfect when H is diagonal

### Failure: Rotated Problem
- Problem: Quadratic rotated 45°
- Result: 40+ iterations
- Lesson: Struggles with off-diagonal structure

### Comparison: Diagonal vs Newton
- Shows rotation invariance difference
- Diagonal: Angle-dependent
- Newton: Angle-invariant

## Implementation Details

**Algorithm:** `src/algorithms/diagonal-preconditioner.ts`

**Key Features:**
- Optional line search for robustness
- Numerical stability via epsilon parameter
- Works with 2D and 3D problems
- Returns full convergence summary

**Hyperparameters:**
- `useLineSearch`: Enable Armijo backtracking
- `c1`: Armijo parameter (if line search enabled)
- `epsilon`: Numerical stability constant (default: 1e-8)

## Future Extensions (Phase 2)

Potential additions:
- Gradient-based mode (AdaGrad/RMSprop/Adam)
- Comparison experiments with different β values
- Visualization of gradient accumulation

Phase 1 focuses on Hessian-based for pedagogical clarity.
```

### Step 3: Clean up test files

Remove temporary test files:

```bash
rm test-diagonal-preconditioner-impl.ts
rm test-diagonal-experiments.ts
```

Keep `test-diagonal-full-integration.ts` for regression testing.

### Step 4: Commit documentation

```bash
git add README.md docs/diagonal-preconditioner-guide.md
git rm test-diagonal-preconditioner-impl.ts test-diagonal-experiments.ts
git commit -m "docs: add diagonal preconditioner documentation

- Update README with 5-algorithm progression
- Create comprehensive guide
- Remove temporary test files
- Keep integration tests for CI"
```

---

## Task 13: Final Verification and Polish

### Step 1: Build production bundle

Run: `npm run build`

Expected: No errors, successful build

### Step 2: Run all tests

Run: `npx tsx test-diagonal-full-integration.ts`

Expected: All 6 tests pass

### Step 3: Visual polish checklist

Open `http://localhost:5173` and verify:

- [ ] All 5 algorithm tabs visible and properly ordered
- [ ] Diagonal Preconditioner tab has teal theme
- [ ] Smooth tab transitions
- [ ] All controls work smoothly
- [ ] Metrics display formatting is clean
- [ ] Math renders correctly in explainer
- [ ] No console errors or warnings

### Step 4: Cross-browser testing

Test in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)

### Step 5: Final commit

```bash
git add -A
git commit -m "chore: final polish and verification

- Production build successful
- All integration tests passing
- Cross-browser compatibility verified
- Ready for deployment"
```

---

## Completion Checklist

### Implementation Complete When:

- [x] Algorithm implementation (`diagonal-preconditioner.ts`)
- [x] Experiment presets (5 presets)
- [x] Type system updates
- [x] UI state management
- [x] Run function callback
- [x] Tab UI with controls
- [x] Metrics display
- [x] Experiment loading
- [x] AlgorithmExplainer content
- [x] Comparison table update
- [x] Integration tests (6 tests passing)
- [x] Documentation
- [x] Production build successful

### Key Success Metrics:

1. **Rotation Dependence:** θ=0°: 1-2 iters, θ=45°: 40+ iters ✅
2. **Newton Comparison:** Newton: 2 iters at any angle ✅
3. **vs GD Performance:** Diagonal ~15× faster on aligned problems ✅
4. **All Experiments Load:** 5 presets working ✅
5. **No Regressions:** Existing algorithms still work ✅

---

## Plan complete!

**Next Steps:**

This plan is ready for execution. Two options:

**Option 1: Subagent-Driven Development (Recommended)**
- Use `superpowers:subagent-driven-development` skill
- Fresh subagent per task
- Code review between tasks
- Fast iteration with quality gates

**Option 2: Parallel Session**
- Open new session with `superpowers:executing-plans`
- Batch execution with checkpoints

**Estimated Time:** 3-4 hours for full implementation

**Success Criteria:** All 13 tasks completed, 6 integration tests passing, production build successful
