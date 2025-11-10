# Experiment Context Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make story navigation clearer by showing what's loaded and what changed in the UI.

**Architecture:** Add explicit algorithm metadata to experiments, show problem/algo in story banner, and implement smart toast messages that diff current UI state to explain changes.

**Tech Stack:** React, TypeScript, existing experiment/story system

---

## Task 1: Create Algorithm Display Names Utility

**Files:**
- Create: `src/utils/algorithmNames.ts`

**Step 1: Create the algorithm names utility file**

Create `src/utils/algorithmNames.ts` with this exact content:

```typescript
/**
 * Display names for algorithm identifiers
 * Used in UI components like story banner and toast messages
 */
export const ALGORITHM_DISPLAY_NAMES: Record<string, string> = {
  'gd-fixed': 'GD (Fixed Step)',
  'gd-linesearch': 'GD (Line Search)',
  'diagonal-precond': 'Diagonal Precond',
  'newton': "Newton's Method",
  'lbfgs': 'L-BFGS',
};

/**
 * Get display name for an algorithm ID
 * @param algorithmId - Algorithm identifier (e.g., 'newton', 'gd-fixed')
 * @returns Human-readable algorithm name
 * @throws Error if algorithm ID is unknown
 */
export function getAlgorithmDisplayName(algorithmId: string): string {
  const name = ALGORITHM_DISPLAY_NAMES[algorithmId];
  if (!name) {
    throw new Error(`Unknown algorithm ID: ${algorithmId}`);
  }
  return name;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`

Expected: Success (no errors)

**Step 3: Commit**

```bash
git add src/utils/algorithmNames.ts
git commit -m "feat: add algorithm display names utility"
```

---

## Task 2: Update ExperimentPreset Type

**Files:**
- Modify: `src/types/experiments.ts:45`

**Step 1: Add algorithm field to ExperimentPreset interface**

In `src/types/experiments.ts`, update the `ExperimentPreset` interface (around line 45) to add the `algorithm` field:

```typescript
export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs'; // ADD THIS LINE
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

**Step 2: Verify TypeScript shows errors for missing algorithm fields**

Run: `npm run build`

Expected: FAIL with errors like "Property 'algorithm' is missing in type..." for all experiment files

This is expected! The errors tell us which experiments need updating (next tasks).

**Step 3: Commit**

```bash
git add src/types/experiments.ts
git commit -m "feat: add required algorithm field to ExperimentPreset"
```

---

## Task 3: Update GD Fixed Experiments

**Files:**
- Modify: `src/experiments/gd-fixed-presets.ts`

**Step 1: Add algorithm field to all GD Fixed experiments**

In `src/experiments/gd-fixed-presets.ts`, add `algorithm: 'gd-fixed',` to each experiment object right after the `description` field.

For example, the first experiment should look like:
```typescript
{
  id: 'gd-fixed-success-quadratic',
  name: 'Success: Smooth Quadratic',
  description: '...',
  algorithm: 'gd-fixed', // ADD THIS LINE TO EACH EXPERIMENT
  problem: 'quadratic',
  // ... rest of fields
}
```

Do this for ALL experiments in this file (should be ~4 experiments).

**Step 2: Verify TypeScript compiles this file**

Run: `npm run build`

Expected: Errors for this file should be gone (but errors for other experiment files remain)

**Step 3: Commit**

```bash
git add src/experiments/gd-fixed-presets.ts
git commit -m "feat: add algorithm field to GD fixed experiments"
```

---

## Task 4: Update GD Line Search Experiments

**Files:**
- Modify: `src/experiments/gd-linesearch-presets.ts`

**Step 1: Add algorithm field to all GD Line Search experiments**

In `src/experiments/gd-linesearch-presets.ts`, add `algorithm: 'gd-linesearch',` to each experiment object right after the `description` field.

Do this for ALL experiments in this file (should be ~5 experiments).

**Step 2: Verify TypeScript compiles this file**

Run: `npm run build`

Expected: Errors for this file should be gone

**Step 3: Commit**

```bash
git add src/experiments/gd-linesearch-presets.ts
git commit -m "feat: add algorithm field to GD line search experiments"
```

---

## Task 5: Update Diagonal Preconditioner Experiments

**Files:**
- Modify: `src/experiments/diagonal-precond-presets.ts`

**Step 1: Add algorithm field to all Diagonal Preconditioner experiments**

In `src/experiments/diagonal-precond-presets.ts`, add `algorithm: 'diagonal-precond',` to each experiment object right after the `description` field.

Do this for ALL experiments in this file (should be ~3 experiments).

**Step 2: Verify TypeScript compiles this file**

Run: `npm run build`

Expected: Errors for this file should be gone

**Step 3: Commit**

```bash
git add src/experiments/diagonal-precond-presets.ts
git commit -m "feat: add algorithm field to diagonal preconditioner experiments"
```

---

## Task 6: Update Newton Experiments

**Files:**
- Modify: `src/experiments/newton-presets.ts`

**Step 1: Add algorithm field to all Newton experiments**

In `src/experiments/newton-presets.ts`, add `algorithm: 'newton',` to each experiment object right after the `description` field.

Do this for ALL experiments in this file (should be ~10 experiments).

**Step 2: Verify TypeScript compiles this file**

Run: `npm run build`

Expected: Errors for this file should be gone

**Step 3: Commit**

```bash
git add src/experiments/newton-presets.ts
git commit -m "feat: add algorithm field to Newton experiments"
```

---

## Task 7: Update L-BFGS Experiments

**Files:**
- Modify: `src/experiments/lbfgs-presets.ts`

**Step 1: Add algorithm field to all L-BFGS experiments**

In `src/experiments/lbfgs-presets.ts`, add `algorithm: 'lbfgs',` to each experiment object right after the `description` field.

Do this for ALL experiments in this file (should be ~3 experiments).

**Step 2: Verify TypeScript compiles completely**

Run: `npm run build`

Expected: SUCCESS - no more errors about missing algorithm fields

**Step 3: Commit**

```bash
git add src/experiments/lbfgs-presets.ts
git commit -m "feat: add algorithm field to L-BFGS experiments"
```

---

## Task 8: Update Story Banner Component

**Files:**
- Modify: `src/components/StoryBanner.tsx`

**Step 1: Import dependencies**

At the top of `src/components/StoryBanner.tsx`, add these imports after the existing imports:

```typescript
import { getExperimentById } from '../experiments';
import { getProblem } from '../problems';
import { getAlgorithmDisplayName } from '../utils/algorithmNames';
```

**Step 2: Update StoryBannerProps interface**

Change the `StoryBannerProps` interface (around line 5) to include `currentExperiment`:

```typescript
interface StoryBannerProps {
  story: Story;
  currentStepIndex: number;
  currentExperiment: ExperimentPreset; // ADD THIS LINE
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onShowTOC: () => void;
}
```

**Step 3: Add import for ExperimentPreset type**

Add this to the imports at the top:

```typescript
import { ExperimentPreset } from '../types/experiments';
```

**Step 4: Update component to use currentExperiment prop**

Update the component function signature (around line 14) to destructure `currentExperiment`:

```typescript
export const StoryBanner: React.FC<StoryBannerProps> = ({
  story,
  currentStepIndex,
  currentExperiment, // ADD THIS LINE
  onPrevious,
  onNext,
  onExit,
  onShowTOC
}) => {
```

**Step 5: Add problem/algo display names**

After the bounds checking and before the return statement, add these lines to get display names:

```typescript
// Get display names for current experiment
const problemName = getProblem(currentExperiment.problem)?.name || currentExperiment.problem;
const algorithmName = getAlgorithmDisplayName(currentExperiment.algorithm);
```

**Step 6: Add status display in banner**

Inside the button that shows the story progress (around line 48-69), add a new div below the "Story Step X of Y" text to show the problem/algo status:

Find this section:
```typescript
<div className="text-xs text-blue-200 mt-0.5">
  Story Step {safeIndex + 1} of {story.steps.length}
</div>
```

Add this right after it (still inside the button):
```typescript
<div className="text-xs text-blue-200 mt-1 opacity-90">
  Problem: {problemName} | Algo: {algorithmName}
</div>
```

**Step 7: Verify TypeScript compiles**

Run: `npm run build`

Expected: SUCCESS

**Step 8: Commit**

```bash
git add src/components/StoryBanner.tsx
git commit -m "feat: add problem/algo status to story banner"
```

---

## Task 9: Update UnifiedVisualizer to Pass currentExperiment

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (around line 1750)

**Step 1: Update StoryBanner rendering to pass currentExperiment**

In `UnifiedVisualizer.tsx`, find where `StoryBanner` is rendered (around line 1750). It should currently look like:

```typescript
{currentStoryId && (() => {
  const story = getStory(currentStoryId);
  if (!story) return null;

  return (
    <>
      <StoryBanner
        story={story}
        currentStepIndex={currentStoryStep}
        onPrevious={() => setCurrentStoryStep(Math.max(0, currentStoryStep - 1))}
        onNext={() => setCurrentStoryStep(Math.min(story.steps.length - 1, currentStoryStep + 1))}
        onExit={() => {
          setCurrentStoryId(null);
          setCurrentStoryStep(0);
        }}
        onShowTOC={() => setShowStoryTOC(true)}
      />
      {/* ... StoryTOC ... */}
    </>
  );
})()}
```

Update it to fetch the current experiment and pass it to StoryBanner:

```typescript
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
        currentExperiment={experiment}
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

**Step 2: Verify TypeScript compiles**

Run: `npm run build`

Expected: SUCCESS

**Step 3: Verify the app runs**

Run: `npm run dev`

Expected: App starts without errors

Open browser and navigate to a story, verify the banner shows "Problem: X | Algo: Y"

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: pass current experiment to story banner"
```

---

## Task 10: Replace ID Prefix Parsing Logic

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (around line 724-737)

**Step 1: Find and replace the ID prefix parsing**

In `UnifiedVisualizer.tsx`, find the story loading effect (around line 717-740). It should look like:

```typescript
useEffect(() => {
  if (currentStoryId) {
    const story = getStory(currentStoryId);
    if (story && story.steps[currentStoryStep]) {
      const step = story.steps[currentStoryStep];
      const experiment = getExperimentById(step.experimentId);
      if (experiment) {
        loadExperiment(experiment);

        // Switch to appropriate tab based on experiment ID prefix
        // Note: Experiment IDs follow naming convention: algorithm-specific-name
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
      }
    }
  }
}, [currentStoryId, currentStoryStep, loadExperiment]);
```

Replace the entire if-else chain (lines with `experiment.id.startsWith`) with a single line:

```typescript
useEffect(() => {
  if (currentStoryId) {
    const story = getStory(currentStoryId);
    if (story && story.steps[currentStoryStep]) {
      const step = story.steps[currentStoryStep];
      const experiment = getExperimentById(step.experimentId);
      if (experiment) {
        loadExperiment(experiment);

        // Switch to the experiment's algorithm tab
        setSelectedTab(experiment.algorithm);
      }
    }
  }
}, [currentStoryId, currentStoryStep, loadExperiment]);
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`

Expected: SUCCESS

**Step 3: Test story navigation**

Run: `npm run dev`

Navigate through a story and verify the correct algorithm tab is selected when changing steps.

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: use algorithm field instead of ID parsing"
```

---

## Task 11: Implement Smart Toast Helpers

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add helper functions before loadExperiment)

**Step 1: Add helper function for hyperparameter changes**

Add this helper function in `UnifiedVisualizer.tsx` before the `loadExperiment` function (around line 580):

```typescript
/**
 * Get list of hyperparameter changes for current algorithm
 * @param experiment - Experiment being loaded
 * @param currentAlgo - Currently selected algorithm tab
 * @param currentState - Current hyperparameter state values
 * @returns Array of change descriptions (e.g., ["α: 0.1→0.01"])
 */
function getHyperparameterChanges(
  experiment: ExperimentPreset,
  currentAlgo: string,
  currentState: {
    gdFixedAlpha: number;
    gdLSC1: number;
    newtonHessianDamping: number;
    newtonLineSearch: 'armijo' | 'none';
    newtonC1: number;
    lbfgsM: number;
    lbfgsHessianDamping: number;
    lbfgsC1: number;
    diagPrecondHessianDamping: number;
    diagPrecondLineSearch: 'armijo' | 'none';
    diagPrecondC1: number;
    maxIter: number;
  }
): string[] {
  const changes: string[] = [];
  const hyper = experiment.hyperparameters;

  switch (currentAlgo) {
    case 'gd-fixed':
      if (hyper.alpha !== undefined && hyper.alpha !== currentState.gdFixedAlpha) {
        changes.push(`α: ${currentState.gdFixedAlpha}→${hyper.alpha}`);
      }
      break;

    case 'gd-linesearch':
      if (hyper.c1 !== undefined && hyper.c1 !== currentState.gdLSC1) {
        changes.push(`c1: ${currentState.gdLSC1}→${hyper.c1}`);
      }
      break;

    case 'newton':
      if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.newtonHessianDamping) {
        changes.push(`damping: ${currentState.newtonHessianDamping}→${hyper.hessianDamping}`);
      }
      if (hyper.lineSearch !== undefined && hyper.lineSearch !== currentState.newtonLineSearch) {
        changes.push(`line search: ${currentState.newtonLineSearch}→${hyper.lineSearch}`);
      }
      if (hyper.c1 !== undefined && hyper.c1 !== currentState.newtonC1) {
        changes.push(`c1: ${currentState.newtonC1}→${hyper.c1}`);
      }
      break;

    case 'lbfgs':
      if (hyper.m !== undefined && hyper.m !== currentState.lbfgsM) {
        changes.push(`m: ${currentState.lbfgsM}→${hyper.m}`);
      }
      if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.lbfgsHessianDamping) {
        changes.push(`damping: ${currentState.lbfgsHessianDamping}→${hyper.hessianDamping}`);
      }
      if (hyper.c1 !== undefined && hyper.c1 !== currentState.lbfgsC1) {
        changes.push(`c1: ${currentState.lbfgsC1}→${hyper.c1}`);
      }
      break;

    case 'diagonal-precond':
      if (hyper.hessianDamping !== undefined && hyper.hessianDamping !== currentState.diagPrecondHessianDamping) {
        changes.push(`damping: ${currentState.diagPrecondHessianDamping}→${hyper.hessianDamping}`);
      }
      if (hyper.lineSearch !== undefined && hyper.lineSearch !== currentState.diagPrecondLineSearch) {
        changes.push(`line search: ${currentState.diagPrecondLineSearch}→${hyper.lineSearch}`);
      }
      if (hyper.c1 !== undefined && hyper.c1 !== currentState.diagPrecondC1) {
        changes.push(`c1: ${currentState.diagPrecondC1}→${hyper.c1}`);
      }
      break;
  }

  // Check maxIter (common to all algorithms)
  if (hyper.maxIter !== undefined && hyper.maxIter !== currentState.maxIter) {
    changes.push(`maxIter: ${currentState.maxIter}→${hyper.maxIter}`);
  }

  return changes;
}
```

**Step 2: Add helper function for problem config changes**

Add this helper function right after the previous one:

```typescript
/**
 * Get list of problem-specific configuration changes
 * @param experiment - Experiment being loaded
 * @param currentProblem - Currently selected problem
 * @param currentConfig - Current problem configuration
 * @returns Array of change descriptions (e.g., ["rotation: 0°→45°"])
 */
function getProblemConfigChanges(
  experiment: ExperimentPreset,
  currentProblem: string,
  currentConfig: {
    rotationAngle?: number;
    separatingHyperplaneVariant?: string;
  }
): string[] {
  const changes: string[] = [];

  // Only check config if we're staying on the same problem
  if (experiment.problem !== currentProblem) {
    return changes;
  }

  // Rotation angle (for rotated quadratics)
  if (experiment.rotationAngle !== undefined &&
      experiment.rotationAngle !== currentConfig.rotationAngle) {
    const current = currentConfig.rotationAngle ?? 0;
    changes.push(`rotation: ${current}°→${experiment.rotationAngle}°`);
  }

  // Separating hyperplane variant
  if (experiment.separatingHyperplaneVariant !== undefined &&
      experiment.separatingHyperplaneVariant !== currentConfig.separatingHyperplaneVariant) {
    const current = currentConfig.separatingHyperplaneVariant ?? 'none';
    changes.push(`variant: ${current}→${experiment.separatingHyperplaneVariant}`);
  }

  return changes;
}
```

**Step 3: Import getProblem and getAlgorithmDisplayName**

At the top of `UnifiedVisualizer.tsx`, add these imports:

```typescript
import { getProblem } from './problems';
import { getAlgorithmDisplayName } from './utils/algorithmNames';
```

**Step 4: Verify TypeScript compiles**

Run: `npm run build`

Expected: SUCCESS

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: add smart toast helper functions"
```

---

## Task 12: Update loadExperiment with Smart Toasts

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (loadExperiment function around line 586)

**Step 1: Find the loadExperiment function**

Locate the `loadExperiment` function in `UnifiedVisualizer.tsx` (around line 586). It should have a toast message around line 669-672 that looks like:

```typescript
setToast({
  message: `Loaded: ${experiment.name}`,
  type: 'success'
});
```

**Step 2: Replace the toast logic with smart diffing**

Replace the simple toast message with this smart diffing logic:

```typescript
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
  const hyperChanges = getHyperparameterChanges(experiment, selectedTab, {
    gdFixedAlpha,
    gdLSC1,
    newtonHessianDamping,
    newtonLineSearch,
    newtonC1,
    lbfgsM,
    lbfgsHessianDamping,
    lbfgsC1,
    diagPrecondHessianDamping,
    diagPrecondLineSearch,
    diagPrecondC1,
    maxIter,
  });
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
  // Note: We need to track current rotation angle and variant in state
  // For now, we'll check if the experiment has these fields
  const problemConfigChanges = getProblemConfigChanges(experiment, currentProblem, {
    rotationAngle: experiment.rotationAngle,
    separatingHyperplaneVariant: experiment.separatingHyperplaneVariant,
  });
  if (problemConfigChanges.length > 0) {
    changes.push(...problemConfigChanges);
  }
}

if (changes.length > 0) {
  message += ` • ${changes.join(' • ')}`;
}

setToast({ message, type: 'success' });
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`

Expected: SUCCESS

**Step 4: Test the smart toasts**

Run: `npm run dev`

Test these scenarios:
1. Load an experiment with same algo/problem → should just show "Loading: [name]"
2. Load an experiment with different algo → should show "Loading: [name] • Switching to [algo]"
3. Load an experiment with different problem → should show "Loading: [name] • Switching to [problem]"
4. Load an experiment with same algo but different hyperparameters → should show changes

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: implement smart toast messages with diffing"
```

---

## Task 13: Manual Testing

**No files to modify - just testing**

**Step 1: Start the development server**

Run: `npm run dev`

**Step 2: Test story banner**

1. Navigate to the Stories tab
2. Start a story
3. Verify the banner shows "Problem: [name] | Algo: [name]"
4. Click through story steps
5. Verify the problem/algo updates correctly when steps change

**Step 3: Test toast messages**

Test these scenarios by loading different experiments:

1. **Same algo/problem, different experiment:**
   - Load one Newton experiment on Rosenbrock
   - Load another Newton experiment on Rosenbrock
   - Expected toast: "Loading: [experiment name]"

2. **Algorithm change:**
   - Load a Newton experiment
   - Load a GD Fixed experiment
   - Expected toast: "Loading: [name] • Switching to GD (Fixed Step)"

3. **Problem change:**
   - Load an experiment on Rosenbrock
   - Load an experiment on Quadratic (same algo)
   - Expected toast: "Loading: [name] • Switching to [problem name]"

4. **Both change:**
   - Load a Newton experiment on Rosenbrock
   - Load a GD experiment on Quadratic
   - Expected toast: "Loading: [name] • Switching to GD (Fixed Step) • Switching to [problem]"

5. **Hyperparameter change (manual test):**
   - Load an experiment
   - Manually change step size slider
   - Load another experiment with different step size
   - Expected: Should show the parameter change

**Step 4: Test ID parsing removal**

1. Navigate through a story
2. Verify the correct algorithm tab is selected when story steps change algorithms
3. Verify no console errors

**Step 5: Verify TypeScript compilation**

Run: `npm run build`

Expected: SUCCESS with no errors

**Step 6: Document test results**

If all tests pass, create a comment in the PR or design doc noting:
- ✅ Story banner shows problem/algo
- ✅ Toast messages explain what changed
- ✅ Algorithm switching works without ID parsing
- ✅ No TypeScript errors
- ✅ No runtime errors

If any tests fail, note the failures and fix before proceeding.

---

## Success Criteria

- [ ] All TypeScript compilation errors resolved
- [ ] Story banner displays "Problem: X | Algo: Y"
- [ ] Toast messages accurately describe changes when loading experiments
- [ ] Algorithm tab switching works correctly in stories
- [ ] No ID prefix parsing remaining in codebase
- [ ] Manual testing completed successfully
- [ ] All commits have meaningful messages

## Notes

- **Problem config tracking:** The current implementation for problem config changes (rotation angle, variant) is simplified. If you need more accurate tracking, you'll need to add state variables to track the current rotation angle and variant separately from the experiment.

- **Hyperparameter state:** The helper function needs access to all current hyperparameter state. This is passed as a large object. If this becomes unwieldy, consider refactoring to a context or reducer pattern.

- **Toast message length:** If toast messages become too long with many changes, consider truncating or grouping (e.g., "3 config changes").
