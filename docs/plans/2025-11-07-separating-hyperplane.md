# Separating Hyperplane Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new "Separating Hyperplane" problem that demonstrates three different objective functions (soft-margin SVM, perceptron, squared-hinge) and their different behaviors on the same dataset.

**Note:** Hard-margin SVM was removed as it's a constrained optimization problem that doesn't fit well with the unconstrained variants.

**Architecture:** Follow the logistic regression pattern - create a utils file with variant-specific functions, integrate into UI with variant selector dropdown, reuse existing crescent dataset generation. This is a 3D problem [w0, w1, w2] where w2 is the bias term.

**Tech Stack:** TypeScript, React, existing Newton's method visualization framework

---

## Task 1: Create Separating Hyperplane Utils File

**Files:**
- Create: `src/utils/separatingHyperplane.ts`

**Overview:** Create the mathematical functions for all four separating hyperplane variants. Each variant will export objective, gradient, and hessian functions. All use 3D weights [w0, w1, w2] where w2 is bias.

**Step 1: Create file with type imports and helper functions**

Create `src/utils/separatingHyperplane.ts`:

```typescript
import { DataPoint } from '../shared-utils';

/**
 * Separating Hyperplane variants for binary classification
 *
 * Three variants demonstrating different objective functions:
 * - Soft-Margin: ||w||²/2 + C·Σmax(0, 1-y·z) (C=1.0)
 * - Perceptron: Σmax(0, -y·z)
 * - Squared-Hinge: ||w||²/2 + C·Σ[max(0, 1-y·z)]² (C=1.0)
 *
 * Model: y_i ∈ {-1, +1}, z_i = w0*x1 + w1*x2 + w2
 * Uses 3D weights [w0, w1, w2] where w2 is the bias term.
 */

// Fixed regularization parameter for soft-margin and squared-hinge
const C = 1.0;

/**
 * Convert binary labels from {0,1} to {-1,+1} format for SVM
 */
function convertLabel(y: number): number {
  return y === 0 ? -1 : 1;
}

/**
 * Compute decision value z = w·x + b
 */
function computeZ(w: number[], point: DataPoint): number {
  const [w0, w1, w2] = w;
  return w0 * point.x1 + w1 * point.x2 + w2;
}
```

**Step 2: Implement Hard-Margin SVM (Variant A)**

Add to `src/utils/separatingHyperplane.ts`:

```typescript
/**
 * Hard-Margin SVM: Minimize ||w||²/2
 * Assumes data is linearly separable.
 * Will produce large gradients if data is not separable.
 */
export function hardMarginObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  // Just the regularization term (margin maximization)
  return 0.5 * (w0 * w0 + w1 * w1);
}

export function hardMarginGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  // Add constraint violations as penalties
  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const margin = y * z;

    // If point violates margin constraint (y·z < 1), add large penalty gradient
    if (margin < 1) {
      const penalty = 1000 * (1 - margin); // Large penalty for violations
      grad0 -= penalty * y * point.x1;
      grad1 -= penalty * y * point.x2;
      grad2 -= penalty * y;
    }
  }

  return [grad0, grad1, grad2];
}

export function hardMarginHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Hessian of ||w||²/2 is identity for w0, w1
  // For simplicity, return approximate Hessian
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0.01] // Small value for bias to avoid singularity
  ];
}
```

**Step 3: Implement Soft-Margin SVM with Hinge Loss (Variant B)**

Add to `src/utils/separatingHyperplane.ts`:

```typescript
/**
 * Soft-Margin SVM: ||w||²/2 + C·Σmax(0, 1-y·z)
 * Uses hinge loss. C=1.0 fixed.
 */
export function softMarginObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += C * hingeLoss;
  }

  return loss / dataPoints.length;
}

export function softMarginGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    // Subgradient: if 1 - y·z > 0, gradient is -C·y·x
    if (1 - y * z > 0) {
      grad0 -= C * y * point.x1;
      grad1 -= C * y * point.x2;
      grad2 -= C * y;
    }
  }

  return [
    grad0 / dataPoints.length,
    grad1 / dataPoints.length,
    grad2 / dataPoints.length
  ];
}

export function softMarginHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Hinge loss is not twice differentiable, return approximate Hessian
  // Use identity for regularization term
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0.01]
  ];
}
```

**Step 4: Implement Perceptron Criterion (Variant C)**

Add to `src/utils/separatingHyperplane.ts`:

```typescript
/**
 * Perceptron Criterion: Σmax(0, -y·z)
 * Minimizes misclassification loss only (no margin).
 */
export function perceptronObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  let loss = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    loss += Math.max(0, -y * z);
  }

  return loss / dataPoints.length;
}

export function perceptronGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  let grad0 = 0;
  let grad1 = 0;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    // If misclassified (y·z < 0), gradient is -y·x
    if (y * z < 0) {
      grad0 -= y * point.x1;
      grad1 -= y * point.x2;
      grad2 -= y;
    }
  }

  return [
    grad0 / dataPoints.length,
    grad1 / dataPoints.length,
    grad2 / dataPoints.length
  ];
}

export function perceptronHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Perceptron loss is piecewise linear, use small identity for stability
  return [
    [0.01, 0, 0],
    [0, 0.01, 0],
    [0, 0, 0.01]
  ];
}
```

**Step 5: Implement Squared-Hinge Loss (Variant D)**

Add to `src/utils/separatingHyperplane.ts`:

```typescript
/**
 * Squared-Hinge Loss: ||w||²/2 + C·Σ[max(0, 1-y·z)]²
 * Smooth variant of hinge loss. C=1.0 fixed.
 */
export function squaredHingeObjective(
  w: number[],
  dataPoints: DataPoint[]
): number {
  const [w0, w1] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += C * hingeLoss * hingeLoss;
  }

  return loss / dataPoints.length;
}

export function squaredHingeGradient(
  w: number[],
  dataPoints: DataPoint[]
): number[] {
  const [w0, w1, w2] = w;

  let grad0 = w0;
  let grad1 = w1;
  let grad2 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);
    const margin = 1 - y * z;

    if (margin > 0) {
      // Gradient: -2C·(1-y·z)·y·x
      const factor = -2 * C * margin * y;
      grad0 += factor * point.x1;
      grad1 += factor * point.x2;
      grad2 += factor;
    }
  }

  return [
    grad0 / dataPoints.length,
    grad1 / dataPoints.length,
    grad2 / dataPoints.length
  ];
}

export function squaredHingeHessian(
  w: number[],
  dataPoints: DataPoint[]
): number[][] {
  // Squared hinge is twice differentiable
  // H = I + 2C·Σ[1(margin>0)·x·x^T]
  let h00 = 1;
  let h01 = 0;
  let h02 = 0;
  let h11 = 1;
  let h12 = 0;
  let h22 = 0;

  for (const point of dataPoints) {
    const y = convertLabel(point.y);
    const z = computeZ(w, point);

    if (1 - y * z > 0) {
      const factor = 2 * C * y * y; // y² = 1 always
      h00 += factor * point.x1 * point.x1;
      h01 += factor * point.x1 * point.x2;
      h02 += factor * point.x1;
      h11 += factor * point.x2 * point.x2;
      h12 += factor * point.x2;
      h22 += factor;
    }
  }

  const n = dataPoints.length;
  return [
    [h00 / n, h01 / n, h02 / n],
    [h01 / n, h11 / n, h12 / n],
    [h02 / n, h12 / n, h22 / n]
  ];
}
```

**Step 6: Commit the utils file**

```bash
git add src/utils/separatingHyperplane.ts
git commit -m "feat(problems): add separating hyperplane utils with 3 variants"
```

Run: `git status` to verify clean state
Expected: "nothing to commit, working tree clean"

---

## Task 2: Update Type Definitions

**Files:**
- Modify: `src/types/experiments.ts`

**Step 1: Add new problem type to enum**

In `src/types/experiments.ts`, find the `ProblemType` definition and add the new type:

```typescript
export type ProblemType =
  | 'logistic-regression'
  | 'quadratic'
  | 'ill-conditioned-quadratic'
  | 'rosenbrock'
  | 'non-convex-saddle'
  | 'separating-hyperplane';  // Add this line
```

**Step 2: Add variant type definition**

Add after the `ProblemType` definition:

```typescript
export type SeparatingHyperplaneVariant =
  | 'soft-margin'
  | 'perceptron'
  | 'squared-hinge';
```

**Step 3: Commit type updates**

```bash
git add src/types/experiments.ts
git commit -m "feat(types): add separating-hyperplane problem type"
```

---

## Task 3: Update Problem Adapter

**Files:**
- Modify: `src/utils/problemAdapter.ts`

**Step 1: Import separating hyperplane functions**

At the top of `src/utils/problemAdapter.ts`, add import:

```typescript
import * as SH from './separatingHyperplane';
import { SeparatingHyperplaneVariant } from '../types/experiments';
```

**Step 2: Create adapter function**

Add new exported function after `logisticRegressionToProblemFunctions`:

```typescript
/**
 * Adapter for separating hyperplane problems.
 * Converts variant-specific functions to ProblemFunctions format.
 */
export function separatingHyperplaneToProblemFunctions(
  data: DataPoint[],
  variant: SeparatingHyperplaneVariant
): ProblemFunctions {
  let objective: (w: number[]) => number;
  let gradient: (w: number[]) => number[];
  let hessian: (w: number[]) => number[][];

  switch (variant) {
    case 'soft-margin':
      objective = (w) => SH.softMarginObjective(w, data);
      gradient = (w) => SH.softMarginGradient(w, data);
      hessian = (w) => SH.softMarginHessian(w, data);
      break;
    case 'perceptron':
      objective = (w) => SH.perceptronObjective(w, data);
      gradient = (w) => SH.perceptronGradient(w, data);
      hessian = (w) => SH.perceptronHessian(w, data);
      break;
    case 'squared-hinge':
      objective = (w) => SH.squaredHingeObjective(w, data);
      gradient = (w) => SH.squaredHingeGradient(w, data);
      hessian = (w) => SH.squaredHingeHessian(w, data);
      break;
  }

  return { objective, gradient, hessian };
}
```

**Step 3: Commit adapter changes**

```bash
git add src/utils/problemAdapter.ts
git commit -m "feat(adapter): add separating hyperplane problem adapter"
```

---

## Task 4: Update Problem Defaults

**Files:**
- Modify: `src/utils/problemDefaults.ts`

**Step 1: Add separating hyperplane defaults to getProblemDefaults**

In `src/utils/problemDefaults.ts`, find the `getProblemDefaults` function and add case:

```typescript
case 'separating-hyperplane':
  return {
    gdFixedAlpha: 0.1,
    maxIter: 100,
    initialPoint: [0, 0, 0],  // 3D: [w0, w1, bias]
    c1: 1e-4,
    lbfgsM: 10,
  };
```

**Step 2: Add problem note**

In the `getProblemNote` function, add case:

```typescript
case 'separating-hyperplane':
  return 'Finds optimal separating hyperplane. Try different variants to see how objective functions affect the solution.';
```

**Step 3: Commit defaults**

```bash
git add src/utils/problemDefaults.ts
git commit -m "feat(defaults): add separating hyperplane problem defaults"
```

---

## Task 5: Update UnifiedVisualizer Component

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Import variant type and adapter**

At the top of `src/UnifiedVisualizer.tsx`, add to imports:

```typescript
import { SeparatingHyperplaneVariant } from './types/experiments';
import { separatingHyperplaneToProblemFunctions } from './utils/problemAdapter';
```

**Step 2: Add variant state**

Find where other state variables are declared (around line 110-130), add:

```typescript
const [separatingHyperplaneVariant, setSeparatingHyperplaneVariant] =
  useState<SeparatingHyperplaneVariant>('soft-margin');
```

**Step 3: Update getCurrentProblem callback**

Find the `getCurrentProblem` callback (around line 132-185). Add case for separating-hyperplane:

```typescript
case 'separating-hyperplane': {
  // Return metadata about the problem
  return {
    name: 'Separating Hyperplane',
    requiresDataset: true,
    is3D: true,
  };
}
```

**Step 4: Update getCurrentProblemFunctions callback**

Find the `getCurrentProblemFunctions` callback (around line 190-212). Add case:

```typescript
case 'separating-hyperplane':
  if (!dataPoints || dataPoints.length === 0) {
    throw new Error('Separating hyperplane requires dataset');
  }
  return separatingHyperplaneToProblemFunctions(dataPoints, separatingHyperplaneVariant);
```

**Step 5: Pass variant state to ProblemConfiguration**

Find the `<ProblemConfiguration>` component (around line 240-250). Add props:

```typescript
<ProblemConfiguration
  // ... existing props ...
  separatingHyperplaneVariant={separatingHyperplaneVariant}
  onSeparatingHyperplaneVariantChange={setSeparatingHyperplaneVariant}
/>
```

**Step 6: Commit visualizer changes**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(visualizer): add separating hyperplane variant state"
```

---

## Task 6: Update ProblemConfiguration Component

**Files:**
- Modify: `src/components/ProblemConfiguration.tsx`

**Step 1: Add variant props to component interface**

At the top of `src/components/ProblemConfiguration.tsx`, find the component props interface and add:

```typescript
interface ProblemConfigurationProps {
  // ... existing props ...
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant;
  onSeparatingHyperplaneVariantChange?: (variant: SeparatingHyperplaneVariant) => void;
}
```

**Step 2: Add import for variant type**

Add to imports:

```typescript
import { SeparatingHyperplaneVariant } from '../types/experiments';
```

**Step 3: Destructure new props**

In the component function, add to destructuring:

```typescript
const {
  // ... existing props ...
  separatingHyperplaneVariant,
  onSeparatingHyperplaneVariantChange,
} = props;
```

**Step 4: Add separating-hyperplane to problem dropdown**

Find the problem type select dropdown (around line 125), add option:

```typescript
<option value="separating-hyperplane">Separating Hyperplane</option>
```

**Step 5: Add variant selector UI**

Find where parameter controls are rendered (around line 265-360). Add variant selector:

```typescript
{problemType === 'separating-hyperplane' && (
  <div className="control-group">
    <label>Variant:</label>
    <select
      value={separatingHyperplaneVariant}
      onChange={(e) =>
        onSeparatingHyperplaneVariantChange?.(e.target.value as SeparatingHyperplaneVariant)
      }
    >
      <option value="soft-margin">Soft-Margin SVM</option>
      <option value="perceptron">Perceptron</option>
      <option value="squared-hinge">Squared-Hinge</option>
    </select>
  </div>
)}
```

**Step 6: Add mathematical formulation display**

Find where problem formulations are displayed (around line 158-169). Add:

```typescript
{problemType === 'separating-hyperplane' && (
  <div className="math-display">
    {separatingHyperplaneVariant === 'soft-margin' && (
      <div>
        <strong>Soft-Margin:</strong> min ||w||²/2 + C·Σmax(0, 1-yᵢzᵢ)
        <br />
        <small>Hinge loss, allows misclassifications (C=1.0)</small>
      </div>
    )}
    {separatingHyperplaneVariant === 'perceptron' && (
      <div>
        <strong>Perceptron:</strong> min Σmax(0, -yᵢzᵢ)
        <br />
        <small>Minimizes misclassifications, no margin</small>
      </div>
    )}
    {separatingHyperplaneVariant === 'squared-hinge' && (
      <div>
        <strong>Squared-Hinge:</strong> min ||w||²/2 + C·Σ[max(0, 1-yᵢzᵢ)]²
        <br />
        <small>Smooth variant, twice differentiable (C=1.0)</small>
      </div>
    )}
  </div>
)}
```

**Step 7: Update handleProblemChange to reset variant**

Find `handleProblemChange` function (around line 66-87). Add logic to reset variant:

```typescript
const handleProblemChange = (newProblemType: ProblemType) => {
  // ... existing code ...

  // Reset separating hyperplane variant
  if (newProblemType === 'separating-hyperplane') {
    onSeparatingHyperplaneVariantChange?.('soft-margin');
  }

  // ... rest of existing code ...
};
```

**Step 8: Commit ProblemConfiguration changes**

```bash
git add src/components/ProblemConfiguration.tsx
git commit -m "feat(ui): add separating hyperplane variant selector"
```

---

## Task 7: Update ProblemExplainer Component

**Files:**
- Modify: `src/components/ProblemExplainer.tsx`

**Step 1: Add separating hyperplane explanation section**

Find where other problem explanations are (look for CollapsibleSection components), add new section:

```typescript
{problemType === 'separating-hyperplane' && (
  <CollapsibleSection title="Separating Hyperplane" defaultOpen={true}>
    <h4>Overview</h4>
    <p>
      The <strong>separating hyperplane</strong> problem finds a linear decision boundary
      that separates two classes of data points. In 2D, this is a line; in higher dimensions,
      it's a hyperplane. The equation is: <code>w₀·x₁ + w₁·x₂ + w₂ = 0</code>
    </p>

    <h4>Three Variants</h4>

    <div style={{marginLeft: '1em'}}>
      <h5>1. Soft-Margin SVM</h5>
      <p>
        <strong>Objective:</strong> min ||w||²/2 + C·Σmax(0, 1-yᵢzᵢ)
      </p>
      <p>
        Uses <em>hinge loss</em> to allow some misclassifications with penalty C=1.0.
        Most practical choice for real-world data. Points outside the margin contribute to loss.
        Balances margin maximization with allowing errors.
      </p>

      <h5>2. Perceptron Criterion</h5>
      <p>
        <strong>Objective:</strong> min Σmax(0, -yᵢzᵢ)
      </p>
      <p>
        Classic perceptron algorithm. Only penalizes misclassified points (yᵢzᵢ &lt; 0).
        Does not maximize margin - just finds any separating hyperplane.
        <strong>Result:</strong> Often finds solutions closer to the data than SVM variants.
      </p>

      <h5>3. Squared-Hinge Loss</h5>
      <p>
        <strong>Objective:</strong> min ||w||²/2 + C·Σ[max(0, 1-yᵢzᵢ)]²
      </p>
      <p>
        Smoothed version of hinge loss. Penalizes margin violations quadratically.
        <strong>Advantage:</strong> Twice differentiable everywhere, better for Newton's method.
        Gives more penalty to large violations than soft-margin SVM.
      </p>
    </div>

    <h4>Key Insights</h4>
    <ul>
      <li>
        <strong>Soft-Margin</strong> is the most practical choice - handles real-world data with noise while maximizing margin
      </li>
      <li>
        <strong>Perceptron</strong> is simplest but doesn't maximize margin (less robust to new data)
      </li>
      <li>
        <strong>Squared-Hinge</strong> is smoothest - best for second-order optimization methods
      </li>
    </ul>

    <h4>Try This</h4>
    <ul>
      <li>
        Compare <strong>soft-margin</strong> vs <strong>squared-hinge</strong> on overlapping data.
        Notice how squared-hinge gives smoother convergence with Newton's method.
      </li>
      <li>
        Use <strong>perceptron</strong> and compare to <strong>soft-margin</strong>. See how
        perceptron finds narrower margins (less robust).
      </li>
      <li>
        Try different algorithms: Newton's method works best with squared-hinge (smooth Hessian),
        gradient descent works with all variants.
      </li>
    </ul>

    <h4>Comparison to Logistic Regression</h4>
    <p>
      While logistic regression uses a smooth log-loss that affects all points, SVM variants
      use margin-based losses that only penalize points near or on the wrong side of the boundary.
      This makes SVMs focus on the "support vectors" - the critical points near the decision boundary.
    </p>
  </CollapsibleSection>
)}
```

**Step 2: Commit ProblemExplainer changes**

```bash
git add src/components/ProblemExplainer.tsx
git commit -m "feat(docs): add separating hyperplane pedagogical content"
```

---

## Task 8: Manual Testing and Verification

**Step 1: Start development server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:5173 (or similar)

**Step 2: Test problem selection**

1. Open browser to localhost
2. Select "Separating Hyperplane" from problem dropdown
3. Verify variant dropdown appears with 3 options
4. Verify default is "Soft-Margin SVM"
5. Verify mathematical formulation displays correctly

**Step 3: Test variant switching**

1. Switch between all 3 variants
2. Verify formulation display updates for each
3. Verify no console errors

**Step 4: Test with algorithms**

1. Generate crescent dataset (default settings)
2. Run Gradient Descent with:
   - Soft-Margin variant
   - Perceptron variant
   - Squared-Hinge variant
3. Verify each produces different trajectories
4. Verify convergence behavior differs between variants

**Step 5: Test Newton's method**

1. Use Squared-Hinge variant (smooth Hessian)
2. Run Newton's method
3. Verify fast convergence
4. Compare to Soft-Margin (should work but possibly slower)

**Step 6: Check ProblemExplainer**

1. Verify explanation section appears and is readable
2. Check that all 3 variants are explained
3. Verify pedagogical content is clear

**Step 7: Final verification commit**

```bash
git add -A
git commit -m "test: verify separating hyperplane implementation"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] All 3 variants compile without TypeScript errors
- [ ] Problem appears in dropdown
- [ ] Variant selector works and updates formulation
- [ ] Each variant produces different optimization trajectories
- [ ] Soft-margin and squared-hinge handle overlapping data well
- [ ] ProblemExplainer content is comprehensive and clear
- [ ] No console errors or warnings
- [ ] UI is responsive and controls work smoothly

---

## Notes

**Mathematical correctness:**
- All gradients computed using standard SVM formulations
- Hard-margin uses penalty approach for non-separable data (pedagogical choice)
- Soft-margin uses subgradient for non-differentiable hinge loss
- Squared-hinge has proper Hessian (twice differentiable)

**Fixed parameters:**
- C = 1.0 for soft-margin and squared-hinge (hardcoded for simplicity)
- Can be made configurable in future iteration

**Dataset compatibility:**
- Uses existing crescent generation (generateCrescents from shared-utils)
- Future: add more dataset options (linear clusters, etc.)

**3D visualization:**
- Problem uses [w0, w1, w2] like logistic regression
- w2 is bias term
- Can be visualized in 3D parameter space
