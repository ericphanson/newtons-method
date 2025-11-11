# Story Navigation: Eliminate setTimeout via handleTabChange

**Date**: 2025-11-11
**Status**: Proposed - Awaiting Critical Review
**Goal**: Eliminate the last setTimeout in user interaction flow

## Current Problem

Story navigation uses `setTimeout(..., 100)` to wait for tab content to render:

```typescript
// Line 1037-1049 in UnifiedVisualizer.tsx
if (step.scrollTo) {
  setTimeout(() => {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}
```

**Issues**:
- Arbitrary 100ms delay (guess)
- Can fail on slow devices
- Wastes time on fast devices
- Timing-dependent

## Proposed Solution

**Key Insight**: `handleTabChange` already has `requestAnimationFrame` logic to wait for tab content to render before scrolling to hash. We can reuse this for story scrolling.

### Changes

**1. Add optional `scrollTarget` parameter to `handleTabChange`**

```typescript
const handleTabChange = (
  newTab: Algorithm,
  skipScroll = false,
  scrollTarget?: string  // NEW: data-scroll-target value to scroll to
) => {
  // ... existing code ...

  // After React renders the new tab, try to scroll
  if (currentHash && !skipScroll) {
    // Existing hash scroll logic
  } else if (scrollTarget) {
    // NEW: Story scroll logic using same RAF pattern
    const frameId = requestAnimationFrame(() => {
      const target = document.querySelector(`[data-scroll-target="${scrollTarget}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Re-enable IntersectionObserver
      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    });
    pendingAnimationFramesRef.current.push(frameId);
  } else {
    // No scroll needed, just re-enable observer
    requestAnimationFrame(() => {
      isNavigatingRef.current = false;
    });
  }
};
```

**2. Update story navigation call**

```typescript
// OLD (lines 1034-1049):
handleTabChange(experiment.algorithm, true);

if (step.scrollTo) {
  setTimeout(() => {
    const target = document.querySelector(`[data-scroll-target="${step.scrollTo}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// NEW:
handleTabChange(experiment.algorithm, true, step.scrollTo);
```

## Benefits

1. **No setTimeout**: Uses RAF which is frame-synchronized
2. **Consistent timing**: Same pattern as hash scrolling
3. **Proper cleanup**: Uses existing `pendingAnimationFramesRef` tracking
4. **Less code duplication**: Reuses scroll infrastructure
5. **Better performance**: RAF fires when browser is ready to paint

## Edge Cases

### Case 1: Both hash and scrollTarget provided
Not possible - story navigation always passes `skipScroll: true`, so hash scroll is disabled.

### Case 2: scrollTarget element doesn't exist
Silent failure - same as current behavior. Element not found, scroll doesn't happen.

### Case 3: Rapid story navigation
Properly handled - `pendingAnimationFramesRef` cleanup cancels previous frames.

### Case 4: Tab already active (user clicks same tab)
`setSelectedTab` is idempotent - won't trigger re-render if tab unchanged. RAF still fires but is harmless.

## Potential Issues

### Issue 1: One RAF might not be enough

**Problem**: `requestAnimationFrame` fires on next frame, but React might not have committed to DOM yet in Concurrent Mode.

**Mitigation**: Same issue exists with current hash scrolling. If it's a problem, we'd need to fix both. For now, one RAF has worked well for hash scrolling.

**Fallback**: If this fails, we could add a second RAF like the hash scroll logic uses, or add retry logic.

### Issue 2: XSS vulnerability in querySelector

**Problem**: `scrollTarget` comes from story data and is used in `querySelector` without escaping.

```typescript
const target = document.querySelector(`[data-scroll-target="${scrollTarget}"]`);
```

If `scrollTarget` contains special characters like `"]`, this could be exploited.

**Mitigation**: Story data is static and trusted (defined in code), not user input. Low risk.

**Future fix**: Use `CSS.escape()` for defense in depth:

```typescript
const escapedTarget = CSS.escape(scrollTarget);
const target = document.querySelector(`[data-scroll-target="${escapedTarget}"]`);
```

### Issue 3: Smooth scroll accessibility

**Problem**: `behavior: 'smooth'` can trigger motion sickness and isn't supported in old Safari.

**Mitigation**: Same issue exists throughout the app. Not specific to this change.

**Future fix**: Respect `prefers-reduced-motion`:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
target.scrollIntoView({
  behavior: prefersReducedMotion ? 'auto' : 'smooth',
  block: 'center'
});
```

## Testing Plan

- [ ] Story navigation scrolls to correct element
- [ ] Rapid story navigation doesn't cause memory leaks
- [ ] Missing scroll target fails gracefully
- [ ] Tab switching without story still works
- [ ] Hash scrolling still works (no regression)
- [ ] Works on slow devices (CPU throttle 6x)
- [ ] No console errors

## Implementation

1. Add `scrollTarget?: string` parameter to `handleTabChange`
2. Add conditional RAF logic for `scrollTarget` case
3. Update story navigation call to pass `step.scrollTo`
4. Remove old setTimeout code
5. Test edge cases

## Rollback Plan

If issues arise, revert to setTimeout approach. The change is isolated to two locations.

---

## OPUS CRITICAL REVIEW

### Executive Summary

The proposed solution contains **multiple critical issues** that will likely cause failures in production. While the general approach of reusing the RAF pattern from hash scrolling is sound, the implementation has serious flaws around React 18 compatibility, memory management, and DOM element targeting.

### Issue Analysis

#### 🔴 **CRITICAL ISSUES**

##### 1. **CollapsibleSection Props Not Passed Through**
**Severity**: CRITICAL
**Impact**: The entire solution will not work as intended

The plan assumes `data-scroll-target` attributes on `CollapsibleSection` components will be rendered to the DOM, but the component doesn't accept or pass through arbitrary props:

```typescript
// Current CollapsibleSection interface - no ...rest props
interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  storageKey?: string;
  id?: string;
  children: React.ReactNode;
}
```

When used as:
```tsx
<CollapsibleSection title="..." data-scroll-target="configuration">
```

The `data-scroll-target` attribute is **silently ignored** and never reaches the DOM. The querySelector will fail to find these elements.

##### 2. **Memory Leak on Component Unmount**
**Severity**: CRITICAL
**Impact**: RAF callbacks will execute on unmounted components

The component tracks pending animation frames in `pendingAnimationFramesRef` but **never cancels them on unmount**:

```typescript
// No cleanup in useEffect or component unmount
const pendingAnimationFramesRef = useRef<number[]>([]);
```

If the user navigates away while RAF callbacks are pending, they will execute on an unmounted component, potentially causing:
- Memory leaks
- React warnings about setting state on unmounted components
- Attempts to access DOM elements that no longer exist

##### 3. **React 18 StrictMode Double Invocation**
**Severity**: CRITICAL
**Impact**: Race conditions and unpredictable behavior in development

The app runs in React 18 StrictMode:
```tsx
<StrictMode>
  <App />
</StrictMode>
```

StrictMode intentionally double-invokes effects and state setters to detect side effects. The proposed solution doesn't account for this:
- `handleTabChange` could be called twice rapidly
- RAF callbacks might queue up multiple times
- The cleanup logic (`pendingAnimationFramesRef.current = []`) might clear the wrong set of callbacks

#### 🟠 **MAJOR ISSUES**

##### 4. **Single RAF Insufficient for React 18 Concurrent Mode**
**Severity**: MAJOR
**Impact**: Scrolling will fail intermittently

The plan acknowledges this issue but dismisses it:
> "Same issue exists with current hash scrolling. If it's a problem, we'd need to fix both."

This is incorrect reasoning. The existing hash scroll logic uses **two nested RAFs** specifically to handle React's render cycle:

```typescript
// Current implementation uses nested RAFs
const frameId1 = requestAnimationFrame(() => {
  // First frame - DOM might not be ready
  const targetElement = document.querySelector(currentHash);
  if (targetElement) {
    targetElement.scrollIntoView({ block: 'start' });
  }

  // Second frame for cleanup
  const frameId2 = requestAnimationFrame(() => {
    isNavigatingRef.current = false;
  });
});
```

In React 18 Concurrent Mode, a single RAF is often insufficient because:
- React may not have committed changes to the DOM yet
- Concurrent rendering can defer DOM updates
- Automatic batching might delay the render

##### 5. **XSS Vulnerability via querySelector Injection**
**Severity**: MAJOR
**Impact**: Potential DOM manipulation if story data is compromised

While the plan mentions this issue and claims "story data is static and trusted," this is a dangerous assumption:

```typescript
// Vulnerable to injection if scrollTarget contains: "];alert('XSS');["
const target = document.querySelector(`[data-scroll-target="${scrollTarget}"]`);
```

If `scrollTarget` contains `"]` or other special characters, it can break out of the attribute selector. The mitigation using `CSS.escape()` is mentioned but not implemented in the proposed solution.

##### 6. **Race Condition with Rapid Navigation**
**Severity**: MAJOR
**Impact**: Wrong element scrolled or scroll happens at wrong time

The plan claims "Properly handled - `pendingAnimationFramesRef` cleanup cancels previous frames," but this is insufficient:

1. User rapidly navigates between stories
2. First navigation queues RAF for scrollTarget A
3. Second navigation cancels RAF and queues for scrollTarget B
4. Tab content for B renders
5. RAF fires and tries to find scrollTarget B
6. But if React is still reconciling, the DOM might still have elements from A

The existing cleanup doesn't prevent this because it only cancels the RAF callback, not the React state update that triggered the render.

#### 🟡 **MINOR ISSUES**

##### 7. **Inconsistent Scroll Behavior**
**Severity**: MINOR
**Impact**: Different scroll behaviors for hash vs story scrolling

Hash scrolling uses `block: 'start'` while story scrolling uses `block: 'center'`:
```typescript
// Hash scroll
targetElement.scrollIntoView({ block: 'start' });

// Story scroll (proposed)
target.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

This inconsistency could confuse users and make the UI feel disjointed.

##### 8. **No Accessibility Considerations**
**Severity**: MINOR
**Impact**: Motion sickness for users with vestibular disorders

The plan mentions `prefers-reduced-motion` but doesn't implement it in the proposed solution. Users who are sensitive to motion will experience smooth scrolling without an option to disable it.

##### 9. **No Retry Logic for Missing Elements**
**Severity**: MINOR
**Impact**: Silent failures when elements load slowly

If the target element doesn't exist when RAF fires, the scroll silently fails. Unlike the hash scrolling which at least logs the failure, there's no retry mechanism or user feedback.

### Alternative Approaches

#### Better Solution 1: **Use React Refs and Effects**
Instead of relying on `querySelector` and timing:
```typescript
// Create refs for scroll targets
const scrollTargets = useRef<Map<string, HTMLElement>>(new Map());

// Register elements via ref callbacks
<div ref={el => el && scrollTargets.current.set('problem', el)}>

// Use effect to scroll when ready
useEffect(() => {
  if (scrollTarget) {
    const element = scrollTargets.current.get(scrollTarget);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [selectedTab, scrollTarget]);
```

#### Better Solution 2: **Use IntersectionObserver for Element Ready Detection**
Monitor when the target element becomes available:
```typescript
const waitForElementAndScroll = (selector: string) => {
  const observer = new MutationObserver(() => {
    const element = document.querySelector(selector);
    if (element) {
      observer.disconnect();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Timeout after 1 second
  setTimeout(() => observer.disconnect(), 1000);
};
```

#### Better Solution 3: **Use React 18's `flushSync`**
Force synchronous rendering when needed:
```typescript
import { flushSync } from 'react-dom';

const handleTabChange = (newTab, skipScroll, scrollTarget) => {
  flushSync(() => {
    setSelectedTab(newTab);
  });

  // DOM is now guaranteed to be updated
  if (scrollTarget) {
    const target = document.querySelector(`[data-scroll-target="${CSS.escape(scrollTarget)}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
```

### Recommendations

1. **DO NOT IMPLEMENT** the proposed solution as-is
2. **FIX** the CollapsibleSection component to accept and spread additional props
3. **ADD** proper cleanup on component unmount
4. **USE** CSS.escape() for all querySelector calls
5. **IMPLEMENT** retry logic or element detection
6. **TEST** thoroughly in React 18 StrictMode
7. **CONSIDER** using refs instead of data attributes for more reliable element targeting
8. **ADD** accessibility support for reduced motion
9. **ENSURE** consistent scroll behavior across all navigation types

### Risk Assessment

**Overall Risk**: **HIGH**

The proposed solution will likely:
- Fail completely due to missing DOM attributes
- Cause memory leaks in production
- Create race conditions in development
- Provide poor user experience with silent failures

**Recommendation**: Redesign the solution using React-idiomatic patterns (refs, effects) rather than imperative DOM manipulation with timing workarounds.
