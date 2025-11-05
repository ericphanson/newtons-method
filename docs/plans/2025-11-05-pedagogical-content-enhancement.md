# Pedagogical Content Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance Newton's Method and L-BFGS tabs with comprehensive pedagogical content and update all tabs to use consistent dual-track structure with interactive experiments.

**Architecture:** Add KaTeX for mathematical rendering, create experiment preset system with one-click setup, expand all algorithm tabs with collapsible sections following dual-track structure (intuitive expanded, rigorous collapsed), add new problem types for experiments.

**Tech Stack:** React, TypeScript, KaTeX (client-side), Tailwind CSS, existing Canvas visualization system

---

## Task 1: Add KaTeX Dependencies

**Files:**
- Modify: `package.json`
- Create: `src/components/Math.tsx`

**Step 1: Add KaTeX dependencies**

Run:
```bash
npm install katex@^0.16.9
npm install --save-dev @types/katex
```

Expected: Dependencies added to package.json

**Step 2: Verify installation**

Run: `npm list katex`
Expected: Shows katex@0.16.9

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add katex for mathematical rendering"
```

---

## Task 2: Create Math Component

**Files:**
- Create: `src/components/Math.tsx`

**Step 1: Create Math component**

Create `src/components/Math.tsx`:

```tsx
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

export function Math({ children, block = false, className = '' }: MathProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return children;
    }
  }, [children, block]);

  const Component = block ? 'div' : 'span';
  const classes = block ? `katex-display ${className}` : `katex-inline ${className}`;

  return (
    <Component
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Convenience components
export function InlineMath({ children, className }: { children: string; className?: string }) {
  return <Math block={false} className={className}>{children}</Math>;
}

export function BlockMath({ children, className }: { children: string; className?: string }) {
  return <Math block={true} className={className}>{children}</Math>;
}
```

**Step 2: Test Math component**

Add to `src/App.tsx` temporarily to verify:
```tsx
import { InlineMath, BlockMath } from './components/Math';

// Add inside App component temporarily:
<div>
  <InlineMath>\nabla f(w)</InlineMath>
  <BlockMath>f(w+p) = f(w) + \nabla f \cdot p</BlockMath>
</div>
```

**Step 3: Run dev server and verify**

Run: `npm run dev`
Expected: Math renders with proper LaTeX formatting

**Step 4: Remove test code from App.tsx**

**Step 5: Commit**

```bash
git add src/components/Math.tsx
git commit -m "feat: add Math component for KaTeX rendering"
```

---

## Task 3: Create Experiment Preset System - Types

**Files:**
- Create: `src/types/experiments.ts`

**Step 1: Create experiment types**

Create `src/types/experiments.ts`:

```typescript
export type ProblemType =
  | 'logistic-regression'
  | 'quadratic'
  | 'ill-conditioned-quadratic'
  | 'rosenbrock'
  | 'non-convex-saddle';

export interface DataPoint {
  x: number;
  y: number;
  label: number;
}

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  problem: ProblemType;
  dataset?: DataPoint[];
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number; // for L-BFGS
    maxIter?: number;
  };
  initialPoint?: [number, number];
  expectation: string; // What to observe
}

export interface ProblemDefinition {
  name: string;
  objective: (w: number[]) => number;
  gradient: (w: number[]) => number[];
  hessian?: (w: number[]) => number[][]; // For Newton
  domain: {
    w0: [number, number];
    w1: [number, number];
  };
  description: string;
}
```

**Step 2: Commit**

```bash
git add src/types/experiments.ts
git commit -m "feat: add experiment preset type definitions"
```

---

## Task 4: Create Quadratic Problem

**Files:**
- Create: `src/problems/quadratic.ts`

**Step 1: Create quadratic problem**

Create `src/problems/quadratic.ts`:

```typescript
import { ProblemDefinition } from '../types/experiments';

// Simple quadratic bowl: f(w) = 0.5 * (w0^2 + w1^2)
// Strongly convex, ideal for demonstrating convergence
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  description: 'Strongly convex quadratic f(w) = 0.5(w₀² + w₁²)',

  objective: (w: number[]): number => {
    return 0.5 * (w[0] * w[0] + w[1] * w[1]);
  },

  gradient: (w: number[]): number[] => {
    return [w[0], w[1]];
  },

  hessian: (w: number[]): number[][] => {
    // Constant Hessian = [[1, 0], [0, 1]] (identity)
    return [[1, 0], [0, 1]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },
};

// Ill-conditioned quadratic: elongated ellipse
// f(w) = 0.5 * (100*w0^2 + w1^2)
export const illConditionedQuadratic: ProblemDefinition = {
  name: 'Ill-Conditioned Quadratic',
  description: 'Elongated ellipse with condition number κ=100',

  objective: (w: number[]): number => {
    return 0.5 * (100 * w[0] * w[0] + w[1] * w[1]);
  },

  gradient: (w: number[]): number[] => {
    return [100 * w[0], w[1]];
  },

  hessian: (w: number[]): number[][] => {
    return [[100, 0], [0, 1]];
  },

  domain: {
    w0: [-0.5, 0.5],
    w1: [-3, 3],
  },
};
```

**Step 2: Commit**

```bash
git add src/problems/quadratic.ts
git commit -m "feat: add quadratic problem definitions"
```

---

## Task 5: Create Rosenbrock Problem

**Files:**
- Create: `src/problems/rosenbrock.ts`

**Step 1: Create Rosenbrock problem**

Create `src/problems/rosenbrock.ts`:

```typescript
import { ProblemDefinition } from '../types/experiments';

// Rosenbrock function: f(w) = (1-w0)^2 + 100(w1-w0^2)^2
// Non-convex, banana-shaped valley, classic optimization test
export const rosenbrockProblem: ProblemDefinition = {
  name: 'Rosenbrock Function',
  description: 'Non-convex banana-shaped valley, global minimum at (1,1)',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return Math.pow(1 - w0, 2) + 100 * Math.pow(w1 - w0 * w0, 2);
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    const dw0 = -2 * (1 - w0) - 400 * w0 * (w1 - w0 * w0);
    const dw1 = 200 * (w1 - w0 * w0);
    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0, w1] = w;
    const h00 = 2 + 1200 * w0 * w0 - 400 * w1;
    const h01 = -400 * w0;
    const h10 = -400 * w0;
    const h11 = 200;
    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-2, 2],
    w1: [-1, 3],
  },
};
```

**Step 2: Commit**

```bash
git add src/problems/rosenbrock.ts
git commit -m "feat: add Rosenbrock problem definition"
```

---

## Task 6: Create Problem Registry

**Files:**
- Create: `src/problems/index.ts`

**Step 1: Create problem registry**

Create `src/problems/index.ts`:

```typescript
import { ProblemDefinition } from '../types/experiments';
import { quadraticProblem, illConditionedQuadratic } from './quadratic';
import { rosenbrockProblem } from './rosenbrock';

export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

export { quadraticProblem, illConditionedQuadratic, rosenbrockProblem };
```

**Step 2: Commit**

```bash
git add src/problems/index.ts
git commit -m "feat: add problem registry"
```

---

## Task 7: Create Experiment Presets - Newton

**Files:**
- Create: `src/experiments/newton-presets.ts`

**Step 1: Create Newton experiment presets**

Create `src/experiments/newton-presets.ts`:

```typescript
import { ExperimentPreset } from '../types/experiments';

export const newtonExperiments: ExperimentPreset[] = [
  {
    id: 'newton-success-quadratic',
    name: 'Success: Strongly Convex Quadratic',
    description: 'Watch quadratic convergence in 1-2 iterations on a simple bowl',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      maxIter: 10,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: 1-2 iterations to convergence, all eigenvalues positive, α=1 accepted',
  },
  {
    id: 'newton-failure-rosenbrock',
    name: 'Failure: Non-Convex Rosenbrock',
    description: 'Start near saddle point to see negative eigenvalues and potential divergence',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [-0.5, -0.5],
    expectation: 'Observe: Negative eigenvalues, Newton direction points wrong way, slow or divergent',
  },
  {
    id: 'newton-fixed-linesearch',
    name: 'Fixed: Line Search Rescue',
    description: 'Same non-convex problem but line search prevents divergence',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [-1.5, 2],
    expectation: 'Observe: Backtracking reduces α, prevents divergence, acts like damped Newton',
  },
  {
    id: 'newton-compare-ill-conditioned',
    name: 'Compare: Newton vs GD on Ill-Conditioned',
    description: 'Elongated ellipse where GD zig-zags but Newton excels',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 20,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Newton converges in ~5 iterations (GD would take 100+)',
  },
];
```

**Step 2: Commit**

```bash
git add src/experiments/newton-presets.ts
git commit -m "feat: add Newton experiment presets"
```

---

## Task 8: Create Experiment Presets - L-BFGS

**Files:**
- Create: `src/experiments/lbfgs-presets.ts`

**Step 1: Create L-BFGS experiment presets**

Create `src/experiments/lbfgs-presets.ts`:

```typescript
import { ExperimentPreset } from '../types/experiments';

export const lbfgsExperiments: ExperimentPreset[] = [
  {
    id: 'lbfgs-success-quadratic',
    name: 'Success: Strongly Convex Problem',
    description: 'Fast Newton-like convergence without computing Hessian',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      m: 10,
      maxIter: 20,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Fast convergence similar to Newton, memory pairs build curvature info',
  },
  {
    id: 'lbfgs-memory-comparison',
    name: 'Memory Matters: M=3 vs M=10',
    description: 'Compare different memory sizes on same problem',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 3,
      maxIter: 30,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'With M=3: less accurate approximation, more iterations. Try M=10 for comparison.',
  },
  {
    id: 'lbfgs-rosenbrock',
    name: 'Challenge: Rosenbrock Valley',
    description: 'Non-convex problem tests quasi-Newton approximation',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 10,
      maxIter: 100,
    },
    initialPoint: [-1, 1],
    expectation: 'Observe: Superlinear convergence once near valley, memory adapts to local curvature',
  },
];
```

**Step 2: Commit**

```bash
git add src/experiments/lbfgs-presets.ts
git commit -m "feat: add L-BFGS experiment presets"
```

---

## Task 9: Create Experiment Presets - GD Fixed

**Files:**
- Create: `src/experiments/gd-fixed-presets.ts`

**Step 1: Create GD Fixed Step experiment presets**

Create `src/experiments/gd-fixed-presets.ts`:

```typescript
import { ExperimentPreset, DataPoint } from '../types/experiments';

// Helper to generate crescent dataset
function generateCrescentData(): DataPoint[] {
  const data: DataPoint[] = [];
  const n = 20;

  for (let i = 0; i < n; i++) {
    const angle = Math.PI * 0.5 * i / n;
    data.push({
      x: 1.5 * Math.cos(angle) + (Math.random() - 0.5) * 0.3,
      y: 1.5 * Math.sin(angle) + (Math.random() - 0.5) * 0.3,
      label: 0,
    });

    data.push({
      x: -1.5 * Math.cos(angle) + (Math.random() - 0.5) * 0.3,
      y: -1.5 * Math.sin(angle) + (Math.random() - 0.5) * 0.3,
      label: 1,
    });
  }

  return data;
}

export const gdFixedExperiments: ExperimentPreset[] = [
  {
    id: 'gd-fixed-success',
    name: 'Success: Good Step Size',
    description: 'Well-chosen α leads to smooth convergence',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      alpha: 0.1,
      lambda: 0.01,
      maxIter: 100,
    },
    expectation: 'Observe: Steady decrease in loss, smooth trajectory toward minimum',
  },
  {
    id: 'gd-fixed-diverge',
    name: 'Failure: Step Size Too Large',
    description: 'α=0.8 causes oscillation and divergence',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      alpha: 0.8,
      lambda: 0.01,
      maxIter: 50,
    },
    expectation: 'Observe: Loss increases, trajectory oscillates, diverges',
  },
  {
    id: 'gd-fixed-too-small',
    name: 'Failure: Step Size Too Small',
    description: 'α=0.001 leads to extremely slow convergence',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      alpha: 0.001,
      lambda: 0.01,
      maxIter: 200,
    },
    expectation: 'Observe: Tiny progress per step, would take thousands of iterations',
  },
  {
    id: 'gd-fixed-ill-conditioned',
    name: 'Struggle: Ill-Conditioned Problem',
    description: 'Elongated ellipse causes zig-zagging',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      alpha: 0.01,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Zig-zag pattern perpendicular to contours, slow convergence',
  },
];
```

**Step 2: Commit**

```bash
git add src/experiments/gd-fixed-presets.ts
git commit -m "feat: add GD fixed step experiment presets"
```

---

## Task 10: Create Experiment Presets - GD Line Search

**Files:**
- Create: `src/experiments/gd-linesearch-presets.ts`

**Step 1: Create GD Line Search experiment presets**

Create `src/experiments/gd-linesearch-presets.ts`:

```typescript
import { ExperimentPreset, DataPoint } from '../types/experiments';

function generateCrescentData(): DataPoint[] {
  const data: DataPoint[] = [];
  const n = 20;

  for (let i = 0; i < n; i++) {
    const angle = Math.PI * 0.5 * i / n;
    data.push({
      x: 1.5 * Math.cos(angle) + (Math.random() - 0.5) * 0.3,
      y: 1.5 * Math.sin(angle) + (Math.random() - 0.5) * 0.3,
      label: 0,
    });

    data.push({
      x: -1.5 * Math.cos(angle) + (Math.random() - 0.5) * 0.3,
      y: -1.5 * Math.sin(angle) + (Math.random() - 0.5) * 0.3,
      label: 1,
    });
  }

  return data;
}

export const gdLinesearchExperiments: ExperimentPreset[] = [
  {
    id: 'gd-ls-success',
    name: 'Success: Automatic Adaptation',
    description: 'Line search automatically finds good step sizes',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.01,
      maxIter: 50,
    },
    expectation: 'Observe: Step size adapts to landscape, converges robustly',
  },
  {
    id: 'gd-ls-c1-too-small',
    name: 'Failure: C1 Too Small',
    description: 'C1=0.00001 accepts poor steps, slow convergence',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      c1: 0.00001,
      lambda: 0.01,
      maxIter: 100,
    },
    expectation: 'Observe: Accepts steps with minimal decrease, wastes iterations',
  },
  {
    id: 'gd-ls-c1-too-large',
    name: 'Failure: C1 Too Large',
    description: 'C1=0.5 is too conservative, rejects good steps',
    problem: 'logistic-regression',
    dataset: generateCrescentData(),
    hyperparameters: {
      c1: 0.5,
      lambda: 0.01,
      maxIter: 100,
    },
    expectation: 'Observe: Too conservative, tiny steps, slow progress',
  },
  {
    id: 'gd-ls-varying-curvature',
    name: 'Advantage: Varying Curvature',
    description: 'Line search handles landscape changes that break fixed step',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 200,
    },
    initialPoint: [-1.5, 2],
    expectation: 'Observe: Adapts to narrow valley, fixed step would fail here',
  },
];
```

**Step 2: Commit**

```bash
git add src/experiments/gd-linesearch-presets.ts
git commit -m "feat: add GD line search experiment presets"
```

---

## Task 11: Create Experiment Registry

**Files:**
- Create: `src/experiments/index.ts`

**Step 1: Create experiment registry**

Create `src/experiments/index.ts`:

```typescript
import { ExperimentPreset } from '../types/experiments';
import { gdFixedExperiments } from './gd-fixed-presets';
import { gdLinesearchExperiments } from './gd-linesearch-presets';
import { newtonExperiments } from './newton-presets';
import { lbfgsExperiments } from './lbfgs-presets';

export const experimentRegistry = {
  'gd-fixed': gdFixedExperiments,
  'gd-linesearch': gdLinesearchExperiments,
  'newton': newtonExperiments,
  'lbfgs': lbfgsExperiments,
};

export function getExperimentsForAlgorithm(algorithm: string): ExperimentPreset[] {
  return experimentRegistry[algorithm as keyof typeof experimentRegistry] || [];
}

export { gdFixedExperiments, gdLinesearchExperiments, newtonExperiments, lbfgsExperiments };
```

**Step 2: Commit**

```bash
git add src/experiments/index.ts
git commit -m "feat: add experiment registry"
```

---

## Task 12: Add Newton Pedagogical Content - Quick Start

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (Newton section, around line 1565)

**Step 1: Replace Newton "Why Newton?" section with Quick Start**

In `src/UnifiedVisualizer.tsx`, find the Newton section (around line 1565-1592) and replace with:

```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={true}
  storageKey="newton-quick-start"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">The Core Idea</h3>
      <p>
        Gradient descent uses first derivatives. Newton's method uses second derivatives
        (the <strong>Hessian matrix</strong>) to see the curvature and take smarter steps
        toward the minimum.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">The Algorithm</h3>
      <ol className="list-decimal ml-6 space-y-1">
        <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
        <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of all second derivatives)</li>
        <li>Solve <InlineMath>Hp = -\nabla f</InlineMath> for search direction <InlineMath>p</InlineMath> (Newton direction)</li>
        <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
        <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Key Formula</h3>
      <p>Newton direction:</p>
      <BlockMath>p = -H^{-1}\nabla f</BlockMath>
      <p className="text-sm mt-2">
        Intuition: <InlineMath>H^{-1}</InlineMath> transforms the gradient into the
        natural coordinate system of the problem.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">When to Use</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Small-medium problems (n &lt; 1000 parameters)</li>
        <li>Smooth, twice-differentiable objectives</li>
        <li>Near a local minimum (quadratic convergence)</li>
        <li>When you can afford O(n³) computation per iteration</li>
      </ul>
    </div>

    <div className="bg-blue-100 rounded p-3">
      <p className="font-bold text-sm">Assumptions:</p>
      <ul className="text-sm list-disc ml-6">
        <li>f is twice continuously differentiable</li>
        <li>Hessian is positive definite (strongly convex) for guaranteed convergence</li>
        <li>Line search used when H not positive definite or far from minimum</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Add Math component import at top of file**

Add to imports:
```tsx
import { InlineMath, BlockMath } from './components/Math';
```

**Step 3: Test in browser**

Run: `npm run dev`
Expected: Newton tab shows new Quick Start section with rendered math

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Quick Start pedagogical section"
```

---

## Task 13: Add Newton Pedagogical Content - Visual Guide

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (after Quick Start section)

**Step 1: Add Visual Guide section after Quick Start**

Add after the Quick Start CollapsibleSection:

```tsx
<CollapsibleSection
  title="Visual Guide"
  defaultExpanded={true}
  storageKey="newton-visual-guide"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Parameter Space</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Trajectory takes <strong>fewer, larger steps</strong> than gradient descent</li>
        <li>Steps are <strong>not perpendicular</strong> to contours (unlike steepest descent)</li>
        <li>Near minimum, often <strong>converges in 2-3 iterations</strong></li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Hessian Matrix Heatmap</h3>
      <p>Shows curvature information: <InlineMath>H_{ij} = \frac{\partial^2 f}{\partial w_i \partial w_j}</InlineMath></p>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>Diagonal:</strong> curvature along each parameter axis</li>
        <li><strong>Off-diagonal:</strong> how parameters interact (cross-derivatives)</li>
        <li><strong>Color intensity:</strong> magnitude of second derivatives</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Eigenvalue Display</h3>
      <p>Shows <InlineMath>\lambda_{min}</InlineMath>, <InlineMath>\lambda_{max}</InlineMath>,
         condition number <InlineMath>\kappa = \lambda_{max}/\lambda_{min}</InlineMath></p>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>All positive</strong> → local minimum (bowl-shaped)</li>
        <li><strong>Some negative</strong> → saddle point (not a minimum)</li>
        <li><strong>Large κ</strong> → ill-conditioned, but Newton handles better than GD</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Line Search Panel</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Often accepts <InlineMath>\alpha = 1</InlineMath> (full Newton step) near minimum</li>
        <li>Smaller <InlineMath>\alpha</InlineMath> when far from minimum or Hessian approximation poor</li>
        <li>Armijo condition ensures sufficient decrease</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Test in browser**

Run: `npm run dev`
Expected: Visual Guide section appears with proper math rendering

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Visual Guide section"
```

---

## Task 14: Add Newton Pedagogical Content - Line Search Details

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (after Visual Guide)

**Step 1: Add Line Search Details section**

```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={true}
  storageKey="newton-line-search-details"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Why Line Search for Newton's Method</h3>
      <p>Pure Newton (<InlineMath>\alpha = 1</InlineMath> always) assumes the quadratic
         approximation is perfect:</p>
      <ul className="list-disc ml-6 space-y-1 mt-2">
        <li><strong>Far from minimum:</strong> quadratic approximation breaks down</li>
        <li><strong>Non-convex regions:</strong> negative eigenvalues → wrong direction</li>
        <li><strong>Line search provides damping:</strong> reduces to gradient descent if needed</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-blue-800 mb-2">Current Method: Armijo Backtracking</h3>
      <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
      <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
      <p className="text-sm mt-2">
        Where <InlineMath>c_1 = </InlineMath>{newtonC1.toFixed(4)} controls how much decrease we require.
      </p>

      <div className="mt-3">
        <p className="font-semibold">Backtracking Algorithm:</p>
        <ol className="list-decimal ml-6 space-y-1 text-sm">
          <li>Start with <InlineMath>\alpha = 1</InlineMath> (full Newton step)</li>
          <li>Check if Armijo condition satisfied</li>
          <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
          <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
        </ol>
      </div>

      <p className="text-sm mt-3">
        <strong>Why it works:</strong> Near the minimum with positive definite Hessian,
        <InlineMath>\alpha = 1</InlineMath> is usually accepted. Far away or in
        problematic regions, backtracking provides safety.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Test in browser**

Expected: Line Search Details section with proper math

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Line Search Details section"
```

---

## Task 15: Add Newton Pedagogical Content - Try This (Placeholder)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add Try This section (experiments will be wired up later)**

```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={true}
  storageKey="newton-try-this"
>
  <div className="space-y-3">
    <p className="text-gray-800 mb-4">
      Run these experiments to see when Newton's method excels and when it struggles:
    </p>

    <div className="space-y-3">
      <div className="border border-blue-200 rounded p-3 bg-blue-50">
        <div className="flex items-start gap-2">
          <button className="text-blue-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-blue-900">Success: Strongly Convex Quadratic</p>
            <p className="text-sm text-gray-700">
              Watch quadratic convergence in 1-2 iterations on a simple bowl
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: All eigenvalues positive, α=1 accepted, dramatic loss drop
            </p>
          </div>
        </div>
      </div>

      <div className="border border-red-200 rounded p-3 bg-red-50">
        <div className="flex items-start gap-2">
          <button className="text-red-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-red-900">Failure: Non-Convex Saddle Point</p>
            <p className="text-sm text-gray-700">
              Start near saddle to see negative eigenvalues and wrong direction
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Negative eigenvalue, Newton direction points wrong way
            </p>
          </div>
        </div>
      </div>

      <div className="border border-green-200 rounded p-3 bg-green-50">
        <div className="flex items-start gap-2">
          <button className="text-green-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-green-900">Fixed: Line Search Rescue</p>
            <p className="text-sm text-gray-700">
              Same non-convex problem but line search prevents divergence
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Backtracking reduces α, acts like damped Newton
            </p>
          </div>
        </div>
      </div>

      <div className="border border-purple-200 rounded p-3 bg-purple-50">
        <div className="flex items-start gap-2">
          <button className="text-purple-600 font-bold text-lg">▶</button>
          <div>
            <p className="font-semibold text-purple-900">Compare: Newton vs GD on Ill-Conditioned</p>
            <p className="text-sm text-gray-700">
              Elongated ellipse (κ=100) where GD zig-zags but Newton excels
            </p>
            <p className="text-xs text-gray-600 mt-1 italic">
              Observe: Newton converges in ~5 iterations (GD would take 100+)
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-4">
      Note: One-click experiment loading coming soon!
    </p>
  </div>
</CollapsibleSection>
```

**Step 2: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Try This section with experiment placeholders"
```

---

## Task 16: Add Newton Pedagogical Content - When Things Go Wrong

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add When Things Go Wrong section**

```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="newton-when-wrong"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

      <div className="space-y-3">
        <div>
          <p className="font-semibold">❌ "Newton always converges faster than gradient descent"</p>
          <p className="text-sm ml-6">
            ✓ Only near a local minimum with positive definite Hessian<br/>
            ✓ Can diverge or fail in non-convex regions without line search
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "The Hessian tells you the direction to the minimum"</p>
          <p className="text-sm ml-6">
            ✓ <InlineMath>-H^{-1}\nabla f</InlineMath> is the Newton direction, not just <InlineMath>H</InlineMath><br/>
            ✓ If H not positive definite, may not be a descent direction
          </p>
        </div>

        <div>
          <p className="font-semibold">❌ "Newton's method always finds the global minimum"</p>
          <p className="text-sm ml-6">
            ✓ Only for convex functions<br/>
            ✓ Non-convex: converges to local minimum or saddle point
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
      <ul className="space-y-2">
        <li>
          <strong>Strongly convex:</strong> Quadratic convergence guaranteed,
          H positive definite everywhere
        </li>
        <li>
          <strong>Convex:</strong> H positive semidefinite, converges to global minimum
        </li>
        <li>
          <strong>Non-convex:</strong> May converge to local minimum or saddle point,
          H can have negative eigenvalues
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Negative eigenvalues</strong> → add line search, consider modified Newton (H + λI)
        </li>
        <li>
          <strong>Slow convergence</strong> → may be far from minimum (quadratic approximation poor)
        </li>
        <li>
          <strong>Numerical issues</strong> → Hessian ill-conditioned, use iterative solvers or quasi-Newton
        </li>
        <li>
          <strong>High cost</strong> → n too large, switch to L-BFGS
        </li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add When Things Go Wrong section"
```

---

## Task 17: Add Newton Pedagogical Content - Mathematical Derivations

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add Mathematical Derivations section**

```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="newton-math-derivations"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Taylor Expansion</h3>
      <p>Approximate f locally as quadratic:</p>
      <BlockMath>
        f(w+p) = f(w) + \nabla f(w)^T p + \frac{1}{2}p^T H(w) p + O(\|p\|^3)
      </BlockMath>
      <p className="text-sm mt-2">
        This is a second-order approximation using the Hessian matrix.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Deriving Newton Direction</h3>
      <p>Minimize the quadratic approximation over p:</p>
      <BlockMath>
        \nabla_p \left[ f(w) + \nabla f^T p + \frac{1}{2}p^T H p \right] = \nabla f + Hp = 0
      </BlockMath>
      <p>Therefore:</p>
      <BlockMath>Hp = -\nabla f</BlockMath>
      <p>Newton direction:</p>
      <BlockMath>p = -H^{-1}\nabla f</BlockMath>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          At minimum of quadratic function, this gives <strong>exact solution in one step</strong>
        </li>
        <li>
          Near a minimum, f behaves like quadratic → <strong>fast convergence</strong>
        </li>
        <li>
          Uses curvature information to <strong>scale gradient properly</strong> in each direction
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
      <p><strong>Quadratic convergence:</strong></p>
      <BlockMath>
        \|e_{k+1}\| \leq C\|e_k\|^2
      </BlockMath>
      <p className="text-sm mt-2">
        where <InlineMath>e_k = w_k - w^*</InlineMath> is the error.
        Error <strong>squared</strong> at each iteration (very fast near solution).
      </p>
      <p className="text-sm mt-2">
        <strong>Requires:</strong> strong convexity, Lipschitz continuous Hessian,
        starting close enough to <InlineMath>w^*</InlineMath>
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-indigo-800 mb-2">Proof Sketch</h3>
      <ol className="list-decimal ml-6 space-y-1 text-sm">
        <li>Taylor expand f(w_k) and f(w*) around w_k</li>
        <li>Use Newton update rule to relate w_{k+1} and w_k</li>
        <li>Bound error using Hessian Lipschitz constant</li>
        <li>Show error term is quadratic in current error</li>
      </ol>
      <p className="text-xs text-gray-600 mt-2">
        Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues.
      </p>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Mathematical Derivations section"
```

---

## Task 18: Add Newton Pedagogical Content - Advanced Topics

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add Advanced Topics section**

```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="newton-advanced"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li><strong>Computing Hessian H:</strong> O(n²) operations and memory</li>
        <li><strong>Solving Hp = -∇f:</strong> O(n³) with direct methods (Cholesky, LU)</li>
        <li><strong>Total per iteration:</strong> O(n³) time, O(n²) space</li>
        <li><strong>For n=1000:</strong> ~1 billion operations per iteration</li>
      </ul>
      <p className="text-sm mt-2 italic">
        This is why Newton's method becomes impractical for large-scale problems,
        motivating quasi-Newton methods like L-BFGS.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Condition Number and Convergence</h3>
      <p>Condition number: <InlineMath>\kappa = \lambda_{max}/\lambda_{min}</InlineMath></p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Large κ → elongated level sets (ill-conditioned)</li>
        <li>Newton handles ill-conditioning <strong>better than gradient descent</strong></li>
        <li>But numerical stability suffers with very large κ</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Modified Newton Methods</h3>

      <div className="mt-2">
        <p className="font-semibold">Levenberg-Marquardt:</p>
        <BlockMath>p = -(H + \lambda I)^{-1}\nabla f</BlockMath>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>Adds regularization to make H positive definite</li>
          <li>λ=0: pure Newton; λ→∞: gradient descent</li>
          <li>Interpolates between methods based on trust</li>
        </ul>
      </div>

      <div className="mt-3">
        <p className="font-semibold">Eigenvalue Modification:</p>
        <p className="text-sm">Replace negative eigenvalues with small positive values</p>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Inexact Newton</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Solve Hp = -∇f <strong>approximately</strong> using iterative methods</li>
        <li>Use Conjugate Gradient (CG) for large problems</li>
        <li>Reduces O(n³) to O(n²) or better</li>
        <li>Still achieves superlinear convergence with loose tolerances</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Trust Region Methods</h3>
      <p>Alternative to line search:</p>
      <BlockMath>
        \min_p \; f(w) + \nabla f^T p + \frac{1}{2}p^T H p \quad \text{s.t.} \; \|p\| \leq \Delta
      </BlockMath>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li>Constrain step to trust region of radius Δ</li>
        <li>Adjust Δ based on agreement between model and actual function</li>
        <li>More robust in non-convex settings</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-purple-800 mb-2">Quasi-Newton Preview</h3>
      <p>Key insight: Newton requires exact Hessian (expensive)</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Quasi-Newton approximates H or H⁻¹ from gradients</li>
        <li>Builds up curvature information over iterations</li>
        <li>Next algorithm: <strong>L-BFGS</strong> (Limited-memory BFGS)</li>
        <li>O(mn) cost instead of O(n³), where m ≈ 5-20</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(newton): add Advanced Topics section"
```

---

## Task 19: Add L-BFGS Pedagogical Content - Quick Start

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (L-BFGS section, around line 1623)

**Step 1: Replace L-BFGS "Why L-BFGS?" section with Quick Start**

Find L-BFGS section (around line 1623-1656) and replace with:

```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={true}
  storageKey="lbfgs-quick-start"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">The Core Idea</h3>
      <p>
        Newton's method uses <InlineMath>H^{-1}\nabla f</InlineMath> for smarter steps,
        but computing H costs O(n³). <strong>L-BFGS approximates</strong>{' '}
        <InlineMath>H^{-1}\nabla f</InlineMath> using only recent gradient changes—no
        Hessian computation needed.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">The Algorithm</h3>
      <ol className="list-decimal ml-6 space-y-1">
        <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
        <li>
          Use <strong>two-loop recursion</strong> to compute{' '}
          <InlineMath>p \approx -H^{-1}\nabla f</InlineMath> from M recent (s,y) pairs
        </li>
        <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
        <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
        <li>
          Store new pair: <InlineMath>s = \alpha p</InlineMath> (parameter change),{' '}
          <InlineMath>y = \nabla f_{new} - \nabla f_{old}</InlineMath> (gradient change)
        </li>
        <li>Keep only M most recent pairs (discard oldest)</li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Key Idea</h3>
      <p>
        <InlineMath>(s, y)</InlineMath> pairs implicitly capture curvature: "when we moved
        by <InlineMath>s</InlineMath>, the gradient changed by <InlineMath>y</InlineMath>".
      </p>
      <p className="mt-2">
        The <strong>two-loop recursion</strong> transforms <InlineMath>\nabla f</InlineMath>{' '}
        into <InlineMath>p \approx -H^{-1}\nabla f</InlineMath> using only these pairs.
      </p>
      <p className="mt-2 font-semibold">No Hessian matrix ever computed or stored!</p>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">When to Use</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Large problems (n &gt; 1000 parameters)</li>
        <li>Memory constrained environments</li>
        <li>Smooth, differentiable objectives</li>
        <li>When Newton too expensive, gradient descent too slow</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Key Parameters</h3>
      <p>
        <strong>M = memory size</strong> (typically 5-20)
      </p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Larger M = better Hessian approximation but more computation</li>
        <li>M=10 often works well in practice</li>
      </ul>
    </div>

    <div className="bg-amber-100 rounded p-3">
      <p className="font-bold text-sm">Assumptions:</p>
      <ul className="text-sm list-disc ml-6">
        <li>f is differentiable</li>
        <li>Gradients are Lipschitz continuous (smoothness)</li>
        <li>Convexity helpful but not required</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Test in browser**

Expected: L-BFGS Quick Start section with proper math

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Quick Start pedagogical section"
```

---

## Task 20: Add L-BFGS Pedagogical Content - Visual Guide

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Add L-BFGS Visual Guide after Quick Start**

```tsx
<CollapsibleSection
  title="Visual Guide"
  defaultExpanded={true}
  storageKey="lbfgs-visual-guide"
>
  <div className="space-y-4 text-gray-800">
    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Parameter Space</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Trajectory takes <strong>Newton-like steps</strong> without computing Hessian</li>
        <li>Steps adapt to problem curvature using history</li>
        <li>Converges <strong>faster than gradient descent</strong>, nearly as fast as Newton</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Memory Pairs Visualization</h3>
      <p>Recent <InlineMath>(s, y)</InlineMath> pairs shown as arrows:</p>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <InlineMath>s</InlineMath> = where we moved (parameter change)
        </li>
        <li>
          <InlineMath>y</InlineMath> = how gradient changed (curvature signal)
        </li>
        <li>Older pairs fade out as new ones replace them</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Two-Loop Recursion</h3>
      <p>Step-by-step transformation:</p>
      <BlockMath>q = \nabla f \;\rightarrow\; \ldots \;\rightarrow\; p \approx -H^{-1}\nabla f</BlockMath>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li><strong>Backward loop:</strong> process pairs from newest to oldest</li>
        <li><strong>Forward loop:</strong> reconstruct from oldest to newest</li>
        <li>Shows how gradient gets transformed using memory</li>
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-amber-800 mb-2">Line Search Panel</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>Similar to Newton: often accepts large steps</li>
        <li>
          <InlineMath>\alpha &lt; 1</InlineMath> when approximation quality poor or
          far from minimum
        </li>
        <li>Armijo condition ensures progress</li>
      </ul>
    </div>
  </div>
</CollapsibleSection>
```

**Step 2: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(lbfgs): add Visual Guide section"
```

---

*Due to length constraints, I'll provide a summary of remaining tasks. Each follows the same pattern: locate section in UnifiedVisualizer.tsx, add CollapsibleSection with content, commit.*

## Remaining Tasks Summary

**Task 21:** L-BFGS Line Search Details (similar to Newton's)
**Task 22:** L-BFGS Try This (4 experiment placeholders)
**Task 23:** L-BFGS When Things Go Wrong (misconceptions, convexity, troubleshooting)
**Task 24:** L-BFGS Mathematical Derivations (secant equation, BFGS update, two-loop recursion)
**Task 25:** L-BFGS Advanced Topics (complexity, memory tradeoffs, extensions)

**Task 26:** Refactor GD Fixed Step to new structure (convert existing sections to match new pattern)
**Task 27:** Refactor GD Line Search to new structure (with pluggable line search subsection)

**Task 28:** Build & test full implementation
**Task 29:** Final commit

---

## Execution Options

Plan saved. Ready to execute!

**Would you prefer:**

1. **Subagent-Driven Development** (this session) - I dispatch fresh subagent per task, review between tasks
2. **Parallel Session** - Open new session with executing-plans for batch execution

Which approach?
