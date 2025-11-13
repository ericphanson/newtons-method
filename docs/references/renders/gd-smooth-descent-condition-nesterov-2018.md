# gd-smooth-descent-condition-nesterov-2018

## Reference

Yurii Nesterov. *Lectures on Convex Optimization* (2nd edition). Springer, 2018.

**File:** `Lectures on Convex Optimization.pdf`

## Claim

For smooth convex functions (Lipschitz continuous gradient with constant $L$), gradient descent with step size $0 < h \leq 2/L$ converges to an optimal point. The proof establishes monotonic descent: $f(x_{k+1}) \leq f(x_k) - h(1 - \frac{hL}{2})\|\nabla f(x_k)\|^2$, which guarantees strict descent $f(x_{k+1}) < f(x_k)$ when $\nabla f(x_k) \neq 0$ and $h < 2/L$ (note: when $h = 2/L$ exactly, we still get non-strict descent).

## Quote

> Let $f \in \mathscr{F}_L^{1,1}(\mathbb{R}^n)$ and $0 < h \leq 2/L$. Then the Gradient Method generates a sequence $\{x_k\}$, which converges to some optimal point $x^*$.

**Pages:** 80-83

**Theorem/Result:** Theorem 2.1.14

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1

**Extracted LaTeX:**

$$
f(x_{k+1}) \leq f(x_k) - h(1 - \frac{hL}{2})\|\nabla f(x_k)\|^2
$$

<details>
<summary>LaTeX Source</summary>

```latex
f(x_{k+1}) \leq f(x_k) - h(1 - \frac{hL}{2})\|\nabla f(x_k)\|^2
```

</details>

**Verification:** ❌ Not Verified

---

## Reader Notes

The notation $\mathscr{F}_L^{1,1}(\mathbb{R}^n)$ denotes convex functions with Lipschitz continuous gradient with constant $L$ (the function class is defined in Section 2.1.1, pages 59-69; see Definition 2.1.2 on page 62 for convex functions). However, the descent property itself follows from the upper bound inequality for smooth functions (Lemma 1.2.3 on page 23), which holds for any function with Lipschitz continuous gradient, not just convex functions. The condition $\alpha \leq 2/L$ ensures that each gradient descent step decreases the function value. Note: Nesterov uses $h$ for step size; here we use $\alpha$. This is a more general result than convergence - it guarantees monotonic decrease at each step. The 2018 edition uses calligraphic script $\mathscr{F}$ for function classes instead of the regular $F$ used in the 2004 edition, and allows equality in the step size bound ($h \leq 2/L$) instead of strict inequality ($h < 2/L$).

## Internal Notes

Internal: Used in GdFixedTab to explain the sufficient condition for descent on smooth functions. This is the 2018 edition version using calligraphic notation $\mathscr{F}_L^{1,1}$ instead of $F_L^{1,1}$ from the 2004 edition. The step size bound allows equality ($h \leq 2/L$) instead of strict inequality ($h < 2/L$). The descent property follows from the fundamental inequality for smooth functions (see Lemma 1.2.3 on page 23 which shows $f(y) \leq f(x) + \langle \nabla f(x), y-x \rangle + \frac{L}{2}\|y-x\|^2$ for L-smooth functions), which combined with the gradient step yields descent when $h \leq 2/L$.

## Verification

**Verified:** 2025-11-12

**Verified By:** adversarial-verification-agent-batch6-agent4

**Verification Notes:** CRITICAL FIXES APPLIED (2025-11-13): (1) Corrected page numbers from incorrect '39-40, 42, 60-63' to correct '80-83' where Theorem 2.1.14 actually appears. (2) Verified quote matches Theorem 2.1.14 word-for-word on page 81. (3) Confirmed step size condition is '0 < h ≤ 2/L' (with ≤, not <) as stated in theorem. (4) Clarified that strict descent f(x_{k+1}) < f(x_k) requires h < 2/L AND ∇f ≠ 0; when h = 2/L exactly, we still get non-strict descent. The descent property follows from the proof on pages 82-83.

## Used In

- GdFixedTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/lectures_on_convex_optimization_page_0059.png)

### Page 2

![Proof page 2](../extracted-pages/lectures_on_convex_optimization_page_0060.png)

### Page 3

![Proof page 3](../extracted-pages/lectures_on_convex_optimization_page_0062.png)

### Page 4

![Proof page 4](../extracted-pages/lectures_on_convex_optimization_page_0080.png)

### Page 5

![Proof page 5](../extracted-pages/lectures_on_convex_optimization_page_0081.png)

### Page 6

![Proof page 6](../extracted-pages/lectures_on_convex_optimization_page_0082.png)

### Page 7

![Proof page 7](../extracted-pages/lectures_on_convex_optimization_page_0083.png)

