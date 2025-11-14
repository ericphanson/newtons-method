# lbfgs-uniformly-convex-linear-convergence-liu-nocedal-1989

**Source:** [lbfgs-uniformly-convex-linear-convergence-liu-nocedal-1989.json](../../citations/lbfgs-uniformly-convex-linear-convergence-liu-nocedal-1989.json)

## Reference

Dong C. Liu and Jorge Nocedal. *On the Limited Memory BFGS Method for Large Scale Optimization*. Mathematical Programming, 45:503-528, 1989.

**File:** `LiuNocedal1989.pdf`

## Claim

L-BFGS achieves R-linear convergence on uniformly convex functions: there exists a constant 0 ≤ r < 1 such that f_k - f* ≤ r^k[f_0 - f*]

## Quote

> Theorem 6.1. Suppose that $f$ is uniformly convex on a convex set $D \subset R^n$, i.e., there exist $M_1$, $M_2$ such that $M_1 \|z\|^2 \leq z^T G(x) z \leq M_2 \|z\|^2$ for all $z \in R^n$ and $x \in D$, where $G(x)$ denotes the Hessian of $f$ at $x$. For any positive definite $B_0$, Algorithm 6.1 generates a sequence $\{x_k\}$ which converges to $x^*$. Moreover there is a constant $0 \leq r < 1$ such that $f_k - f^* \leq r^k [f_0 - f^*]$.

**Pages:** 23

**Theorem/Result:** Theorem 6.1

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1 Theorem 6.1 convergence bound

**Extracted LaTeX:**

$$
$f_k - f^* \leq r^k [f_0 - f^*]$
$$

<details>
<summary>LaTeX Source</summary>

```latex
$f_k - f^* \leq r^k [f_0 - f^*]$
```

</details>

**Verification:** ❌ Not Verified

---

## Reader Notes

Uniform convexity is a global condition that requires the Hessian $\nabla^2 f(x)$ (denoted $G(x)$ in the paper) to satisfy $M_1 \|z\|^2 \leq z^T \nabla^2 f(x) z \leq M_2 \|z\|^2$ for ALL $z \in \mathbb{R}^n$ and ALL $x$ in the domain. This is stronger than strongly convex smooth functions (which require $\mu I \preceq \nabla^2 f(x) \preceq LI$) because it requires uniform bounds independent of $x$. The theorem establishes R-linear convergence: the function value error $f_k - f^*$ decreases geometrically by at least a constant factor $r < 1$ at each iteration. However, the theorem does not provide an explicit formula for $r$ in terms of the condition number $\kappa = M_2/M_1$ or the memory parameter $m$. In practice, L-BFGS often achieves linear convergence on strongly convex smooth functions even though this weaker condition is not covered by Theorem 6.1.

## Internal Notes

Internal: This is the formal convergence theorem for L-BFGS. It proves R-linear convergence (geometric decrease in function value) on uniformly convex functions. Uniformly convex is stronger than strongly convex smooth (uniformly convex requires M_1 I ⪯ ∇²f(x) ⪯ M_2 I to hold globally). The theorem does not provide explicit bounds on the convergence constant r in terms of M_1, M_2, or memory parameter m. Used in AlgorithmExplainer and LbfgsTab.

## Verification

**Verified:** 2025-11-14

**Verified By:** claude-code

**Verification Notes:** Verified Theorem 6.1 statement on page 23. The theorem is stated precisely as quoted. The uniform convexity condition M_1||z||² ≤ z^T G(x)z ≤ M_2||z||² is indeed stronger than strong convexity + smoothness. Algorithm 6.1 refers to the L-BFGS algorithm described on page 20. Formula extraction: Successfully extracted the convergence bound f_k - f* ≤ r^k[f_0 - f*] from equation (6.5) using the 3-checkpoint workflow. The crop includes context showing this is the R-linear convergence result, with all subscripts, superscripts, and the inequality symbol fully visible.

## Used In

- AlgorithmExplainer
- LbfgsTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/liunocedal1989_page_0021.png)

### Page 2

![Proof page 2](../extracted-pages/liunocedal1989_page_0022.png)

### Page 3

![Proof page 3](../extracted-pages/liunocedal1989_page_0023.png)

