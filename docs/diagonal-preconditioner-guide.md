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
