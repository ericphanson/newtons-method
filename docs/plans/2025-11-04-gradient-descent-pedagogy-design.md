# Gradient Descent Pedagogy - Adding GD to Optimization Visualizer

**Date:** 2025-11-04
**Status:** Design Complete, Ready for Implementation
**Author:** Design Session with Claude

## Executive Summary

Add two new gradient descent tabs to the optimization visualizer to create a complete pedagogical progression from first-order methods to second-order methods. The four-tab sequence will be: **GD (Fixed Step) → GD (Line Search) → Newton's Method → L-BFGS**.

**Target Audience:** Mathematically mature users (linear algebra background) who are unfamiliar with optimization algorithms but want to understand both intuition and implementation details.

**Key Goals:**
- Build intuition progressively, showing what each additional technique contributes
- Maintain implementation-level detail for practitioners
- Stay in 2D/3D for visualization clarity
- Design for future extensibility (swappable line search algorithms, swappable problems)

---

## 1. Pedagogical Progression

### Four-Tab Journey: "Build Up the Components"

**Tab 1: Gradient Descent (Fixed Step)**
- **What it teaches:** Basic idea of following negative gradient
- **Key limitation:** Choosing step size α is hard; one size doesn't fit all situations
- **User experience:** Experimentation with different α values shows overshooting, zig-zagging, or slow convergence

**Tab 2: Gradient Descent (Line Search)**
- **What it teaches:** Adaptive step sizes prevent overshooting and adjust automatically
- **Key mechanism:** Armijo backtracking condition for "sufficient decrease"
- **User experience:** See line search adapt α per iteration, compare with fixed-step ghost trajectory

**Tab 3: Newton's Method** (existing)
- **What it teaches:** Second-order curvature information (Hessian) enables smarter, larger steps
- **Key advantage:** Quadratic convergence near minimum
- **Key cost:** O(n³) Hessian inversion, O(n²) storage

**Tab 4: L-BFGS** (existing)
- **What it teaches:** Approximate Hessian from history using memory pairs
- **Key advantage:** Near-quadratic convergence with O(mn) cost where m << n
- **Key mechanism:** Two-loop recursion for implicit Hessian approximation

### Why This Progression?

1. **Gradual complexity:** Each step solves a visible problem from the previous step
2. **Motivated learning:** Users see *why* each complication is worth it
3. **Complete story:** First-order (gradient) → adaptive step → second-order (Hessian) → efficient approximation
4. **Implementation focus:** Each algorithm shown in full detail with math and pseudocode

---

## 2. Architecture and Code Organization

### Proposed Directory Structure

```
src/
  algorithms/
    gradient-descent.ts          # NEW: basic GD with fixed step
    gradient-descent-linesearch.ts  # NEW: GD with Armijo
    newton.ts                     # EXISTING
    lbfgs.ts                      # EXISTING

  line-search/
    types.ts                      # NEW: LineSearchStrategy interface
    armijo.ts                     # NEW: extract from existing code
    # FUTURE: wolfe.ts, strong-wolfe.ts, backtracking.ts

  problems/
    types.ts                      # NEW: OptimizationProblem interface
    logistic-regression.ts        # NEW: extract from shared-utils
    # FUTURE: rosenbrock.ts, quadratic.ts, neural-net.ts

  shared-utils.ts                 # EXISTING: Canvas, formatting, data generation
  UnifiedVisualizer.tsx           # EXISTING: Main component (expand to 4 tabs)
```

### Key Interfaces for Extensibility

```typescript
// line-search/types.ts
interface LineSearchResult {
  alpha: number;
  newLoss: number;
  trials: Array<{alpha: number; loss: number; satisfied: boolean}>;
  curve: {alphaRange: number[]; lossValues: number[]; armijoValues: number[]};
}

type LineSearchStrategy = (
  w: number[],
  direction: number[],
  gradient: number[],
  loss: number,
  computeLossAndGrad: (w: number[]) => {loss: number; gradient: number[]},
  c1: number
) => LineSearchResult;

// problems/types.ts
interface OptimizationProblem {
  name: string;
  dimension: number;
  computeLossAndGradient: (w: number[], data: any, lambda: number) => {
    loss: number;
    gradient: number[];
  };
  computeHessian?: (w: number[], data: any, lambda: number) => number[][];  // Optional, for Newton
  generateData: () => any;
  renderDataSpace: (canvas: HTMLCanvasElement, data: any, weights: number[]) => void;
}
```

**Design Notes:**
- Algorithms accept `problem: OptimizationProblem` and `lineSearch: LineSearchStrategy` parameters
- Makes both line search and problem truly pluggable
- Current implementation uses logistic regression + Armijo; future can add more without changing algorithm code
- Interactive point adding already exists; future: CSV/JSON dataset upload

---

## 3. Algorithm Implementation Details

### 3.1 Gradient Descent (Fixed Step)

**Interface:**
```typescript
interface GDIteration {
  iter: number;
  wOld: number[];
  wNew: number[];
  loss: number;
  newLoss: number;
  gradient: number[];
  gradNorm: number;
  alpha: number;  // Fixed value
  direction: number[];
}

function runGradientDescent(
  data: DataPoint[],
  maxIters: number,
  alpha: number,  // Fixed step size
  lambda: number
): GDIteration[];
```

**Algorithm Pseudocode:**
```
Initialize: w = [0, 0, 0]
For iter = 0 to maxIters:
  1. Compute loss and gradient: f(w), ∇f(w)
  2. Compute gradient norm: ||∇f(w)||
  3. Compute direction: p = -∇f(w)
  4. Update weights: w_new = w + α·p
  5. Store iteration data
  6. Early stop if ||∇f(w)|| < 1e-6
Return iterations
```

**Hyperparameters:**
- `alpha`: Fixed step size, slider range [0.001, 1.0] (log scale)
- `maxIters`: 50-100 (more than Newton due to slower convergence)

### 3.2 Gradient Descent (Line Search)

**Interface:**
```typescript
interface GDLineSearchIteration extends GDIteration {
  lineSearchTrials: Array<{alpha: number; loss: number; satisfied: boolean}>;
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

function runGradientDescentLineSearch(
  data: DataPoint[],
  maxIters: number,
  lambda: number,
  c1: number  // Armijo parameter
): GDLineSearchIteration[];
```

**Algorithm Pseudocode:**
```
Initialize: w = [0, 0, 0]
For iter = 0 to maxIters:
  1. Compute loss and gradient: f(w), ∇f(w)
  2. Compute direction: p = -∇f(w)
  3. Line search: α = armijoLineSearch(w, p, ∇f(w), f(w), c1)
  4. Update weights: w_new = w + α·p
  5. Store iteration data including line search trials
  6. Early stop if ||∇f(w)|| < 1e-6
Return iterations
```

**Hyperparameters:**
- `c1`: Armijo parameter, range [1e-5, 0.5] (log scale)
- `maxIters`: 40-80

### 3.3 Refactoring Newton and L-BFGS

**Changes needed:**
1. Extract Armijo line search logic into `src/line-search/armijo.ts`
2. Both Newton and L-BFGS import and use the shared implementation
3. Ensures consistent line search visualization across all tabs
4. No algorithm logic changes, just code organization

---

## 4. Visualizations

### 4.1 Shared Visualizations (All Tabs)

**Data Space Canvas** (existing, reused)
- 2D scatter plot of data points (red/blue classes)
- Decision boundary from current weights
- Interactive point adding (already implemented)

**Parameter Space Canvas** (existing pattern, reused)
- Loss landscape heatmap for (w₀, w₁) with w₂=0
- Lighter colors = lower loss
- Trajectory path (orange line) showing optimization progress
- Current position (red dot)

### 4.2 Tab 1: Gradient Descent (Fixed Step)

**Canvases:**
1. Data Space (shared)
2. Parameter Space with trajectory
3. **Optional: Gradient Vector Overlay**
   - Arrow showing gradient direction at current point
   - Makes "follow the negative gradient" visually obvious
   - Could overlay on parameter space or be separate mini-viz

**Info Panel:**
- Iteration number
- Loss, gradient norm
- Current weights
- Fixed step size α
- **Status indicators:** "Converged" / "Oscillating" / "Diverging" / "Slow progress"

### 4.3 Tab 2: Gradient Descent (Line Search)

**Canvases:**
1. Data Space (shared)
2. Parameter Space with trajectory
3. **Line Search Plot** (same style as Newton/L-BFGS)
   - X-axis: step size α being tested
   - Y-axis: loss f(w + αp)
   - Blue curve: actual loss along search direction
   - Orange dashed: Armijo condition boundary
   - Red dots: rejected α values
   - Green dot: accepted α value

**Info Panel:**
- Iteration number
- Loss, gradient norm
- Current weights
- **Chosen step size α** (varies per iteration)
- **Number of backtracking steps** taken

**Optional Feature:** "Compare with fixed α" toggle
- Shows ghost trajectory for fixed α = 0.5
- Visually demonstrates value of adaptive step sizes

### 4.4 Tabs 3 & 4: Newton and L-BFGS (Existing)

No visualization changes needed. These already have:
- Data space
- Parameter space
- Line search plot
- Newton: Hessian matrix visualization
- L-BFGS: Memory pairs table, two-loop recursion details

---

## 5. Pedagogical Content Structure

Each tab follows the same information architecture with collapsible sections.

### 5.1 Tab 1: Gradient Descent (Fixed Step)

#### A) "What is Gradient Descent?" (expanded by default)
```
Goal: Find weights w that minimize loss f(w)

Intuition: Imagine you're on a hillside in fog. You can feel the slope
under your feet (the gradient), but can't see the valley. Walk downhill
repeatedly until you reach the bottom.

The gradient ∇f tells you the direction of steepest ascent.
We go the opposite way: -∇f (steepest descent).
```

#### B) "The Algorithm" (expanded by default)
```
1. Start with initial guess w₀ (e.g., all zeros)
2. Compute gradient: g = ∇f(w)
3. Take a step downhill: w_new = w_old - α·g
4. Repeat steps 2-3 until gradient is tiny (converged)

Key parameter: α (step size)
- Too small → slow progress, many iterations
- Too large → overshoot minimum, oscillate or diverge
- Just right → steady progress toward minimum
```

#### C) "The Mathematics" (collapsed by default - expandable for deep dive)
```
Loss function:
f(w) = -(1/N) Σ [y log(σ(wᵀx)) + (1-y) log(1-σ(wᵀx))] + (λ/2)||w||²

Gradient (vector of partial derivatives):
∇f(w) = [∂f/∂w₀, ∂f/∂w₁, ∂f/∂w₂]ᵀ

For logistic regression:
∇f(w) = (1/N) Σ (σ(wᵀx) - y)·x + λw

Update rule:
w^(k+1) = w^(k) - α∇f(w^(k))

Convergence criterion: ||∇f(w)|| < ε (e.g., ε = 10⁻⁶)
```

#### D) "What You're Seeing" (expanded by default)
```
Left: Data space - decision boundary from current weights
Right: Parameter space (w₀, w₁) - the loss landscape
  - Lighter colors = lower loss (the valley we're searching for)
  - Orange path = trajectory of weights across iterations
  - Red dot = current position

The gradient points perpendicular to contour lines (level sets).
We follow it downhill toward the minimum.
```

#### E) "Try This" (collapsed by default - interactive challenges)
```
- Set α = 0.001: Watch it take tiny steps. How many iterations to converge?
- Set α = 0.5: Watch it oscillate. Why does it zig-zag?
- Set α = 1.5: Does it diverge completely?
- Add custom points: Does the landscape change? Does the same α still work?
```

### 5.2 Tab 2: Gradient Descent (Line Search)

#### A) "The Problem with Fixed Step Size" (expanded by default)
```
Fixed α has a dilemma:
- Early iterations: Far from minimum, could take large steps → α should be big
- Late iterations: Near minimum, need precision → α should be small
- One fixed α can't be optimal throughout!

Additional problem: α depends on the problem
- Changing λ (regularization) changes the landscape steepness
- Adding data points changes the loss function
- What worked before might not work now
```

#### B) "Line Search: Adaptive Step Sizes" (expanded by default)
```
Idea: Choose α dynamically at each iteration

At iteration k:
1. Compute search direction: p = -∇f(w^(k))
2. Find good step size: α_k = lineSearch(w^(k), p)
3. Update: w^(k+1) = w^(k) + α_k·p

Question: What makes a step size "good"?
Answer: Sufficient decrease in loss (Armijo condition)
```

#### C) "The Algorithm" (expanded by default)
```
Main Loop:
1. Compute gradient: g = ∇f(w)
2. Set search direction: p = -g
3. Perform line search: α = armijoLineSearch(w, p, g)
4. Update: w_new = w + α·p
5. Repeat until ||g|| < ε

Armijo Line Search (backtracking):
Input: w, p, g, f(w), c₁
1. Start with α = 1
2. While f(w + αp) > f(w) + c₁·α·(gᵀp):
     α ← α/2
3. Return α
```

#### D) "Armijo Condition (The Rule)" (collapsed by default)
```
Accept α if it satisfies:
f(w + α·p) ≤ f(w) + c₁·α·(∇f(w)ᵀp)

Interpretation:
- Left side: Actual loss after taking step
- Right side: Expected loss from linear approximation + safety margin
- c₁ ∈ (0, 1): How much decrease we demand (typically 10⁻⁴)

Smaller c₁ → accept steps more easily (less picky)
Larger c₁ → demand more decrease (more picky)

The condition ensures sufficient decrease without being too greedy.
We don't need the absolute best α, just a good-enough α that
reduces loss adequately.
```

#### E) "Line Search Visualization" (expanded by default)
```
The plot shows:
- X-axis: Step size α we're testing
- Y-axis: Loss value f(w + α·p)
- Blue curve: Actual loss along the search direction
- Orange dashed line: Armijo condition boundary
- Red dots: Step sizes that were rejected (not enough decrease)
- Green dot: Accepted step size (satisfies Armijo)

Watch how the algorithm tries α, rejects it, tries smaller α,
until it finds one that gives sufficient decrease.
```

#### F) "Try This" (collapsed by default)
```
- Compare with fixed step: Enable ghost trajectory to see difference
- Set c₁ = 10⁻⁵ (very lenient): Accepts larger steps, fewer backtracks
- Set c₁ = 0.1 (strict): Demands more decrease, more backtracks
- Add data points: Watch line search adapt automatically
```

### 5.3 Collapsibility Strategy

**UI Pattern:**
```
▼ Why Gradient Descent?        [expanded - click to collapse]
  [full content visible]

▶ The Mathematics              [collapsed - click to expand]
```

**Default States:**
- "Why [Algorithm]?" → **Expanded** (context for first-time users)
- "The Algorithm" → **Expanded** (core content for reference while watching)
- "The Mathematics" → **Collapsed** (deep dive for those who want it)
- "What You're Seeing" → **Expanded** (helps interpret visualizations)
- "Try This" → **Collapsed** (exploration prompts, not essential)

**Persistence:**
- Save user's collapse/expand preferences in localStorage
- Settings: "Expand all" / "Collapse all" buttons

---

## 6. User Experience and Navigation

### 6.1 Tab-Level Information Architecture

Each tab follows consistent structure (top to bottom):

1. **Algorithm Title + Key Idea** (colored banner)
   - GD (Fixed): Green - "Follow the gradient downhill with constant step size"
   - GD (Line Search): Blue - "Follow the gradient downhill with adaptive step size"
   - Newton's Method: Purple - "Use curvature information for smarter steps"
   - L-BFGS: Amber - "Approximate curvature efficiently from history"

2. **"Why [Algorithm]?" Section** (pedagogical explanation)

3. **"The Algorithm" Section** (pseudocode/steps)

4. **Hyperparameter Controls + Navigation** (horizontal bar)
   - Algorithm-specific sliders
   - Reset / Previous / Next buttons
   - Keyboard shortcuts: ← → for navigation

5. **Current State Panel** (info box)
   - Iteration number, loss, gradient norm, weights, step size

6. **Visualizations** (canvas grid, 2-3 canvases depending on algorithm)

7. **"Try This" Section** (interactive prompts)

### 6.2 State Management

**Shared across all tabs:**
- Data points (base + custom additions)
- Regularization λ parameter
- The same optimization problem instance

**Per-tab state (independent):**
- Iteration history (trajectory for that algorithm)
- Current iteration index (can be at different steps in different tabs)
- Algorithm-specific hyperparameters:
  - GD (Fixed): α (step size)
  - GD (Line Search): c₁ (Armijo parameter)
  - Newton: c₁ (Armijo parameter)
  - L-BFGS: m (memory size), c₁ (Armijo parameter)

**Behavior:**
- Switching tabs preserves data and shared settings
- Each algorithm runs independently with its own iteration counter
- User can step through GD iteration 5, switch to Newton iteration 3, etc.

### 6.3 Keyboard Navigation

- `←` Previous iteration (within current tab)
- `→` Next iteration (within current tab)
- Tab switching via mouse/touch only (not keyboard, to avoid conflicts)

### 6.4 Responsive Behavior

- Canvas sizes adjust to viewport
- On mobile/narrow screens: stack canvases vertically
- Collapsible sections especially valuable on mobile to reduce scrolling

---

## 7. Implementation Priorities and Phases

### Phase 1: Core Gradient Descent Algorithms
- [ ] Implement `algorithms/gradient-descent.ts`
- [ ] Implement `algorithms/gradient-descent-linesearch.ts`
- [ ] Extract Armijo line search into `line-search/armijo.ts`
- [ ] Refactor Newton and L-BFGS to use shared line search

### Phase 2: Visualization for New Tabs
- [ ] Add GD (Fixed) parameter space canvas
- [ ] Add GD (Line Search) parameter space and line search canvases
- [ ] Ensure shared data space canvas works for all 4 tabs

### Phase 3: Pedagogical Content
- [ ] Write all pedagogical text sections for GD (Fixed)
- [ ] Write all pedagogical text sections for GD (Line Search)
- [ ] Implement collapsible section UI component
- [ ] Add localStorage persistence for collapse states

### Phase 4: Polish and UX
- [ ] Add status indicators ("Converged", "Oscillating", etc.)
- [ ] Add "Compare with fixed α" toggle for GD (Line Search) tab
- [ ] Responsive canvas sizing
- [ ] Keyboard navigation testing

### Phase 5: Future Enhancements (Not in Initial Implementation)
- [ ] Define and implement `OptimizationProblem` interface
- [ ] CSV/JSON dataset upload
- [ ] Additional line search strategies (Wolfe, Strong Wolfe)
- [ ] Cross-tab comparison mode (side-by-side view)
- [ ] Additional optimization problems (Rosenbrock, quadratic, etc.)

---

## 8. Testing and Validation

### User Testing Scenarios

**Scenario 1: Complete Beginner**
- User has never seen gradient descent before
- Should be able to read GD (Fixed) tab and understand basic concept
- Should be able to interact with α slider and see effects
- Should understand why line search is valuable after seeing Tab 2

**Scenario 2: Experienced ML Practitioner**
- User knows gradient descent conceptually but not implementation details
- Should be able to collapse "Why?" sections and focus on algorithm pseudocode
- Should learn specific details like Armijo condition, two-loop recursion
- Should be able to compare convergence behavior across methods

**Scenario 3: Researcher/Implementer**
- User wants to implement these algorithms themselves
- Should be able to expand "The Mathematics" sections
- Should see exact formulas and understand all steps
- Should be able to reference visualization while reading code

### Edge Cases to Handle

- **Non-convergence:** If gradient descent diverges (α too large), show clear warning
- **Max iterations:** If algorithm doesn't converge within maxIters, indicate "Not converged"
- **Empty data:** Handle case where user clears all custom points (fall back to base data)
- **Numerical stability:** Very small/large losses should format nicely (scientific notation)

### Performance Considerations

- Fixed-step GD may need 50-100 iterations vs Newton's 15
- Pre-compute all iterations on parameter change (current approach works)
- Canvas rendering is fast enough for real-time updates
- Consider web workers if adding heavy problems in future

---

## 9. Open Questions and Future Considerations

### Resolved in Design
- ✅ How many tabs? → 4 tabs (GD Fixed, GD Line Search, Newton, L-BFGS)
- ✅ Which line search? → Armijo for now, architecture supports swapping later
- ✅ Level of math detail? → High detail, but collapsible for accessibility
- ✅ Mobile support? → Yes, via collapsible sections and responsive canvases

### Future Enhancements
- **Problem swapping:** Architecture designed for it, implement when ready
  - Candidate problems: Rosenbrock (2D), Quadratic bowl, Simple neural net
- **Line search variants:** Wolfe conditions, Strong Wolfe, More-Thuente
- **Comparison mode:** Side-by-side algorithm comparison on same data
- **Dataset upload:** CSV/JSON for custom 2D datasets
- **Animation mode:** Auto-play through iterations with speed control
- **Export:** Download trajectory data, save/load problem instances

### Known Limitations
- 2D/3D visualization limits problem complexity (by design for clarity)
- Can't fully demonstrate "curse of dimensionality" in low dimensions
- Armijo line search is simpler than production implementations (pedagogical choice)

---

## 10. Success Criteria

Implementation is successful if:

1. ✅ **Pedagogical clarity:** Users with linear algebra background but no optimization knowledge can understand gradient descent from Tab 1
2. ✅ **Progressive complexity:** Each tab builds naturally on the previous, with clear motivation
3. ✅ **Implementation detail:** Experienced practitioners can reference this as implementation guide
4. ✅ **Visual insight:** Visualizations make abstract concepts concrete (e.g., line search, Hessian curvature)
5. ✅ **Extensibility:** Code architecture supports future enhancements without major refactoring
6. ✅ **Interactivity:** Users can experiment with hyperparameters and see immediate effects
7. ✅ **Accessibility:** Collapsible sections allow both novice and expert users to find appropriate detail level

---

## Appendix: Color Scheme and Visual Design

**Tab Colors:**
- GD (Fixed): `bg-green-100` to `bg-green-50` (green banner)
- GD (Line Search): `bg-blue-100` to `bg-blue-50` (blue banner)
- Newton: `bg-purple-100` to `bg-purple-50` (purple banner, existing)
- L-BFGS: `bg-yellow-100` to `bg-yellow-50` (amber banner, existing)

**Visualization Colors:**
- Loss landscape: Blue gradient (dark = high loss, light = low loss)
- Trajectory path: Orange (`#f97316`)
- Current position: Red (`#dc2626`)
- Decision boundary: Green (`#10b981`)
- Line search accepted: Green (`#10b981`)
- Line search rejected: Red (`#dc2626`)
- Armijo boundary: Orange dashed (`#f97316`)

**Status Indicators:**
- Converged: Green badge
- Oscillating: Yellow badge
- Diverging: Red badge
- In progress: Blue badge

---

**End of Design Document**
