# Hash-Based Navigation for Algorithm Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to stay scrolled to the same section (e.g., "Parameter Space") when switching between algorithm tabs using URL hash navigation and automatic hash updates on scroll.

**Architecture:**
- Add `id` attributes to all major sections across algorithm tabs using consistent naming
- Modify tab switching logic to preserve and apply URL hash when changing tabs
- Add IntersectionObserver to automatically update URL hash as user scrolls through sections
- Use fallback strategy A: if hash section doesn't exist in new tab, maintain scroll position

**Tech Stack:** React, TypeScript, IntersectionObserver API, native browser hash navigation

**Note:** While react-router-dom is installed in this project, this feature uses native browser hash navigation (URL `#fragment`), not React Router's hash-based routing.

---

## Phase 0: Setup

### Task 0: Create feature branch and verify clean state

**Step 1: Verify clean working tree and create branch**

```bash
# Check git status
git status

# If there are untracked/modified files, stash or commit them first
# Create feature branch for easy rollback
git checkout -b feat/hash-navigation
```

**Step 2: Verify build works before making changes**

```bash
# Test that project builds successfully
npm run build
# Or for faster TypeScript-only check:
npx tsc --noEmit
```

---

## Phase 1: Update CollapsibleSection Component

### Task 1: Add id prop support to CollapsibleSection

**Files:**
- Modify: `src/components/CollapsibleSection.tsx:3-7,43`

**Step 1: Add id to CollapsibleSection interface**

In `src/components/CollapsibleSection.tsx`, update the interface:

```typescript
interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  storageKey?: string;  // For localStorage persistence
  id?: string;  // For hash navigation
  children: React.ReactNode;
}
```

**Step 2: Add id to component props and outer container**

Update the component signature (line 16) and add `id={id}` to the outer div at line 43.

Find this code at line 43:
```typescript
  return (
    <div className="mb-4">
```

Change it to:
```typescript
  return (
    <div id={id} className="mb-4">
```

Also update the component signature to destructure the new `id` prop:
```typescript
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  storageKey,
  id,  // Add this line
  children
}) => {
```

**Step 3: Test CollapsibleSection renders with id**

Manual test:
1. Save the changes
2. Check browser dev tools that a CollapsibleSection has an id attribute on its outer div
3. Try navigating to `#section-id` in browser URL - should scroll to that section

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/components/CollapsibleSection.tsx
git commit -m "feat: add id prop to CollapsibleSection for hash navigation"
```

---

## Phase 2: Add IDs to Algorithm Tab Sections

### Task 2: Add IDs to GdFixedTab sections

**Files:**
- Modify: `src/components/tabs/GdFixedTab.tsx:74,108,174,233,251,326,395`

**Step 1: Add id to Algorithm Configuration section**

Line 74:
```tsx
<CollapsibleSection
  title="Algorithm Configuration"
  defaultExpanded={true}
  id="configuration"
>
```

**Step 2: Add id to Parameter Space h3**

Line 108-109:
```tsx
<div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
```

**Step 3: Add id to Quick Start section**

Line 174:
```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={false}
  storageKey="gd-fixed-quick-start"
  id="quick-start"
>
```

**Step 4: Add id to Try This section**

Line 233:
```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={false}
  storageKey="gd-fixed-try-this"
  id="try-this"
>
```

**Step 5: Add id to When Things Go Wrong section**

Line 251:
```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="gd-fixed-when-wrong"
  id="when-things-go-wrong"
>
```

**Step 6: Add id to Mathematical Derivations section**

Line 326:
```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="gd-fixed-math-derivations"
  id="mathematical-derivations"
>
```

**Step 7: Add id to Advanced Topics section**

Line 395:
```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="gd-fixed-advanced"
  id="advanced-topics"
>
```

**Step 8: Test manual hash navigation in GdFixedTab**

Manual test:
1. Navigate to GD Fixed tab
2. Try URLs like `#parameter-space`, `#quick-start`, `#advanced-topics`
3. Browser should scroll to each section

**Step 9: Commit**

```bash
git add src/components/tabs/GdFixedTab.tsx
git commit -m "feat(gd-fixed): add section IDs for hash navigation"
```

---

### Task 3: Add IDs to GdLineSearchTab sections

**Files:**
- Modify: `src/components/tabs/GdLineSearchTab.tsx:110,189,258,342,361,438,492`

**Step 1: Add id to Parameter Space h3**

Line 110-111:
```tsx
<div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
```

**Step 2: Add id to Quick Start section**

Line 189:
```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={false}
  storageKey="gd-ls-quick-start"
  id="quick-start"
>
```

**Step 3: Add id to Line Search Details section**

Line 258:
```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={false}
  storageKey="gd-ls-line-search-details"
  id="line-search-details"
>
```

**Step 4: Add id to Try This section**

Line 342:
```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={false}
  storageKey="gd-ls-try-this"
  id="try-this"
>
```

**Step 5: Add id to When Things Go Wrong section**

Line 361:
```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="gd-ls-when-wrong"
  id="when-things-go-wrong"
>
```

**Step 6: Add id to Mathematical Derivations section**

Line 438:
```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="gd-ls-math-derivations"
  id="mathematical-derivations"
>
```

**Step 7: Add id to Advanced Topics section**

Line 492:
```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="gd-ls-advanced"
  id="advanced-topics"
>
```

**Step 8: Test manual hash navigation**

Manual test:
1. Navigate to GD Line Search tab
2. Try hash URLs for all sections
3. Verify browser scrolls correctly

**Step 9: Commit**

```bash
git add src/components/tabs/GdLineSearchTab.tsx
git commit -m "feat(gd-linesearch): add section IDs for hash navigation"
```

---

### Task 4: Add IDs to NewtonTab sections

**Files:**
- Modify: `src/components/tabs/NewtonTab.tsx:130,219,389,434,453,528,635`

**Step 1: Add id to Parameter Space h3**

Line 130-131:
```tsx
<div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
```

**Step 2: Add id to Quick Start section**

Line 219:
```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={false}
  storageKey="newton-quick-start"
  id="quick-start"
>
```

**Step 3: Add id to Line Search Details section**

Line 389:
```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={false}
  storageKey="newton-line-search-details"
  id="line-search-details"
>
```

**Step 4: Add id to Try This section**

Line 434:
```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={false}
  storageKey="newton-try-this"
  id="try-this"
>
```

**Step 5: Add id to When Things Go Wrong section**

Line 453:
```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="newton-when-wrong"
  id="when-things-go-wrong"
>
```

**Step 6: Add id to Mathematical Derivations section**

Line 528:
```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="newton-math-derivations"
  id="mathematical-derivations"
>
```

**Step 7: Add id to Advanced Topics section**

Line 635:
```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="newton-advanced"
  id="advanced-topics"
>
```

**Step 8: Test manual hash navigation**

Manual test:
1. Navigate to Newton tab
2. Try hash URLs for all sections
3. Verify scrolling works

**Step 9: Commit**

```bash
git add src/components/tabs/NewtonTab.tsx
git commit -m "feat(newton): add section IDs for hash navigation"
```

---

### Task 5: Add IDs to LbfgsTab sections

**Files:**
- Modify: `src/components/tabs/LbfgsTab.tsx:112,201,309,375,394,492,626`

**Step 1: Add id to Parameter Space h3**

Line 112-113:
```tsx
<div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
```

**Step 2: Add id to Quick Start section**

Line 201:
```tsx
<CollapsibleSection
  title="Quick Start"
  defaultExpanded={false}
  storageKey="lbfgs-quick-start"
  id="quick-start"
>
```

**Step 3: Add id to Line Search Details section**

Line 309:
```tsx
<CollapsibleSection
  title="Line Search Details"
  defaultExpanded={false}
  storageKey="lbfgs-line-search-details"
  id="line-search-details"
>
```

**Step 4: Add id to Try This section**

Line 375:
```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={false}
  storageKey="lbfgs-try-this"
  id="try-this"
>
```

**Step 5: Add id to When Things Go Wrong section**

Line 394:
```tsx
<CollapsibleSection
  title="When Things Go Wrong"
  defaultExpanded={false}
  storageKey="lbfgs-when-wrong"
  id="when-things-go-wrong"
>
```

**Step 6: Add id to Mathematical Derivations section**

Line 492:
```tsx
<CollapsibleSection
  title="Mathematical Derivations"
  defaultExpanded={false}
  storageKey="lbfgs-math-derivations"
  id="mathematical-derivations"
>
```

**Step 7: Add id to Advanced Topics section**

Line 626:
```tsx
<CollapsibleSection
  title="Advanced Topics"
  defaultExpanded={false}
  storageKey="lbfgs-advanced"
  id="advanced-topics"
>
```

**Step 8: Test manual hash navigation**

Manual test:
1. Navigate to L-BFGS tab
2. Try hash URLs for all sections
3. Verify scrolling works

**Step 9: Commit**

```bash
git add src/components/tabs/LbfgsTab.tsx
git commit -m "feat(lbfgs): add section IDs for hash navigation"
```

---

### Task 6: Add IDs to DiagonalPrecondTab sections

**Files:**
- Modify: `src/components/tabs/DiagonalPrecondTab.tsx:138,215,313,403`

**Step 1: Add id to Parameter Space container div**

Line 138-139 (not 126-127):
```tsx
<div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
```

**Note:** Adding `id` to the container div that wraps the h3, not the h3 itself.

**Step 2: Add id to Quick Start section**

Line 215:
```tsx
<CollapsibleSection
  title="Quick Start: The Core Problem"
  defaultExpanded={false}
  storageKey="diagonal-precond-quick-start"
  id="quick-start"
>
```

**Step 3: Add id to Rotation Failure section**

Line 313:
```tsx
<CollapsibleSection
  title="Why Diagonal Preconditioning Fails"
  defaultExpanded={false}
  storageKey="diagonal-precond-rotation-failure"
  id="rotation-failure"
>
```

**Step 4: Add id to Try This section**

Line 403:
```tsx
<CollapsibleSection
  title="Try This"
  defaultExpanded={false}
  storageKey="diagonal-precond-try-this"
  id="try-this"
>
```

**Step 5: Test manual hash navigation**

Manual test:
1. Navigate to Diagonal Precond tab
2. Try hash URLs for all sections
3. Verify scrolling works

**Step 6: Commit**

```bash
git add src/components/tabs/DiagonalPrecondTab.tsx
git commit -m "feat(diagonal-precond): add section IDs for hash navigation"
```

---

## Phase 3: Implement Hash Preservation in Tab Switching

### Task 7: Add hash preservation to tab switching logic

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (multiple locations)

**Step 1: Find the setSelectedTab usage in button handlers**

Located at lines 1466-1537 (the 7 tab buttons). We need to wrap the onClick handlers to preserve hash.

**Step 2: Create handleTabChange function**

Add this new function after the last state declaration (after line 96, before the first useEffect):

```typescript
// Hash-preserving tab change handler
const handleTabChange = (newTab: Algorithm) => {
  const currentHash = window.location.hash;
  setSelectedTab(newTab);

  // After React renders the new tab, try to scroll to the hash if it exists
  if (currentHash) {
    setTimeout(() => {
      const targetElement = document.querySelector(currentHash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Fallback strategy A: if element doesn't exist, do nothing (maintain scroll)
    }, 50); // Small delay to ensure tab content has rendered
  }
};
```

**Step 3: Update tab button onClick handlers**

At lines 1466, 1477, 1487, 1497, 1508, 1518, 1528 (the 7 tab buttons), change `onClick={() => setSelectedTab('...')}` to use `handleTabChange`:

**IMPORTANT:** Only change the `onClick` handler. Do NOT modify the `className` prop. The `${...}` shown below is truncated for brevity - leave the full conditional className logic as-is.

```tsx
{/* Stories Tab - Line 1466 */}
<button
  onClick={() => handleTabChange('stories')}
  className={/* ... leave existing className unchanged ... */}
>

{/* Algorithms Tab */}
<button
  onClick={() => handleTabChange('algorithms')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>

{/* GD Fixed Tab */}
<button
  onClick={() => handleTabChange('gd-fixed')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>

{/* GD Line Search Tab */}
<button
  onClick={() => handleTabChange('gd-linesearch')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>

{/* Diagonal Precond Tab */}
<button
  onClick={() => handleTabChange('diagonal-precond')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>

{/* Newton Tab */}
<button
  onClick={() => handleTabChange('newton')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>

{/* L-BFGS Tab */}
<button
  onClick={() => handleTabChange('lbfgs')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${...}`}
>
```

**Step 4: Test hash preservation manually**

Manual test:
1. Navigate to Newton tab
2. Scroll to "Parameter Space" section
3. Manually change URL to include `#parameter-space`
4. Switch to L-BFGS tab
5. Verify it scrolls to "Parameter Space" in L-BFGS tab
6. Switch to Diagonal Precond tab (which doesn't have all sections)
7. Try switching from Newton `#line-search-details` to Diagonal Precond
8. Verify it maintains scroll position (fallback A)

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: preserve hash when switching tabs for consistent navigation"
```

---

## Phase 4: Implement Scroll-Based Hash Updates

### Task 8: Add IntersectionObserver for automatic hash updates

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add new useEffect)

**Step 1: Add useEffect with IntersectionObserver**

Add this after line 264 (after the global minimum calculation useEffect closes):

```typescript
// Automatically update URL hash based on visible section
useEffect(() => {
  // Get all sections that have IDs (our navigation targets)
  // Using prefix matching (id^=) for section name prefixes, exact match (id=) for "configuration"
  const sections = document.querySelectorAll('[id^="parameter-"], [id^="quick-"], [id^="try-"], [id^="when-"], [id^="mathematical-"], [id^="advanced-"], [id^="line-search-"], [id^="rotation-"], [id="configuration"]');

  if (sections.length === 0) return;

  const observerOptions = {
    root: null, // viewport
    rootMargin: '-20% 0px -70% 0px', // Trigger when section is in upper 30% of viewport
    threshold: 0
  };

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    // Note: IntersectionObserverEntry is a built-in browser API type, no import needed
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id) {
        // Update URL hash without scrolling
        const newHash = `#${entry.target.id}`;
        if (window.location.hash !== newHash) {
          window.history.replaceState(null, '', newHash);
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Cleanup
  return () => {
    sections.forEach(section => observer.unobserve(section));
  };
}, [selectedTab]); // Re-run when tab changes to observe new sections
```

**Step 2: Test automatic hash updates**

Manual test:
1. Navigate to any algorithm tab (e.g., Newton's Method)
2. Scroll slowly through the page
3. **Look at the browser address bar** - watch the URL hash update as you enter different sections
4. Verify hash changes to `#parameter-space`, `#quick-start`, etc. as sections come into view
5. Switch tabs while at a specific section (e.g., at `#parameter-space`)
6. Verify the new tab scrolls to that section if it exists (L-BFGS should scroll to its parameter-space section)

**Step 3: Test edge cases**

Edge case tests:
1. Scroll to bottom of page - hash should update to last section
2. Scroll back up - hash should update to earlier sections
3. Quick scrolling - hash should update appropriately without lag
4. Tab switch while scrolling - should still preserve intended section

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat: auto-update URL hash based on scroll position"
```

---

## Phase 5: Final Testing and Polish

### Task 9: Comprehensive manual testing

**Manual Test Checklist:**

1. **Hash preservation across algorithm tabs:**
   - [ ] Navigate to Newton `#parameter-space`, switch to L-BFGS → stays at parameter space
   - [ ] Navigate to Newton `#quick-start`, switch to GD Fixed → stays at quick start
   - [ ] Navigate to Newton `#line-search-details`, switch to Diagonal Precond → maintains scroll (fallback A, section doesn't exist)

2. **Switching to non-algorithm tabs (Stories/Algorithms):**
   - [ ] Navigate to Newton `#parameter-space`
   - [ ] Switch to Stories tab
   - [ ] Expected: Hash remains in URL but no scrolling occurs (fallback A - section doesn't exist, maintains position)
   - [ ] Switch back to Newton tab
   - [ ] Expected: Scrolls back to `#parameter-space` section

3. **Automatic hash updates:**
   - [ ] Scroll through Newton tab → hash updates as sections come into view
   - [ ] Scroll through L-BFGS tab → hash updates correctly
   - [ ] Scroll through Diagonal Precond → hash updates for available sections

4. **Browser back/forward:**
   - [ ] Navigate to `#parameter-space`, scroll to `#try-this`, click browser back button → returns to parameter space
   - [ ] Forward button works correctly

5. **Direct URL access:**
   - [ ] Open app with `#quick-start` in URL → scrolls to quick start on load (browser handles this natively via id attributes)
   - [ ] Open app with `#nonexistent-section` → doesn't crash, shows normal view

6. **Sticky tab bar interaction:**
   - [ ] Scroll down past tab bar, verify it sticks
   - [ ] Switch tabs while scrolled → stays scrolled to same section
   - [ ] Sticky bar doesn't interfere with hash scrolling

7. **Edge case: Multiple sections visible:**
   - [ ] Zoom out browser to 50% or use a large monitor so multiple sections are visible at once
   - [ ] Scroll slowly
   - [ ] Verify hash updates to the topmost visible section (due to rootMargin configuration favoring top 30% of viewport)

**Step 1: Run through all manual tests**

Document any issues found.

**Step 2: Fix any issues found**

Address bugs or unexpected behavior.

**Step 3: Final commit**

```bash
git add .
git commit -m "test: verify hash navigation works across all scenarios"
```

---

## Completion Checklist

- [ ] CollapsibleSection accepts id prop
- [ ] All 5 algorithm tabs have consistent section IDs
- [ ] Parameter Space sections have IDs
- [ ] Tab switching preserves hash
- [ ] Fallback strategy A works (maintains scroll when section missing)
- [ ] IntersectionObserver updates hash on scroll
- [ ] Manual testing complete
- [ ] No console errors
- [ ] Browser back/forward works
- [ ] Direct URL navigation works

---

## Notes for Engineer

**Browser Compatibility:**

- **IntersectionObserver:** Supported in all modern browsers (Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+)
- **scrollIntoView with options:** Supported in all modern browsers (Chrome 61+, Firefox 36+, Safari 14+)
- **Note:** If IE11 support is needed, add a polyfill for IntersectionObserver or feature detection

**TypeScript Types:**

- `IntersectionObserver` and `IntersectionObserverEntry` are built-in browser API types from `lib.dom.d.ts`
- No imports needed for these types
- `Algorithm` type already exists in the codebase from `src/UnifiedVisualizer.tsx`

**Common Issues:**

1. **IntersectionObserver firing too frequently:** Adjust `rootMargin` if hash updates too aggressively
2. **Smooth scroll not working:** Check if browser supports `scrollIntoView` with options
3. **Hash conflicts:** Ensure all IDs are unique across the entire page
4. **Timing issues with tab switching:** Adjust setTimeout delay if sections aren't found immediately

**Testing Tips:**

- Use browser dev tools to inspect elements have correct IDs
- Watch Network tab for any errors during navigation
- Test in multiple browsers (Chrome, Firefox, Safari)
- Test with slow network throttling to catch timing issues
- Use browser address bar to manually test hash navigation

**Performance Considerations:**

- IntersectionObserver is efficient, but we're limiting observations to sections with IDs
- `replaceState` instead of `pushState` prevents polluting browser history
- Small setTimeout in tab switching gives React time to render new content

**Accessibility Considerations:**

- Hash updates via `history.replaceState` don't announce to screen readers
- Consider using `aria-current="location"` on the active section for screen reader users
- Consider implementing focus management for keyboard users
- The existing CollapsibleSection component already has good ARIA attributes

**Future Enhancements:**

- Could add smooth animation when sticky bar transitions
- Could highlight active section in tab bar (visual indicator)
- Could add "scroll to top" button that appears when deep in content
- Could persist last-viewed section per tab in localStorage
- Could add keyboard shortcuts for section navigation
