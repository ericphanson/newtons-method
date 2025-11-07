# MaxIter Audit Summary

## Overview

Audited all experiment presets and standardized `maxIter` to **200** across all experiments for consistency.

## Rationale

**Why 200?**
- Consistent testing across all algorithms
- Allows students to see full convergence behavior (not artificially cut off)
- Shows when algorithms struggle (e.g., perceptron + Newton never converges even with 200 iterations)
- Prevents confusion from inconsistent iteration limits

## Changes Made

### Newton Experiments ([src/experiments/newton-presets.ts](src/experiments/newton-presets.ts))

| Experiment ID | Before | After | Status |
|---------------|--------|-------|--------|
| newton-compare | 20 | 200 | ✅ Updated |
| newton-success-quadratic | 10 | 200 | ✅ Updated |
| newton-failure-saddle | 20 | 200 | ✅ Updated |
| newton-fixed-linesearch | 50 | 200 | ✅ Updated |
| newton-compare-ill-conditioned | 20 | 200 | ✅ Updated |
| newton-rotated-quadratic | 10 | 200 | ✅ Updated |
| newton-perceptron-failure | 200 | 200 | ✅ Already correct |
| newton-perceptron-damping-fix | 200 | 200 | ✅ Already correct |
| newton-perceptron-hessian-damping | 200 | 200 | ✅ Already correct |

**Total: 9 experiments, 6 updated**

---

### GD Fixed-Step Experiments ([src/experiments/gd-fixed-presets.ts](src/experiments/gd-fixed-presets.ts))

| Experiment ID | Before | After | Status |
|---------------|--------|-------|--------|
| gd-fixed-success | 100 | 200 | ✅ Updated |
| gd-fixed-diverge | 50 | 200 | ✅ Updated |
| gd-fixed-too-small | 200 | 200 | ✅ Already correct |
| gd-fixed-ill-conditioned | 100 | 200 | ✅ Updated |

**Total: 4 experiments, 3 updated**

---

### GD Line Search Experiments ([src/experiments/gd-linesearch-presets.ts](src/experiments/gd-linesearch-presets.ts))

| Experiment ID | Before | After | Status |
|---------------|--------|-------|--------|
| gd-ls-compare | 50 | 200 | ✅ Updated |
| gd-ls-success | 50 | 200 | ✅ Updated |
| gd-ls-c1-too-small | 100 | 200 | ✅ Updated |
| gd-ls-c1-too-large | 100 | 200 | ✅ Updated |
| gd-ls-varying-curvature | 200 | 200 | ✅ Already correct |

**Total: 5 experiments, 4 updated**

---

### L-BFGS Experiments ([src/experiments/lbfgs-presets.ts](src/experiments/lbfgs-presets.ts))

| Experiment ID | Before | After | Status |
|---------------|--------|-------|--------|
| lbfgs-compare | 20 | 200 | ✅ Updated |
| lbfgs-success-quadratic | 20 | 200 | ✅ Updated |
| lbfgs-memory-comparison | 30 | 200 | ✅ Updated |
| lbfgs-rosenbrock | 100 | 200 | ✅ Updated |

**Total: 4 experiments, 4 updated**

---

## Summary

**Total experiments: 22**
**Already correct: 5** (23%)
**Updated: 17** (77%)

All experiments now use `maxIter: 200` for consistency.

## Impact on Students

### Before (Inconsistent)
- ❌ Confusion: Why does this experiment stop at 10 and that one at 100?
- ❌ Artificial cutoff: Some algorithms looked worse because they were cut off too early
- ❌ Comparison issues: Can't fairly compare experiments with different iteration limits

### After (Consistent)
- ✅ Fair comparison: All experiments run for same number of iterations
- ✅ Full behavior visible: Students see actual convergence characteristics
- ✅ Clear failure modes: Problems that don't converge in 200 iterations are truly problematic
- ✅ No confusion: Same limit everywhere = less cognitive load

## Pedagogical Benefits

1. **Fast algorithms stand out**: Newton on quadratic converges in 2 iterations out of 200 available (clearly superior)

2. **Struggle is visible**: Perceptron + Newton oscillates for all 200 iterations (clearly incompatible)

3. **Fair comparisons**: When comparing algorithms side-by-side, they have equal opportunity to converge

4. **Reduced confusion**: Students don't wonder "why did this experiment stop at 5 iterations?"

5. **Realistic testing**: 200 iterations is reasonable for real optimization problems

## Files Modified

1. [src/experiments/newton-presets.ts](src/experiments/newton-presets.ts)
2. [src/experiments/gd-fixed-presets.ts](src/experiments/gd-fixed-presets.ts)
3. [src/experiments/gd-linesearch-presets.ts](src/experiments/gd-linesearch-presets.ts)
4. [src/experiments/lbfgs-presets.ts](src/experiments/lbfgs-presets.ts)

---

**Date**: 2025-11-07
**Status**: ✅ Complete
