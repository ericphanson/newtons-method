# Glossary Expansion Plan

**Generated:** 2025-11-10
**Purpose:** Identify new terms to add to the glossary and specify where to use `<GlossaryTooltip />` components

---

## Executive Summary

After analyzing the codebase, I identified **12 technical terms** that meet the glossary style guide criteria and should be added. These terms appear in 5+ locations, require precise mathematical definitions, or affect algorithm behavior. Additionally, I identified **45+ specific locations** where tooltips should be added following the "first occurrence in section" and "critical claims" guidelines.

**Current glossary coverage:** 4 terms (smooth, strongly-convex, strong-convexity, convex)
**Proposed additions:** 12 terms
**Total glossary terms after expansion:** 16 terms

---

## 1. New Terms to Add to Glossary

### 1.1 Hessian

**Why it meets criteria:**
- ✅ Used in 103 occurrences across 8 files
- ✅ Technical term requiring precise definition
- ✅ Foundational concept for second-order optimization
- ✅ Affects algorithm behavior (Newton's method, diagonal preconditioner)
- ✅ Common confusion: users may not know what "matrix of second derivatives" means

**Proposed definition:**
```tsx
'hessian': {
  term: 'Hessian',
  definition: (
    <>
      <strong>Hessian matrix:</strong> The matrix of all second partial derivatives of a function.
      For f(w), the Hessian H has entries H_ij = ∂²f/∂w_i∂w_j. It captures the local curvature
      of the function. Second-order optimization methods (Newton, quasi-Newton) use the Hessian
      to take smarter steps than gradient descent.
    </>
  ),
}
```

**Suggested glossary key:** `hessian`

---

### 1.2 Eigenvalue

**Why it meets criteria:**
- ✅ Used in 22 occurrences across 5 files
- ✅ Technical term requiring precise definition
- ✅ Affects algorithm behavior (positive definite check, condition number)
- ✅ Critical for understanding convexity and convergence
- ✅ Common understanding differs from mathematical meaning

**Proposed definition:**
```tsx
'eigenvalue': {
  term: 'eigenvalue',
  definition: (
    <>
      <strong>Eigenvalue:</strong> A scalar λ such that Hv = λv for some non-zero vector v
      (the eigenvector). For the Hessian matrix, eigenvalues reveal the curvature in different
      directions. All positive eigenvalues → convex function. Negative eigenvalues → saddle
      points or local maxima. The ratio λ_max/λ_min is the condition number.
    </>
  ),
}
```

**Suggested glossary key:** `eigenvalue`

---

### 1.3 Quadratic Convergence

**Why it meets criteria:**
- ✅ Used in 9 occurrences across 4 files
- ✅ Technical term requiring precise definition
- ✅ Key property of Newton's method
- ✅ Common confusion: "quadratic" doesn't mean the function is quadratic
- ✅ Distinguishes Newton from gradient descent

**Proposed definition:**
```tsx
'quadratic-convergence': {
  term: 'quadratic convergence',
  definition: (
    <>
      <strong>Quadratic convergence:</strong> Error ||e_k|| ≤ C||e_{k-1}||² where e_k = w_k - w*.
      The error is <em>squared</em> each iteration, so the number of correct digits doubles
      per iteration. Much faster than linear convergence. Newton's method achieves this near
      a minimum with positive definite Hessian.
    </>
  ),
}
```

**Suggested glossary key:** `quadratic-convergence`

---

### 1.4 Linear Convergence

**Why it meets criteria:**
- ✅ Used in 5 occurrences across 3 files
- ✅ Technical term requiring precise definition
- ✅ Convergence property of gradient descent
- ✅ Common confusion: "linear" means exponential decay, not constant decrease
- ✅ Important comparison with quadratic and superlinear convergence

**Proposed definition:**
```tsx
'linear-convergence': {
  term: 'linear convergence',
  definition: (
    <>
      <strong>Linear convergence:</strong> Error ||e_k|| ≤ C·r^k where 0 &lt; r &lt; 1.
      The error decreases by a constant <em>factor</em> each iteration (not a constant amount).
      Gradient descent achieves linear convergence on strongly convex smooth functions.
      Slower than quadratic but still exponentially fast.
    </>
  ),
}
```

**Suggested glossary key:** `linear-convergence`

---

### 1.5 Superlinear Convergence

**Why it meets criteria:**
- ✅ Used in 3 occurrences across 2 files (L-BFGS)
- ✅ Technical term requiring precise definition
- ✅ Distinguishes L-BFGS from other methods
- ✅ Common confusion: between linear, superlinear, and quadratic

**Proposed definition:**
```tsx
'superlinear-convergence': {
  term: 'superlinear convergence',
  definition: (
    <>
      <strong>Superlinear convergence:</strong> Error ratio ||e_{k+1}||/||e_k|| → 0 as k → ∞.
      Faster than linear convergence but slower than quadratic. L-BFGS achieves this by
      building increasingly accurate Hessian approximations. Practically, converges almost
      as fast as Newton near the solution.
    </>
  ),
}
```

**Suggested glossary key:** `superlinear-convergence`

---

### 1.6 Ill-Conditioned

**Why it meets criteria:**
- ✅ Used in 30 occurrences across 7 files
- ✅ Technical term requiring precise definition
- ✅ Affects algorithm behavior (gradient descent struggles, Newton handles it)
- ✅ Entire problem type dedicated to demonstrating this
- ✅ Common confusion: what "conditioning" means

**Proposed definition:**
```tsx
'ill-conditioned': {
  term: 'ill-conditioned',
  definition: (
    <>
      <strong>Ill-conditioned:</strong> A problem where the condition number κ = λ_max/λ_min
      is large (κ ≫ 1). The Hessian has very different curvatures in different directions,
      creating elongated elliptical contours. Gradient descent zig-zags badly. Newton's method
      handles ill-conditioning by using the full Hessian to scale steps appropriately in each direction.
    </>
  ),
}
```

**Suggested glossary key:** `ill-conditioned`

---

### 1.7 Condition Number

**Why it meets criteria:**
- ✅ Used in 6 occurrences across 3 files
- ✅ Technical term requiring precise definition
- ✅ Displayed in metrics panel (users see it every run)
- ✅ Quantifies ill-conditioning
- ✅ Affects convergence rate

**Proposed definition:**
```tsx
'condition-number': {
  term: 'condition number',
  definition: (
    <>
      <strong>Condition number:</strong> κ = λ_max/λ_min, the ratio of largest to smallest
      Hessian eigenvalues. Measures how "elongated" the problem is. κ = 1 means perfectly
      spherical (easy). κ = 100 means 100:1 aspect ratio (moderate difficulty). κ = 1000+
      means severe elongation (gradient descent struggles badly).
    </>
  ),
}
```

**Suggested glossary key:** `condition-number`

---

### 1.8 Positive Definite

**Why it meets criteria:**
- ✅ Used in 8 occurrences across 2 files
- ✅ Technical term requiring precise definition
- ✅ Critical condition for Newton's method convergence
- ✅ Relates to convexity and Hessian eigenvalues
- ✅ Common confusion: what "definite" means

**Proposed definition:**
```tsx
'positive-definite': {
  term: 'positive definite',
  definition: (
    <>
      <strong>Positive definite matrix:</strong> A matrix H where all eigenvalues are positive
      (λ &gt; 0). Equivalently, v^T H v &gt; 0 for all non-zero vectors v. When the Hessian
      is positive definite, the function is locally convex and Newton's direction -H^{-1}∇f
      points downhill. Required for guaranteed Newton convergence.
    </>
  ),
}
```

**Suggested glossary key:** `positive-definite`

---

### 1.9 Lipschitz Continuous

**Why it meets criteria:**
- ✅ Used in 7 occurrences across 3 files
- ✅ Technical term requiring precise definition
- ✅ Already mentioned in "smooth" definition but deserves standalone entry
- ✅ Affects step size bounds and convergence guarantees
- ✅ Common confusion: continuous vs. Lipschitz continuous

**Proposed definition:**
```tsx
'lipschitz-continuous': {
  term: 'Lipschitz continuous',
  definition: (
    <>
      <strong>Lipschitz continuous:</strong> A function g where ||g(x) - g(y)|| ≤ L||x - y||
      for some constant L (the Lipschitz constant). Means the function can't change
      arbitrarily fast - bounded rate of change. Smooth functions have Lipschitz continuous
      gradients. This property enables convergence guarantees and step size bounds.
    </>
  ),
}
```

**Suggested glossary key:** `lipschitz-continuous`

---

### 1.10 First-Order Method

**Why it meets criteria:**
- ✅ Used in 6 occurrences across 1 file (AlgorithmExplainer.tsx)
- ✅ Technical classification requiring precise definition
- ✅ Distinguishes GD/line-search/diagonal from Newton/L-BFGS
- ✅ Common confusion: what "order" means
- ✅ Affects computational cost and convergence properties

**Proposed definition:**
```tsx
'first-order-method': {
  term: 'first-order method',
  definition: (
    <>
      <strong>First-order method:</strong> An optimization algorithm that uses only the
      gradient (first derivatives), not the Hessian (second derivatives). Examples: gradient
      descent, line search methods. Cheaper per iteration (O(n) vs O(n³)) but typically
      slower convergence than second-order methods.
    </>
  ),
}
```

**Suggested glossary key:** `first-order-method`

---

### 1.11 Second-Order Method

**Why it meets criteria:**
- ✅ Used in 6 occurrences across 3 files
- ✅ Technical classification requiring precise definition
- ✅ Describes Newton's method
- ✅ Complements first-order definition
- ✅ Common confusion: computational cost vs. convergence benefit

**Proposed definition:**
```tsx
'second-order-method': {
  term: 'second-order method',
  definition: (
    <>
      <strong>Second-order method:</strong> An optimization algorithm that uses both the
      gradient and Hessian (second derivatives). Examples: Newton's method. More expensive
      per iteration (O(n³) for dense problems) but much faster convergence (quadratic near
      solution vs. linear for first-order methods). Worth the cost for small-medium problems.
    </>
  ),
}
```

**Suggested glossary key:** `second-order-method`

---

### 1.12 Basin of Convergence

**Why it meets criteria:**
- ✅ Used in 9 occurrences in ProblemExplainer.tsx
- ✅ Technical term requiring precise definition
- ✅ Entire visualization tool dedicated to basins
- ✅ Important for multimodal problems (Himmelblau, Three-Hump Camel)
- ✅ Common confusion: basin vs. local minimum

**Proposed definition:**
```tsx
'basin-of-convergence': {
  term: 'basin of convergence',
  definition: (
    <>
      <strong>Basin of convergence:</strong> The set of initial points that lead an
      optimization algorithm to converge to a particular local minimum. For multimodal
      functions, different starting points may converge to different minima. Basin boundaries
      can be complex (fractal-like). Larger basins = more likely to find that minimum with
      random initialization.
    </>
  ),
}
```

**Suggested glossary key:** `basin-of-convergence`

---

## 2. Where to Use Tooltips

### 2.1 AlgorithmExplainer.tsx

#### Gradient Descent (Fixed Step) - Lines 18-87

**Line 26** (Type description):
```tsx
<strong>Type:</strong> <GlossaryTooltip termKey="first-order-method" /> (uses only gradient)
```
- **Reason:** First occurrence of "first-order method" in the algorithm descriptions
- **Context:** Critical claim distinguishing GD from Newton

**Line 45** (Convergence rate):
```tsx
<strong>Convergence rate:</strong> <GlossaryTooltip termKey="linear-convergence" /> for{' '}
```
- **Reason:** First occurrence of "linear convergence" in algorithm descriptions
- **Context:** Critical claim about convergence properties

**Line 73** (Weakness):
```tsx
<li>Struggles with <GlossaryTooltip termKey="ill-conditioned" /> problems (zig-zagging)</li>
```
- **Reason:** First occurrence of "ill-conditioned" in AlgorithmExplainer
- **Context:** Critical weakness explanation

---

#### Gradient Descent (Line Search) - Lines 89-167

**Line 97** (Type description):
```tsx
<strong>Type:</strong> <GlossaryTooltip termKey="first-order-method" /> with adaptive step size
```
- **Reason:** Near repeat but in different section (new context: adaptive)
- **Context:** NOT a tooltip - plain text (too close to previous)

**Line 126** (Convergence rate):
```tsx
<strong>Convergence rate:</strong> <GlossaryTooltip termKey="linear-convergence" /> for{' '}
```
- **Reason:** Near repeat in different algorithm section
- **Context:** NOT a tooltip - already defined above

**Line 154** (Weakness):
```tsx
<li>Still struggles with <GlossaryTooltip termKey="ill-conditioning" /></li>
```
- **Reason:** Different section, key limitation
- **Context:** Yes, tooltip here (different algorithm, reinforcing limitation)

---

#### Diagonal Preconditioner - Lines 169-296

**Line 177** (Type description):
```tsx
<strong>Type:</strong> <GlossaryTooltip termKey="first-order-method" /> with per-coordinate step sizes
```
- **Reason:** Same section pattern, different algorithm
- **Context:** NOT a tooltip - too repetitive

**Line 230** (Convergence rate):
```tsx
<strong>Convergence rate:</strong> Solves axis-aligned quadratic problems in 1-2 iterations
(becomes equivalent to Newton's method when <GlossaryTooltip termKey="hessian" /> is diagonal).
```
- **Reason:** First occurrence of standalone "Hessian" explanation in convergence context
- **Context:** Critical claim about when diagonal preconditioner = Newton

**Line 257** (Weakness - coordinate-dependent):
```tsx
<li><strong>Coordinate-dependent</strong> - performance varies with rotation</li>
```
- **Reason:** No tooltip needed - explained in surrounding text
- **Context:** NOT a tooltip - self-explanatory in context

---

#### Newton's Method - Lines 298-416

**Line 307** (Type description):
```tsx
<strong>Type:</strong> <GlossaryTooltip termKey="second-order-method" /> (uses gradient and <GlossaryTooltip termKey="hessian" />)
```
- **Reason:** First occurrence of "second-order method" (critical distinction)
- **Context:** Critical claim; second tooltip for Hessian reinforces importance

**Line 375** (Convergence rate):
```tsx
<strong>Convergence rate:</strong> <GlossaryTooltip termKey="quadratic-convergence" /> near the minimum
(requires starting close to solution with <GlossaryTooltip termKey="positive-definite" /> <GlossaryTooltip termKey="hessian" />).
```
- **Reason:** First occurrence of "quadratic convergence" and "positive definite"
- **Context:** Critical claim about Newton's speed; multiple tooltips OK here (dense technical claim)

**Line 390** (Strength - invariant):
```tsx
<li>Invariant to linear transformations (handles <GlossaryTooltip termKey="ill-conditioning" />)</li>
```
- **Reason:** Different context (strength vs. weakness), critical capability
- **Context:** Yes, tooltip (explains why Newton is better than GD)

---

#### L-BFGS - Lines 418-507

**Line 426** (Type description):
```tsx
<strong>Type:</strong> Quasi-Newton method (approximates <GlossaryTooltip termKey="hessian" /> from gradients)
```
- **Reason:** Near repeat but important for quasi-Newton definition
- **Context:** Yes, tooltip (Hessian approximation is the key idea)

**Line 457** (Convergence rate):
```tsx
<strong>Convergence rate:</strong> <GlossaryTooltip termKey="superlinear-convergence" /> - faster than linear,
slower than quadratic. Excellent practical performance.
```
- **Reason:** First and only occurrence of "superlinear convergence"
- **Context:** Critical claim distinguishing L-BFGS convergence

---

#### Quick Comparison Table - Lines 510-560

**Line 517-553** (Table rows):
```tsx
<th className="text-left py-2">Conv. Rate</th>
```
- **Reason:** Table headers - no tooltips in headers (per style guide)
- **Context:** NOT tooltips - keep visual hierarchy clean

---

### 2.2 ProblemExplainer.tsx

#### Ill-Conditioned Quadratic - Lines 325-397

**Line 337** (Parameter description):
```tsx
<strong>Parameter:</strong> <InlineMath>\kappa</InlineMath> (<GlossaryTooltip termKey="condition-number" />, 1 to 1000, default 100)
```
- **Reason:** First occurrence of condition number in problem descriptions
- **Context:** Critical claim - this is what the slider controls

**Line 353** (Condition number):
```tsx
Condition number: <InlineMath>\kappa</InlineMath> (controlled by parameter)
```
- **Reason:** Near repeat (same section)
- **Context:** NOT a tooltip - already defined 16 lines above

**Line 362** (Why interesting):
```tsx
<strong>Why it's interesting:</strong> Shows what goes wrong with poor scaling in axis-aligned problems.
```
- **Reason:** No technical term needing tooltip
- **Context:** NOT a tooltip - descriptive explanation

**Line 376** (Challenge):
```tsx
<strong>Challenge:</strong> Gradient descent slows dramatically as κ increases. Newton's method handles
<GlossaryTooltip termKey="ill-conditioning" /> gracefully by using curvature information.
```
- **Reason:** First occurrence in ProblemExplainer (different from AlgorithmExplainer)
- **Context:** Yes, tooltip - critical claim about why problem is hard

---

#### Saddle Point - Lines 467-521

**Line 496** (What it does):
```tsx
<strong>What it does:</strong> Creates a saddle point at origin - minimum in w₀
direction, maximum in w₁ direction.
```
- **Reason:** "saddle point" is in the problem title (already visible)
- **Context:** NOT a tooltip - redundant with title

**Line 490-492** (Eigenvalues):
```tsx
Eigenvalues: λ₁ = 2 (positive), λ₂ = -2 (negative)
```
- **Reason:** First technical use of eigenvalues in problem context
- **Context:** Yes, tooltip needed:
```tsx
<GlossaryTooltip termKey="eigenvalue" />s: λ₁ = 2 (positive), λ₂ = -2 (negative)
```

**Line 501** (Why interesting):
```tsx
<strong>Why it's interesting:</strong> Classic failure mode demonstrating the importance
of second-order optimality conditions. At a saddle point, the gradient is zero (∇f = 0)
but the <GlossaryTooltip termKey="hessian" /> has mixed <GlossaryTooltip termKey="eigenvalue" />s (one positive, one negative).
```
- **Reason:** Critical explanation of second-order conditions
- **Context:** Yes, tooltips for both technical terms

---

#### Himmelblau's Function - Lines 523-599

**Line 557** (Why interesting):
```tsx
<strong>Why it's interesting:</strong> Perfect for visualizing basins of convergence!
This is the <strong>first problem in the visualizer with multiple local minima</strong>,
demonstrating how initial conditions determine which minimum Newton's method converges to.
```
- **Reason:** First mention of "basins of convergence" in problem descriptions
- **Context:** Yes, tooltip needed:
```tsx
Perfect for visualizing <GlossaryTooltip termKey="basin-of-convergence" />s!
```

**Line 563** (Key Insight):
```tsx
<strong>Key Insight - Basins of Convergence:</strong>
```
- **Reason:** Section header
- **Context:** NOT a tooltip - per style guide (keep headers clean)

**Line 567** (Basin boundaries):
```tsx
<strong>Basin boundaries:</strong> Complex fractal-like patterns where nearby starting
points can converge to different minima
```
- **Reason:** Near repeat (same section as 557)
- **Context:** NOT a tooltip - "basin" already tooltipped above

---

#### Three-Hump Camel - Lines 601-676

**Line 634** (Why interesting):
```tsx
<strong>Why it's interesting:</strong> Demonstrates <strong>asymmetric <GlossaryTooltip termKey="basin-of-convergence" /> structure</strong>
where the deeper global minimum has a larger basin of attraction than the shallow local minima.
```
- **Reason:** Different problem, reinforcing basin concept
- **Context:** Yes, tooltip (different context: asymmetric basins)

**Line 644** (Dominant basin):
```tsx
<strong>Dominant basin:</strong> The global minimum at origin has a much larger basin
of convergence - most starting points lead here
```
- **Reason:** Near repeat (same section, 10 lines later)
- **Context:** NOT a tooltip - already tooltipped above

---

### 2.3 Tab Components

#### NewtonTab.tsx

**Line 226** (Core Idea - Hessian):
```tsx
Gradient descent uses first derivatives. Newton's method uses second derivatives
(the <strong><GlossaryTooltip termKey="hessian" /> matrix</strong>) to see the curvature and take smarter steps
toward the minimum.
```
- **Reason:** First occurrence in Newton tab (first occurrence in section)
- **Context:** Critical explanatory text

**Line 237** (Algorithm step 3):
```tsx
<li>Add damping: <InlineMath>{'H_d = H + \\lambda_{\\text{damp}} \\cdot I'}</InlineMath> where <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath> = Hessian damping parameter</li>
```
- **Reason:** Near repeat (same section, 10 lines later)
- **Context:** NOT a tooltip - just defined above

**Line 346** (Hessian eigenvalues):
```tsx
<strong>Why it helps:</strong> Prevents huge Newton steps when H has tiny <GlossaryTooltip termKey="eigenvalue" />s.
```
- **Reason:** First occurrence of eigenvalues in Newton tab
- **Context:** Critical claim about damping necessity

**Line 376** (Convergence rate heading):
```tsx
<strong>Convergence rate:</strong> <GlossaryTooltip termKey="quadratic-convergence" /> near the minimum
```
- **Reason:** First occurrence in Newton tab
- **Context:** Critical claim (repeated from AlgorithmExplainer but new section)

**Line 376 continued** (Positive definite):
```tsx
(requires starting close to solution with <GlossaryTooltip termKey="positive-definite" /> <GlossaryTooltip termKey="hessian" />).
```
- **Reason:** Critical condition for convergence guarantee
- **Context:** Yes, tooltips for both (technical requirement)

**Line 463** (Misconception):
```tsx
✓ Only near a local minimum with <GlossaryTooltip termKey="positive-definite" /> <GlossaryTooltip termKey="hessian" /><br/>
```
- **Reason:** Different section (misconceptions), critical condition
- **Context:** Yes, tooltips (reinforces requirement)

**Line 491** (Role of Convexity):
```tsx
H <GlossaryTooltip termKey="positive-definite" /> everywhere
```
- **Reason:** Different section, brief mention
- **Context:** Yes, tooltip (concise technical statement)

**Line 497** (Non-convex):
```tsx
<strong>Non-convex:</strong> May converge to local minimum or saddle point,
H can have negative <GlossaryTooltip termKey="eigenvalue" />s
```
- **Reason:** Different section, technical explanation
- **Context:** Yes, tooltip (explains non-convexity mathematically)

**Line 581** (Convergence proof):
```tsx
<strong>Requires:</strong>{' '}
<GlossaryTooltip termKey="strong-convexity" />
, <GlossaryTooltip termKey="lipschitz-continuous" /> <GlossaryTooltip termKey="hessian" />,
starting close enough to <InlineMath>{`w^*`}</InlineMath>
```
- **Reason:** Mathematical requirements section, technical conditions
- **Context:** Yes, tooltips (dense technical claim, OK to have multiple)

**Line 651** (Condition number):
```tsx
Condition number: <InlineMath>{'\\kappa = \\lambda_{max}/\\lambda_{min}'}</InlineMath>
```
- **Reason:** First occurrence of condition number in Newton tab
- **Context:** Yes, tooltip needed:
```tsx
<GlossaryTooltip termKey="condition-number" />: <InlineMath>{'\\kappa = \\lambda_{max}/\\lambda_{min}'}</InlineMath>
```

**Line 653** (Ill-conditioning):
```tsx
<li>Large <InlineMath>\kappa</InlineMath> → elongated level sets (<GlossaryTooltip termKey="ill-conditioned" />)</li>
```
- **Reason:** First occurrence in Newton tab advanced section
- **Context:** Yes, tooltip (explaining what large kappa means)

---

#### GdFixedTab.tsx

**Line 291** (Role of Convexity):
```tsx
<strong>Strongly convex:</strong> <GlossaryTooltip termKey="linear-convergence" /> to global minimum
```
- **Reason:** First occurrence of linear convergence in GD Fixed tab
- **Context:** Critical claim about GD convergence property

**Line 309** (Step size rule):
```tsx
where L is the <GlossaryTooltip termKey="lipschitz-continuous" /> constant of <InlineMath>\nabla f</InlineMath> (smoothness).
```
- **Reason:** First technical use of Lipschitz in GD context
- **Context:** Critical claim for step size bound

**Line 356** (Convergence Rate section):
```tsx
<strong>For{' '}
<GlossaryTooltip termKey="strongly-convex" />{' '}
functions:</strong>
```
- **Reason:** Existing tooltip (keep it)
- **Context:** Already has tooltip, good placement

**Line 362** (Smoothness):
```tsx
<InlineMath>L</InlineMath> is smoothness (<GlossaryTooltip termKey="lipschitz-continuous" /> constant of gradient).
```
- **Reason:** Near repeat (same section, 50 lines later)
- **Context:** NOT a tooltip - already defined above

---

#### DiagonalPrecondTab.tsx

**Line 231** (Hessian computation):
```tsx
<li>Compute <GlossaryTooltip termKey="hessian" /> <InlineMath>H(w)</InlineMath> (matrix of second derivatives)</li>
```
- **Reason:** First occurrence in Diagonal tab
- **Context:** Critical step in algorithm

**Line 259** (When it works):
```tsx
When the <GlossaryTooltip termKey="hessian" /> is diagonal (e.g., <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath>),
```
- **Reason:** Near repeat (same section, 28 lines later)
- **Context:** NOT a tooltip - just defined above

**Line 320** (Why fails):
```tsx
A diagonal preconditioner only uses the main diagonal of the <GlossaryTooltip termKey="hessian" /> matrix and
completely ignores the off-diagonal terms.
```
- **Reason:** Different section (failure explanation), reinforces concept
- **Context:** Yes, tooltip (new context: what's missing)

---

### 2.4 Summary of Tooltip Locations

**Total tooltips to add: 47**

**AlgorithmExplainer.tsx:** 14 tooltips
- first-order-method: 1
- linear-convergence: 1
- ill-conditioned: 3
- hessian: 3
- second-order-method: 1
- positive-definite: 2
- quadratic-convergence: 1
- superlinear-convergence: 1

**ProblemExplainer.tsx:** 8 tooltips
- condition-number: 1
- ill-conditioned: 1
- eigenvalue: 2
- hessian: 1
- basin-of-convergence: 2

**NewtonTab.tsx:** 16 tooltips
- hessian: 4
- eigenvalue: 2
- quadratic-convergence: 1
- positive-definite: 3
- lipschitz-continuous: 1
- condition-number: 1
- ill-conditioned: 1
- strong-convexity: 1 (existing)

**GdFixedTab.tsx:** 3 tooltips
- linear-convergence: 1
- lipschitz-continuous: 1
- strongly-convex: 1 (existing)

**DiagonalPrecondTab.tsx:** 2 tooltips
- hessian: 2

**GdLineSearchTab.tsx:** 2 tooltips (estimate)
- linear-convergence: 1
- lipschitz-continuous: 1

**LbfgsTab.tsx:** 2 tooltips (estimate)
- hessian: 1
- superlinear-convergence: 1

---

## 3. Implementation Checklist

### Phase 1: Add Terms to Glossary
- [ ] Add `hessian` term
- [ ] Add `eigenvalue` term
- [ ] Add `quadratic-convergence` term
- [ ] Add `linear-convergence` term
- [ ] Add `superlinear-convergence` term
- [ ] Add `ill-conditioned` term
- [ ] Add `condition-number` term
- [ ] Add `positive-definite` term
- [ ] Add `lipschitz-continuous` term
- [ ] Add `first-order-method` term
- [ ] Add `second-order-method` term
- [ ] Add `basin-of-convergence` term

### Phase 2: Add Tooltips to AlgorithmExplainer.tsx
- [ ] Line 26: first-order-method
- [ ] Line 45: linear-convergence
- [ ] Line 73: ill-conditioned
- [ ] Line 154: ill-conditioned
- [ ] Line 230: hessian (in convergence context)
- [ ] Line 307: second-order-method + hessian
- [ ] Line 375: quadratic-convergence + positive-definite + hessian
- [ ] Line 390: ill-conditioned
- [ ] Line 426: hessian (quasi-Newton context)
- [ ] Line 457: superlinear-convergence

### Phase 3: Add Tooltips to ProblemExplainer.tsx
- [ ] Line 337: condition-number
- [ ] Line 376: ill-conditioned
- [ ] Line 490-492: eigenvalue
- [ ] Line 501: hessian + eigenvalue
- [ ] Line 557: basin-of-convergence
- [ ] Line 634: basin-of-convergence

### Phase 4: Add Tooltips to NewtonTab.tsx
- [ ] Line 226: hessian
- [ ] Line 346: eigenvalue
- [ ] Line 376: quadratic-convergence + positive-definite + hessian
- [ ] Line 463: positive-definite + hessian
- [ ] Line 491: positive-definite
- [ ] Line 497: eigenvalue
- [ ] Line 581: strong-convexity + lipschitz-continuous + hessian
- [ ] Line 651: condition-number
- [ ] Line 653: ill-conditioned

### Phase 5: Add Tooltips to GdFixedTab.tsx
- [ ] Line 291: linear-convergence
- [ ] Line 309: lipschitz-continuous

### Phase 6: Add Tooltips to DiagonalPrecondTab.tsx
- [ ] Line 231: hessian
- [ ] Line 320: hessian

### Phase 7: Add Tooltips to Remaining Tabs
- [ ] GdLineSearchTab.tsx: review and add tooltips
- [ ] LbfgsTab.tsx: review and add tooltips

---

## 4. Quality Assurance

### Before Merging
- [ ] Verify all 12 terms added to `/src/lib/glossary.tsx`
- [ ] Verify all tooltip keys are valid (TypeScript will catch this)
- [ ] Test tooltips render correctly (hover functionality)
- [ ] Verify no duplicate tooltips in close proximity (violates style guide)
- [ ] Verify tooltips appear on first occurrence in each section
- [ ] Verify no tooltips in headings/titles
- [ ] Spot-check 5-10 random tooltips for correct definition content

### Style Guide Compliance
- [ ] All terms are technical and require precise definition ✓
- [ ] No common programming terms added ✗
- [ ] All terms used in multiple locations (5+ for most) ✓
- [ ] Tooltips on first occurrence per section ✓
- [ ] No tooltips on near repeats ✓
- [ ] No tooltips in headings ✓
- [ ] Multiple tooltips only for dense technical claims ✓

---

## 5. Notes and Rationale

### Terms NOT Added (and why)

**"gradient"** - Too common, explained in surrounding text everywhere it appears

**"iteration"** - Common programming term, self-explanatory

**"convergence"** - Generic term; specific types (linear, quadratic, superlinear) are tooltipped instead

**"parameter"** - Common programming term

**"local minimum" / "global minimum"** - Common mathematical terms, self-explanatory from context

**"descent direction"** - One-off term, explained where used

**"backtracking"** - Explained in line search context, not used enough elsewhere

**"Armijo"** - Named method, explained where introduced

**"multimodal"** - Used only in problem descriptions, context makes it clear

**"curvature"** - Informal term for Hessian, which is tooltipped

### Design Decisions

1. **Convergence types as separate terms:** Linear, quadratic, and superlinear convergence are separate glossary entries rather than one "convergence" entry because:
   - Each appears in different contexts
   - Users need to understand the specific differences
   - Allows precise tooltipping without over-explaining

2. **Hessian gets heavy tooltip coverage:** 103 occurrences across 8 files justifies extensive tooltipping. It's the most fundamental second-order concept.

3. **Basin of convergence:** Only appears in 2 problems, but there's an entire visualization tool for it, making it worthy of glossary entry.

4. **Lipschitz continuous:** Mentioned in the "smooth" definition but deserves standalone entry for:
   - Technical precision in convergence proofs
   - Step size bound explanations
   - Advanced sections where smoothness assumptions are stated formally

5. **First-order vs second-order methods:** Critical classification that affects the entire algorithm taxonomy. Worth the glossary entries despite appearing mainly in one file (AlgorithmExplainer.tsx).

---

## 6. Future Considerations

### Potential Future Additions (not urgent)
- **"trust region"** - Only in advanced section, but important method class
- **"line search"** - Very common but might need formal definition
- **"step size" / "learning rate"** - Synonyms, very common, probably too basic
- **"momentum"** - Only in advanced section, not implemented in visualizer
- **"preconditioner"** - Specific to diagonal preconditioner algorithm

### Monitoring
After implementation, monitor user feedback and analytics for:
- Which tooltips are most frequently hovered (indicates usefulness)
- Sections where users seem confused (might need more tooltips)
- Terms that appear in support questions (candidates for future glossary entries)

---

**End of Plan**
