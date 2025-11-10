# Mathematical Correctness Review - Master Report
## Newton's Method Educational Codebase

# MODERATE ISSUES (Acceptable Simplifications)

## 28. Default Hessian Damping Value

**Domain:** Numerical Properties
**Location:** `src/algorithms/newton.ts:121` and `src/algorithms/diagonal-preconditioner.ts:63`

**STATUS:** ✅ **CONFIRMED** - Different default values without explanation.

**Current State:**
- **Newton's method** (newton.ts:121): `hessianDamping = 0.01`
- **Diagonal preconditioner** (diagonal-preconditioner.ts:63): `hessianDamping = 1e-8`

**Why Different:**
These different defaults are actually appropriate:
- **Newton (0.01):** Needs significant damping because it inverts the full Hessian. Larger damping helps with numerical stability and near-indefinite Hessians.
- **Diagonal preconditioner (1e-8):** Only uses diagonal elements, so needs minimal damping just to avoid division by zero. Too much damping would destroy the adaptive step sizes.

**Problem:**
No explanation for why these differ, which could confuse users.

**Concrete Proposal:**

Add explanatory comments in both files:

**In newton.ts:121:**
```typescript
const { maxIter, c1 = 0.0001, lambda = 0,
  // Default damping of 0.01 provides numerical stability when inverting full Hessian.
  // Larger than diagonal preconditioner's default (1e-8) because full matrix inversion
  // is more sensitive to near-singular conditions.
  hessianDamping = 0.01,
  initialPoint, lineSearch = 'armijo', termination } = options;
```

**In diagonal-preconditioner.ts:63:**
```typescript
const {
  maxIter,
  lineSearch = 'none',
  c1 = 0.0001,
  lambda = 0,
  // Minimal damping (1e-8) to avoid division by zero on diagonal.
  // Much smaller than Newton's default (0.01) because we only invert diagonal elements,
  // not the full matrix, so numerical stability is less critical.
  hessianDamping = 1e-8,
  termination
} = options;
```

**Recommended Action:** Add the explanatory comments above.

**Estimated Effort:** 5 minutes

---

## 29. "Rotation Invariance" vs "Affine Invariance"

**Domain:** Pedagogical Content
**Location:** Multiple locations in component files

**STATUS:** ⚠️ **LOW PRIORITY** - Terminology preference.

**Current Usage:**
The codebase uses "rotation invariance" to describe Newton's method's property of being independent of coordinate system rotation.

**Literature Standard:**
Optimization literature typically uses "affine invariance" which is a stronger property (invariant under all affine transformations, not just rotations).

**Analysis:**
- "Rotation invariance" is technically correct and easier for students to understand
- "Affine invariance" is the standard term in professional literature
- Newton's method actually has affine invariance, so the current term undersells its properties

**Concrete Proposal:**

**Option 1: Use standard terminology**
Search and replace "rotation invariance" with "affine invariance" throughout the codebase, adding a brief explanation:
```tsx
<p><strong>Affine invariance:</strong> Newton's method is independent of linear
coordinate transformations (rotations, scalings, skews). The iteration count to
convergence doesn't change if you rotate or rescale your problem.</p>
```

**Option 2: Keep current term with clarification**
Add a note where rotation invariance is first mentioned:
```tsx
<p><strong>Rotation invariance</strong> (more precisely: affine invariance):
Newton's method converges in the same number of iterations regardless of how you
rotate or scale the coordinate system.</p>
```

**Recommended Action:** Option 2 - balances educational clarity with technical precision.

**Estimated Effort:** 10 minutes

---

# MINOR ISSUES (Optional Improvements)

## 31. Gradient Tolerance is Absolute, Not Relative

**Domain:** Error Analysis
**Location:** `src/algorithms/types.ts` and throughout algorithms

**STATUS:** ✅ **CONFIRMED** - Only absolute gradient tolerance supported.

**Current State:**
The `gtol` parameter checks `||∇f|| < gtol` (absolute) but doesn't offer a relative option like `||∇f|| / max(||x||, 1) < gtol_rel`.

**Impact:**
For educational purposes with fixed problem scales, absolute tolerance is fine. Production optimizers (scipy, nlopt) often provide both options.

**Concrete Proposal:**

**Option 1: Add relative tolerance (Full feature)**
See Issue #9 for details on extending the termination system.

**Option 2: Document the limitation (Quick)**
Add to Issue #9's documentation comment that relative gradient tolerance is also omitted.

**Recommended Action:** Document as part of Issue #9 fix.

**Estimated Effort:** Included in Issue #9.

---

## 32. No Check for Zero Gradient at Start

**Domain:** Error Analysis
**Location:** `src/algorithms/newton.ts:182` and similar in other algorithms

**STATUS:** ✅ **CONFIRMED** - Immediate termination without special message.

**Current Behavior:**
If the initial point happens to be at a critical point (||∇f(x₀)|| < gtol), the algorithm terminates immediately with reason='gradient', which could confuse users.

**Concrete Proposal:**

Add a check at iteration 0:
```typescript
if (gradNorm < gtol) {
  if (iter === 0) {
    // Special case: initial point is already at a critical point
    terminationReason = 'gradient';
    // Could add a flag to OptimizationResult to distinguish this case
    // or add a console warning for educational feedback
  } else {
    terminationReason = 'gradient';
  }
}
```

**Alternative:** Add a field to `AlgorithmSummary`:
```typescript
export interface AlgorithmSummary {
  // ... existing fields ...
  convergedAtInitialPoint?: boolean;  // True if terminated at iter=0
}
```

**Recommended Action:** Add the `convergedAtInitialPoint` flag for better UI feedback.

**Estimated Effort:** 15 minutes

---

## 33. Missing NaN/Inf Check on Hessian Eigenvalues

**Domain:** Error Analysis
**Location:** `src/algorithms/newton.ts:153` (after `computeEigenvalues`)

**STATUS:** ✅ **CONFIRMED** - No validation of eigenvalue finiteness.

**Current Code:**
```typescript
const eigenvalues = computeEigenvalues(hessian);
const conditionNumber = Math.abs(eigenvalues[0]) / Math.abs(eigenvalues[eigenvalues.length - 1]);
// No check if eigenvalues contain NaN or Infinity
```

**Risk:**
If eigenvalue computation fails (shouldn't happen for 2×2, but could with power iteration bugs), NaN values propagate silently.

**Concrete Proposal:**

Add defensive check after eigenvalue computation:
```typescript
const eigenvalues = computeEigenvalues(hessian);

// Defensive check for numerical issues in eigenvalue computation
if (!eigenvalues.every(isFinite)) {
  console.warn('Non-finite eigenvalues detected', eigenvalues);
  terminationReason = 'diverged';
  // Store iteration and break
}

const minEigenAbs = Math.abs(eigenvalues[eigenvalues.length - 1]);
const conditionNumber = minEigenAbs < 1e-15
  ? Infinity
  : Math.abs(eigenvalues[0]) / minEigenAbs;
```

**Recommended Action:** Add the check for robustness.

**Estimated Effort:** 5 minutes

---

## 34. No Hessian Symmetry Check

**Domain:** Numerical Properties
**Location:** Throughout algorithm implementations

**STATUS:** ✅ **CONFIRMED** - No validation that Hessian is symmetric.

**Current State:**
All algorithms assume the provided Hessian function returns symmetric matrices, but this is never verified.

**Concrete Proposal:**

Add a development-mode assertion in newton.ts:
```typescript
const hessian = problem.hessian(w);

// Development mode: verify Hessian symmetry
if (process.env.NODE_ENV === 'development') {
  const n = hessian.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const asymmetry = Math.abs(hessian[i][j] - hessian[j][i]);
      if (asymmetry > 1e-10) {
        console.warn(
          `Hessian not symmetric at (${i},${j}): ` +
          `H[${i}][${j}]=${hessian[i][j]}, H[${j}][${i}]=${hessian[j][i]}, ` +
          `difference=${asymmetry}`
        );
      }
    }
  }
}
```

**Recommended Action:** Add the development-mode check.

**Estimated Effort:** 10 minutes

---

## 35. Eigenvalue Sorting Doesn't Preserve Sign for Visualization

**Domain:** Numerical Properties
**Location:** `src/algorithms/newton.ts:99` (eigenvalue sorting)

**STATUS:** ✅ **CONFIRMED** - Sign information not prominently displayed.

**Current Implementation:**
```typescript
return eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
```

This sorts by absolute value, so a Hessian with eigenvalues [+5, -3] and [+3, +5] both become [5, 3] after sorting (losing sign information).

**Problem:**
Sign matters for detecting indefiniteness (saddle points), but the visualization doesn't make negative eigenvalues obvious.

**Concrete Proposal:**

**Option 1: Add eigenvalue statistics to iteration data**
```typescript
export interface NewtonIteration {
  // ... existing fields ...
  eigenvalues: number[];
  numPositiveEigenvalues: number;  // Count of positive eigenvalues
  numNegativeEigenvalues: number;  // Count of negative eigenvalues
  conditionNumber: number;
}
```

Then in the computation:
```typescript
const eigenvalues = computeEigenvalues(hessian);
const numPositive = eigenvalues.filter(ev => ev > 1e-10).length;
const numNegative = eigenvalues.filter(ev => ev < -1e-10).length;
```

**Option 2: Don't sort, preserve sign order**
Keep eigenvalues in their natural order from computation, don't sort by absolute value.

**Option 3: Visual indicator in UI**
Add color coding in the visualization: green for positive eigenvalues, red for negative.

**Recommended Action:** Option 1 (add counts) - provides structured data for UI without changing existing behavior.

**Estimated Effort:** 15 minutes
