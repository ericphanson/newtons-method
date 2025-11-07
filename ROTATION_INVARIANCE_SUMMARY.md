# Rotation Invariance: The Progression from Scalars to Matrices

## The Problem
Rotated ellipse with κ=5, starting from [2, 2]

## The Four Stages

| Stage | Method | θ=0° | θ=45° | Coordinate Dependent? |
|-------|--------|------|-------|----------------------|
| **1** | GD-fixed (α=0.1) | 139 iters | 25 iters | ✅ Yes (5.6x difference) |
| **2** | GD-linesearch | 34 iters | 13 iters | ✅ Yes (2.6x difference) |
| **3** | Diagonal preconditioner | 1-2 iters | 41 iters | ✅ Yes (20x difference!) |
| **4** | Newton (H⁻¹) | 2 iters | 2 iters | ❌ **No (rotation-invariant!)** |

## Key Insights

### Stage 1: Scalar Step Size (α)
```
w_new = w - α·∇f
```
- Single scalar α for all coordinates
- Performance highly dependent on problem orientation
- Requires manual tuning for each problem

### Stage 2: Adaptive Scalar Step Size
```
w_new = w - α(w)·∇f
```
- Line search automatically adapts α
- Better, but still coordinate-dependent
- Different performance at different rotations

### Stage 3: Diagonal Preconditioner (per-coordinate αs)
```
w_new = w - D·∇f,  where D = diag(1/H₀₀, 1/H₁₁)
```
- Different step size for each coordinate
- **Perfect at θ=0°**: When H is diagonal, D=H⁻¹ exactly!
- **Terrible at θ=45°**: H has off-diagonal terms, D misses them
- **This is what Adam/RMSprop/AdaGrad do!**

### Stage 4: Full Matrix (H⁻¹)
```
w_new = w - H⁻¹·∇f
```
- Full matrix step size
- Captures off-diagonal structure
- **Rotation-invariant**: identical performance at all angles

## Why Each Stage Fails (Except Newton)

**Stage 1-2 (Scalar):**
- Can only scale the gradient, not rotate it
- Zigzags when gradient direction ≠ optimal direction

**Stage 3 (Diagonal):**
- Can scale each coordinate differently
- At θ=0°: Perfect! Valley aligns with axes
- At θ=45°: Valley is diagonal - no per-coordinate scaling helps
- **Key insight**: Diagonal matrices are coordinate-dependent

**Stage 4 (Full Matrix):**
- Can both scale AND rotate
- Automatically discovers optimal search direction
- Works regardless of coordinate system choice

## The Connection to Practical Optimizers

- **SGD**: Stage 1 (scalar α)
- **SGD + learning rate schedules**: Stage 2 (adaptive scalar)
- **Adam/RMSprop/AdaGrad**: Stage 3 (diagonal preconditioning)
- **Newton/L-BFGS**: Stage 4 (approximate full matrix)

This is why Adam works well in practice - most problems have meaningful coordinate systems (features), so diagonal preconditioning helps. But for problems with arbitrary rotations, second-order methods shine.

## Pedagogical Takeaway

The progression from scalar → diagonal → full matrix shows **increasing sophistication in handling problem geometry**:

1. Scalar: "Use the same step size everywhere"
2. Diagonal: "Use different step sizes for each coordinate"
3. Full matrix: "Use different step sizes AND rotate to align with geometry"

Only the full matrix (Newton) achieves **true rotation invariance**.
