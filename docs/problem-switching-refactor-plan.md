# Problem Switching Refactor

## Current State

Hardcoded logistic regression in:
- [ ] `src/shared-utils.ts` line 60-88: `computeLossAndGradient()` - computes logistic loss and gradient
- [ ] `src/algorithms/newton.ts` line 35-66: `computeHessian()` - computes logistic Hessian
- [ ] `src/algorithms/gradient-descent.ts` line 42,50: Uses `computeLossAndGradient()` with DataPoint[]
- [ ] `src/algorithms/gradient-descent-linesearch.ts`: Uses `computeLossAndGradient()` with DataPoint[]
- [ ] `src/algorithms/lbfgs.ts`: Uses `computeLossAndGradient()` with DataPoint[]
- [ ] `src/algorithms/newton.ts` line 146,148,167,173: Uses `computeLossAndGradient()` and `computeHessian()` with DataPoint[]
- [ ] All algorithms use 3D weights [w0, w1, w2] for logistic regression (including bias term)
- [ ] Problem registry exists (`src/problems/index.ts`) with 2D weight problems [w0, w1]
- [ ] DataPoint interface exists in both `src/shared-utils.ts` (x1, x2, y) and `src/types/experiments.ts` (x, y, label) - CONFLICT!

## Key Architecture Issues

### Weight Dimensionality Conflict
- **Logistic regression**: Uses 3D weights [w0, w1, w2] (includes bias term w2)
- **Problem registry**: Uses 2D weights [w0, w1] (no bias term)
- **Impact**: Cannot directly switch between logistic regression and problem registry functions

### DataPoint Interface Conflict
- **shared-utils.ts**: `interface DataPoint { x1: number; x2: number; y: number }`
- **types/experiments.ts**: `interface DataPoint { x: number; y: number; label: number }`
- **Impact**: Type incompatibility between modules

### Algorithm Module Dependencies
All algorithm modules (GD, GD-LS, Newton, L-BFGS) currently:
1. Import from `shared-utils.ts` (logistic-specific)
2. Accept `DataPoint[]` as required parameter
3. Use `computeLossAndGradient()` which is logistic-specific
4. Return 3D weights

## Target State

Generic problem interface:
- [ ] Unify DataPoint interface (use types/experiments.ts version)
- [ ] Extract logistic regression to separate helper module matching ProblemDefinition interface
- [ ] Add `getCurrentProblem()` helper in UnifiedVisualizer that returns ProblemDefinition
- [ ] Convert all algorithms to accept generic objective/gradient/hessian functions instead of DataPoint[]
- [ ] Support both 2D weights (problem registry) and 3D weights (logistic regression with bias)
- [ ] Dynamic domain bounds based on selected problem
- [ ] Conditional dataset visualization (only for logistic regression)

## Refactoring Strategy

### Phase 1: Extract Logistic Regression (Task 18b)
1. Create `src/utils/logisticRegression.ts` with:
   - `logisticObjective(w: number[], dataPoints: DataPoint[], lambda: number): number`
   - `logisticGradient(w: number[], dataPoints: DataPoint[], lambda: number): number[]`
   - `logisticHessian(w: number[], dataPoints: DataPoint[], lambda: number): number[][]`
2. Use DataPoint from `types/experiments.ts` (standardize on x, y, label)
3. Keep 3D weight support [w0, w1, w2] for logistic regression

### Phase 2: Add Problem Resolution (Task 18c)
1. Create `getCurrentProblem()` in UnifiedVisualizer that:
   - Returns logistic regression as ProblemDefinition when `currentProblem === 'logistic-regression'`
   - Returns problem from registry otherwise
2. Add `requiresDataset: boolean` flag to distinguish problem types

### Phase 3: Update Algorithm Modules (Task 18d)
**Challenge**: Algorithms are separate modules that need to support both:
- Logistic regression (3D weights, dataset-dependent)
- Problem registry (2D weights, dataset-independent)

**Solution**: Instead of changing algorithm modules, change how UnifiedVisualizer calls them:
1. Keep algorithms as-is (they work fine for logistic regression)
2. For problem registry problems, create thin adapter layer in UnifiedVisualizer
3. OR: Refactor algorithms to accept objective/gradient/hessian functions as parameters

### Phase 4: Wire Problem Switching (Task 18e)
1. Update problem switcher dropdown onChange
2. Update loadExperiment to switch problems
3. Reset state when problem changes

### Phase 5: Dynamic Visualization (Task 18f)
1. Add visualizationBounds state
2. Update bounds when problem changes
3. Use dynamic bounds in canvas rendering

### Phase 6: Dataset Handling (Task 18g)
1. Conditionally render dataset points
2. Show appropriate UI hints

## Testing Plan

- [ ] Test logistic regression (current baseline)
- [ ] Test quadratic bowl - verify 2D weights work
- [ ] Test ill-conditioned quadratic - verify domain bounds
- [ ] Test Rosenbrock - verify non-convex behavior
- [ ] Test saddle point - verify saddle behavior
- [ ] Verify each problem works with all 4 algorithms (GD, GD-LS, Newton, L-BFGS)

## Known Issues to Resolve

1. **DataPoint interface conflict**: Need to standardize on one definition
2. **Weight dimensionality**: 2D vs 3D - need adapter or dual support
3. **Algorithm module coupling**: Currently tightly coupled to logistic regression
4. **Shared-utils.ts**: Currently logistic-specific, but imported by all algorithms
