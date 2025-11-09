# Stories Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Stories" feature that guides users through sequences of experiments with narrative text to explain optimization concepts progressively.

**Architecture:** Stories are data structures (experiment IDs + narrative) managed via React state + localStorage. A bottom banner appears when a story is active, loading experiments via existing `loadExperiment()` function. Stories tab shows all available stories.

**Tech Stack:** TypeScript, React (hooks: useState, useEffect), localStorage, existing experiment system

---

## Critical Fixes Applied (Post Code Review)

This plan has been reviewed and updated to fix critical issues:

1. ✅ **Task 3**: Clarified that `ExperimentPreset` is already imported
2. ✅ **Task 7**: Added localStorage validation array update for Stories tab persistence
3. ✅ **Task 9**: Added automatic tab switching when story loads experiments (CRITICAL UX fix)
4. ✅ **Task 4**: Added bounds checking in StoryBanner component
5. ✅ **Task 5**: Fixed z-index conflict (StoryTOC now z-[60], banner is z-50)
6. ✅ **Task 13**: Added note about potentially missing experiment
7. ✅ **Task 14**: Provided complete, copy-paste ready experiment definitions
8. ✅ **Task 15**: Added pre-test preparation steps

**Key Insight**: The `loadExperiment()` function does NOT automatically switch tabs. Task 9 now explicitly switches tabs based on experiment ID prefix when loading story steps.

---

## Task 1: Create Story Type Definitions

**Files:**
- Create: `src/stories/types.ts`

**Step 1: Create types file**

Create file with story interfaces:

```typescript
// src/stories/types.ts

export interface StoryStep {
  experimentId: string;  // References existing experiment preset
  narrative: string;     // Brief 1-2 sentence explanation for banner
}

export interface Story {
  id: string;                    // 'step-size-evolution'
  title: string;                 // 'Step Size Evolution'
  description: string;           // For stories page listing
  steps: StoryStep[];
}
```

**Step 2: Commit**

```bash
git add src/stories/types.ts
git commit -m "feat(stories): add Story and StoryStep type definitions"
```

---

## Task 2: Create Story Registry

**Files:**
- Create: `src/stories/index.ts`

**Step 1: Create registry file**

Create file with story registry:

```typescript
// src/stories/index.ts
import { Story } from './types';

export const allStories: Story[] = [
  // Stories will be added here
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}

export * from './types';
```

**Step 2: Commit**

```bash
git add src/stories/index.ts
git commit -m "feat(stories): add story registry with getStory function"
```

---

## Task 3: Add getExperimentById to Experiments

**Files:**
- Modify: `src/experiments/index.ts`

**Step 1: Add getExperimentById function**

Add function after existing exports. Note: `ExperimentPreset` type is already imported at line 1.

```typescript
// Add after existing exports in src/experiments/index.ts (after line 28)

/**
 * Get a specific experiment by ID across all algorithms
 * @param id Experiment ID
 * @returns Experiment preset or undefined if not found
 */
export function getExperimentById(id: string): ExperimentPreset | undefined {
  const allExperiments = [
    ...gdFixedExperiments,
    ...gdLinesearchExperiments,
    ...diagonalPrecondExperiments,
    ...newtonExperiments,
    ...lbfgsExperiments,
  ];
  return allExperiments.find(exp => exp.id === id);
}
```

**Step 2: Verify no syntax errors**

Run: `npm run build` (or `tsc --noEmit`)
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/experiments/index.ts
git commit -m "feat(experiments): add getExperimentById for cross-algorithm lookup"
```

---

## Task 4: Create StoryBanner Component

**Files:**
- Create: `src/components/StoryBanner.tsx`

**Step 1: Create component file**

Create banner component:

```typescript
// src/components/StoryBanner.tsx
import React from 'react';
import { Story } from '../stories/types';

interface StoryBannerProps {
  story: Story;
  currentStepIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onShowTOC: () => void;
}

export const StoryBanner: React.FC<StoryBannerProps> = ({
  story,
  currentStepIndex,
  onPrevious,
  onNext,
  onExit,
  onShowTOC
}) => {
  // Bounds checking - protect against invalid step index
  if (!story.steps || story.steps.length === 0) {
    return null;
  }

  const safeIndex = Math.max(0, Math.min(currentStepIndex, story.steps.length - 1));
  const currentStep = story.steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === story.steps.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Exit button */}
        <button
          onClick={onExit}
          className="text-white hover:bg-blue-700 px-2 py-1 rounded transition-colors"
          aria-label="Exit story"
        >
          ✕
        </button>

        {/* Story progress (clickable for TOC) */}
        <div className="flex-none">
          <button onClick={onShowTOC} className="hover:underline">
            {story.title} - Step {currentStepIndex + 1}/{story.steps.length}
          </button>
        </div>

        {/* Narrative text */}
        <div className="flex-1 text-sm">
          {currentStep.narrative}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/StoryBanner.tsx
git commit -m "feat(stories): add StoryBanner component for story navigation"
```

---

## Task 5: Create StoryTOC Component

**Files:**
- Create: `src/components/StoryTOC.tsx`

**Step 1: Create component file**

Create table of contents modal:

```typescript
// src/components/StoryTOC.tsx
import React from 'react';
import { Story } from '../stories/types';

interface StoryTOCProps {
  story: Story;
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onClose: () => void;
}

export const StoryTOC: React.FC<StoryTOCProps> = ({
  story,
  currentStepIndex,
  onSelectStep,
  onClose
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{story.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {story.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectStep(idx);
                onClose();
              }}
              className={`w-full text-left p-3 rounded transition-colors ${
                idx === currentStepIndex
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : idx < currentStepIndex
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Step {idx + 1}</span>
                {idx < currentStepIndex && <span className="text-green-600">✓</span>}
                {idx === currentStepIndex && <span className="text-blue-600">→</span>}
              </div>
              <p className="text-sm text-gray-600 mt-1">{step.narrative}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/StoryTOC.tsx
git commit -m "feat(stories): add StoryTOC modal for navigating story steps"
```

---

## Task 6: Create StoriesPage Component

**Files:**
- Create: `src/components/StoriesPage.tsx`

**Step 1: Create component file**

Create stories listing page:

```typescript
// src/components/StoriesPage.tsx
import React from 'react';
import { allStories } from '../stories';

interface StoriesPageProps {
  onStartStory: (storyId: string) => void;
}

export const StoriesPage: React.FC<StoriesPageProps> = ({ onStartStory }) => {
  const stories = allStories;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stories</h1>
      <p className="text-gray-600 mb-8">
        Guided tours through optimization concepts using interactive examples.
      </p>

      {stories.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No stories available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold mb-2">{story.title}</h2>
              <p className="text-gray-700 mb-3">{story.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {story.steps.length} step{story.steps.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => onStartStory(story.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Story →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/StoriesPage.tsx
git commit -m "feat(stories): add StoriesPage component for browsing available stories"
```

---

## Task 7: Integrate with UnifiedVisualizer - Part 1 (Algorithm Type)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Update Algorithm type**

Search for `type Algorithm =` (should be around line 32) and update to include 'stories':

```typescript
// Update Algorithm type definition
type Algorithm = 'stories' | 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
```

**Step 2: Update localStorage tab validation**

Search for `selectedAlgorithmTab` localStorage initialization (should be around lines 45-51) and update validation array:

```typescript
// Locate this block:
const [selectedTab, setSelectedTab] = useState<Algorithm>(() => {
  const saved = localStorage.getItem('selectedAlgorithmTab');
  if (saved && ['algorithms', 'gd-fixed', 'gd-linesearch', 'diagonal-precond', 'newton', 'lbfgs'].includes(saved)) {
    return saved as Algorithm;
  }
  return 'algorithms';
});

// Update to include 'stories' at the beginning of the array:
const [selectedTab, setSelectedTab] = useState<Algorithm>(() => {
  const saved = localStorage.getItem('selectedAlgorithmTab');
  if (saved && ['stories', 'algorithms', 'gd-fixed', 'gd-linesearch', 'diagonal-precond', 'newton', 'lbfgs'].includes(saved)) {
    return saved as Algorithm;
  }
  return 'algorithms';
});
```

**Step 3: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add 'stories' to Algorithm type and localStorage validation"
```

---

## Task 8: Integrate with UnifiedVisualizer - Part 2 (State)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:45-51`

**Step 1: Add imports at top of file**

Add after existing imports (around line 30):

```typescript
import { StoriesPage } from './components/StoriesPage';
import { StoryBanner } from './components/StoryBanner';
import { StoryTOC } from './components/StoryTOC';
import { getStory } from './stories';
import { getExperimentById } from './experiments';
```

**Step 2: Add story state**

Add after existing state declarations (around line 105, after `biasSlice`):

```typescript
  // Story state
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(() =>
    localStorage.getItem('currentStory')
  );
  const [currentStoryStep, setCurrentStoryStep] = useState<number>(() =>
    parseInt(localStorage.getItem('currentStoryStep') || '0', 10)
  );
  const [showStoryTOC, setShowStoryTOC] = useState(false);
```

**Step 3: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors, may have unused variable warnings (OK for now)

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add story state to UnifiedVisualizer"
```

---

## Task 9: Integrate with UnifiedVisualizer - Part 3 (Effects)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add effects after state declarations)

**Step 1: Add localStorage sync effect**

Add after story state declarations (around line 115):

```typescript
  // Sync story state to localStorage
  useEffect(() => {
    if (currentStoryId) {
      localStorage.setItem('currentStory', currentStoryId);
      localStorage.setItem('currentStoryStep', String(currentStoryStep));
    } else {
      localStorage.removeItem('currentStory');
      localStorage.removeItem('currentStoryStep');
    }
  }, [currentStoryId, currentStoryStep]);
```

**Step 2: Add experiment loading effect**

Add after localStorage sync effect:

```typescript
  // Load experiment when story changes and switch to appropriate tab
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
          } else if (experiment.id.startsWith('diag-precond-')) {
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

**Note:** The `loadExperiment` function does NOT automatically switch tabs - we must do it explicitly here. `setSelectedTab` is a setState function and is stable, so it doesn't need to be in the dependency array.

**Step 3: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add effects for story state management and experiment loading"
```

---

## Task 10: Integrate with UnifiedVisualizer - Part 4 (Stories Tab)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:1498-1561` (tab buttons section)

**Step 1: Add Stories tab button**

Add Stories button as FIRST tab button (before "Algorithms"), around line 1500:

```typescript
          {/* Stories Tab - FIRST position */}
          <button
            onClick={() => setSelectedTab('stories')}
            className={`flex-1 px-4 py-4 font-semibold text-sm ${
              selectedTab === 'stories'
                ? 'text-pink-700 border-b-2 border-pink-600 bg-pink-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stories
          </button>
          {/* Algorithms Tab */}
          <button
            onClick={() => setSelectedTab('algorithms')}
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add Stories tab button in first position"
```

---

## Task 11: Integrate with UnifiedVisualizer - Part 5 (Stories Content)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:1564-1730` (tab content section)

**Step 1: Add StoriesPage rendering**

Add as FIRST conditional rendering block (before `selectedTab === 'algorithms'`), around line 1564:

```typescript
        <div className="p-6">
          {selectedTab === 'stories' && (
            <StoriesPage
              onStartStory={(storyId) => {
                setCurrentStoryId(storyId);
                setCurrentStoryStep(0);
              }}
            />
          )}
          {selectedTab === 'algorithms' && (
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add StoriesPage rendering when Stories tab selected"
```

---

## Task 12: Integrate with UnifiedVisualizer - Part 6 (Banner)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:1734-1742` (end of component, before closing tags)

**Step 1: Add StoryBanner and StoryTOC rendering**

Add before the Toast component (around line 1734), after the closing `</div>` of the main algorithm tabs section:

```typescript
      {/* Story Banner and TOC */}
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

      {toast && (
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Test UI renders**

Run: `npm start` (or `npm run dev`)
Expected: App starts, Stories tab visible, no console errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(stories): add StoryBanner and StoryTOC rendering"
```

---

## Task 13: Create First Story (Step Size Evolution)

**Files:**
- Create: `src/stories/step-size-evolution.ts`
- Modify: `src/stories/index.ts`

**Step 1: Create story definition file**

Create the first story:

```typescript
// src/stories/step-size-evolution.ts
import { Story } from './types';

export const stepSizeEvolution: Story = {
  id: 'step-size-evolution',
  title: 'Step Size Evolution: From Fixed to Adaptive',
  description: 'See how optimizers evolved from fixed step sizes to curvature-aware methods through progressively harder problems.',
  steps: [
    {
      experimentId: 'gd-fixed-ill-conditioned',
      narrative: 'Fixed step size struggles on ill-conditioned problems - notice the severe zig-zagging.'
    },
    {
      experimentId: 'gd-linesearch-ill-conditioned',
      narrative: 'Line search adapts step size per iteration, reducing zig-zag but still slow.'
    },
    {
      experimentId: 'diag-precond-aligned-success',
      narrative: 'Diagonal preconditioning: per-coordinate step sizes work perfectly when aligned with axes!'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'But diagonal fails on rotated problems - we need off-diagonal Hessian information.'
    },
    {
      experimentId: 'newton-rotated-quadratic',
      narrative: 'Full Newton uses complete H⁻¹ to handle rotation - converges in just a few steps.'
    }
  ]
};

/**
 * NOTE: The experiment ID 'gd-linesearch-ill-conditioned' may not exist yet.
 * If Task 14 verification finds it missing, you'll need to create it.
 * See Task 14 for the complete experiment definition to add.
 */
```

**Step 2: Update story registry**

Modify `src/stories/index.ts` to import and include the story:

```typescript
// src/stories/index.ts
import { Story } from './types';
import { stepSizeEvolution } from './step-size-evolution';

export const allStories: Story[] = [
  stepSizeEvolution,
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}

export * from './types';
```

**Step 3: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/stories/step-size-evolution.ts src/stories/index.ts
git commit -m "feat(stories): add Step Size Evolution story"
```

---

## Task 14: Verify and Create Missing Experiment IDs

**Files:**
- Check: `src/experiments/gd-fixed-presets.ts`, `src/experiments/gd-linesearch-presets.ts`, `src/experiments/diagonal-precond-presets.ts`, `src/experiments/newton-presets.ts`
- Modify: May need to add missing experiments

**Step 1: Check each experiment ID**

Verify these experiment IDs exist by searching in the codebase:

```bash
# Check each experiment ID:
grep "id: 'gd-fixed-ill-conditioned'" src/experiments/gd-fixed-presets.ts
grep "id: 'gd-linesearch-ill-conditioned'" src/experiments/gd-linesearch-presets.ts
grep "id: 'diag-precond-aligned-success'" src/experiments/diagonal-precond-presets.ts
grep "id: 'diag-precond-rotated-failure'" src/experiments/diagonal-precond-presets.ts
grep "id: 'newton-rotated-quadratic'" src/experiments/newton-presets.ts
```

Expected: Each grep should find the ID. If any grep returns no results, that experiment is missing.

**Step 2: Create missing `gd-linesearch-ill-conditioned` experiment**

**CRITICAL**: This experiment is likely missing. Add it to `src/experiments/gd-linesearch-presets.ts` in the `gdLinesearchExperiments` array (add after existing experiments):

```typescript
// Add to src/experiments/gd-linesearch-presets.ts in the gdLinesearchExperiments array:
{
  id: 'gd-linesearch-ill-conditioned',
  name: 'Line Search on Ill-Conditioned Quadratic',
  description: 'Armijo line search adapts step size per iteration but convergence still slow on κ=100',
  problem: 'ill-conditioned-quadratic',
  hyperparameters: {
    c1: 0.0001,
    maxIter: 100,
  },
  initialPoint: [2, 2],
  expectation: 'Line search reduces zig-zag compared to fixed step, but convergence still slow due to condition number',
  ui: {
    tone: 'orange',
  },
},
```

**Step 3: If other IDs are missing, create them**

If any other experiments are missing, use these templates:

**For `gd-fixed-ill-conditioned` (if missing):**
```typescript
// Add to src/experiments/gd-fixed-presets.ts:
{
  id: 'gd-fixed-ill-conditioned',
  name: 'GD Fixed: Ill-Conditioned Problem',
  description: 'Fixed step size on κ=100 problem shows severe zig-zagging',
  problem: 'ill-conditioned-quadratic',
  hyperparameters: {
    alpha: 0.01,
    maxIter: 100,
  },
  initialPoint: [2, 2],
  expectation: 'Observe severe zig-zagging due to one step size for all directions',
  ui: {
    tone: 'red',
  },
},
```

**For `newton-rotated-quadratic` (if missing):**
```typescript
// Add to src/experiments/newton-presets.ts:
{
  id: 'newton-rotated-quadratic',
  name: 'Newton on Rotated Quadratic',
  description: 'Full Newton method handles rotation via complete H⁻¹',
  problem: 'quadratic',
  rotationAngle: 45,
  hyperparameters: {
    c1: 0.0001,
    lambda: 0.01,
    maxIter: 20,
    lineSearch: 'none' as const,
  },
  initialPoint: [2, 2],
  expectation: 'Converges in ~2-3 iterations despite rotation - H⁻¹ handles off-diagonal coupling',
  ui: {
    tone: 'green',
  },
},
```

**Step 4: Verify no syntax errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit if changes made**

```bash
git add src/experiments/gd-linesearch-presets.ts
# Add other modified experiment files if needed
git commit -m "feat(experiments): add missing experiments for Step Size Evolution story"
```

---

## Task 15: End-to-End Test

**Files:**
- Test: Entire stories feature flow

**Step 0: Pre-test preparation**

1. Ensure clean build:
   ```bash
   npm run build
   ```
   Expected: No errors, clean build output

2. Clear browser storage (to test fresh state):
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear all localStorage items
   - Close and reopen browser tab

3. Start development server:
   ```bash
   npm start
   # Or: npm run dev
   ```
   Expected: Server starts successfully (usually http://localhost:3000)
   Expected console: "Compiled successfully" or similar

4. Open browser to the development URL

**Step 1: Verify initial state**

Check that:
- No console errors in browser DevTools
- App loads correctly
- All algorithm tabs visible
- Stories tab is FIRST tab in the tab bar

Expected: Clean startup, Stories tab visible

**Step 2: Test Stories tab**

1. Click "Stories" tab (first tab)
2. Verify "Step Size Evolution" story card appears
3. Verify card shows "5 steps"

Expected: Stories page renders correctly

**Step 3: Test starting a story**

1. Click "Start Story →" button
2. Verify banner appears at bottom
3. Verify banner shows "Step 1/5"
4. Verify appropriate algorithm tab is selected
5. Verify experiment loads

Expected: Story starts, banner appears, experiment loads

**Step 4: Test navigation**

1. Click "Next →" in banner
2. Verify step advances to 2/5
3. Verify narrative text changes
4. Verify new experiment loads
5. Click "← Previous"
6. Verify returns to step 1/5

Expected: Navigation works, experiments change

**Step 5: Test Table of Contents**

1. Click story title in banner
2. Verify TOC modal appears
3. Verify all 5 steps shown
4. Click step 4
5. Verify jumps to step 4/5
6. Verify modal closes

Expected: TOC navigation works

**Step 6: Test exit**

1. Click "✕" button in banner
2. Verify banner disappears
3. Verify current experiment remains loaded

Expected: Exit works, experiment state preserved

**Step 7: Test persistence**

1. Start story, go to step 3
2. Refresh page (F5)
3. Verify banner reappears
4. Verify still on step 3/5

Expected: State persists across refresh

**Step 8: Document any issues**

If any issues found, document them:
- What expected
- What happened
- Steps to reproduce

---

## Task 16: Final Commit and Summary

**Step 1: Run final build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 2: Check git status**

Run: `git status`
Expected: All changes committed

**Step 3: Create summary of changes**

Files created:
- `src/stories/types.ts` - Story type definitions
- `src/stories/index.ts` - Story registry
- `src/stories/step-size-evolution.ts` - First story
- `src/components/StoryBanner.tsx` - Bottom banner component
- `src/components/StoryTOC.tsx` - Table of contents modal
- `src/components/StoriesPage.tsx` - Stories listing page

Files modified:
- `src/experiments/index.ts` - Added getExperimentById()
- `src/UnifiedVisualizer.tsx` - Integrated stories feature
- (Possibly) `src/experiments/*-presets.ts` - Added missing experiments

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Stories tab appears first in tab bar
- [ ] StoriesPage shows available stories
- [ ] Starting story shows banner and loads first experiment
- [ ] Next/Previous buttons navigate through steps
- [ ] Story title in banner is clickable and shows TOC
- [ ] TOC allows jumping to any step
- [ ] Exit button clears story and hides banner
- [ ] Current experiment remains after exit
- [ ] Story progress persists across page refresh
- [ ] Tab automatically switches when story spans algorithms
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Existing experiment functionality still works

---

## Notes for Implementation

1. **Experiment IDs**: The story references specific experiment IDs. Verify these exist or create them in Task 14.

2. **Styling**: All Tailwind classes used are standard. If any styling issues occur, check Tailwind config.

3. **localStorage**: Browser localStorage is used for persistence. Clear it manually if testing fresh state: `localStorage.removeItem('currentStory')`

4. **Tab Switching**: When a story step's experiment is loaded, `loadExperiment()` automatically switches to the correct algorithm tab.

5. **Empty Stories List**: StoriesPage handles empty stories gracefully with a placeholder message.

6. **Testing**: No automated tests included in this plan. Focus is on manual E2E testing in Task 15.

---

## Future Enhancements (Out of Scope)

- Story completion tracking
- Multiple story types (branching, quizzes)
- Story export/import
- Automated tests for story components
- Story-specific visualization highlights
