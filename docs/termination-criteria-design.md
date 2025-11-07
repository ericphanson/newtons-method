# Enhanced Termination Criteria Design

## Current State Analysis

### Current Termination Criteria (Newton's Method)
1. **Gradient norm convergence**: `||grad|| < tolerance` (default: 1e-5)
2. **Maximum iterations**: Loop limit
3. **Post-hoc divergence detection**: Check for NaN/Inf after all iterations complete

### Problems Identified
1. **No stalling detection**: Algorithm can make minimal progress for many iterations
2. **Post-hoc divergence only**: NaN/Inf not detected during iteration
3. **Limited configurability**: Only `tolerance` parameter exposed
4. **No termination reason in UI**: convergenceCriterion computed but not displayed
5. **Ambiguous convergence**: Can't distinguish "converged optimally" from "stalled at tolerance"

### Current Usage Locations
- [newton.ts:240-243](src/algorithms/newton.ts#L240-L243) - Gradient norm check
- [newton.ts:246-272](src/algorithms/newton.ts#L246-L272) - Summary computation
- [basinComputation.ts:55-56](src/utils/basinComputation.ts#L55-L56) - Extract converged/diverged
- [basinColorEncoding.ts:32-35](src/utils/basinColorEncoding.ts#L32-L35) - Color by convergence
- [BasinPicker.tsx:218-219](src/components/BasinPicker.tsx#L218-L219) - Display stats

## Scipy-Inspired Design

### Termination Criteria (from scipy research)

| Criterion | Parameter | Default | Description | Scipy Method |
|-----------|-----------|---------|-------------|--------------|
| Gradient norm | `gtol` | 1e-5 | `||grad|| < gtol` | BFGS, trust-ncg, CG |
| Function change | `ftol` | 1e-9 | `|f(x_k) - f(x_{k-1})| < ftol` | Multiple |
| Step size | `xtol` | 1e-9 | `||x_k - x_{k-1}|| < xtol` | Newton-CG, BFGS |
| Max iterations | `maxiter` | 100 | Iteration limit | All |
| Divergence | (automatic) | - | NaN/Inf detection | All |

## Proposed Implementation

### 1. Enhanced Type Definitions

```typescript
// src/algorithms/types.ts

export type ConvergenceCriterion =
  | 'gradient'      // ||grad|| < gtol (optimal convergence)
  | 'ftol'          // |f(x_k) - f(x_{k-1})| < ftol (stalled on function value)
  | 'xtol'          // ||x_k - x_{k-1}|| < xtol (stalled on step size)
  | 'maxiter'       // Hit maximum iterations (not converged)
  | 'diverged';     // NaN/Inf detected (failure)

export interface TerminationThresholds {
  gtol?: number;      // Gradient norm tolerance (default: 1e-5)
  ftol?: number;      // Function value change tolerance (default: 1e-9)
  xtol?: number;      // Step size tolerance (default: 1e-9)
}

export interface AlgorithmOptions {
  maxIter: number;
  initialPoint?: number[];
  tolerance?: number;              // DEPRECATED: Use gtol instead
  termination?: TerminationThresholds;  // NEW: Full control
}

export interface AlgorithmSummary {
  converged: boolean;               // True if gradient/ftol/xtol triggered
  diverged: boolean;                // True if NaN/Inf detected
  stalled: boolean;                 // True if ftol or xtol triggered (suboptimal)
  finalLocation: number[];
  finalLoss: number;
  finalGradNorm: number;
  finalStepSize?: number;           // NEW: ||x_k - x_{k-1}||
  finalFunctionChange?: number;     // NEW: |f(x_k) - f(x_{k-1})|
  iterationCount: number;
  convergenceCriterion: ConvergenceCriterion;
  terminationMessage: string;       // NEW: Human-readable explanation
}
```

### 2. Termination Messages

```typescript
function getTerminationMessage(
  criterion: ConvergenceCriterion,
  values: {
    gradNorm: number,
    gtol: number,
    stepSize?: number,
    xtol?: number,
    funcChange?: number,
    ftol?: number,
    iters: number,
    maxIter: number
  }
): string {
  switch (criterion) {
    case 'gradient':
      return `Converged: gradient norm ${values.gradNorm.toExponential(2)} < ${values.gtol.toExponential(2)}`;
    case 'ftol':
      return `Stalled: function change ${values.funcChange!.toExponential(2)} < ${values.ftol!.toExponential(2)}`;
    case 'xtol':
      return `Stalled: step size ${values.stepSize!.toExponential(2)} < ${values.xtol!.toExponential(2)}`;
    case 'maxiter':
      return `Not converged: maximum iterations (${values.maxIter}) reached`;
    case 'diverged':
      return `Diverged: NaN or Inf detected`;
  }
}
```

### 3. Enhanced Iteration Loop (Newton's Method)

```typescript
// src/algorithms/newton.ts

export const runNewton = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { c1?: number; lambda?: number; hessianDamping?: number; lineSearch?: 'armijo' | 'none' }
): AlgorithmResult<NewtonIteration> => {
  // Extract termination thresholds (backward compatible)
  const gtol = options.termination?.gtol ?? options.tolerance ?? 1e-5;
  const ftol = options.termination?.ftol ?? 1e-9;
  const xtol = options.termination?.xtol ?? 1e-9;
  const maxIter = options.maxIter;

  let previousLoss: number | null = null;
  let previousW: number[] | null = null;
  let terminationReason: ConvergenceCriterion | null = null;

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // EARLY DIVERGENCE CHECK (NEW)
    if (!isFinite(loss) || !isFinite(gradNorm)) {
      terminationReason = 'diverged';
      // Store iteration data and break
      break;
    }

    // Check gradient norm convergence (EXISTING - enhanced)
    if (gradNorm < gtol) {
      terminationReason = 'gradient';
      // Store iteration data and break
      break;
    }

    // Check function value stalling (NEW)
    if (previousLoss !== null && ftol > 0) {
      const funcChange = Math.abs(loss - previousLoss);
      if (funcChange < ftol) {
        terminationReason = 'ftol';
        // Store iteration data and break
        break;
      }
    }

    // ... compute Newton direction, line search, etc ...

    const wNew = add(w, scale(direction, acceptedAlpha));

    // Check step size stalling (NEW)
    if (previousW !== null && xtol > 0) {
      const stepSize = norm(subtract(wNew, w));
      if (stepSize < xtol) {
        terminationReason = 'xtol';
        // Store iteration data and break
        break;
      }
    }

    // Store iteration data
    iterations.push({ ... });

    // Update for next iteration
    previousLoss = loss;
    previousW = [...w];
    w = wNew;
  }

  // If loop completed without early termination
  if (terminationReason === null) {
    terminationReason = 'maxiter';
  }

  // Compute enhanced summary
  const summary: AlgorithmSummary = {
    converged: ['gradient', 'ftol', 'xtol'].includes(terminationReason),
    diverged: terminationReason === 'diverged',
    stalled: ['ftol', 'xtol'].includes(terminationReason),
    finalLocation,
    finalLoss,
    finalGradNorm,
    finalStepSize: previousW ? norm(subtract(finalLocation, previousW)) : undefined,
    finalFunctionChange: previousLoss !== null ? Math.abs(finalLoss - previousLoss) : undefined,
    iterationCount: iterations.length,
    convergenceCriterion: terminationReason,
    terminationMessage: getTerminationMessage(terminationReason, {
      gradNorm: finalGradNorm,
      gtol,
      stepSize: previousW ? norm(subtract(finalLocation, previousW)) : undefined,
      xtol,
      funcChange: previousLoss !== null ? Math.abs(finalLoss - previousLoss) : undefined,
      ftol,
      iters: iterations.length,
      maxIter
    })
  };

  return { iterations, summary };
};
```

### 4. UI Integration

#### A. Main Iteration Metrics Display

Add convergence status indicator to [IterationMetrics.tsx](src/components/IterationMetrics.tsx):

```typescript
// New prop
interface IterationMetricsProps {
  // ... existing props ...
  summary?: AlgorithmSummary;  // NEW: Show when available
}

// Display in UI (add after iteration header)
{summary && (
  <div className="p-2 rounded border border-gray-300 bg-gray-50">
    <div className="flex items-center gap-2">
      {summary.converged && !summary.stalled && (
        <span className="text-green-600">✓ Converged</span>
      )}
      {summary.stalled && (
        <span className="text-yellow-600">⚠ Stalled</span>
      )}
      {summary.diverged && (
        <span className="text-red-600">✗ Diverged</span>
      )}
      {summary.convergenceCriterion === 'maxiter' && (
        <span className="text-gray-600">⋯ Max Iterations</span>
      )}
    </div>
    <div className="text-xs text-gray-600 mt-1">
      {summary.terminationMessage}
    </div>
  </div>
)}
```

#### B. Basin Picker Stats

Update [BasinPicker.tsx:218-219](src/components/BasinPicker.tsx#L218-L219) to distinguish stalled from converged:

```typescript
let converged = 0, stalled = 0, diverged = 0, notConverged = 0;
grid.flat().forEach(point => {
  if (point.diverged) diverged++;
  else if (point.stalled) stalled++;  // NEW
  else if (point.converged) converged++;
  else notConverged++;
});

// Display:
// ✓ Converged: {converged}
// ⚠ Stalled: {stalled}
// ✗ Diverged: {diverged}
// ⋯ Not Converged: {notConverged}
```

#### C. Basin Color Encoding

Update [basinColorEncoding.ts](src/utils/basinColorEncoding.ts) to use 4 lightness levels:

```typescript
// Lightness encoding:
// 10: Diverged (black)
// 20: Not converged - maxiter (very dark gray)
// 30: Stalled - ftol/xtol (dark gray)
// 40-80: Converged - gradient (colored by basin, brightness by speed)
```

### 5. Configuration UI

Add termination criteria controls to [AlgorithmConfiguration.tsx](src/components/AlgorithmConfiguration.tsx):

```typescript
<CollapsibleSection title="Termination Criteria" defaultOpen={false}>
  <div className="space-y-2">
    <div>
      <label>Gradient Tolerance (gtol)</label>
      <input type="number" step="1e-7" value={gtol} onChange={...} />
      <div className="text-xs text-gray-500">
        Converges when ||grad|| &lt; gtol
      </div>
    </div>

    <div>
      <label>Function Tolerance (ftol)</label>
      <input type="number" step="1e-10" value={ftol} onChange={...} />
      <div className="text-xs text-gray-500">
        Stalls when |f(x_k) - f(x_{k-1})| &lt; ftol
      </div>
    </div>

    <div>
      <label>Step Size Tolerance (xtol)</label>
      <input type="number" step="1e-10" value={xtol} onChange={...} />
      <div className="text-xs text-gray-500">
        Stalls when ||x_k - x_{k-1}|| &lt; xtol
      </div>
    </div>
  </div>
</CollapsibleSection>
```

## Implementation Plan

### Phase 1: Core Algorithm Changes
1. ✅ Update [types.ts](src/algorithms/types.ts#L39-L47) - Add new fields to AlgorithmSummary and TerminationThresholds
2. ✅ Implement termination message function
3. ✅ Update [newton.ts](src/algorithms/newton.ts#L148-L275) - Enhanced iteration loop
4. ✅ Update [gradient-descent.ts](src/algorithms/gradient-descent.ts)
5. ✅ Update [gradient-descent-linesearch.ts](src/algorithms/gradient-descent-linesearch.ts)
6. ✅ Update [lbfgs.ts](src/algorithms/lbfgs.ts)

### Phase 2: Basin Plot Integration
1. ✅ Update [BasinPoint type](src/types/basin.ts) - Add stalled field
2. ✅ Update [basinComputation.ts](src/utils/basinComputation.ts#L55-L56) - Extract stalled from summary
3. ✅ Update [basinColorEncoding.ts](src/utils/basinColorEncoding.ts) - 4-level lightness
4. ✅ Update [BasinPicker.tsx](src/components/BasinPicker.tsx) - Display stalled count

### Phase 3: UI Display
1. ✅ Update [UnifiedVisualizer.tsx](src/UnifiedVisualizer.tsx) - Store and pass summary to IterationMetrics
2. ✅ Update [IterationMetrics.tsx](src/components/IterationMetrics.tsx) - Display convergence status
3. ✅ Update [AlgorithmConfiguration.tsx](src/components/AlgorithmConfiguration.tsx) - Add termination controls
4. ✅ Add state management for gtol/ftol/xtol in UnifiedVisualizer

### Phase 4: Testing
1. ✅ Test on stalling problems (Himmelblau, Rosenbrock with poor conditioning)
2. ✅ Verify basin plots correctly distinguish stalled vs converged
3. ✅ Verify UI displays termination reason
4. ✅ Test backward compatibility (tolerance parameter still works)

## Backward Compatibility

- Keep `tolerance` parameter working (maps to `gtol`)
- Default values match current behavior
- Existing code continues to work unchanged
- New features opt-in via `termination` parameter

## Testing Strategy

### Test Cases

1. **Gradient convergence**: Simple quadratic → should hit 'gradient'
2. **Function stalling**: Ill-conditioned Rosenbrock → should hit 'ftol'
3. **Step stalling**: Himmelblau with aggressive damping → should hit 'xtol'
4. **Max iterations**: Complex problem with tight tolerances → should hit 'maxiter'
5. **Divergence**: Problem with unbounded direction → should hit 'diverged' early

### Verification

- Compare basin plots before/after (should see more stalled points vs not-converged)
- Verify UI shows termination messages
- Check console logs don't show excessive iterations on stalling problems
