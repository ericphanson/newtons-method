# gd-strongly-convex-linear-convergence-nesterov-2018

## Reference

Yurii Nesterov. *Lectures on Convex Optimization* (2nd edition). Springer, 2018.

**File:** `Lectures on Convex Optimization.pdf`

## Claim

Gradient descent with fixed step size achieves linear convergence to the global minimum on strongly convex smooth functions when $0 < \alpha \leq 2/(L+\mu)$

## Quote

> If $f \in \mathscr{S}_{\mu,L}^{1,1}(\mathbb{R}^n)$ and $0 < h \leq \frac{2}{\mu+L}$, then the Gradient Method generates a sequence $\{x_k\}$ such that $\|x_k - x^*\|^2 \leq \left(1 - \frac{2h\mu L}{\mu+L}\right)^k \|x_0 - x^*\|^2$

**Pages:** 73-74, 81-82

**Theorem/Result:** Theorem 2.1.15

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1 - Theorem 2.1.15

**Cropped Formula Image:**

![lectures_on_convex_optimization_p101_theorem_2_1_15](../extracted-pages/formulas/lectures_on_convex_optimization_p101_theorem_2_1_15.png)

**Extracted LaTeX:**

$$
\|x_k - x^*\|^2 \leq \left(1 - \frac{2h\mu L}{\mu+L}\right)^k \|x_0 - x^*\|^2
$$

<details>
<summary>LaTeX Source</summary>

```latex
\|x_k - x^*\|^2 \leq \left(1 - \frac{2h\mu L}{\mu+L}\right)^k \|x_0 - x^*\|^2
```

</details>

**Verification:** ✅ Verified

**Metadata:** [lectures_on_convex_optimization_p101_theorem_2_1_15.json](../extracted-pages/formulas/lectures_on_convex_optimization_p101_theorem_2_1_15.json)

---

## Reader Notes

The notation $\mathscr{S}_{\mu,L}^{1,1}(\mathbb{R}^n)$ denotes strongly convex functions with strong convexity parameter $\mu > 0$ and Lipschitz continuous gradient with constant $L$ (see Definition 2.1.3 on page 94). The condition number $Q = L/\mu$ determines the convergence rate. With optimal step size $h = 2/(L+\mu)$, the per-iteration convergence rate is $\left(\frac{L-\mu}{L+\mu}\right)^{2} = \left(\frac{Q-1}{Q+1}\right)^{2}$ for the squared distance, yielding $\|x_k - x^*\|^2 \leq \left(\frac{L-\mu}{L+\mu}\right)^{2k} \|x_0 - x^*\|^2$ after $k$ iterations. This provides exponentially fast (linear) convergence. Note: Nesterov uses $h$ for step size in the theorem statement; here we use $\alpha$. This result differs from the merely convex case (Theorem 2.1.14), which has step size bound $2/L$ instead of $2/(L+\mu)$.

## Internal Notes

Internal: This is the updated 2nd edition (2018) version of the same result from the 2004 edition. The theorem is essentially the same but with slightly refined notation using $\mathscr{S}_{\mu,L}^{1,1}$ instead of $S_{\mu,L}^{1,1}$. The step size bound is $h \leq 2/(\mu+L)$ (allowing equality) instead of $h < 2/(L+\mu)$. Can be used for comparison with the 2004 edition to determine which source to recommend.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent

**Verification Notes:** INDEPENDENT VERIFICATION (2025-11-12): Verified quote is word-for-word accurate against Theorem 2.1.15 on page 101. Visual inspection confirms: (1) Theorem number is correct, (2) Page numbers 101-102 are accurate, (3) Quote matches source exactly including all mathematical notation. Verified claim matches theorem statement - linear convergence for strongly convex smooth functions with step size bound 0 < h ≤ 2/(μ+L). Cross-referenced usage in GdFixedTab.tsx lines 400 and 511 - both uses correctly state the step size condition and convergence rate. All proofPages are relevant: pages 93-94 provide Definition 2.1.3 of strongly convex functions, pages 101-102 contain Theorem 2.1.15. VERDICT: Citation is complete and accurate. No updates needed.

## Used In

- GdFixedTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/lectures_on_convex_optimization_page_0093.png)

### Page 2

![Proof page 2](../extracted-pages/lectures_on_convex_optimization_page_0094.png)

### Page 3

![Proof page 3](../extracted-pages/lectures_on_convex_optimization_page_0101.png)

### Page 4

![Proof page 4](../extracted-pages/lectures_on_convex_optimization_page_0102.png)

