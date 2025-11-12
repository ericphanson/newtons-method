# armijo-backtracking-termination-nocedal-wright-2006

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

For L-smooth functions, Armijo backtracking with geometric step reduction $\alpha \leftarrow \tau\alpha$ (where $\tau \in (0,1)$) terminates in finite steps. The backtracking procedure will find an acceptable step length after a finite number of trials.

## Quote

> Algorithm 3.1 (Backtracking Line Search). Choose $\bar{\alpha} > 0$, $\rho \in (0, 1)$, $c \in (0, 1)$; Set $\alpha \leftarrow \bar{\alpha}$; repeat until $f(x_k + \alpha p_k) \leq f(x_k) + c\alpha\nabla f_k^T p_k$, $\alpha \leftarrow \rho\alpha$; end (repeat). Terminate with $\alpha_k = \alpha$. [...] An acceptable step length will be found after a finite number of trials, because $\alpha_k$ will eventually become small enough that the sufficient decrease condition holds (see Figure 3.3).

**Pages:** 17, 32-33, 36-37

**Theorem/Result:** Algorithm 3.1 (Backtracking Line Search)

## Reader Notes

The Armijo backtracking algorithm guarantees that a step length satisfying the sufficient decrease condition $f(x_k + \alpha p_k) \leq f(x_k) + c\alpha\nabla f_k^T p_k$ will be found in finitely many iterations. At each iteration, the step length is reduced by the factor $\rho$ (i.e., $\alpha \leftarrow \rho\alpha$). The algorithm terminates because the step length eventually becomes small enough that the sufficient decrease condition is satisfied. For L-smooth functions (Lipschitz continuous gradient with constant $L$), this is guaranteed by Lemma 1.2.3 in Nesterov 2018 (page 45/25), which shows that $f(y) \leq f(x) + \langle\nabla f(x), y-x\rangle + \frac{L}{2}\|y-x\|^2$. However, the standard references do not provide an explicit bound on the number of backtracking iterations in terms of $L$, $c$, or $\rho$; they only guarantee finite termination. The typical choice is $c = 10^{-4}$ (page 33) and $\rho \in [\rho_{lo}, \rho_{hi}]$ for some fixed $0 < \rho_{lo} < \rho_{hi} < 1$ (page 37).

## Internal Notes

Internal: Used in GdLineSearchTab to explain backtracking line search termination. The book guarantees finite termination but does not provide an explicit bound on the number of backtracking iterations in terms of problem parameters. Page 37 contains the algorithm (PDF page 57), and page 37 contains the statement about finite termination. The sufficient decrease condition is also called the Armijo condition (page 33, PDF page 53). The notation: $\bar{\alpha}$ is initial step length (typically 1 for Newton/quasi-Newton), $\rho$ is the contraction factor (reduction ratio), $c$ is the Armijo parameter (typically $10^{-4}$), $p_k$ is the search direction. The book uses $\rho$ for the contraction factor; in the codebase this may be denoted $\tau$.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent

**Verification Notes:** INDEPENDENT VERIFICATION: Quote verified word-for-word against OCR text and PDF images. Algorithm 3.1 on page 37 (PDF page 57) accurately transcribed. The [...] ellipsis correctly omits explanatory prose between the algorithm statement and the termination guarantee. The termination statement "An acceptable step length will be found after a finite number of trials, because αk will eventually become small enough that the sufficient decrease condition holds (see Figure 3.3)" is word-for-word accurate. Page numbers verified: book page 37 = PDF page 57 (algorithm), book page 33 = PDF page 53 (Armijo condition definition), book page 32 = PDF page 52 (Figure 3.3). Claim is accurate: finite termination is guaranteed but no explicit bound is provided in terms of problem parameters. The book uses ρ for contraction factor; code may use τ (correctly documented in notes). Usage in GdLineSearchTab.tsx verified at lines 373, 383, 605, 624 - all uses are appropriate and consistent with the source material.

## Used In

- GdLineSearchTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0037.png)

### Page 2

![Proof page 2](../extracted-pages/numericaloptimization2006_page_0052.png)

### Page 3

![Proof page 3](../extracted-pages/numericaloptimization2006_page_0053.png)

### Page 4

![Proof page 4](../extracted-pages/numericaloptimization2006_page_0056.png)

### Page 5

![Proof page 5](../extracted-pages/numericaloptimization2006_page_0057.png)

