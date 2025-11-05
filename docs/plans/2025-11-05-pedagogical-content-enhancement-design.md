# Pedagogical Content Enhancement Design

**Date:** 2025-11-05
**Status:** Approved
**Goal:** Enhance Newton's Method and L-BFGS tabs with comprehensive pedagogical content matching the depth of Gradient Descent tabs, using a dual-track (novice/expert) structure.

## Overview

The current implementation has detailed pedagogical content for the two Gradient Descent tabs but minimal content for Newton's Method and L-BFGS. This design establishes a consistent structure across all four algorithm tabs that:

1. Provides intuitive understanding by default (Level A: intuitive)
2. Offers comprehensive mathematical depth when expanded (Level C: rigorous)
3. Includes interactive one-click experiments showing both successes and failures
4. Emphasizes convexity, assumptions, and common misconceptions
5. Uses proper mathematical rendering with KaTeX

## Design Principles

### Dual-Track Learning
- **Default expanded sections:** Core intuition, algorithm steps, key formulas, visualizations, experiments
- **Default collapsed sections:** Full derivations, convergence proofs, advanced theory
- **Target:** Mathematically-literate newcomers get clear understanding; experts can dive deep

### Convexity Emphasis
- State assumptions explicitly (strongly convex, convex, non-convex)
- Show when algorithms succeed vs fail based on problem structure
- Address misconceptions about convergence guarantees

### Interactive Experiments
- One-click experiment setup buttons
- Each experiment demonstrates a specific concept
- Include both success and failure modes
- Can switch problems/datasets to show different scenarios

### Pluggable Line Search
- Separate algorithm-specific line search motivation from method details
- Line search method content (Armijo, Wolfe, etc.) is modular and swappable
- Current implementation: Armijo backtracking

## Unified CollapsibleSection Structure

All four algorithm tabs will follow this structure:

### 1. Quick Start (expanded by default)
**Content:**
- Core algorithm idea (2-3 sentences)
- Numbered pseudocode/algorithm steps
- Key formulas without derivation
- When to use this algorithm
- Assumptions clearly stated

**Purpose:** Get someone running and understanding basics in 2 minutes.

### 2. Visual Guide (expanded by default)
**Content:**
- What each visualization panel shows
- How to read plots (axes, colors, contours, annotations)
- What to observe as you step through iterations
- Connections between different visualizations

**Purpose:** Enable meaningful interpretation of the interactive visualizations.

### 3. Line Search Details (expanded for GD-LineSearch/Newton, collapsed for L-BFGS)
**Content (two subsections):**

**3a. Why Line Search for [This Algorithm]** (algorithm-specific)
- GD: Adaptive steps handle varying curvature across landscape
- Newton: Damping when far from minimum or Hessian approximation poor
- L-BFGS: Essential because quasi-Newton direction only approximate

**3b. Current Method: Armijo Backtracking** (pluggable component)
- The Armijo condition formula
- Backtracking algorithm steps
- C1 parameter meaning and tuning
- Visualization interpretation

**Purpose:** Modular structure allows swapping line search methods without rewriting algorithm-specific motivation.

### 4. Try This (expanded by default)
**Content:**
- 4-6 concrete experiments with ▶ "Run Experiment" buttons
- Each button: sets problem, hyperparameters, initial conditions
- Mix of success cases and failure modes
- Progressive difficulty

**Examples:**
- ▶ Success: Strongly convex, ideal conditions
- ▶ Failure: Parameter too large/small, wrong problem structure
- ▶ Fixed: Line search rescue, regularization fix
- ▶ Compare: This algorithm vs others on same problem

**Purpose:** Hands-on learning through experimentation, showing when/why algorithms work or fail.

### 5. When Things Go Wrong (collapsed by default)
**Content:**
- Common misconceptions with corrections
- Role of convexity (convex, strongly convex, non-convex)
- Troubleshooting guide
- When to use different algorithms

**Purpose:** Prevent misunderstandings and help diagnose issues.

### 6. Mathematical Derivations (collapsed by default)
**Content:**
- Full Taylor expansion derivations
- Proof of update rules
- Why the algorithm works mathematically
- Convergence conditions and rates
- Optimality conditions

**Purpose:** Rigorous mathematical foundation for those who want complete understanding.

### 7. Advanced Topics (collapsed by default)
**Content:**
- Computational complexity analysis
- Numerical stability considerations
- Theoretical convergence rates
- Advanced variants and extensions
- Connections to other methods

**Purpose:** Deep dives for researchers and advanced practitioners.

---

## Newton's Method Content Outline

### Quick Start (expanded)
**Core Idea:**
- "Gradient descent uses first derivatives. Newton's method uses second derivatives (the Hessian) to see the curvature and take smarter steps."

**Algorithm Steps:**
1. Compute gradient ∇f(w)
2. Compute Hessian H(w) (matrix of all second derivatives)
3. Solve Hp = -∇f for search direction p (Newton direction)
4. Line search for step size α
5. Update w ← w + αp

**Key Formula:**
- Newton direction: p = -H⁻¹∇f
- Intuition: H⁻¹ transforms gradient into the natural coordinate system of the problem

**When to Use:**
- Small-medium problems (n < 1000 parameters)
- Smooth, twice-differentiable objectives
- Near a local minimum (quadratic convergence)
- When you can afford O(n³) computation per iteration

**Assumptions:**
- f is twice continuously differentiable
- Hessian is positive definite (strongly convex) for guaranteed convergence
- Line search used when H not positive definite or far from minimum

### Visual Guide (expanded)
**Parameter Space:**
- Trajectory takes fewer, larger steps than gradient descent
- Steps are not perpendicular to contours (unlike steepest descent)
- Near minimum, often converges in 2-3 iterations

**Hessian Matrix Heatmap:**
- Shows curvature information: H_ij = ∂²f/∂w_i∂w_j
- Diagonal: curvature along each parameter axis
- Off-diagonal: how parameters interact
- Color intensity: magnitude of second derivatives

**Eigenvalue Display:**
- λ_min, λ_max, condition number κ = λ_max/λ_min
- All positive → local minimum (bowl-shaped)
- Some negative → saddle point (not a minimum)
- Large κ → ill-conditioned, but Newton handles better than GD

**Line Search Panel:**
- Often accepts α = 1 (full Newton step) near minimum
- Smaller α when far from minimum or Hessian approximation poor
- Armijo condition ensures sufficient decrease

### Line Search Details (expanded)

**Why Line Search for Newton's Method:**
- Pure Newton (α=1 always) assumes quadratic approximation is perfect
- Far from minimum: quadratic approximation breaks down
- Non-convex regions: negative eigenvalues → wrong direction
- Line search provides damping/safety: reduces to gradient descent if needed

**Current Method: Armijo Backtracking:**
- [Standard pluggable line search content]

### Try This (expanded)

1. **▶ Success: Strongly Convex Quadratic**
   - Switches to quadratic bowl problem
   - Sets λ=0.1
   - Observe: 1-2 iterations to convergence, all eigenvalues positive, α=1 accepted

2. **▶ Failure: Non-Convex Saddle Point**
   - Switches to Rosenbrock function or non-convex problem
   - Initial point near saddle point
   - Observe: negative eigenvalue, Newton direction points wrong way, potential divergence

3. **▶ Fixed: Line Search Rescue**
   - Same non-convex problem with line search enabled
   - Observe: backtracking reduces α, prevents divergence, acts like damped Newton

4. **▶ Compare: Newton vs GD on Ill-Conditioned**
   - Highly elongated ellipse (κ=1000)
   - Run both algorithms
   - Observe: GD zig-zags for 100+ iterations, Newton converges in ~5

5. **▶ Breakdown: Singular Hessian**
   - Problem with rank-deficient Hessian at solution
   - Observe: Hessian nearly singular, condition number explodes, numerical issues

6. **▶ Cost: Large Problem**
   - Switch to higher dimensional problem (n=100 or more if feasible)
   - Observe: Computation time per iteration vs GD, memory usage

### When Things Go Wrong (collapsed)

**Common Misconceptions:**
- ❌ "Newton always converges faster than gradient descent"
  - ✓ Only near a local minimum with positive definite Hessian
  - ✓ Can diverge or fail in non-convex regions without line search

- ❌ "The Hessian tells you the direction to the minimum"
  - ✓ H⁻¹∇f is the Newton direction, not just H
  - ✓ If H not positive definite, may not be a descent direction

- ❌ "Newton's method always finds the global minimum"
  - ✓ Only for convex functions
  - ✓ Non-convex: converges to local minimum or saddle point

**Role of Convexity:**
- **Strongly convex:** Quadratic convergence guaranteed, H positive definite everywhere
- **Convex:** H positive semidefinite, converges to global minimum
- **Non-convex:** May converge to local minimum or saddle point, H can have negative eigenvalues

**Troubleshooting:**
- Negative eigenvalues → add line search, consider modified Newton (H + λI)
- Slow convergence → may be far from minimum (where quadratic approximation poor)
- Numerical issues → Hessian ill-conditioned, use iterative solvers or quasi-Newton instead
- High cost → n too large, switch to L-BFGS

### Mathematical Derivations (collapsed)

**Taylor Expansion:**
- f(w+p) = f(w) + ∇f(w)·p + ½p^T H(w) p + O(||p||³)
- Approximates f locally as quadratic

**Deriving Newton Direction:**
- Minimize quadratic approximation over p:
- ∇_p [f(w) + ∇f·p + ½p^T Hp] = ∇f + Hp = 0
- Therefore: Hp = -∇f
- Newton direction: p = -H⁻¹∇f

**Why It Works:**
- At a minimum of quadratic function, this gives exact solution in one step
- Near a minimum, f behaves like quadratic → fast convergence

**Convergence Rate:**
- Quadratic convergence: ||e_{k+1}|| ≤ C||e_k||² where e_k = w_k - w*
- Error squared at each iteration (very fast near solution)
- Requires: strong convexity, Lipschitz continuous Hessian, starting close enough

**Proof Sketch:**
- Taylor expand f(w_k) and f(w*) around w_k
- Use Newton update rule
- Bound error using Hessian Lipschitz constant
- Show error term is quadratic

### Advanced Topics (collapsed)

**Computational Complexity:**
- Computing Hessian H: O(n²) operations and memory
- Solving Hp = -∇f: O(n³) with direct methods (Cholesky, LU)
- Total per iteration: O(n³) time, O(n²) space
- For n=1000: ~1 billion operations per iteration

**Condition Number and Convergence:**
- κ = λ_max/λ_min measures problem difficulty
- Large κ → elongated level sets
- Newton handles ill-conditioning better than gradient descent
- But numerical stability suffers with very large κ

**Modified Newton Methods:**
- **Levenberg-Marquardt:** H + λI (adds regularization)
- Makes H positive definite even in non-convex regions
- Interpolates between Newton (λ=0) and gradient descent (λ→∞)
- **Eigenvalue modification:** Replace negative eigenvalues with small positive values

**Inexact Newton:**
- Solve Hp = -∇f approximately using iterative methods
- Conjugate Gradient (CG) for large problems
- Reduces O(n³) to O(n²) or better
- Still superlinear convergence with loose tolerances

**Trust Region Methods:**
- Alternative to line search
- Solve: min_p f(w) + ∇f·p + ½p^T Hp subject to ||p|| ≤ Δ
- Adjust trust region radius Δ based on agreement between model and actual function
- More robust in non-convex settings

**Quasi-Newton Preview:**
- Newton requires exact Hessian (expensive)
- Quasi-Newton approximates H or H⁻¹ from gradients
- Builds up curvature information over iterations
- Leads to: BFGS, L-BFGS (next tab)

---

## L-BFGS Content Outline

### Quick Start (expanded)

**Core Idea:**
- "Newton's method uses H⁻¹∇f for smarter steps, but computing H costs O(n³). L-BFGS approximates H⁻¹∇f using only recent gradient changes—no Hessian computation needed."

**Algorithm Steps:**
1. Compute gradient ∇f(w)
2. Use two-loop recursion to compute p ≈ -H⁻¹∇f from M recent (s,y) pairs
3. Line search for step size α
4. Update w ← w + αp
5. Store new pair: s = αp (parameter change), y = ∇f_new - ∇f_old (gradient change)
6. Keep only M most recent pairs (discard oldest)

**Key Idea:**
- s and y pairs implicitly capture curvature: "when we moved by s, the gradient changed by y"
- The two-loop recursion transforms ∇f into p ≈ -H⁻¹∇f using only these pairs
- No Hessian matrix ever computed or stored

**When to Use:**
- Large problems (n > 1000 parameters)
- Memory constrained environments
- Smooth, differentiable objectives
- When Newton too expensive, gradient descent too slow

**Key Parameters:**
- M = memory size (typically 5-20)
- Larger M = better Hessian approximation but more computation
- M=10 often works well in practice

**Assumptions:**
- f is differentiable
- Gradients are Lipschitz continuous (smoothness)
- Convexity helpful but not required

### Visual Guide (expanded)

**Parameter Space:**
- Trajectory takes Newton-like steps without computing Hessian
- Steps adapt to problem curvature using history
- Converges faster than gradient descent, nearly as fast as Newton

**Memory Pairs Visualization:**
- Recent (s, y) pairs shown as arrows
- s = where we moved (parameter change)
- y = how gradient changed (curvature signal)
- Older pairs fade out as new ones replace them

**Two-Loop Recursion Visualization:**
- Step-by-step transformation: q = ∇f → ... → p ≈ -H⁻¹∇f
- Backward loop: process pairs from newest to oldest
- Forward loop: reconstruct from oldest to newest
- Shows how gradient gets transformed using memory

**Line Search Panel:**
- Similar to Newton: often accepts large steps
- α < 1 when approximation quality poor or far from minimum
- Armijo condition ensures progress

### Line Search Details (expanded)

**Why Line Search for L-BFGS:**
- Quasi-Newton direction p ≈ -H⁻¹∇f is only an approximation
- Not guaranteed to be descent direction if approximation poor
- Line search ensures we actually decrease the loss
- Essential for convergence guarantees

**Current Method: Armijo Backtracking:**
- [Standard pluggable line search content]

### Try This (expanded)

1. **▶ Success: Strongly Convex Problem**
   - Quadratic or logistic regression problem
   - Observe: Fast convergence similar to Newton, but no Hessian computation
   - Memory pairs build up curvature information over first few iterations

2. **▶ Memory Matters: M=3 vs M=10**
   - Same problem, different memory sizes
   - M=3: fewer pairs, less accurate approximation, more iterations
   - M=10: better approximation, faster convergence
   - Observe: diminishing returns beyond M=10-20

3. **▶ Warm Start: Good vs Bad Initialization**
   - Same problem, two different starting points
   - Good start: near minimum, converges in ~10 iterations
   - Bad start: far away, takes longer but still succeeds

4. **▶ Compare: L-BFGS vs GD vs Newton**
   - Switch to 100-dimensional problem (if implemented)
   - GD: many iterations, slow
   - Newton: few iterations but expensive per iteration
   - L-BFGS: moderate iterations, cheap per iteration
   - Observe: wall-clock time and convergence speed tradeoff

5. **▶ Non-Smooth: Kinked Objective**
   - Problem with L1 regularization or ReLU activations
   - Observe: L-BFGS struggles at kinks, may slow down or oscillate
   - Note: specialized variants like OWL-QN handle L1 better

6. **▶ Curvature Change: Non-Stationary Landscape**
   - Problem where curvature changes dramatically
   - Memory from earlier iterations becomes stale
   - Observe: when recent history isn't representative, performance degrades

### When Things Go Wrong (collapsed)

**Common Misconceptions:**
- ❌ "L-BFGS is always better than gradient descent"
  - ✓ Requires smooth objectives and good line search
  - ✓ Can fail on non-smooth problems (L1, ReLU, kinks)

- ❌ "L-BFGS equals Newton's method"
  - ✓ Only approximates Newton direction
  - ✓ Approximation quality depends on M and problem structure
  - ✓ Superlinear vs quadratic convergence

- ❌ "More memory (larger M) is always better"
  - ✓ Diminishing returns: M=5-20 usually sufficient
  - ✓ Larger M = more computation per iteration
  - ✓ Very old pairs may contain stale curvature information

**Role of Convexity:**
- **Strongly convex:** Superlinear convergence guaranteed (between linear GD and quadratic Newton)
- **Convex:** Converges to global minimum
- **Non-convex:** Can converge to local minima, no global guarantees (like all local methods)

**Troubleshooting:**
- Slow convergence → increase M, improve initialization, check smoothness
- Oscillation → decrease M or line search C1 parameter
- Memory issues → M too large for your hardware, decrease M
- Non-smooth objective → consider specialized variants (OWL-QN) or smoothing

### Mathematical Derivations (collapsed)

**Secant Equation:**
- Newton: Hp = -∇f (exact)
- Quasi-Newton: approximate H or H⁻¹ from gradients
- Key insight: y_k = ∇f_{k+1} - ∇f_k ≈ H s_k (secant equation)
- Where s_k = w_{k+1} - w_k (parameter change)
- This relates gradient changes to parameter changes via approximate Hessian

**BFGS Update Formula:**
- Start with approximation B_k ≈ H
- Update to B_{k+1} satisfying secant equation: B_{k+1}s_k = y_k
- BFGS formula (using Sherman-Morrison-Woodbury):
  - B_{k+1} = B_k - (B_k s_k s_k^T B_k)/(s_k^T B_k s_k) + (y_k y_k^T)/(y_k^T s_k)
- Maintains positive definiteness if y_k^T s_k > 0 (guaranteed by Wolfe line search)

**Why Limited Memory:**
- Full BFGS stores B_k (n×n matrix): O(n²) memory
- L-BFGS: don't store B_k, instead store M recent (s,y) pairs: O(Mn) memory
- Implicitly represent B_k⁻¹ via two-loop recursion

**Two-Loop Recursion:**
- Given: M pairs (s_i, y_i) and gradient q = ∇f
- Goal: compute p = B_k⁻¹ q ≈ -H⁻¹∇f

- **Backward loop** (i = k-1, k-2, ..., k-M):
  - ρ_i = 1/(y_i^T s_i)
  - α_i = ρ_i s_i^T q
  - q ← q - α_i y_i

- **Initialize:** r = H_0⁻¹ q (typically H_0⁻¹ = γI where γ = s_{k-1}^T y_{k-1} / y_{k-1}^T y_{k-1})

- **Forward loop** (i = k-M, k-M+1, ..., k-1):
  - β = ρ_i y_i^T r
  - r ← r + s_i (α_i - β)

- **Result:** p = r ≈ -H⁻¹∇f

**Why It Works:**
- Each (s,y) pair represents one rank-2 update to the Hessian approximation
- Two-loop recursion applies these updates implicitly without forming B_k
- Mathematically equivalent to full BFGS but O(Mn) instead of O(n²)

**Convergence Rate:**
- Superlinear convergence: ||e_{k+1}|| / ||e_k|| → 0
- Faster than linear (GD) but slower than quadratic (Newton)
- Depends on M: larger M → closer to Newton rate

### Advanced Topics (collapsed)

**Computational Complexity:**
- Gradient computation: O(n) to O(n²) depending on problem
- Two-loop recursion: O(Mn) operations
- Line search: multiple gradient evaluations
- Total per iteration: O(Mn) time, O(Mn) memory
- For n=1000, M=10: 10,000 operations vs 1 billion for Newton

**Memory-Computation Tradeoff:**
- M selection guidelines:
  - M=5-10: good for most problems
  - M=20: diminishing returns
  - M>50: rarely beneficial, increases cost
- Problem-dependent: ill-conditioned problems benefit from larger M

**Full BFGS vs L-BFGS:**
- BFGS: store full B_k, O(n²) memory and update cost
- L-BFGS: store M pairs, O(Mn) memory and recursion cost
- For n > 100, L-BFGS typically preferred
- BFGS may be faster for small n

**Why Two-Loop Recursion is Efficient:**
- Avoids forming explicit matrix B_k or B_k⁻¹
- Implicit representation via (s,y) pairs
- Applies rank-2 updates in sequence
- Exploits structure of BFGS update formula

**Relationship to Conjugate Gradient:**
- Both use history to improve search directions
- CG: uses gradient history to build conjugate directions
- L-BFGS: uses (s,y) history to approximate H⁻¹
- L-BFGS more robust for non-quadratic objectives

**Extensions:**
- **OWL-QN:** L-BFGS for L1-regularized problems (handles non-smoothness)
- **Stochastic L-BFGS:** Mini-batch variants for large datasets
- **Block L-BFGS:** Exploits problem structure (e.g., neural networks)

---

## Refactoring Gradient Descent Tabs

Both GD tabs will be updated to match the new structure:

### GD Fixed Step

**Quick Start** ← merge existing "What is GD?" + "The Algorithm"
- Core idea: follow gradient downhill
- Algorithm steps: compute gradient, scale by α, update
- Key formula: w_{k+1} = w_k - α∇f(w_k)
- When to use: simple problems, as baseline

**Visual Guide** ← existing "What You're Seeing"
- Parameter space interpretation
- Trajectory perpendicular to contours

**Try This** ← expand with one-click experiments:
1. ▶ Success: Well-scaled problem, α=0.1
2. ▶ Failure: α=0.8 causes divergence (oscillation)
3. ▶ Failure: α=0.001 too small, never converges
4. ▶ Ill-conditioned: Elongated ellipse, zig-zagging
5. ▶ Non-convex: Gets stuck in local minimum

**When Things Go Wrong** ← new section:
- Misconception: gradient points to minimum
- Role of convexity
- Choosing α

**Mathematical Derivations** ← existing "The Mathematics" + proofs:
- First-order Taylor expansion
- Convergence proof for strongly convex
- Rate: linear O(e^{-ck})

**Advanced Topics** ← new:
- Momentum methods
- Nesterov acceleration
- Adaptive methods preview (Adam, AdaGrad)

### GD Line Search

**Quick Start** ← merge intro sections
- Algorithm without line search method details

**Visual Guide** ← existing visualization guide

**Line Search Details** (expanded) ← modular:
- **Why Line Search for Gradient Descent:**
  - Fixed α fails on varying curvature
  - Landscape changes across iterations
  - Adaptive steps = robust + efficient
- **Current Method: Armijo Backtracking:** (pluggable)
  - Armijo condition
  - Backtracking algorithm
  - C1 parameter

**Try This** ← expand with experiments:
1. ▶ Success: Automatically adapts to landscape
2. ▶ Compare: Fixed α=0.1, α=0.5, α=1.0 vs adaptive on same problem
3. ▶ C1=0.00001: Too small, accepts poor steps, slow convergence
4. ▶ C1=0.5: Too large, too conservative, tiny steps
5. ▶ Varying curvature: Problem where fixed α fails but line search succeeds

**When Things Go Wrong** ← new

**Mathematical Derivations** ← expand:
- Proof that Armijo ensures convergence
- Descent lemma

**Advanced Topics** ← new:
- Wolfe conditions (curvature condition added)
- Strong Wolfe conditions
- Goldstein conditions
- Comparison of line search methods

---

## Mathematical Rendering Implementation

### Phase 1: Client-Side KaTeX (Must-Have)

**Dependencies:**
```json
{
  "katex": "^0.16.9",
  "react-katex": "^3.0.1"
}
```

**Component Usage:**
```tsx
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Inline: \nabla f(w)
<InlineMath math="\nabla f(w)" />

// Block: Taylor expansion
<BlockMath math="f(w+p) = f(w) + \nabla f \cdot p + \frac{1}{2}p^T H p" />
```

**Rendering Priorities:**
1. Matrices (Hessian visualizations)
2. Complex equations (Taylor expansions, BFGS updates)
3. Subscripts/superscripts (w_{k+1}, λ_max, H^{-1})
4. Fractions and operators

**Migration:**
- Replace all Unicode math (∇, ≈, λ, α, etc.) with KaTeX
- Use proper LaTeX notation throughout
- Ensure proper spacing and sizing

### Phase 2: Server-Side Rendering (Nice-to-Have)

**Approach:**
- Investigate `vite-plugin-react` + build-time KaTeX transformation
- Create custom Vite plugin if needed
- Only pursue if implementation < 2 hours
- Benefits: no FOUC, faster initial render, better copy-paste

**Defer to Future:**
- If implementation complex, keep Phase 1 and defer Phase 2

---

## Interactive Experiments Implementation

### Experiment Presets System

**Data Structure:**
```typescript
interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  problem: ProblemType; // 'logistic-regression' | 'quadratic' | 'rosenbrock' | etc.
  dataset?: DataPoint[]; // custom data points
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number; // for L-BFGS
  };
  initialPoint?: [number, number];
  annotate?: string; // what to highlight in UI
}
```

**UI Components:**
```tsx
// In "Try This" section
<div className="experiment-button">
  <button onClick={() => loadExperiment(experiment)}>
    ▶ {experiment.name}
  </button>
  <p className="text-sm">{experiment.description}</p>
</div>
```

**Behavior:**
- Click loads preset: switches problem, sets params, recomputes algorithm
- Shows "Experiment: {name}" indicator in UI
- Can manually adjust params after loading
- "Reset" button returns to default state

### Problem Types Needed

1. **Logistic Regression** (current) - 2D crescent dataset
2. **Quadratic Bowl** - strongly convex, ideal for Newton
3. **Ill-Conditioned Quadratic** - elongated ellipse, high κ
4. **Rosenbrock Function** - non-convex, banana-shaped valley
5. **Non-Convex with Saddle** - shows negative eigenvalues
6. (Future) **Neural Network Loss** - more complex landscape

### Implementation Strategy

1. Create `problems/` directory with problem definitions
2. Each problem provides: objective, gradient, Hessian (for Newton)
3. Create `experiments/` directory with preset definitions (JSON or TS)
4. Add problem switcher to UI (initially hidden, shown when experiment loads)
5. Load experiment presets into "Try This" sections

---

## Implementation Plan Summary

### Core Tasks

1. **Add KaTeX** - Phase 1 (client-side), attempt Phase 2 if simple
2. **Update CollapsibleSection structure** - All four tabs
3. **Create content for Newton's Method** - All 7 sections
4. **Create content for L-BFGS** - All 7 sections
5. **Refactor GD Fixed Step** - Match new structure
6. **Refactor GD Line Search** - Match new structure with pluggable line search
7. **Implement experiment presets system** - Data structure + UI
8. **Create problem types** - At least Quadratic and Rosenbrock beyond current
9. **Write experiment presets** - 4-6 per algorithm tab

### Quality Checks

- [ ] All mathematical notation uses KaTeX
- [ ] All tabs follow identical structure
- [ ] Line search sections are modular and swappable
- [ ] Convexity and assumptions stated explicitly
- [ ] Common misconceptions addressed
- [ ] Default expanded content is intuitive (Level A)
- [ ] Default collapsed content is rigorous (Level C)
- [ ] Each experiment has working one-click setup
- [ ] Both success and failure modes demonstrated

### Future Enhancements

- Additional problem types (neural networks, constrained optimization)
- Additional line search methods (Wolfe, Strong Wolfe, Goldstein)
- Server-side KaTeX rendering (if deferred)
- Side-by-side algorithm comparison mode
- Animation playback for experiments
- More advanced visualizations (trust region, conjugate gradient comparison)

---

## Conclusion

This design establishes a consistent, pedagogically-sound structure across all algorithm tabs. The dual-track approach (intuitive by default, rigorous when expanded) serves both newcomers and experts. Interactive experiments with one-click setup enable hands-on learning of both successes and failure modes. Emphasis on convexity, assumptions, and misconceptions prevents common misunderstandings. Proper mathematical rendering with KaTeX ensures clarity and professionalism.
