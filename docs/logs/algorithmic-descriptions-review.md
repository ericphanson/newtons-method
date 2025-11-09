# Algorithmic Descriptions Review

**Date:** 2025-11-09
**Reviewer:** Claude (Sonnet 4.5)
**Scope:** Mathematical correctness of algorithm descriptions, update rules, and pseudocode

---

## CRITICAL Issues

**None found.** All core mathematical formulations are correct.

---

## SIGNIFICANT Issues

### 1. Newton's Method Formula Notation Ambiguity

**Location:** `/Users/eph/newtons-method/src/components/AlgorithmExplainer.tsx` (line 296)

**Current formula:**
```latex
w_{k+1} = w_k - (H + \lambda_{\text{damp}} \cdot I)^{-1}(w_k) \nabla f(w_k)
```

**Issue:** The notation `(H + λ_damp · I)^{-1}(w_k)` is ambiguous. The `(w_k)` placement suggests that the inverse Hessian is a function of `w_k`, but it's actually the entire inverse Hessian that multiplies the gradient.

**Standard notation:**
```latex
w_{k+1} = w_k - [H(w_k) + \lambda_{\text{damp}} \cdot I]^{-1} \nabla f(w_k)
```

**Severity:** Significant - While the code implementation is correct (line 194-208 in `/Users/eph/newtons-method/src/algorithms/newton.ts`), the mathematical notation could confuse readers about operator precedence and what depends on `w_k`.

**Recommendation:** Clarify that `H(w_k)` is the Hessian evaluated at `w_k`, and the entire damped Hessian is inverted before multiplying the gradient.

---

## MODERATE Issues

### 1. Diagonal Preconditioner Formula - Missing Clarification

**Location:** `/Users/eph/newtons-method/src/components/AlgorithmExplainer.tsx` (line 184)

**Current formula:**
```latex
D = \text{diag}(1/H_{00}, 1/H_{11}, ...)
```

**Issue:** The formula correctly states `1/H_ii` (reciprocal), but doesn't explicitly show the small damping term added in the actual implementation for numerical stability.

**Code implementation (line 113 in `/Users/eph/newtons-method/src/algorithms/diagonal-preconditioner.ts`):**
```typescript
const preconditioner = hessianDiagonal.map(d => 1 / (d + hessianDamping));
```

**Recommendation:** Add a note or update the formula to:
```latex
D = \text{diag}(1/(H_{00} + \epsilon), 1/(H_{11} + \epsilon), ...)
```
where `ε` is a small damping constant for numerical stability (default: 1e-8).

---

### 2. Armijo Condition - Variable Naming Inconsistency

**Location:** `/Users/eph/newtons-method/src/components/AlgorithmExplainer.tsx` (line 107)

**Display formula:**
```latex
f(w_k - \alpha_k \nabla f(w_k)) \leq f(w_k) - c \alpha_k \|\nabla f(w_k)\|^2
```

**Code implementation (`/Users/eph/newtons-method/src/line-search/armijo.ts`, line 8):**
```
f(w + alpha*p) <= f(w) + c1*alpha*(grad^T*p)
```

**Issue:** The UI uses `c` while the code uses `c1`. Both are correct, but consistency would improve clarity. Also, the UI formula expands for the specific case where `p = -∇f(w)`, so the right-hand side becomes `f(w_k) - c α_k ||∇f(w_k)||^2`. However, the code's general form `c1*alpha*(grad^T*p)` is more general and standard.

**Standard form (Nocedal & Wright):**
```
f(x_k + α p_k) ≤ f(x_k) + c₁ α ∇f(x_k)^T p_k
```

**Recommendation:** Add a note in the UI explaining that for steepest descent where `p = -∇f`, the condition simplifies to the form shown, but the general Armijo condition uses the directional derivative `∇f^T p`.

---

## MINOR Issues

### 1. L-BFGS Memory Pairs Notation

**Location:** `/Users/eph/newtons-method/src/components/AlgorithmExplainer.tsx` (line 418-421)

**Current description:**
```latex
s_k = w_{k+1} - w_k, \quad y_k = \nabla f(w_{k+1}) - \nabla f(w_k)
```

**Observation:** This is correct. The code (line 183-184 in `/Users/eph/newtons-method/src/algorithms/lbfgs.ts`) matches:
```typescript
const s = sub(wNew, w);
const y = sub(newGrad, grad);
```

**Minor improvement:** Could add that these represent position differences and gradient differences respectively, which capture curvature information.

---

### 2. Backtracking Parameters

**Location:** `/Users/eph/newtons-method/src/components/AlgorithmExplainer.tsx` (line 110)

**Current:** "Start with α = 1, multiply by β = 0.5 until condition satisfied"

**Code:** Uses `rho = 0.5` as the backtracking factor (line 17 in `/Users/eph/newtons-method/src/line-search/armijo.ts`)

**Issue:** Minor naming inconsistency - UI uses `β` symbol, code uses `rho`. Both are common in literature.

**Recommendation:** Keep as-is, but note that β (or ρ) is typically in (0,1), commonly 0.5.

---

## Verified Correct

### 1. Gradient Descent (Fixed Step)

**Formula (AlgorithmExplainer.tsx, line 31):**
```latex
w_{k+1} = w_k - \alpha \nabla f(w_k)
```

**Verification:** Matches standard definition exactly. Code implementation correct (line 54 in `gradient-descent.ts`):
```typescript
const wNew = add(w, scale(direction, alpha));
// where direction = scale(grad, -1)
```

**Source:** Confirmed against Nocedal & Wright, Boyd & Vandenberghe, and Wikipedia.

---

### 2. Armijo Condition (Mathematical Content)

**Formula (AlgorithmExplainer.tsx, line 107):**
```latex
f(w_k - \alpha_k \nabla f(w_k)) \leq f(w_k) - c \alpha_k \|\nabla f(w_k)\|^2
```

**Verification:** For steepest descent direction `p = -∇f`, the general Armijo condition:
```
f(x + αp) ≤ f(x) + c₁ α ∇f^T p
```
becomes:
```
f(x - α∇f) ≤ f(x) + c₁ α ∇f^T(-∇f) = f(x) - c₁ α ||∇f||²
```

**Status:** Mathematically correct. This is the standard sufficient decrease condition.

**Code verification (armijo.ts, line 51-52):**
```typescript
const armijoRHS = loss + c1 * alpha * dirGrad;
const satisfied = newLoss <= armijoRHS;
// where dirGrad = dot(direction, grad) and direction = -grad for GD
```

**Status:** Implementation matches formula exactly.

---

### 3. Diagonal Preconditioner Update Rule

**Formula (AlgorithmExplainer.tsx, line 174):**
```latex
w_{k+1} = w_k - D_k \nabla f(w_k)
```

**Verification:** Correct form for diagonal preconditioning. The diagonal matrix `D` scales each component of the gradient independently.

**Code verification (diagonal-preconditioner.ts, line 116):**
```typescript
const direction = grad.map((g, i) => -preconditioner[i] * g);
```

**Status:** Correct. Each gradient component is multiplied by its corresponding preconditioner value.

---

### 4. Newton's Method (Core Idea)

**Formula (AlgorithmExplainer.tsx, line 296):**

The mathematical content is correct (notation issue noted in "Significant Issues"). The code correctly:

1. Computes damped Hessian: `H_damped = H + λ_damp * I` (newton.ts, line 195-197)
2. Inverts it: `HInv = invertMatrix(dampedHessian)` (line 200)
3. Solves for direction: `direction = -H_inv * grad` (line 207)

**Verification against standard:** Newton's method solves `H(x_k) d = -∇f(x_k)` for search direction `d`, then updates `x_{k+1} = x_k + d`. With damping: `[H(x_k) + λI] d = -∇f(x_k)`.

**Status:** Implementation is mathematically correct. Matches Levenberg-Marquardt damping strategy.

---

### 5. L-BFGS Two-Loop Recursion

**Description (AlgorithmExplainer.tsx, line 424):**
```
Use two-loop recursion to compute H_k^{-1} ∇f(w_k) without forming the matrix
```

**Code verification (lbfgs.ts, lines 100-148):**

The implementation follows the standard two-loop recursion algorithm:

1. **First loop (backward, line 104-118):** Computes `α_i = ρ_i s_i^T q` and updates `q ← q - α_i y_i`
2. **Initial Hessian approximation (line 121-126):** `γ = (s^T y)/(y^T y)`, with damping adjustment
3. **Second loop (forward, line 130-145):** Computes `β = ρ_i y_i^T r` and `r ← r + (α_i - β) s_i`

**Verification:** This matches Algorithm 7.4 from Nocedal & Wright "Numerical Optimization" (2006) exactly.

**Status:** Correct implementation of standard L-BFGS two-loop recursion.

---

### 6. Line Search Backtracking

**Description (AlgorithmExplainer.tsx, line 110):**
```
Start with α=1, multiply by ρ=0.5 until condition satisfied
```

**Code verification (armijo.ts, lines 31-71):**
```typescript
let alpha = 1.0;
// ...
for (let trial = 0; trial < maxTrials; trial++) {
  // ... test condition ...
  if (satisfied) { return ... }
  alpha *= rho;  // rho = 0.5
}
```

**Status:** Correct standard backtracking line search with geometric decay.

---

## Code-Math Alignment

### Excellent Alignment

All algorithm implementations faithfully match their mathematical descriptions:

1. **Gradient Descent:** Direct translation of `w ← w - α∇f`
2. **Armijo Line Search:** Implements sufficient decrease condition exactly
3. **Diagonal Preconditioner:** Correctly extracts diagonal and inverts element-wise
4. **Newton's Method:** Proper Hessian inversion with damping
5. **L-BFGS:** Standard two-loop recursion with memory management

### Implementation Details Worth Noting

1. **Damping parameters:**
   - Newton's method: `hessianDamping = 0.01` (default)
   - Diagonal preconditioner: `hessianDamping = 1e-8` (default)
   - L-BFGS: Applies damping to initial Hessian approximation via `γ/(1 + λγ)` (line 124-126)

2. **Termination criteria:** All algorithms properly implement:
   - Gradient norm checking (`gradNorm < gtol`)
   - Function value stalling (`ftol`)
   - Step size stalling (`xtol`)
   - Divergence detection (non-finite values)

3. **Line search:** Armijo implementation includes:
   - Visualization curve generation (lines 39-45)
   - Trial history for debugging (lines 54-60)
   - Proper fallback if no step satisfies condition (lines 74-81)

---

## Sources Consulted

### Primary References

1. **Nocedal, J., & Wright, S. J. (2006).** *Numerical Optimization* (2nd ed.). Springer.
   - Chapter 3: Line Search Methods (Armijo condition, backtracking)
   - Chapter 6: Newton's Method
   - Chapter 7: Quasi-Newton Methods (L-BFGS, two-loop recursion)

2. **Boyd, S., & Vandenberghe, L. (2004).** *Convex Optimization*. Cambridge University Press.
   - Section 9.2: Gradient Descent
   - Section 9.5: Newton's Method

3. **Wikipedia:**
   - "Gradient descent" - https://en.wikipedia.org/wiki/Gradient_descent
   - "Newton's method in optimization" - https://en.wikipedia.org/wiki/Newton's_method_in_optimization
   - "Limited-memory BFGS" - https://en.wikipedia.org/wiki/Limited-memory_BFGS
   - "Backtracking line search" - https://en.wikipedia.org/wiki/Backtracking_line_search
   - "Levenberg-Marquardt algorithm" - https://en.wikipedia.org/wiki/Levenberg–Marquardt_algorithm

### Supporting References

4. **Academic Course Notes:**
   - CMU 10-725 (Convex Optimization): Newton's Method, Quasi-Newton Methods
   - Stanford CS229: Newton's Method notes
   - MIT 67220: Hessians and Preconditioning lecture notes

5. **Technical Documentation:**
   - Stack Exchange (Computational Science): Armijo rule discussions
   - Medium articles on L-BFGS two-loop recursion
   - Research papers on diagonal preconditioning

### Verification Method

For each formula, I:
1. Cross-referenced against at least 2 authoritative sources
2. Verified variable names and notation conventions
3. Checked code implementation line-by-line
4. Confirmed sign conventions (especially negative signs in gradients)
5. Validated matrix operation ordering (e.g., H^{-1} * grad vs grad * H^{-1})

---

## Summary

### Overall Assessment: Excellent

The codebase demonstrates **high mathematical rigor** and **careful implementation**. All core algorithms are correctly formulated and implemented. The few issues identified are primarily notational/presentational rather than mathematical errors.

### Key Strengths

1. **Correct formulations:** All update rules match standard definitions
2. **Implementation fidelity:** Code faithfully implements the mathematics
3. **Educational value:** Descriptions are accurate and pedagogically sound
4. **Numerical stability:** Appropriate use of damping parameters throughout

### Recommendations Priority

1. **High:** Clarify Newton's method notation for inverse Hessian (significant issue #1)
2. **Medium:** Add damping term to diagonal preconditioner formula display (moderate issue #1)
3. **Low:** Standardize parameter naming between UI and code (moderate issue #2, minor issues #2)

### Code Quality Notes

The implementations include excellent engineering practices:
- Proper numerical safeguards (damping, singularity checks)
- Comprehensive iteration tracking for visualization
- Clear variable naming despite domain complexity
- Appropriate fallback strategies (e.g., GD when Hessian singular)

No changes to code logic are required. The mathematical foundations are solid.
