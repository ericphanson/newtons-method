# lbfgs-linear-convergence-nocedal-wright-2006

**Source:** [lbfgs-linear-convergence-nocedal-wright-2006.json](../../citations/lbfgs-linear-convergence-nocedal-wright-2006.json)

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

L-BFGS achieves linear convergence (not superlinear) due to limited memory preventing the Hessian approximation from fully converging to the true Hessian

## Quote

> Limited-memory quasi-Newton methods are useful for solving large problems whose Hessian matrices cannot be computed at a reasonable cost or are not sparse. These methods maintain simple and compact approximations of Hessian matrices: Instead of storing fully dense $n \times n$ approximations, they save only a few vectors of length $n$ that represent the approximations implicitly. Despite these modest storage requirements, they often yield an acceptable (albeit linear) rate of convergence. Various limited-memory methods have been proposed, but we mainly focus on an algorithm known as L-BFGS, which, as its name suggests, is based on the BFGS updating formula.

**Pages:** 176

**Theorem/Result:** Section 7.2

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1

**Cropped Formula Image:**

![numericaloptimization2006_p196_linear_convergence](../extracted-pages/formulas/numericaloptimization2006_p196.png)

**Extracted LaTeX:**

$$
Despite these modest storage requirements, they often yield an acceptable (albeit linear) rate of convergence.
$$

<details>
<summary>LaTeX Source</summary>

```latex
Despite these modest storage requirements, they often yield an acceptable (albeit linear) rate of convergence.
```

</details>

**Verification:** ✅ Verified

**Metadata:** [numericaloptimization2006_p196_linear_convergence.json](../extracted-pages/formulas/numericaloptimization2006_p196.json)

---

## Reader Notes

This statement from Section 7.2 explicitly confirms that L-BFGS achieves **linear** convergence, in contrast to full BFGS which achieves **superlinear** convergence (Theorem 6.6, pages 153-160). The parenthetical '(albeit linear)' indicates that while linear convergence is slower than superlinear, it is still 'acceptable' in practice. The fundamental reason is that L-BFGS uses limited memory—it stores only the $m$ most recent correction pairs $(s_k, y_k)$—which prevents the Hessian approximation $B_k$ from fully converging to the true Hessian $\nabla^2 f(x^*)$. This trade-off makes L-BFGS practical for large-scale problems where storing a full $n \times n$ matrix would be infeasible.

## Internal Notes

Internal: Used in LbfgsTab to explain why L-BFGS achieves only linear convergence compared to full BFGS which achieves superlinear convergence (Theorem 6.6). The key phrase is 'an acceptable (albeit linear) rate of convergence' which explicitly states the linear convergence rate. The limited memory (storing only m recent correction pairs) prevents the Hessian approximation from fully converging to the true Hessian, which is what allows full BFGS to achieve superlinear convergence.

## Verification

**Verified:** 2025-11-13

**Verified By:** claude-code-agent

**Verification Notes:** Verified quote is verbatim from book page 176 (PDF page 196), Section 7.2 'Limited-Memory Quasi-Newton Methods'. The key phrase 'an acceptable (albeit linear) rate of convergence' explicitly states that L-BFGS achieves linear convergence. This contrasts with Theorem 6.6 which establishes superlinear convergence for full BFGS. The quote is from the opening paragraph of Section 7.2 which introduces limited-memory methods. Page number verified: book page header shows 176, and with pageOffset of 20, PDF page is 196 (176 + 20 = 196).

## Used In

- LbfgsTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0196.png)

