# Diagonal Preconditioner: Completing the Step Size Sophistication Story

**Date:** 2025-11-07
**Status:** Design Complete, Ready for Implementation
**Author:** Design Session with Claude

## Executive Summary

Add **Diagonal Preconditioner** as a new algorithm tab to complete the pedagogical progression from scalar step sizes to full matrix step sizes. The five-tab sequence will be: **GD (Fixed Step) → GD (Line Search) → Diagonal Preconditioner → Newton's Method → L-BFGS**.

**Core Pedagogical Insight:** The progression shows increasing sophistication in adapting to problem geometry:
1. **Scalar α**: Same step size everywhere
2. **Adaptive scalar α**: Line search adapts α at each iteration
3. **Diagonal matrix D**: Per-coordinate step sizes (what Adam/RMSprop do!)
4. **Full matrix H⁻¹**: Newton's rotation-invariant step size matrix
5. **Approximate H⁻¹**: L-BFGS efficient approximation

**Key Story:** Diagonal preconditioning is **coordinate-dependent** — it works perfectly when the problem aligns with coordinate axes but fails dramatically when rotated. This motivates Newton's full matrix approach.

**Target Audience:** Same as existing — mathematically mature users learning optimization algorithms, with particular emphasis on practitioners familiar with Adam/RMSprop who want to understand their limitations.

---

## 1. Pedagogical Motivation: Why Add This Algorithm?

### The Missing Link

Current progression (4 tabs):
- GD-fixed: Scalar step size
- GD-linesearch: Adaptive scalar
- Newton: Full matrix H⁻¹ (HUGE JUMP!)
- L-BFGS: Approximate H⁻¹

**Problem:** We jump directly from "scalar" to "full matrix" without showing the intermediate step of "diagonal matrix." Students ask: "Why can't I just use different step sizes for each coordinate?"

**Solution:** Add diagonal preconditioner to show:
1. Per-coordinate step sizes ARE useful (and widely used in practice!)
2. But they're coordinate-dependent (fail under rotation)
3. Only full matrix achieves rotation invariance

### Connection to Modern Optimizers

**Critical pedagogical point:** Diagonal preconditioning is exactly what Adam, RMSprop, and AdaGrad do!

- **Adam**: Uses diagonal matrix based on running average of squared gradients
- **RMSprop**: Uses diagonal matrix based on exponential moving average
- **AdaGrad**: Uses diagonal matrix that accumulates gradient history

By teaching diagonal preconditioning, we help students understand:
- Why these optimizers work well in practice
- When they struggle (arbitrary rotations, off-diagonal structure)
- Why second-order methods can be better (but more expensive)

### Feasibility Testing Summary

Implemented and tested diagonal preconditioner on rotated ellipse (κ=5) with initial point [2, 2]:

| Method | θ=0° (aligned) | θ=45° (rotated) | Rotation Invariant? |
|--------|----------------|-----------------|---------------------|
| **GD-fixed (α=0.1)** | 139 iters | 25 iters | ❌ No (5.6× difference) |
| **GD-linesearch** | 34 iters | 13 iters | ❌ No (2.6× difference) |
| **Diagonal Precond** | **1-2 iters** | **41 iters** | ❌ **No (20× difference!)** |
| **Newton (H⁻¹)** | 2 iters | 2 iters | ✅ **Yes (perfect!)** |

**Key findings:**
1. ✅ Diagonal preconditioner works **spectacularly** when problem aligns with axes (1-2 iterations!)
2. ❌ Fails **dramatically** when problem is rotated 45° (41 iterations)
3. ✅ Newton is **perfectly rotation-invariant** (2 iterations at any angle)
4. 📊 This creates a **perfect pedagogical demonstration** of coordinate dependence

See test implementation: `test-diagonal-preconditioner.ts`, `test-full-progression.ts`

---

## 2. Algorithm Specification

### 2.1 Mathematical Foundation

**Core Idea:** Use Hessian diagonal to set per-coordinate step sizes.

For quadratic problem with Hessian H:
```
Update: w_new = w - D * ∇f(w)
where D = diag(1/H₀₀, 1/H₁₁)
```

**Why this works (when aligned):**
- At θ=0°, H is diagonal: H = [[5, 0], [0, 1]]
- D = diag(1/5, 1/1) perfectly inverts H
- Result: D * H * ∇f = ∇f, optimal step!

**Why this fails (when rotated):**
- At θ=45°, H has off-diagonal terms: H ≈ [[3, 2], [2, 3]]
- D = diag(1/3, 1/3) only captures diagonal
- Result: Misses off-diagonal structure, poor convergence

### 2.2 Algorithm Interface

```typescript
export interface DiagonalPrecondIteration {
  iter: number;
  w: number[];
  wNew: number[];
  loss: number;
  newLoss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];  // -D * grad
  stepNorm: number;
  hessianDiagonal: number[];  // [H₀₀, H₁₁]
  preconditioner: number[];   // [1/H₀₀, 1/H₁₁]
}

export const runDiagonalPreconditioner = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    useLineSearch?: boolean;  // Optional: add line search for robustness
    c1?: number;  // If using line search
  }
): DiagonalPrecondIteration[];
```

### 2.3 Algorithm Pseudocode

```
Initialize: w = initialPoint or [0, 0]

For iter = 0 to maxIter:
  1. Compute loss, gradient, and Hessian:
     f = objective(w)
     g = gradient(w)
     H = hessian(w)

  2. Extract Hessian diagonal:
     d = [H[0][0], H[1][1]]

  3. Build preconditioner:
     D = [1/d[0], 1/d[1]]

  4. Compute preconditioned direction:
     p = -[D[0] * g[0], D[1] * g[1]]

  5. Update weights:
     w_new = w + p

     (OR with line search:
      α = armijoLineSearch(...)
      w_new = w + α * p)

  6. Check convergence:
     if ||g|| < tolerance: break

  7. Update: w = w_new

Return iterations
```

### 2.3.1 Practical Diagonal Preconditioners: How Real Optimizers Do It

**Pedagogical vs Practical Implementations**

Our main implementation uses the **exact Hessian diagonal** for pedagogical clarity:
- ✅ Shows the mathematical foundation clearly
- ✅ Demonstrates rotation dependence perfectly
- ✅ Connects to Newton's method naturally
- ❌ Requires Hessian computation (expensive!)
- ❌ Not practical for large-scale problems

In practice, modern optimizers **estimate the diagonal from gradient history** without computing the Hessian. This is what makes them scalable to millions of parameters!

---

#### AdaGrad: Accumulating All Gradient History

**Core idea:** Scale each coordinate by accumulated squared gradients.

```
Update: w_new = w - (α / √(v + ε)) ⊙ ∇f(w)

where:
  v_i = Σ(from t=1 to current) g_i,t²    (sum of squared gradients)
  ⊙ = element-wise multiplication
  ε = 1e-8  (numerical stability)
```

**Preconditioner interpretation:**
```
D = diag(α / √(v₀ + ε), α / √(v₁ + ε), ...)
```

**Properties:**
- ✅ Automatically adapts to different feature scales
- ✅ Works well for sparse features
- ❌ Learning rate monotonically decreases (v only grows)
- ❌ Can stop learning prematurely on non-convex problems

**Pseudocode:**
```python
v = [0, 0, ...]  # Accumulator
for iter in range(max_iter):
    g = gradient(w)
    v += g ** 2           # Accumulate squared gradients
    precond = α / (√(v) + ε)
    w -= precond ⊙ g      # Element-wise
```

---

#### RMSprop: Exponential Moving Average

**Core idea:** Use exponential moving average instead of accumulating all history.

```
Update: w_new = w - (α / √(v + ε)) ⊙ ∇f(w)

where:
  v_t = β·v_{t-1} + (1-β)·g_t²    (exponential moving average)
  β = 0.9  (typical value, decay rate)
```

**Preconditioner interpretation:**
```
D = diag(α / √(v₀ + ε), α / √(v₁ + ε), ...)
```

**Properties:**
- ✅ Adapts to recent gradient magnitudes
- ✅ Can "forget" old information (unlike AdaGrad)
- ✅ Works better on non-convex problems
- ✅ Widely used in practice (especially RNNs)

**Pseudocode:**
```python
v = [0, 0, ...]  # Moving average
β = 0.9
for iter in range(max_iter):
    g = gradient(w)
    v = β * v + (1-β) * (g ** 2)    # EMA of squared gradients
    precond = α / (√(v) + ε)
    w -= precond ⊙ g
```

---

#### Adam: RMSprop + Momentum (Full Algorithm)

**Core idea:** Combine RMSprop preconditioning with momentum (exponential moving average of gradients).

```
Update: w_new = w - α · m̂ / (√(v̂) + ε)

where:
  m_t = β₁·m_{t-1} + (1-β₁)·g_t        (momentum)
  v_t = β₂·v_{t-1} + (1-β₂)·g_t²       (RMSprop)
  m̂_t = m_t / (1 - β₁^t)              (bias correction)
  v̂_t = v_t / (1 - β₂^t)              (bias correction)

  β₁ = 0.9, β₂ = 0.999  (typical values)
```

**Preconditioner interpretation:**
```
D = diag(α / √(v̂₀ + ε), α / √(v̂₁ + ε), ...)
Direction = m̂  (momentum, not raw gradient)
```

**Properties:**
- ✅ Combines benefits of momentum and adaptive learning rates
- ✅ Bias correction for early iterations
- ✅ Most popular optimizer in deep learning
- ✅ Works well on wide variety of problems
- ❌ More hyperparameters to tune

**Pseudocode:**
```python
m = [0, 0, ...]  # Momentum
v = [0, 0, ...]  # Moving average
β1, β2 = 0.9, 0.999
for iter in range(1, max_iter+1):
    g = gradient(w)
    m = β1 * m + (1-β1) * g              # Update momentum
    v = β2 * v + (1-β2) * (g ** 2)       # Update RMSprop
    m_hat = m / (1 - β1**iter)           # Bias correction
    v_hat = v / (1 - β2**iter)           # Bias correction
    precond = α / (√(v_hat) + ε)
    w -= precond ⊙ m_hat                 # Use momentum direction
```

**Important Note: Adam is designed for Stochastic Gradient Descent (SGD)**

Adam was created for **mini-batch training** where gradients are noisy:
- **Momentum** (m): Smooths out noisy gradient estimates
- **RMSprop** (v): Adapts to coordinate scales AND reduces noise sensitivity
- **Bias correction**: Critical for early iterations with small sample estimates

**Our visualizer uses full-batch gradients** (exact, not noisy), which means:
- ✅ We can implement the full Adam algorithm
- ⚠️ But the motivation is different - we're showing coordinate scaling, not noise reduction
- ⚠️ Momentum provides acceleration but isn't central to the preconditioning story
- 💡 Adam works in full-batch too, just with different characteristics

**For our pedagogical purposes:**
- Focus on the **RMSprop component** (diagonal preconditioning)
- **Momentum is orthogonal** to preconditioning (separate concept about acceleration)
- Could optionally show full Adam to demonstrate "what practitioners use"

---

#### Comparison: Hessian-Based vs Gradient-Based

| Aspect | Hessian Diagonal (Our Implementation) | Gradient-Based (Adam/RMSprop) |
|--------|--------------------------------------|-------------------------------|
| **Information Used** | Exact curvature (∂²f/∂w_i²) | Gradient magnitude history |
| **Computational Cost** | O(n²) Hessian + O(n) diagonal extraction | O(n) per iteration |
| **Memory** | O(n²) to compute Hessian | O(n) for accumulators |
| **Accuracy** | Exact for current point | Approximate/heuristic |
| **Scalability** | Limited to small problems | Scales to millions of parameters |
| **Practical Use** | Rare (too expensive) | Ubiquitous (Adam everywhere!) |
| **Pedagogical Value** | ⭐⭐⭐⭐⭐ (shows math clearly) | ⭐⭐⭐ (more practical) |

**Why gradient-based works:**
- Gradient magnitude correlates with curvature (not perfectly, but well enough!)
- If ∂f/∂w_i is consistently large → steep direction → need small step
- If ∂f/∂w_i is consistently small → flat direction → can take large step
- This approximates 1/√(H_ii) without computing Hessian!

---

### Configuration Options: Should We Implement Both?

**Option 1: Hessian-Based Only (Current Plan)**

Pros:
- ✅ Clearer pedagogical story
- ✅ Shows exact mathematical foundation
- ✅ Direct connection to Newton's method
- ✅ Simpler implementation (one algorithm)
- ✅ Perfect for demonstrating rotation dependence

Cons:
- ❌ Doesn't show how Adam/RMSprop actually work
- ❌ Less practical for users wanting to learn "real" optimizers

**Option 2: Add Gradient-Based Variants (AdaGrad/RMSprop/Adam)**

Pros:
- ✅ Shows how practical optimizers work
- ✅ Users can experiment with real algorithms
- ✅ Demonstrates trade-off: scalability vs exact curvature
- ✅ More complete educational tool

Cons:
- ❌ More complex implementation (4 algorithms instead of 1)
- ❌ Harder to show rotation dependence (need many iterations)
- ❌ More UI complexity (mode selector dropdown)
- ❌ Dilutes the main pedagogical message

**Option 3: Hybrid Approach (RECOMMENDED)**

**Main implementation:** Hessian-based diagonal preconditioner (pedagogical clarity)

**Add-on:** Gradient-based mode with three strategies:

```typescript
interface DiagonalPrecondOptions {
  preconditionerType: 'hessian' | 'gradient-based';  // Mode selector

  // For gradient-based mode:
  gradientBasedStrategy: 'adagrad' | 'rmsprop' | 'adam';

  // AdaGrad/RMSprop parameters:
  rmspropDecay?: number;  // β₂ for RMSprop (default: 0.9)

  // Adam parameters (if adam selected):
  adamBeta1?: number;  // β₁ for momentum (default: 0.9)
  adamBeta2?: number;  // β₂ for RMSprop (default: 0.999)
  useBiasCorrection?: boolean;  // Apply bias correction (default: true)

  // Shared:
  alpha?: number;  // Base learning rate (for gradient-based)
  epsilon?: number;  // Numerical stability constant
  useLineSearch?: boolean;
  c1?: number;
}
```

**UI Design (Simplified):**
```
┌─────────────────────────────────────────┐
│ Preconditioner Type                     │
│ ○ Hessian Diagonal (pedagogical)       │
│ ○ Gradient-Based (practical)           │
│                                          │
│ [If gradient-based selected:]           │
│   Strategy: [dropdown]                  │
│     • AdaGrad (accumulate all)         │
│     • RMSprop (exponential avg)        │
│     • Adam (RMSprop + momentum)        │
│                                          │
│   [If RMSprop/Adam:]                    │
│   Decay β₂: 0.9                        │
│   ├─────────────────────┤              │
│   0.0 → 0.999                           │
│                                          │
│   [If Adam only:]                       │
│   Momentum β₁: 0.9                     │
│   ☑ Bias Correction                     │
│                                          │
│   Base Learning Rate α: 0.01           │
└─────────────────────────────────────────┘
```

**Pedagogical Flow:**
1. **Start with Hessian-based**: Show rotation dependence clearly (1-2 iters vs 41 iters)
2. **Switch to AdaGrad**: "Estimate diagonal from gradient history instead of Hessian"
3. **Try RMSprop**: "Use exponential moving average to adapt faster"
4. **Try Adam**: "Full algorithm that practitioners use (adds momentum for acceleration)"
5. **Key insight**: Gradient-based takes more iterations but works without Hessian!

**What Each Strategy Teaches:**

- **AdaGrad**: Pure diagonal preconditioning from gradient history
  - Simple accumulation: v = Σg²
  - Shows the core idea clearly
  - Demonstrates coordinate-dependent scaling

- **RMSprop**: Forgetting old gradients
  - Exponential moving average: v = βv + (1-β)g²
  - More adaptive to changing landscapes
  - Still focuses on preconditioning (no momentum)

- **Adam**: Full practical optimizer
  - Adds momentum (m) on top of RMSprop (v)
  - Shows "what people actually use"
  - ⚠️ Caveat: Momentum is separate from preconditioning concept
  - Note: Designed for SGD but works in full-batch too

---

### Recommendation: Start Simple, Expand Later

**Phase 1 (MVP):**
- ✅ Implement **Hessian-based diagonal preconditioner only**
- ✅ Perfect for rotation invariance demonstration (main pedagogical goal)
- ✅ Clear connection to Newton's method
- ✅ Faster to implement and test

**Phase 2 (Future Enhancement):**
- Add **gradient-based mode** as configuration option
- Implement three strategies:
  1. **AdaGrad**: Pure accumulation (simplest gradient-based preconditioner)
  2. **RMSprop**: Exponential moving average (better for non-convex)
  3. **Adam**: Full algorithm (what practitioners use)
- Add experiments comparing Hessian vs gradient-based performance

**Why this approach:**
1. ✅ **Validates the core concept first**: Rotation invariance story with Hessian diagonal
2. ✅ **Gets pedagogical value immediately**: Main teaching point about coordinate dependence
3. ✅ **Keeps scope manageable**: One algorithm to implement, test, and debug
4. ✅ **Can add gradient-based later**: Based on user feedback and demand
5. ✅ **Allows comparison after both exist**: Can demonstrate tradeoffs empirically

**About Including Adam:**

**Arguments FOR including Adam (Phase 2):**
- ✅ It's what everyone actually uses in practice
- ✅ Completes the story: "Hessian → AdaGrad → RMSprop → Adam"
- ✅ Students can experiment with "real" optimizer
- ✅ Even in full-batch, Adam works (just with different motivation)
- ✅ Can note: "Designed for SGD, but shows coordinate scaling clearly in our setting"

**Arguments AGAINST including Adam:**
- ❌ Momentum is orthogonal to preconditioning (separate acceleration concept)
- ❌ In full-batch setting, momentum's main benefit (noise smoothing) isn't relevant
- ❌ Might confuse the preconditioning story with acceleration story
- ❌ More UI complexity (β₁, β₂, bias correction toggles)

**Recommendation:** Include Adam in Phase 2 with clear pedagogical framing:

> "**Adam** combines RMSprop's diagonal preconditioning with momentum for acceleration.
> It's designed for mini-batch SGD (stochastic gradients), where:
> - Momentum smooths noisy gradients
> - RMSprop adapts to coordinate scales and reduces noise sensitivity
>
> In our full-batch setting, we see:
> - The **preconditioning component** (v) - per-coordinate scaling
> - The **momentum component** (m) - acceleration (separate concept)
> - Both work in full-batch, though momentum's noise-smoothing benefit doesn't apply
>
> Try disabling momentum (β₁=0) to see pure RMSprop preconditioning!"

This way:
- Students learn what Adam actually is
- We're honest about full-batch vs SGD context
- The preconditioning concept stays clear
- Users can toggle momentum on/off to isolate effects

---

### 2.4 Hyperparameters

**For Hessian-Based Mode (Phase 1):**
- **useLineSearch** (boolean, default: `false`): Whether to use Armijo line search
  - `false`: Take full step (optimal for quadratics)
  - `true`: Use line search for robustness on non-convex problems
- **c1** (float, default: `0.0001`): Armijo parameter (if using line search)
- **maxIter** (int, default: `100`): Maximum iterations
- **tolerance** (float, default: `1e-6`): Convergence threshold for ||∇f||
- **epsilon** (float, default: `1e-8`): Numerical stability constant (add to diagonal)

**For Gradient-Based Mode (Phase 2 - Future):**
- **preconditionerType** ('hessian' | 'gradient-based'): Which preconditioner to use
- **gradientBasedStrategy** ('adagrad' | 'rmsprop' | 'adam'): Which gradient-based strategy
- **alpha** (float, default: `0.01`): Base learning rate
- **epsilon** (float, default: `1e-8`): Numerical stability constant

**For AdaGrad:**
- No additional parameters (pure accumulation)

**For RMSprop:**
- **beta2** (float, default: `0.9`): Decay rate for squared gradient accumulator
  - `0.0`: Acts like AdaGrad (no decay)
  - `0.9`: Standard RMSprop (typical value)
  - `0.99`: Slower adaptation
  - `0.999`: Very slow adaptation

**For Adam:**
- **beta1** (float, default: `0.9`): Decay rate for momentum (first moment)
  - `0.0`: No momentum (pure RMSprop)
  - `0.9`: Standard Adam (typical value)
  - `0.99`: Heavier momentum
- **beta2** (float, default: `0.999`): Decay rate for RMSprop (second moment)
- **useBiasCorrection** (boolean, default: `true`): Apply bias correction
  - Recommended for early iterations
  - Less important in full-batch setting

---

## 3. Implementation Plan

### 3.1 New Files to Create

```
src/
  algorithms/
    diagonal-preconditioner.ts        # NEW: Main algorithm implementation

  experiments/
    diagonal-precond-presets.ts       # NEW: Experiment presets for this algorithm
```

### 3.2 Files to Modify

```
src/
  UnifiedVisualizer.tsx               # Add new tab, state, and rendering
  components/
    AlgorithmExplainer.tsx            # Add diagonal preconditioner section
    AlgorithmConfiguration.tsx        # Add controls for diagonal precond
  experiments/
    index.ts                          # Export diagonal precond experiments
  types/
    experiments.ts                    # Add 'diagonal-precond' to types
```

### 3.3 Implementation Details

#### Step 1: Core Algorithm (`src/algorithms/diagonal-preconditioner.ts`)

```typescript
import { ProblemFunctions, AlgorithmOptions } from './types';
import { armijoLineSearch } from '../line-search/armijo';
import { norm, scale, add } from '../shared-utils';

export interface DiagonalPrecondIteration {
  iter: number;
  w: number[];
  wNew: number[];
  loss: number;
  newLoss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  stepNorm: number;
  hessianDiagonal: number[];
  preconditioner: number[];
  alpha?: number;  // If using line search
  lineSearchTrials?: any[];  // If using line search
}

export const runDiagonalPreconditioner = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    useLineSearch?: boolean;
    c1?: number;
    lambda?: number;
  }
): DiagonalPrecondIteration[] => {
  const {
    maxIter,
    initialPoint,
    tolerance = 1e-6,
    useLineSearch = false,
    c1 = 0.0001,
    lambda = 0
  } = options;

  // Note: lambda accepted for API consistency but unused
  void lambda;

  if (!problem.hessian) {
    throw new Error('Diagonal preconditioner requires Hessian computation');
  }

  const iterations: DiagonalPrecondIteration[] = [];
  let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Compute Hessian and extract diagonal
    const H = problem.hessian(w);
    const hessianDiagonal = problem.dimensionality === 3
      ? [H[0][0], H[1][1], H[2][2]]
      : [H[0][0], H[1][1]];

    // Build diagonal preconditioner D = diag(1/H₀₀, 1/H₁₁, ...)
    const preconditioner = hessianDiagonal.map(d => 1 / d);

    // Compute preconditioned direction: p = -D * grad
    const direction = grad.map((g, i) => -preconditioner[i] * g);
    const stepNorm = norm(direction);

    let wNew: number[];
    let newLoss: number;
    let alpha: number | undefined;
    let lineSearchTrials: any[] | undefined;

    if (useLineSearch) {
      // Use line search for robustness
      const lineSearchResult = armijoLineSearch(
        w,
        direction,
        grad,
        loss,
        (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
        c1
      );
      alpha = lineSearchResult.alpha;
      wNew = add(w, scale(direction, alpha));
      newLoss = problem.objective(wNew);
      lineSearchTrials = lineSearchResult.trials;
    } else {
      // Take full step (optimal for quadratics)
      alpha = 1.0;
      wNew = add(w, direction);
      newLoss = problem.objective(wNew);
    }

    iterations.push({
      iter,
      w: [...w],
      wNew: [...wNew],
      loss,
      newLoss,
      grad: [...grad],
      gradNorm,
      direction,
      stepNorm,
      hessianDiagonal,
      preconditioner,
      alpha,
      lineSearchTrials
    });

    w = wNew;

    // Check convergence
    if (gradNorm < tolerance) {
      break;
    }

    // Check for divergence
    if (!isFinite(newLoss) || !isFinite(gradNorm)) {
      break;
    }
  }

  return iterations;
};
```

#### Step 2: Experiment Presets (`src/experiments/diagonal-precond-presets.ts`)

```typescript
import { ExperimentPreset } from '../types/experiments';

export const diagonalPrecondExperiments: ExperimentPreset[] = [
  {
    id: 'diag-precond-aligned-success',
    name: 'Success: Aligned with Axes',
    description: 'Ellipse aligned with axes - diagonal preconditioner is perfect!',
    problem: 'ill-conditioned-quadratic',  // θ=0° by default
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 10,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Converges in 1-2 iterations! D=diag(1/H₀₀, 1/H₁₁) perfectly inverts diagonal Hessian',
  },
  {
    id: 'diag-precond-rotated-failure',
    name: 'Failure: Rotated Problem',
    description: 'Ellipse rotated 45° - diagonal preconditioner struggles!',
    problem: 'quadratic',  // Will use rotatedQuadratic(45°)
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Takes 40+ iterations! Hessian has off-diagonal terms that D cannot capture',
  },
  {
    id: 'diag-precond-compare-rotation',
    name: 'Compare: The Rotation Invariance Story',
    description: 'Side-by-side: diagonal precond vs Newton on rotated problem',
    problem: 'quadratic',  // rotated 45°
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Diagonal precond struggles (40 iters), Newton excels (2 iters)',
    comparisonConfig: {
      left: { algorithm: 'diagonal-precond' },
      right: { algorithm: 'newton', c1: 0.0001 },
    },
  },
  {
    id: 'diag-precond-adam-connection',
    name: 'Demo: The Adam Connection',
    description: 'Shows why Adam/RMSprop work well in practice',
    problem: 'logistic-regression',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.0001,
      maxIter: 50,
    },
    initialPoint: [0, 0, 0],
    expectation: 'Observe: Diagonal preconditioner works well! Features (coordinates) are meaningful in ML',
  },
  {
    id: 'diag-precond-vs-gd-linesearch',
    name: 'Compare: Diagonal vs Scalar Adaptation',
    description: 'Diagonal preconditioner vs GD with line search on ill-conditioned problem',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Diagonal precond (2 iters) vastly outperforms GD+LS (30+ iters) when aligned',
    comparisonConfig: {
      left: { algorithm: 'diagonal-precond' },
      right: { algorithm: 'gd-linesearch', c1: 0.0001 },
    },
  },
];
```

#### Step 3: Add Tab to UnifiedVisualizer

In `src/UnifiedVisualizer.tsx`:

```typescript
// Update type
type Algorithm = 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';

// Add state
const [diagPrecondIterations, setDiagPrecondIterations] = useState<DiagonalPrecondIteration[]>([]);
const [diagPrecondCurrentIter, setDiagPrecondCurrentIter] = useState(0);
const [diagPrecondUseLineSearch, setDiagPrecondUseLineSearch] = useState(false);
const [diagPrecondC1, setDiagPrecondC1] = useState(0.0001);
const [diagPrecondTolerance, setDiagPrecondTolerance] = useState(1e-6);

// Add run function
const runDiagPrecond = useCallback(() => {
  // ... implementation similar to other algorithms
}, [/* deps */]);

// Add tab in JSX
<button
  onClick={() => setSelectedTab('diagonal-precond')}
  className={tabButtonClass('diagonal-precond')}
>
  Diagonal Preconditioner
</button>

// Add tab content
{selectedTab === 'diagonal-precond' && (
  <div className="space-y-4">
    {/* Algorithm configuration component */}
    {/* Iteration playback component */}
    {/* Canvas visualizations */}
    {/* Metrics display */}
  </div>
)}
```

---

## 4. Pedagogical Content Structure

### 4.1 AlgorithmExplainer Section

Add new collapsible section after GD (Line Search) and before Newton:

```jsx
<CollapsibleSection
  title="Diagonal Preconditioner"
  defaultExpanded={false}
  storageKey="algorithm-explainer-diagonal-precond"
>
  <div className="space-y-3 text-gray-800">
    <p>
      <strong>Type:</strong> First-order method with per-coordinate step sizes
    </p>

    <div>
      <p className="font-semibold">Update Rule:</p>
      <BlockMath>
        {String.raw`w_{k+1} = w_k - D_k \nabla f(w_k)`}
      </BlockMath>
      <p className="text-sm mt-1">
        where <InlineMath>D_k</InlineMath> is a diagonal matrix with per-coordinate step sizes
      </p>
    </div>

    <div>
      <p className="font-semibold">Diagonal Preconditioner (using Hessian):</p>
      <BlockMath>
        {String.raw`D = \text{diag}(1/H_{00}, 1/H_{11}, ...)`}
      </BlockMath>
      <p className="text-sm mt-1">
        Extracts diagonal from Hessian H and inverts it
      </p>
    </div>

    <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
      <p className="font-semibold">Connection to Adam/RMSprop/AdaGrad:</p>
      <p className="text-sm mt-1">
        Modern adaptive optimizers use diagonal preconditioning! They estimate
        the diagonal from gradient history rather than computing the Hessian:
      </p>
      <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
        <li>
          <strong>AdaGrad:</strong> <InlineMath>D = \text{diag}(1/\sqrt{\sum g_i^2})</InlineMath>
        </li>
        <li>
          <strong>RMSprop:</strong> <InlineMath>D = \text{diag}(1/\sqrt{\text{EMA}(g^2)})</InlineMath>
        </li>
        <li>
          <strong>Adam:</strong> RMSprop + momentum
        </li>
      </ul>
      <p className="text-sm mt-2">
        These methods work well because ML feature spaces usually have meaningful
        coordinate axes (pixels, word embeddings, etc.)
      </p>
    </div>

    <p>
      <strong>How it works:</strong> Uses different step sizes for each coordinate
      based on local curvature. Our implementation uses the exact Hessian diagonal
      (pedagogical). In practice, Adam/RMSprop estimate this from gradient history
      without computing Hessians (scalable to millions of parameters).
    </p>

    <p>
      <strong>Convergence rate:</strong> Can achieve quadratic convergence on
      axis-aligned problems! But degrades to linear on rotated problems.
    </p>

    <p>
      <strong>Cost per iteration:</strong>
    </p>
    <ul className="text-sm list-disc ml-5">
      <li><strong>Our implementation:</strong> Gradient + Hessian (same as Newton), no matrix inversion</li>
      <li><strong>Adam/RMSprop:</strong> Just gradient + O(n) accumulator updates (very cheap!)</li>
    </ul>

    <div className="bg-yellow-50 rounded p-3">
      <p className="text-sm font-semibold mb-1">Strengths:</p>
      <ul className="text-sm list-disc ml-5">
        <li>Perfect on axis-aligned problems (1-2 iterations!)</li>
        <li>Adapts step size to each coordinate independently</li>
        <li>No matrix inversion needed (just divide by diagonal)</li>
        <li>Widely used in practice (Adam, RMSprop, AdaGrad)</li>
      </ul>
    </div>

    <div className="bg-red-50 rounded p-3 mt-2">
      <p className="text-sm font-semibold mb-1">Weaknesses:</p>
      <ul className="text-sm list-disc ml-5">
        <li><strong>Coordinate-dependent</strong> - performance varies with rotation</li>
        <li>Ignores off-diagonal Hessian structure</li>
        <li>Struggles on rotated problems (can be 20× slower!)</li>
        <li>Requires Hessian computation (expensive) - our pedagogical implementation</li>
        <li>Gradient-based variants (Adam/RMSprop) avoid Hessian but are approximate</li>
      </ul>
    </div>

    <div className="bg-blue-50 rounded p-3 mt-2">
      <p className="text-sm font-semibold mb-1">Best for:</p>
      <ul className="text-sm list-disc ml-5">
        <li>Problems where coordinates are meaningful</li>
        <li>Axis-aligned or nearly axis-aligned problems</li>
        <li>Understanding why Adam/RMSprop work (and when they don't)</li>
        <li>Seeing the limitations of diagonal approximations</li>
      </ul>
    </div>

    <div className="bg-purple-50 rounded p-3 mt-2 border border-purple-200">
      <p className="text-sm font-semibold mb-1">The Rotation Invariance Story:</p>
      <p className="text-sm">
        This algorithm demonstrates the critical limitation of diagonal methods:
      </p>
      <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
        <li><strong>θ=0° (aligned):</strong> H is diagonal → D=H⁻¹ exactly → 1-2 iterations!</li>
        <li><strong>θ=45° (rotated):</strong> H has off-diagonals → D misses them → 40+ iterations</li>
        <li><strong>Newton:</strong> Full H⁻¹ works identically at any angle → 2 iterations always</li>
      </ul>
      <p className="text-sm mt-2 font-semibold">
        Only Newton's full matrix achieves rotation invariance!
      </p>
    </div>
  </div>
</CollapsibleSection>
```

### 4.2 Quick Comparison Table Update

Update the comparison table in AlgorithmExplainer to include diagonal preconditioner:

```jsx
<tbody className="text-gray-700">
  <tr className="border-b border-gray-200">
    <td className="py-2 font-medium">GD Fixed</td>
    <td className="py-2">Linear</td>
    <td className="py-2">Low (1 gradient)</td>
    <td className="py-2">Simple, well-conditioned problems</td>
  </tr>
  <tr className="border-b border-gray-200">
    <td className="py-2 font-medium">GD Line Search</td>
    <td className="py-2">Linear</td>
    <td className="py-2">Medium (3-10 evals)</td>
    <td className="py-2">Robust GD, varying curvature</td>
  </tr>
  <tr className="border-b border-gray-200">
    <td className="py-2 font-medium">Diag. Precond</td>
    <td className="py-2">Quadratic*</td>
    <td className="py-2">High (grad + Hessian)</td>
    <td className="py-2">Axis-aligned problems, understanding Adam</td>
  </tr>
  <tr className="border-b border-gray-200">
    <td className="py-2 font-medium">Newton</td>
    <td className="py-2">Quadratic</td>
    <td className="py-2">High (Hessian + solve)</td>
    <td className="py-2">Small-scale, high accuracy</td>
  </tr>
  <tr>
    <td className="py-2 font-medium">L-BFGS</td>
    <td className="py-2">Superlinear</td>
    <td className="py-2">Low-Med (1 grad + O(Mn))</td>
    <td className="py-2">Large-scale, production ML</td>
  </tr>
</tbody>
```

*Note: "Quadratic*" with asterisk to indicate it's only quadratic for axis-aligned problems

---

## 5. Visualization Design

### 5.1 Canvases for Diagonal Preconditioner Tab

1. **Data Space Canvas** (shared, existing)
   - Shows decision boundary for logistic regression
   - Shows contours for pure optimization problems

2. **Parameter Space Canvas** (shared pattern)
   - Loss landscape heatmap
   - Trajectory path showing optimization progress
   - Current position marker

3. **Hessian Diagonal Visualization** (NEW)
   - Bar chart showing Hessian diagonal values [H₀₀, H₁₁]
   - Bar chart showing preconditioner values [1/H₀₀, 1/H₁₁]
   - Updates at each iteration
   - Helps visualize per-coordinate scaling

4. **Optional: Step Size Comparison** (NEW)
   - Shows gradient vector vs preconditioned direction
   - Demonstrates how diagonal scaling affects each coordinate

### 5.2 Info Panel Metrics

Display at each iteration:
- Current iteration number
- Loss value: `f(w)`
- Gradient norm: `||∇f(w)||`
- Current weights: `w = [w₀, w₁]` or `[w₀, w₁, w₂]`
- **Hessian diagonal**: `[H₀₀, H₁₁]` or `[H₀₀, H₁₁, H₂₂]`
- **Preconditioner**: `[1/H₀₀, 1/H₁₁]` or `[1/H₀₀, 1/H₁₁, 1/H₂₂]`
- **Step norm**: `||p||` where `p = -D∇f`
- If using line search: **Step size α**

### 5.3 Color Scheme

**Tab color:** `bg-teal-100` to `bg-teal-50` (teal banner)
- Fits between blue (GD-LS) and purple (Newton) in color progression

**Hessian diagonal visualization:**
- H₀₀, H₁₁: Blue bars
- 1/H₀₀, 1/H₁₁: Green bars
- Larger values → taller bars

---

## 6. Impact on Existing Content

### 6.1 Text Updates Across the Site

#### ProblemExplainer.tsx (Add Rotation Section)

Add new collapsible section explaining rotation angle parameter:

```jsx
<CollapsibleSection
  title="Rotation Angle (for Quadratic Problems)"
  defaultExpanded={false}
  storageKey="problem-explainer-rotation"
>
  <div className="space-y-3 text-gray-800">
    <p className="font-semibold">Why does rotation matter?</p>
    <p>
      The quadratic problem can be rotated to demonstrate coordinate system dependence:
    </p>
    <BlockMath>
      {String.raw`f(w) = \frac{1}{2}w^T R D R^T w`}
    </BlockMath>
    <p className="text-sm">
      where R is a rotation matrix and D is diagonal
    </p>

    <div className="bg-indigo-50 rounded p-3 border border-indigo-200 mt-2">
      <p className="font-semibold">The Rotation Invariance Experiment:</p>
      <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
        <li><strong>θ=0°:</strong> Ellipse aligned with axes (w₀, w₁)</li>
        <li><strong>θ=45°:</strong> Ellipse rotated 45 degrees</li>
      </ul>
      <p className="text-sm mt-2">
        First-order methods (GD) and diagonal preconditioning show different
        performance at different angles. Newton's method performs identically!
      </p>
    </div>

    <p className="font-semibold mt-3">Try this experiment:</p>
    <ol className="list-decimal ml-6 space-y-1 text-sm">
      <li>Go to Diagonal Preconditioner tab</li>
      <li>Run with θ=0° → observe 1-2 iterations</li>
      <li>Change to θ=45° → observe 40+ iterations</li>
      <li>Go to Newton tab → observe 2 iterations at any angle</li>
    </ol>
  </div>
</CollapsibleSection>
```

#### AlgorithmConfiguration Component Updates

Add controls for diagonal preconditioner similar to existing algorithm configs:

```jsx
{selectedTab === 'diagonal-precond' && (
  <>
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={diagPrecondUseLineSearch}
        onChange={(e) => setDiagPrecondUseLineSearch(e.target.checked)}
      />
      <span className="text-sm">Use Line Search</span>
    </label>

    {diagPrecondUseLineSearch && (
      <div>
        <label className="text-sm font-medium text-gray-700">
          c₁ (Armijo parameter): {diagPrecondC1}
        </label>
        <input
          type="range"
          min="-5"
          max="-1"
          step="0.1"
          value={Math.log10(diagPrecondC1)}
          onChange={(e) => setDiagPrecondC1(Math.pow(10, parseFloat(e.target.value)))}
          className="w-full"
        />
      </div>
    )}

    <div>
      <label className="text-sm font-medium text-gray-700">
        Max Iterations: {maxIter}
      </label>
      <input
        type="range"
        min="10"
        max="200"
        step="10"
        value={maxIter}
        onChange={(e) => setMaxIter(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  </>
)}
```

### 6.2 Experiment Loading System

Update `src/experiments/index.ts`:

```typescript
import { diagonalPrecondExperiments } from './diagonal-precond-presets';

export function getExperimentsForAlgorithm(algorithm: string): ExperimentPreset[] {
  switch (algorithm) {
    case 'gd-fixed':
      return gdFixedExperiments;
    case 'gd-linesearch':
      return gdLinesearchExperiments;
    case 'diagonal-precond':
      return diagonalPrecondExperiments;
    case 'newton':
      return newtonExperiments;
    case 'lbfgs':
      return lbfgsExperiments;
    default:
      return [];
  }
}
```

### 6.3 Problem Configuration Updates

Ensure rotation angle slider is visible for quadratic problem:

```jsx
{currentProblem === 'quadratic' && (
  <div>
    <label className="text-sm font-medium text-gray-700">
      Rotation Angle: {rotationAngle}°
    </label>
    <input
      type="range"
      min="0"
      max="90"
      step="15"
      value={rotationAngle}
      onChange={(e) => setRotationAngle(parseInt(e.target.value))}
      className="w-full"
    />
    <p className="text-xs text-gray-500 mt-1">
      θ=0°: aligned with axes | θ=45°: maximum misalignment for diagonal methods
    </p>
  </div>
)}
```

### 6.4 Navigation Updates

Update "Exploring the Algorithms" section in AlgorithmExplainer:

```jsx
<div className="grid grid-cols-2 gap-3 text-sm">
  <div>
    <p className="font-semibold text-gray-900">For learning:</p>
    <ul className="text-gray-700 list-disc ml-5">
      <li>Start with GD Fixed on Quadratic Bowl</li>
      <li>Add Line Search to see adaptive step sizes</li>
      <li>Try Diagonal Precond to see per-coordinate adaptation</li>
      <li>See Newton's rotation invariance on Rotated Quadratic</li>
    </ul>
  </div>
  <div>
    <p className="font-semibold text-gray-900">The rotation story:</p>
    <ul className="text-gray-700 list-disc ml-5">
      <li>Diagonal Precond tab: Run at θ=0° then θ=45°</li>
      <li>Watch convergence degrade dramatically</li>
      <li>Compare with Newton tab: identical at all angles</li>
      <li>Understand why Adam works (meaningful axes)</li>
    </ul>
  </div>
</div>
```

---

## 7. Testing and Validation

### 7.1 Correctness Tests

Verify implementation against test suite:

```bash
npx tsx test-diagonal-preconditioner.ts
npx tsx test-full-progression.ts
npx tsx test-rotation-comparison.ts
```

**Expected results:**
- Diagonal precond converges in 1-2 iterations at θ=0° on quadratic
- Diagonal precond takes 40+ iterations at θ=45° on quadratic
- Newton converges in 2 iterations at any angle

### 7.2 User Testing Scenarios

**Scenario 1: Understanding Modern Optimizers**
- User familiar with Adam/RMSprop wants to understand internals
- Should see diagonal preconditioner working well on logistic regression
- Should understand connection to adaptive optimizers
- Should recognize limitations (coordinate dependence)

**Scenario 2: Rotation Invariance Story**
- User follows progression from GD → Diagonal → Newton
- Should experience dramatic performance difference at θ=0° vs θ=45°
- Should understand why full matrix is necessary
- Should appreciate Newton's rotation invariance

**Scenario 3: Algorithm Selection**
- User choosing algorithm for their problem
- Should understand when diagonal methods work (meaningful coordinates)
- Should understand when full matrix methods are needed (arbitrary rotations)
- Should make informed tradeoff between cost and invariance

### 7.3 Edge Cases

- **Non-positive Hessian diagonal:** Add check to prevent division by zero/negative
- **Very small diagonal values:** Add numerical damping (similar to Newton)
- **3D problems:** Ensure preconditioner works for [w₀, w₁, w₂]
- **Line search failures:** Graceful degradation if Armijo search fails

---

## 8. Implementation Priorities and Phases

### Phase 1: Core Implementation (Priority: HIGH)
- [ ] Implement `algorithms/diagonal-preconditioner.ts`
- [ ] Create `experiments/diagonal-precond-presets.ts`
- [ ] Add type definitions to `types/experiments.ts`
- [ ] Unit tests for diagonal preconditioner algorithm

### Phase 2: UI Integration (Priority: HIGH)
- [ ] Add new tab to UnifiedVisualizer
- [ ] Add state management for diagonal precond
- [ ] Add algorithm configuration controls
- [ ] Wire up run function and iteration playback

### Phase 3: Visualizations (Priority: MEDIUM)
- [ ] Parameter space canvas (reuse existing)
- [ ] Hessian diagonal bar chart visualization
- [ ] Info panel with metrics display
- [ ] Optional: step size comparison visualization

### Phase 4: Pedagogical Content (Priority: HIGH)
- [ ] Add diagonal preconditioner section to AlgorithmExplainer
- [ ] Update comparison table
- [ ] Add rotation angle explanation to ProblemExplainer
- [ ] Update "Exploring the Algorithms" navigation guide

### Phase 5: Experiments and Polish (Priority: MEDIUM)
- [ ] Create 5 experiment presets
- [ ] Test all presets work correctly
- [ ] Ensure comparison mode works with diagonal precond
- [ ] Add rotation angle slider polish and help text

### Phase 6: Documentation (Priority: LOW)
- [ ] Update README with new algorithm
- [ ] Add implementation notes for diagonal preconditioner
- [ ] Document rotation invariance experiments

---

## 9. Success Criteria

Implementation is successful if:

1. ✅ **Pedagogical story is complete:** Clear progression scalar → adaptive scalar → diagonal → full matrix
2. ✅ **Rotation invariance demonstrated:** Dramatic performance difference at θ=0° vs θ=45°
3. ✅ **Adam connection clear:** Users understand why Adam/RMSprop work and when they struggle
4. ✅ **Implementation correct:** Diagonal preconditioner converges as expected on test problems
5. ✅ **UI consistent:** New tab follows same patterns as existing tabs
6. ✅ **Content cohesive:** All text updated to reflect 5-algorithm progression
7. ✅ **Experiments valuable:** Presets effectively demonstrate key insights

---

## 10. Open Questions and Future Enhancements

### Resolved in Design
- ✅ Algorithm placement? → Between GD-LS and Newton (completes progression)
- ✅ Use line search? → Optional, off by default (show pure preconditioner)
- ✅ Hessian or gradient-based? → Hessian-based (pedagogical clarity), mention gradient-based in explainer
- ✅ How many experiments? → 5 presets covering key scenarios

### Future Enhancements

**1. Gradient-Based Diagonal Preconditioner (Adam-style)**
- Estimate diagonal from gradient history instead of Hessian
- Shows connection to Adam more directly
- Doesn't require Hessian computation

**2. Comparison Mode Enhancements**
- Side-by-side-by-side: GD-LS vs Diagonal vs Newton
- Performance table showing iteration counts across angles

**3. Interactive Rotation Exploration**
- Animated sweep through rotation angles
- Plot convergence iterations vs rotation angle
- Visually demonstrate coordinate dependence

**4. Eigenvalue Visualization**
- Show Hessian eigenvalues and eigenvectors
- Visualize principal axes vs coordinate axes
- Demonstrate why off-diagonal terms matter

---

## Appendix A: Feasibility Testing Results

### Test 1: Circular Bowl (κ=1, no conditioning)

All rotation angles perform identically (142 iterations):
```
θ= 0°: 142 iters
θ=15°: 142 iters
θ=30°: 142 iters
θ=45°: 142 iters
θ=60°: 142 iters
θ=75°: 142 iters
θ=90°: 142 iters
```

**Insight:** For isotropic problems (circular), rotation makes no difference for any algorithm.

### Test 2: Ellipse (κ=5) - All Four Stages

**GD-fixed (α=0.1):**
- θ=0°: 139 iterations
- θ=45°: 25 iterations
- **5.6× performance difference**

**GD-linesearch:**
- θ=0°: 34 iterations
- θ=45°: 13 iterations
- **2.6× performance difference**

**Diagonal Preconditioner:**
- θ=0°: **1-2 iterations** ✨
- θ=45°: **41 iterations**
- **20× performance difference!** (Most dramatic)

**Newton:**
- θ=0°: 2 iterations
- θ=45°: 2 iterations
- **Perfect rotation invariance**

### Test 3: Multiple Rotation Angles (Diagonal Preconditioner)

```
θ= 0°:  1 iter  ← Aligned, perfect!
θ=15°: 19 iters
θ=30°: 34 iters
θ=45°: 41 iters ← Maximum misalignment
θ=60°: 34 iters
θ=75°: 19 iters
θ=90°:  1 iter  ← Aligned again (90° = axes swap)
```

**Insight:** Performance degrades smoothly with rotation angle, with θ=45° being worst case.

### Test 4: Newton Rotation Invariance Verification

```
θ= 0°: 2 iters
θ=15°: 2 iters
θ=30°: 2 iters
θ=45°: 2 iters
θ=60°: 2 iters
θ=75°: 2 iters
θ=90°: 2 iters
```

**Insight:** Newton is **perfectly rotation-invariant** as theory predicts.

---

## Appendix B: Visual Design Mockups

### Tab Banner

```
┌────────────────────────────────────────────────────────┐
│  Diagonal Preconditioner                    [Teal bg]  │
│  Per-coordinate step sizes based on Hessian diagonal   │
└────────────────────────────────────────────────────────┘
```

### Hessian Diagonal Visualization

```
Hessian Diagonal          Preconditioner
     │                          │
  5.0┤████████              0.2┤████████
     │                          │
  2.5┤████                  0.4┤████████████████
     │                          │
  0.0┼────────              0.0┼────────────────
     w₀    w₁                   w₀    w₁
```

### Info Panel

```
┌─────────────────────────────────────────┐
│ Iteration: 3                            │
│ Loss: 0.0245                            │
│ Gradient Norm: 0.0012                   │
│                                          │
│ Current Weights:                        │
│   w₀ = 0.234, w₁ = 1.567               │
│                                          │
│ Hessian Diagonal:                       │
│   H₀₀ = 5.0, H₁₁ = 1.0                 │
│                                          │
│ Preconditioner:                         │
│   D₀₀ = 0.2, D₁₁ = 1.0                 │
│                                          │
│ Step Norm: 0.0543                       │
└─────────────────────────────────────────┘
```

---

**End of Design Document**
