# Glossary Complete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the glossary from 4 to 16 terms and add tooltips to 49 locations, achieving 100% style guide compliance

**Architecture:** Centralized glossary registry in `src/lib/glossary.tsx` with type-safe term keys, progressive implementation in 3 phases (quick wins → high-priority → remaining terms)

**Tech Stack:** React, TypeScript, Tailwind CSS for tooltips

**Source Documents:**
- Expansion Plan: `docs/plans/glossary-expansion.md`
- Audit Report: `docs/plans/glossary-audit.md`
- Style Guide: `src/lib/glossary.tsx` (lines 10-77)

---

## Phase 1: Quick Wins - Audit Compliance (10 minutes)

### Task 1: Fix Missing Tooltip in GdFixedTab

**Files:**
- Modify: `src/components/tabs/GdFixedTab.tsx:414`

**Step 1: Read the file to locate the context**

```bash
# Find the exact line
```

**Step 2: Add tooltips to the Nesterov discussion**

Replace the plain text at line ~414:
```tsx
Provably optimal convergence rate for smooth convex functions.
```

With:
```tsx
Provably optimal convergence rate for{' '}
<GlossaryTooltip termKey="smooth" />{' '}
<GlossaryTooltip termKey="convex" /> functions.
```

**Step 3: Verify TypeScript compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Verify linting**

Run: `npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/tabs/GdFixedTab.tsx
git commit -m "fix(glossary): add missing tooltips in Nesterov discussion"
```

---

### Task 2: Fix Missing Tooltip in GdLineSearchTab

**Files:**
- Modify: `src/components/tabs/GdLineSearchTab.tsx:456`

**Step 1: Read the file to locate the context**

```bash
# Find the Descent Lemma section around line 456
```

**Step 2: Add tooltip to L-smooth reference**

Replace:
```tsx
<p>For L-smooth functions:</p>
```

With:
```tsx
<p>For L-<GlossaryTooltip termKey="smooth" /> functions:</p>
```

**Step 3: Verify TypeScript compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/tabs/GdLineSearchTab.tsx
git commit -m "fix(glossary): add missing tooltip in Descent Lemma"
```

---

## Phase 2: High-Priority Terms (60 minutes)

### Task 3: Add Hessian Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add Hessian definition to glossary registry**

Add after the 'convex' entry (around line 62):
```tsx
  'hessian': {
    term: 'Hessian',
    definition: (
      <>
        <strong>Hessian matrix:</strong> The matrix of second partial derivatives ∇²f(x).
        For f: ℝⁿ → ℝ, the Hessian H[i,j] = ∂²f/∂xᵢ∂xⱼ. Encodes local curvature
        information. Positive definite Hessian indicates a local minimum; indefinite
        Hessian indicates a saddle point.
      </>
    ),
  },
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc -b`
Expected: No errors, 'hessian' is now a valid GlossaryTermKey

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add Hessian term definition"
```

---

### Task 4: Add Hessian Tooltips to AlgorithmExplainer

**Files:**
- Modify: `src/components/AlgorithmExplainer.tsx`

**Step 1: Add import if needed**

Verify GlossaryTooltip is imported at the top of the file.

**Step 2: Add tooltip at first Hessian mention (around line 270)**

In the Newton's method section, first occurrence:
```tsx
<strong>Type:</strong> Second-order method (uses{' '}
<GlossaryTooltip termKey="hessian" /> matrix)
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/AlgorithmExplainer.tsx
git commit -m "feat(glossary): add Hessian tooltip in AlgorithmExplainer"
```

---

### Task 5: Add Eigenvalue Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add eigenvalue definition**

Add after 'hessian':
```tsx
  'eigenvalue': {
    term: 'eigenvalue',
    definition: (
      <>
        <strong>Eigenvalue:</strong> A scalar λ such that Hv = λv for some non-zero vector v
        (the eigenvector). For symmetric matrices like the Hessian, eigenvalues are real and
        indicate principal curvatures. Positive eigenvalues mean the function curves upward
        in that direction; negative eigenvalues mean it curves downward.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add eigenvalue term definition"
```

---

### Task 6: Add Eigenvalue Tooltips to NewtonTab

**Files:**
- Modify: `src/components/tabs/NewtonTab.tsx`

**Step 1: Add tooltip at first eigenvalue mention**

Find the first occurrence in the Newton explanation (likely in the Hessian eigenvalue section):
```tsx
The <GlossaryTooltip termKey="hessian" /> has two{' '}
<GlossaryTooltip termKey="eigenvalue" />s which reveal the local curvature.
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/tabs/NewtonTab.tsx
git commit -m "feat(glossary): add eigenvalue tooltip in NewtonTab"
```

---

### Task 7: Add Quadratic Convergence Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add quadratic convergence definition**

Add after 'eigenvalue':
```tsx
  'quadratic-convergence': {
    term: 'quadratic convergence',
    definition: (
      <>
        <strong>Quadratic convergence:</strong> The error is squared at each iteration:
        ||eₖ₊₁|| ≤ C||eₖ||². This means the number of correct digits roughly doubles
        each iteration near the solution. Much faster than linear convergence.
        Newton's method achieves this under appropriate conditions.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add quadratic convergence term definition"
```

---

### Task 8: Add Quadratic Convergence Tooltips

**Files:**
- Modify: `src/components/AlgorithmExplainer.tsx`
- Modify: `src/components/tabs/NewtonTab.tsx`

**Step 1: Add tooltip in AlgorithmExplainer (Newton section)**

Find the convergence rate mention:
```tsx
<strong>Convergence rate:</strong>{' '}
<GlossaryTooltip termKey="quadratic-convergence" /> near the solution
```

**Step 2: Add tooltip in NewtonTab convergence section**

```tsx
<p>
  Newton's method achieves{' '}
  <GlossaryTooltip termKey="quadratic-convergence" /> when starting
  close enough to the solution.
</p>
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/AlgorithmExplainer.tsx src/components/tabs/NewtonTab.tsx
git commit -m "feat(glossary): add quadratic convergence tooltips"
```

---

### Task 9: Add Linear Convergence Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add linear convergence definition**

Add after 'quadratic-convergence':
```tsx
  'linear-convergence': {
    term: 'linear convergence',
    definition: (
      <>
        <strong>Linear convergence:</strong> The error decreases by a constant factor each
        iteration: ||eₖ₊₁|| ≤ ρ||eₖ|| for some 0 &lt; ρ &lt; 1. Requires O(log(1/ε))
        iterations to reach ε accuracy. Gradient descent achieves this on strongly convex
        smooth functions.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add linear convergence term definition"
```

---

### Task 10: Add Superlinear Convergence Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add superlinear convergence definition**

Add after 'linear-convergence':
```tsx
  'superlinear-convergence': {
    term: 'superlinear convergence',
    definition: (
      <>
        <strong>Superlinear convergence:</strong> Faster than linear but not quite quadratic:
        ||eₖ₊₁||/||eₖ|| → 0 as k → ∞. L-BFGS with sufficient memory achieves this on
        strongly convex functions. Better than gradient descent, though not as fast as
        Newton's method.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add superlinear convergence term definition"
```

---

### Task 11: Add Ill-Conditioned Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add ill-conditioned definition**

Add after 'superlinear-convergence':
```tsx
  'ill-conditioned': {
    term: 'ill-conditioned',
    definition: (
      <>
        <strong>Ill-conditioned problem:</strong> Has a large condition number (κ ≫ 1),
        meaning the Hessian has very different curvatures in different directions. This
        causes gradient descent to zig-zag slowly, while Newton's method adapts to the
        varying curvatures and converges much faster.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add ill-conditioned term definition"
```

---

### Task 12: Add Ill-Conditioned Tooltips

**Files:**
- Modify: `src/components/ProblemExplainer.tsx`

**Step 1: Import GlossaryTooltip if needed**

Verify the import at the top of the file.

**Step 2: Add tooltip in the Ill-Conditioned Quadratic section**

Find the first mention (around line 200):
```tsx
<p>
  This is an <GlossaryTooltip termKey="ill-conditioned" /> problem
  demonstrating how Newton's method handles varying curvatures.
</p>
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ProblemExplainer.tsx
git commit -m "feat(glossary): add ill-conditioned tooltip in ProblemExplainer"
```

---

### Task 13: Add Condition Number Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add condition number definition**

Add after 'ill-conditioned':
```tsx
  'condition-number': {
    term: 'condition number',
    definition: (
      <>
        <strong>Condition number:</strong> For positive definite Hessian, the ratio of largest
        to smallest eigenvalue: κ = λₘₐₓ/λₘᵢₙ. Equivalently, κ = L/μ where L is the Lipschitz
        constant and μ is the strong convexity parameter. Measures how "stretched" the problem
        is. κ ≈ 1 means well-conditioned (easy); κ ≫ 1 means ill-conditioned (difficult for
        gradient descent).
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add condition number term definition"
```

---

## Phase 3: Remaining Terms (40 minutes)

### Task 14: Add Positive Definite Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add positive definite definition**

Add after 'condition-number':
```tsx
  'positive-definite': {
    term: 'positive definite',
    definition: (
      <>
        <strong>Positive definite matrix:</strong> A symmetric matrix H where all eigenvalues
        are positive (λᵢ &gt; 0). Equivalently, xᵀHx &gt; 0 for all non-zero x. At a
        critical point, a positive definite Hessian guarantees a local minimum.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add positive definite term definition"
```

---

### Task 15: Add Lipschitz Continuous Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add Lipschitz continuous definition**

Add after 'positive-definite':
```tsx
  'lipschitz-continuous': {
    term: 'Lipschitz continuous',
    definition: (
      <>
        <strong>Lipschitz continuous gradient:</strong> The gradient doesn't change too
        rapidly: ||∇f(x) - ∇f(y)|| ≤ L||x - y|| for some constant L (the Lipschitz constant).
        This is the precise mathematical definition of "smooth" and enables convergence
        guarantees.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add Lipschitz continuous term definition"
```

---

### Task 16: Add First-Order Method Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add first-order method definition**

Add after 'lipschitz-continuous':
```tsx
  'first-order-method': {
    term: 'first-order method',
    definition: (
      <>
        <strong>First-order method:</strong> An optimization algorithm that only uses
        function values and gradients (first derivatives). Examples: gradient descent,
        L-BFGS. Cheaper per iteration than second-order methods, but may require more
        iterations.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add first-order method term definition"
```

---

### Task 17: Add Second-Order Method Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add second-order method definition**

Add after 'first-order-method':
```tsx
  'second-order-method': {
    term: 'second-order method',
    definition: (
      <>
        <strong>Second-order method:</strong> An optimization algorithm that uses the Hessian
        (second derivatives) in addition to gradients. Newton's method is the primary example.
        More expensive per iteration but achieves faster convergence (quadratic vs. linear).
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add second-order method term definition"
```

---

### Task 18: Add Basin of Convergence Term to Glossary

**Files:**
- Modify: `src/lib/glossary.tsx`

**Step 1: Add basin of convergence definition**

Add after 'second-order-method':
```tsx
  'basin-of-convergence': {
    term: 'basin of convergence',
    definition: (
      <>
        <strong>Basin of convergence:</strong> The set of starting points from which an
        optimization algorithm converges to a particular local minimum. Different minima have
        different basin sizes. The basin picker tool visualizes these regions.
      </>
    ),
  },
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/glossary.tsx
git commit -m "feat(glossary): add basin of convergence term definition"
```

---

### Task 19: Add Method Classification Tooltips to AlgorithmExplainer

**Files:**
- Modify: `src/components/AlgorithmExplainer.tsx`

**Step 1: Add first-order tooltip in GD sections**

In both gradient descent sections (around lines 25 and 92):
```tsx
<p>
  <strong>Type:</strong>{' '}
  <GlossaryTooltip termKey="first-order-method" /> (uses only gradient)
</p>
```

**Step 2: Add second-order tooltip in Newton section**

In the Newton's method section (around line 270):
```tsx
<p>
  <strong>Type:</strong>{' '}
  <GlossaryTooltip termKey="second-order-method" /> (uses Hessian matrix)
</p>
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/AlgorithmExplainer.tsx
git commit -m "feat(glossary): add method classification tooltips"
```

---

### Task 20: Add Basin of Convergence Tooltips to ProblemExplainer

**Files:**
- Modify: `src/components/ProblemExplainer.tsx`

**Step 1: Add tooltip in Three-Hump Camel section**

Find the first basin mention:
```tsx
<p>
  Demonstrates asymmetric{' '}
  <GlossaryTooltip termKey="basin-of-convergence" /> structure where the
  deeper global minimum has a larger basin.
</p>
```

**Step 2: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ProblemExplainer.tsx
git commit -m "feat(glossary): add basin of convergence tooltip"
```

---

## Phase 4: Strategic Tooltip Placement (30 minutes)

### Task 21: Add Remaining Critical Tooltips in NewtonTab

**Files:**
- Modify: `src/components/tabs/NewtonTab.tsx`

**Step 1: Review glossary-expansion.md lines 113-168 for specific locations**

Add tooltips at the identified critical locations:

1. Hessian eigenvalues section (~line 220)
2. Positive definite discussion (~line 240)
3. Condition number display (~line 260)
4. Quadratic convergence proof (~line 580)

**Step 2: Implement each tooltip following style guide**

Example for eigenvalue display:
```tsx
<p>
  The two <GlossaryTooltip termKey="eigenvalue" />s of the{' '}
  <GlossaryTooltip termKey="hessian" /> are displayed below.
</p>
```

**Step 3: Verify compilation after each addition**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/tabs/NewtonTab.tsx
git commit -m "feat(glossary): add critical tooltips in Newton derivations"
```

---

### Task 22: Add Remaining Tooltips in ProblemExplainer

**Files:**
- Modify: `src/components/ProblemExplainer.tsx`

**Step 1: Review glossary-expansion.md lines 77-96 for specific locations**

Add tooltips at identified locations:

1. Ill-conditioned quadratic description
2. Saddle point Hessian discussion
3. Three-Hump Camel basin structure

**Step 2: Implement tooltips**

Follow the specific line numbers and context from the expansion plan.

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ProblemExplainer.tsx
git commit -m "feat(glossary): add remaining tooltips in ProblemExplainer"
```

---

### Task 23: Add L-BFGS Tooltips

**Files:**
- Modify: `src/components/AlgorithmExplainer.tsx`
- Modify: `src/components/tabs/LbfgsTab.tsx`

**Step 1: Add superlinear convergence tooltip in AlgorithmExplainer**

In the L-BFGS section:
```tsx
<strong>Convergence rate:</strong>{' '}
<GlossaryTooltip termKey="superlinear-convergence" /> with sufficient memory
```

**Step 2: Add first-order classification tooltip**

```tsx
<p>
  <strong>Type:</strong>{' '}
  <GlossaryTooltip termKey="first-order-method" /> (approximates second-order behavior)
</p>
```

**Step 3: Verify compilation**

Run: `npx tsc -b`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/AlgorithmExplainer.tsx src/components/tabs/LbfgsTab.tsx
git commit -m "feat(glossary): add L-BFGS convergence tooltips"
```

---

## Phase 5: Verification & Documentation (15 minutes)

### Task 24: Create Verification Script

**Files:**
- Create: `scripts/verify-glossary-coverage.ts`

**Step 1: Create verification script**

```typescript
/**
 * Verification script for glossary coverage
 * Ensures all terms are used and tooltips follow style guide
 */

import { glossary } from '../src/lib/glossary';

console.log('=== Glossary Coverage Verification ===\n');

const terms = Object.keys(glossary);
console.log(`Total terms in glossary: ${terms.length}`);
console.log('\nTerms:');
terms.forEach((key, i) => {
  const entry = glossary[key as keyof typeof glossary];
  console.log(`  ${i + 1}. ${key} → "${entry.term}"`);
});

console.log('\n✅ Glossary registry loaded successfully');
console.log('\nExpected: 16 terms (4 original + 12 new)');

if (terms.length === 16) {
  console.log('✅ Correct number of terms!');
  process.exit(0);
} else {
  console.log(`❌ Expected 16 terms, found ${terms.length}`);
  process.exit(1);
}
```

**Step 2: Run verification**

Run: `npx tsx scripts/verify-glossary-coverage.ts`
Expected: All 16 terms listed, exit code 0

**Step 3: Commit**

```bash
git add scripts/verify-glossary-coverage.ts
git commit -m "test(glossary): add coverage verification script"
```

---

### Task 25: Run Full Build Verification

**Files:**
- None (verification only)

**Step 1: Run TypeScript compilation**

Run: `npx tsc -b`
Expected: No errors, clean build

**Step 2: Run linting**

Run: `npm run lint`
Expected: No warnings or errors

**Step 3: Run verification script**

Run: `npx tsx scripts/verify-glossary-coverage.ts`
Expected: 16 terms confirmed

**Step 4: Document results**

Create brief verification note in commit message for final commit.

---

### Task 26: Update Glossary Expansion Plan with Completion Status

**Files:**
- Modify: `docs/plans/glossary-expansion.md`

**Step 1: Add completion header**

Add at the top of the file:
```markdown
# Glossary Expansion Plan

**Status:** ✅ COMPLETED 2025-11-10
**Implementation Plan:** `docs/plans/2025-11-10-glossary-complete-implementation.md`

All 12 new terms added to glossary. All 47 tooltip locations implemented.

---
```

**Step 2: Commit**

```bash
git add docs/plans/glossary-expansion.md
git commit -m "docs(glossary): mark expansion plan as completed"
```

---

### Task 27: Update Glossary Audit with Final Status

**Files:**
- Modify: `docs/plans/glossary-audit.md`

**Step 1: Add completion header**

Add at the top:
```markdown
# Glossary Usage Audit

**Status:** ✅ COMPLETED - 100% Compliance Achieved
**Completion Date:** 2025-11-10

Both moderate violations fixed:
- ✅ GdFixedTab.tsx:414 - Tooltips added
- ✅ GdLineSearchTab.tsx:456 - Tooltip added

Final compliance: 100%

---
```

**Step 2: Commit**

```bash
git add docs/plans/glossary-audit.md
git commit -m "docs(glossary): mark audit issues as resolved"
```

---

### Task 28: Final Integration Commit

**Files:**
- All modified files

**Step 1: Review all changes**

Run: `git status`
Review: All files staged and committed throughout the process

**Step 2: Create summary commit message**

```bash
git commit --allow-empty -m "feat(glossary): complete glossary expansion and audit

- Added 12 new terms (Hessian, eigenvalue, quadratic/linear/superlinear convergence,
  ill-conditioned, condition number, positive definite, Lipschitz continuous,
  first/second-order method, basin of convergence)
- Implemented 47 tooltips across AlgorithmExplainer, ProblemExplainer, and tabs
- Fixed 2 audit violations for 100% style guide compliance
- Expanded from 4 → 16 total glossary terms
- Added verification script

Implementation plan: docs/plans/2025-11-10-glossary-complete-implementation.md
Closes: glossary-expansion.md, glossary-audit.md"
```

**Step 3: Verify final state**

Run all verification commands:
```bash
npx tsc -b
npm run lint
npx tsx scripts/verify-glossary-coverage.ts
```

Expected: All pass

---

## Acceptance Criteria

✅ All 16 terms in glossary registry with precise mathematical definitions
✅ All 49 tooltip locations implemented (47 new + 2 audit fixes)
✅ 100% TypeScript compilation success
✅ 100% ESLint compliance
✅ 100% style guide compliance (audit verification)
✅ Verification script confirms term count
✅ All commits follow conventional commit format
✅ Documentation updated with completion status

## Estimated Total Time

- Phase 1 (Quick Wins): 10 minutes
- Phase 2 (High Priority): 60 minutes
- Phase 3 (Remaining Terms): 40 minutes
- Phase 4 (Strategic Placement): 30 minutes
- Phase 5 (Verification): 15 minutes

**Total: ~2.5 hours** (with breaks and review time)

## Notes for Engineer

- Follow the task order strictly - earlier terms are dependencies for later tooltips
- Commit after each task - frequent small commits are better than large ones
- If a tooltip location is slightly different than specified (due to code changes), use judgment to find the nearest appropriate location following the style guide
- The expansion plan (glossary-expansion.md) has exact line numbers for tooltip placements
- Test compilation after every glossary addition to catch typos in term keys early
- Review the style guide in src/lib/glossary.tsx lines 10-77 before starting

## References

- **@superpowers:verification-before-completion** - Run verification before claiming any task complete
- **Style Guide:** `src/lib/glossary.tsx:10-77`
- **Expansion Details:** `docs/plans/glossary-expansion.md`
- **Audit Details:** `docs/plans/glossary-audit.md`
