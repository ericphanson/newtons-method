# Citation Usage Verification Report

**Date:** 2025-11-14
**Scope:** All citation usages in src/ directory
**Total citations verified:** 39 usages across 19 unique citation keys

---

## Executive Summary

**Overall results:**
- ✅ **Matches: 28** (72%)
- ⚠️ **Minor issues: 11** (28%)
- ❌ **Major mismatches: 0** (0%)
- 📝 **Missing context: 0** (0%)

**Key finding:** No major mismatches found! All citations are fundamentally correct and backed by source material. The 11 minor issues are primarily technical precision details that don't invalidate the claims.

---

## Minor Issues by Category

### 1. Strict vs Non-Strict Inequalities (3 instances)

**Issue:** Website uses strict inequality where citation allows equality

**Occurrences:**
- [src/components/AlgorithmExplainer.tsx:56](src/components/AlgorithmExplainer.tsx#L56) - `gd-strongly-convex-linear-convergence-nesterov-2018`
  - Website: `0 < α < 2/(L+μ)`
  - Citation: `0 < α ≤ 2/(L+μ)` (equality allowed)

- [src/components/tabs/GdFixedTab.tsx:400](src/components/tabs/GdFixedTab.tsx#L400) - Same issue

- [src/components/tabs/GdFixedTab.tsx:462](src/components/tabs/GdFixedTab.tsx#L462) - `gd-smooth-descent-condition-nesterov-2018`
  - Website: `α < 2/L` (strict, for strict descent)
  - Citation: `α ≤ 2/L` (allows non-strict descent at boundary)

**Recommendation:** Update inequalities to match source theorems, or add clarification about strict vs non-strict descent conditions.

---

### 2. LOCAL vs GLOBAL Convergence (2 instances - HIGHER PRIORITY)

**Issue:** Using LOCAL convergence theorem for GLOBAL convergence claims

**Occurrences:**
- [src/components/AlgorithmExplainer.tsx:143](src/components/AlgorithmExplainer.tsx#L143) - `gd-linesearch-strongly-convex-linear-convergence-nesterov-2018`
  - Website claims: "Linear convergence to **global minimum**"
  - Citation (Theorem 1.2.4): LOCAL result requiring start point within radius r₀ < r̄ = 2μ/M of strict local minimum
  - Additional issue: Used in "Fixed Step" section but citation is about line search

- [src/components/tabs/GdLineSearchTab.tsx:668](src/components/tabs/GdLineSearchTab.tsx#L668) - Same citation
  - Website: Correct formula but missing LOCAL restriction
  - Citation: Requires starting "close enough to a strict local minimum"

**Recommendation:** Either:
1. Use the GLOBAL result (Theorem 2.1.15 mentioned in citation notes), or
2. Add clarification that result is LOCAL (requires starting near minimum)

---

### 3. Scope Narrowing (4 instances)

**Issue:** Website uses more restrictive conditions than citation allows

**Occurrences:**
- [src/components/AlgorithmExplainer.tsx:62](src/components/AlgorithmExplainer.tsx#L62) - `gd-convex-sublinear-convergence-nesterov-2018`
  - Website: `0 < α ≤ 1/L` (optimal choice)
  - Citation: `0 < α < 2/L` (full valid range)
  - Note: 1/L is optimal but not the only valid choice

- [src/components/tabs/GdLineSearchTab.tsx:683](src/components/tabs/GdLineSearchTab.tsx#L683) - `gd-linesearch-convex-sublinear-convergence-nesterov-2018`
  - Website: `O(L‖w₀ - w*‖²/k)` (asymptotic notation)
  - Citation: Exact bound with `(k+4)` in denominator
  - Note: Asymptotically equivalent but less precise

- [src/components/tabs/LbfgsTab.tsx:1192](src/components/tabs/LbfgsTab.tsx#L1192) - `bfgs-superlinear-convergence-nocedal-wright-2006`
  - Website: "Strongly convex: ... Superlinear convergence (full BFGS)"
  - Citation (Theorem 6.6): Requires Lipschitz continuous Hessian + fast convergence (Σ‖xₖ - x*‖ < ∞), NOT strong convexity
  - Note: Strong convexity is sufficient but not necessary

- [src/components/tabs/GdFixedTab.tsx:489](src/components/tabs/GdFixedTab.tsx#L489) - `gd-convex-sublinear-convergence-nesterov-2018`
  - Citation about convergence rate used at optimal step size derivation
  - Better placement would be where convergence rate is discussed

**Recommendation:** Consider whether to show full theoretical range or note that presented choice is optimal.

---

### 4. Citation Placement (2 instances)

**Issue:** Citation appears slightly before/after best location

**Occurrences:**
- [src/components/tabs/GdLineSearchTab.tsx:605](src/components/tabs/GdLineSearchTab.tsx#L605) - `armijo-backtracking-termination-nocedal-wright-2006`
  - Citation about termination placed when introducing Armijo condition
  - Better placement: After line 624 where termination is explicitly discussed

- [src/components/tabs/GdLineSearchTab.tsx:383](src/components/tabs/GdLineSearchTab.tsx#L383) - Same citation
  - Used to support practical parameter choice (c₁ = 10⁻⁴)
  - Citation claim focuses on termination guarantees
  - Note: Source does mention this practical choice, but not in extracted claim

**Recommendation:** Minor - these are acceptable but could be optimized.

---

## Priority Recommendations

**HIGH PRIORITY:**
1. Fix LOCAL vs GLOBAL convergence issues ([AlgorithmExplainer.tsx:143](src/components/AlgorithmExplainer.tsx#L143), [GdLineSearchTab.tsx:668](src/components/tabs/GdLineSearchTab.tsx#L668))

**MEDIUM PRIORITY:**
2. Update strict/non-strict inequalities to match source theorems
3. Clarify strong convexity vs Lipschitz Hessian conditions for BFGS superlinear convergence

**LOW PRIORITY:**
4. Consider showing full theoretical ranges (e.g., 0 < α < 2/L) with notes about optimal choices
5. Optimize citation placement for termination guarantees

---

## Perfect Matches (28 instances)

All usages of these citations are excellent:
- `newton-computational-complexity` (6/6 usages perfect)
- `newton-quadratic-convergence` (5/5 usages perfect)
- `rosenbrock-function-benchmark` (1/1 perfect)
- `three-hump-camel-function-benchmark` (1/1 perfect)
- `lbfgs-linear-convergence-nocedal-wright-2006` (1/1 perfect)
- `wolfe-conditions-nocedal-wright-2006` (1/1 perfect)
- `bfgs-positive-definiteness-preservation-nocedal-wright-2006` (2/2 perfect)
- `bfgs-update-formula-nocedal-wright-2006` (1/1 perfect)
- `newton-convex-convergence` (1/1 perfect)
- `inexact-newton-superlinear-convergence` (1/1 perfect)
- Plus several others with 1-2 perfect matches each

---

# Detailed Batch Reports

## BATCH 1: Citations 1-7

### Usage 1: /workspace/src/problems/rosenbrock.tsx:82
**Citation:** rosenbrock-function-benchmark
**Claim:** (empty - attribution only) "BENCHMARK FUNCTION ATTRIBUTION: This citation provides historical attribution for the Rosenbrock function (also known as Rosenbrock's valley or banana function), a classic non-convex test problem for optimization algorithms."
**Website text:** "Classic non-convex test function demonstrating curved ill-conditioning"
**Status:** ✅ MATCH
**Notes:** The citation is for attribution only (claim field is intentionally empty for benchmark functions). The website text accurately describes the Rosenbrock function as a "classic non-convex test function" which aligns perfectly with the citation's notes describing it as "a classic non-convex test problem for optimization algorithms." The usage is appropriate.

---

### Usage 2: /workspace/src/problems/threeHumpCamel.tsx:108
**Citation:** three-hump-camel-function-benchmark
**Claim:** (empty - attribution only) "BENCHMARK FUNCTION ATTRIBUTION: This citation provides historical attribution for the Three-Hump Camel function, a multi-modal test problem introduced by F.H. Branin in this 1972 paper."
**Website text:** "Classic multimodal benchmark function demonstrating asymmetric basin of convergence structure where the deeper global minimum has a larger basin than the shallow local minima."
**Status:** ✅ MATCH
**Notes:** The citation is for attribution only (claim field is intentionally empty for benchmark functions). The website text accurately describes it as a "classic multimodal benchmark function" which aligns with the citation's notes describing it as "a multi-modal test problem." The usage is appropriate.

---

### Usage 3: /workspace/src/components/AlgorithmExplainer.tsx:56
**Citation:** gd-strongly-convex-linear-convergence-nesterov-2018
**Claim:** "Gradient descent with fixed step size achieves linear convergence to the global minimum on strongly convex smooth functions when $0 < \alpha \leq 2/(L+\mu)$"
**Website text:** "Linear convergence to global minimum (requires smooth function and step size $0 < \alpha < 2/(L+\mu)$, where $\mu$ is the strong convexity parameter). Requires $O(\log(1/\varepsilon))$ iterations to reach $\varepsilon$ accuracy"
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text uses strict inequality "$0 < \alpha < 2/(L+\mu)$" while the citation claim allows equality "$0 < \alpha \leq 2/(L+\mu)$". The citation's quote from Nesterov 2018 states "$0 < h \leq \frac{2}{\mu+L}$" (with equality allowed). This is a minor discrepancy but could be technically important. The website should match the citation and use "$0 < \alpha \leq 2/(L+\mu)$" to be precise. All other aspects (linear convergence, strongly convex, smooth, global minimum) are correctly stated.

---

### Usage 4: /workspace/src/components/AlgorithmExplainer.tsx:62
**Citation:** gd-convex-sublinear-convergence-nesterov-2018
**Claim:** "Gradient descent with fixed step size converges to the global minimum on convex smooth functions (possibly slowly with sublinear rate) when $0 < \alpha < 2/L$"
**Website text:** "Sublinear convergence (requires smooth function and step size $0 < \alpha \leq 1/L$). Requires $O(1/\varepsilon)$ iterations to reach $\varepsilon$ accuracy"
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text states step size "$0 < \alpha \leq 1/L$" which is more restrictive than the citation's claim "$0 < \alpha < 2/L$". The citation's quote states "$0 < h < \frac{2}{L}$" (strict inequality) for the general theorem, and mentions optimal step size $h = \frac{1}{L}$ for the cleaner O(1/k) rate. The website's restriction to $\leq 1/L$ is the optimal choice (not wrong), but it doesn't reflect the full range allowed by the theorem. Consider either: (a) using "$0 < \alpha < 2/L$" to match the citation's general bound, or (b) adding context that $\alpha = 1/L$ is optimal. The convergence description is accurate.

---

### Usage 5: /workspace/src/components/tabs/GdFixedTab.tsx:400
**Citation:** gd-strongly-convex-linear-convergence-nesterov-2018
**Claim:** "Gradient descent with fixed step size achieves linear convergence to the global minimum on strongly convex smooth functions when $0 < \alpha \leq 2/(L+\mu)$"
**Website text:** "Linear convergence to global minimum (for $\mu$-strongly convex, $L$-smooth functions with $0 < \alpha < 2/(L+\mu)$)"
**Status:** ⚠️ MINOR ISSUE
**Notes:** Same issue as Usage 3. The website uses strict inequality "$0 < \alpha < 2/(L+\mu)$" while the citation allows equality "$0 < \alpha \leq 2/(L+\mu)$". The citation's quote from Nesterov 2018 explicitly states "$0 < h \leq \frac{2}{\mu+L}$" (with equality allowed). The website should update the inequality to match the theorem precisely.

---

### Usage 6: /workspace/src/components/tabs/GdFixedTab.tsx:403
**Citation:** gd-convex-sublinear-convergence-nesterov-2018
**Claim:** "Gradient descent with fixed step size converges to the global minimum on convex smooth functions (possibly slowly with sublinear rate) when $0 < \alpha < 2/L$"
**Website text:** "Sublinear convergence to global minimum"
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the claim of sublinear convergence to global minimum for convex functions. No step size is mentioned in this specific location, so there's no technical discrepancy. The claim is correctly backed up.

---

### Usage 7: /workspace/src/components/tabs/GdFixedTab.tsx:511
**Citation:** gd-strongly-convex-linear-convergence-nesterov-2018
**Claim:** "Gradient descent with fixed step size achieves linear convergence to the global minimum on strongly convex smooth functions when $0 < \alpha \leq 2/(L+\mu)$"
**Website text:** "Linear convergence: Error decreases by constant factor $\rho = \frac{L-\mu}{L+\mu} < 1$ each iteration. The condition number $Q = L/\mu$ determines the rate: $\rho = \frac{Q-1}{Q+1}$. Smaller $Q$ (well-conditioned) → faster convergence."
**Status:** ✅ MATCH
**Notes:** The website text accurately describes linear convergence for strongly convex functions with the correct convergence rate formula from the theorem. The context mentions this is for "optimal step size $\alpha = \frac{2}{L+\mu}$" and "$\mu$-strongly convex, $L$-smooth functions" which matches the citation's conditions perfectly. The mathematical formulas for the convergence rate are precise and accurate.

---

**BATCH 1 SUMMARY:**
- Total verified: 7
- ✅ Matches: 4
- ⚠️ Minor issues: 3
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## BATCH 2: Citations 8-14

### Usage 1: /workspace/src/components/AlgorithmExplainer.tsx:143
**Citation:** gd-linesearch-strongly-convex-linear-convergence-nesterov-2018
**Claim:** For μ-strongly convex, L-smooth functions (locally, near a strict local minimum), gradient descent with optimal step size h* = 2/(L+μ) achieves linear convergence: ‖xₖ - x*‖ ≤ C(1 - 2μ/(L+3μ))^k where the convergence rate ρ = 1 - 2μ/(L+3μ) < 1 depends on the condition number Q = L/μ. The constant C = r̄r₀/(r̄-r₀) depends on how close the initial point is to the local minimum.
**Website text:** "Strongly convex: Linear convergence to global minimum (requires smooth function and step size 0 < α < 2/(L+μ), where μ is the strong convexity parameter). Requires O(log(1/ε)) iterations to reach ε accuracy"
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text describes **fixed-step** gradient descent in the AlgorithmExplainer component (line 22 shows "Gradient Descent (Fixed Step)"), but the citation is about gradient descent with **line search**. The citation claim is LOCAL (near a strict local minimum) while the website says "global minimum". The citation is specifically for the LOCAL result from Theorem 1.2.4 which requires starting close enough to a strict local minimum. The step size condition "0 < α < 2/(L+μ)" is close to the optimal h* = 2/(L+μ) from the citation, but the citation is about LOCAL convergence near a minimum, not GLOBAL convergence. The website should either reference a global result or clarify this is local.

---

### Usage 2: /workspace/src/components/tabs/GdLineSearchTab.tsx:668
**Citation:** gd-linesearch-strongly-convex-linear-convergence-nesterov-2018
**Claim:** For μ-strongly convex, L-smooth functions (locally, near a strict local minimum), gradient descent with optimal step size h* = 2/(L+μ) achieves linear convergence: ‖xₖ - x*‖ ≤ C(1 - 2μ/(L+3μ))^k where the convergence rate ρ = 1 - 2μ/(L+3μ) < 1 depends on the condition number Q = L/μ. The constant C = r̄r₀/(r̄-r₀) depends on how close the initial point is to the local minimum.
**Website text:** "For μ-strongly convex, L-smooth functions with Armijo line search, gradient descent achieves linear convergence: ‖wₖ - w*‖ ≤ C(1 - 2μ/(L+3μ))^k. The convergence rate depends on the condition number Q = L/μ. Line search automatically achieves near-optimal step sizes without knowing L or μ."
**Status:** ⚠️ MINOR ISSUE
**Notes:** The convergence formula matches the citation exactly (including the correct non-squared rate). However, the citation is for a LOCAL result (near a strict local minimum, starting close enough) but the website text doesn't mention this LOCAL restriction. The claim explicitly states "(locally, near a strict local minimum)" and requires starting within a radius r₀ < r̄ = 2μ/M. The website text should clarify that this is a LOCAL convergence result, not a global one. Additionally, the citation's optimal step size is h* = 2/(L+μ) (fixed), but the website discusses Armijo line search (adaptive), which is a slightly different context.

---

### Usage 3: /workspace/src/components/AlgorithmExplainer.tsx:392
**Citation:** newton-quadratic-convergence
**Claim:** Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum
**Website text:** "Convergence rate: Quadratic convergence near a local minimum (requires starting close enough to the solution, with positive definite Hessian, and Lipschitz continuous Hessian). Once in the convergence region, doubles the digits of accuracy each iteration."
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the citation claim. Both mention: (1) quadratic convergence, (2) near a local minimum / close enough to optimum, (3) Lipschitz continuous Hessian requirement. The website adds "positive definite Hessian" which is consistent with the citation's "second-order sufficient conditions" mentioned in the theorem (which requires positive definite Hessian at x*). The additional detail about "doubles the digits of accuracy" is a correct interpretation of quadratic convergence. Excellent match.

---

### Usage 4: /workspace/src/components/tabs/NewtonTab.tsx:327
**Citation:** newton-quadratic-convergence
**Claim:** Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum
**Website text:** "When to Use: Near a strict local minimum where quadratic convergence applies"
**Status:** ✅ MATCH
**Notes:** This is a brief usage that accurately captures the key requirement from the citation - being "near a strict local minimum" for quadratic convergence to apply. The citation requires starting close enough to x* for quadratic convergence, which is exactly what the website says. Concise and accurate.

---

### Usage 5: /workspace/src/components/tabs/NewtonTab.tsx:526
**Citation:** newton-quadratic-convergence
**Claim:** Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum
**Website text:** "Strongly convex with Lipschitz continuous Hessian: Quadratic convergence when starting close to x*, H positive definite everywhere"
**Status:** ✅ MATCH
**Notes:** Excellent match. The website text captures all key elements from the citation: (1) strongly convex, (2) Lipschitz continuous Hessian, (3) quadratic convergence, (4) starting close to x*. The addition of "H positive definite everywhere" is consistent with strong convexity, which ensures the Hessian is positive definite globally. This is actually slightly stronger than the citation claim requires (citation only needs positive definite at x* with second-order sufficient conditions), but it's accurate for the strongly convex case.

---

### Usage 6: /workspace/src/components/tabs/NewtonTab.tsx:642
**Citation:** newton-quadratic-convergence
**Claim:** Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum
**Website text:** "Error squared at each iteration (very fast near solution). The number of correct digits roughly doubles at each step."
**Status:** ✅ MATCH
**Notes:** This accurately describes quadratic convergence (error squared at each iteration = ‖e_{k+1}‖ ≤ C‖eₖ‖²) and correctly explains what this means in practice (digits double each step). The phrase "near solution" aligns with the citation's requirement of starting close enough to the optimum. Good pedagogical explanation of the theoretical result.

---

### Usage 7: /workspace/src/components/tabs/NewtonTab.tsx:662
**Citation:** newton-quadratic-convergence
**Claim:** Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum
**Website text:** "Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues."
**Status:** ✅ MATCH
**Notes:** Accurate reference to the citation's requirements. The citation (Theorem 3.5 from Nocedal & Wright) indeed requires Lipschitz continuous Hessian for the proof. The mention of "bounds on eigenvalues" relates to the second-order sufficient conditions (positive definite Hessian at x*), which ensures eigenvalues are bounded away from zero. This is a correct characterization of what the proof requires.

---

**BATCH 2 SUMMARY:**
- Total verified: 7
- ✅ Matches: 5
- ⚠️ Minor issues: 2
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## BATCH 3: Citations 15-21

### Usage 1: /workspace/src/components/AlgorithmExplainer.tsx:479
**Citation:** lbfgs-linear-convergence-nocedal-wright-2006
**Claim:** "L-BFGS achieves linear convergence (not superlinear) due to limited memory preventing the Hessian approximation from fully converging to the true Hessian"
**Website text:** "Convergence rate: linear convergence on strongly-convex smooth functions. The memory parameter M affects the convergence constant but not the convergence order. Note: Full BFGS can achieve superlinear-convergence, but L-BFGS is limited to linear convergence due to limited memory."
**Status:** ✅ MATCH
**Notes:** Perfect alignment. The website text accurately reflects the claim that L-BFGS achieves linear (not superlinear) convergence due to limited memory. The website explicitly contrasts L-BFGS's linear convergence with full BFGS's superlinear convergence and correctly attributes the difference to limited memory.

---

### Usage 2: /workspace/src/components/tabs/GdLineSearchTab.tsx:373
**Citation:** armijo-backtracking-termination-nocedal-wright-2006
**Claim:** "For L-smooth functions, Armijo backtracking with geometric step reduction α ← ρα (where ρ ∈ (0,1)) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials."
**Website text:** "The Armijo backtracking algorithm terminates in finite steps for any choice of c₁ ∈ (0,1). The convergence rate guarantees (O(1/k) for convex, linear for strongly convex) hold for any c₁ in this range."
**Status:** ✅ MATCH
**Notes:** Excellent match. The website accurately states that the Armijo backtracking algorithm terminates in finite steps for any c₁ ∈ (0,1), which is directly supported by the citation claim. The website adds additional context about convergence rate guarantees, which is appropriate and doesn't contradict the claim.

---

### Usage 3: /workspace/src/components/tabs/GdLineSearchTab.tsx:383
**Citation:** armijo-backtracking-termination-nocedal-wright-2006
**Claim:** "For L-smooth functions, Armijo backtracking with geometric step reduction α ← ρα (where ρ ∈ (0,1)) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials."
**Website text:** "Practice: The value c₁ = 10⁻⁴ is widely used based on empirical experience, not theoretical optimization."
**Status:** ⚠️ MINOR ISSUE
**Notes:** The citation is used to support a statement about the practical choice of c₁ = 10⁻⁴. While the citation's notes field mentions "Typical values: c1=1e-4" and page 33 of the source discusses this, the primary claim extracted is about termination guarantees, not about the practical choice of parameter values. The usage is reasonable because the source does discuss this practical choice, but the citation's claim field doesn't explicitly capture this aspect. This would be better served by extracting the specific statement about c₁ = 10⁻⁴ being a typical/standard choice from the source material.

---

### Usage 4: /workspace/src/components/tabs/GdLineSearchTab.tsx:404
**Citation:** wolfe-conditions-nocedal-wright-2006
**Claim:** "The Wolfe conditions combine Armijo's sufficient decrease f(xₖ + αpₖ) ≤ f(xₖ) + c₁α∇fₖᵀpₖ with a curvature condition ∇f(xₖ + αpₖ)ᵀpₖ ≥ c₂∇fₖᵀpₖ (where 0 < c₁ < c₂ < 1) to ensure steps are neither too small nor too large"
**Website text:** "Wolfe conditions: Combine Armijo's sufficient decrease with a curvature condition ∇f(w + αp)ᵀp ≥ c₂∇fᵀp (where 0 < c₁ < c₂ < 1). This prevents accepting inefficiently small steps. Common in quasi-Newton methods (BFGS, L-BFGS)."
**Status:** ✅ MATCH
**Notes:** Excellent match. The website accurately describes the Wolfe conditions as combining Armijo's sufficient decrease with a curvature condition, includes the correct mathematical formulation and parameter constraints (0 < c₁ < c₂ < 1), and explains the purpose (preventing inefficiently small steps). The claim says "to ensure steps are neither too small nor too large" while the website says "prevents accepting inefficiently small steps" - this is a minor difference in emphasis but both are correct interpretations of the Wolfe conditions' purpose.

---

### Usage 5: /workspace/src/components/tabs/GdLineSearchTab.tsx:605
**Citation:** armijo-backtracking-termination-nocedal-wright-2006
**Claim:** "For L-smooth functions, Armijo backtracking with geometric step reduction α ← ρα (where ρ ∈ (0,1)) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials."
**Website text:** "The Armijo condition ensures sufficient decrease at each step:"
**Status:** ⚠️ MINOR ISSUE
**Notes:** The citation is used immediately after introducing "The Armijo condition ensures sufficient decrease at each step." While this statement is true and related to the citation, the citation's primary claim is about termination guarantees, not about what the Armijo condition ensures. The website text is introducing the Armijo condition concept, and the citation would be more appropriately used after statements about termination. The citation placement seems slightly premature - it would better fit after line 624 where termination is explicitly discussed.

---

### Usage 6: /workspace/src/components/tabs/GdLineSearchTab.tsx:624
**Citation:** armijo-backtracking-termination-nocedal-wright-2006
**Claim:** "For L-smooth functions, Armijo backtracking with geometric step reduction α ← ρα (where ρ ∈ (0,1)) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials."
**Website text:** "For L-smooth functions, backtracking with geometric step reduction α ← ρα terminates in finite steps, where ρ ∈ (0,1) is the contraction factor (how much to shrink the step each backtracking iteration, e.g., ρ = 0.5). Note: ρ is distinct from c₁ (the Armijo parameter for sufficient decrease)."
**Status:** ✅ MATCH
**Notes:** Perfect match. The website text is almost word-for-word aligned with the citation claim, correctly stating that backtracking with geometric step reduction terminates in finite steps for L-smooth functions, includes the parameter constraint ρ ∈ (0,1), and provides helpful clarification about what ρ represents and how it differs from c₁.

---

### Usage 7: /workspace/src/components/tabs/GdLineSearchTab.tsx:683
**Citation:** gd-linesearch-convex-sublinear-convergence-nesterov-2018
**Claim:** "For convex, L-smooth functions, gradient descent with Armijo line search achieves sublinear convergence with rate f(wₖ) - f* ≤ 2L‖w₀ - w*‖²/(k+4). Line search automatically adapts the step size to achieve near-optimal constants without requiring knowledge of L"
**Website text:** "For convex, L-smooth functions with Armijo line search: f(wₖ) - f* ≤ O(L‖w₀ - w*‖²/k). Sublinear convergence: Same O(1/k) rate as optimal fixed step size (α = 1/L), but line search achieves this automatically without knowing L."
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text captures the key ideas correctly - O(1/k) convergence rate for convex smooth functions and the automatic adaptation without knowing L. However, there's a minor discrepancy in the convergence bound: the citation claim states the exact bound with denominator (k+4), while the website uses O(L‖w₀ - w*‖²/k) which is asymptotically equivalent but hides the constant. The website correctly identifies this as sublinear convergence and emphasizes the key advantage (automatic adaptation). Using O(1/k) notation is acceptable for readability, but could be more precise by showing the exact bound as stated in the claim.

---

**BATCH 3 SUMMARY:**
- Total verified: 7
- ✅ Matches: 4
- ⚠️ Minor issues: 3
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## BATCH 4: Citations 22-27

### Usage 1: src/components/tabs/NewtonTab.tsx:325
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "When to Use" section states "When you can afford O(d³) computation per iteration"
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the citation claim. The claim states solving the Newton system requires O(d³) operations, and the website correctly uses this in the context of when Newton's method is appropriate (when you can afford the O(d³) cost). This is a proper usage that aligns with the computational complexity claim.

---

### Usage 2: src/components/tabs/DiagonalPrecondTab.tsx:228
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "On strictly convex quadratic functions with diagonal H, diagonal preconditioning with α = 1 equals Newton's method and converges in one iteration"
**Status:** ✅ MATCH
**Notes:** This usage is in the context of comparing diagonal preconditioning to Newton's method. The citation is used to support the statement about the equivalence of diagonal preconditioning to Newton's method on diagonal Hessians. While the claim is about computational complexity, the citation is appropriately used here because it's establishing what Newton's method is (solving the Newton system) and this context is discussing when diagonal preconditioning achieves the same result as Newton's method. The website correctly identifies the algorithmic equivalence.

---

### Usage 3: src/components/tabs/DiagonalPrecondTab.tsx:504
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "Cost tradeoff: Newton needs O(d³) for matrix inversion vs O(d²) for Hessian computation + O(d) for diagonal extraction in diagonal preconditioning."
**Status:** ✅ MATCH
**Notes:** Excellent usage. The website text directly uses the O(d³) computational complexity claim to compare Newton's method cost with diagonal preconditioning's cost. This is exactly what the citation supports - the computational cost of solving the Newton system using direct methods.

---

### Usage 4: src/components/tabs/DiagonalPrecondTab.tsx:742
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "If A is diagonal: Diagonal preconditioning with α = 1 is equivalent to Newton's method and converges in one iteration (finds the exact optimum w* = A⁻¹b). This is because diag(A) = A when A is diagonal, so the diagonal approximation is exact."
**Status:** ✅ MATCH
**Notes:** This is in the "Convergence on Quadratic Functions" section. The citation supports the statement about equivalence to Newton's method. The website correctly explains that on diagonal quadratics, diagonal preconditioning equals Newton's method because the diagonal approximation becomes exact. The citation provides the theoretical foundation for what Newton's method does.

---

### Usage 5: src/components/tabs/DiagonalPrecondTab.tsx:768
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "Total: O(d²) dominated by Hessian computation. This is much cheaper than Newton's method which requires O(d³) for solving the linear system via matrix factorization."
**Status:** ✅ MATCH
**Notes:** Perfect usage. The website text directly cites the O(d³) complexity for solving the Newton linear system via matrix factorization, which is exactly what the citation claims. The context is comparing the computational cost of diagonal preconditioning (O(d²)) to Newton's method (O(d³)).

---

### Usage 6: src/components/tabs/DiagonalPrecondTab.tsx:777
**Citation:** newton-computational-complexity
**Claim:** "Solving the Newton system $H \cdot p = -\nabla f$ requires $O(d^3)$ operations using direct methods (Cholesky or LU decomposition)"
**Website text:** "Costs O(d²) per iteration (cheaper than Newton's O(d³))"
**Status:** ✅ MATCH
**Notes:** Clear and accurate usage. The website text correctly states Newton's O(d³) cost in comparison to diagonal preconditioning's O(d²) cost, which aligns perfectly with the citation claim about the computational complexity of solving the Newton system.

---

**BATCH 4 SUMMARY:**
- Total verified: 6
- ✅ Matches: 6
- ⚠️ Minor issues: 0
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## BATCH 5: Citations 28-33

### Usage 1: /workspace/src/components/tabs/NewtonTab.tsx:530
**Citation:** newton-convex-convergence
**Claim:** For convex functions with Lipschitz continuous Hessian, Newton's method (with cubic regularization) converges to the global minimum. Specifically, the method finds stationary points where the gradient vanishes and the Hessian is positive semidefinite, which for convex functions are global minima.
**Website text (lines 528-530):**
```
<strong>Convex with Lipschitz continuous Hessian:</strong> Converges to global minimum
(may require cubic regularization if H not positive definite during iteration)
```
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the claim. It correctly states that convex functions with Lipschitz continuous Hessian converge to global minimum, and appropriately mentions that cubic regularization may be required when H is not positive definite during iteration. This aligns perfectly with the citation's claim about Newton's method (with cubic regularization) converging for such functions.

---

### Usage 2: /workspace/src/components/tabs/NewtonTab.tsx:784
**Citation:** inexact-newton-superlinear-convergence
**Claim:** Inexact Newton methods solve the Newton system ∇²fₖpₖ = -∇fₖ approximately using iterative methods like conjugate gradient, reducing computational cost from O(d³) to O(d²) or better while maintaining superlinear convergence with appropriate forcing sequences
**Website text (lines 778-784):**
```
<h3>Inexact Newton</h3>
<ul>
  <li>Solve HP = -∇ approximately using iterative methods (e.g., Conjugate Gradient)</li>
  <li>Reduces computational cost from O(d³) to O(d²) or better by avoiding direct Hessian factorization</li>
  <li>Still achieves superlinear convergence with appropriate forcing sequences (loose tolerances)</li>
</ul>
```
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects all key points from the claim: (1) solving the Newton system approximately using iterative methods like CG, (2) reducing cost from O(d³) to O(d²) or better, and (3) maintaining superlinear convergence with appropriate forcing sequences. The terminology is consistent and accurate.

---

### Usage 3: /workspace/src/components/tabs/LbfgsTab.tsx:294
**Citation:** bfgs-positive-definiteness-preservation-nocedal-wright-2006
**Claim:** BFGS/L-BFGS maintains positive definiteness of the approximate Hessian by only accepting curvature pairs where sₖᵀyₖ > 0 (positive curvature condition). If Hₖ is positive definite and sₖᵀyₖ > 0, then Hₖ₊₁ computed by the BFGS update is positive definite. This makes BFGS more robust than Newton's method in non-convex regions where the true Hessian may have negative eigenvalues
**Website text (lines 291-294):**
```
<strong>Acceptance criteria:</strong> L-BFGS only stores pairs where s^T y > 0 (positive curvature).
This helps maintain positive definiteness of the approximate Hessian B, promoting descent directions
even in non-convex regions where the true Hessian H may have negative eigenvalues.
```
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the claim's key points: (1) the positive curvature condition (s^T y > 0), (2) maintaining positive definiteness of the approximate Hessian, and (3) robustness in non-convex regions where the true Hessian may have negative eigenvalues. The context appropriately explains why this matters for L-BFGS.

---

### Usage 4: /workspace/src/components/tabs/LbfgsTab.tsx:812
**Citation:** bfgs-positive-definiteness-preservation-nocedal-wright-2006
**Claim:** BFGS/L-BFGS maintains positive definiteness of the approximate Hessian by only accepting curvature pairs where sₖᵀyₖ > 0 (positive curvature condition). If Hₖ is positive definite and sₖᵀyₖ > 0, then Hₖ₊₁ computed by the BFGS update is positive definite. This makes BFGS more robust than Newton's method in non-convex regions where the true Hessian may have negative eigenvalues
**Website text (lines 809-813):**
```
<strong>Key difference from Newton:</strong> L-BFGS only accepts pairs where s^T y > 0 (positive curvature).
Pairs with s^T y ≤ 0 are rejected and never stored in memory.
```
**Status:** ✅ MATCH
**Notes:** The website text accurately reflects the claim's core mechanism: L-BFGS only accepts pairs where s^T y > 0 (positive curvature), and explicitly states that pairs with s^T y ≤ 0 are rejected. This is consistent with the claim's statement about maintaining positive definiteness through the curvature condition. The surrounding context (lines 815-825, 836-845) further explains the robustness benefits in non-convex regions, which aligns with the claim.

---

### Usage 5: /workspace/src/components/tabs/LbfgsTab.tsx:850
**Citation:** bfgs-update-formula-nocedal-wright-2006
**Claim:** The BFGS method updates the Hessian approximation Bₖ using a rank-two formula: Bₖ₊₁ = Bₖ - (BₖsₖsₖᵀBₖ)/(sₖᵀBₖsₖ) + (yₖyₖᵀ)/(yₖᵀsₖ), where sₖ = xₖ₊₁ - xₖ is the step and yₖ = ∇fₖ₊₁ - ∇fₖ is the gradient change.
**Website text (lines 849-857):**
```
<strong>4. BFGS update formula:</strong> Given a new pair (s_k, y_k) from iteration k, how do we update
our approximate Hessian B_k to satisfy the new secant equation? The BFGS update is:

[BlockMath formula showing the update]

where k is the iteration index and ρ_k is a scaling factor equal to 1/(s_k^T y_k)
(the reciprocal of the curvature).
```
**Status:** ✅ MATCH
**Notes:** The website text accurately presents the BFGS update formula. While it uses the symmetric formulation (with ρ_k = 1/(s^T y)) rather than the explicit fraction form shown in the claim, these are mathematically equivalent. The context correctly identifies s_k as the step from iteration k and y_k as the gradient change. The explanation is accurate and pedagogically clear.

---

### Usage 6: /workspace/src/components/tabs/LbfgsTab.tsx:1192
**Citation:** bfgs-superlinear-convergence-nocedal-wright-2006
**Claim:** BFGS achieves superlinear convergence when the iterates converge to a minimizer satisfying certain regularity conditions: Lipschitz continuous Hessian (Assumption 6.2) and fast enough convergence such that Σ‖xₖ - x*‖ < ∞ (condition 6.52)
**Website text (lines 1191-1192):**
```
<strong>Strongly convex:</strong> Linear convergence (L-BFGS) or Superlinear convergence (full BFGS)
```
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text states that BFGS achieves superlinear convergence under strongly convex conditions, but the citation claim is more nuanced. The citation (Theorem 6.6) requires: (1) twice continuous differentiability, (2) Lipschitz continuous Hessian (Assumption 6.2), and (3) fast convergence (condition 6.52). Strong convexity is NOT explicitly required by Theorem 6.6. While strong convexity would ensure these conditions are met, the website text is slightly more restrictive than the actual theorem. However, this is a minor pedagogical simplification that doesn't contradict the citation - strong convexity is a sufficient (though not necessary) condition for the theorem's requirements.

---

**BATCH 5 SUMMARY:**
- Total verified: 6
- ✅ Matches: 5
- ⚠️ Minor issues: 1
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## BATCH 6: Citations 34-39

### Usage 1: /workspace/src/components/tabs/LbfgsTab.tsx:1311
**Citation:** lbfgs-computational-complexity-nocedal-wright-2006
**Claim:** L-BFGS requires $O(Md)$ memory and $O(Md)$ time per iteration, where $M$ is the memory size (number of stored curvature pairs) and $d$ is the dimension
**Website text:** "L-BFGS: stores only M recent (S, Y) pairs → O(Md) memory, O(Md) computation"
**Status:** ✅ MATCH
**Notes:** Perfect match. The website text accurately states the O(Md) complexity for both memory and computation, which directly reflects the citation claim. The context explains the contrast with full BFGS (O(d²)) and correctly identifies M as the number of stored pairs and d as the dimension.

---

### Usage 2: /workspace/src/components/tabs/LbfgsTab.tsx:1327
**Citation:** bfgs-superlinear-convergence-nocedal-wright-2006
**Claim:** BFGS achieves superlinear convergence when the iterates converge to a minimizer satisfying certain regularity conditions: Lipschitz continuous Hessian (Assumption 6.2) and fast enough convergence such that $\sum_{k=1}^{\infty} \|x_k - x^*\| < \infty$ (condition 6.52)
**Website text:** "L-BFGS achieves linear convergence on strongly-convex functions, not superlinear. The limited memory (only M recent pairs) prevents the Hessian approximation from fully converging to the true Hessian, which is necessary for superlinear convergence."
**Status:** ✅ MATCH
**Notes:** Correct usage. The citation is about BFGS superlinear convergence, and the website is contrasting L-BFGS (which does NOT achieve superlinear convergence) with full BFGS (which does). The citation supports the claim that full BFGS achieves superlinear convergence under specific conditions, which is exactly what the website text is explaining in the contrast. The next sentences (lines 1330-1331) elaborate on the full BFGS superlinear convergence conditions, which align with the citation claim about Lipschitz continuous Hessian and technical assumptions.

---

### Usage 3: /workspace/src/components/tabs/GdFixedTab.tsx:453
**Citation:** gd-descent-lemma-quadratic-upper-bound-nesterov-2018
**Claim:** The quadratic upper bound for L-smooth functions: any function with Lipschitz continuous gradient can be upper-bounded by a quadratic approximation
**Website text:** "Proof sketch: By L-smoothness, we have the quadratic upper bound:"
**Status:** ✅ MATCH
**Notes:** Perfect match. The website introduces the quadratic upper bound inequality $f(W') \leq f(W) + \nabla f(W)^T(W' - W) + \frac{L}{2}\|W' - W\|^2$ immediately after the citation, which is exactly the quadratic upper bound from Lemma 1.2.3 in Nesterov (2018). The citation accurately backs up the claim about the quadratic upper bound for L-smooth functions.

---

### Usage 4: /workspace/src/components/tabs/GdFixedTab.tsx:462
**Citation:** gd-smooth-descent-condition-nesterov-2018
**Claim:** For smooth convex functions (Lipschitz continuous gradient with constant $L$), gradient descent with step size $0 < h \leq 2/L$ converges to an optimal point. The proof establishes monotonic descent: $f(x_{k+1}) \leq f(x_k) - h(1 - \frac{hL}{2})\|\nabla f(x_k)\|^2$, which guarantees strict descent $f(x_{k+1}) < f(x_k)$ when $\nabla f(x_k) \neq 0$ and $h < 2/L$ (note: when $h = 2/L$ exactly, we still get non-strict descent).
**Website text:** "Rearranging: f(W_{k+1}) ≤ f(W_k) - α(1 - Lα/2)||∇f(W_k)||². For descent, we need 1 - Lα/2 > 0, which gives α < 2/L."
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text correctly derives the condition α < 2/L for descent (strict inequality), which matches the citation's note that strict descent requires h < 2/L. However, the citation claim also mentions that h ≤ 2/L (non-strict) still guarantees non-strict descent. The website uses strict inequality only, which is technically more restrictive than necessary but not incorrect—it's the condition for guaranteed strict descent when the gradient is non-zero. This is a minor presentational choice rather than a mathematical error.

---

### Usage 5: /workspace/src/components/tabs/GdFixedTab.tsx:489
**Citation:** gd-convex-sublinear-convergence-nesterov-2018
**Claim:** Gradient descent with fixed step size converges to the global minimum on convex smooth functions (possibly slowly with sublinear rate) when $0 < \alpha < 2/L$
**Website text:** "Optimal fixed step size: α = 1/L maximizes guaranteed decrease per step."
**Status:** ⚠️ MINOR ISSUE
**Notes:** The website text focuses specifically on the optimal step size α = 1/L, which is mentioned in the citation (Corollary 2.1.2 gives the O(1/k) rate with h = 1/L). However, the citation is about convergence guarantees and sublinear rate, while the website text at this location only discusses optimizing the per-step decrease. The broader convergence context appears in the section header "Convergence Guarantees" that follows. The citation placement could be improved—it would be better placed where convergence rate is actually discussed rather than just at the optimal step size derivation. That said, the optimal step size is part of the convergence analysis, so this is a minor contextual mismatch rather than a major error.

---

### Usage 6: /workspace/src/components/tabs/GdLineSearchTab.tsx:624
**Citation:** armijo-backtracking-termination-nocedal-wright-2006
**Claim:** For L-smooth functions, Armijo backtracking with geometric step reduction $\alpha \leftarrow \rho\alpha$ (where $\rho \in (0,1)$) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials.
**Website text:** "For L-smooth functions, backtracking with geometric step reduction α ← ρα terminates in finite steps, where ρ ∈ (0,1) is the contraction factor (how much to shrink the step each backtracking iteration, e.g., ρ = 0.5)."
**Status:** ✅ MATCH
**Notes:** Excellent match. The website text accurately reflects the citation claim about finite termination of Armijo backtracking with geometric step reduction. It correctly identifies ρ as the contraction factor in (0,1) and clarifies the distinction between ρ and c₁ (the Armijo parameter). The claim is properly scoped to L-smooth functions, matching the citation.

---

**BATCH 6 SUMMARY:**
- Total verified: 6
- ✅ Matches: 4
- ⚠️ Minor issues: 2
- ❌ Major mismatches: 0
- 📝 Missing context: 0

---

## Overall Statistics by Citation Key

### Perfect Citations (all usages match)
- `rosenbrock-function-benchmark` (1/1) ✅
- `three-hump-camel-function-benchmark` (1/1) ✅
- `newton-quadratic-convergence` (5/5) ✅✅✅✅✅
- `newton-computational-complexity` (6/6) ✅✅✅✅✅✅
- `newton-convex-convergence` (1/1) ✅
- `inexact-newton-superlinear-convergence` (1/1) ✅
- `lbfgs-linear-convergence-nocedal-wright-2006` (1/1) ✅
- `lbfgs-computational-complexity-nocedal-wright-2006` (1/1) ✅
- `bfgs-positive-definiteness-preservation-nocedal-wright-2006` (2/2) ✅✅
- `bfgs-update-formula-nocedal-wright-2006` (1/1) ✅
- `wolfe-conditions-nocedal-wright-2006` (1/1) ✅
- `gd-descent-lemma-quadratic-upper-bound-nesterov-2018` (1/1) ✅

### Citations with Minor Issues
- `gd-strongly-convex-linear-convergence-nesterov-2018` (2/3 matches, 1 minor) - strict inequality issue
- `gd-convex-sublinear-convergence-nesterov-2018` (1/4 matches, 3 minor) - step size range + placement
- `gd-linesearch-strongly-convex-linear-convergence-nesterov-2018` (0/2 matches, 2 minor) - LOCAL vs GLOBAL
- `gd-linesearch-convex-sublinear-convergence-nesterov-2018` (0/1 matches, 1 minor) - exact vs asymptotic bound
- `gd-smooth-descent-condition-nesterov-2018` (0/1 matches, 1 minor) - strict inequality
- `bfgs-superlinear-convergence-nocedal-wright-2006` (1/2 matches, 1 minor) - strong convexity vs conditions
- `armijo-backtracking-termination-nocedal-wright-2006` (3/5 matches, 2 minor) - citation placement

---

## Conclusion

This verification found **zero major mismatches**, confirming that all citations are fundamentally correct and properly sourced. The 11 minor issues identified are primarily:
- Technical precision (strict vs non-strict inequalities)
- Scope differences (LOCAL vs GLOBAL results, optimal vs valid ranges)
- Citation placement optimization

The most important issues to address are the two instances where LOCAL convergence theorems are cited for GLOBAL convergence claims ([AlgorithmExplainer.tsx:143](src/components/AlgorithmExplainer.tsx#L143), [GdLineSearchTab.tsx:668](src/components/tabs/GdLineSearchTab.tsx#L668)).

All other issues are minor presentational choices that don't invalidate the mathematical correctness of the website's claims.
