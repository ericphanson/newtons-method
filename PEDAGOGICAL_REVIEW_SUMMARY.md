# Pedagogical Experiments Review - Summary

## TL;DR

**Overall**: ✅ Excellent pedagogical design with one critical fix needed

**Critical Issue**: UI button says "fix (with Hessian damping)" but actually delivers "fix (with line search)"

**Recommendation**: Fix the misleading text and consider adding a third experiment showing Hessian damping as an alternative solution.

## What I Found

### The Good ✅

1. **Perfect Problem Choice**: Perceptron + Newton is THE canonical example of this failure mode
   - Tiny Hessian (λ=0.0001) vs large gradients (~50-100)
   - Creates massive Newton steps that explode the loss
   - Clear, reproducible failure that students can see

2. **Clear Progression**:
   - Experiment 1: Shows the failure (no line search)
   - Experiment 2: Shows the fix (line search rescue)

3. **Concrete Predictions**:
   - "Newton direction is 10,000x gradient magnitude" ✓
   - Loss explodes dramatically ✓

4. **Well Integrated**:
   - Embedded in UI with explanations
   - Clickable buttons to load experiments
   - Clear visual presentation

### The Issues ⚠️

**1. Misleading Button Text** (CRITICAL)

File: [src/UnifiedVisualizer.tsx:3209](src/UnifiedVisualizer.tsx:3209)

```typescript
// Current (WRONG):
"Click here for the fix (with Hessian damping)"

// Should be:
"Click here for the fix (line search rescue)"
```

The fix experiment uses `hessianDamping: 0`, so it's NOT using damping at all!

**2. Missing Alternative Solution**

You show:
- ❌ Failure (no line search, no damping)
- ✅ Fix (line search, no damping)

Missing:
- ✅ Fix (no line search, WITH damping)

This would show students TWO different solutions to the same problem.

**3. Initial Point Dimension**

Experiments use `[0.5, 0.5]` (2D) but perceptron needs 3D weights `[w0, w1, bias]`.

Should be: `[0.5, 0.5, 0.0]`

**4. Lambda Might Be Too Extreme**

`lambda: 0.0001` creates very dramatic failure:
- Hessian ≈ 0.0001
- Steps are 5,000-10,000x too large
- Loss explodes to millions

Consider `lambda: 0.01` or `0.1` for more realistic (but still clear) failure.

## Test Results

I tested the failure experiment:

```bash
npm run test-combo -- --problem separating-hyperplane --variant perceptron \
  --algorithm newton --initial 0.5,0.5,0.0 --lambda 0.0001 --maxIter 5 \
  --dataset python/datasets/crescent.json --lineSearch none
```

**Result**: Final loss = 288,000 (starting from ~10-20)

**Verdict**: Failure is VERY dramatic ✓

## Recommended Actions

### Must Fix

1. **Change button text** from "with Hessian damping" → "line search rescue"
   - File: [src/UnifiedVisualizer.tsx:3209](src/UnifiedVisualizer.tsx:3209)

### Should Add

2. **Add third experiment**: Show Hessian damping alternative
   - File: [src/experiments/newton-presets.ts](src/experiments/newton-presets.ts)
   - Config:
     ```typescript
     {
       id: 'newton-perceptron-hessian-damping',
       name: 'Alternative Fix: Hessian Damping',
       hyperparameters: {
         lambda: 0.0001,
         hessianDamping: 1.0,  // Substantial damping
         lineSearch: 'none',
         maxIter: 100,
       },
       initialPoint: [0.5, 0.5, 0.0],
       expectation: 'Damping prevents huge steps, slow but stable convergence'
     }
     ```

3. **Fix initial points**: Change `[0.5, 0.5]` → `[0.5, 0.5, 0.0]`

4. **Add Newton warning to ProblemExplainer**:
   - File: [src/components/ProblemExplainer.tsx](src/components/ProblemExplainer.tsx)
   - Add yellow warning box after perceptron explanation
   - Text: "⚠️ Newton's Method Warning: Not recommended with perceptron..."

### Nice to Have

5. **Reconsider lambda**: Test with 0.01 or 0.1 for less extreme failure

6. **Add cross-references**: Link to [PERCEPTRON_NEWTON_ANALYSIS.md](PERCEPTRON_NEWTON_ANALYSIS.md) in docs

## Conclusion

This is **really good pedagogical content**! The core insight is correct, the demonstrations are clear, and the integration is well done.

The only critical issue is the misleading button text - easy fix.

With the recommended additions (third experiment, warning in docs), this would be **excellent** teaching material for explaining:
- Why Newton fails on non-smooth objectives
- How line search rescues bad steps
- How Hessian damping prevents bad steps
- The relationship between Hessian quality and Newton stability

**Score: 8/10** → Would be **9.5/10** with the fixes

---

## Related Files

- Detailed analysis: [PERCEPTRON_NEWTON_ANALYSIS.md](PERCEPTRON_NEWTON_ANALYSIS.md)
- Gradient verification: [GRADIENT_VERIFICATION_REPORT.md](GRADIENT_VERIFICATION_REPORT.md)
- Full review: [PEDAGOGICAL_EXPERIMENTS_REVIEW.md](PEDAGOGICAL_EXPERIMENTS_REVIEW.md)
- Test script: [test-perceptron-newton-detail.ts](test-perceptron-newton-detail.ts)
- Python test: [python/test_perceptron_newton_stability.py](python/test_perceptron_newton_stability.py)
