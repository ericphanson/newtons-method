# Parametrized Problems Architecture Refactoring

**Date:** 2025-11-10
**Status:** Planning
**Estimated Effort:** 13-19 hours

## Problem Statement

The codebase currently treats parametrized problems as a "bolt-on feature" rather than first-class citizens. This leads to:

- **Broken Problem Registry**: Stores static instances with hardcoded defaults, forcing code to bypass it
- **Duplicate Logic**: 3+ locations with identical if-else chains (getCurrentProblem, getCurrentProblemFunctions, UI display)
- **Incomplete Experiment Support**: Only `rotationAngle` supported in ExperimentPreset, missing `conditionNumber` and `rosenbrockB`
- **Fragmented State**: Each parameter is its own React state variable
- **No Type Safety**: No compile-time connection between problem types and their parameters

### Current Parametrized Problems

1. **Rotated Quadratic** (`quadratic`) - parameter: `rotationAngle` (0-90°)
2. **Ill-Conditioned Quadratic** - parameter: `conditionNumber` (κ, 1-500)
3. **Rosenbrock** - parameter: `rosenbrockB` (b, 10-1000)

### Key Files Affected

- `/workspace/src/types/experiments.ts` - Type definitions
- `/workspace/src/problems/index.ts` - Problem registry
- `/workspace/src/problems/quadratic.tsx` - Parametrized problem
- `/workspace/src/problems/rosenbrock.tsx` - Parametrized problem
- `/workspace/src/UnifiedVisualizer.tsx` - Main component (lines 46-48 state, 188-272 resolution)
- `/workspace/src/components/ProblemConfiguration.tsx` - UI controls (lines 349-448)
- `/workspace/src/experiments/*.ts` - Experiment preset files

---

## Solution Overview

Make the problem registry understand parameters, so every problem (parametrized or not) goes through a unified resolution system.

### Core Components

1. **Parameter-Aware Registry**: Factory functions + metadata in registry entries
2. **Unified Problem State**: `{ type: ProblemType, parameters: Record<string, number | string> }`
3. **Centralized Resolution**: Single `resolveProblem()` function replaces all if-else chains
4. **Auto-Generated UI**: Parameter controls generated from metadata
5. **Generic Experiment Support**: `problemParameters` field works for all problems

---

## Implementation Plan

## Phase 1: Extend Type System (Foundation Layer)

**Goal:** Add new type definitions without breaking existing code
**Estimated Time:** 1-2 hours

### Task 1.1: Define Parameter Metadata Type

**File:** `/workspace/src/types/experiments.ts`
**Location:** After line 81 (after ProblemDefinition interface)
**Action:** Add new interfaces

```typescript
// Parameter metadata for auto-generating UI controls
export interface ParameterMetadata {
  key: string;                    // Parameter identifier (e.g., 'rotationAngle')
  label: string;                  // Display label (e.g., 'Rotation Angle')
  type: 'range' | 'select';       // UI control type
  min?: number;                   // For range inputs
  max?: number;                   // For range inputs
  step?: number;                  // For range inputs
  default: number | string;       // Default value
  unit?: string;                  // Display unit (e.g., '°', '')
  scale?: 'linear' | 'log10';     // Value scaling for slider
  options?: Array<{value: string | number; label: string}>; // For select inputs
  description?: string;           // Tooltip/help text
}

// Problem state with parameters
export interface ProblemState {
  type: ProblemType;
  parameters: Record<string, number | string>;
}

// Registry entry with factory support
export interface ProblemRegistryEntry {
  // Static instance (for non-parametrized problems)
  defaultInstance?: ProblemDefinition;

  // Factory function (for parametrized problems)
  factory?: (parameters: Record<string, number | string>) => ProblemDefinition;

  // Parameter definitions (empty for non-parametrized)
  parameters: ParameterMetadata[];

  // Problem metadata
  displayName: string;
  category?: 'convex' | 'non-convex' | 'classification';
}
```

**Dependencies:** None
**Testing Checkpoint:** TypeScript compilation succeeds

### Task 1.2: Extend ExperimentPreset Type

**File:** `/workspace/src/types/experiments.ts`
**Location:** Lines 45-66 (ExperimentPreset interface)
**Action:** Add new field, mark old fields as deprecated

```typescript
export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
  problem: ProblemType;

  // NEW: Generic parameter support
  problemParameters?: Record<string, number | string>;

  dataset?: DataPoint[];
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant;

  // DEPRECATED: Legacy parameter fields (keep for backward compatibility)
  /** @deprecated Use problemParameters.rotationAngle instead */
  rotationAngle?: number;
  /** @deprecated Use problemParameters.conditionNumber instead */
  conditionNumber?: number;
  /** @deprecated Use problemParameters.rosenbrockB instead */
  rosenbrockB?: number;

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
  ui?: ExperimentUiConfig;
}
```

**Dependencies:** Task 1.1
**Testing Checkpoint:** TypeScript compilation succeeds, no breaking changes

---

## Phase 2: Build Parameter-Aware Registry (Core Infrastructure)

**Goal:** Create new registry system alongside old one
**Estimated Time:** 3-4 hours

### Task 2.1: Create New Registry Module

**File:** `/workspace/src/problems/registry.ts` (NEW FILE)
**Action:** Create parameter-aware registry

```typescript
import { ProblemRegistryEntry, ProblemDefinition, ParameterMetadata } from '../types/experiments';
import { quadraticProblem, createRotatedQuadratic } from './quadratic';
import { illConditionedQuadratic, createIllConditionedQuadratic } from './quadratic';
import { rosenbrockProblem, createRosenbrockProblem } from './rosenbrock';
import { saddleProblem } from './saddle';
import { himmelblauProblem } from './himmelblau';
import { threeHumpCamelProblem } from './threeHumpCamel';

/**
 * Parameter-aware problem registry
 * Maps problem type to registry entry with factory and metadata
 */
export const problemRegistryV2: Record<string, ProblemRegistryEntry> = {
  'quadratic': {
    factory: (params) => createRotatedQuadratic((params.rotationAngle as number) || 0),
    parameters: [
      {
        key: 'rotationAngle',
        label: 'Rotation Angle',
        type: 'range',
        min: 0,
        max: 90,
        step: 5,
        default: 0,
        unit: '°',
        scale: 'linear',
        description: 'Rotation of the ellipse axes (0° = aligned, 45° = maximum misalignment)'
      }
    ],
    displayName: 'Rotated Quadratic',
    category: 'convex',
  },

  'ill-conditioned-quadratic': {
    factory: (params) => createIllConditionedQuadratic((params.conditionNumber as number) || 100),
    parameters: [
      {
        key: 'conditionNumber',
        label: 'Condition Number',
        type: 'range',
        min: 1,
        max: 500,
        step: 1,
        default: 100,
        unit: '',
        scale: 'linear',
        description: 'Higher κ creates more elongated ellipses (1 = circle, 500 = extreme elongation)'
      }
    ],
    displayName: 'Ill-Conditioned Quadratic',
    category: 'convex',
  },

  'rosenbrock': {
    factory: (params) => createRosenbrockProblem((params.rosenbrockB as number) || 100),
    parameters: [
      {
        key: 'rosenbrockB',
        label: 'Valley Steepness',
        type: 'range',
        min: 1,
        max: 3,
        step: 0.1,
        default: 100,
        unit: '',
        scale: 'log10',
        description: 'Controls valley steepness (10 = gentle, 1000 = extreme)'
      }
    ],
    displayName: 'Rosenbrock Function',
    category: 'non-convex',
  },

  // Non-parametrized problems
  'non-convex-saddle': {
    defaultInstance: saddleProblem,
    parameters: [],
    displayName: 'Saddle Point',
    category: 'non-convex',
  },

  'himmelblau': {
    defaultInstance: himmelblauProblem,
    parameters: [],
    displayName: "Himmelblau's Function",
    category: 'non-convex',
  },

  'three-hump-camel': {
    defaultInstance: threeHumpCamelProblem,
    parameters: [],
    displayName: 'Three-Hump Camel',
    category: 'non-convex',
  },
};

/**
 * Resolve a problem with given parameters
 * Central resolution function that replaces scattered if-else chains
 */
export function resolveProblem(
  problemType: string,
  parameters: Record<string, number | string> = {}
): ProblemDefinition {
  const entry = problemRegistryV2[problemType];

  if (!entry) {
    throw new Error(`Problem not found in registry: ${problemType}`);
  }

  // Use factory if available, otherwise return static instance
  if (entry.factory) {
    return entry.factory(parameters);
  } else if (entry.defaultInstance) {
    return entry.defaultInstance;
  }

  throw new Error(`Problem registry entry incomplete for: ${problemType}`);
}

/**
 * Get parameter metadata for a problem
 */
export function getProblemParameters(problemType: string): ParameterMetadata[] {
  return problemRegistryV2[problemType]?.parameters || [];
}

/**
 * Get default parameter values for a problem
 */
export function getDefaultParameters(problemType: string): Record<string, number | string> {
  const params = getProblemParameters(problemType);
  const defaults: Record<string, number | string> = {};

  for (const param of params) {
    defaults[param.key] = param.default;
  }

  return defaults;
}

/**
 * Check if a problem has parameters
 */
export function isProblemParametrized(problemType: string): boolean {
  const entry = problemRegistryV2[problemType];
  return !!entry && entry.parameters.length > 0;
}
```

**Dependencies:** Task 1.1, 1.2
**Testing Checkpoint:**
- Import and call `resolveProblem('quadratic', {rotationAngle: 45})` - should return correct problem
- Call `getProblemParameters('rosenbrock')` - should return parameter metadata

### Task 2.2: Update Problem Index Exports

**File:** `/workspace/src/problems/index.ts`
**Location:** After line 40 (at end of file)
**Action:** Export new registry functions

```typescript
// Export new registry V2 (parameter-aware)
export {
  problemRegistryV2,
  resolveProblem,
  getProblemParameters,
  getDefaultParameters,
  isProblemParametrized
} from './registry';
```

**Dependencies:** Task 2.1
**Testing Checkpoint:** Can import registry functions in other files

---

## Phase 3: Integrate into UnifiedVisualizer (Component Layer)

**Goal:** Replace scattered if-else chains with centralized resolution
**Estimated Time:** 2-3 hours

### Task 3.1: Consolidate Parameter State

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Lines 46-48 (state declarations)
**Action:** Replace individual parameter states with unified state

**BEFORE:**
```typescript
const [rotationAngle, setRotationAngle] = useState(0);
const [conditionNumber, setConditionNumber] = useState(100);
const [rosenbrockB, setRosenbrockB] = useState(100);
```

**AFTER:**
```typescript
// NEW: Unified parameter state
const [problemParameters, setProblemParameters] = useState<Record<string, number | string>>({});

// LEGACY: Keep for backward compatibility during migration
const [rotationAngle, setRotationAngle] = useState(0);
const [conditionNumber, setConditionNumber] = useState(100);
const [rosenbrockB, setRosenbrockB] = useState(100);

// Sync legacy state to unified state (temporary bridge)
useEffect(() => {
  setProblemParameters({
    rotationAngle,
    conditionNumber,
    rosenbrockB,
  });
}, [rotationAngle, conditionNumber, rosenbrockB]);
```

**Dependencies:** Task 1.1, 2.1
**Testing Checkpoint:** App runs without errors, parameters still work via legacy setters

### Task 3.2: Replace getCurrentProblem() Logic

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Lines 172-240 (getCurrentProblem useMemo)
**Action:** Replace if-else chain with resolveProblem()

**BEFORE (lines 188-211):**
```typescript
} else if (currentProblem === 'quadratic') {
  const problem = createRotatedQuadratic(rotationAngle);
  return { ...problem, requiresDataset: false, dimensionality: 2 };
} else if (currentProblem === 'ill-conditioned-quadratic') {
  const problem = createIllConditionedQuadratic(conditionNumber);
  return { ...problem, requiresDataset: false, dimensionality: 2 };
} else if (currentProblem === 'rosenbrock') {
  const problem = createRosenbrockProblem(rosenbrockB);
  return { ...problem, requiresDataset: false, dimensionality: 2 };
}
```

**AFTER:**
```typescript
} else if (currentProblem === 'separating-hyperplane') {
  // Special case: dataset-based problem
  const { objective, gradient, hessian } = separatingHyperplaneToProblemFunctions(
    data, separatingHyperplaneVariant, lambda
  );
  return {
    name: 'Separating Hyperplane',
    description: `Separating hyperplane (${separatingHyperplaneVariant})`,
    objective, gradient, hessian,
    domain: { w0: [-3, 3], w1: [-3, 3] },
    requiresDataset: true,
    dimensionality: 3,
  };
} else {
  // NEW: Use centralized resolution for all registry problems
  const problem = resolveProblem(currentProblem, problemParameters);
  return {
    ...problem,
    requiresDataset: false,
    dimensionality: 2,
  };
}
```

**Dependencies:** Task 2.1, 3.1
**Testing Checkpoint:**
- Switch between problems - contours should update correctly
- Change rotation angle - quadratic should re-render
- Change condition number - ill-conditioned quadratic should update

### Task 3.3: Replace getCurrentProblemFunctions() Logic

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Lines 245-272 (getCurrentProblemFunctions callback)
**Action:** Replace if-else chain with resolveProblem()

**BEFORE (lines 248-259):**
```typescript
} else if (currentProblem === 'quadratic') {
  const problem = createRotatedQuadratic(rotationAngle);
  return problemToProblemFunctions(problem);
} else if (currentProblem === 'ill-conditioned-quadratic') {
  const problem = createIllConditionedQuadratic(conditionNumber);
  return problemToProblemFunctions(problem);
} else if (currentProblem === 'rosenbrock') {
  const problem = createRosenbrockProblem(rosenbrockB);
  return problemToProblemFunctions(problem);
}
```

**AFTER:**
```typescript
} else if (currentProblem === 'separating-hyperplane') {
  // Special case: dataset-based problem
  if (!data || data.length === 0) {
    throw new Error('Separating hyperplane requires dataset');
  }
  return separatingHyperplaneToProblemFunctions(data, separatingHyperplaneVariant, lambda);
} else {
  // NEW: Use centralized resolution
  const problem = resolveProblem(currentProblem, problemParameters);
  return problemToProblemFunctions(problem);
}
```

**Dependencies:** Task 2.1, 3.1
**Testing Checkpoint:**
- Run all algorithms - they should converge correctly
- Verify algorithm iterations update properly
- Check that contour plots match algorithm paths

---

## Phase 4: Refactor UI Components (Presentation Layer)

**Goal:** Auto-generate parameter controls from metadata
**Estimated Time:** 3-4 hours

### Task 4.1: Create Generic Parameter Control Component

**File:** `/workspace/src/components/ParameterControls.tsx` (NEW FILE)
**Action:** Create reusable parameter UI component

```typescript
import React from 'react';
import { InlineMath } from './Math';
import { ParameterMetadata } from '../types/experiments';

interface ParameterControlsProps {
  parameters: ParameterMetadata[];
  values: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  parameters,
  values,
  onChange,
}) => {
  if (parameters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

      {parameters.map((param) => {
        const value = values[param.key] ?? param.default;

        return (
          <div key={param.key} className="mb-4">
            <div className="flex gap-4">
              <div className="w-64">
                <h4 className="font-medium text-gray-700 mb-2">
                  {param.label} {param.unit && `(${param.unit})`}
                </h4>

                {param.type === 'range' && (
                  <>
                    <input
                      type="range"
                      min={param.scale === 'log10' ? Math.log10(param.min!) : param.min}
                      max={param.scale === 'log10' ? Math.log10(param.max!) : param.max}
                      step={param.step}
                      value={param.scale === 'log10' ? Math.log10(value as number) : value}
                      onChange={(e) => {
                        const rawValue = parseFloat(e.target.value);
                        const actualValue = param.scale === 'log10'
                          ? Math.pow(10, rawValue)
                          : rawValue;
                        onChange(param.key, actualValue);
                      }}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">
                      {param.key === 'rotationAngle' && <InlineMath>\theta</InlineMath>}
                      {param.key === 'conditionNumber' && <InlineMath>\kappa</InlineMath>}
                      {param.key === 'rosenbrockB' && <InlineMath>b</InlineMath>}
                      {' = '}
                      {typeof value === 'number'
                        ? (param.scale === 'log10' ? value.toFixed(0) : value)
                        : value}
                      {param.unit}
                    </span>
                  </>
                )}

                {param.type === 'select' && (
                  <select
                    value={value}
                    onChange={(e) => onChange(param.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  >
                    {param.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {param.description && (
                <div className="flex-1 p-3 bg-blue-100 rounded-lg self-center">
                  <p className="text-xs text-blue-900">{param.description}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

**Dependencies:** Task 1.1
**Testing Checkpoint:** Component renders correctly in test environment

### Task 4.2: Integrate ParameterControls into ProblemConfiguration

**File:** `/workspace/src/components/ProblemConfiguration.tsx`
**Location:** Lines 349-448 (hardcoded parameter sections)
**Action:** Replace hardcoded sections with generic component

**Add imports (after line 7):**
```typescript
import { getProblemParameters } from '../problems';
import { ParameterControls } from './ParameterControls';
```

**Add props to interface:**
```typescript
interface ProblemConfigurationProps {
  // ... existing props ...

  // NEW: Generic parameter support
  problemParameters: Record<string, number | string>;
  onProblemParameterChange: (key: string, value: number | string) => void;

  // LEGACY: Keep for backward compatibility
  rotationAngle: number;
  onRotationAngleChange: (theta: number) => void;
  conditionNumber: number;
  onConditionNumberChange: (kappa: number) => void;
  rosenbrockB: number;
  onRosenbrockBChange: (b: number) => void;
}
```

**Replace lines 349-448 with:**
```typescript
{/* Parameters section - auto-generated from registry */}
{currentProblem !== 'logistic-regression' &&
 currentProblem !== 'separating-hyperplane' && (
  <ParameterControls
    parameters={getProblemParameters(currentProblem)}
    values={problemParameters}
    onChange={onProblemParameterChange}
  />
)}
```

**Dependencies:** Task 2.1, 4.1
**Testing Checkpoint:**
- Parameter controls render for rotated quadratic, ill-conditioned, rosenbrock
- No controls shown for non-parametrized problems (saddle, himmelblau, three-hump-camel)
- Changing sliders updates visualizations

### Task 4.3: Wire ParameterControls in UnifiedVisualizer

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Where ProblemConfiguration is rendered
**Action:** Add new props to ProblemConfiguration

```typescript
<ProblemConfiguration
  currentProblem={currentProblem}
  onProblemChange={handleProblemChange}

  // NEW: Generic parameter support
  problemParameters={problemParameters}
  onProblemParameterChange={(key, value) => {
    setProblemParameters(prev => ({ ...prev, [key]: value }));

    // TEMPORARY: Sync to legacy state during migration
    if (key === 'rotationAngle') setRotationAngle(value as number);
    if (key === 'conditionNumber') setConditionNumber(value as number);
    if (key === 'rosenbrockB') setRosenbrockB(value as number);
  }}

  // LEGACY: Keep during migration
  rotationAngle={rotationAngle}
  onRotationAngleChange={setRotationAngle}
  conditionNumber={conditionNumber}
  onConditionNumberChange={setConditionNumber}
  rosenbrockB={rosenbrockB}
  onRosenbrockBChange={setRosenbrockB}

  // ... other existing props ...
/>
```

**Dependencies:** Task 4.2, 3.1
**Testing Checkpoint:** Full parameter flow works end-to-end

---

## Phase 5: Migrate Experiment Presets (Data Layer)

**Goal:** Update all experiment presets to use new parameter system
**Estimated Time:** 2-3 hours

### Task 5.1: Create Migration Helper

**File:** `/workspace/src/experiments/migration-helper.ts` (NEW FILE)
**Action:** Add helper to normalize legacy presets

```typescript
import { ExperimentPreset } from '../types/experiments';

/**
 * Normalize experiment preset to use problemParameters
 * Converts legacy fields to new format during migration
 */
export function normalizeExperimentPreset(preset: ExperimentPreset): ExperimentPreset {
  const normalized = { ...preset };

  // Migrate legacy parameter fields to problemParameters
  if (!normalized.problemParameters) {
    normalized.problemParameters = {};
  }

  if (preset.rotationAngle !== undefined) {
    normalized.problemParameters.rotationAngle = preset.rotationAngle;
  }

  if (preset.conditionNumber !== undefined) {
    normalized.problemParameters.conditionNumber = preset.conditionNumber;
  }

  if (preset.rosenbrockB !== undefined) {
    normalized.problemParameters.rosenbrockB = preset.rosenbrockB;
  }

  return normalized;
}
```

**Dependencies:** Task 1.2
**Testing Checkpoint:** Helper correctly converts presets

### Task 5.2: Update Experiment Loading Logic

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Experiment loading logic
**Action:** Use normalizeExperimentPreset when loading

```typescript
const loadExperiment = (preset: ExperimentPreset) => {
  // Normalize preset to handle legacy fields
  const normalized = normalizeExperimentPreset(preset);

  // Load problem parameters
  if (normalized.problemParameters) {
    setProblemParameters(normalized.problemParameters);

    // TEMPORARY: Sync to legacy state
    if (normalized.problemParameters.rotationAngle !== undefined) {
      setRotationAngle(normalized.problemParameters.rotationAngle as number);
    }
    if (normalized.problemParameters.conditionNumber !== undefined) {
      setConditionNumber(normalized.problemParameters.conditionNumber as number);
    }
    if (normalized.problemParameters.rosenbrockB !== undefined) {
      setRosenbrockB(normalized.problemParameters.rosenbrockB as number);
    }
  }

  // ... rest of existing loading logic ...
};
```

**Dependencies:** Task 5.1
**Testing Checkpoint:** Loading legacy presets still works

### Task 5.3: Migrate Experiment Preset Files

**Files to update:**
- `/workspace/src/experiments/gd-fixed-presets.ts`
- `/workspace/src/experiments/gd-linesearch-presets.ts`
- `/workspace/src/experiments/diagonal-precond-presets.ts`
- `/workspace/src/experiments/newton-presets.ts`
- `/workspace/src/experiments/lbfgs-presets.ts`

**Action:** Update presets with `rotationAngle` to use `problemParameters`

**Example transformation:**

**BEFORE:**
```typescript
{
  id: 'newton-rotated-quadratic',
  name: 'Demo: Why a Vector of αs Isn\'t Enough',
  algorithm: 'newton',
  problem: 'quadratic',
  rotationAngle: 45,
  hyperparameters: { /* ... */ },
  // ...
}
```

**AFTER:**
```typescript
{
  id: 'newton-rotated-quadratic',
  name: 'Demo: Why a Vector of αs Isn\'t Enough',
  algorithm: 'newton',
  problem: 'quadratic',
  problemParameters: { rotationAngle: 45 },
  hyperparameters: { /* ... */ },
  // ...
}
```

**Affected presets:**
1. **newton-presets.ts**: Line 80 - `newton-rotated-quadratic`
2. **diagonal-precond-presets.ts**: Lines 27, 44 - `diag-precond-rotated-failure`, `diag-precond-circular`

**Dependencies:** Task 5.1, 5.2
**Testing Checkpoint:** All experiments load correctly with parameters

### Task 5.4: Add Missing Parameter Support to Presets

**File:** `/workspace/src/experiments/gd-fixed-presets.ts`
**Location:** After existing experiments
**Action:** Create new experiments showcasing parameter variations

```typescript
{
  id: 'gd-fixed-condition-number-demo',
  name: 'Demo: How Condition Number Affects GD',
  description: 'Vary κ to see how elongation causes zig-zagging',
  algorithm: 'gd-fixed',
  problem: 'ill-conditioned-quadratic',
  problemParameters: { conditionNumber: 250 },
  hyperparameters: {
    alpha: 0.01,
    lambda: 0,
    maxIter: 50,
  },
  initialPoint: [0.3, 2.5],
  expectation: 'Observe: Higher κ = more zig-zagging. Try reducing κ to 10!',
  ui: {
    tone: 'teal',
    details: 'Condition number κ controls how elongated the ellipse is. κ=1 is a circle, κ=500 is extremely elongated.',
  },
},
```

**Dependencies:** Task 5.3
**Testing Checkpoint:** New experiments load and parameters can be adjusted

---

## Phase 6: Cleanup and Migration Completion

**Goal:** Remove legacy code and complete migration
**Estimated Time:** 2-3 hours

### Task 6.1: Remove Legacy State Variables

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Location:** Lines 46-48, throughout file
**Action:** Remove legacy state after confirming all code uses problemParameters

**Remove:**
```typescript
const [rotationAngle, setRotationAngle] = useState(0);
const [conditionNumber, setConditionNumber] = useState(100);
const [rosenbrockB, setRosenbrockB] = useState(100);
```

**Update dependency arrays to use problemParameters instead**

**Dependencies:** All previous tasks
**Testing Checkpoint:** App works without legacy state

### Task 6.2: Remove Legacy Props from ProblemConfiguration

**File:** `/workspace/src/components/ProblemConfiguration.tsx`
**Location:** Lines 24-35 (interface), throughout component
**Action:** Remove legacy props

**Remove from interface:**
```typescript
rotationAngle: number;
onRotationAngleChange: (theta: number) => void;
conditionNumber: number;
onConditionNumberChange: (kappa: number) => void;
rosenbrockB: number;
onRosenbrockBChange: (b: number) => void;
```

**Dependencies:** Task 6.1
**Testing Checkpoint:** Component compiles and works without legacy props

### Task 6.3: Remove Deprecated Fields from ExperimentPreset

**File:** `/workspace/src/types/experiments.ts`
**Location:** Lines 53, 63-65
**Action:** Remove deprecated fields after all presets migrated

**Remove:**
```typescript
/** @deprecated Use problemParameters.rotationAngle instead */
rotationAngle?: number;
/** @deprecated Use problemParameters.conditionNumber instead */
conditionNumber?: number;
/** @deprecated Use problemParameters.rosenbrockB instead */
rosenbrockB?: number;
```

**Dependencies:** Task 5.3 (all presets migrated)
**Testing Checkpoint:** TypeScript compilation succeeds

### Task 6.4: Remove Migration Helper

**File:** `/workspace/src/experiments/migration-helper.ts`
**Action:** Delete file (no longer needed)

**File:** `/workspace/src/UnifiedVisualizer.tsx`
**Action:** Remove `normalizeExperimentPreset` calls

**Dependencies:** Task 6.3
**Testing Checkpoint:** App works without migration helper

### Task 6.5: Update Documentation Comments

**Files:**
- `/workspace/src/problems/registry.ts`
- `/workspace/src/types/experiments.ts`

**Action:** Add comprehensive documentation

**Example docstring for resolveProblem:**
```typescript
/**
 * Resolve a problem with given parameters
 *
 * This is the central function for problem resolution. It replaces
 * all scattered if-else chains that previously handled parametrized problems.
 *
 * @example
 * // Rotated quadratic at 45°
 * const problem = resolveProblem('quadratic', { rotationAngle: 45 });
 *
 * @example
 * // Ill-conditioned with κ=250
 * const problem = resolveProblem('ill-conditioned-quadratic', { conditionNumber: 250 });
 *
 * @example
 * // Non-parametrized problem
 * const problem = resolveProblem('himmelblau', {});
 *
 * @param problemType - Problem type identifier
 * @param parameters - Parameter values (key-value pairs)
 * @returns Resolved problem definition with parameter values applied
 * @throws Error if problem not found or factory fails
 */
```

**Dependencies:** All previous tasks
**Testing Checkpoint:** Documentation is clear and accurate

---

## Testing Strategy

### Phase 1: Type System
- [ ] TypeScript compiles without errors
- [ ] No breaking changes in existing code

### Phase 2: Registry
- [ ] Can resolve parametrized problems: `resolveProblem('quadratic', {rotationAngle: 45})`
- [ ] Can get parameter metadata: `getProblemParameters('rosenbrock')`
- [ ] Default parameters work: `getDefaultParameters('ill-conditioned-quadratic')`

### Phase 3: UnifiedVisualizer
- [ ] Problem switching works correctly
- [ ] Contour plots update when parameters change
- [ ] Algorithms run correctly with parametrized problems
- [ ] No console errors or warnings

### Phase 4: UI Components
- [ ] ParameterControls renders for parametrized problems
- [ ] Sliders work and update visualizations
- [ ] No controls shown for non-parametrized problems
- [ ] Parameter values sync correctly

### Phase 5: Experiment Presets
- [ ] All existing experiments load correctly
- [ ] Legacy `rotationAngle` field still works
- [ ] New `problemParameters` field works
- [ ] Can switch between experiments smoothly

### Phase 6: Cleanup
- [ ] No legacy state remains
- [ ] No deprecated props remain
- [ ] All TypeScript warnings resolved
- [ ] Documentation is complete

---

## Risk Mitigation

### Breaking Changes Prevention
1. **Parallel Implementation**: New code runs alongside old code initially
2. **Backward Compatibility**: Legacy fields kept during migration with deprecation warnings
3. **Gradual Migration**: Can migrate presets incrementally (one file at a time)
4. **Feature Flag**: Could add flag to toggle between old/new systems

### Rollback Strategy
Each phase is independent and can be reverted:
- **Phase 1**: Just type additions, no runtime changes
- **Phase 2**: New module, doesn't affect existing code
- **Phase 3**: Uses new module but keeps legacy state as fallback
- **Phase 4**: New component, old controls can be re-enabled
- **Phase 5**: Migration helper allows using either format
- **Phase 6**: Only execute after thorough testing of phases 1-5

---

## Success Metrics

### Code Quality
- **~200 lines removed**: Duplicate if-else chains eliminated
- **Single source of truth**: All problem resolution through `resolveProblem()`
- **Type safety**: Centralized type definitions prevent inconsistencies

### Maintainability
- **Easy extensibility**: New parametrized problems require only registry entry
- **Auto-generated UI**: Parameter controls generated from metadata
- **Better testing**: Can unit test parameter resolution independently

### Developer Experience
- **Clear architecture**: Parameter flow is explicit and traceable
- **Better errors**: Centralized validation and error messages
- **Documentation**: Comprehensive docs and examples

---

## Future Enhancements (Post-Refactor)

Once base refactor is complete, these become trivial to add:

1. **Parameter Presets**: Store/load favorite parameter combinations
2. **Parameter Animation**: Animate parameters to show sensitivity
3. **Multi-Parameter Problems**: Extend to problems with 3+ parameters
4. **Parameter Constraints**: Add validation rules to metadata
5. **Advanced UI**: Add tooltips, help text, parameter grouping
6. **URL State**: Encode parameters in URL for sharing

---

## Conclusion

This refactoring transforms parametrized problems from a "bolt-on feature" to first-class citizens, resulting in:

- ✅ **Cleaner code**: 200+ lines removed
- ✅ **Better architecture**: Single source of truth
- ✅ **Easier maintenance**: Adding new problems is trivial
- ✅ **Type safety**: Compile-time validation
- ✅ **Better UX**: Auto-generated controls, complete experiment support

The incremental migration path ensures the codebase remains functional at each step, with minimal risk of breaking changes.
