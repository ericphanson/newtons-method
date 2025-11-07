# Hessian Damping UI Enhancements Plan

## Overview
Additional improvements to the Hessian damping UI based on user feedback.

## Tasks

### Task 5: Update Newton Quick Start Section

**File:** `src/UnifiedVisualizer.tsx` (Newton algorithm section)

**What to do:**
1. Find the "Quick Start" section for Newton's method in the ProblemExplainer
2. Add guidance about the Hessian damping parameter
3. Mention default value (0.01) and when to adjust it

**Suggested addition:**
```
- **Hessian Damping (λ_damp):** Keep at 0.01 (default) for most problems.
  Lower to 0 for pure Newton's method, increase to 0.1+ for very ill-conditioned problems.
```

### Task 6: Update Mathematical Derivations Section

**File:** `src/UnifiedVisualizer.tsx` (Newton algorithm section)

**What to do:**
1. Find the "Mathematical Derivations" section for Newton's method
2. Add the damped Hessian formula
3. Show how it interpolates between Newton and gradient descent

**Suggested addition:**
```
**With Hessian Damping:**

H_damped = H + λ_damp · I

The Newton direction becomes:
p = -(H + λ_damp · I)^(-1) ∇f

This interpolates between:
- λ_damp = 0: Pure Newton's method
- λ_damp → ∞: Approaches gradient descent (p ≈ -∇f / λ_damp)
```

### Task 7: Allow Damping to Go to 0

**File:** `src/components/AlgorithmConfiguration.tsx`

**What to do:**
1. Change slider minimum from `Math.log10(0.0001)` to allow 0
2. Handle the special case of log10(0) = -∞
3. Use a very small value (e.g., 1e-10) as practical minimum instead of 0
4. Update range label to show "0 to 1.0" or "~0 to 1.0"

**Implementation approach:**
```typescript
// Use 1e-10 as practical minimum (essentially zero)
min={Math.log10(1e-10)}  // = -10
max={Math.log10(1)}      // = 0
```

Update help text:
```
Regularization for numerical stability (~0 to 1.0, logarithmic scale)
```

### Task 8: Add "When Things Go Wrong" for Perceptron Without Damping

**File:** `src/UnifiedVisualizer.tsx` (Newton algorithm section)

**What to do:**
1. Find or create a "When Things Go Wrong" section for Newton's method
2. Add a specific subsection about Perceptron convergence issues
3. Include:
   - Problem description: Perceptron with tiny λ causes Hessian with tiny eigenvalues
   - Symptom: Newton takes huge steps, line search uses tiny alphas, slow/no convergence
   - Solution: Increase Hessian damping to 0.01 or higher
   - Example configuration to reproduce the issue

**Suggested content:**
```markdown
### Problem: Perceptron Won't Converge with Newton

**Setup to reproduce:**
1. Select "Separating Hyperplane" problem
2. Choose "Perceptron" variant
3. Set λ (regularization) = 0.0001
4. Set Hessian Damping (λ_damp) = 0
5. Run Newton's method

**What happens:**
- Hessian has tiny eigenvalues (≈ 0.0001)
- Newton direction becomes huge (~10,000× gradient magnitude)
- Line search forced to use tiny step sizes (α ≈ 0.0002)
- Oscillates without converging

**Why it happens:**
Perceptron's loss (max(0, -y·z)) is piecewise linear, so its Hessian is 0.
Only the regularization contributes: H = λ·I.
When λ is tiny (0.0001), the Hessian becomes nearly singular.

**Solution:**
Increase Hessian Damping to 0.01 or higher. This adds numerical stability
without significantly changing the optimization problem.

**Result with λ_damp = 0.01:**
- Convergence in ~2 iterations
- All points classified correctly
```

## Success Criteria

- [ ] Quick Start mentions Hessian damping with practical guidance
- [ ] Mathematical Derivations shows damped Hessian formula
- [ ] Slider allows damping to go to ~0 (1e-10 minimum)
- [ ] Range label updated to show ~0 to 1.0
- [ ] "When Things Go Wrong" section exists for Perceptron issue
- [ ] Includes setup to reproduce, symptoms, explanation, and solution
- [ ] All changes compile without errors
- [ ] Content is pedagogically clear and accurate
