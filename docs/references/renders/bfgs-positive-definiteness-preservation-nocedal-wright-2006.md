# bfgs-positive-definiteness-preservation-nocedal-wright-2006

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

BFGS/L-BFGS maintains positive definiteness of the approximate Hessian by only accepting curvature pairs where $s_k^T y_k > 0$ (positive curvature condition). If $H_k$ is positive definite and $s_k^T y_k > 0$, then $H_{k+1}$ computed by the BFGS update is positive definite. This makes BFGS more robust than Newton's method in non-convex regions where the true Hessian may have negative eigenvalues

## Quote

> Note that the minimization problem (6.16) that gives rise to the BFGS update formula does not explicitly require the updated Hessian approximation to be positive definite. It is easy to show, however, that $H_{k+1}$ will be positive definite whenever $H_k$ is positive definite, by using the following argument. First, note from (6.8) that $y_k^T s_k$ is positive, so that the updating formula (6.17), (6.14) is well-defined. For any nonzero vector $z$, we have $z^T H_{k+1} z = w^T H_k w + \rho_k (z^T s_k)^2 \geq 0$, where we have defined $w = z - \rho_k y_k (s_k^T z)$. The right hand side can be zero only if $s_k^T z = 0$, but in this case $w = z \neq 0$, which implies that the first term is greater than zero. Therefore, $H_{k+1}$ is positive definite.

**Pages:** 116-120, 136-141

**Theorem/Result:** Section 6.1, equations (6.7), (6.8), positive definiteness argument (p. 161)

## Reader Notes

The BFGS method maintains positive definiteness of its Hessian approximation through a curvature filtering mechanism. The key is the **curvature condition** $s_k^T y_k > 0$ (equation 6.7, page 157), where $s_k = x_{k+1} - x_k$ is the step and $y_k = \nabla f_{k+1} - \nabla f_k$ is the change in gradients. This condition is automatically satisfied when using the Wolfe line search conditions (equation 6.8, page 157). The BFGS update formula has the remarkable property that **if $H_k$ is positive definite and $s_k^T y_k > 0$, then $H_{k+1}$ is also positive definite** (argument on page 161). This property makes BFGS significantly more robust than Newton's method in non-convex regions: Newton's method uses the true Hessian $\nabla^2 f(x_k)$, which can have negative eigenvalues when the function is non-convex locally.

## Internal Notes

Internal: This citation establishes the key robustness property of BFGS - it maintains positive definiteness through curvature filtering. The curvature condition $s_k^T y_k > 0$ (equation 6.7, page 157) is guaranteed by the Wolfe line search conditions as shown in equation (6.8, page 157). The positive definiteness preservation argument on page 161 shows that if $H_k$ is positive definite, then $H_{k+1}$ from BFGS update is also positive definite. NOTE: Pages 136-140 are from Chapter 5 (Conjugate Gradient Methods) discussing preliminary quasi-Newton concepts. Pages 156-161 are from Chapter 6 (Quasi-Newton Methods) which is dedicated to BFGS. The 16-page gap (141-155) contains unrelated material: end of Chapter 5 (Fletcher-Reeves, nonlinear CG), exercises, and Chapter 6 title page. The non-contiguous page range is intentional and correct.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent-adversarial

**Verification Notes:** ADVERSARIAL VERIFICATION COMPLETE. Examined all 11 proof pages plus the 16-page gap (141-155). FINDINGS: (1) The 16-page gap is CORRECT and INTENTIONAL - pages 141-155 contain Chapter 5 material on Conjugate Gradient methods (Fletcher-Reeves, nonlinear CG, global convergence theorems, exercises) and Chapter 6 title page, all unrelated to BFGS positive definiteness. Pages 136-140 are end of Chapter 5 discussing preliminary quasi-Newton concepts. Pages 156-161 are from Chapter 6 (Quasi-Newton Methods) dedicated to BFGS theory. (2) Equations (6.7) and (6.8) CORRECTLY located on page 157. Eq (6.7) defines curvature condition $s_k^T y_k > 0$. Eq (6.8) proves this holds under Wolfe conditions: $y_k^T s_k \geq (c_2 - 1)\nabla f_k^T s_k > 0$. (3) The positive definiteness preservation is NOT a formal numbered theorem but an ARGUMENT on page 161. Citation correctly refers to 'Section 6.1' rather than claiming a theorem number. (4) Quote is WORD-FOR-WORD accurate from page 161, matching exactly including punctuation and mathematical notation. (5) Claim accurately reflects source without overstatement. (6) Usage in LbfgsTab.tsx correctly cites this for curvature filtering ($s^T y > 0$ acceptance criterion). VERDICT: Citation is accurate, appropriately scoped, and the non-contiguous page range is necessary and correct. The gap exists because pages 141-155 are irrelevant to BFGS positive definiteness.

## Used In

- LbfgsTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0136.png)

### Page 2

![Proof page 2](../extracted-pages/numericaloptimization2006_page_0137.png)

### Page 3

![Proof page 3](../extracted-pages/numericaloptimization2006_page_0138.png)

### Page 4

![Proof page 4](../extracted-pages/numericaloptimization2006_page_0139.png)

### Page 5

![Proof page 5](../extracted-pages/numericaloptimization2006_page_0140.png)

### Page 6

![Proof page 6](../extracted-pages/numericaloptimization2006_page_0156.png)

### Page 7

![Proof page 7](../extracted-pages/numericaloptimization2006_page_0157.png)

### Page 8

![Proof page 8](../extracted-pages/numericaloptimization2006_page_0158.png)

### Page 9

![Proof page 9](../extracted-pages/numericaloptimization2006_page_0159.png)

### Page 10

![Proof page 10](../extracted-pages/numericaloptimization2006_page_0160.png)

### Page 11

![Proof page 11](../extracted-pages/numericaloptimization2006_page_0161.png)

