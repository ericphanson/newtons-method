# Newton's Method Codebase: Problem Definition and Integration Survey

## Executive Summary

This codebase supports both **2D pure optimization problems** (quadratic, Rosenbrock, saddle) and **3D dataset-based classification problems** (logistic regression, separating hyperplane). Problems are defined via a registry system with factory functions for parameterization. Integration points exist across type definitions, UI components, algorithms, and visualization.

---

## 1. Problem Types and Structure

### 1.1 ProblemType Definition
**File:** `/Users/eph/newtons-method/src/types/experiments.ts`

```typescript
export type ProblemType =
  | 'logistic-regression'        // 3D dataset-based
  | 'quadratic'                  // 2D pure optimization (parametrized by rotation angle)
  | 'ill-conditioned-quadratic'  // 2D pure optimization (parametrized by condition number)
  | 'rosenbrock'                 // 2D pure optimization (parametrized by steepness b)
  | 'non-convex-saddle'          // 2D pure optimization
  | 'separating-hyperplane';     // 3D dataset-based (with variant: soft-margin|perceptron|squared-hinge)
```

### 1.2 ProblemDefinition Interface
**File:** `/Users/eph/newtons-method/src/types/experiments.ts`

```typescript
export interface ProblemDefinition {
  name: string;                              // Human-readable name
  objective: (w: number[]) => number;        // f(w): compute loss/objective
  gradient: (w: number[]) => number[];       // ∇f(w): compute gradient
  hessian?: (w: number[]) => number[][];     // H(w): compute Hessian (optional, for Newton)
  domain: {
    w0: [number, number];                    // Domain bounds for visualization
    w1: [number, number];
  };
  description: string;                       // Technical description
  globalMinimum?: [number, number];          // Analytical global minimum (if exists)
  criticalPoint?: [number, number];          // Saddle point or special critical point
}
```

**Key Insight:** 
- All 2D problems must define `domain`, `description`, `objective`, `gradient`
- Hessian is optional but required for Newton's method
- 3D dataset-based problems (logistic, separating hyperplane) don't use the registry; they're created dynamically

---

## 2. Problem Registry and Storage

### 2.1 Problem Definitions Directory
**Location:** `/Users/eph/newtons-method/src/problems/`

```
problems/
├── index.ts                    # Registry and getProblem() function
├── quadratic.ts               # Quadratic bowl (well-conditioned)
├── rosenbrock.ts              # Rosenbrock banana function
└── saddle.ts                  # Non-convex saddle point
```

### 2.2 Problem Registry
**File:** `/Users/eph/newtons-method/src/problems/index.ts`

```typescript
export const problemRegistry: Record<string, ProblemDefinition> = {
  'quadratic': quadraticProblem,
  'ill-conditioned-quadratic': illConditionedQuadratic,
  'rosenbrock': rosenbrockProblem,
  'non-convex-saddle': saddleProblem,
};

export function getProblem(type: string): ProblemDefinition | undefined {
  return problemRegistry[type];
}

// Factory functions for parametrized problems
export { 
  createRotatedQuadratic,              // parametrized by θ (rotation angle)
  createIllConditionedQuadratic,       // parametrized by κ (condition number)
  createRosenbrockProblem              // parametrized by b (steepness)
};
```

---

## 3. Example Problems: Implementation Pattern

### 3.1 Example 1: Simple Quadratic (Static Instance)
**File:** `/Users/eph/newtons-method/src/problems/quadratic.ts`

```typescript
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  description: 'Simple quadratic bowl: f(w) = w0^2 + w1^2 (well-conditioned)',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 2 * w1];
  },

  hessian: (_w: number[]): number[][] => {
    return [[2, 0], [0, 2]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },

  globalMinimum: [0, 0],
};
```

### 3.2 Example 2: Rosenbrock (Factory Function)
**File:** `/Users/eph/newtons-method/src/problems/rosenbrock.ts`

```typescript
export function createRosenbrockProblem(b: number = 100): ProblemDefinition {
  return {
    name: 'Rosenbrock Function',
    description: `Non-convex banana valley (b=${b}), global minimum at (1,1)`,

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return Math.pow(1 - w0, 2) + b * Math.pow(w1 - w0 * w0, 2);
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      const dw0 = -2 * (1 - w0) - 4 * b * w0 * (w1 - w0 * w0);
      const dw1 = 2 * b * (w1 - w0 * w0);
      return [dw0, dw1];
    },

    hessian: (w: number[]): number[][] => {
      const [w0, w1] = w;
      const h00 = 2 + 12 * b * w0 * w0 - 4 * b * w1;
      const h01 = -4 * b * w0;
      const h10 = -4 * b * w0;
      const h11 = 2 * b;
      return [[h00, h01], [h10, h11]];
    },

    domain: {
      w0: [-2, 2],
      w1: [-1, 3],
    },

    globalMinimum: [1, 1],
  };
}

// Default instance for backward compatibility
export const rosenbrockProblem: ProblemDefinition = createRosenbrockProblem(100);
```

### 3.3 Dataset-Based: Logistic Regression (3D)
**File:** `/Users/eph/newtons-method/src/utils/logisticRegression.ts`

```typescript
export function logisticObjective(
  w: number[],
  dataPoints: DataPoint[],
  lambda: number
): number {
  const [w0, w1, w2] = w;  // w2 is bias
  let loss = 0;

  for (const point of dataPoints) {
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const pred = sigmoid(z);
    const clippedPred = clip(pred, 1e-15, 1 - 1e-15);
    loss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));
  }

  loss = loss / dataPoints.length + (lambda / 2) * (w0 * w0 + w1 * w1);
  return loss;
}

// Plus gradient and hessian implementations...
```

---

## 4. Problem Defaults Configuration

**File:** `/Users/eph/newtons-method/src/utils/problemDefaults.ts`

```typescript
export interface ProblemDefaults {
  gdFixedAlpha: number;                              // Step size for GD
  maxIter: number;                                   // Max iterations
  initialPoint: [number, number] | [number, number, number];
  c1: number;                                        // Armijo condition parameter
  lbfgsM: number;                                    // L-BFGS history size
}

export function getProblemDefaults(problem: string): ProblemDefaults {
  switch (problem) {
    case 'rosenbrock':
      return { 
        gdFixedAlpha: 0.001,  // Steep gradients need tiny steps
        initialPoint: [-0.5, 1.5],
        // ... other defaults
      };
    case 'ill-conditioned-quadratic':
      return { 
        gdFixedAlpha: 0.01,   // Elongated ellipse needs small steps
        initialPoint: [-2, 2],
        // ... other defaults
      };
    case 'separating-hyperplane':
      return { 
        initialPoint: [0.2, 0.2, 0],  // 3D: [w0, w1, bias]
        // ... other defaults
      };
    // ... more cases
  }
}
```

Each problem has optimal defaults for algorithm convergence, plus a descriptive note:

```typescript
export function getProblemNote(problem: string): string {
  switch (problem) {
    case 'rosenbrock':
      return 'Steep gradients - GD needs very small α (try 0.001)';
    // ... more notes
  }
}
```

---

## 5. Problem Adapters: Bridging Definitions and Algorithms

**File:** `/Users/eph/newtons-method/src/utils/problemAdapter.ts`

Converts between `ProblemDefinition` and `ProblemFunctions` (algorithm interface):

```typescript
export interface ProblemFunctions {
  objective: (w: number[]) => number;
  gradient: (w: number[]) => number[];
  hessian?: (w: number[]) => number[][];
  dimensionality: number;  // 2 or 3
}
```

Three adapters handle different problem types:

```typescript
// 1. Pure optimization problems (quadratic, Rosenbrock, saddle)
export function problemToProblemFunctions(problem: ProblemDefinition): ProblemFunctions {
  return {
    objective: problem.objective,
    gradient: problem.gradient,
    hessian: problem.hessian,
    dimensionality: 2,  // All registry problems are 2D
  };
}

// 2. Logistic regression (3D with dataset)
export function logisticRegressionToProblemFunctions(
  data: DataPoint[],
  lambda: number
): ProblemFunctions {
  return {
    objective: (w) => logisticObjective(w, data, lambda),
    gradient: (w) => logisticGradient(w, data, lambda),
    hessian: (w) => logisticHessian(w, data, lambda),
    dimensionality: 3,  // [w0, w1, bias]
  };
}

// 3. Separating hyperplane (3D with dataset, multiple variants)
export function separatingHyperplaneToProblemFunctions(
  data: DataPoint[],
  variant: SeparatingHyperplaneVariant,  // 'soft-margin' | 'perceptron' | 'squared-hinge'
  lambda: number
): ProblemFunctions {
  switch (variant) {
    case 'soft-margin':
      return { objective: SH.softMarginObjective, ... };
    case 'perceptron':
      return { objective: SH.perceptronObjective, ... };
    case 'squared-hinge':
      return { objective: SH.squaredHingeObjective, ... };
  }
}
```

---

## 6. Basin Computation Integration

**File:** `/Users/eph/newtons-method/src/utils/basinComputation.ts`

Basin computation computes convergence behavior for each initial point across a grid:

```typescript
export function computeBasinPoint(
  initialPoint: [number, number] | [number, number, number],
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs',
  algorithmParams: any
): BasinPoint {
  // Run algorithm from initial point
  // Return: convergence status, final location, iterations
}

export function computeBasinIncremental(
  problemFuncs: ProblemFunctions,
  algorithm: string,
  algorithmParams: any,
  bounds: { minW0, maxW0, minW1, maxW1 },
  resolution: number,  // Grid size (e.g., 20x20 = 400 points)
  taskIdRef: any,
  taskId: number,
  onProgress: (completed, total) => void
): Promise<{ data: BasinData; timing: BasinTimingData }>
```

Key integration points:
- Takes any `ProblemFunctions` (2D or 3D)
- Runs algorithms for each grid point
- Visualization in `BasinPicker` component

---

## 7. UI Integration Points

### 7.1 Problem Selection Component
**File:** `/Users/eph/newtons-method/src/components/ProblemConfiguration.tsx`

Problem dropdown with all 6 types:

```tsx
<select value={currentProblem} onChange={(e) => handleProblemChange(e.target.value)}>
  <option value="logistic-regression">Logistic Regression</option>
  <option value="quadratic">Quadratic Bowl</option>
  <option value="ill-conditioned-quadratic">Ill-Conditioned Quadratic</option>
  <option value="rosenbrock">Rosenbrock Function</option>
  <option value="non-convex-saddle">Saddle Point</option>
  <option value="separating-hyperplane">Separating Hyperplane</option>
</select>
```

Rendering of problem-specific parameters:

```tsx
// Rotation angle for quadratic
{currentProblem === 'quadratic' && (
  <input type="range" min="0" max="90" value={rotationAngle} 
    onChange={(e) => onRotationAngleChange(parseFloat(e.target.value))} />
)}

// Condition number for ill-conditioned quadratic
{currentProblem === 'ill-conditioned-quadratic' && (
  <input type="range" min="0" max="3" step="0.1" value={Math.log10(conditionNumber)} 
    onChange={(e) => onConditionNumberChange(Math.pow(10, parseFloat(e.target.value)))} />
)}

// Steepness for Rosenbrock
{currentProblem === 'rosenbrock' && (
  <input type="range" min="1" max="3" step="0.1" value={Math.log10(rosenbrockB)} 
    onChange={(e) => onRosenbrockBChange(Math.pow(10, parseFloat(e.target.value)))} />
)}

// Variant for separating hyperplane
{currentProblem === 'separating-hyperplane' && (
  <select value={separatingHyperplaneVariant} onChange={(e) => onSeparatingHyperplaneVariantChange?.(e.target.value as SeparatingHyperplaneVariant)}>
    <option value="soft-margin">Soft-Margin SVM</option>
    <option value="perceptron">Perceptron</option>
    <option value="squared-hinge">Squared-Hinge</option>
  </select>
)}
```

### 7.2 Main Visualizer Integration
**File:** `/Users/eph/newtons-method/src/UnifiedVisualizer.tsx`

Two critical functions that handle all problem types:

**Function 1: `getCurrentProblem()`** - Returns problem definition with metadata:
```typescript
const getCurrentProblem = useCallback(() => {
  if (currentProblem === 'logistic-regression') {
    return { 
      name: 'Logistic Regression',
      objective: (w) => logisticObjective(w, data, lambda),
      gradient: (w) => logisticGradient(w, data, lambda),
      hessian: (w) => logisticHessian(w, data, lambda),
      dimensionality: 3,
    };
  } else if (currentProblem === 'quadratic') {
    const problem = createRotatedQuadratic(rotationAngle);  // Parametrized!
    return { ...problem, dimensionality: 2 };
  } else if (currentProblem === 'ill-conditioned-quadratic') {
    const problem = createIllConditionedQuadratic(conditionNumber);  // Parametrized!
    return { ...problem, dimensionality: 2 };
  } else if (currentProblem === 'rosenbrock') {
    const problem = createRosenbrockProblem(rosenbrockB);  // Parametrized!
    return { ...problem, dimensionality: 2 };
  } else if (currentProblem === 'separating-hyperplane') {
    const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(
      data, separatingHyperplaneVariant, lambda
    );
    return {
      name: 'Separating Hyperplane',
      objective, gradient, hessian,
      dimensionality: 3,
    };
  } else {
    const problem = getProblem(currentProblem);  // From registry
    return { ...problem, dimensionality: 2 };
  }
}, [currentProblem, data, lambda, rotationAngle, conditionNumber, rosenbrockB, separatingHyperplaneVariant]);
```

**Function 2: `getCurrentProblemFunctions()`** - Returns algorithm-compatible functions:
```typescript
const getCurrentProblemFunctions = useCallback((): ProblemFunctions => {
  // Same logic as getCurrentProblem but returns adapted format for algorithms
  if (currentProblem === 'logistic-regression') {
    return logisticRegressionToProblemFunctions(data, lambda);
  }
  // ... etc
}, [currentProblem, data, lambda, rotationAngle, conditionNumber, rosenbrockB, separatingHyperplaneVariant]);
```

Key insight: Both functions appear in dependency arrays of algorithm `useEffect` hooks, so changing problem triggers algorithm recomputation.

---

## 8. Experiment Presets (Problem + Hyperparameters)

**Files:**
- `/Users/eph/newtons-method/src/experiments/index.ts` (registry)
- `/Users/eph/newtons-method/src/experiments/newton-presets.ts` (example)
- `/Users/eph/newtons-method/src/experiments/gd-fixed-presets.ts`
- `/Users/eph/newtons-method/src/experiments/gd-linesearch-presets.ts`
- `/Users/eph/newtons-method/src/experiments/lbfgs-presets.ts`

```typescript
export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  problem: ProblemType;                        // References problem type
  dataset?: DataPoint[];                       // For logistic regression
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant;  // For separating hyperplane
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number;
    maxIter?: number;
    hessianDamping?: number;
    lineSearch?: 'armijo' | 'none';
  };
  initialPoint?: [number, number] | [number, number, number];
  expectation: string;
  comparisonConfig?: { left: any; right: any };
}
```

Example preset:
```typescript
{
  id: 'newton-compare',
  name: 'Compare: Newton vs GD',
  description: 'Side-by-side: Newton method vs gradient descent',
  problem: 'ill-conditioned-quadratic',
  hyperparameters: { c1: 0.0001, lambda: 0, maxIter: 200 },
  initialPoint: [0.3, 2.5],
  expectation: 'Observe: Newton converges in ~5 iterations, GD would take 100+',
}
```

---

## 9. Complete Integration Map: WHERE TO UPDATE WHEN ADDING A NEW PROBLEM

### 9.1 Core Problem Definition
- [ ] **Create problem file** in `/Users/eph/newtons-method/src/problems/`
  - Example: `new-problem.ts`
  - Must export `ProblemDefinition` or factory function
  - Must implement: `name`, `description`, `objective`, `gradient`, `hessian` (if Newton), `domain`, `globalMinimum?`

- [ ] **Register in problem index** at `/Users/eph/newtons-method/src/problems/index.ts`
  ```typescript
  import { newProblem } from './new-problem';
  
  export const problemRegistry: Record<string, ProblemDefinition> = {
    // ... existing
    'new-problem': newProblem,  // Add here
  };
  ```

### 9.2 Type System Updates
- [ ] **Update ProblemType** in `/Users/eph/newtons-method/src/types/experiments.ts`
  ```typescript
  export type ProblemType =
    | 'logistic-regression'
    | 'quadratic'
    | 'ill-conditioned-quadratic'
    | 'rosenbrock'
    | 'non-convex-saddle'
    | 'separating-hyperplane'
    | 'new-problem';  // Add here
  ```

### 9.3 Problem Defaults
- [ ] **Add problem defaults** in `/Users/eph/newtons-method/src/utils/problemDefaults.ts`
  ```typescript
  export function getProblemDefaults(problem: string): ProblemDefaults {
    switch (problem) {
      // ... existing cases
      case 'new-problem':
        return {
          gdFixedAlpha: 0.1,
          maxIter: 200,
          initialPoint: [-1, 1],
          c1: 0.0001,
          lbfgsM: 5
        };
    }
  }

  export function getProblemNote(problem: string): string {
    switch (problem) {
      // ... existing cases
      case 'new-problem':
        return 'Description of problem characteristics for users';
    }
  }
  ```

### 9.4 UI Integration
- [ ] **Update problem dropdown** in `/Users/eph/newtons-method/src/components/ProblemConfiguration.tsx`
  ```tsx
  <select value={currentProblem} onChange={(e) => handleProblemChange(e.target.value)}>
    {/* ... existing */}
    <option value="new-problem">New Problem Name</option>
  </select>
  ```

- [ ] **Add problem-specific parameters section** (if needed) in `ProblemConfiguration.tsx`
  ```tsx
  {currentProblem === 'new-problem' && (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>
      {/* Add sliders for any parametrized variants */}
    </div>
  )}
  ```

### 9.5 Main Visualizer Integration
- [ ] **Update `getCurrentProblem()` function** in `/Users/eph/newtons-method/src/UnifiedVisualizer.tsx`
  ```typescript
  } else if (currentProblem === 'new-problem') {
    const problem = getProblem('new-problem');
    return {
      ...problem,
      requiresDataset: false,  // true only for logistic/separating hyperplane
      dimensionality: 2,  // or 3 for dataset-based
    };
  ```

- [ ] **Update `getCurrentProblemFunctions()` function** in `/Users/eph/newtons-method/src/UnifiedVisualizer.tsx`
  ```typescript
  } else if (currentProblem === 'new-problem') {
    const problem = getProblem('new-problem');
    return problemToProblemFunctions(problem);
  ```

- [ ] **Import new problem** at top of `UnifiedVisualizer.tsx` (if factory function)
  ```typescript
  import { getProblem, createRotatedQuadratic, ..., createNewProblem } from './problems';
  ```

### 9.6 Problem Explainer (Documentation)
- [ ] **Add problem description** in `/Users/eph/newtons-method/src/components/ProblemExplainer.tsx`
  - Add a section explaining the new problem's mathematical formulation, difficulty, and expected algorithm behavior

### 9.7 Experiment Presets (Optional)
- [ ] **Create presets** in `/Users/eph/newtons-method/src/experiments/` for each algorithm
  - Create `new-problem-presets.ts` or add to existing preset files
  - Register in `/Users/eph/newtons-method/src/experiments/index.ts`

### 9.8 Python Validation (Optional)
- [ ] **Add Python implementation** in `/Users/eph/newtons-method/python/problems.py`
  ```python
  def new_problem() -> Problem:
      def objective(w: np.ndarray) -> float:
          # Implementation
      def gradient(w: np.ndarray) -> np.ndarray:
          # Implementation
      def hessian(w: np.ndarray) -> np.ndarray:
          # Implementation
      return Problem("new-problem", objective, gradient, hessian)
  ```

---

## 10. Checklist for Adding a New Problem

Use this checklist when implementing a new problem:

```
CORE IMPLEMENTATION:
- [ ] Create problem definition file in /src/problems/
- [ ] Implement objective(w): number
- [ ] Implement gradient(w): number[]
- [ ] Implement hessian(w): number[][] (for Newton support)
- [ ] Define domain: { w0: [min, max], w1: [min, max] }
- [ ] Set globalMinimum or criticalPoint if applicable
- [ ] Export ProblemDefinition instance

REGISTRATION & TYPES:
- [ ] Add to problemRegistry in /src/problems/index.ts
- [ ] Add to ProblemType union in /src/types/experiments.ts
- [ ] Add to problemAdapter imports (if needed)

CONFIGURATION:
- [ ] Add problem defaults in /src/utils/problemDefaults.ts (getProblemDefaults)
- [ ] Add problem note in /src/utils/problemDefaults.ts (getProblemNote)

UI INTEGRATION:
- [ ] Add option to problem dropdown in ProblemConfiguration.tsx
- [ ] Add problem-specific parameters section (if parametrized)
- [ ] Update getCurrentProblem() in UnifiedVisualizer.tsx
- [ ] Update getCurrentProblemFunctions() in UnifiedVisualizer.tsx
- [ ] Update ProblemExplainer.tsx with documentation

VALIDATION:
- [ ] Add Python implementation in python/problems.py (optional but recommended)
- [ ] Test: Problem loads and renders in UI
- [ ] Test: All algorithms run with new problem
- [ ] Test: Basin of convergence computes correctly
- [ ] Verify gradient numerically (if new problem)
- [ ] Verify Hessian numerically (if new problem)

OPTIONAL:
- [ ] Create experiment presets in /src/experiments/
- [ ] Register presets in /src/experiments/index.ts
```

---

## 11. Current Problems: Detailed Implementation

### 11.1 Quadratic (with Rotation)
**File:** `/Users/eph/newtons-method/src/problems/quadratic.ts`

**Features:**
- Simple quadratic: f(w) = w0^2 + w1^2 or rotated version
- Factory function: `createRotatedQuadratic(θ)`
- Parametrization: rotation angle θ (0°-90°)
- UI: Slider to adjust rotation
- Learning point: Shows rotation invariance of second-order methods

**Structure:**
- Static instance: `quadraticProblem` (θ=0°)
- Factory: `createRotatedQuadratic(thetaDegrees)` returns ProblemDefinition with θ applied
- Hessian: Constant, depends on θ and condition number κ=5

### 11.2 Ill-Conditioned Quadratic
**File:** `/Users/eph/newtons-method/src/problems/quadratic.ts`

**Features:**
- Elongated ellipse: f(w) = w0^2 + κ*w1^2
- Factory function: `createIllConditionedQuadratic(κ)`
- Parametrization: condition number κ (1-1000)
- UI: Slider to adjust κ (log scale)
- Learning point: Shows how condition number affects GD zig-zagging

### 11.3 Rosenbrock
**File:** `/Users/eph/newtons-method/src/problems/rosenbrock.ts`

**Features:**
- Classic non-convex: f(w) = (1-w0)^2 + b(w1-w0^2)^2
- Factory function: `createRosenbrockProblem(b)`
- Parametrization: valley steepness b (10-1000)
- UI: Slider to adjust b (log scale)
- Default: b=100 with starting point [-0.5, 1.5]
- Learning point: First-order methods struggle with steep gradients

### 11.4 Saddle Point
**File:** `/Users/eph/newtons-method/src/problems/saddle.ts`

**Features:**
- Non-convex saddle: f(w) = w0^2 - w1^2
- No parameters; fixed function
- Hessian eigenvalues: +2, -2 (indicating saddle)
- globalMinimum: undefined (unbounded below)
- criticalPoint: [0, 0] (saddle point)
- Learning point: First-order methods get stuck; second-order methods can detect via negative eigenvalue

### 11.5 Logistic Regression (3D Dataset-based)
**File:** `/Users/eph/newtons-method/src/utils/logisticRegression.ts`

**Features:**
- 3D optimization: w = [w0, w1, w2] (w2 is bias)
- Dataset-dependent: Uses data points with labels {0, 1}
- Parametrization: regularization λ
- Objective: Binary cross-entropy + L2 regularization
- Dynamic: Not in registry; created on-the-fly based on data and λ

**Integration:**
- Custom data input via canvas in ProblemConfiguration
- Dynamic problem definition in getCurrentProblem()
- Adapter: `logisticRegressionToProblemFunctions(data, lambda)`

### 11.6 Separating Hyperplane (3D Dataset-based, Variant)
**File:** `/Users/eph/newtons-method/src/utils/separatingHyperplane.ts`

**Features:**
- 3D optimization: w = [w0, w1, w2] (w2 is bias)
- Three variants via `SeparatingHyperplaneVariant` type:
  - `'soft-margin'`: Hinge loss with regularized norm
  - `'perceptron'`: Perceptron loss with regularization
  - `'squared-hinge'`: Smooth hinge loss
- Dataset-dependent, parametrized by λ
- Dynamic: Created on-the-fly based on data and variant

**Integration:**
- Variant selector in ProblemConfiguration
- Dynamic problem definition in getCurrentProblem()
- Adapter: `separatingHyperplaneToProblemFunctions(data, variant, lambda)`

---

## 12. Special Cases: Parametrized Problems

Problems with parameters get special handling:

### State in UnifiedVisualizer
```typescript
const [rotationAngle, setRotationAngle] = useState(0);
const [conditionNumber, setConditionNumber] = useState(100);
const [rosenbrockB, setRosenbrockB] = useState(100);
const [separatingHyperplaneVariant, setSeparatingHyperplaneVariant] = useState<SeparatingHyperplaneVariant>('soft-margin');
```

### Dependency Management
Both `getCurrentProblem()` and `getCurrentProblemFunctions()` include parameters in dependencies:
```typescript
}, [currentProblem, data, lambda, rotationAngle, conditionNumber, rosenbrockB, separatingHyperplaneVariant]);
```

When parameter changes, both functions recompute → algorithms rerun automatically

### UI Sliders
Problem-specific parameters get sliders in `ProblemConfiguration.tsx`:
- Rotation angle: 0°-90° in 5° steps
- Condition number: log scale (10^0 to 10^3)
- Rosenbrock b: log scale (10^1 to 10^3)
- SH variant: dropdown (3 options)

---

## 13. 2D vs 3D: Dimensionality Handling

### 2D Problems (Pure Optimization)
- Registry problems: quadratic, ill-conditioned-quadratic, Rosenbrock, saddle
- Initial point: 2D [w0, w1]
- Visualization: Full parameter space
- Basin computation: 20x20 grid in 2D

### 3D Problems (Dataset-based)
- Logistic regression and separating hyperplane
- Initial point: 3D [w0, w1, bias]
- Visualization: 2D slice at fixed bias value
- Basin computation: 2D grid slice at current bias value
- Bias slider: Adjust the slice being visualized

**Key file:** `/Users/eph/newtons-method/src/components/BasinPicker.tsx` (lines 318-323)
```typescript
if (problemFuncs.dimensionality === 3) {
  onInitialPointChange([w0, w1, algorithmParams.biasSlice || 0]);
} else {
  onInitialPointChange([w0, w1]);
}
```

---

## 14. Python Validation Suite

**File:** `/Users/eph/newtons-method/python/problems.py`

Parallel implementations for numerical verification:

```python
class Problem:
    def __init__(self, name, objective, gradient, hessian=None):
        self.name = name
        self.objective = objective
        self.gradient = gradient
        self.hessian = hessian

def quadratic() -> Problem:
    """Matches JS: f(w) = w0^2 + w1^2"""
    def objective(w: np.ndarray) -> float:
        return w[0]**2 + w[1]**2
    # ...
```

All six problems have Python versions for cross-validation.

---

## Summary Table: All Problems and Integration

| Problem | Type | Params | Registry | Adapter | Defaults | Explainer |
|---------|------|--------|----------|---------|----------|-----------|
| Quadratic | Pure 2D | θ (angle) | Yes | problemToProblem... | Yes | Yes |
| Ill-Cond | Pure 2D | κ (condition) | Yes | problemToProblem... | Yes | Yes |
| Rosenbrock | Pure 2D | b (steepness) | Yes | problemToProblem... | Yes | Yes |
| Saddle | Pure 2D | None | Yes | problemToProblem... | Yes | Yes |
| Logistic | Dataset 3D | λ (reg) | No* | logisticRegression... | Yes | Yes |
| SepHyper | Dataset 3D | λ (reg), variant | No* | separatingHyperplane... | Yes | Yes |

*Dataset-based problems created dynamically; not in static registry

---

## Final Checklist: Complete Integration Testing

When adding a new problem, verify:

1. **Problem loads in dropdown** without errors
2. **UI renders correctly** with appropriate parameters/sliders
3. **Each algorithm runs** (GD Fixed, GD LS, Newton, L-BFGS)
4. **Basin of convergence computes** and displays
5. **Gradient is correct** (check with numerical differentiation)
6. **Hessian is correct** (check with numerical differentiation, if applicable)
7. **Defaults are reasonable** (algorithms converge within ~50-200 iterations)
8. **Documentation is present** in ProblemExplainer
9. **Python validation version exists** (optional but recommended)

