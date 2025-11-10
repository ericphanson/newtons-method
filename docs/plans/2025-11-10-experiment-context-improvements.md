# Experiment Context Improvements

**Date:** 2025-11-10
**Status:** Design Complete

## Overview

Improve user understanding of what's loaded when navigating through story steps by:
1. Adding Problem/Algorithm status to the story banner
2. Making experiment load toasts more informative about what changed
3. Adding `algorithm` field to experiment metadata to eliminate ID prefix parsing

## Problem Statement

When users click through story steps, the visualization changes but they don't understand what changed:
- Which problem is now loaded?
- Which algorithm is running?
- What specific parameters changed?

This is especially confusing during story navigation where both problem and algorithm may change between steps.

## Solution Overview

### 1. Add Algorithm Metadata to Experiments

Extend `ExperimentPreset` to include the algorithm as explicit metadata instead of parsing it from IDs.

### 2. Story Banner Status Display

Show current problem and algorithm in the story banner below the step counter:
```
Story Step 1 of 5
Problem: Rosenbrock | Algo: Newton's Method
```

### 3. Smart Toast Messages

Toast messages that explain what's changing:
- "Loading: Rosenbrock Valley • Switching to Newton's Method"
- "Loading: Tight Convergence • α: 0.1→0.01"
- "Loading: Rotated Problem • rotation: 0°→45°"

**Smart diffing rules:**
- If algorithm changes → mention it, skip hyperparameters
- If algorithm same, hyperparameters change → mention specific hypers
- If problem changes → mention it, skip problem config
- If problem same, problem config changes → mention that config

## Implementation Details

### 1. Data Model Changes

**Update ExperimentPreset interface:**

```typescript
// In src/types/experiments.ts
export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs'; // NEW - required
  problem: ProblemType;
  dataset?: DataPoint[];
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant;
  rotationAngle?: number;
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

**Create algorithm display name mapping:**

```typescript
// In src/utils/algorithmNames.ts (new file)
export const ALGORITHM_DISPLAY_NAMES: Record<string, string> = {
  'gd-fixed': 'GD (Fixed Step)',
  'gd-linesearch': 'GD (Line Search)',
  'diagonal-precond': 'Diagonal Precond',
  'newton': "Newton's Method",
  'lbfgs': 'L-BFGS',
};

export function getAlgorithmDisplayName(algorithmId: string): string {
  const name = ALGORITHM_DISPLAY_NAMES[algorithmId];
  if (!name) {
    throw new Error(`Unknown algorithm ID: ${algorithmId}`);
  }
  return name;
}
```

**Update all experiment definitions:**

Add `algorithm` field to all experiments in:
- `src/experiments/gd-fixed.ts` → `algorithm: 'gd-fixed'`
- `src/experiments/gd-linesearch.ts` → `algorithm: 'gd-linesearch'`
- `src/experiments/diagonal-precond.ts` → `algorithm: 'diagonal-precond'`
- `src/experiments/newton.ts` → `algorithm: 'newton'`
- `src/experiments/lbfgs.ts` → `algorithm: 'lbfgs'`

TypeScript will catch all missing fields when we make `algorithm` required.

### 2. Story Banner Updates

**Update StoryBanner props:**

```typescript
// In src/components/StoryBanner.tsx
interface StoryBannerProps {
  story: Story;
  currentStepIndex: number;
  currentExperiment: ExperimentPreset; // NEW
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onShowTOC: () => void;
}
```

**Add status display:**

```typescript
export const StoryBanner: React.FC<StoryBannerProps> = ({
  story,
  currentStepIndex,
  currentExperiment,
  onPrevious,
  onNext,
  onExit,
  onShowTOC
}) => {
  const currentStep = story.steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === story.steps.length - 1;

  // Get display names
  const problemName = getProblem(currentExperiment.problem)?.name || currentExperiment.problem;
  const algorithmName = getAlgorithmDisplayName(currentExperiment.algorithm);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <button onClick={onExit} className="text-white hover:bg-blue-700 px-2 py-1 rounded">
          ✕
        </button>

        <div className="flex-none">
          <button onClick={onShowTOC} className="hover:underline">
            {story.title} - Step {currentStepIndex + 1}/{story.steps.length}
          </button>
          {/* NEW: Problem/Algo status */}
          <div className="text-xs opacity-90 mt-1">
            Problem: {problemName} | Algo: {algorithmName}
          </div>
        </div>

        <div className="flex-1 text-sm">{currentStep.narrative}</div>

        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Update UnifiedVisualizer to pass experiment:**

```typescript
// In UnifiedVisualizer.tsx, around line 1750
{currentStoryId && (() => {
  const story = getStory(currentStoryId);
  if (!story) return null;

  const step = story.steps[currentStoryStep];
  const experiment = getExperimentById(step.experimentId);
  if (!experiment) return null;

  return (
    <>
      <StoryBanner
        story={story}
        currentStepIndex={currentStoryStep}
        currentExperiment={experiment} // NEW
        onPrevious={() => setCurrentStoryStep(Math.max(0, currentStoryStep - 1))}
        onNext={() => setCurrentStoryStep(Math.min(story.steps.length - 1, currentStoryStep + 1))}
        onExit={() => {
          setCurrentStoryId(null);
          setCurrentStoryStep(0);
        }}
        onShowTOC={() => setShowStoryTOC(true)}
      />

      {showStoryTOC && (
        <StoryTOC
          story={story}
          currentStepIndex={currentStoryStep}
          onSelectStep={setCurrentStoryStep}
          onClose={() => setShowStoryTOC(false)}
        />
      )}
    </>
  );
})()}
```

### 3. Smart Toast Messages

**Update loadExperiment function:**

```typescript
// In UnifiedVisualizer.tsx, around line 586
const loadExperiment = useCallback((experiment: ExperimentPreset) => {
  setExperimentLoading(true);
  setExperimentJustLoaded(true);

  // ... existing load logic (setting state) ...

  // Build smart toast message based on what's changing
  let message = `Loading: ${experiment.name}`;
  const changes: string[] = [];

  const algoChanging = experiment.algorithm !== selectedTab;
  const problemChanging = experiment.problem !== currentProblem;

  // Check algorithm change
  if (algoChanging) {
    const algorithmName = getAlgorithmDisplayName(experiment.algorithm);
    changes.push(`Switching to ${algorithmName}`);
  } else {
    // Same algo - check if hyperparameters changed
    const hyperChanges = getHyperparameterChanges(experiment, selectedTab);
    if (hyperChanges.length > 0) {
      changes.push(...hyperChanges);
    }
  }

  // Check problem change
  if (problemChanging) {
    const problemName = getProblem(experiment.problem)?.name || experiment.problem;
    changes.push(`Switching to ${problemName}`);
  } else {
    // Same problem - check if problem config changed
    const problemConfigChanges = getProblemConfigChanges(experiment);
    if (problemConfigChanges.length > 0) {
      changes.push(...problemConfigChanges);
    }
  }

  if (changes.length > 0) {
    message += ` • ${changes.join(' • ')}`;
  }

  setToast({ message, type: 'success' });

  // ... rest of existing logic ...
}, [currentProblem, selectedTab, /* other deps */]);
```

**Helper functions (inner functions in loadExperiment or separate utils):**

```typescript
// Check hyperparameter changes for current algorithm
function getHyperparameterChanges(
  experiment: ExperimentPreset,
  currentAlgo: string
): string[] {
  const changes: string[] = [];

  switch (currentAlgo) {
    case 'gd-fixed':
      if (experiment.hyperparameters.alpha !== undefined &&
          experiment.hyperparameters.alpha !== gdFixedAlpha) {
        changes.push(`α: ${gdFixedAlpha}→${experiment.hyperparameters.alpha}`);
      }
      break;

    case 'gd-linesearch':
      if (experiment.hyperparameters.c1 !== undefined &&
          experiment.hyperparameters.c1 !== gdLSC1) {
        changes.push(`c1: ${gdLSC1}→${experiment.hyperparameters.c1}`);
      }
      break;

    case 'newton':
      if (experiment.hyperparameters.hessianDamping !== undefined &&
          experiment.hyperparameters.hessianDamping !== newtonHessianDamping) {
        changes.push(`damping: ${newtonHessianDamping}→${experiment.hyperparameters.hessianDamping}`);
      }
      if (experiment.hyperparameters.lineSearch !== undefined &&
          experiment.hyperparameters.lineSearch !== newtonLineSearch) {
        changes.push(`line search: ${newtonLineSearch}→${experiment.hyperparameters.lineSearch}`);
      }
      break;

    case 'lbfgs':
      if (experiment.hyperparameters.m !== undefined &&
          experiment.hyperparameters.m !== lbfgsM) {
        changes.push(`m: ${lbfgsM}→${experiment.hyperparameters.m}`);
      }
      if (experiment.hyperparameters.hessianDamping !== undefined &&
          experiment.hyperparameters.hessianDamping !== lbfgsHessianDamping) {
        changes.push(`damping: ${lbfgsHessianDamping}→${experiment.hyperparameters.hessianDamping}`);
      }
      break;

    case 'diagonal-precond':
      if (experiment.hyperparameters.hessianDamping !== undefined &&
          experiment.hyperparameters.hessianDamping !== diagPrecondHessianDamping) {
        changes.push(`damping: ${diagPrecondHessianDamping}→${experiment.hyperparameters.hessianDamping}`);
      }
      if (experiment.hyperparameters.lineSearch !== undefined &&
          experiment.hyperparameters.lineSearch !== diagPrecondLineSearch) {
        changes.push(`line search: ${diagPrecondLineSearch}→${experiment.hyperparameters.lineSearch}`);
      }
      break;
  }

  // Check maxIter (common to all algorithms)
  if (experiment.hyperparameters.maxIter !== undefined &&
      experiment.hyperparameters.maxIter !== maxIter) {
    changes.push(`maxIter: ${maxIter}→${experiment.hyperparameters.maxIter}`);
  }

  return changes;
}

// Check problem-specific config changes
function getProblemConfigChanges(experiment: ExperimentPreset): string[] {
  const changes: string[] = [];

  // Rotation angle (for rotated quadratics)
  if (experiment.rotationAngle !== undefined) {
    // Need to get current rotation angle from state
    // This might need to be passed as a parameter or accessed from context
    const currentRotation = getCurrentRotationAngle(); // TBD
    if (experiment.rotationAngle !== currentRotation) {
      changes.push(`rotation: ${currentRotation}°→${experiment.rotationAngle}°`);
    }
  }

  // Separating hyperplane variant
  if (experiment.separatingHyperplaneVariant !== undefined) {
    // Need to get current variant from state
    const currentVariant = getCurrentHyperplaneVariant(); // TBD
    if (experiment.separatingHyperplaneVariant !== currentVariant) {
      changes.push(`variant: ${currentVariant}→${experiment.separatingHyperplaneVariant}`);
    }
  }

  return changes;
}
```

**Note:** The helper functions need access to current state. They can be:
1. Inner functions inside `loadExperiment` (with closure access to state)
2. Separate functions that take state as parameters
3. Methods on a context object

Choose based on what keeps `loadExperiment` readable.

### 4. Replace ID Prefix Parsing

**Current hacky code (lines 724-737):**

```typescript
// Switch to appropriate tab based on experiment ID prefix
if (experiment.id.startsWith('gd-fixed-')) {
  setSelectedTab('gd-fixed');
} else if (experiment.id.startsWith('gd-linesearch-')) {
  setSelectedTab('gd-linesearch');
} else if (experiment.id.startsWith('diagonal-precond-')) {
  setSelectedTab('diagonal-precond');
} else if (experiment.id.startsWith('newton-')) {
  setSelectedTab('newton');
} else if (experiment.id.startsWith('lbfgs-')) {
  setSelectedTab('lbfgs');
}
```

**Replace with:**

```typescript
// Switch to the experiment's algorithm tab
setSelectedTab(experiment.algorithm);
```

## Toast Message Examples

**Scenario: Just loading different experiment, same algo/problem:**
```
Loading: Tight Convergence
```

**Scenario: Algorithm changes:**
```
Loading: Rosenbrock Valley • Switching to Newton's Method
```

**Scenario: Problem changes:**
```
Loading: New Landscape • Switching to Himmelblau Function
```

**Scenario: Both algorithm and problem change:**
```
Loading: Newton Exploration • Switching to Newton's Method • Switching to Rosenbrock Function
```

**Scenario: Same algo, hyperparameter changes:**
```
Loading: Aggressive Step Size • α: 0.1→0.5
```

**Scenario: Same problem, rotation changes:**
```
Loading: Rotated Quadratic • rotation: 0°→45°
```

**Scenario: Multiple hyperparameter changes:**
```
Loading: Damped Newton • damping: 0→0.1 • line search: none→armijo
```

## Implementation Checklist

### Phase 1: Data Model
- [ ] Create `src/utils/algorithmNames.ts` with `ALGORITHM_DISPLAY_NAMES` and `getAlgorithmDisplayName()`
- [ ] Update `ExperimentPreset` interface in `src/types/experiments.ts` to add required `algorithm` field
- [ ] Update all experiments in `src/experiments/gd-fixed.ts` (add `algorithm: 'gd-fixed'`)
- [ ] Update all experiments in `src/experiments/gd-linesearch.ts` (add `algorithm: 'gd-linesearch'`)
- [ ] Update all experiments in `src/experiments/diagonal-precond.ts` (add `algorithm: 'diagonal-precond'`)
- [ ] Update all experiments in `src/experiments/newton.ts` (add `algorithm: 'newton'`)
- [ ] Update all experiments in `src/experiments/lbfgs.ts` (add `algorithm: 'lbfgs'`)
- [ ] Verify TypeScript compiles with no errors

### Phase 2: Story Banner
- [ ] Update `StoryBanner` props to include `currentExperiment: ExperimentPreset`
- [ ] Add Problem/Algo status display in banner (below step counter)
- [ ] Update `UnifiedVisualizer` to pass `currentExperiment` to `StoryBanner`
- [ ] Test banner display with story navigation

### Phase 3: Smart Toasts
- [ ] Create `getHyperparameterChanges()` helper function
- [ ] Create `getProblemConfigChanges()` helper function
- [ ] Update `loadExperiment` to build smart toast messages
- [ ] Test toast messages for various scenarios:
  - [ ] Algo change
  - [ ] Problem change
  - [ ] Both change
  - [ ] Hyperparameter change (same algo)
  - [ ] Problem config change (same problem)
  - [ ] No changes (just different experiment)

### Phase 4: Cleanup
- [ ] Replace ID prefix parsing with `setSelectedTab(experiment.algorithm)` (line 724-737)
- [ ] Remove any other ID prefix parsing if it exists elsewhere
- [ ] Test story navigation to verify tab switching works

### Phase 5: Testing
- [ ] Test loading experiments manually (not via stories)
- [ ] Test loading experiments via story navigation
- [ ] Verify toast messages are accurate
- [ ] Verify banner shows correct problem/algo
- [ ] Test edge cases (missing problem names, etc.)

## Design Decisions

### Why add algorithm to experiment metadata?

**Benefits:**
1. Eliminates brittle ID prefix parsing
2. Self-documenting - clear which algorithm each experiment uses
3. Enables features like smart toasts and banner status
4. Type-safe - TypeScript catches missing fields

**Cost:**
- Need to update ~20-30 experiments
- Small amount of data duplication (algorithm is in ID prefix AND metadata)

**Verdict:** Worth it - the cost is one-time, benefits are ongoing.

### Why throw error for unknown algorithm ID instead of fallback?

Hard errors during development catch bugs immediately. A fallback (returning the ID) might silently hide missing mappings.

### Why compare to current UI state instead of previous experiment?

Toasts tell users what's changing **in the UI**, not what's different from the last experiment loaded. If they manually changed the step size slider, then load an experiment with that same step size, we shouldn't say it changed.

### Why different rules for algo change vs problem change?

When switching algorithms, users expect everything to reset (different hyperparameters, different behavior). Mentioning "damping changed" is noise.

When switching problems, users expect the problem to be different but not the algorithm's hyperparameters. Mentioning rotation angle changes is useful.

This matches user mental models of what "matters" in each scenario.

## Future Enhancements

1. **Visual diff in toast:** Show old→new values with color coding
2. **Toast expansion:** Click toast to see full diff in modal
3. **Banner tooltips:** Hover over problem/algo names for descriptions
4. **Initial point changes:** Detect and show initial point changes in toast
5. **Dataset changes:** Detect custom dataset vs default dataset

## Success Criteria

- [ ] Story banner shows current problem and algorithm
- [ ] Toast messages accurately describe what changed when loading experiments
- [ ] No more ID prefix parsing in the codebase
- [ ] TypeScript enforces algorithm field on all experiments
- [ ] Users understand what's happening when story steps change
