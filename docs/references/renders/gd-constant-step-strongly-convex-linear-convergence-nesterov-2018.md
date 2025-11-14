# gd-constant-step-strongly-convex-linear-convergence-nesterov-2018

**Source:** [gd-constant-step-strongly-convex-linear-convergence-nesterov-2018.json](../../citations/gd-constant-step-strongly-convex-linear-convergence-nesterov-2018.json)

## Reference

Yurii Nesterov. *Lectures on Convex Optimization* (2nd edition). Springer, 2018.

**File:** `Lectures on Convex Optimization.pdf`

## Claim

Gradient descent with constant step size h ≤ 2/(μ+L) achieves linear convergence on μ-strongly convex, L-smooth functions: ||x_k - x*||² ≤ ((L-μ)/(L+μ))^(2k) ||x_0 - x*||² when h = 2/(μ+L)

## Quote

> Theorem 2.1.15 If f ∈ S^{1,1}_{μ,L}(ℝⁿ) and 0 < h ≤ 2/(μ+L), then the Gradient Method generates a sequence {x_k} such that ||x_k - x*||² ≤ (1 - 2hμL/(μ+L))^k ||x_0 - x*||². If h = 2/(μ+L), then ||x_k - x*|| ≤ ((Q_f - 1)/(Q_f + 1))^k ||x_0 - x*||, f(x_k) - f* ≤ (L/2)((Q_f - 1)/(Q_f + 1))^{2k} ||x_0 - x*||², where Q_f = L/μ.

**Pages:** 101-102

**Theorem/Result:** Theorem 2.1.15

## Reader Notes

This result shows that gradient descent with the right constant step size achieves linear convergence on strongly convex smooth functions. The class S^{1,1}_{μ,L}(ℝⁿ) contains functions that are μ-strongly convex (μI ⪯ ∇²f(x) for all x) and L-smooth (∇²f(x) ⪯ LI for all x). The convergence rate ((Q-1)/(Q+1))^k where Q = L/μ is the condition number matches the rate for exact line search (Nocedal & Wright Theorem 3.4). The optimal step size h* = 2/(μ+L) balances the tradeoff between making progress (large steps) and ensuring decrease (small steps). For comparison: (1) When Q = 1 (μ = L, perfectly conditioned), the rate is 0 (one-step convergence). (2) When Q = 100, the rate ≈ 0.96 (slow but linear). (3) When Q = 10, the rate ≈ 0.67 (reasonably fast). Equation (2.1.40) shows the iterate convergence, while equation (2.1.9) on page 64 relates ||x_k - x*||² to f(x_k) - f*. This is a GLOBAL result (holds from any starting point), unlike Theorem 1.2.4 which is local.

## Internal Notes

Internal: This theorem proves LINEAR CONVERGENCE for gradient descent with CONSTANT STEP SIZE on globally strongly convex functions (not local, unlike Theorem 1.2.4). The class S^{1,1}_{μ,L}(ℝⁿ) consists of functions satisfying μI ⪯ ∇²f(x) ⪯ LI for all x (equation 2.1.32 on page 93). The optimal step size h* = 2/(μ+L) gives rate ((L-μ)/(L+μ))² = ((Q-1)/(Q+1))² where Q = L/μ is the condition number. This matches Nocedal & Wright Theorem 3.4 for exact line search. NOTE: This is NOT for Armijo backtracking line search - it's for a specific constant step size. However, the Armijo rule (pages 48-50) with proper parameters will select step sizes in a bounded range that includes values close to this optimal step, so similar (though not identical) convergence behavior can be expected. The gradient method is: x_{k+1} = x_k - h∇f(x_k).

## Verification

**Verified:** 2025-11-14

**Verified By:** claude-sonnet-4-5

**Verification Notes:** Verified Theorem 2.1.15 on pages 101-102 (PDF pages 120-121). Quote extracted verbatim from source. This theorem is for CONSTANT step size gradient descent, NOT Armijo backtracking. The class S^{1,1}_{μ,L}(ℝⁿ) is defined on page 93 as functions with μI ⪯ ∇²f(x) ⪯ LI globally. The optimal step size h = 2/(μ+L) is explicitly stated in the theorem. The convergence rate formula matches Nocedal & Wright's exact line search result but applies globally. Formula extraction pending.

## Used In

- GdLineSearchTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/lectures_on_convex_optimization_page_0101.png)

### Page 2

![Proof page 2](../extracted-pages/lectures_on_convex_optimization_page_0102.png)

