# L-BFGS Exact Damping Analog

**Question:** Can we create an exact analog to Levenberg-Marquardt damping (H + λI) for L-BFGS, even though we don't have the full Hessian matrix?

**Answer:** YES! By regularizing the initial Hessian approximation in the two-loop recursion.

---

## The Core Insight

### What We Have in Newton's Method

```
Solve: (H + λI) p = -∇f
```

Where:
- `H` = exact Hessian
- `λI` = diagonal regularization term
- Direct matrix addition

### What We Have in L-BFGS

L-BFGS doesn't form the full Hessian `B` explicitly. Instead, it:
1. Starts with an initial approximation `B_0`
2. Applies a series of rank-2 updates based on (s, y) pairs
3. Computes search directions via two-loop recursion

**Key observation:** We DO control `B_0`, the initial Hessian approximation!

---

## The Exact Analog

### Current L-BFGS Initial Approximation

In `src/algorithms/lbfgs.ts`, line 122:

```typescript
const gamma = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const r = scale(q, gamma);
```

This represents:
- **Initial inverse Hessian:** `H_0 = γI`
- **Initial Hessian:** `B_0 = (1/γ)I`

The scalar `γ` is computed from the most recent (s, y) pair to provide a good scale for the problem.

### Damped Initial Approximation

**Exact analog to Newton's `H + λI`:**

```
B_damped = B_0 + λI = (1/γ)I + λI = (1/γ + λ)I
```

**The inverse (what we use in two-loop recursion):**

```
H_damped = (B_damped)^(-1) = 1/(1/γ + λ) I = γ/(1 + λγ) I
```

### Implementation Options

**Option 1: Modify gamma directly (simpler)**

```typescript
const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const lambda = hessianDamping;  // Same parameter as Newton!
const gamma = gammaBase / (1 + lambda * gammaBase);
const r = scale(q, gamma);
```

**Option 2: Think of it as additive damping (more intuitive)**

```typescript
const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const lambda = hessianDamping;

// We want H_0 = (B_0 + λI)^(-1) where B_0 = (1/γ)I
// So B_0 + λI = (1/γ + λ)I
// And (B_0 + λI)^(-1) = 1/(1/γ + λ) I = γ/(1 + λγ) I

const gamma = gammaBase / (1 + lambda * gammaBase);
const r = scale(q, gamma);
```

**Option 3: Regularize the Hessian side (alternative framing)**

If we think of the initial inverse Hessian as `H_0 = γI`, we could also interpret this as regularizing the inverse:

```typescript
const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const lambda = hessianDamping;

// Simple additive regularization on the inverse Hessian scale
// This is less "exact" but more intuitive
const gamma = gammaBase + lambda;
const r = scale(q, gamma);
```

This is simpler but technically different: it adds `λ` to `γ` directly rather than accounting for the inversion.

---

## Mathematical Equivalence

### Newton with LM Damping

**Optimization problem:**
```
p = argmin_p [ f(w) + ∇f^T p + (1/2) p^T H p + (λ/2) p^T p ]
```

**Solution:**
```
(H + λI) p = -∇f
```

### L-BFGS with Initial Damping

**Optimization problem:**
```
p = argmin_p [ f(w) + ∇f^T p + (1/2) p^T B p + (λ/2) p^T p ]
where B is the L-BFGS Hessian approximation
```

**Solution:**
```
(B + λI) p = -∇f
```

**Implementation via two-loop recursion:**

Starting from `B_0 = (1/γ)I`, we apply BFGS updates:
```
B_k = B_{k-1} + (y_k y_k^T)/(y_k^T s_k) - (B_{k-1} s_k s_k^T B_{k-1})/(s_k^T B_{k-1} s_k)
```

If we want `B_k + λI`, we can achieve this by starting with `B_0 = (1/γ + λ)I`, since the additive term `λI` is preserved through the BFGS updates:

```
(B_k + λI) = (B_{k-1} + λI) + update_k
```

**Therefore:** Setting the initial approximation to `B_0 = (1/γ + λ)I` gives us exactly `(B_final + λI)` after all updates!

---

## Comparison: Powell's Damping vs Initial Damping

### Powell's Damping

**What it does:** Modifies gradient differences (y) to enforce positive curvature
**When applied:** Only when `s^T y < threshold`
**Purpose:** Maintain positive definiteness of Hessian approximation
**Effect:** Salvages potentially bad updates

**Formula:**
```
ŷ = θy + (1-θ)Bs  where θ ∈ [0,1]
```

### Initial Hessian Damping (Exact LM Analog)

**What it does:** Regularizes the starting Hessian approximation
**When applied:** Every iteration (affects the initial scale)
**Purpose:** Regularize conditioning, interpolate toward gradient descent
**Effect:** All subsequent updates build on damped foundation

**Formula:**
```
γ_damped = γ / (1 + λγ)  or equivalently  B_0 = (1/γ + λ)I
```

### Can We Use Both?

**YES!** They serve different purposes:

1. **Initial damping (LM analog):** Sets the base regularization level
2. **Powell's damping:** Handles individual bad updates

Combined approach:
```typescript
// 1. Initial damping (line 122)
const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const gammaDamped = gammaBase / (1 + lambda * gammaBase);
const r = scale(q, gammaDamped);

// 2. Powell's damping (line 178-186)
if (sTy < eta * sTBs) {
  const theta = (1 - eta) * sTBs / (sTBs - sTy);
  yToUse = add(scale(y, theta), scale(Bs, 1 - theta));
}
```

This combines:
- Global regularization (like Newton's λ)
- Local update correction (Powell's method)

---

## Pedagogical Clarity

### Side-by-Side: The Exact Parallel

| Aspect | Newton LM Damping | L-BFGS Initial Damping |
|--------|-------------------|------------------------|
| **Hessian** | Exact H | Approximate B |
| **Damping formula** | H + λI | B_0 + λI |
| **Matrix form** | H + λI | (1/γ + λ)I initially |
| **Inverse form** | (H + λI)^(-1) | γ/(1 + λγ) I initially |
| **Effect** | Regularize eigenvalues | Regularize initial scale |
| **Updates** | Recompute each iter | Build via rank-2 updates |
| **Implementation** | Add λ to diagonal | Modify γ in two-loop |

### What About First Iteration?

**First iteration (iter=0):** Both methods fall back to gradient descent:

```typescript
// Newton
if (HInv === null) {
  direction = scale(grad, -1);
}

// L-BFGS
if (iter === 0 || memory.length === 0) {
  direction = scale(grad, -1);
}
```

So damping doesn't affect the first step - both use steepest descent.

**Second iteration onward:** This is where damping kicks in:
- Newton: Regularizes the exact Hessian
- L-BFGS: Regularizes the approximate Hessian via initial scaling

---

## Implementation Plan

### Minimal Change (Recommended)

**Single line modification** in `src/algorithms/lbfgs.ts`:

```typescript
// Line 122 - current:
const gamma = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);

// Modified with damping:
const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
const gamma = gammaBase / (1 + hessianDamping * gammaBase);
```

**Add parameter to function signature** (line 73):

```typescript
export const runLBFGS = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    c1?: number;
    m?: number;
    lambda?: number;
    hessianDamping?: number;  // NEW: exact analog to Newton damping
  }
): LBFGSIteration[] => {
  const {
    maxIter,
    c1 = 0.0001,
    m = 5,
    lambda = 0,
    initialPoint,
    tolerance = 1e-5,
    hessianDamping = 0  // NEW: default no damping
  } = options;

  // ... rest of implementation
```

### Complete Implementation with Both Damping Types

```typescript
export const runLBFGS = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    c1?: number;
    m?: number;
    lambda?: number;
    hessianDamping?: number;      // LM-style initial damping
    powellDamping?: boolean;       // Powell's update damping
    powellEta?: number;            // Powell threshold
  }
): LBFGSIteration[] => {
  const {
    maxIter,
    c1 = 0.0001,
    m = 5,
    lambda = 0,
    initialPoint,
    tolerance = 1e-5,
    hessianDamping = 0,
    powellDamping = false,
    powellEta = 0.2
  } = options;

  // ... in two-loop recursion (line 122):
  const gammaBase = dot(lastMem.s, lastMem.y) / dot(lastMem.y, lastMem.y);
  const gamma = hessianDamping > 0
    ? gammaBase / (1 + hessianDamping * gammaBase)
    : gammaBase;
  const r = scale(q, gamma);

  // ... in memory update (line 178-186):
  if (iter > 0) {
    const s = sub(wNew, w);
    const y = sub(newGrad, grad);
    const sTy = dot(s, y);

    let yToUse = y;
    let dampingApplied = false;

    if (powellDamping) {
      const Bs = applyHessianApproximation(memory, s, gamma);
      const sTBs = dot(s, Bs);

      if (sTy < powellEta * sTBs) {
        const theta = (1 - powellEta) * sTBs / (sTBs - sTy);
        yToUse = add(scale(y, theta), scale(Bs, 1 - theta));
        dampingApplied = true;
      }
    }

    const sTyFinal = dot(s, yToUse);

    if (sTyFinal > 1e-10) {
      memory.push({ s, y: yToUse, rho: 1 / sTyFinal });
      if (memory.length > M) memory.shift();
    }
  }
}
```

---

## Advantages of the Exact Analog Approach

### 1. Pedagogical Clarity

**For learners:** "Both Newton and L-BFGS regularize their Hessian with λI"

This is much clearer than explaining Powell's damping, which involves modifying gradient differences in a non-obvious way.

### 2. Shared Parameter

**UI consistency:** Both algorithms can share the same `hessianDamping` parameter!

```typescript
// Newton
const dampedHessian = hessian.map((row, i) =>
  row.map((val, j) => i === j ? val + hessianDamping : val)
);

// L-BFGS
const gamma = gammaBase / (1 + hessianDamping * gammaBase);
```

Same λ value, analogous effect.

### 3. Simpler Implementation

**Minimal code change:** Single line modification vs implementing Powell's damping.

**No helper functions needed:** Unlike Powell's damping which requires `applyHessianApproximation`.

### 4. Theoretical Soundness

**Well-founded in optimization theory:** This is essentially a trust-region interpretation of L-BFGS.

**Preserves convergence properties:** The damping is applied at the foundation, so all theoretical guarantees still hold.

---

## Disadvantages / Limitations

### 1. Doesn't Handle Bad Updates

**Problem:** If an individual update has `s^T y < 0`, this approach won't fix it.

**Solution:** Combine with Powell's damping for robustness.

### 2. Global vs Local

**Initial damping:** Affects all directions equally (isotropic)
**Powell's damping:** Corrects specific bad updates (anisotropic)

For best results, consider using both.

### 3. Different Effect on Convergence

**LM damping:** Continuously interpolates toward gradient descent
**Powell's damping:** Occasional corrections when needed

Depending on the problem, one may be more effective than the other.

---

## Experimental Validation

### Test 1: Verify Exact Analog Behavior

**Hypothesis:** L-BFGS with initial damping should behave similarly to Newton with LM damping.

**Experiment:**
1. Problem: Ill-conditioned quadratic (κ = 100)
2. Algorithms:
   - Newton (λ = 0.01)
   - Newton (λ = 0.1)
   - L-BFGS (λ = 0.01)
   - L-BFGS (λ = 0.1)
3. Compare:
   - Convergence rate
   - Direction magnitudes
   - Interpolation toward gradient descent

**Expected:** Similar trends as λ increases in both methods.

### Test 2: Initial Damping vs Powell Damping

**Hypothesis:** Initial damping and Powell damping have different effects.

**Experiment:**
1. Problem: Rosenbrock function
2. Algorithms:
   - L-BFGS (no damping)
   - L-BFGS (initial damping λ = 0.01)
   - L-BFGS (Powell damping η = 0.2)
   - L-BFGS (both dampings)
3. Track:
   - Number of iterations to convergence
   - Number of rejected/modified updates
   - Final loss value

**Expected:** Combined approach may be most robust.

### Test 3: Saddle Point Behavior

**Hypothesis:** Damping helps escape saddle points.

**Experiment:**
1. Problem: Saddle function (f = x² - y²)
2. Algorithms:
   - L-BFGS (λ = 0)
   - L-BFGS (λ = 0.01)
   - L-BFGS (λ = 0.1)
   - Newton (λ = 0.01) for comparison
3. Start near saddle point (0.1, 0.1)
4. Observe:
   - Does it escape?
   - Direction of escape
   - Number of iterations

---

## Recommendation

### Implement the Exact Analog First

**Why:**
1. **Simpler:** One line change
2. **Clearer:** Direct parallel to Newton
3. **Shared UI:** Same parameter for both algorithms
4. **Foundational:** Can add Powell later if needed

**Implementation:**
- Modify `gamma` calculation (1 line)
- Add `hessianDamping` parameter
- Update UI to expose it
- Create experiments comparing Newton and L-BFGS with same λ values

### Then Consider Adding Powell

**If needed:**
- Adds robustness to bad updates
- Complements initial damping
- More complete implementation

**But not required:**
- Initial damping may be sufficient
- Can evaluate after testing

---

## UI Presentation

### Control Panel

```
Hessian Damping (λ): [slider 0.0 - 1.0]

Applied to:
✓ Newton's Method: H + λI
✓ L-BFGS: Initial Hessian B₀ + λI

Description:
Regularizes the Hessian (or its approximation) by adding λ to
the diagonal. Higher values interpolate toward gradient descent,
improving stability at the cost of slower convergence.
```

### Iteration Inspector

**Newton:**
```
Iteration 3:
  Hessian eigenvalues: [100.01, 1.01]  (damped from [100, 1])
  Condition number: 99.0 (vs 100 undamped)
  Direction: [-0.52, -0.85]
```

**L-BFGS:**
```
Iteration 3:
  Initial scale (γ): 0.095 (damped from 0.105)
  Effective B₀: 10.53 I (vs 9.52 I undamped)
  Direction: [-0.54, -0.84]
```

### Experiment: "Damping Comparison"

**Setup:**
- Problem: Ill-conditioned quadratic (κ = 100)
- Algorithms: Newton (λ = 0.01), L-BFGS (λ = 0.01)
- Observation: Compare how both methods regularize their Hessians

**Questions to explore:**
1. Do they converge at similar rates?
2. How do the search directions compare?
3. What happens as you increase λ?

---

## Conclusion

**Yes, there is an exact analog to Levenberg-Marquardt damping for L-BFGS!**

By modifying the initial Hessian approximation from `B_0 = (1/γ)I` to `B_0 = (1/γ + λ)I`, we achieve exactly the same effect as Newton's `H + λI`.

**Implementation:** Modify `gamma` in the two-loop recursion:
```typescript
const gamma = gammaBase / (1 + hessianDamping * gammaBase);
```

This approach is:
- ✅ Mathematically exact
- ✅ Simple to implement (1 line change)
- ✅ Pedagogically clear
- ✅ Shares parameter with Newton's method
- ✅ Theoretically sound

**Recommendation:** Implement this as the primary damping mechanism for L-BFGS, with Powell's damping as an optional enhancement for handling bad individual updates.
