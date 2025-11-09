# Stories Feature Design

**Date:** 2025-11-09
**Status:** Design Complete

## Overview

A "stories" feature that guides users through sequences of experiments to explain optimization concepts progressively. Stories act as guided tours through the existing experiment system, adding narrative without duplicating functionality.

## Core Concept

A story is a sequence of experiments with narrative text explaining what to observe at each step. Users navigate through stories via a banner at the bottom of the screen that loads experiments and provides context.

### Example Story: "Step Size Evolution"

Shows the progression from fixed step sizes to curvature-aware methods:
1. GD with fixed step → struggles on ill-conditioned problems
2. GD with line search → adapts per iteration but still zig-zags
3. Diagonal preconditioning → per-coordinate step sizes (works when aligned)
4. Diagonal preconditioning rotated → fails when problem is rotated
5. Newton's method → full H⁻¹ handles rotation

## Design Principles

1. **Minimal & Additive**: Stories are pure data that references existing experiments
2. **Zero Duplication**: Fully reuses experiment system, no new loading logic
3. **Zero Coupling**: Experiments don't know about stories
4. **Orthogonal**: Story-specific experiments marked `hidden: true` (already supported)

## Data Structure

### Story Definition

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

### Example Story

```typescript
// src/stories/step-size-evolution.ts
export const stepSizeEvolution: Story = {
  id: 'step-size-evolution',
  title: 'Step Size Evolution: From Fixed to Adaptive',
  description: 'See how optimizers evolved from fixed step sizes to curvature-aware methods',
  steps: [
    {
      experimentId: 'gd-fixed-step-fails',
      narrative: 'Fixed step size struggles on ill-conditioned problems - notice the zig-zagging.'
    },
    {
      experimentId: 'gd-line-search-helps',
      narrative: 'Line search adapts step size per iteration, reducing zig-zag but still slow.'
    },
    {
      experimentId: 'diag-precond-aligned-success',
      narrative: 'Diagonal preconditioning: per-coordinate step sizes work perfectly when aligned!'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'But diagonal fails on rotated problems - we need off-diagonal information.'
    },
    {
      experimentId: 'newton-rotated-success',
      narrative: 'Full Newton handles rotation via H⁻¹ - converges in 1-2 steps.'
    }
  ]
};
```

### Story Registry

```typescript
// src/stories/index.ts
import { stepSizeEvolution } from './step-size-evolution';

export const allStories = [
  stepSizeEvolution,
  // Future: costVsIterations, mlOptimizers, etc.
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}
```

## State Management

### React State + localStorage

React state is source of truth, localStorage provides persistence:

```typescript
// In UnifiedVisualizer
const [currentStoryId, setCurrentStoryId] = useState<string | null>(() =>
  localStorage.getItem('currentStory')
);
const [currentStoryStep, setCurrentStoryStep] = useState<number>(() =>
  parseInt(localStorage.getItem('currentStoryStep') || '0', 10)
);

// Sync to localStorage
useEffect(() => {
  if (currentStoryId) {
    localStorage.setItem('currentStory', currentStoryId);
    localStorage.setItem('currentStoryStep', String(currentStoryStep));
  } else {
    localStorage.removeItem('currentStory');
    localStorage.removeItem('currentStoryStep');
  }
}, [currentStoryId, currentStoryStep]);

// Load experiment when story step changes
useEffect(() => {
  if (currentStoryId) {
    const story = getStory(currentStoryId);
    const step = story.steps[currentStoryStep];
    const experiment = getExperimentById(step.experimentId);
    loadExperiment(experiment); // Existing function
  }
}, [currentStoryId, currentStoryStep]);
```

### Why This Pattern?

- **React state triggers effects**: Changing `currentStoryStep` automatically loads new experiment
- **localStorage for persistence**: Story progress survives page refresh
- **No coordination issues**: State changes are atomic, effects run automatically

## User Interface

### Stories Tab

New tab added at the **first position** in tab bar:
```
Stories | Algorithms | GD (Fixed) | GD (Line Search) | Diagonal Precond | Newton | L-BFGS
```

Content shows list of available stories:

```typescript
// src/components/StoriesPage.tsx
export const StoriesPage: React.FC = () => {
  const stories = allStories;

  const startStory = (storyId: string) => {
    setCurrentStoryId(storyId);
    setCurrentStoryStep(0);
    // Story effect will load experiment and switch to appropriate tab
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stories</h1>
      <p className="text-gray-600 mb-8">
        Guided tours through optimization concepts using interactive examples.
      </p>

      <div className="space-y-4">
        {stories.map(story => (
          <div key={story.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-2">{story.title}</h2>
            <p className="text-gray-700 mb-3">{story.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {story.steps.length} steps
              </span>
              <button
                onClick={() => startStory(story.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start Story →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Story Banner

Fixed banner at bottom of screen, visible when story is active:

```typescript
// src/components/StoryBanner.tsx
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
  const currentStep = story.steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === story.steps.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Exit button */}
        <button onClick={onExit} className="text-white hover:bg-blue-700 px-2 py-1 rounded">
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

### Table of Contents Modal

Overlay showing all steps, click to jump:

```typescript
// src/components/StoryTOC.tsx
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{story.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {story.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectStep(idx);
                onClose();
              }}
              className={`w-full text-left p-3 rounded ${
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

## Integration with UnifiedVisualizer

### Add Stories Tab

```typescript
// In UnifiedVisualizer.tsx

// Update Algorithm type (line 32)
type Algorithm = 'stories' | 'algorithms' | 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';

// Add Stories tab button (first position, around line 1498)
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

// Add StoriesPage rendering (around line 1564)
{selectedTab === 'stories' && (
  <StoriesPage
    onStartStory={(storyId) => {
      setCurrentStoryId(storyId);
      setCurrentStoryStep(0);
    }}
  />
)}
```

### Add Story State & Banner

```typescript
// Story state (near top with other state)
const [currentStoryId, setCurrentStoryId] = useState<string | null>(() =>
  localStorage.getItem('currentStory')
);
const [currentStoryStep, setCurrentStoryStep] = useState<number>(() =>
  parseInt(localStorage.getItem('currentStoryStep') || '0', 10)
);
const [showStoryTOC, setShowStoryTOC] = useState(false);

// Sync to localStorage
useEffect(() => {
  if (currentStoryId) {
    localStorage.setItem('currentStory', currentStoryId);
    localStorage.setItem('currentStoryStep', String(currentStoryStep));
  } else {
    localStorage.removeItem('currentStory');
    localStorage.removeItem('currentStoryStep');
  }
}, [currentStoryId, currentStoryStep]);

// Load experiment when story changes
useEffect(() => {
  if (currentStoryId) {
    const story = getStory(currentStoryId);
    if (story) {
      const step = story.steps[currentStoryStep];
      const experiment = getExperimentById(step.experimentId);
      if (experiment) {
        loadExperiment(experiment);
      }
    }
  }
}, [currentStoryId, currentStoryStep, loadExperiment]);

// Render banner at bottom (before closing </div>)
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
```

## Experiment Lookup

Add `getExperimentById()` to experiments registry:

```typescript
// src/experiments/index.ts

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

## User Flows

### Starting a Story

1. User clicks "Stories" tab
2. Sees list of available stories
3. Clicks "Start Story" button
4. Story state set in React (triggers localStorage sync)
5. Effect detects story, loads first experiment
6. `loadExperiment()` switches to appropriate algorithm tab
7. Banner appears at bottom showing step 1/N

### Navigating a Story

1. User clicks "Next" in banner
2. `setCurrentStoryStep(currentStoryStep + 1)` called
3. localStorage synced automatically
4. Effect detects step change, loads new experiment
5. Tab switches if needed, banner updates narrative

### Jumping via TOC

1. User clicks story title in banner
2. TOC modal appears showing all steps
3. User clicks step 4
4. `setCurrentStoryStep(4)` called
5. Same flow as "Next" button

### Exiting a Story

1. User clicks ✕ in banner
2. `setCurrentStoryId(null)` called
3. localStorage cleared automatically
4. Banner disappears
5. Current experiment remains loaded (user can continue exploring)

### Resuming After Refresh

1. Page loads, `useState` initializers read localStorage
2. If story found, effect loads appropriate experiment
3. Banner appears at saved step
4. User continues from where they left off

## File Structure

```
src/
  stories/
    types.ts                    # Story & StoryStep interfaces
    index.ts                    # Story registry, getStory()
    step-size-evolution.ts      # First story definition
  experiments/
    index.ts                    # Add getExperimentById()
  components/
    StoryBanner.tsx             # Bottom banner component
    StoryTOC.tsx                # Table of contents modal
    StoriesPage.tsx             # Stories listing (tab content)
  UnifiedVisualizer.tsx         # Add Stories tab, state, banner
```

## Future Stories

### Cost vs Iterations
- GD Fixed: Many iterations, low cost per iteration
- GD Line Search: Fewer iterations, moderate cost (line search trials)
- Newton: Very few iterations, high cost (O(n³) Hessian)
- L-BFGS: Few iterations, low cost (O(mn))

### ML Optimizers (when SGD added)
- SGD: Stochastic gradients, noisy but scalable
- SGD + Momentum: Smooths out noise
- Adam: Per-coordinate learning rates (diagonal preconditioning) + momentum

## Design Decisions & Rationale

### Why localStorage + React state?
- **Persistence**: Stories resume after refresh (good UX)
- **Reactive**: State changes trigger effects automatically (clean code)
- **Minimal**: Standard React pattern, no special state management

### Why not URL-based routing?
- Existing app uses localStorage, not URLs
- Stories are "modes" not "pages" - banner overlays existing UI
- Simpler implementation (no routing changes)

### Why reference experiments by ID instead of inline definitions?
- **Zero duplication**: Experiments defined once
- **Reusability**: Same experiment in multiple stories or standalone
- **Maintainability**: Update experiment in one place

### Why bottom banner instead of sidebar?
- **Cross-tab**: Story spans multiple algorithm tabs
- **Non-intrusive**: Doesn't obscure visualization
- **Familiar**: Similar to cookie consent banners

### Why table of contents?
- **Flexibility**: Instructors can jump to specific steps
- **Overview**: See full story arc at a glance
- **Discovery**: Browse before committing to sequential flow

## Open Questions / Future Enhancements

1. **Story-specific visualization highlights**: Could experiments specify "focus areas" that get highlighted during stories? (Out of scope for MVP)

2. **Story completion tracking**: Mark stories as "completed" in localStorage? (Nice-to-have)

3. **Story branching**: "Choose your path" style stories? (Future enhancement)

4. **Embedded quizzes**: Pause story for comprehension check? (Future enhancement)

5. **Story sharing**: Export/import story progress? (Future enhancement)

## Implementation Checklist

- [ ] Create `src/stories/types.ts` with Story/StoryStep interfaces
- [ ] Create `src/stories/index.ts` with story registry
- [ ] Create `src/stories/step-size-evolution.ts` with first story
- [ ] Add `getExperimentById()` to `src/experiments/index.ts`
- [ ] Create `src/components/StoryBanner.tsx`
- [ ] Create `src/components/StoryTOC.tsx`
- [ ] Create `src/components/StoriesPage.tsx`
- [ ] Update `src/UnifiedVisualizer.tsx`:
  - Add 'stories' to Algorithm type
  - Add story state (currentStoryId, currentStoryStep, showStoryTOC)
  - Add localStorage sync effect
  - Add experiment loading effect
  - Add Stories tab button (first position)
  - Add StoriesPage rendering
  - Add StoryBanner + StoryTOC rendering
- [ ] Create missing experiments referenced by story (or use placeholders)
- [ ] Test: Start story, navigate, TOC, exit, refresh
- [ ] Test: Tab switching during story progression
- [ ] Test: localStorage persistence across sessions

## Success Criteria

- [ ] Users can browse available stories
- [ ] Starting a story loads first experiment and shows banner
- [ ] Next/Previous navigate through story steps
- [ ] Banner narrative updates for each step
- [ ] TOC shows all steps, allows jumping
- [ ] Exit button clears story state, hides banner
- [ ] Story progress persists across page refresh
- [ ] Tab automatically switches when story spans algorithms
- [ ] Existing experiment functionality unaffected
