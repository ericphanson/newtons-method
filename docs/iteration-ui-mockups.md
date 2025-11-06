# Iteration UI Design Mockups

## Current Issues Identified

### Visual Problems
- **Cramped 2x2 grid:** All metrics treated equally, no visual hierarchy
- **No convergence context:** Users don't know if the algorithm is converging well or struggling
- **Missing pedagogical guidance:** No explanation of why metrics matter
- **No progress indicators:** Hard to gauge overall convergence status at a glance

### Information Architecture Issues
- **Flat structure:** All data shown at once, overwhelming for beginners
- **No differentiation:** Primary convergence metrics (gradient norm) not distinguished from secondary metrics (weights)
- **Algorithm-specific features underutilized:** Eigenvalues, condition number, line search details buried in separate canvases

### Available Data
- **Core metrics:** Loss, Gradient norm, Weights, Step size α
- **Newton-specific:** Hessian eigenvalues, condition number
- **Line search algorithms:** Trial data, Armijo condition values
- **L-BFGS:** Memory buffer, two-loop recursion details

---

## Approach 1: Convergence-First Dashboard

**Philosophy:** Gradient norm is the convergence metric—make it the hero. Use visual design to show progress at a glance.

```
╔══════════════════════════════════════════════════════════════════╗
║                    ITERATION 1 / 300                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─────────────────── CONVERGENCE ───────────────────┐         ║
║  │                                                     │         ║
║  │  Gradient Norm: 200.010000      [●●●●●●●●○○] 80%  │         ║
║  │                                  ^                 │         ║
║  │  Target: < 0.000001              └─ Far from goal  │         ║
║  │                                                     │         ║
║  │  Status: ⚠️  Needs ~280 more iterations            │         ║
║  │                                                     │         ║
║  └─────────────────────────────────────────────────────┘         ║
║                                                                  ║
║  ┌──────────────── PRIMARY METRICS ─────────────────┐           ║
║  │                                                   │           ║
║  │  Loss:  65.219238      ↓ -12.4 from last iter    │           ║
║  │  Step:   0.015625      ↓ Decreased (line search) │           ║
║  │                                                   │           ║
║  └───────────────────────────────────────────────────┘           ║
║                                                                  ║
║  ┌────────────────── PARAMETERS ───────────────────┐            ║
║  │                                                  │            ║
║  │  w₀ = 1.1250    →  Δw₀ = -0.0234                │            ║
║  │  w₁ = 1.9688    →  Δw₁ = +0.0891                │            ║
║  │                                                  │            ║
║  └──────────────────────────────────────────────────┘            ║
║                                                                  ║
║  [Advanced Details ▼]                                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Key Features
- **Gradient norm prominent:** Large text, progress bar showing distance to tolerance
- **Contextual status:** "Needs ~280 more iterations" helps set expectations
- **Trend indicators:** ↓↑→ arrows show whether metrics are improving
- **Expandable advanced section:** Progressive disclosure for algorithm-specific details
- **Visual hierarchy:** Convergence > Primary metrics > Parameters

### Pedagogical Benefits
- Beginners immediately understand convergence progress
- Clear visual feedback on whether algorithm is working
- Trend arrows teach that we want loss ↓ and gradient norm ↓
- Estimated iterations remaining helps manage expectations

---

## Approach 2: Metric Cards with Educational Context

**Philosophy:** Each metric is a "card" with inline explanation. Help users learn while they explore.

```
╔══════════════════════════════════════════════════════════════════╗
║  Iteration 1 / 300                         [Prev] [Play] [Next]  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ 📉 LOSS: 65.219238                                         ┃  ║
║  ┃                                                            ┃  ║
║  ┃ The objective function we're trying to minimize.          ┃  ║
║  ┃ Decreasing = good progress                                ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Trend: ✓ Decreasing steadily    Δ = -12.4                 ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                  ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ 🎯 GRADIENT NORM: 200.010000                  ⚠️ HIGH      ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Measures how steep the loss landscape is here.            ┃  ║
║  ┃ When < 0.000001, we've reached a critical point.          ┃  ║
║  ┃                                                            ┃  ║
║  ┃ [████████████████████░░░░░░░░░░░░░░] 80% to convergence   ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                  ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ 📍 PARAMETERS: [1.1250, 1.9688]                           ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Current location in the parameter space.                  ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Movement this iteration: [-0.0234, +0.0891]               ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                  ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ ⚙️  STEP SIZE α: 0.015625                                  ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Learning rate used for this iteration.                    ┃  ║
║  ┃ Smaller steps = safer but slower                          ┃  ║
║  ┃                                                            ┃  ║
║  ┃ Line search used 3 trials to find this value              ┃  ║
║  ┃ [View line search details →]                              ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Key Features
- **Educational tooltips:** Each metric explains what it means and why it matters
- **Status indicators:** ✓ ⚠️ ⚡ give quick visual feedback
- **Expandable links:** "View line search details" for deeper exploration
- **Visual card separation:** Clear boundaries between different types of information
- **Emoji icons:** Help with quick scanning and visual memory

### Pedagogical Benefits
- **Self-documenting:** Users learn optimization concepts while exploring
- **Progressive depth:** Can skim status icons or read full explanations
- **Actionable guidance:** "When X happens, it means Y"
- **Contextual learning:** Explanations appear right next to the data

---

## Approach 3: Side-by-Side Comparison View

**Philosophy:** Show current vs. previous iteration to highlight progress/regression. Emphasize the iterative nature.

```
╔══════════════════════════════════════════════════════════════════╗
║                         ITERATION 1 → 2                          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Previous (Iter 1)              Current (Iter 2)               ║
║   ════════════════               ═════════════════               ║
║                                                                  ║
║   Loss: 77.643                   Loss: 65.219  ✓                ║
║   ├─ Reduced by: 12.424 (-16.0%)                                ║
║   └─ Good progress!                                              ║
║                                                                  ║
║   Gradient: 245.892              Gradient: 200.010  ✓           ║
║   ├─ Reduced by: 45.882 (-18.7%)                                ║
║   └─ Still far from convergence (target: < 0.000001)            ║
║                                                                  ║
║   Position: [1.148, 1.880]       Position: [1.125, 1.969]       ║
║   ├─ Moved: [-0.023, +0.089]                                    ║
║   └─ Distance traveled: 0.0919                                  ║
║                                                                  ║
║   Step size: 0.03125             Step size: 0.015625            ║
║   └─ Decreased by 50% (line search backtracking)                ║
║                                                                  ║
║   ┌────────────────────────────────────────────────────────┐    ║
║   │  CONVERGENCE TRAJECTORY (Last 10 Iterations)           │    ║
║   │                                                         │    ║
║   │  Gradient Norm:                                         │    ║
║   │  300 ┤                                                  │    ║
║   │  250 ┤ ●                                                │    ║
║   │  200 ┤   ●  ← Current                                   │    ║
║   │  150 ┤                                                  │    ║
║   │  100 ┤                                                  │    ║
║   │   50 ┤                                                  │    ║
║   │    0 ┤─────────────────────────────────────────────     │    ║
║   │      0   1   2   3   4   5   6   7   8   9  10         │    ║
║   │                                                         │    ║
║   │  Convergence Rate: ~18.7% per iteration (linear)       │    ║
║   │  Estimated iterations to convergence: ~274             │    ║
║   └────────────────────────────────────────────────────────┘    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Key Features
- **Before/after comparison:** Directly shows the effect of each iteration step
- **Delta calculations:** Shows absolute and percentage changes
- **Mini trajectory plot:** Visual context for convergence rate
- **Estimated completion:** Extrapolates based on recent progress
- **Narrative structure:** Tells a story of optimization progress

### Pedagogical Benefits
- **Iteration concept reinforced:** Shows that optimization is iterative improvement
- **Change visibility:** Makes small improvements visible and meaningful
- **Trend analysis:** Mini plot shows whether convergence is accelerating/slowing
- **Prediction skills:** Estimated iterations helps develop intuition

---

## Approach 4: Compact "Dashboard Gauge" Style

**Philosophy:** Maximum information density with visual gauges. Good for experts who want to monitor many metrics at once.

```
╔══════════════════════════════════════════════════════════════════╗
║  Iteration: [  1  /  300  ] ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░ (80%) ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─── Loss ─────┐  ┌─ Convergence ─┐  ┌─ Movement ──┐          ║
║  │   65.219238  │  │   200.010000   │  │  Δ: 0.0919  │          ║
║  │              │  │                │  │             │          ║
║  │  ↓ -12.424   │  │  ⚠️  Very High │  │  Direction: │          ║
║  │  (-16.0%)    │  │                │  │    ↙        │          ║
║  │              │  │  [████████  ]  │  │             │          ║
║  │  ✓ Decreasing│  │  80% to target │  │  Step: 0.016│          ║
║  └──────────────┘  └────────────────┘  └─────────────┘          ║
║                                                                  ║
║  ┌──── Parameters ────┐  ┌─── Algorithm Info ───┐              ║
║  │  w₀:  1.1250  ↓    │  │  Method: Newton       │              ║
║  │  w₁:  1.9688  ↑    │  │  Line Search: Armijo  │              ║
║  │                    │  │  Trials: 3            │              ║
║  │  Gradient:         │  │  Condition #: 87.3    │              ║
║  │  ∇f = [-23.4, 89.1]│  │  Eigenvalues:         │              ║
║  │  ||∇f|| = 200.01   │  │    λ₁: 2.45  λ₂: 0.03 │              ║
║  └────────────────────┘  └──────────────────────┘               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Key Features
- **Dense layout:** Multiple panels showing different aspects
- **Quick-scan gauges:** Progress bars and status icons
- **Algorithm-specific details:** Eigenvalues, condition number visible
- **Compact notation:** Mathematical symbols (∇, λ) for brevity

### Pedagogical Benefits
- **Expert-friendly:** All relevant info at a glance
- **Algorithm comparison:** Easier to compare Newton vs GD when details are visible
- **Mathematical notation:** Reinforces the mathematical concepts
- **Comprehensive view:** Nothing hidden in expandable sections

---

## Recommendation Matrix

| Design Approach | Best For | Complexity | Pedagogical Value | Information Density |
|-----------------|----------|------------|-------------------|---------------------|
| **Convergence-First** | Beginners | Low | ⭐⭐⭐⭐⭐ | Medium |
| **Metric Cards** | Self-learners | Medium | ⭐⭐⭐⭐⭐ | Medium-Low |
| **Side-by-Side** | Understanding iteration | Medium | ⭐⭐⭐⭐ | Medium-High |
| **Dashboard Gauge** | Experts/comparison | High | ⭐⭐⭐ | High |

---

## Implementation Considerations

### Responsive Design
- All mockups assume desktop width (~800px+)
- Mobile: stack cards vertically, collapse advanced details by default
- Tablet: 2-column card layout

### Animation Opportunities
- Gradient norm progress bar animates when iteration changes
- Trend arrows bounce briefly to draw attention
- Loss reduction counter animates from old → new value

### Accessibility
- Color-blind safe: Use icons + color (not color alone) for status
- Screen reader friendly: Proper ARIA labels on progress bars
- Keyboard navigation: Arrow keys for iteration navigation (already implemented)

### Algorithm-Specific Variations
- **Newton's Method:** Show eigenvalues + condition number in advanced section
- **Line Search Methods:** Add "View line search trials" expandable
- **L-BFGS:** Show memory buffer usage in advanced section
- **GD Fixed Step:** Simplest view (no line search details)

### Progressive Disclosure Strategy
- **Default view:** Convergence status + loss + gradient norm
- **One click:** Parameters + step size
- **Two clicks:** Algorithm internals (Hessian, line search, etc.)

This prevents overwhelming beginners while giving experts quick access to details.

---

## Next Steps

1. **User Testing Questions:**
   - Which approach helps you understand convergence fastest?
   - What information do you look at first?
   - Do you understand what "gradient norm" means from the UI?

2. **Hybrid Approach:**
   - Could combine "Convergence-First" hierarchy with "Metric Cards" educational tooltips
   - Use "Side-by-Side" comparison as an optional view mode
   - Offer "Dashboard Gauge" as "Expert Mode" toggle

3. **Implementation Priority:**
   - Start with **Approach 1 (Convergence-First)** - clearest wins
   - Add educational tooltips from **Approach 2**
   - Make iteration comparison (Approach 3) available via toggle
