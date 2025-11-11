# Eliminate setTimeout Race Conditions

**Date:** 2025-11-11
**Status:** Proposed
**Author:** System Analysis

## Problem Statement

The codebase currently contains timing-dependent code using `setTimeout` that relies on CPU speed, browser scheduling, and React's internal batching behavior. This creates fragile race conditions that can fail unpredictably.

### Current setTimeout Usages

After audit, found 3 uses of `setTimeout`:

1. **Toast.tsx:17** - ✅ Legitimate (auto-dismiss UI after duration)
2. **UnifiedVisualizer.tsx:854** - ⚠️ Race condition (defer state reset)
3. **UnifiedVisualizer.tsx:993** - ⚠️ Race condition (wait for DOM render)

### Issue #1: Experiment Loading State Reset (Line 854)

**Current Code:**
```typescript
// In loadExperiment()
setExperimentLoading(false);
setTimeout(() => {
  setExperimentJustLoaded(false);
}, 0);
```

**Problem:**
- Uses `setTimeout(..., 0)` to defer clearing `experimentJustLoaded`
- Relies on event loop timing: setTimeout runs after current call stack but timing vs React's useEffect is undefined
- **Assumption**: "setTimeout will run after React batches state updates but before useEffects run"
- **Reality**: This timing is not guaranteed and can vary by browser/load

**Why it exists:**
- `experimentJustLoaded` is a signal flag read by algorithm hooks to jump to final iteration
- Must remain `true` long enough for all useEffects to see it
- Then must clear to avoid affecting subsequent renders

**Failure Mode:**
- If setTimeout runs before useEffects → effects see `false` → don't jump to end
- If React batching changes → timing breaks

### Issue #2: Story Step Scrolling (Line 993)

**Current Code:**
```typescript
handleTabChange(experiment.algorithm, true);

if (step.scrollTo) {
  setTimeout(() => {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}
```

**Problem:**
- Uses arbitrary 100ms delay "waiting for tab content to render"
- **Assumption**: "100ms is enough for React to render new tab content"
- **Reality**:
  - On fast machines: wasteful 100ms delay before scroll
  - On slow machines/heavy load: content might not render in 100ms → scroll fails silently
  - No guarantee content exists at 100ms

**Why it exists:**
- Story steps switch tabs AND scroll to specific sections
- Tab content must render before `querySelector` can find the target
- No explicit signal when tab is ready

**Failure Mode:**
- Slow device + complex render → 100ms insufficient → querySelector returns null → no scroll
- Fast device → unnecessary 100ms delay feels sluggish

## Proposed Solutions

### Solution #1: Experiment Loading State Reset

**Replace `setTimeout` with controlled useEffect:**

```typescript
// Remove setTimeout from loadExperiment:
setExperimentLoading(false);
// Don't clear experimentJustLoaded here

// Add separate useEffect to clear flag after effects have run:
useEffect(() => {
  if (experimentJustLoaded) {
    // This effect runs AFTER all other effects that depend on experimentJustLoaded
    // Clear the flag so next render cycle doesn't see it
    setExperimentJustLoaded(false);
  }
}, [experimentJustLoaded]);
```

**Why this works:**
1. `loadExperiment()` sets `experimentJustLoaded = true`
2. React batches state updates
3. All useEffects run (algorithm hooks see `true` → jump to end)
4. **After all effects**, this cleanup effect runs
5. Sets `experimentJustLoaded = false`
6. Next render, flag is cleared

**Key insight:**
- Effects run in order of definition in component
- This cleanup effect should be defined LAST (or with low priority)
- No timing assumptions - pure React lifecycle

**Potential Issue:**
- If cleanup effect runs in SAME render cycle as algorithm effects, they might not see `true`
- Need to verify effect execution order

**Alternative (safer):**
```typescript
const experimentJustLoadedRef = useRef(false);

// In loadExperiment:
experimentJustLoadedRef.current = true;
setExperimentLoading(false);

// After ALL algorithm useEffects run, clear ref:
useEffect(() => {
  if (experimentJustLoadedRef.current) {
    experimentJustLoadedRef.current = false;
  }
}, [/* dependencies that trigger after algorithms update */]);
```

### Solution #2: Story Step Scrolling

**Replace arbitrary timeout with event-driven approach:**

**Option A: Use useEffect with tab dependency**
```typescript
// In story loading effect:
handleTabChange(experiment.algorithm, true);
// Don't scroll here

// Add separate effect that fires when tab is ready:
const scrollTargetRef = useRef<string | null>(null);

useEffect(() => {
  if (currentStoryStep !== null && scrollTargetRef.current) {
    // Tab has rendered (selectedTab changed and component updated)
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-scroll-target="${scrollTargetRef.current}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      scrollTargetRef.current = null;
    });
  }
}, [selectedTab, currentStoryStep]);

// When loading story step:
if (step.scrollTo) {
  scrollTargetRef.current = step.scrollTo;
}
handleTabChange(experiment.algorithm, true);
```

**Why this works:**
- Effect depends on `selectedTab` - runs when tab changes
- `requestAnimationFrame` ensures DOM is painted before scroll
- No arbitrary delays

**Option B: Callback from handleTabChange**
```typescript
// Modify handleTabChange to accept callback:
const handleTabChange = (newTab: Algorithm, skipScroll = false, onComplete?: () => void) => {
  setSelectedTab(newTab);

  if (onComplete) {
    requestAnimationFrame(() => {
      requestAnimationFrame(onComplete); // Two frames: one for state, one for render
    });
  }
};

// When loading story:
handleTabChange(experiment.algorithm, true, () => {
  if (step.scrollTo) {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
```

**Option C: Use MutationObserver** (most robust)
```typescript
if (step.scrollTo) {
  const observer = new MutationObserver(() => {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Safety: disconnect after 5 seconds if target never appears
  setTimeout(() => observer.disconnect(), 5000);
}
```

**Why this works:**
- Watches DOM for changes
- Scrolls immediately when target appears
- No timing assumptions
- Graceful fallback (5s timeout to prevent memory leak)

**Recommended: Option A** - simplest, most React-idiomatic

## Testing Strategy

### For Solution #1:
1. Load multiple experiment presets rapidly
2. Verify algorithm hooks always jump to final iteration
3. Test on slow device/throttled CPU
4. Check that flag clears properly (doesn't persist)

### For Solution #2:
1. Navigate through story steps with different scroll targets
2. Test on slow device with CPU throttling
3. Verify scroll happens to correct target
4. Check it doesn't scroll when target doesn't exist
5. Test rapid story navigation (spam next/prev)

## Risks and Considerations

### Risk #1: Effect Execution Order
- **Problem**: React doesn't guarantee useEffect execution order across component tree
- **Mitigation**:
  - Solution #1 relies on effects in same component (more predictable)
  - Use refs instead of state if timing is critical
  - Test thoroughly

### Risk #2: Scroll Target Not Found
- **Problem**: What if target element never renders?
- **Current behavior**: Silent failure (no scroll)
- **New behavior**: Same (Option A/B) or timeout cleanup (Option C)
- **Mitigation**: Add error logging in dev mode

### Risk #3: Breaking Existing Behavior
- **Problem**: Existing code might depend on current timing
- **Mitigation**:
  - Test all experiment presets
  - Test all story steps
  - Visual regression testing if available

### Risk #4: experimentJustLoaded Persistence
- **Problem**: What if cleanup effect doesn't run (unmount, error, etc.)?
- **Current behavior**: setTimeout ensures cleanup even on error
- **New behavior**: Might leave flag in wrong state
- **Mitigation**: Add cleanup in component unmount

## Implementation Order

1. **Implement Solution #1** (experiment loading)
   - Lower risk - isolated to one component
   - Already partially implemented (we have the cleanup useEffect)
   - Can verify quickly

2. **Test Solution #1** thoroughly

3. **Implement Solution #2** (story scrolling)
   - Higher risk - affects user-facing story navigation
   - More complex interaction (tabs + scroll)
   - Start with Option A (simplest)

4. **Test Solution #2** with all stories

5. **Remove setTimeout calls** once verified

## Open Questions

1. **Q**: Should we keep `setTimeout(..., 0)` in loadExperiment for backwards compat?
   **A**: No - we already have the cleanup useEffect, just need to remove setTimeout

2. **Q**: What if a story step specifies scrollTo but target doesn't exist?
   **A**: Current behavior is silent failure. Keep same behavior but add dev warning.

3. **Q**: Should we generalize scroll-on-render into a reusable hook?
   **A**: Maybe - `useScrollToElement(selector, deps)` - but only if we need it elsewhere.

4. **Q**: Are there other timing-dependent patterns in the codebase?
   **A**: Should audit for:
      - `requestAnimationFrame` chains (similar timing issues)
      - `Promise.resolve().then()` (microtask timing)
      - Manual DOM queries that assume render completion

## Success Criteria

- [ ] Zero `setTimeout(..., 0)` or `setTimeout(..., 100)` in non-UI code
- [ ] All experiment presets load correctly with variant preservation
- [ ] All story steps scroll to correct targets
- [ ] Works consistently on throttled CPU (6x slowdown)
- [ ] No race conditions under rapid user interaction
- [ ] No timing-dependent assumptions in code comments

## Related Issues

- Original bug: Experiment presets not preserving hyperplane variant
- Root cause: Race condition in `isLoadingExperimentRef` timing
- Current PR already partially addresses Solution #1

---

# Critical Review by Senior React Engineer

## Critical Issues (Blockers)

### 1. **Solution #1 is FUNDAMENTALLY BROKEN - Effect dependency on `experimentJustLoaded` creates infinite loop**

The proposed solution for Issue #1:

```typescript
useEffect(() => {
  if (experimentJustLoaded) {
    setExperimentJustLoaded(false);
  }
}, [experimentJustLoaded]);
```

**This will cause an INFINITE LOOP in React 18 StrictMode (which the app uses - see `/workspace/src/main.tsx`):**

1. `loadExperiment()` sets `experimentJustLoaded = true`
2. React batches state updates and renders
3. Cleanup effect sees `experimentJustLoaded = true` and calls `setExperimentJustLoaded(false)`
4. **State changes → triggers re-render**
5. Cleanup effect runs again, sees `false`, does nothing
6. **BUT in StrictMode, effects run TWICE in development**

Actually, wait - let me reconsider. The effect only updates when the value changes to `true`, then sets it to `false`. On the next render, the dependency is `false`, so the effect doesn't run again. This might not infinite loop, but it has a MORE SERIOUS PROBLEM:

**The ACTUAL problem: The cleanup effect runs IN THE SAME RENDER CYCLE as algorithm hooks!**

From `/workspace/src/hooks/useAlgorithmIterations.ts` line 69:
```typescript
}, [...dependencies, options?.jumpToEnd]);
```

The `jumpToEnd` option is a DEPENDENCY of the algorithm effects. This means:
- When `experimentJustLoaded` changes from `false` → `true`, ALL algorithm effects re-run
- The cleanup effect ALSO depends on `experimentJustLoaded`
- **React does NOT guarantee effect execution order across different useEffect calls**
- The cleanup effect could run BEFORE algorithm effects see the `true` value

**Concrete failure scenario:**
```typescript
// Render 1: experimentJustLoaded = false
// Effects run: algorithms see jumpToEnd: false

// loadExperiment() called
setExperimentJustLoaded(true)

// React batches state, renders
// Render 2: experimentJustLoaded = true
// Effects run in undefined order:
//   - If cleanup runs first: setExperimentJustLoaded(false) → algorithms see true ✓
//   - If algorithm runs first: algorithms see true, then cleanup runs ✓
//
// Wait, this might work...but ONLY if effects run in SAME render

// But what about StrictMode double-invocation?
// StrictMode runs effects TWICE:
//   - Mount
//   - Unmount + Remount (to catch missing cleanup)
//
// This could cause algorithms to see false when they should see true
```

### 2. **React 18 StrictMode Double-Invocation NOT ADDRESSED**

The app uses React 18 with StrictMode (confirmed in `/workspace/package.json` and `/workspace/src/main.tsx`). In development:

- **Effects run TWICE**: Mount → Unmount → Remount
- This is to help detect missing cleanup logic
- The plan COMPLETELY IGNORES this

**What happens with Solution #1 in StrictMode:**

```typescript
// First mount (StrictMode)
useAlgorithmIterations(..., { jumpToEnd: experimentJustLoaded })  // false
cleanup effect: experimentJustLoaded is false, do nothing

// Unmount (StrictMode cleanup)
// No cleanup logic

// Remount (StrictMode)
useAlgorithmIterations(..., { jumpToEnd: experimentJustLoaded })  // still false
cleanup effect: experimentJustLoaded is false, do nothing

// NOW loadExperiment() called
setExperimentJustLoaded(true)

// Render with true
useAlgorithmIterations(..., { jumpToEnd: true })  // runs TWICE in StrictMode
cleanup effect runs: sets to false

// But the SECOND invocation in StrictMode might see false!
```

### 3. **The Ref-Based Alternative (Line 118-130) is Also Broken**

The plan proposes:
```typescript
const experimentJustLoadedRef = useRef(false);

// In loadExperiment:
experimentJustLoadedRef.current = true;
setExperimentLoading(false);

// After ALL algorithm useEffects run, clear ref:
useEffect(() => {
  if (experimentJustLoadedRef.current) {
    experimentJustLoadedRef.current = false;
  }
}, [/* dependencies that trigger after algorithms update */]);
```

**Problems:**

1. **"dependencies that trigger after algorithms update"** - WHAT dependencies? The plan doesn't specify, and there ARE NO dependencies that reliably fire after algorithms complete
2. **Refs don't trigger re-renders** - If you change `experimentJustLoadedRef.current`, algorithm hooks won't re-run because refs don't cause effects to re-execute
3. **You'd need to pass the ref itself** - But the algorithm hooks take `jumpToEnd: boolean`, not a ref
4. **This fundamentally misunderstands React's reactivity model**

## Major Concerns (High Risk)

### 4. **Solution #2 Option A - Race Condition Still Exists**

```typescript
useEffect(() => {
  if (currentStoryStep !== null && scrollTargetRef.current) {
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-scroll-target="${scrollTargetRef.current}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      scrollTargetRef.current = null;
    });
  }
}, [selectedTab, currentStoryStep]);
```

**Problem: This doesn't actually solve the race condition:**

1. Effect runs when `selectedTab` changes
2. `requestAnimationFrame` schedules callback for NEXT frame
3. **What if React hasn't rendered the tab content yet?**
   - `setSelectedTab()` updates state
   - Effect runs
   - `requestAnimationFrame` callback fires ~16ms later
   - **Tab content JSX might not be committed to DOM yet**

**React 18 rendering is NOT synchronous with requestAnimationFrame:**
- React can batch updates across multiple frames
- Concurrent features can interrupt rendering
- There's NO guarantee that one `requestAnimationFrame` after state change means DOM is ready

**Example failure:**
```typescript
// User clicks story step
handleTabChange(experiment.algorithm, true)  // Sets selectedTab state
scrollTargetRef.current = step.scrollTo

// React schedules render
// Effect runs immediately (synchronously after render scheduled)
// requestAnimationFrame schedules callback

// Frame 1: React is still rendering (concurrent mode interrupted)
// Callback fires: querySelector returns null because DOM not updated yet

// Frame 2: React finishes rendering, commits to DOM
// Too late - scroll already failed
```

### 5. **Solution #2 Option B - Multiple requestAnimationFrame is Cargo Cult Programming**

```typescript
if (onComplete) {
  requestAnimationFrame(() => {
    requestAnimationFrame(onComplete); // Two frames: one for state, one for render
  });
}
```

**The comment "Two frames: one for state, one for render" is WRONG:**

- React doesn't render on a frame schedule
- State updates don't take "one frame"
- Rendering doesn't take "one frame"
- React 18 can spread rendering across MULTIPLE frames with Concurrent Mode
- This is just guessing "maybe 2 frames is enough?" - same problem as the 100ms timeout, just less obvious

**This could fail on:**
- Slow devices (React takes 3+ frames to render)
- Fast devices with high refresh rate (120Hz → frames are 8ms, not 16ms)
- React's concurrent rendering interrupting work

### 6. **Solution #2 Option C - MutationObserver Memory Leak and Performance Issues**

```typescript
const observer = new MutationObserver(() => {
  const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setTimeout(() => observer.disconnect(), 5000);
```

**Problems:**

1. **Observes ENTIRE document.body with subtree: true** - This fires on EVERY DOM mutation anywhere in the app. Massive performance cost.

2. **No cleanup if component unmounts** - If user navigates away before 5 seconds:
   - Observer keeps running
   - setTimeout keeps reference to observer
   - Memory leak until timeout fires

3. **querySelector on every mutation** - If React is rendering 100 components, this runs querySelector 100 times

4. **Race condition with setTimeout cleanup** - What if element appears at 5.001 seconds? Silent failure.

5. **The callback captures `step.scrollTo` from closure** - If multiple story steps load rapidly, you could have multiple observers with stale closures

**Better implementation would be:**
```typescript
useEffect(() => {
  if (!step.scrollTo) return;

  const observer = new MutationObserver(() => {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      observer.disconnect();
    }
  });

  // Check if it already exists
  const existing = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
  if (existing) {
    existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    observer.observe(document.getElementById('tab-content-container'), {
      childList: true,
      subtree: true
    });
  }

  return () => observer.disconnect();
}, [step.scrollTo]);
```

But even this has the performance problem of observing all mutations.

### 7. **Testing Strategy is Insufficient - Missing Critical Test Cases**

The plan's testing section (lines 221-235) doesn't include:

- **React 18 StrictMode testing** - Development behavior is different
- **Concurrent Mode behavior** - No mention of Suspense boundaries, concurrent rendering
- **Browser differences** - Safari has different scheduling behavior than Chrome
- **State updates during animation** - What if user changes state while scroll animation is in progress?
- **Multiple rapid loadExperiment calls** - What if user spam-clicks presets?
- **Component unmount during async operations** - All the async stuff (setTimeout, requestAnimationFrame, MutationObserver) needs unmount cleanup tests

## Minor Issues (Low Risk)

### 8. **Incorrect Mental Model of Effect Execution Order**

Line 108-110:
> Effects run in order of definition in component
> This cleanup effect should be defined LAST (or with low priority)

**This is WRONG:**
- React does NOT guarantee useEffect execution order
- Effects in the same component generally run in definition order, but this is NOT documented or guaranteed
- Effects that depend on the SAME state change all run together, order undefined
- "Low priority" is not a thing in React hooks - you can't set priority

### 9. **Current Implementation Already Has a Cleanup Effect**

Looking at `/workspace/src/UnifiedVisualizer.tsx` lines 106-112, there's already a cleanup effect:

```typescript
useEffect(() => {
  if (!experimentJustLoaded && isLoadingExperimentRef.current) {
    isLoadingExperimentRef.current = false;
  }
}, [experimentJustLoaded]);
```

**The plan says (line 268-269):**
> Already partially implemented (we have the cleanup useEffect)

But this effect does something DIFFERENT - it clears `isLoadingExperimentRef`, not `experimentJustLoaded`. The plan's proposed effect would create a SECOND effect that clears `experimentJustLoaded`, which would run alongside this one.

### 10. **Misleading Success Criteria**

Line 304:
> Works consistently on throttled CPU (6x slowdown)

**Problem:** CPU throttling doesn't simulate real-world behavior:
- Doesn't simulate network latency
- Doesn't simulate GPU bottlenecks (requestAnimationFrame waits for vsync)
- Doesn't simulate browser scheduling variations
- Doesn't simulate interruptions from other tabs/processes

Real testing needs actual slow devices (old Android phones, low-end Chromebooks), not just CPU throttling.

## Missing Considerations

### 11. **React 18 Automatic Batching**

React 18 changed batching behavior:
- **Old (React 17):** Only batches updates in event handlers
- **New (React 18):** Batches ALL updates (setTimeout, promises, native events)

The plan mentions "React batches state updates" but doesn't discuss how React 18's automatic batching changes the timing. The current `setTimeout(..., 0)` might have worked in React 17 but could behave differently in React 18.

**From the React 18 docs:**
> Starting in React 18 with createRoot, all updates will be automatically batched, no matter where they originate from.

This means the setTimeout in `loadExperiment` might be batched with the state updates, changing the timing completely.

### 12. **Concurrent Mode / Transitions**

The app uses React 18's `createRoot` (confirmed in `/workspace/src/main.tsx`), which enables Concurrent Mode. The plan has ZERO mention of:

- `useTransition` for marking updates as non-urgent
- `useDeferredValue` for deferring expensive recalculations
- Suspense boundaries that could delay rendering
- Time slicing that spreads rendering across frames

**Concurrent Mode makes ALL timing assumptions invalid:**
- Renders can be interrupted mid-way
- Renders can be split across multiple frames
- Low-priority updates can be paused for high-priority updates
- Effects might run much later than you expect

### 13. **The Real Root Cause is NOT Addressed**

The plan treats `setTimeout` as the problem, but the ACTUAL problem is:

**You're trying to coordinate state across multiple components/hooks using timing assumptions.**

The real solution should be:
1. **Use refs for synchronization, not state** - Refs are synchronous and don't trigger re-renders
2. **Or use a state machine** - Track loading phases explicitly
3. **Or use a library like `use-async-effect`** - Handle async lifecycle properly

**Example of correct solution using refs:**

```typescript
// Create a ref that algorithm hooks can read synchronously
const jumpToEndRef = useRef(false);
const [algorithmKey, setAlgorithmKey] = useState(0);

const loadExperiment = useCallback(() => {
  jumpToEndRef.current = true;
  setAlgorithmKey(k => k + 1);  // Force re-run with jumpToEnd = true

  // Clear flag after algorithms have consumed it
  // This is safe because refs are synchronous
  queueMicrotask(() => {
    jumpToEndRef.current = false;
  });
}, [...]);

// In algorithm hooks:
useAlgorithmIterations(
  'GD Fixed',
  () => runAlgorithm(),
  [currentProblem, ..., algorithmKey],  // Key forces re-run
  { jumpToEnd: jumpToEndRef.current }   // Read ref synchronously
);
```

But this still has issues because the options object needs to be stable or the effect will re-run unnecessarily.

### 14. **No Discussion of Browser Differences**

Different browsers have different scheduling behavior:

- **Safari:** Often slower at rendering, especially with Concurrent Mode
- **Firefox:** Different `requestAnimationFrame` timing behavior
- **Chrome:** Aggressive optimization might make timing bugs invisible
- **Mobile browsers:** Often deprioritize background tabs, affecting timing

The plan has zero mention of cross-browser testing.

### 15. **Scroll Behavior Variations Not Considered**

Line 997-998:
```typescript
target.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

**Issues:**
- `behavior: 'smooth'` is NOT supported in Safari < 15.4 (falls back to instant)
- Smooth scroll animations take ~300-500ms, during which user input might happen
- What if user scrolls manually during the animation? The animation continues, creating jarring UX
- What if there are multiple scroll calls in quick succession? (e.g., rapid story step navigation)

The plan says "test rapid story navigation" but doesn't specify expected behavior.

### 16. **Initial Mount Behavior Unspecified**

What happens on initial page load?
- Do experiments auto-load?
- Does `experimentJustLoaded` start as `false`?
- Do algorithm hooks run with `jumpToEnd: false` initially?

The plan doesn't address initial render behavior, only subsequent updates.

## Recommended Changes

### 1. **Reject Solution #1 Entirely - Use a Proper State Machine Instead**

Replace the flag-based approach with explicit loading phases:

```typescript
type ExperimentLoadingPhase =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'loaded', timestamp: number }
  | { type: 'ready' };

const [experimentPhase, setExperimentPhase] = useState<ExperimentLoadingPhase>({ type: 'idle' });

// In loadExperiment:
setExperimentPhase({ type: 'loaded', timestamp: Date.now() });

// Algorithm hooks check timestamp to determine if they should jump to end
const lastLoadedTimestamp = useRef(0);
const shouldJumpToEnd = experimentPhase.type === 'loaded' &&
                        experimentPhase.timestamp > lastLoadedTimestamp.current;

useAlgorithmIterations(
  'GD Fixed',
  () => runAlgorithm(),
  [currentProblem, ...],
  { jumpToEnd: shouldJumpToEnd }
);

// After algorithms run, mark as ready
useEffect(() => {
  if (experimentPhase.type === 'loaded') {
    lastLoadedTimestamp.current = experimentPhase.timestamp;
    setExperimentPhase({ type: 'ready' });
  }
}, [experimentPhase]);
```

This makes the state machine explicit and avoids timing assumptions.

### 2. **For Solution #2, Use Intersection Observer Instead**

Rather than trying to detect when the tab content is rendered, watch for when the scroll target becomes visible:

```typescript
useEffect(() => {
  if (!step.scrollTo) return;

  // Try immediate scroll first
  const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // If not found, set up IntersectionObserver to catch it when it appears
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting &&
          entry.target.getAttribute('data-scroll-target') === step.scrollTo) {
        entry.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        observer.disconnect();
      }
    });
  }, { threshold: 0.01 });

  // Observe the container, not document.body
  const container = document.getElementById('algorithm-tab-content');
  if (container) {
    Array.from(container.querySelectorAll('[data-scroll-target]'))
      .forEach(el => observer.observe(el));
  }

  return () => observer.disconnect();
}, [step.scrollTo, selectedTab]);
```

This is more efficient than MutationObserver and only observes relevant elements.

### 3. **Add Comprehensive Test Coverage**

Tests should include:
- React Testing Library tests with `waitFor` for async behavior
- Playwright E2E tests on actual slow devices
- StrictMode-specific test that verifies effects run correctly on remount
- Concurrent Mode tests with artificial delays using `act()`
- Cross-browser tests (Safari, Firefox, Chrome)

### 4. **Add Feature Detection for Smooth Scroll**

```typescript
const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
target.scrollIntoView({
  behavior: supportsSmooth ? 'smooth' : 'auto',
  block: 'center'
});
```

### 5. **Add Explicit Documentation of React Version Assumptions**

The plan should document:
- Requires React 18.x
- Uses Concurrent Mode (createRoot)
- StrictMode is enabled in development
- Automatic batching is assumed

### 6. **Consider Using React's `startTransition` for Low-Priority Updates**

```typescript
import { startTransition } from 'react';

const loadExperiment = useCallback(() => {
  // High priority: show loading state immediately
  setExperimentLoading(true);

  // Low priority: update experiment state
  startTransition(() => {
    setCurrentProblem(experiment.problem);
    setProblemParameters(experiment.problemParameters);
    // ... other updates
    setExperimentLoading(false);
  });
}, [...]);
```

This tells React that experiment loading is less important than user input, reducing perceived lag.

---

## Summary

**This plan should NOT be implemented as written.** The proposed Solution #1 has fundamental issues with React's effect execution model and will not work reliably in React 18 with StrictMode. Solution #2's options all have race conditions or performance issues.

The core problem is that the plan tries to solve timing issues with different timing mechanisms, rather than eliminating the need for timing coordination altogether. A proper solution requires:

1. Explicit state machines instead of boolean flags
2. Refs for synchronous coordination instead of state
3. IntersectionObserver instead of waiting for renders
4. Acknowledgment of React 18 Concurrent Mode implications
5. Comprehensive cross-browser and performance testing

The current `setTimeout` approach, while fragile, might actually be MORE reliable than the proposed solutions because at least it has a predictable delay. The proposed solutions introduce new race conditions while trying to eliminate the old ones.
