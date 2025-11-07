# Perceptron Newton's Method Instability Analysis

## Problem Statement

Newton's method on perceptron exhibits wild oscillatory behavior ("jumps around like crazy") from most starting points, never converging.

## Root Cause

**The perceptron Hessian is fundamentally too small compared to the gradient magnitude.**

### The Numbers

At starting point `w = [0.5, -0.3, 0.2]`:

```
Gradient:     [33.401, -32.942, -26.000]  (norm: 53.6)
Hessian:      [[0.1,   0.0,    0.0   ],
               [0.0,   0.1,    0.0   ],
               [0.0,   0.0,    0.01  ]]

Newton step:  [-334.0, 329.4, 2600.0]  (norm: 2642!)
```

**The Hessian is ~500x too small**, causing massive overshooting steps.

### Why This Happens

From [src/utils/separatingHyperplane.ts:147-159](src/utils/separatingHyperplane.ts:147-159):

```typescript
export function perceptronHessian(
  _w: number[],
  _dataPoints: DataPoint[],
  lambda: number
): number[][] {
  // Perceptron loss is piecewise linear, Hessian is from regularization term
  // H = λ * I for w0, w1; small value for bias to avoid singularity
  return [
    [lambda, 0, 0],
    [0, lambda, 0],
    [0, 0, 0.01]
  ];
}
```

**This Hessian only includes the regularization term** (`λ = 0.1`), ignoring the data term entirely because perceptron loss is piecewise linear.

## Oscillation Pattern

The algorithm **bounces between two points forever**:

```
Iteration 0:  w = [0.5, -0.3, 0.2]             loss = 2.14e+1
Iteration 1:  w = [-333.5, 329.1, 2600.2]     loss = 2.55e+5  (↑ 12,000x!)
Iteration 2:  w = [297.0, -1595.7, -4399.8]   loss = 5.74e+5  (↑ 2.2x)
Iteration 3:  w = [305.4, 895.8, 2600.2]      loss = 3.61e+5  (↓ 0.6x)
Iteration 4:  w = [297.0, -1595.7, -4399.8]   loss = 5.74e+5  (CYCLE!)
Iteration 5:  w = [305.4, 895.8, 2600.2]      loss = 3.61e+5  (CYCLE!)
... oscillates forever between iterations 2↔3 ...
```

## Why Scipy Also Struggles

Python's `PerceptronSVM` **has no Hessian method**:

```python
>>> p.hessian(w)
AttributeError: 'PerceptronSVM' object has no attribute 'hessian'
```

This means scipy's `Newton-CG` falls back to **quasi-Newton approximation** (BFGS or similar), which:
- Builds up curvature information gradually
- Doesn't rely on an explicit (incorrect) Hessian
- Still struggles but doesn't oscillate as wildly

## Mathematical Background

Perceptron loss: `L(w) = Σ max(0, -y·z) + (λ/2)||w||²`

- **Data term** `Σ max(0, -y·z)` is **piecewise linear** → Hessian = 0 (except at kinks where it's undefined)
- **Regularization** `(λ/2)||w||²` → Hessian = λI

True Hessian = `λI` everywhere (except at kinks).

**But this ignores the data!** When gradient is large (many misclassified points), using only `λI` as the Hessian causes huge Newton steps.

## Why Gradients Are Still Correct

The **gradients pass all finite difference tests** because they're mathematically correct:

- Python gradient verification: ✅ PASS (error 6.12e-10)
- TypeScript gradient verification: ✅ PASS (error 2.34e-10)

**The problem is NOT with gradients.** It's with using Newton's method on a non-smooth function with a poor Hessian approximation.

## Solutions

### Option 1: Remove Hessian from Perceptron (Recommended)

**Don't provide a Hessian** for perceptron. Force Newton's method to use quasi-Newton approximation:

```typescript
// Remove perceptronHessian export entirely
// Or return null/undefined to signal "use BFGS approximation"
```

This matches scipy's approach.

### Option 2: Use Better Hessian Approximation

Scale the identity matrix based on gradient magnitude:

```typescript
export function perceptronHessian(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number[][] {
  const grad = perceptronGradient(w, dataPoints, lambda);
  const gradNorm = Math.sqrt(grad.reduce((s, g) => s + g * g, 0));

  // Adaptive scaling: use larger values when gradient is large
  const scale = Math.max(lambda, gradNorm / 10);

  return [
    [scale, 0, 0],
    [0, scale, 0],
    [0, 0, scale / 10]  // Smaller for bias
  ];
}
```

This prevents massive steps when gradient is large.

### Option 3: Add Damping to Newton's Method

Modify the Newton algorithm to use **damped Newton steps**:

```typescript
// Instead of: w_new = w + step
// Use: w_new = w + α * step  where α ∈ (0, 1] is chosen by line search
```

This is already how L-BFGS works (and why it succeeds on perceptron).

## Comparison with Other Problems

| Problem | Hessian Type | Newton Behavior |
|---------|--------------|-----------------|
| Logistic Regression | Smooth, data-dependent | ✅ Converges well |
| Squared-Hinge SVM | Smooth, data-dependent | ✅ Converges well |
| Soft-Margin SVM | Piecewise linear (subgradient) | ⚠️ Similar issues |
| **Perceptron** | **Piecewise linear** | **❌ Oscillates wildly** |

## Test Results Summary

From [python/test_perceptron_newton_stability.py](python/test_perceptron_newton_stability.py):

**8 starting points tested:**

| Starting Point | Scipy Newton-CG | TypeScript Newton | Behavior |
|----------------|-----------------|-------------------|----------|
| [0, 0, 0] | ✅ Converges (trivial) | ❌ Diverges | MISMATCH |
| [1, 1, 1] | ❌ Diverges | ❌ Diverges | Both fail |
| [0.5, -0.3, 0.2] | ❌ Diverges | ❌ Diverges | Both fail |
| [-1, 1, 0] | ❌ Diverges | ❌ Diverges | Both fail |
| [5, 5, 5] | ❌ Diverges | ❌ Diverges | Both fail |
| [0.1, 0.1, 0.1] | ❌ Diverges | ❌ Diverges | Both fail |
| [10, -10, 5] | ❌ Diverges | ❌ Diverges | Both fail |
| [-5, -5, -5] | ❌ Diverges | ❌ Diverges | Both fail |

**Result: Newton's method is fundamentally unsuitable for perceptron** (even scipy struggles).

## Why Other Algorithms Work

From validation suite (all ✅ PASS):

- **GD fixed-step**: Small steps, stable
- **GD line search**: Armijo ensures descent
- **L-BFGS**: Quasi-Newton with line search + history

These algorithms don't trust the Hessian blindly.

## Recommendations

1. **Document limitation**: Newton's method is not recommended for piecewise linear objectives (perceptron, soft-margin SVM)

2. **Update UI**: Warn users when selecting Newton + perceptron

3. **Consider implementing Option 2**: Adaptive Hessian scaling would make Newton more robust

4. **Update validation docs**: Remove the note that "perceptron always fails" - it only fails with Newton, and that's expected for non-smooth problems

## Files for Reference

- Detailed iteration trace: [test-perceptron-newton-detail.ts](test-perceptron-newton-detail.ts)
- Multi-start test: [python/test_perceptron_newton_stability.py](python/test_perceptron_newton_stability.py)
- Perceptron implementation: [src/utils/separatingHyperplane.ts:147-159](src/utils/separatingHyperplane.ts:147-159)

---

**Bottom Line:** The "crazy jumping" behavior is caused by a tiny constant Hessian (0.1) being used with large gradients (magnitude ~50), causing Newton steps ~500x too large. This is a fundamental limitation of applying Newton's method to piecewise linear objectives.

Gradients are correct. The issue is architectural, not a bug.
