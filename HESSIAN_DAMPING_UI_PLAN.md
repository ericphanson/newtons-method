# Implementation Plan: Hessian Damping UI Integration

## Overview
Add UI controls and pedagogical explanations for Newton's method Hessian damping parameter (Levenberg-Marquardt style regularization).

## Background
- **Algorithm change:** Newton's method now supports `hessianDamping` parameter (default: 0.01)
- **Implementation:** `src/algorithms/newton.ts:159` - applies `H_damped = H + λ*I`
- **Purpose:** Prevents numerical instability when Hessian has tiny eigenvalues
- **Example:** Perceptron with λ=0.0001 → Hessian eigenvalues = 0.0001 → huge Newton steps

## Tasks

### Task 1: Add State Management in UnifiedVisualizer

**File:** `src/UnifiedVisualizer.tsx`

**What to do:**
1. Add state variable near line 65 (near other algorithm parameters):
   ```typescript
   const [newtonHessianDamping, setNewtonHessianDamping] = useState(0.01);
   ```

2. Thread parameter through to all `runNewton()` calls (search for "runNewton" in file):
   - Add `hessianDamping: newtonHessianDamping` to options object
   - Should be ~3-4 locations total

**Verification:**
- TypeScript compiles without errors
- App still runs
- Newton's method still works with default damping (0.01)

**Files changed:** `src/UnifiedVisualizer.tsx`

---

### Task 2: Add UI Slider Control

**File:** `src/UnifiedVisualizer.tsx`

**What to do:**
1. Find the Newton algorithm configuration section (look for c1 parameter UI)
2. Add slider control for Hessian damping after c1 control
3. Use similar pattern to existing parameter controls:
   ```tsx
   <div>
     <label>Hessian Damping (λ_damp): {newtonHessianDamping.toExponential(2)}</label>
     <input
       type="range"
       min={Math.log10(0.0001)}
       max={Math.log10(1)}
       step="0.01"
       value={Math.log10(newtonHessianDamping)}
       onChange={(e) => setNewtonHessianDamping(Math.pow(10, parseFloat(e.target.value)))}
     />
     <small>Range: 0.0001 to 1.0 (logarithmic scale)</small>
   </div>
   ```

**Design notes:**
- Use logarithmic scale (like lambda parameter)
- Show value in scientific notation
- Place near c1 parameter (they're both Newton-specific)
- Only show when Newton algorithm is selected

**Verification:**
- Slider appears in UI when Newton is selected
- Moving slider updates value display
- Value is passed to runNewton correctly
- UI is visually consistent with existing controls

**Files changed:** `src/UnifiedVisualizer.tsx`

---

### Task 3: Add Pedagogical Explanation in AlgorithmExplainer

**File:** `src/components/AlgorithmExplainer.tsx`

**What to do:**
1. Find the Newton's method section (search for "Newton's Method" or "Second-order")
2. Add explanation of Hessian damping in the Newton section
3. Include:
   - What it does: `H_damped = H + λ_damp * I`
   - Why it helps: Prevents huge steps when Hessian has tiny eigenvalues
   - Connection to Levenberg-Marquardt
   - Trade-off: stability vs. faithfulness to original problem
   - Example: Perceptron with tiny regularization

**Suggested content:**
```tsx
<div className="mt-3">
  <p className="font-semibold">Hessian Damping (Levenberg-Marquardt):</p>
  <BlockMath>{'H_{\\text{damped}} = H + \\lambda_{\\text{damp}} \\cdot I'}</BlockMath>
  <ul className="list-disc ml-6 space-y-1 text-sm">
    <li>Adds regularization to Hessian for numerical stability</li>
    <li>Prevents huge Newton steps when H has tiny eigenvalues</li>
    <li>Example: Perceptron with λ=0.0001 → Hessian eigenvalues = 0.0001 → direction ~10000×gradient!</li>
    <li>Trade-off: Lower λ_damp = more faithful to problem but less stable; Higher = more stable but adds implicit regularization</li>
    <li>When λ_damp = 0: pure Newton; as λ_damp → ∞: approaches gradient descent</li>
  </ul>
</div>
```

**Verification:**
- Explanation appears in Newton section
- LaTeX renders correctly
- Content is pedagogically clear
- Visually consistent with other explanations

**Files changed:** `src/components/AlgorithmExplainer.tsx`

---

### Task 4: Add Contextual Help/Tooltip (Optional Enhancement)

**File:** `src/UnifiedVisualizer.tsx`

**What to do:**
1. Add tooltip or help text near the slider
2. Show brief explanation when user hovers
3. Link to full explanation in AlgorithmExplainer

**Suggested content:**
```tsx
<small className="text-gray-600">
  💡 Tip: Use λ_damp = 0.0001 for pure Newton, 0.01 for stability (default), 0.1+ for very ill-conditioned problems
</small>
```

**Verification:**
- Help text is visible and clear
- Doesn't clutter the UI
- Provides useful guidance

**Files changed:** `src/UnifiedVisualizer.tsx`

---

## Success Criteria

- [ ] Hessian damping parameter is configurable via UI slider
- [ ] Default value is 0.01 (matches algorithm default)
- [ ] Parameter is passed correctly to all runNewton() calls
- [ ] Slider uses logarithmic scale (0.0001 to 1.0)
- [ ] Pedagogical explanation is clear and accurate
- [ ] UI is visually consistent with existing controls
- [ ] TypeScript compiles without errors
- [ ] App runs without errors
- [ ] Perceptron with Newton converges properly with different damping values

## Testing Plan

1. **Functional test:**
   - Select Perceptron problem
   - Select Newton algorithm
   - Set λ=0.0001 (tiny regularization)
   - Adjust Hessian damping slider:
     - λ_damp=0.0001: Should see slow/unstable convergence
     - λ_damp=0.01: Should converge in ~2 iterations
     - λ_damp=0.1: Should still converge, maybe slightly slower

2. **UI test:**
   - Slider appears only for Newton
   - Value display updates correctly
   - Logarithmic scale works smoothly
   - Explanation is readable and helpful

3. **Regression test:**
   - Other problems still work (quadratic, Rosenbrock, etc.)
   - Other algorithms unaffected (L-BFGS, GD)
   - Existing functionality preserved

## Implementation Notes

- Keep Hessian functions mathematically pure (no damping in problem code)
- Damping is applied in Newton algorithm only
- This is a general algorithmic choice, not problem-specific
- Parameter should be clearly labeled as algorithmic (not problem parameter like λ)
