# L-BFGS Approximate Hessian: Eigenvalue Evolution Visualization

**Date:** 2025-11-11
**Status:** Design Proposal
**Context:** Enhancing the L-BFGS "Approximate Hessian Comparison (2D Visualization)" section

---

## Current State

The existing L-BFGS visualization shows a **snapshot comparison** at the current iteration:

- **True Hessian H** (if available from `problem.hessian()`)
  - 2×2 matrix with eigenvalues λ₁, λ₂
- **Approximate Hessian B** (reconstructed via two-loop recursion)
  - 2×2 matrix with eigenvalues λ₁, λ₂
- **Approximation Error**
  - Single Frobenius error value: `||H - B||_F / ||H||_F`

**Limitation:** Users can't see how the approximation quality evolves over iterations as L-BFGS builds its memory.

---

## Proposed Enhancement: Eigenvalue Evolution Over Iterations

### Core Idea

Show **time-series visualizations** of eigenvalue metrics across all iterations to reveal:

1. How L-BFGS's approximate Hessian eigenvalues converge to the true Hessian eigenvalues
2. When the approximation quality improves (after adding good curvature pairs)
3. Impact of memory size M and damping parameter λ on approximation quality
4. Condition number evolution (how well-scaled the approximate Hessian is)

---

## Data Availability

**Good news:** All necessary data is already computed and stored in `LBFGSIteration.hessianComparison`:

```typescript
interface HessianComparison {
  trueHessian: number[][] | null;
  approximateHessian: number[][];
  trueEigenvalues: { lambda1: number; lambda2: number } | null;
  approximateEigenvalues: { lambda1: number; lambda2: number };
  frobeniusError: number | null;
}
```

**History arrays** can be extracted from iterations:
```typescript
const lambda1TrueHistory = iterations.map(iter =>
  iter.hessianComparison?.trueEigenvalues?.lambda1 ?? null
).filter(v => v !== null);

const lambda1ApproxHistory = iterations.map(iter =>
  iter.hessianComparison?.approximateEigenvalues?.lambda1 ?? 0
);

// Same for lambda2, condition number, Frobenius error
```

---

## Design Options

### Option A: Compact Sparklines (Recommended)

**Layout:** Add sparkline metrics **above** the current matrix display

**Pros:**
- Minimal space usage
- Consistent with existing `IterationMetrics` pattern
- Interactive (click to jump to iteration)
- Easy to scan multiple metrics at once

**Mockup Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Eigenvalue Evolution                                        │
│  ┌─────────────────────┬─────────────────────┐             │
│  │ λ₁ (True):  0.088   │ λ₁ (Approx): 0.089  │             │
│  │ [sparkline chart]   │ [sparkline chart]   │             │
│  └─────────────────────┴─────────────────────┘             │
│  ┌─────────────────────┬─────────────────────┐             │
│  │ λ₂ (True):  0.0018  │ λ₂ (Approx): 0.0019 │             │
│  │ [sparkline chart]   │ [sparkline chart]   │             │
│  └─────────────────────┴─────────────────────┘             │
│                                                              │
│  Derived Metrics                                             │
│  ┌──────────────────────────────────────────┐              │
│  │ λ_min (Approx): 0.0019                    │              │
│  │ [sparkline showing min eigenvalue]        │              │
│  └──────────────────────────────────────────┘              │
│  ┌──────────────────────────────────────────┐              │
│  │ Condition Number κ(B): 47.1               │              │
│  │ [sparkline showing κ = λ_max/λ_min]       │              │
│  └──────────────────────────────────────────┘              │
│  ┌──────────────────────────────────────────┐              │
│  │ Relative Frobenius Error: 1.8%            │              │
│  │ [sparkline showing error over iterations] │              │
│  │ Threshold: --- (good approximation <5%)   │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘

[Current 2×2 matrix display and eigenvalues remain below]
```

**Key Features:**
- **Color coding:**
  - True eigenvalues: Purple (#9333ea)
  - Approximate eigenvalues: Amber (#f59e0b)
  - Condition number: Blue (#3b82f6)
  - Frobenius error: Red (#ef4444) when high, Green (#10b981) when <5%

- **Thresholds:**
  - Add dashed line at 5% for Frobenius error (acceptable approximation)
  - Visual cue when λ_min approaches zero (ill-conditioning warning)

- **Interactive:**
  - Click any sparkline to jump to that iteration
  - Hover to see exact values (optional enhancement)

---

### Option B: Dual Comparison Chart

**Layout:** Side-by-side full-sized line charts showing true vs approximate

**Pros:**
- More detailed visualization
- Easier to see convergence patterns
- Can show confidence bands or shaded regions

**Cons:**
- Takes significant vertical space
- May overwhelm pedagogical focus on 2D matrices

**Mockup Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Eigenvalue Convergence Over Iterations                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 0.10 ┤                   ╭─────────── λ₁ (True)      │  │
│  │      │              ╭────╯                           │  │
│  │ 0.08 ┤         ╭────╯     ········· λ₁ (Approx)     │  │
│  │      │    ╭····╯                                     │  │
│  │ 0.06 ┤╭───╯                                          │  │
│  │      ├─────────────────────────────────────────────> │  │
│  │      0    5    10   15   20   25   30  (iterations)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 0.004┤                                                │  │
│  │      │                    ╭──── λ₂ (True)            │  │
│  │ 0.002┤           ╭────────╯                          │  │
│  │      │      ╭····╯        ····· λ₂ (Approx)         │  │
│  │ 0.000┤──────╯                                        │  │
│  │      ├─────────────────────────────────────────────> │  │
│  │      0    5    10   15   20   25   30  (iterations)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### Option C: Integrated "Metrics Dashboard"

**Layout:** Expand the entire section into a dashboard with tabs/collapsible panels

**Structure:**
- Tab 1: "Current Snapshot" (existing 2×2 matrix view)
- Tab 2: "Eigenvalue Evolution" (sparklines or charts)
- Tab 3: "Approximation Error Metrics"

**Pros:**
- Clean separation of concerns
- Users can focus on what they need
- Extensible for future metrics

**Cons:**
- Requires more navigation (tabs/clicks)
- May hide important insights

---

## Recommended Metrics to Visualize

### 1. Individual Eigenvalues
- **λ₁ (largest eigenvalue):** Shows dominant curvature direction
- **λ₂ (smallest eigenvalue):** Critical for conditioning

**Insight:** Watch λ₂ approach zero → ill-conditioned problem

---

### 2. λ_min Evolution (Critical!)
- **Formula:** `λ_min = min(λ₁, λ₂)`
- **Why it matters:**
  - Small λ_min → ill-conditioned Hessian
  - Near-zero λ_min → nearly singular (optimization struggles)
  - Compare true vs approximate λ_min

**Insight:** If approximate λ_min stays bounded away from zero even when true λ_min is tiny, the damping parameter is helping!

---

### 3. Condition Number κ
- **Formula:** `κ(B) = λ_max / λ_min`
- **Interpretation:**
  - κ = 1 → perfectly conditioned (isotropic)
  - κ > 100 → ill-conditioned
  - κ → ∞ → singular

**Insight:** Show how L-BFGS's approximate Hessian conditioning compares to true Hessian conditioning. Damping parameter should keep κ(B) bounded.

---

### 4. Relative Frobenius Error (Already computed!)
- **Formula:** `||H - B||_F / ||H||_F`
- **Threshold:** <5% is good, <1% is excellent

**Insight:** Watch error decrease as L-BFGS accumulates memory pairs. Expect improvement after each accepted curvature pair.

---

### 5. Eigenvalue Ratio
- **Formula:** `λ₂ / λ₁` (ratio of smallest to largest)
- **Interpretation:** Closer to 1 → more isotropic

**Insight:** Shows how "stretched" the loss landscape is in different directions.

---

## Implementation Strategy

### Phase 1: Minimal Viable Enhancement (1-2 hours)
Add 3 sparkline metrics above the existing matrix display:
1. λ_min comparison (true vs approx)
2. Condition number κ(B)
3. Frobenius error

**File changes:**
- [LbfgsTab.tsx:283-377](src/components/tabs/LbfgsTab.tsx#L283-L377): Add sparklines before matrix grid
- No algorithm changes (data already available!)

---

### Phase 2: Full Eigenvalue Visualization (3-4 hours)
Add all 4 eigenvalue sparklines (λ₁_true, λ₁_approx, λ₂_true, λ₂_approx)

**Layout:**
- 2×2 grid of sparklines matching the 2×2 matrix structure
- Visual symmetry reinforces the pedagogical connection

---

### Phase 3: Advanced Features (optional)
- Hover tooltips showing exact values
- Shaded regions indicating "good approximation" zones
- Annotations marking when curvature pairs were accepted/rejected
- Comparison view: overlay true and approximate eigenvalues on same chart

---

## Visual Design Notes

### Color Palette
- **True Hessian metrics:** Purple shades (#9333ea, #a855f7)
- **Approximate Hessian metrics:** Amber shades (#f59e0b, #fbbf24)
- **Error/Quality metrics:**
  - Red (#ef4444) when error >5%
  - Yellow (#eab308) when 2% < error ≤ 5%
  - Green (#10b981) when error ≤ 2%
- **Neutral metrics (condition number):** Blue (#3b82f6)

### Typography
- **Metric labels:** `text-gray-600 text-xs`
- **Current values:** `font-mono font-bold`
- **Eigenvalue subscripts:** Use `<InlineMath>` for proper λ₁, λ₂ rendering

### Spacing
- Use existing `space-y-4` pattern for consistency
- Grid layout: `grid grid-cols-2 gap-4` for paired sparklines

---

## Educational Value

### Key Insights Users Will Discover

1. **Memory Matters:** Watch approximation improve as M increases (compare experiments with M=3 vs M=10)

2. **Damping Effect:** See how λ_damp keeps condition number bounded even when true Hessian is ill-conditioned

3. **Curvature Acceptance:** Correlate Frobenius error drops with accepted curvature pairs (visible in Memory table)

4. **Early Iterations:** Approximation starts poor (using only scaled identity), improves as pairs accumulate

5. **Convergence:** Near optimum, eigenvalues stabilize and error plateaus (or increases if landscape changes)

---

## Open Questions

### Q1: Should we show both algorithms' eigenvalues?
**Context:** The user mentioned "for both algos" — this could mean:
- Compare L-BFGS vs Newton (both compute Hessians differently)
- Compare L-BFGS vs Gradient Descent (only LBFGS has eigenvalues)
- Compare different L-BFGS configurations (M=5 vs M=10)

**Recommendation:** Start with L-BFGS alone. If comparing algorithms:
- Add Newton's true Hessian eigenvalues as baseline (already computed)
- Cross-link to Newton tab for side-by-side comparison

---

### Q2: What about higher dimensions (n > 2)?
**Current limitation:** Hessian reconstruction only works in 2D (as noted in yellow warning box)

**Future extension:** For higher dimensions, we could:
- Show only the top-2 and bottom-2 eigenvalues (using Lanczos/Arnoldi)
- Show condition number estimate (||B|| / ||B⁻¹|| via power iteration)
- Note: This requires modifying the algorithm to not fully reconstruct B

**Recommendation:** Keep 2D focus for now (pedagogical clarity)

---

### Q3: Mobile/responsive design?
**Current sparklines:** Already responsive via SVG `viewBox` + `preserveAspectRatio`

**Recommendation:**
- Desktop: 2×2 grid for paired eigenvalues
- Mobile: Stack vertically (auto via Tailwind grid)

---

## References

### Existing Patterns in Codebase

1. **SparklineMetric component** ([SparklineMetric.tsx](src/components/SparklineMetric.tsx))
   - Already supports thresholds, colors, interactive click
   - Props: `label`, `value`, `data`, `currentIndex`, `thresholds`, `strokeColor`, `onPointSelect`

2. **IterationMetrics sparklines** ([IterationMetrics.tsx:169-220](src/components/IterationMetrics.tsx#L169-L220))
   - Examples: Grad Norm, Loss, Step Size α, Relative Function Change
   - Pattern: `data={historyArray}`, `currentIndex={iterNum}`

3. **Newton tab eigenvalue display** (if exists)
   - Check for existing eigenvalue visualization patterns

---

## Success Metrics

### User Understanding
- Users can identify when approximation quality improves
- Users can correlate memory size M with approximation accuracy
- Users can see damping parameter's effect on conditioning

### Implementation
- Zero algorithm changes (use existing data)
- Minimal component additions (reuse SparklineMetric)
- Performance: No measurable impact (data already computed)

---

## Next Steps

1. **Validate design with stakeholder**
   - Which option (A/B/C)?
   - Which metrics are most valuable?
   - Clarify "both algos" requirement

2. **Prototype Phase 1**
   - Add 3 sparklines (λ_min, κ, error)
   - Test with existing experiments

3. **Gather feedback**
   - Does it help understanding?
   - Too cluttered or just right?

4. **Iterate**
   - Add more metrics if needed
   - Refine color scheme and layout

---

## Appendix: Code Snippets

### Extract History Arrays
```typescript
// In LbfgsTab.tsx, before rendering:
const hessianMetrics = React.useMemo(() => {
  if (!iterations || iterations.length === 0) return null;

  return {
    lambda1True: iterations.map(iter =>
      iter.hessianComparison?.trueEigenvalues?.lambda1 ?? null
    ),
    lambda1Approx: iterations.map(iter =>
      iter.hessianComparison?.approximateEigenvalues?.lambda1 ?? 0
    ),
    lambda2True: iterations.map(iter =>
      iter.hessianComparison?.trueEigenvalues?.lambda2 ?? null
    ),
    lambda2Approx: iterations.map(iter =>
      iter.hessianComparison?.approximateEigenvalues?.lambda2 ?? 0
    ),
    frobeniusError: iterations.map(iter =>
      iter.hessianComparison?.frobeniusError ?? null
    ),
    conditionNumber: iterations.map(iter => {
      const eigs = iter.hessianComparison?.approximateEigenvalues;
      if (!eigs) return null;
      const lambdaMax = Math.max(eigs.lambda1, eigs.lambda2);
      const lambdaMin = Math.min(eigs.lambda1, eigs.lambda2);
      return lambdaMin > 1e-12 ? lambdaMax / lambdaMin : null;
    }),
  };
}, [iterations]);
```

### Render Sparklines
```tsx
{hessianMetrics && (
  <div className="space-y-3 mb-4">
    <h3 className="text-lg font-bold text-purple-900">
      Eigenvalue Evolution
    </h3>

    <div className="grid grid-cols-2 gap-4">
      <SparklineMetric
        label={<InlineMath>{"\\lambda_1 \\text{ (True)}"}</InlineMath>}
        value={fmt(iterations[currentIter].hessianComparison?.trueEigenvalues?.lambda1 ?? 0)}
        data={hessianMetrics.lambda1True.filter(v => v !== null)}
        currentIndex={currentIter}
        strokeColor="#9333ea"
        onPointSelect={onIterChange}
      />

      <SparklineMetric
        label={<InlineMath>{"\\lambda_1 \\text{ (Approx)}"}</InlineMath>}
        value={fmt(iterations[currentIter].hessianComparison?.approximateEigenvalues?.lambda1 ?? 0)}
        data={hessianMetrics.lambda1Approx}
        currentIndex={currentIter}
        strokeColor="#f59e0b"
        onPointSelect={onIterChange}
      />
    </div>

    <SparklineMetric
      label="Condition Number κ(B):"
      value={fmt(hessianMetrics.conditionNumber[currentIter] ?? 0)}
      data={hessianMetrics.conditionNumber.filter(v => v !== null)}
      currentIndex={currentIter}
      strokeColor="#3b82f6"
      thresholds={[
        { value: 100, color: '#f59e0b', opacity: 0.5 }  // Warning threshold
      ]}
      onPointSelect={onIterChange}
    />

    <SparklineMetric
      label="Relative Frobenius Error:"
      value={`${(hessianMetrics.frobeniusError[currentIter] ?? 0).toFixed(1)}%`}
      data={hessianMetrics.frobeniusError.filter(v => v !== null)}
      currentIndex={currentIter}
      strokeColor="#ef4444"
      thresholds={[
        { value: 5, color: '#10b981', opacity: 0.6 }  // Good approximation threshold
      ]}
      onPointSelect={onIterChange}
    />
  </div>
)}
```

---

## Conclusion

**Recommendation:** Implement **Option A (Compact Sparklines)** starting with Phase 1 (minimal 3 metrics).

This provides maximum insight with minimal disruption to the existing pedagogical flow. The sparkline pattern is already proven in the codebase (IterationMetrics), and all necessary data is already computed.

**Timeline:**
- Phase 1: ~2 hours (ready for user testing)
- Phase 2: +2 hours (full eigenvalue visualization)
- Phase 3: +2-4 hours (polish and advanced features)

**ROI:** High — significant educational value for minimal implementation cost.
