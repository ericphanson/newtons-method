# UI Architecture

## Overview

The UnifiedVisualizer UI follows a three-section architecture to provide clear separation of concerns:

1. **Configuration (Editable)** - Algorithm hyperparameters
2. **Playback (Navigation)** - Iteration timeline controls
3. **Metrics (Read-Only)** - Iteration data visualization

This design eliminates confusion between modifying algorithm settings and navigating through results.

## Components

### AlgorithmConfiguration

**Location:** `src/components/AlgorithmConfiguration.tsx`

**Purpose:** Displays editable algorithm hyperparameters.

**Props:**
- `algorithm`: Which algorithm ('gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs')
- Shared parameters: `maxIter`, `initialW0`, `initialW1`
- Algorithm-specific parameters (optional based on algorithm)

**Behavior:**
- Shows "EDITABLE" badges on all inputs
- Conditionally renders algorithm-specific controls
- Displays "Auto-run" notice (algorithm re-runs on any change)

### IterationPlayback

**Location:** `src/components/IterationPlayback.tsx`

**Purpose:** Navigation controls for stepping through iterations.

**Props:**
- `currentIter`: Current iteration index (0-based)
- `totalIters`: Total number of iterations
- `onIterChange`: Callback when iteration changes
- `onReset`: Callback to reset to iteration 0

**Features:**
- Reset, Previous, Next buttons
- Timeline scrubber (range slider)
- Iteration counter display
- "NAVIGATION" badge
- Disabled states at boundaries

### IterationMetrics

**Location:** `src/components/IterationMetrics.tsx`

**Purpose:** Displays all iteration data with convergence-first hierarchy.

**Props:**
- `algorithm`: Algorithm type (determines conditional rendering)
- Iteration data: `loss`, `gradNorm`, `weights`, `alpha`, `gradient`, `direction`
- Previous iteration data: `prevLoss`, `prevGradNorm` (for delta calculations)
- Algorithm-specific: `eigenvalues`, `conditionNumber`, `lineSearchTrials`
- Visualization refs: `lineSearchCanvasRef`, `hessianCanvasRef`

**Sections:**
1. **Convergence Hero** (Amber background)
   - Gradient norm (large, prominent)
   - Progress bar showing % to convergence target
   - Status badge (✓ Converged / ⚠️ In Progress)
   - Estimated iterations remaining

2. **Detailed Metrics** (2-column grid)
   - Loss panel: value, delta, percentage change
   - Movement panel: ||Δw||₂ magnitude, step size α

3. **Parameters Grid**
   - Individual cards for each weight
   - Shows current value and delta
   - Direction vector (normalized)

4. **Gradient Details**
   - Full gradient vector
   - Norm, max component
   - Change from previous, reduction rate

5. **Algorithm Info Panel** (Blue background, conditional)
   - Method name
   - Line search type ("Armijo (pluggable)")
   - Trials count
   - Condition number (if applicable)
   - Line Search Visualization canvas

6. **Hessian Analysis Panel** (Purple background, Newton only)
   - Eigenvalues (λ₁, λ₂)
   - Condition number κ
   - Positive definite check
   - Expandable Hessian matrix visualization

## Conditional Rendering Logic

| Algorithm | Config Params | Line Search Panel | Hessian Panel |
|-----------|---------------|-------------------|---------------|
| GD Fixed | Step size α, Tolerance | No | No |
| GD Line Search | Armijo c₁, Tolerance | Yes | No |
| Newton | Armijo c₁, Tolerance | Yes | Yes |
| L-BFGS | Memory M, Armijo c₁, Tolerance | Yes | No |

## Visual Design System

**Colors:**
- Configuration: White background, blue EDITABLE badges
- Playback: White background, gray NAVIGATION badge
- Metrics: White background, gray READ ONLY badge
- Convergence: Amber background (`bg-amber-50`, `border-amber-200`)
- Line Search: Blue background (`bg-blue-50`, `border-blue-200`)
- Hessian: Purple background (`bg-purple-50`, `border-purple-200`)

**Typography:**
- Section titles: `text-xl font-bold text-gray-900`
- Subsection headers: `text-sm font-bold text-gray-800 uppercase tracking-wide`
- Numeric values: `font-mono` (monospace)
- Helper text: `text-xs text-gray-500`

**Spacing:**
- Section padding: `p-6`
- Inner panel padding: `p-4`, `p-3`
- Margins between sections: `mb-6`
- Margins between subsections: `mb-4`
- Grid gaps: `gap-4`, `gap-3`

## Workflow

1. **User changes config** → Algorithm auto-runs → Iterations generated
2. **User navigates iterations** → Playback controls update current iteration
3. **Metrics display updates** → Shows data for current iteration
4. **Canvas visualizations re-render** → Line search, Hessian updated

## Future Extensibility

### Adding New Line Search Methods

To support pluggable line search:

1. Ensure iteration data includes `lineSearchCurve` and `lineSearchTrials`
2. Pass data to `IterationMetrics` via props
3. Canvas rendering in `UnifiedVisualizer` already supports different methods
4. UI will display "(pluggable)" label automatically

### Adding New Algorithms

To add a new algorithm:

1. Add algorithm type to union: `'new-algorithm'`
2. Update `AlgorithmConfiguration` to handle new parameters
3. Update `IterationMetrics` conditional logic if needed
4. Add algorithm-specific state to `UnifiedVisualizer`
5. Follow same Config → Playback → Metrics structure

## References

- Design Mockup: [docs/mockup-final-design.html](../mockup-final-design.html)
- Implementation Plan: [docs/plans/2025-11-06-iteration-ui-redesign.md](../plans/2025-11-06-iteration-ui-redesign.md)
- Original Design Exploration: [docs/iteration-ui-design-summary.md](../iteration-ui-design-summary.md)
