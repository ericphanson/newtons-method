# Error Analysis & Stopping Criteria Review

**Date:** 2025-11-09
**Reviewer:** Claude (Sonnet 4.5)
**Scope:** Mathematical correctness of convergence criteria, error metrics, and tolerance specifications

---

## CRITICAL Issues

### 1. Gradient Norm Alone Insufficient for "Optimal Convergence" (Saddle Point Problem)

**Location:** `/Users/eph/newtons-method/src/algorithms/types.ts:34`

**Claim:** `'gradient' // ||grad|| < gtol (optimal convergence)`

**Issue:** The comment claims that satisfying the gradient norm criterion represents "optimal convergence," but this is mathematically incorrect for Newton's method in non-convex settings.

**Evidence from Literature:**
- **Nocedal & Wright, Numerical Optimization:** First-order necessary conditions (∇f(x) = 0) are satisfied at both minima AND saddle points
- **Research consensus:** "Newton's method does not treat saddle points appropriately; saddle-points instead become attractive under the Newton dynamics" (multiple sources)
- **Second-order test required:** For a local minimum, need ∇f(x*) = 0 AND H(x*) positive semi-definite

**Actual Behavior in Code:**
```typescript
// newton.ts:180-183
if (gradNorm < gtol) {
  terminationReason = 'gradient';
  // Will store iteration at end of loop
}
```

**Problem:** The algorithm will mark convergence as "optimal" even when converging to a saddle point, which is demonstrated in the codebase's own experiment presets:
- Experiment `newton-failure-saddle` explicitly shows Newton's method converging to a saddle point
- The Hessian eigenvalue information is computed but NOT used in the stopping criteria

**Recommendation:**
1. For convex problems: gradient norm criterion is sufficient
2. For non-convex problems: MUST check Hessian eigenvalues when gradient norm is small
3. Rename "optimal convergence" to "first-order stationary point" or "critical point"
4. Add second-order optimality check: all eigenvalues > 0 for true local minimum

**Severity:** CRITICAL - The algorithm claims optimal convergence when it may have found a saddle point, which is mathematically incorrect and misleading for educational software.

---

## SIGNIFICANT Issues

### 2. Misleading Terminology: "Stalled" vs "Converged"

**Location:** `/Users/eph/newtons-method/src/algorithms/types.ts:35-36`, `/Users/eph/newtons-method/src/algorithms/terminationUtils.ts:26-29`

**Claim:**
```typescript
'ftol'  // Relative function change < ftol (stalled, scipy-style)
'xtol'  // Relative step size < xtol (stalled, scipy-style)
```

**Issue:** The terminology "stalled" is misleading and inconsistent with scipy's actual usage.

**Evidence from scipy:**
- scipy's L-BFGS-B returns: `success=True` with message "CONVERGENCE: REL_REDUCTION_OF_F_<=_FACTR*EPSMCH"
- scipy's documentation: ftol represents "the acceptable relative error in func(xopt) for **convergence**"
- scipy's OptimizeResult: `success` attribute indicates successful exit, not failure

**Actual scipy behavior:**
- When ftol/xtol criteria are met → `success=True`, labeled as convergence (not stalling)
- The message describes the mathematical condition satisfied, not a failure mode

**Current code implementation:**
```typescript
// terminationUtils.ts:26
case 'ftol':
  return `Stalled: relative function change ${values.funcChange!.toExponential(2)} < ${values.ftol!.toExponential(2)}`;
```

**Problem with "stalled" terminology:**
1. **Semantically incorrect:** "Stalled" implies failure or getting stuck, but ftol/xtol satisfaction can indicate successful convergence
2. **Contradicts scipy:** The code claims to be "scipy-style" but scipy calls this "convergence," not "stalled"
3. **Educational confusion:** Students may think ftol/xtol convergence is inferior or problematic

**Counter-argument consideration:**
- In some cases, ftol/xtol can trigger prematurely due to ill-conditioning or numerical issues
- However, this doesn't make "stalled" the correct general term

**Recommendation:**
1. Use neutral terminology: "Converged: relative function change below tolerance"
2. OR use scipy's exact phrasing: "CONVERGENCE: REL_REDUCTION_OF_F <= FTOL"
3. Add a flag like `premature_convergence` if you want to distinguish from gradient-based convergence
4. Update the `stalled` boolean flag to something like `ftol_xtol_convergence` or `non_gradient_convergence`

**Severity:** SIGNIFICANT - Terminology is educationally misleading and contradicts claimed scipy compatibility.

---

### 3. Missing Critical Stopping Criteria

**Location:** `/Users/eph/newtons-method/src/algorithms/types.ts:33-38`, `/Users/eph/newtons-method/src/algorithms/newton.ts:126-249`

**Issue:** The implementation is missing standard stopping criteria used in production optimization software.

**Missing criteria:**
1. **Maximum wall-clock time:** No timeout mechanism (only maxiter)
2. **Maximum function evaluations:** Not tracked separately from iterations
3. **Relative gradient norm:** Currently uses absolute gradient norm; scipy uses projected gradient norm
4. **User-defined callback:** No mechanism for custom stopping conditions

**Evidence from scipy.optimize.minimize:**
- L-BFGS-B tracks: `maxfun` (function evaluation limit), `maxiter` (iteration limit)
- TNC has: accuracy parameter, function evaluation limits
- Most methods support: callback functions that can terminate early

**Current stopping criteria (complete list):**
```typescript
export type ConvergenceCriterion =
  | 'gradient'   // ||grad|| < gtol
  | 'ftol'       // Relative function change
  | 'xtol'       // Relative step size
  | 'maxiter'    // Max iterations
  | 'diverged';  // NaN/Inf
```

**What's missing:**
- No relative gradient norm: `||grad|| / max(||grad_0||, 1)`
- No function evaluation budget tracking
- No time-based limits
- No mechanism to detect oscillation or cycling

**Recommendation:**
1. Add `maxfun` parameter and track function evaluation count separately
2. Consider adding relative gradient norm option: `||grad|| < gtol * max(||grad_0||, 1)`
3. For educational purposes, document why certain criteria were excluded

**Severity:** SIGNIFICANT - Missing standard safeguards, but existing criteria are sufficient for educational purposes.

---

### 4. Incorrect Step Size Calculation for xtol

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:239-249`

**Claim:** Uses "scipy-style: average absolute step per dimension"

**Actual implementation:**
```typescript
// newton.ts:240-248
const step = sub(wNew, w);
const stepSize = norm(step);
const dimension = w.length;
// Use RMS step size per dimension (similar to scipy's L1/dimension but with L2 norm)
const avgStepSize = stepSize / Math.sqrt(dimension);
if (avgStepSize < xtol && terminationReason === null) {
  terminationReason = 'xtol';
}
```

**Issue:** The comment claims this is "similar to scipy's L1/dimension" but it's actually computing L2/sqrt(dimension), which is NOT what scipy does.

**Scipy's actual xtol check (from TNC documentation):**
> "Precision goal for the value of x in the stopping criterion (after applying x scaling factors)"

**Scipy L-BFGS-B actual behavior:**
- Uses maximum absolute change in any parameter (L∞ norm)
- OR uses scaled parameter changes based on the problem's natural scale

**Problem:**
1. The formula `L2_norm / sqrt(dimension)` is neither L1/dimension nor L∞ nor scipy's actual approach
2. The scaling by sqrt(dimension) makes the criterion dimension-dependent in a non-standard way
3. For high-dimensional problems, this will be too loose; for 2D, it's stricter than claimed

**Mathematical analysis:**
- For uniform step of size s in all dimensions: `L2/sqrt(d) = s*sqrt(d)/sqrt(d) = s` ✓
- For step only in one dimension: `L2/sqrt(d) = s/sqrt(d)` ← This is d-dependent!
- scipy's approach: would check `max(|Δx_i|) < xtol` regardless of dimension

**Recommendation:**
1. Either implement scipy's actual approach (L∞ norm or properly scaled parameters)
2. OR clearly document that this is a custom RMS-based criterion, not scipy-compatible
3. OR compute final relative step size correctly per scipy: `||Δx|| / max(||x||, 1)`

**Severity:** SIGNIFICANT - The comment claims scipy compatibility but implements a different formula.

---

## MODERATE Issues

### 5. Relative Function Change Denominator Choice

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:186-192`, Lines 294-300

**Implementation:**
```typescript
// During iteration (line 188):
const relativeFuncChange = funcChange / Math.max(Math.abs(loss), 1e-8);

// Final summary (line 299):
const finalFunctionChange = absoluteFuncChange !== undefined
  ? absoluteFuncChange / Math.max(Math.abs(finalLoss), 1e-8)
  : undefined;
```

**Observation:** Uses `max(|f(x_k)|, 1e-8)` as denominator.

**Alternative approaches in literature:**
1. **scipy L-BFGS-B:** `(f^k - f^{k+1})/max{|f^k|, |f^{k+1}|, 1}`
2. **Boyd & Vandenberghe:** Stop when Newton decrement λ²/2 ≤ ε (different metric entirely)
3. **Nocedal & Wright:** `|f_k - f_{k-1}| / (1 + |f_k|)`

**Issues with current approach:**
1. **Asymmetric:** Uses only current loss, not max of current and previous
2. **Small epsilon:** 1e-8 is very small; scipy uses 1 as the floor
3. **Division by near-zero:** When loss → 0 (which is common near minimum), the denominator → 1e-8, making relative change appear very large

**Example problematic scenario:**
```
Iteration k:   loss = 1e-9,  prev_loss = 1e-8
Change: |1e-9 - 1e-8| = 9e-9
Relative: 9e-9 / max(1e-9, 1e-8) = 9e-9 / 1e-8 = 0.9 = 90% change!
```
This would NOT trigger ftol even though both values are essentially zero.

**scipy's approach is better:**
```
Relative: 9e-9 / max(1e-9, 1e-8, 1) = 9e-9 / 1 = 9e-9 → triggers ftol
```

**Recommendation:**
1. Change denominator to match scipy: `max(|f^k|, |f^{k+1}|, 1.0)`
2. This prevents division by near-zero and handles zero-minimum problems correctly
3. Update both the iteration check (line 188) and final summary (line 299)

**Severity:** MODERATE - Works correctly for most cases but can misbehave when loss approaches zero.

---

### 6. Step Size Relative Normalization

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:295-297`

**Implementation:**
```typescript
const finalStepSize = absoluteStepSize !== undefined
  ? absoluteStepSize / Math.max(norm(finalLocation), 1.0)
  : undefined;
```

**Issue:** Uses `max(||x||, 1)` as normalization, which is reasonable but differs from the xtol check used during iterations.

**Inconsistency:**
- **During iteration (line 245):** `avgStepSize = stepSize / Math.sqrt(dimension)`
- **Final summary (line 296):** `finalStepSize = stepSize / max(||x||, 1)`

**These are two different normalizations!**

**Impact:**
1. The value shown in the termination message won't match the value used in the xtol check
2. Confusing for users trying to understand why xtol was triggered
3. The xtol check doesn't account for parameter scale at all

**Recommendation:**
1. Make them consistent: use the same formula in both places
2. Prefer scipy's approach: consider using `||Δx|| / max(||x||, 1)` everywhere
3. OR document clearly why they differ (e.g., one for checking, one for reporting)

**Severity:** MODERATE - Causes confusion but doesn't affect correctness of algorithm.

---

### 7. Tolerance Value Justification (Documentation Issue)

**Location:** `/Users/eph/newtons-method/docs/workflows/numerical.md:314-326`

**Claims:**
```markdown
### Loss Difference
- `< 1%` → PASS
- `1-10%` → SUSPICIOUS
- `> 10%` → FAIL

### Position Difference (L2 norm)
- `< 0.1` → PASS
- `0.1-1.0` → SUSPICIOUS
- `> 1.0` → FAIL

### Iteration Count Ratio
- `< 3x` → PASS
- `> 3x` → SUSPICIOUS
```

**Issue:** These thresholds appear arbitrary and lack justification or citation.

**Questions raised:**
1. Why 1% and 10% for loss difference? Why not 0.1% and 5%?
2. Why 0.1 and 1.0 for position difference? What units are assumed?
3. Why 3x for iteration ratio? Why not 2x or 5x?

**Observations from the code:**
- Actual tolerance values used: `gtol=1e-5`, `ftol=2.22e-9`, `xtol=1e-5` (from UnifiedVisualizer.tsx:74-76)
- Python validation uses: `tol=1e-6` (from validate_with_python.py:34)
- These are reasonable values in line with scipy defaults

**But validation thresholds are different:**
- Loss difference 1-10% is MUCH looser than ftol=2.22e-9 (which is ~2e-7 %)
- Position difference 0.1 is dimensionless - what if parameters are O(1000)?

**Recommendation:**
1. Add citations or reasoning for threshold choices
2. Consider making thresholds relative to the tolerance parameters used
3. Example: PASS if loss difference < 10×ftol, FAIL if > 1000×ftol
4. For position: use relative error `||x_ts - x_scipy|| / ||x_scipy||` with thresholds like 1e-3, 1e-2

**Severity:** MODERATE - Validation framework works but lacks theoretical justification.

---

### 8. Default ftol Value is Unusual

**Location:** `/Users/eph/newtons-method/src/UnifiedVisualizer.tsx:75`

**Implementation:**
```typescript
const [newtonFtol, setNewtonFtol] = useState(2.22e-9);
```

**Issue:** The value `2.22e-9` is suspiciously specific and unusual.

**Analysis:**
- This appears to be related to machine epsilon: `2.22e-16` is approximately double-precision epsilon
- `2.22e-9 ≈ sqrt(2.22e-16) ≈ sqrt(machine_epsilon)`
- This IS a reasonable default for ftol (scipy documentation mentions sqrt(eps) for some tolerances)

**BUT:**
1. No comment explains this choice
2. It's not exactly sqrt(eps): `Math.sqrt(2.220446049250313e-16) = 1.4901161193847656e-8`
3. Inconsistent with gtol=1e-5 and xtol=1e-5 (which are more intuitive values)

**scipy's defaults:**
- L-BFGS-B ftol: related to `factr` parameter, default `factr=1e7` → `ftol ≈ 1e7 * 2.22e-16 = 2.22e-9` ✓
- This actually IS scipy's default!

**Recommendation:**
1. Add a comment explaining this is scipy L-BFGS-B's default ftol
2. Document why it differs from gtol/xtol (different methods use different scales)
3. Consider allowing users to understand the relationship: `ftol = factr * machine_epsilon`

**Severity:** MODERATE - Correct value but poorly documented, causing confusion.

---

## MINOR Issues

### 9. Incomplete Convergence Flag Logic

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:303-305`

**Implementation:**
```typescript
const converged = ['gradient', 'ftol', 'xtol'].includes(terminationReason);
const diverged = terminationReason === 'diverged';
const stalled = ['ftol', 'xtol'].includes(terminationReason);
```

**Observations:**
1. `converged` is true for gradient, ftol, OR xtol
2. `stalled` is true for ftol OR xtol
3. This means: `stalled ⊂ converged` (stalled implies converged)

**Potential confusion:**
- If something is "stalled," how can it also be "converged"?
- The flags are not mutually exclusive
- Users checking `if (summary.converged && !summary.stalled)` get only gradient-based convergence

**Alternative design:**
```typescript
const converged = terminationReason === 'gradient';
const stoppedDueToTolerance = ['ftol', 'xtol'].includes(terminationReason);
const diverged = terminationReason === 'diverged';
const hitMaxIter = terminationReason === 'maxiter';
```

**Recommendation:**
1. Either make flags mutually exclusive OR document the overlap clearly
2. Rename `stalled` to `toleranceBasedConvergence` or similar
3. Add JSDoc comments explaining the flag semantics

**Severity:** MINOR - Confusing but not incorrect; can be clarified with documentation.

---

### 10. Gradient Tolerance is Absolute, Not Relative

**Location:** `/Users/eph/newtons-method/src/algorithms/types.ts:41`, `/Users/eph/newtons-method/src/algorithms/newton.ts:180`

**Implementation:**
```typescript
export interface TerminationThresholds {
  gtol?: number;      // Gradient norm tolerance (absolute)
  // ...
}

// In newton.ts:
if (gradNorm < gtol) {
  terminationReason = 'gradient';
}
```

**Issue:** Using absolute gradient tolerance can be scale-dependent.

**Problem scenarios:**
1. **Large-scale problems:** If objective values are O(1e6), gradients might naturally be O(1e3), and gtol=1e-5 would never trigger
2. **Tiny-scale problems:** If objective is O(1e-10), gradients might be O(1e-8), and gtol=1e-5 triggers immediately

**Standard alternatives:**
1. **Relative to initial gradient:** `||grad|| < gtol * ||grad_0||`
2. **Relative to function value:** `||grad|| < gtol * max(|f(x)|, 1)`
3. **scipy approach:** Projects gradient onto feasible region, uses absolute threshold but with scaling

**Current default:** gtol=1e-5 (from UnifiedVisualizer.tsx:74)

**Is this a problem for this codebase?**
- Probably not: All test problems are scaled such that loss is O(1) to O(100)
- Educational context: absolute tolerance is simpler to understand
- Can be worked around by user setting gtol appropriately

**Recommendation:**
1. Document that gtol is absolute and scale-dependent
2. For robustness, consider adding relative option: `gtol_rel` and `gtol_abs`, use both
3. OR provide guidance in docs: "Choose gtol ≈ 1e-6 for problems with loss O(1)"

**Severity:** MINOR - Works fine for current problem scale; mainly a documentation issue.

---

### 11. No Check for Zero Gradient at Start

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:148-183`

**Issue:** If user provides initial point at a critical point (grad = 0), the algorithm immediately terminates with "converged."

**Scenario:**
```typescript
initialPoint = [0, 0]  // If this is a critical point
iter 0: gradNorm = 0 < gtol → terminationReason = 'gradient'
iterations.length = 1  // Only one "iteration" recorded
```

**Is this correct?**
- Mathematically: yes, it's at a stationary point
- Practically: probably not what user wanted (started AT the critical point)
- Educational: confusing - "converged in 0 iterations"?

**Standard practice:**
- Many optimizers check if `||grad_0|| < gtol` and issue a warning: "Initial point is already optimal"
- OR use relative gradient convergence: `||grad|| < gtol * ||grad_0||` (which would require `||grad_0|| > 0`)

**Recommendation:**
1. Add special case: if `iter === 0 && gradNorm < gtol`, set different message
2. OR use relative gradient tolerance to avoid this edge case
3. Educationally useful: show a warning "Initial point is already a critical point"

**Severity:** MINOR - Edge case that rarely occurs in practice.

---

### 12. Missing NaN/Inf Check on Hessian Eigenvalues

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:153-157`

**Implementation:**
```typescript
const eigenvalues = computeEigenvalues(hessian);
const conditionNumber = Math.abs(eigenvalues[0]) / Math.abs(eigenvalues[eigenvalues.length - 1]);

// Early divergence detection
if (!isFinite(loss) || !isFinite(gradNorm)) {
  terminationReason = 'diverged';
  // ...
}
```

**Issue:** Checks if loss and gradNorm are finite, but NOT eigenvalues or conditionNumber.

**Potential problem:**
- If Hessian computation produces NaN, eigenvalues will be NaN
- conditionNumber will be NaN
- But algorithm continues and stores these in iteration data
- Only diverges later when loss becomes NaN (which might not happen if line search is conservative)

**Recommendation:**
1. Add check: `!isFinite(conditionNumber)` to divergence detection
2. OR check: `eigenvalues.some(λ => !isFinite(λ))`
3. Fail fast if Hessian computation produces invalid values

**Severity:** MINOR - Defensive programming improvement; Hessian usually doesn't produce NaN unless problem is already diverged.

---

## VERIFIED CORRECT

### 1. ✓ Relative Function Change Formula Structure

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:186-192`

The formula `|f_k - f_{k-1}| / max(|f_k|, epsilon)` is a standard and reasonable approach for relative function change, even if the epsilon value could be improved (see Moderate Issue #5).

**Matches:** Standard optimization literature and scipy's general approach.

---

### 2. ✓ NaN/Inf Detection

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:157-177`

The code correctly detects divergence via `!isFinite(loss) || !isFinite(gradNorm)` and stores the problematic iteration before breaking. This is good practice.

**Matches:** Industry standard for numerical stability checks.

---

### 3. ✓ Termination Priority Order

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:274-282`

The algorithm correctly checks termination conditions in order and breaks immediately when any condition is met. The priority is:
1. Divergence (NaN/Inf) - checked first
2. Gradient convergence
3. Function change stalling (ftol)
4. Step size stalling (xtol)
5. Max iterations (fallback)

This ordering is sensible: divergence is highest priority, then optimality conditions, then resource limits.

**Matches:** Standard practice in optimization software.

---

### 4. ✓ Iteration History Preservation

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:160-176, 251-266`

Even when divergence is detected, the code stores the iteration data before breaking. This is excellent for debugging and educational purposes - users can see exactly where things went wrong.

---

### 5. ✓ Hessian Damping Implementation

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:194-197`

```typescript
const dampedHessian = hessian.map((row, i) =>
  row.map((val, j) => i === j ? val + hessianDamping : val)
);
```

This correctly implements Levenberg-Marquardt damping: H_damped = H + λI. The damping is only added to diagonal elements, which is mathematically correct.

**Matches:** Standard Levenberg-Marquardt regularization (Nocedal & Wright, Chapter 10).

---

### 6. ✓ Fallback to Gradient Descent When Hessian Singular

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:200-208`

```typescript
if (HInv === null) {
  // If Hessian is singular, fall back to gradient descent
  direction = scale(grad, -1);
}
```

This is a reasonable safeguard for when the damped Hessian is still singular (rare but possible). Using gradient descent as fallback is a standard practice.

---

### 7. ✓ Stopping Criterion is AND, Not OR

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:189, 247`

The code uses `&& terminationReason === null` when checking ftol and xtol, ensuring only ONE termination reason is recorded (the first one to trigger). This is correct - want to know which criterion was met first.

---

### 8. ✓ Previous Values Stored Correctly

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:269-271`

```typescript
previousLoss = loss;  // Store BEFORE-step loss for next iteration's comparison
previousW = [...w];
w = wNew;
```

The comment correctly notes that `previousLoss` stores the before-step loss, which is used in the NEXT iteration to compute function change. The order is correct.

---

### 9. ✓ Summary Computation Uses Final Values

**Location:** `/Users/eph/newtons-method/src/algorithms/newton.ts:285-288`

```typescript
const lastIter = iterations[iterations.length - 1];
const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
const finalLoss = lastIter ? lastIter.newLoss : Infinity;
const finalLocation = lastIter ? lastIter.wNew : w;
```

Correctly uses `newLoss` (after-step) and `wNew` (after-step) for final summary, not the before-step values. Uses safe fallbacks if no iterations exist.

---

### 10. ✓ Termination Message Generation

**Location:** `/Users/eph/newtons-method/src/algorithms/terminationUtils.ts:8-37`

The `getTerminationMessage` function correctly formats scientific notation and includes the actual values alongside tolerances. Messages are informative and helpful for debugging.

Example: `"Converged: gradient norm 4.71e-09 < 1.00e-05"`

---

## SUMMARY OF FINDINGS

| Category | Count | Severity |
|----------|-------|----------|
| **CRITICAL** | 1 | Gradient norm alone cannot guarantee optimality (saddle points) |
| **SIGNIFICANT** | 4 | Misleading terminology, missing criteria, incorrect formulas |
| **MODERATE** | 4 | Suboptimal choices, documentation gaps |
| **MINOR** | 4 | Edge cases, defensive programming improvements |
| **VERIFIED CORRECT** | 10 | Core algorithm logic, numerical safeguards |

**Overall Assessment:**
The implementation is fundamentally sound with good numerical practices, but has one critical mathematical issue (saddle point convergence) and several terminology/documentation problems that reduce educational clarity. The "scipy-style" claims need revision as some formulas differ from scipy's actual implementation.

---

## SOURCES CONSULTED

### Official Documentation
1. **scipy.optimize documentation** (v1.16.2)
   - minimize() reference: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.minimize.html
   - L-BFGS-B reference: https://docs.scipy.org/doc/scipy/reference/optimize.minimize-lbfgsb.html
   - TNC reference: https://docs.scipy.org/doc/scipy/reference/optimize.minimize-tnc.html
   - OptimizeResult: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.OptimizeResult.html

2. **scipy source code**
   - _lbfgsb_py.py: https://github.com/scipy/scipy/blob/main/scipy/optimize/_lbfgsb_py.py

### Academic Sources
3. **Boyd & Vandenberghe, "Convex Optimization"** (2004)
   - Chapter 9: Unconstrained minimization, Newton's method
   - Newton decrement stopping criterion: λ²/2 ≤ ε
   - Book website: https://stanford.edu/~boyd/cvxbook/

4. **Nocedal & Wright, "Numerical Optimization"** (2nd edition)
   - Referenced in multiple search results for stopping criteria
   - Second-order optimality conditions
   - Gradient norm behavior and limitations

### Research Literature
5. **Ryan Tibshirani, CMU 10-725 Convex Optimization Lectures**
   - Lecture 14: Newton's Method
   - Newton decrement, stopping criteria
   - Available at: https://www.stat.cmu.edu/~ryantibs/convexopt/lectures/newton.pdf

6. **Academic papers on saddle points:**
   - "Identifying and attacking the saddle point problem in high-dimensional non-convex optimization"
   - Multiple sources documenting Newton's method's attraction to saddle points

### Community Resources
7. **Stack Overflow discussions:**
   - "Which absolute and/or relative stopping criteria do use for Newton's method?" (Computational Science SE)
   - "What is the difference between xtol and ftol to use fmin() of scipy.optimize?"
   - Multiple discussions on scipy tolerance meanings and best practices

8. **GitHub Issues:**
   - scipy/scipy #7593: "Meaning of `tol` argument in scipy.optimize.minimize is not explained in docs"
   - scipy/scipy #15179: "ENH: optimize: adding a gradient tolerance to SLSQP"

### Standards & Best Practices
9. **Numerical optimization textbooks** (multiple sources)
   - Consensus on first-order vs second-order optimality conditions
   - Standard stopping criteria: gradient norm, function change, parameter change
   - Typical tolerance values: 1e-6 to 1e-8 for most applications

---

## RECOMMENDATIONS PRIORITY

### Immediate Action Required (CRITICAL)
1. ✓ Fix "optimal convergence" claim for gradient criterion
   - Add second-order optimality check OR change terminology to "first-order stationary point"
   - Warn users when converging to saddle point (negative eigenvalues present)

### High Priority (SIGNIFICANT)
2. ✓ Revise "stalled" terminology to match scipy usage
   - Change to "converged" or neutral terminology
   - Update documentation to clarify these are valid convergence modes

3. ✓ Fix xtol formula or documentation
   - Either implement scipy's actual approach OR clearly state this is custom
   - Remove misleading "scipy-style" comment if using different formula

4. ✓ Improve ftol denominator per scipy standard
   - Use `max(|f^k|, |f^{k+1}|, 1)` instead of `max(|f^k|, 1e-8)`

### Medium Priority (MODERATE)
5. ○ Document tolerance value choices
   - Explain validation thresholds (1%, 0.1, 3x)
   - Add justification or citations

6. ○ Make step size calculations consistent
   - Same formula for xtol check and final summary reporting

7. ○ Add comment explaining ftol default value
   - Document that 2.22e-9 matches scipy L-BFGS-B default

### Low Priority (MINOR)
8. ○ Improve documentation of convergence flags
   - Clarify overlap between `converged` and `stalled`

9. ○ Add relative gradient option
   - Document current absolute tolerance limitations

10. ○ Add special handling for zero-gradient initial point

11. ○ Add NaN check for Hessian eigenvalues

---

**Review completed:** 2025-11-09
**Next steps:** Address CRITICAL and SIGNIFICANT issues before claiming mathematical correctness
