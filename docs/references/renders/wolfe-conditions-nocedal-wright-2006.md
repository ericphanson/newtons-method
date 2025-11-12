# wolfe-conditions-nocedal-wright-2006

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

The Wolfe conditions combine Armijo's sufficient decrease $f(x_k + \alpha p_k) \leq f(x_k) + c_1\alpha\nabla f_k^T p_k$ with a curvature condition $\nabla f(x_k + \alpha p_k)^T p_k \geq c_2\nabla f_k^T p_k$ (where $0 < c_1 < c_2 < 1$) to ensure steps are neither too small nor too large

## Quote

> The sufficient decrease and curvature conditions are known collectively as the Wolfe conditions. We illustrate them in Figure 3.5 and restate them here for future reference: $f(x_k + \alpha_k p_k) \leq f(x_k) + c_1 \alpha_k \nabla f_k^T p_k$, $\nabla f(x_k + \alpha_k p_k)^T p_k \geq c_2 \nabla f_k^T p_k$, with $0 < c_1 < c_2 < 1$. [...] The strong Wolfe conditions require $\alpha_k$ to satisfy $f(x_k + \alpha_k p_k) \leq f(x_k) + c_1 \alpha_k \nabla f_k^T p_k$, $|\nabla f(x_k + \alpha_k p_k)^T p_k| \leq c_2 |\nabla f_k^T p_k|$, with $0 < c_1 < c_2 < 1$.

**Pages:** 13-16

**Theorem/Result:** Equations (3.6) and (3.7)

## Reader Notes

The Wolfe conditions consist of two parts: (1) The sufficient decrease (Armijo) condition $f(x_k + \alpha p_k) \leq f(x_k) + c_1\alpha\nabla f_k^T p_k$ ensures the step reduces the function value proportionally to the step size and directional derivative. However, this condition alone is satisfied by all sufficiently small steps (see Figure 3.3), which could lead to inefficiently tiny steps. (2) The curvature condition $\nabla f(x_k + \alpha p_k)^T p_k \geq c_2\nabla f_k^T p_k$ prevents arbitrarily small steps by requiring the slope at the accepted point to be at least $c_2$ times the initial slope. If the slope is still strongly negative ($\ll c_2\nabla f_k^T p_k$), we can reduce $f$ significantly by moving further, so the search continues. The strong Wolfe conditions use $|\nabla f(x_k + \alpha p_k)^T p_k| \leq c_2 |\nabla f_k^T p_k|$ to also exclude points with excessively positive slope, forcing steps to lie near stationary points of the line search function. Common parameter values are $c_1 = 10^{-4}$ and $c_2 = 0.9$ for Newton/quasi-Newton methods.

## Internal Notes

Internal: This is for background context only in GdLineSearchTab. The key insight is that Armijo (sufficient decrease) alone is satisfied by arbitrarily small steps (see Figure 3.3 on page 53), so the curvature condition is needed to prevent tiny steps. The curvature condition ensures the slope at the accepted point is not too negative (not much room for further decrease). Strong Wolfe adds an absolute value to also exclude points far from stationary points. Typical values: c1=1e-4, c2=0.9 (Newton/quasi-Newton) or 0.1 (conjugate gradient). We implement Armijo backtracking only, but mention Wolfe briefly to explain why pure Armijo can be inefficient without backtracking from a reasonable initial step.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent

**Verification Notes:** Independent verification completed 2025-11-12. Quote is word-for-word accurate from book page 34 (PDF page 54). Equations (3.6a)/(3.6b) for standard Wolfe conditions and (3.7a)/(3.7b) for strong Wolfe conditions verified. Page numbers: citation uses book pages 33-36, proof pages use PDF pages 52-56 (book pages 32-36). Core content: Wolfe conditions (3.6) and (3.7) appear on book page 34. Context pages verified: page 33 defines Armijo condition (3.4) and curvature condition (3.5); Figure 3.3 illustrates why Armijo alone accepts arbitrarily small steps; Figure 3.4 illustrates curvature condition; Figure 3.5 (page 35) shows combined Wolfe conditions; Lemma 3.1 (pages 35-36) proves existence of step lengths satisfying Wolfe conditions for smooth functions bounded below. Usage in GdLineSearchTab.tsx (line 402-404) verified: citation correctly explains Wolfe conditions as alternative to Armijo backtracking. Claim accurately summarizes the conditions and their purpose. Mathematical notation correctly transcribed. All quality standards met.

## Used In

- GdLineSearchTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0052.png)

### Page 2

![Proof page 2](../extracted-pages/numericaloptimization2006_page_0053.png)

### Page 3

![Proof page 3](../extracted-pages/numericaloptimization2006_page_0054.png)

### Page 4

![Proof page 4](../extracted-pages/numericaloptimization2006_page_0055.png)

### Page 5

![Proof page 5](../extracted-pages/numericaloptimization2006_page_0056.png)

