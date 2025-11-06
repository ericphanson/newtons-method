# Recent Improvements Summary

## Problem-Specific Defaults (Latest)

### What Changed
Added intelligent problem-specific default hyperparameters that auto-adjust when switching problems in the UI.

### Key Results
```
Before:  0 converged, 7 incomplete, 1 DIVERGED (NaN), 12 errors
After:   10 converged, 6 incomplete, 0 diverged, 0 errors ✅
```

### Default Values by Problem

**Quadratic Bowl** (well-conditioned)
- `alpha: 0.1` - Standard works great
- `maxIter: 200`
- GD-fixed: ✅ Converges in 136 iterations

**Ill-Conditioned Quadratic** (κ=100)
- `alpha: 0.01` - Small step to avoid zigzag
- `maxIter: 300` - Needs extra iterations
- GD-fixed: Still slow (expected), no divergence ✅
- Newton/L-BFGS: Fast convergence ✅

**Rosenbrock** (steep banana valley)
- `alpha: 0.001` - Very small due to gradients with coefficients 200, 400
- `maxIter: 300`
- GD-fixed: Slow but stable (no NaN!) ✅
- Line search algorithms: Fast convergence ✅

**Saddle Point** (unbounded)
- `alpha: 0.1`
- `maxIter: 100`
- GD/L-BFGS: Goes to -∞ (expected, educational) ✅
- Newton: Finds saddle at (0,0) ✅

### Benefits

**1. No More Crashes**
- Original issue: Switching to Rosenbrock with α=0.1 → NaN → crash
- Now: Auto-adjusts to α=0.001 → smooth experience

**2. Educational Value Preserved**
- Users can still set bad hyperparameters to see divergence
- Defaults show "the right way" automatically
- Tips explain problem characteristics

**3. Better UX**
- Blue info box with problem-specific tips
- "Defaults adjusted automatically" message
- Users understand why certain values work

## All Fixes Applied

### 1. Rosenbrock NaN Crash ✅
- **Root Cause**: Algorithm divergence → NaN in bounds → d3-contour crash
- **Fix**: Defensive NaN checks in bounds calculations and contour drawing
- **Result**: Graceful fallback with console warnings

### 2. Newton's Method Crash ✅
- **Root Cause**: Hardcoded 3×3 Hessian visualization, 2D problems use 2×2
- **Fix**: Dynamic matrix dimensions
- **Result**: Works with both 2D and 3D problems

### 3. Contour Density ✅
- **Issue**: Too few contours near minimum
- **Fix**: Exponential spacing (t^2.5) instead of linear
- **Result**: Better detail in Rosenbrock valley

### 4. L-BFGS "Only 1 Iteration" ✅
- **Root Cause**: Single-point bounds causing zero-width ranges
- **Fix**: Handle single-point case with reasonable window
- **Result**: Visualization works (L-BFGS converges fast!)

### 5. Problem-Specific Defaults ✅
- **Issue**: Same defaults for all problems caused divergence
- **Fix**: Smart defaults per problem with auto-adjustment
- **Result**: Zero divergence, optimal UX

## Testing Infrastructure

Created CLI test harness for systematic testing:

```bash
# Test specific combination
npm run test-combo -- --problem rosenbrock --algorithm lbfgs

# Test all 16 combinations
npm run test-all
```

**Benefits:**
- Programmatic testing without UI clicks
- Verify fixes work across all combinations
- Find good hyperparameters quickly
- CI/CD integration ready

## Before/After Comparison

### Before
- ❌ Crashes on Rosenbrock switch
- ❌ Newton crashes on 2D problems
- ❌ Poor contour detail
- ❌ L-BFGS visualization broken
- ❌ Divergence with wrong defaults

### After
- ✅ No crashes (defensive checks everywhere)
- ✅ Works with all problem/algorithm combos
- ✅ Rich contour detail near minima
- ✅ All visualizations working
- ✅ Smart defaults prevent divergence
- ✅ CLI testing infrastructure
- ✅ Educational tips for users

## Architecture Decisions

**Auto-run Behavior Kept**
- Algorithms run automatically on problem switch
- Users get immediate feedback
- Defaults ensure it works smoothly
- Trade-off: Higher compute on every switch

**Saddle Problem Kept**
- Goes to -∞ (unbounded below)
- Educational value: shows what happens when problem is ill-posed
- Newton finds saddle point (demonstrates second-order info)

**Separate Defaults for UI and Tests**
- Both use `getProblemDefaults()` - single source of truth
- Tests can override for exploration
- Consistency between UI and CLI

## Next Steps (Optional)

Future improvements if needed:
1. Add "Run" buttons for manual execution (avoid auto-run compute cost)
2. Save/load custom hyperparameter profiles
3. Add more benchmark problems (Beale, Himmelblau, etc.)
4. Export results to CSV/JSON for analysis
5. Comparison mode between algorithms on same problem
