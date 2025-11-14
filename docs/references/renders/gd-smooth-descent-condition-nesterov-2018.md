# gd-smooth-descent-condition-nesterov-2018

**Source:** [gd-smooth-descent-condition-nesterov-2018.json](../../citations/gd-smooth-descent-condition-nesterov-2018.json)

## Reference

Yurii Nesterov. *Lectures on Convex Optimization* (2nd edition). Springer, 2018.

**File:** `Lectures on Convex Optimization.pdf`

## Claim

For smooth convex functions (Lipschitz continuous gradient with constant $L$), gradient descent with step size $0 < h \leq 2/L$ converges to an optimal point. The proof establishes monotonic descent: $f(x_{k+1}) \leq f(x_k) - h(1 - \frac{hL}{2})\|\nabla f(x_k)\|^2$, which guarantees strict descent $f(x_{k+1}) < f(x_k)$ when $\nabla f(x_k) \neq 0$ and $h < 2/L$ (note: when $h = 2/L$ exactly, we still get non-strict descent).

## Quote

> Let $f \in \mathscr{F}_L^{1,1}(\mathbb{R}^n)$ and $0 < h \leq 2/L$. Then the Gradient Method generates a sequence $\{x_k\}$, which converges to some optimal point $x^*$.

**Pages:** 100-101

**Theorem/Result:** Theorem 2.1.14

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1 - Theorem 2.1.14 descent inequality

**Cropped Formula Image:**

![lectures_on_convex_optimization_p100_theorem_2_1_14_proof](../extracted-pages/formulas/lectures_on_convex_optimization_p100_theorem_2_1_14_proof.png)

**Extracted LaTeX:**

$$
f(x_{k+1}) \leq f(x_k) + \langle \nabla f(x_k), x_{k+1} - x_k \rangle + \frac{L}{2} \| x_{k+1} - x_k \|^2 = f(x_k) - \omega \| \nabla f(x_k) \|^2
$$

<details>
<summary>LaTeX Source</summary>

```latex
f(x_{k+1}) \leq f(x_k) + \langle \nabla f(x_k), x_{k+1} - x_k \rangle + \frac{L}{2} \| x_{k+1} - x_k \|^2 = f(x_k) - \omega \| \nabla f(x_k) \|^2
```

</details>

**Verification:** ✅ Verified

**Metadata:** [lectures_on_convex_optimization_p100_theorem_2_1_14_proof.json](../extracted-pages/formulas/lectures_on_convex_optimization_p100_theorem_2_1_14_proof.json)

---

### Formula 2 - Theorem 2.1.14 omega definition

**Cropped Formula Image:**

![lectures_on_convex_optimization_p101_theorem_2_1_14_proof](../extracted-pages/formulas/lectures_on_convex_optimization_p101_theorem_2_1_14_proof.png)

**Extracted LaTeX:**

$$
\omega = h(1 - \frac{L}{2}h)
$$

<details>
<summary>LaTeX Source</summary>

```latex
\omega = h(1 - \frac{L}{2}h)
```

</details>

**Verification:** ✅ Verified

**Metadata:** [lectures_on_convex_optimization_p101_theorem_2_1_14_proof.json](../extracted-pages/formulas/lectures_on_convex_optimization_p101_theorem_2_1_14_proof.json)

---

## Reader Notes

The notation $\mathscr{F}_L^{1,1}(\mathbb{R}^n)$ denotes convex functions with Lipschitz continuous gradient with constant $L$ (the function class is defined in Section 2.1.1, pages 59-69; see Definition 2.1.2 on page 62 for convex functions). However, the descent property itself follows from the upper bound inequality for smooth functions (Lemma 1.2.3 on page 23), which holds for any function with Lipschitz continuous gradient, not just convex functions. The condition $\alpha \leq 2/L$ ensures that each gradient descent step decreases the function value. Note: Nesterov uses $h$ for step size; here we use $\alpha$. This is a more general result than convergence - it guarantees monotonic decrease at each step. The 2018 edition uses calligraphic script $\mathscr{F}$ for function classes instead of the regular $F$ used in the 2004 edition, and allows equality in the step size bound ($h \leq 2/L$) instead of strict inequality ($h < 2/L$).

## Internal Notes

Internal: Used in GdFixedTab to explain the sufficient condition for descent on smooth functions. This is the 2018 edition version using calligraphic notation $\mathscr{F}_L^{1,1}$ instead of $F_L^{1,1}$ from the 2004 edition. The step size bound allows equality ($h \leq 2/L$) instead of strict inequality ($h < 2/L$). The descent property follows from the fundamental inequality for smooth functions (see Lemma 1.2.3 on page 23 which shows $f(y) \leq f(x) + \langle \nabla f(x), y-x \rangle + \frac{L}{2}\|y-x\|^2$ for L-smooth functions), which combined with the gradient step yields descent when $h \leq 2/L$.

## Verification

**Verified:** 2025-11-12

**Verified By:** adversarial-verification-agent-batch6-agent4

**Verification Notes:** CRITICAL FIXES APPLIED (2025-11-13 BATCH 3): (1) CORRECTED PAGE NUMBERS AGAIN - Previous fix used '80-83' (book pages) but listed wrong PDF pages. Theorem 2.1.14 is on PDF pages 100-101 (book pages 80-81 shown in headers). (2) Extracted formula images showing descent inequality f(x_{k+1}) ≤ f(x_k) - ω||∇f(x_k)||² where ω = h(1 - Lh/2). (3) Updated proofPages to correct PDF pages 100-101. (4) Verified quote matches Theorem 2.1.14 statement on page 100. (5) Confirmed formulaImages show complete formulas with no cutoffs.

## Used In

- GdFixedTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/lectures_on_convex_optimization_page_0100.png)

### Page 2

![Proof page 2](../extracted-pages/lectures_on_convex_optimization_page_0101.png)

