# Nesterov 2018 - "Lectures on Convex Optimization" (2nd Edition)

Quick reference guide for navigating the book and finding key results.

## Book Metadata

- **Title:** Lectures on Convex Optimization
- **Author:** Yurii Nesterov
- **Year:** 2018
- **Edition:** 2nd
- **Publisher:** Springer
- **Pages:** 603 pages
- **PDF ID:** `lectures_on_convex_optimization`

## Structure Overview

The book is organized into two main parts:

### Part I: Black-Box Optimization (Chapters 1-4, pages 3-287)
Focus on optimization methods that only use function values and gradients.

### Part II: Structural Optimization (Chapters 5-7, pages 289-589)
Focus on exploiting problem structure (constraints, smoothness, etc.).

## Chapter Guide for First-Order Methods

### Chapter 1: Nonlinear Optimization (pages 3-58)
**What's here:** General optimization concepts, local methods, variable metric methods
- 1.1 World of Numerical Methods (p. 3)
- 1.2 Local Methods in Unconstrained Minimization (p. 17)
  - Gradient descent basics
  - Newton's method
- 1.3 First-Order Methods in Nonlinear Optimization (p. 40)
  - Variable metric methods
  - Quasi-Newton methods

**When to use:** Background on optimization methods, understanding the landscape of numerical methods.

---

### Chapter 2: Smooth Convex Optimization (pages 59-114)
**⭐ Most relevant for gradient descent theory!**

#### Section 2.1: Minimization of Smooth Functions (pages 59-114)

**2.1.1 Smooth Convex Functions (p. 59)**
- **Definition 2.1.1:** Convex sets (p. 61)
- **Definition 2.1.2:** Convex functions (p. 62)
- **Function class notation:** $\mathscr{F}_L^{1,1}(\mathbb{R}^n)$ = smooth convex functions with Lipschitz continuous gradient

**2.1.2 Lower Complexity Bounds (p. 69)**
- Worst-case complexity analysis
- Lower bounds for first-order methods

**2.1.3 Strongly Convex Functions (p. 93)** ⭐
- **Definition 2.1.3 (p. 94):** Strongly convex functions
  - Function class: $\mathscr{S}_{\mu,L}^{1,1}(\mathbb{R}^n)$ = strongly convex with parameter μ and Lipschitz gradient with constant L
- **Theorem 2.1.8 (p. 94):** Quadratic lower bound for strongly convex functions
- **Theorem 2.1.9 (p. 95):** Equivalent characterizations of strong convexity
- **Theorem 2.1.10 (p. 95):** Useful inequalities for strongly convex functions
- **Theorem 2.1.11 (p. 95):** Second-order characterization (Hessian ⪰ μI)

**2.1.4 Lower Complexity Bounds (p. 77)**
- Lower bounds for strongly convex case

**2.1.5 The Gradient Method (p. 80)** ⭐
- **Theorem 2.1.14 (p. 81):** Gradient descent on smooth convex functions (sublinear O(1/k) rate)
  - Step size: 0 < h ≤ 2/L
  - Convergence guarantee with optimal step size h = 1/L
- **Corollary 2.1.2 (p. 81):** Explicit rate with optimal step size
  - Gives convergence constant L/(2(k+1)), cleaner than 2004 edition's 2L/(k+4)
- **Theorem 2.1.15 (p. 101-102):** ⭐ **Gradient descent on strongly convex functions (linear rate)**
  - Step size: 0 < h ≤ 2/(μ+L)
  - Linear convergence: $(1 - \frac{2h\mu L}{\mu+L})^k$
  - Optimal rate with h = 2/(μ+L): $(\frac{L-\mu}{L+\mu})^{2k}$

#### Section 2.2: Optimal Methods (p. 102-114) ⭐
**Accelerated gradient descent with O(1/k²) rate**

**2.2.1 Estimating Sequences (p. 102-109)**
- Definition 2.2.1 (p. 103): Estimating sequences
- Lemmas 2.2.1-2.2.4 (p. 104-109): Building blocks for optimal methods
- General Optimal Method Scheme (2.2.7, p. 108): Framework for all accelerated methods

**2.2.2 Optimal Methods (p. 109-114)**
- **Theorem 2.2.2 (p. 110-111):** ⭐ **Optimality of accelerated gradient**
  - Proves O(1/k²) convergence for smooth convex functions
  - Shows the method is optimal (matches lower bound from Theorem 2.1.7)
  - Equation (2.2.18, p. 112): Explicit O(1/k²) rate: $f(x_k) - f^* \leq \frac{8L\|x_0-x^*\|^2}{3(k+1)^2}$ for μ=0
- **Constant Step Schemes (p. 112-114):** Simplified momentum forms
  - Scheme I (2.2.19, p. 112): First simplification of general scheme
  - Scheme II (2.2.20, p. 113): Eliminates γ sequence
  - **Scheme III (2.2.22, p. 114):** ⭐ Classic momentum form with explicit coefficient

**2.2.3 Decreasing the Norm of the Gradient (p. 97)**

**2.2.4 Convex Sets (p. 101)**

**2.2.5 The Gradient Mapping (p. 112)**

**2.2.6 Minimization over Simple Sets (p. 114)**

---

### Chapter 3: Minimization Problems (pages 115+)
**What's here:** Constrained optimization, projection methods, dual methods
- When to use: For problems with constraints

### Chapter 4: Second-Order Methods (pages 261+)
**What's here:** Newton's method, self-concordant functions, interior point methods
- When to use: For problems where second-order information is available

## Quick Lookup: Common Results

### Gradient Descent Convergence

| Function Class | Theorem | Pages | Rate | Step Size |
|---------------|---------|-------|------|-----------|
| Smooth convex ($\mathscr{F}_L^{1,1}$) | Theorem 2.1.14 | 81 | O(1/k) sublinear | 0 < h ≤ 2/L |
| Strongly convex ($\mathscr{S}_{\mu,L}^{1,1}$) | Theorem 2.1.15 | 101-102 | Linear (geometric) | 0 < h ≤ 2/(μ+L) |
| Smooth convex (accelerated) | Theorem 2.2.2 | 110-111 | O(1/k²) optimal | h = 1/L (see eq. 2.2.22) |

### Key Definitions

| Concept | Definition | Page | Notation |
|---------|-----------|------|----------|
| Convex functions | Definition 2.1.2 | 62 | - |
| Smooth convex functions | Definition 2.1.2 + Section 2.1.1 | 59-69 | $\mathscr{F}_L^{1,1}(\mathbb{R}^n)$ |
| Strongly convex functions | Definition 2.1.3 | 94 | $\mathscr{S}_{\mu,L}^{1,1}(\mathbb{R}^n)$ |
| Lipschitz continuous gradient | Implicit in 2.1.1 | 59+ | L is the Lipschitz constant |

### Important Notation

- $\mathscr{F}_L^{1,1}(\mathbb{R}^n)$: Convex functions with L-Lipschitz continuous gradient
- $\mathscr{S}_{\mu,L}^{1,1}(\mathbb{R}^n)$: Strongly convex functions (parameter μ) with L-Lipschitz gradient
- $h$: Step size (what we call α in our implementation)
- $Q = L/\mu$: Condition number
- $x^*$: Optimal point
- $f^*$: Optimal value

## Search Strategy Tips

### Looking for gradient descent results?
1. **Start with Section 2.1.5** (p. 80+) - "The Gradient Method"
2. Check pages 81-82 for smooth convex case (Theorem 2.1.14)
3. Check pages 101-102 for strongly convex case (Theorem 2.1.15)
4. Look at page 94 for Definition 2.1.3 (strongly convex functions)

### Looking for definitions?
1. **Section 2.1.1** (p. 59-69) has all basic smoothness definitions
2. **Section 2.1.3** (p. 93-96) has strongly convex definitions and characterizations
3. Early in each chapter for new concepts

### Looking for lower bounds (impossibility results)?
1. **Section 2.1.2** (p. 69) - Lower bounds for smooth convex
2. **Section 2.1.4** (p. 77) - Lower bounds for strongly convex

### Looking for accelerated methods?
1. **Section 2.2 "Optimal Methods"** (p. 102-114) - Accelerated gradient descent
2. **Theorem 2.2.2** (p. 110-111) - Optimality proof for O(1/k²) rate
3. **Equation (2.2.18)** (p. 112) - Explicit O(1/k²) convergence rate for smooth convex
4. **Constant Step Scheme III (2.2.22)** (p. 114) - Classic momentum form
5. **Estimating sequences framework** (p. 102-109) - Theoretical foundation
6. **Scheme progression:** General (2.2.7, p. 108) → Scheme I (2.2.19, p. 112) → Scheme II (2.2.20, p. 113) → Scheme III (2.2.22, p. 114)

## Differences from 2004 Edition

The 2018 edition is a substantial expansion and refinement of the 2004 "Introductory Lectures on Convex Optimization: A Basic Course."

**Key improvements:**
1. **More comprehensive:** 603 pages vs. 253 pages
2. **Refined notation:** Uses $\mathscr{S}$ (calligraphic) instead of $S$ for function classes
3. **More precise statements:** Step size bounds allow equality (≤ instead of <)
4. **Additional chapters:** More material on structural optimization (Part II)
5. **Better typography:** Clearer mathematical presentation

**Theorem numbering:** Many theorems have the same numbers (e.g., Theorem 2.1.15 appears in both), but page numbers differ:
- 2004 edition: Theorem 2.1.15 on pages 86-87
- 2018 edition: Theorem 2.1.15 on pages 101-102

## Citation Tips

When creating citations from this book:
1. Always verify math notation visually (use `extract-pdf-pages.py`)
2. Use the calligraphic $\mathscr{S}$ for strongly convex function classes
3. Note the step size condition includes equality: $h \leq 2/(μ+L)$
4. Include Definition 2.1.3 (page 94) in proofPages for strongly convex results
5. The book uses $h$ for step size; translate to $\alpha$ if needed for consistency

## Chunk File Locations

All text chunks are in: `docs/references/chunks/lectures_on_convex_optimization/`

Each chunk covers 10 pages and follows the naming pattern:
```
lectures_on_convex_optimization_pages_XXXX-YYYY.txt
```

For example:
- Pages 91-100: `lectures_on_convex_optimization_pages_0091-0100.txt`
- Pages 101-110: `lectures_on_convex_optimization_pages_0101-0110.txt`

## Extracted Page Images

When you extract pages using `extract-pdf-pages.py`, they are saved to:
```
docs/references/extracted-pages/lectures_on_convex_optimization_page_XXXX.png
```

## Related Resources

- **Citation workflow:** [docs/workflows/citation-workflow.md](../workflows/citation-workflow.md)
- **Citations registry:** [docs/citations.json](../citations.json)
- **Chunk index:** [docs/references/chunk-index.json](chunk-index.json)
