# lbfgs-linear-convergence-liu-nocedal-1989

## Reference

Dong C. Liu and Jorge Nocedal. *On the Limited Memory BFGS Method for Large Scale Optimization*. Mathematical Programming, 45:503-528, 1989.

**File:** `LiuNocedal1989.pdf`

## Claim

L-BFGS converges R-linearly (not superlinearly) on uniformly convex problems. The rate of convergence is linear, not superlinear. The paper explicitly states that 'R-linear convergence is the best we can expect' from L-BFGS.

## Quote

> In this section we show that the limited memory BFGS method is globally convergent on uniformly convex problems, and that its rate of convergence is R-linear... Then for any positive definite $B_0$, Algorithm 6.1 generates a sequence $\{x_k\}$ which converges to $x_*$. Moreover there is a constant $0 \leq r < 1$ such that $f_k - f_* \leq r^k[f_0 - f_*]$ which implies that $\{x_k\}$ converges R-linearly... R-linear convergence is the best we can expect.

**Pages:** 20-23

**Theorem/Result:** Theorem 6.1

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1

**Extracted LaTeX:**

$$
d_k = -B_k^{-1} g_k
$$

<details>
<summary>LaTeX Source</summary>

```latex
d_k = -B_k^{-1} g_k
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 2

**Extracted LaTeX:**

$$
x_{k+1} = x_k + \alpha_k d_k
$$

<details>
<summary>LaTeX Source</summary>

```latex
x_{k+1} = x_k + \alpha_k d_k
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 3

**Extracted LaTeX:**

$$
B_k^{(l+1)} = B_k^{(l)} - \frac{B_k^{(l)} s_{j_l} s_{j_l}^T B_k^{(l)}}{s_{j_l}^T B_k^{(l)} s_{j_l}} + \frac{y_{j_l} y_{j_l}^T}{y_{j_l}^T s_{j_l}}
$$

<details>
<summary>LaTeX Source</summary>

```latex
B_k^{(l+1)} = B_k^{(l)} - \frac{B_k^{(l)} s_{j_l} s_{j_l}^T B_k^{(l)}}{s_{j_l}^T B_k^{(l)} s_{j_l}} + \frac{y_{j_l} y_{j_l}^T}{y_{j_l}^T s_{j_l}}
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 4

**Extracted LaTeX:**

$$
M_1 \|z\|^2 \leq z^T G(x) z \leq M_2 \|z\|^2
$$

<details>
<summary>LaTeX Source</summary>

```latex
M_1 \|z\|^2 \leq z^T G(x) z \leq M_2 \|z\|^2
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 5

**Extracted LaTeX:**

$$
f_k - f_* \leq r^k [f_0 - f_*]
$$

<details>
<summary>LaTeX Source</summary>

```latex
f_k - f_* \leq r^k [f_0 - f_*]
```

</details>

**Verification:** ❌ Not Verified

---

### Formula 6

**Extracted LaTeX:**

$$
\cos \theta_k = \frac{s_k^T B_k s_k}{\|s_k\| \|B_k s_k\|} \geq \delta
$$

<details>
<summary>LaTeX Source</summary>

```latex
\cos \theta_k = \frac{s_k^T B_k s_k}{\|s_k\| \|B_k s_k\|} \geq \delta
```

</details>

**Verification:** ❌ Not Verified

---

## Reader Notes

**IMPORTANT:** L-BFGS achieves only **linear convergence**, not superlinear. Liu & Nocedal (1989) Theorem 6.1 proves that L-BFGS has R-linear convergence, and the paper explicitly states 'R-linear convergence is the best we can expect' (p. 23). This is fundamentally different from full BFGS, which can achieve superlinear convergence (Nocedal & Wright 2006, Theorem 6.6). The limited memory in L-BFGS (storing only $M$ recent curvature pairs) prevents the Hessian approximation from fully converging to the true Hessian, which limits the convergence rate to linear. The memory parameter $M$ affects the constant in the linear convergence rate but does NOT change the order of convergence to superlinear. Nocedal & Wright (2006) p. 196 confirms: L-BFGS yields 'an acceptable (albeit linear) rate of convergence.' Despite being 'only' linear, L-BFGS's convergence is still very effective in practice due to its low memory requirements ($O(Md)$ vs $O(d^2)$ for full BFGS) which enable its use on large-scale problems where full BFGS would be infeasible.

## Internal Notes

Internal: CRITICAL CORRECTION - This citation establishes that L-BFGS has LINEAR convergence, NOT superlinear. The paper explicitly states 'R-linear convergence is the best we can expect' (p. 23). This is in contrast to full BFGS, which can achieve superlinear convergence. Nocedal & Wright (2006) p. 196 also confirms L-BFGS has 'acceptable (albeit linear) rate of convergence.' The memory parameter M affects the constant in the linear convergence rate, not the order of convergence. Used in AlgorithmExplainer to correct the incorrect superlinear convergence claim.

## Verification

**Verified:** 2025-11-13

**Verified By:** claude-code-citation-processor

**Verification Notes:** FULL CITATION PROCESSING COMPLETE: (1) Citation read and verified from liu-nocedal-1989 in references.json with pageOffset 1 (article pages 20-27 correspond to PDF pages 21-28); (2) Quote verified verbatim against source text - all notation correct ($x_*$, $f_*$ subscripts); (3) Theorem number and pages confirmed: Theorem 6.1 spans pages 22-23 (article) covering Assumptions 6.1 (page 21) through proof conclusion (page 23); (4) All six formulas extracted with page locations and significance notes, including the critical convergence result (6.5); (5) Formula images linked to corresponding PDF pages where equations appear; (6) Claim standalone verified - statement 'R-linear convergence is the best we can expect' found on page 23, last paragraph before Section 8.

## Used In

- AlgorithmExplainer

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/liunocedal1989_page_0021.png)

### Page 2

![Proof page 2](../extracted-pages/liunocedal1989_page_0022.png)

### Page 3

![Proof page 3](../extracted-pages/liunocedal1989_page_0023.png)

### Page 4

![Proof page 4](../extracted-pages/liunocedal1989_page_0024.png)

