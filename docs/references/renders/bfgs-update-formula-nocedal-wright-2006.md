# bfgs-update-formula-nocedal-wright-2006

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

The BFGS update formula maintains positive definiteness and satisfies the secant equation $B_{k+1} s_k = y_k$

## Quote

> The update formula for $B_k$ is obtained by simply applying the Sherman–Morrison–Woodbury formula (A.28) to (6.17) to obtain $B_{k+1} = B_k - \frac{B_k s_k s_k^T B_k}{s_k^T B_k s_k} + \frac{y_k y_k^T}{y_k^T s_k}$ where $s_k = x_{k+1} - x_k = \alpha_k p_k$ and $y_k = \nabla f_{k+1} - \nabla f_k$.

**Pages:** 136-140

**Theorem/Result:** Equation (6.19)

## Reader Notes

The BFGS formula updates the Hessian approximation $B_k$ using information from the most recent step. The notation: $s_k = x_{k+1} - x_k$ is the parameter change (step), $y_k = \nabla f_{k+1} - \nabla f_k$ is the gradient change, and $\rho_k = 1/(s_k^T y_k)$ is the curvature scaling factor (equation 6.14). The secant equation $B_{k+1} s_k = y_k$ (equation 6.6, page 138) requires that the updated approximation maps the step to the gradient change, mimicking the property of the true Hessian. The formula maintains positive definiteness when the curvature condition $s_k^T y_k > 0$ holds (equation 6.7, page 138).

## Internal Notes

Internal: This is the BFGS update formula for the Hessian approximation $B_k$. The formula can be rewritten in the symmetric form: $B_{k+1} = (I - \rho_k s_k y_k^T) B_k (I - \rho_k y_k s_k^T) + \rho_k s_k s_k^T$ where $\rho_k = 1/(s_k^T y_k)$ (equation 6.14). Used in LbfgsTab to explain the BFGS/L-BFGS update mechanism.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent

**Verification Notes:** VERIFIED: Quote is word-for-word accurate from page 140, lines 468-474 (equation 6.19). Visual verification of all proof pages (136-140) confirms correct content. Page numbers are correct (book page numbers, not PDF page numbers). The quote accurately captures the BFGS update formula for B_k, including the definitions of s_k and y_k. Cross-referenced equation (6.17) on page 140 (inverse Hessian form H_k), equation (6.6) on page 138 (secant equation), equation (6.7) on page 138 (curvature condition s_k^T y_k > 0), and equation (6.14) on page 139 (definition of ρ_k). Usage in LbfgsTab.tsx line 850 is correct - cited in explanation of BFGS update mechanism. Claim accurately states that the formula maintains positive definiteness (when curvature condition holds) and satisfies the secant equation. All context is properly documented in notes and readerNotes fields.

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

