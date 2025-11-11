# State Flow Architecture

**Date**: 2025-11-11
**Component**: UnifiedVisualizer.tsx
**Purpose**: Document state management patterns and data flow

---

## Architecture Overview

The app uses **React state + refs** for coordination, with a **proportion-based iteration display** system that works across all algorithms.

### Key Architectural Decisions

1. **Universal Iteration Proportion** (0.0 to 1.0)
   - Single source of truth for "which iteration to show"
   - Converts to different absolute iterations for each algorithm
   - Enables cross-algorithm sync when switching tabs

2. **Ref-Based Coordination**
   - `isLoadingExperimentRef`: Prevents parameter reset during experiment loads
   - `isNavigatingRef`: Prevents IntersectionObserver interference during programmatic scrolls

3. **flushSync for Synchronous Rendering**
   - Used for story navigation and hash scrolling
   - Eliminates setTimeout and RAF timing dependencies
   - Explicit escape hatch from React's async batching

---

## State Ownership Map

```mermaid
graph TD
    subgraph "Problem State"
        currentProblem[currentProblem: string]
        problemParameters[problemParameters: Record]
        data[data: DataPoint array]
        customPoints[customPoints: DataPoint array]
    end

    subgraph "Algorithm State"
        gdFixed[gdFixed.iterations]
        gdLS[gdLS.iterations]
        newton[newton.iterations]
        lbfgs[lbfgs.iterations]
        diagPrecond[diagPrecond.iterations]
    end

    subgraph "Display State"
        iterationProportion[iterationProportion: number]
        currentIter[currentIter: derived]
        selectedTab[selectedTab: Algorithm]
    end

    subgraph "Hyperparameters (5 algorithms)"
        gdFixedAlpha[gdFixedAlpha]
        gdLSC1[gdLSC1]
        newtonC1[newtonC1]
        lbfgsC1[lbfgsC1]
        diagPrecondC1[diagPrecondC1]
        maxIter[maxIter]
        initialW0[initialW0]
        initialW1[initialW1]
    end

    subgraph "Story State"
        currentStoryId[currentStoryId]
        currentStoryStep[currentStoryStep]
    end

    subgraph "UI State"
        experimentLoading[experimentLoading]
        toast[toast]
        addPointMode[addPointMode]
        configurationExpanded[configurationExpanded]
    end

    subgraph "Coordination Refs"
        isLoadingExperimentRef[isLoadingExperimentRef]
        isNavigatingRef[isNavigatingRef]
    end

    %% Problem state flows to algorithms
    currentProblem --> gdFixed
    currentProblem --> gdLS
    currentProblem --> newton
    currentProblem --> lbfgs
    currentProblem --> diagPrecond

    problemParameters --> gdFixed
    problemParameters --> gdLS
    problemParameters --> newton
    problemParameters --> lbfgs
    problemParameters --> diagPrecond

    data --> gdFixed
    data --> gdLS
    data --> newton
    data --> lbfgs
    data --> diagPrecond

    %% Hyperparameters flow to algorithms
    gdFixedAlpha --> gdFixed
    gdLSC1 --> gdLS
    newtonC1 --> newton
    lbfgsC1 --> lbfgs
    diagPrecondC1 --> diagPrecond

    maxIter --> gdFixed
    maxIter --> gdLS
    maxIter --> newton
    maxIter --> lbfgs
    maxIter --> diagPrecond

    initialW0 --> gdFixed
    initialW0 --> gdLS
    initialW0 --> newton
    initialW0 --> lbfgs
    initialW0 --> diagPrecond

    initialW1 --> gdFixed
    initialW1 --> gdLS
    initialW1 --> newton
    initialW1 --> lbfgs
    initialW1 --> diagPrecond

    %% Display state
    iterationProportion --> currentIter
    selectedTab --> currentIter
    gdFixed --> currentIter
    gdLS --> currentIter
    newton --> currentIter
    lbfgs --> currentIter
    diagPrecond --> currentIter

    %% Story state flows to everything
    currentStoryId -.->|via loadExperiment| currentProblem
    currentStoryId -.->|via loadExperiment| problemParameters
    currentStoryId -.->|via loadExperiment| maxIter
    currentStoryId -.->|via loadExperiment| initialW0
    currentStoryId -.->|via loadExperiment| initialW1
    currentStoryStep -.->|via loadExperiment| currentProblem
    currentStoryStep -.->|via handleTabChange| selectedTab

    %% Ref coordination
    isLoadingExperimentRef -.->|guards| problemParameters
    isNavigatingRef -.->|guards| selectedTab
```

---

## Data Flow Patterns

### Pattern 1: User Adjusts Hyperparameter

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant State
    participant AlgoHook
    participant Canvas

    User->>UI: Drag alpha slider
    UI->>State: setGdFixedAlpha(0.5)
    Note over State: React batches update

    State->>AlgoHook: useAlgorithmIterations re-runs
    Note over AlgoHook: Deps: [alpha, ...]
    AlgoHook->>AlgoHook: runGradientDescent()
    AlgoHook->>State: setIterations(newIters)

    State->>Canvas: useEffect fires
    Note over Canvas: Deps: [iterations, currentIter]
    Canvas->>Canvas: Redraw parameter space
```

**Key Points**:
- Single state change triggers algorithm recomputation
- Canvas effects automatically pick up new iterations
- No explicit coordination needed - pure reactive flow

---

### Pattern 2: User Changes Problem

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant E2 as Effect 2
    participant State
    participant AlgoHooks
    participant E3 as Effect 3

    User->>UI: Select "Rosenbrock"
    UI->>State: setCurrentProblem("rosenbrock")

    par Effects fire in parallel
        E2->>E2: Check isLoadingExperimentRef
        E2->>State: setProblemParameters(defaults)
    and
        AlgoHooks->>AlgoHooks: All 5 re-run
        AlgoHooks->>AlgoHooks: Use new problem
    and
        E3->>E3: Compute global minimum
        E3->>E3: 🔴 Runs L-BFGS 1000 iters
    end

    State->>UI: Re-render with new data
```

**Key Points**:
- Effect 2 resets parameters to defaults
- All algorithm hooks re-run in parallel
- Effect 3 computes new global minimum (expensive)
- Multiple effects triggered by single state change

---

### Pattern 3: Load Experiment Preset

```mermaid
sequenceDiagram
    participant User
    participant loadExperiment
    participant Refs
    participant State
    participant E2 as Effect 2
    participant AlgoHooks

    User->>loadExperiment: Click preset button

    loadExperiment->>Refs: isLoadingExperimentRef = true
    Note over Refs: Prevent Effect 2 from resetting params

    loadExperiment->>State: setCurrentProblem(...)
    loadExperiment->>State: setProblemParameters(...)
    loadExperiment->>State: setInitialW0/W1(...)
    loadExperiment->>State: setGdFixedAlpha(...)
    loadExperiment->>State: setNewtonC1(...)
    loadExperiment->>State: ... (set all hyperparams)

    Note over State: React batches ALL updates
    Note over State: Single render cycle

    State->>E2: Effect fires (currentProblem changed)
    E2->>Refs: Check isLoadingExperimentRef
    E2->>E2: TRUE - skip reset!

    State->>AlgoHooks: All 5 algorithms re-run
    AlgoHooks->>AlgoHooks: Use experiment config
    AlgoHooks->>State: Return new iterations

    loadExperiment->>Refs: isLoadingExperimentRef = false
    loadExperiment->>State: setIterationProportion(1.0)
    Note over State: Jump to end

    State->>UI: Re-render with experiment loaded
```

**Key Points**:
- Ref prevents Effect 2 from interfering
- React's automatic batching groups all state updates
- All algorithms recompute once with final config
- iterationProportion set to 1.0 shows final state

---

### Pattern 4: Story Navigation with Scroll

```mermaid
sequenceDiagram
    participant User
    participant E6 as Effect 6
    participant loadExperiment
    participant handleTabChange
    participant DOM

    User->>User: Click "Next Step"
    User->>User: setCurrentStoryStep(n)

    Note over E6: Effect fires
    E6->>E6: Get story.steps[n]
    E6->>E6: Get experiment by ID

    E6->>loadExperiment: Load experiment
    Note over loadExperiment: See Pattern 3 above
    Note over loadExperiment: Sets all state

    E6->>E6: flushSync(() => handleTabChange())
    Note over E6: Force synchronous render

    handleTabChange->>handleTabChange: isNavigatingRef = true
    handleTabChange->>handleTabChange: Clear URL hash
    handleTabChange->>DOM: flushSync(() => setSelectedTab())
    Note over DOM: DOM GUARANTEED updated

    handleTabChange->>handleTabChange: isNavigatingRef = false

    E6->>DOM: CSS.escape(scrollTarget)
    E6->>DOM: querySelector([data-scroll-target])
    E6->>DOM: scrollIntoView({ behavior: smooth })

    Note over E6: No timing assumptions!
    Note over E6: DOM ready via flushSync
```

**Key Points**:
- `flushSync` eliminates setTimeout/RAF
- DOM guaranteed ready after flushSync
- `isNavigatingRef` prevents IntersectionObserver interference
- XSS protection via CSS.escape()
- Accessibility via prefers-reduced-motion

---

### Pattern 5: Cross-Algorithm Iteration Sync

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant State
    participant CurrentAlgo as Current Algorithm
    participant NewAlgo as New Algorithm

    User->>UI: Set iteration to 25 (out of 50)
    UI->>State: setIterationProportion(25/50 = 0.5)

    State->>CurrentAlgo: useMemo re-runs
    CurrentAlgo->>CurrentAlgo: currentIter = 0.5 * 50 = 25
    CurrentAlgo->>UI: Display iteration 25

    User->>UI: Switch to different algorithm tab
    UI->>State: setSelectedTab("lbfgs")

    State->>NewAlgo: useMemo re-runs
    NewAlgo->>NewAlgo: New algo has 100 iterations
    NewAlgo->>NewAlgo: currentIter = 0.5 * 100 = 50
    NewAlgo->>UI: Display iteration 50

    Note over NewAlgo: Same proportion (0.5)
    Note over NewAlgo: Different absolute iteration (50)
    Note over NewAlgo: User sees "middle" of both algos
```

**Key Points**:
- Proportion is universal across algorithms
- Each algorithm converts to its own absolute iteration
- Switching tabs preserves relative position
- No race conditions - pure derivation

---

## Critical State Dependencies

### Problem Parameters → Everything

```mermaid
graph LR
    problemParameters[problemParameters]

    problemParameters --> AlgoHooks[All 5 Algorithm Hooks]
    problemParameters --> E3[Effect 3: Global Min]
    problemParameters --> E9[Effect 9: Canvas Draw]

    AlgoHooks --> Canvases[10+ Canvas Effects]

    E3 -.->|Expensive| LBFGS[L-BFGS 1000 iters]

    style problemParameters fill:#ffcccc
    style LBFGS fill:#ffcccc
```

**Why This Matters**:
- Changing ANY parameter triggers ALL algorithms to recompute
- PLUS expensive global minimum computation
- PLUS all canvas redraws
- **This is the main performance bottleneck**

---

### Iteration Proportion → Display

```mermaid
graph LR
    iterationProportion[iterationProportion]
    selectedTab[selectedTab]

    iterationProportion --> currentIter[currentIter useMemo]
    selectedTab --> currentIter

    gdFixed[gdFixed.iterations] --> currentIter
    gdLS[gdLS.iterations] --> currentIter
    newton[newton.iterations] --> currentIter
    lbfgs[lbfgs.iterations] --> currentIter
    diagPrecond[diagPrecond.iterations] --> currentIter

    currentIter --> Canvases[10+ Canvas Effects]

    style currentIter fill:#ccffcc
    style Canvases fill:#ffffcc
```

**Why This Matters**:
- `currentIter` is pure derivation (no state)
- Changing proportion OR tab triggers canvas redraws
- But NO algorithm recomputations
- This is fast and clean

---

## Ref Coordination Patterns

### isLoadingExperimentRef: Prevent Parameter Reset

```mermaid
sequenceDiagram
    participant loadExperiment
    participant isLoadingExperimentRef
    participant E2 as Effect 2

    Note over loadExperiment: User loads preset

    loadExperiment->>isLoadingExperimentRef: Set to true
    loadExperiment->>loadExperiment: setCurrentProblem(...)

    Note over E2: currentProblem changed
    E2->>isLoadingExperimentRef: Check ref
    isLoadingExperimentRef-->>E2: true
    E2->>E2: Skip setProblemParameters

    loadExperiment->>loadExperiment: Set all state
    loadExperiment->>isLoadingExperimentRef: Set to false
```

**Pattern**: **Guard Effect with Ref**
- Effect checks ref before running
- Ref set BEFORE state change
- Ref cleared AFTER state change
- Prevents effect from interfering

---

### isNavigatingRef: Prevent Observer Interference

```mermaid
sequenceDiagram
    participant handleTabChange
    participant isNavigatingRef
    participant E4 as Effect 4 (Observer)

    Note over handleTabChange: User switches tabs

    handleTabChange->>isNavigatingRef: Set to true
    handleTabChange->>handleTabChange: Clear hash
    handleTabChange->>handleTabChange: flushSync(setSelectedTab)
    handleTabChange->>handleTabChange: scrollIntoView(hash)
    handleTabChange->>handleTabChange: Restore hash

    par During scroll
        E4->>E4: IntersectionObserver fires
        E4->>isNavigatingRef: Check ref
        isNavigatingRef-->>E4: true
        E4->>E4: Skip hash update
    end

    handleTabChange->>isNavigatingRef: Set to false
```

**Pattern**: **Suppress Effect During Operation**
- Ref acts as "operation in progress" flag
- Effect respects flag and skips its work
- Prevents circular updates (scroll → hash → scroll)

---

## Anti-Patterns and Mitigations

### Anti-Pattern 1: Stale Closure in Story Effect

**The Code**:
```typescript
useEffect(() => {
  // ... uses loadExperiment and handleTabChange
}, [currentStoryId, currentStoryStep]);
// INTENTIONALLY OMITS loadExperiment and handleTabChange
```

**Why It's An Anti-Pattern**:
- Violates Rules of Hooks (missing dependencies)
- Creates stale closures
- Functions used in effect may reference old state

**Why It Works Anyway**:
- `loadExperiment` uses setState callbacks, not closure state
- `handleTabChange` uses flushSync and fresh state
- Both functions don't actually capture state in closures

**Mitigation**:
- Documented in comments
- Could be replaced with "exploration mode" ref
- Requires vigilance to ensure functions don't capture state

---

### Anti-Pattern 2: Heavy Computation in Effect

**The Code**:
```typescript
useEffect(() => {
  if (requiresDataset(currentProblem)) {
    const result = runLBFGS(problemFuncs, {
      maxIter: 1000,  // 🔴 Expensive
      // ...
    });
    setLogisticGlobalMin(result.finalPosition);
  }
}, [currentProblem, data, problemParameters, lambda]);
```

**Why It's An Anti-Pattern**:
- Blocks UI thread
- Runs on every parameter change
- No debouncing or throttling

**Mitigation Options**:
1. Debounce with setTimeout
2. Use Web Worker
3. Cache results with useMemo
4. Question if it's needed at all

---

## State Update Batching Analysis

### React 18 Automatic Batching

All state updates are automatically batched, regardless of where they occur:

```typescript
// These are ALL batched into single render
setCurrentProblem("rosenbrock");
setProblemParameters({...});
setInitialW0(0);
setInitialW1(0);
setMaxIter(50);
// ... 20 more setState calls

// Only ONE render occurs
```

**Benefits**:
- Performance: 1 render instead of 20
- Consistency: All state changes visible together
- Predictability: No intermediate states

**Caveats**:
- Effects fire AFTER batch completes
- Can't observe intermediate states
- Must use refs for synchronization within batch

---

### flushSync Escape Hatch

When we need synchronous rendering:

```typescript
flushSync(() => {
  setSelectedTab(newTab);
});
// DOM is GUARANTEED updated here
const element = document.querySelector(...);
```

**Use Cases**:
1. Story navigation with scroll (need DOM ready)
2. Hash scrolling (need element to exist)
3. Any time we need to read DOM immediately after state change

**Costs**:
- Breaks React's performance optimizations
- Forces synchronous render (slower)
- Can't be interrupted by concurrent features

**Our Take**:
> "We are already circumventing react! better to use their explicit hooks for doing the thing we are trying to do if we are going to do it."

Prefer explicit `flushSync` over implicit timing assumptions (setTimeout, RAF).

---

## Testing Strategy

### Effect Chain Tests

```typescript
describe('Effect Coordination', () => {
  it('loadExperiment prevents Effect 2 parameter reset', () => {
    // Load experiment with custom parameters
    loadExperiment({
      problem: "rosenbrock",
      problemParameters: { a: 5, b: 10 }
    });

    // Effect 2 should NOT reset to defaults
    expect(problemParameters).toEqual({ a: 5, b: 10 });
  });

  it('Story navigation with stale closures works', () => {
    // Change state
    setCurrentProblem("quadratic");

    // Navigate to story step
    setCurrentStoryStep(1);

    // Should load story's experiment, not user's manual change
    expect(currentProblem).toBe(story.steps[1].experiment.problem);
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('Global minimum computation completes < 200ms', async () => {
    const start = performance.now();

    setCurrentProblem("logistic-regression");
    await waitFor(() => {
      expect(logisticGlobalMin).not.toBeNull();
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(200);
  });

  it('Canvas redraws at >30fps during slider drag', () => {
    // Simulate rapid slider changes
    for (let i = 0; i < 60; i++) {
      setIterationProportion(i / 60);
    }

    // Should complete all 60 updates within 2 seconds (30fps)
    expect(renderCount).toBe(60);
    expect(totalTime).toBeLessThan(2000);
  });
});
```

---

## Recommendations

### Immediate Actions

1. **Add Performance Monitoring**
   ```typescript
   useEffect(() => {
     performance.mark('global-min-start');
     const result = runLBFGS(...);
     performance.mark('global-min-end');
     performance.measure('global-min', 'global-min-start', 'global-min-end');
   }, [...]);
   ```

2. **Debounce Expensive Computations**
   ```typescript
   const debouncedParams = useDebounce(problemParameters, 300);
   useEffect(() => {
     // Use debouncedParams instead of problemParameters
   }, [debouncedParams]);
   ```

3. **Document Ref Coordination Pattern**
   - Add JSDoc to refs explaining their purpose
   - Add comments at usage sites
   - Create reusable hook: `useGuardedEffect`

### Long-term Improvements

4. **Extract Story Navigation Logic**
   ```typescript
   // Custom hook to encapsulate stale closure pattern
   useStoryNavigation(currentStoryId, currentStoryStep);
   ```

5. **Layer Canvas Rendering**
   - Static layer: Heatmap (recompute on problem change only)
   - Dynamic layer: Trajectory (recompute on iteration change)
   - Reduces redraws by 80%

6. **Consider State Management Library**
   - Zustand or Jotai for derived state
   - Better performance tracking
   - Easier to visualize state dependencies

---

## Conclusion

**Overall Architecture**: ✅ **Well-designed**

The state management is clean and predictable:
- Clear ownership of state
- Explicit coordination via refs
- Good use of React 18 features (batching, flushSync)
- No circular dependencies

**Main Concerns**:
- Performance of global minimum computation
- Stale closure pattern in story navigation
- Canvas redraw costs during slider drag

**Strengths**:
- Universal iteration proportion is elegant
- Ref guards prevent race conditions
- flushSync eliminates timing assumptions
- Automatic batching reduces render count
