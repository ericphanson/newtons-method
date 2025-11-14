# newton-quadratic-one-iteration-nocedal-wright-2006

**Source:** [newton-quadratic-one-iteration-nocedal-wright-2006.json](../../citations/newton-quadratic-one-iteration-nocedal-wright-2006.json)

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

Newton's method minimizes the quadratic model $m_k(p) = f_k + p^T\nabla f_k + \frac{1}{2}p^T\nabla^2 f_k p$ exactly by solving $\nabla m_k(p) = 0$, yielding $p_k^N = -(\nabla^2 f_k)^{-1}\nabla f_k$. For quadratic functions $f(x) = \frac{1}{2}x^TAx - b^Tx$ where $A \succ 0$, the quadratic model is exact (no $O(\|p\|^3)$ remainder), so Newton's method finds the global minimum $x^* = A^{-1}b$ in exactly one iteration with step size $\alpha = 1$.

## Quote

> Another important search direction—perhaps the most important one of all—is the Newton direction. This direction is derived from the second-order Taylor series approximation to $f(x_k + p)$, which is

$f(x_k + p) \approx f_k + p^T\nabla f_k + \frac{1}{2}p^T\nabla^2 f_k p = m_k(p)$.  (2.14)

Assuming for the moment that $\nabla^2 f_k$ is positive definite, we obtain the Newton direction by finding the vector $p$ that minimizes $m_k(p)$. By simply setting the derivative of $m_k(p)$ to zero, we obtain the following explicit formula:

$p_k^N = -(\nabla^2 f_k)^{-1}\nabla f_k$.  (2.15)

**Pages:** 22

**Theorem/Result:** Equations (2.14)-(2.15)

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1 2.14

**Extracted LaTeX:**

$$
$f(x_k + p) \approx f_k + p^T \nabla f_k + \frac{1}{2} p^T \nabla^2 f_k p \stackrel{\text{def}}{=} m_k(p)$
$$

<details>
<summary>LaTeX Source</summary>

```latex
$f(x_k + p) \approx f_k + p^T \nabla f_k + \frac{1}{2} p^T \nabla^2 f_k p \stackrel{\text{def}}{=} m_k(p)$
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 2 2.15

**Extracted LaTeX:**

$$
$p_k^N = -(\nabla^2 f_k)^{-1} \nabla f_k$
$$

<details>
<summary>LaTeX Source</summary>

```latex
$p_k^N = -(\nabla^2 f_k)^{-1} \nabla f_k$
```

</details>

**Verification:** ❌ Not Verified

---

## Reader Notes

The one-iteration property is not explicitly stated but follows from two facts: (1) Newton's method finds the minimum of the quadratic model $m_k(p)$ by solving $\nabla m_k(p) = 0$ (equations 2.14-2.15), and (2) for quadratic $f$, the model is exact—there is no $O(\|p\|^3)$ remainder term. Therefore, minimizing the model finds the global minimum in one step: $x_1 = x_0 - A^{-1}(Ax_0 - b) = A^{-1}b = x^*$.

## Internal Notes

Internal: This is a derived result, not a stated theorem. Nocedal & Wright present equations (2.14)-(2.15) showing Newton's method minimizes the quadratic model. The one-iteration property for quadratics follows from the exactness of the model. Used in DiagonalPrecondTab to explain why diagonal preconditioning equals Newton when Hessian is diagonal.

## Verification

**Verified:** 2025-11-14

**Verified By:** claude-code

**Verification Notes:** Corrected page numbers from 62-63 to 42 (book page 22). Both equations (2.14)-(2.15) are on PDF page 42. Verified equations are present on this page. Extracted formula crops following 3-checkpoint workflow: (1) Cropped both equations with generous padding, (2) Extracted LaTeX with proper escaping, (3) Verified crops are complete with no clipping of equation numbers or mathematical content. The one-iteration result is derived from these equations combined with the exactness of the quadratic model for quadratic functions.

## Used In

- DiagonalPrecondTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0042.png)

