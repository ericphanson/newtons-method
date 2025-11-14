# newton-quadratic-convergence

**Source:** [newton-quadratic-convergence.json](../../citations/newton-quadratic-convergence.json)

## Reference

Jorge Nocedal and Stephen J. Wright. *Numerical Optimization* (2nd edition). Springer, 2006.

**File:** `NumericalOptimization2006.pdf`

## Claim

Newton's method achieves quadratic convergence on strongly convex functions with Lipschitz continuous Hessian, when starting close enough to the optimum

## Quote

> Suppose that $f$ is twice differentiable and that the Hessian $\nabla^2 f(x)$ is Lipschitz continuous (see (A.42)) in a neighborhood of a solution $x^*$ at which the sufficient conditions (Theorem 2.4) are satisfied. Consider the iteration $x_{k+1} = x_k + p_k$, where $p_k$ is given by (3.30). Then (i) if the starting point $x_0$ is sufficiently close to $x^*$, the sequence of iterates converges to $x^*$; (ii) the rate of convergence of $\{x_k\}$ is quadratic; and (iii) the sequence of gradient norms $\{\|\nabla f_k\|\}$ converges quadratically to zero.

**Pages:** 44-45

**Theorem/Result:** Theorem 3.5

## Extracted Formulas

*These formulas were extracted using the cropping workflow (see [agent-formula-extraction.md](../workflows/agent-formula-extraction.md)) for verification.*

### Formula 1 - Theorem 3.5 (3.33)

**Cropped Formula Image:**

![numericaloptimization2006_p65_theorem_3_5](../extracted-pages/formulas/numericaloptimization2006_p65_theorem_3_5.png)

**Extracted LaTeX:**

$$
\|x_k + p_k^N - x^*\| \leq L\|\nabla^2 f(x^*)^{-1}\|\|x_k - x^*\|^2 = \tilde{L}\|x_k - x^*\|^2.
$$

<details>
<summary>LaTeX Source</summary>

```latex
\|x_k + p_k^N - x^*\| \leq L\|\nabla^2 f(x^*)^{-1}\|\|x_k - x^*\|^2 = \tilde{L}\|x_k - x^*\|^2.
```

</details>

**Verification:** ✅ Verified

**Metadata:** [numericaloptimization2006_p65_theorem_3_5.json](../extracted-pages/formulas/numericaloptimization2006_p65_theorem_3_5.json)

---

## Reader Notes

Newton's method achieves quadratic convergence under three key conditions: (1) The Hessian $\nabla^2 f(x)$ must be Lipschitz continuous near the solution $x^*$, meaning $\|\nabla^2 f(x) - \nabla^2 f(y)\| \leq L\|x - y\|$ for some constant $L > 0$. This is stronger than just having a continuous Hessian. (2) The solution $x^*$ must satisfy second-order sufficient conditions: $\nabla f(x^*) = 0$ (first-order optimality) and $\nabla^2 f(x^*)$ is positive definite (second-order optimality). This means $x^*$ is a strict local minimum where the Hessian has all positive eigenvalues. (3) The starting point $x_0$ must be sufficiently close to $x^*$. The convergence rate is $\|x_{k+1} - x^*\| \leq \tilde{L}\|x_k - x^*\|^2$ where $\tilde{L} = L\|\nabla^2 f(x^*)^{-1}\|$, demonstrating that the error is squared at each iteration. This quadratic convergence means the number of correct digits roughly doubles at each step once the method is close enough to the solution. The Lipschitz continuous Hessian condition is crucial: it ensures the Hessian doesn't change too rapidly, allowing the quadratic model to be accurate. For strongly convex functions (where $\mu I \preceq \nabla^2 f(x) \preceq LI$ globally), these conditions are satisfied automatically once we're in the basin of attraction.

## Internal Notes

Internal: Theorem 3.5 establishes quadratic convergence for Newton's method under the key conditions: (1) twice differentiable function, (2) Lipschitz continuous Hessian near the solution, (3) second-order sufficient conditions satisfied at $x^*$ (i.e., $\nabla f(x^*) = 0$ and $\nabla^2 f(x^*)$ positive definite), and (4) starting point sufficiently close to the solution. The proof shows $\|x_{k+1} - x^*\| \leq \tilde{L}\|x_k - x^*\|^2$ where $\tilde{L} = L\|\nabla^2 f(x^*)^{-1}\|$ and $L$ is the Lipschitz constant of the Hessian. Equation (3.30) refers to the Newton step $p_k^N = -(\nabla^2 f_k)^{-1}\nabla f_k$. Theorem 2.4 refers to second-order sufficient conditions for a local minimizer. Used in NewtonTab to explain the theoretical convergence rate.

## Verification

**Verified:** 2025-11-12

**Verified By:** verification-agent

**Verification Notes:** INDEPENDENTLY VERIFIED following ENHANCED workflow (citation-verification.md): (1) QUOTE ACCURACY: Verified word-for-word against OCR (pages 61-70) and visual inspection of proof pages 64-65. Quote matches Theorem 3.5 exactly, including punctuation and mathematical notation. (2) PAGE NUMBERS: Confirmed pages 64-65 are correct - page 64 contains the theorem statement (lines 195-202 of OCR), page 65 contains the proof (lines 210-269). PDF pages match printed book pages. (3) THEOREM REFERENCE: Theorem 3.5 correctly identified. Equation (3.30) referenced in quote is defined on page 64 line 180 as $p_k^N = -\nabla^2 f_k^{-1} \nabla f_k$. Theorem 2.4 (second-order sufficient conditions) referenced in quote. (4) CLAIM CORRECTNESS: The claim accurately reflects the theorem. The claim says 'strongly convex functions with Lipschitz continuous Hessian' which is slightly stronger than what the theorem requires (theorem only requires Lipschitz continuous Hessian and second-order sufficient conditions at $x^*$), but this is acceptable as strongly convex functions satisfy these conditions. (5) USAGE IN CODE: Checked NewtonTab.tsx lines 327, 526, 642, 662 - all uses are contextually appropriate, explaining quadratic convergence rate near the solution. (6) PROOF VERIFICATION: The proof on page 65 shows the quadratic bound in equation (3.33): $\|x_k + p_k^N - x^*\| \leq L\|\nabla^2 f(x^*)^{-1}\|\|x_k - x^*\|^2$ where $\tilde{L} = L\|\nabla^2 f(x^*)^{-1}\|$ and $L$ is the Lipschitz constant. This establishes $\|e_{k+1}\| \leq C\|e_k\|^2$ (quadratic convergence). The three parts of the theorem are: (i) convergence when starting close enough, (ii) quadratic rate, (iii) gradient norms converge quadratically to zero. All verified correct.

## Used In

- NewtonTab

## Proof Pages

### Page 1

![Proof page 1](../extracted-pages/numericaloptimization2006_page_0064.png)

### Page 2

![Proof page 2](../extracted-pages/numericaloptimization2006_page_0065.png)

