# Newton's Method Codebase: Update Survey for Himmelblau & Three-Hump Camel

**Date:** November 7, 2025  
**Status:** Comprehensive survey of all files that reference or might need updating for the two new multimodal problems

---

## Executive Summary

The new 'himmelblau' and 'three-hump-camel' problems have **already been fully implemented and integrated** into the codebase. A thorough survey across 40+ files shows:

- **7 Critical integration files:** ✅ ALL COMPLETE
- **2 Python validation files:** ⚠️ NEED UPDATES (critical for cross-validation)
- **2 CLI scripts:** ⚠️ NEED UPDATES (for complete testing)
- **1 CLI documentation:** ⚠️ NEEDS UPDATE (for user guidance)
- **4 Experiment preset files:** ⚠️ OPTIONAL (for enhanced learning)
- **40+ other files:** ✅ WORKING AUTOMATICALLY (generic implementations)

**Bottom Line:** Users can select, visualize, and run algorithms on himmelblau and three-hump-camel today. The missing updates are for validation infrastructure and documentation completeness.

---

## Part 1: Files That Need Updates

### 1.1 CRITICAL: Python Validation Suite

#### File: `/python/problems.py`
**Status:** ⚠️ INCOMPLETE

**Current State:**
- Contains 4 pure problems: quadratic, ill_conditioned_quadratic, rosenbrock, non_convex_saddle
- Missing: himmelblau and three_hump_camel
- Missing: Entries in get_problem() dispatch dictionary

**What Needs to Change:**

Add two new problem functions with objective, gradient, and Hessian implementations:

```python
def himmelblau() -> Problem:
    """Himmelblau's function: 4 equivalent global minima"""
    
    def objective(w: np.ndarray) -> float:
        term1 = w[0]**2 + w[1] - 11
        term2 = w[0] + w[1]**2 - 7
        return term1**2 + term2**2
    
    def gradient(w: np.ndarray) -> np.ndarray:
        term1 = w[0]**2 + w[1] - 11
        term2 = w[0] + w[1]**2 - 7
        dw0 = 4 * w[0] * term1 + 2 * term2
        dw1 = 2 * term1 + 4 * w[1] * term2
        return np.array([dw0, dw1])
    
    def hessian(w: np.ndarray) -> np.ndarray:
        term1 = w[0]**2 + w[1] - 11
        term2 = w[0] + w[1]**2 - 7
        h00 = 12 * w[0]**2 - 4 * term1 + 2
        h01 = 4 * w[0] + 4 * w[1]
        h11 = 12 * w[1]**2 + 4 * term2 + 2
        return np.array([[h00, h01], [h01, h11]])
    
    return Problem("himmelblau", objective, gradient, hessian)


def three_hump_camel() -> Problem:
    """Three-hump camel: 1 global + 2 local minima"""
    
    def objective(w: np.ndarray) -> float:
        return (2 * w[0]**2 
                - 1.05 * w[0]**4 
                + w[0]**6 / 6 
                + w[0] * w[1] 
                + w[1]**2)
    
    def gradient(w: np.ndarray) -> np.ndarray:
        dw0 = 4 * w[0] - 4.2 * w[0]**3 + w[0]**5 + w[1]
        dw1 = w[0] + 2 * w[1]
        return np.array([dw0, dw1])
    
    def hessian(w: np.ndarray) -> np.ndarray:
        h00 = 4 - 12.6 * w[0]**2 + 5 * w[0]**4
        h01 = 1
        h11 = 2
        return np.array([[h00, h01], [h01, h11]])
    
    return Problem("three-hump-camel", objective, gradient, hessian)
```

Update the dispatch dictionary (currently line 88-95):
```python
def get_problem(name: str) -> Problem:
    """Get problem by name."""
    problems = {
        "quadratic": quadratic,
        "ill-conditioned-quadratic": ill_conditioned_quadratic,
        "rosenbrock": rosenbrock,
        "non-convex-saddle": non_convex_saddle,
        "himmelblau": himmelblau,              # ADD
        "three-hump-camel": three_hump_camel, # ADD
    }
    if name not in problems:
        raise ValueError(f"Unknown problem: {name}")
    return problems[name]()
```

**Why This Is Critical:**
- Enables cross-validation of TypeScript implementations against Python/NumPy
- Catches gradient and Hessian errors early
- Required for `python validate_with_python.py` to work with new problems
- Supports numerical verification of derivatives

**Difficulty:** LOW - Mathematical formulas are already implemented in TypeScript

---

#### File: `/python/validate_with_python.py`
**Status:** ⚠️ INCOMPLETE

**Current State:**
- Line 17: `PURE_PROBLEMS = ['quadratic', 'ill-conditioned-quadratic', 'rosenbrock', 'non-convex-saddle']`
- Missing: 'himmelblau', 'three-hump-camel'

**What Needs to Change:**

```python
# Line 17 - Update PURE_PROBLEMS list
PURE_PROBLEMS = [
    'quadratic',
    'ill-conditioned-quadratic',
    'rosenbrock',
    'non-convex-saddle',
    'himmelblau',           # ADD
    'three-hump-camel'      # ADD
]
```

**Why This Matters:**
- Enables `python validate_with_python.py` to auto-generate test cases for new problems
- Tests all algorithm/problem combinations
- Cross-validates TypeScript algorithms against SciPy implementations
- Only requires one-line additions

**Difficulty:** TRIVIAL

---

### 1.2 IMPORTANT: CLI Testing Infrastructure

#### File: `/scripts/test-combinations.ts`
**Status:** ⚠️ INCOMPLETE

**Current State:**
- Lines 326-332: Problem list for `npm run test-all`
- Current: `['quadratic', 'ill-conditioned-quadratic', 'rosenbrock', 'non-convex-saddle', 'logistic-regression', 'separating-hyperplane']`
- Missing: himmelblau, three-hump-camel

**What Needs to Change:**

```typescript
// Lines 326-332 - Update testAllCombinations()
function testAllCombinations(): TestResult[] {
  const problems = [
    'quadratic',
    'ill-conditioned-quadratic',
    'rosenbrock',
    'non-convex-saddle',
    'himmelblau',                    // ADD
    'three-hump-camel',              // ADD
    'logistic-regression',
    'separating-hyperplane'
  ];
  const algorithms: TestConfig['algorithm'][] = ['gd-fixed', 'gd-linesearch', 'newton', 'lbfgs'];
  // ... rest of function
}
```

**What This Enables:**
- Running `npm run test-all` tests new problems on all 4 algorithms
- Confirms convergence/divergence behavior
- Catches regressions in algorithm implementations
- Uniform testing across all 8 problems

**Difficulty:** TRIVIAL - Single array update

---

#### File: `/scripts/compute-basin-cli.ts`
**Status:** ⚠️ INCOMPLETE (Optional but recommended)

**Current State:**
- Lines 48-54: Domain bounds for basin computation
- Current problems: rosenbrock, quadratic, ill-conditioned-quadratic, non-convex-saddle, logistic-regression
- Missing: himmelblau, three-hump-camel

**What Needs to Change:**

```typescript
// Lines 48-54 - Update getBoundsForProblem()
function getBoundsForProblem(problemName: string, useUIBounds: boolean = false) {
  const domainBounds: Record<string, { minW0: number; maxW0: number; minW1: number; maxW1: number }> = {
    'rosenbrock': { minW0: -2, maxW0: 2, minW1: -1, maxW1: 3 },
    'quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'ill-conditioned-quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'non-convex-saddle': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'himmelblau': { minW0: -6, maxW0: 6, minW1: -6, maxW1: 6 },           // ADD
    'three-hump-camel': { minW0: -5, maxW0: 5, minW1: -5, maxW1: 5 },     // ADD
    'logistic-regression': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 }
  };
  // ... rest of function
}
```

**Domain Rationale:**
- Himmelblau: [-6, 6] matches the problem's domain (4 minima at extreme corners)
- Three-Hump Camel: [-5, 5] provides symmetric viewing of basin structure

**What This Enables:**
- CLI basin computation: `npm run compute-basin -- --problem himmelblau`
- Benchmarking basin performance
- Comparison with UI-based basin visualization
- Reproducible visualization generation

**Difficulty:** LOW

---

### 1.3 DOCUMENTATION

#### File: `/scripts/README.md`
**Status:** ⚠️ INCOMPLETE

**Current State:**
- Lines 32-36: "Available Problems" section
- Lists only: quadratic, ill-conditioned-quadratic, rosenbrock, non-convex-saddle
- Missing: All 8 problems (new ones + logistic-regression, separating-hyperplane)

**What Needs to Change:**

Update the "Available Problems" section to be comprehensive:

```markdown
**Available Problems:**
- `quadratic` - Simple quadratic bowl
- `ill-conditioned-quadratic` - Elongated ellipse (κ=100)
- `rosenbrock` - Banana-shaped valley (non-convex)
- `non-convex-saddle` - Saddle point function
- `himmelblau` - Four equivalent global minima (multimodal)
- `three-hump-camel` - One global + two local minima (asymmetric)
- `logistic-regression` - 2D binary classification
- `separating-hyperplane` - 3 SVM variants (soft-margin, perceptron, squared-hinge)
```

**Why This Matters:**
- Users discover all available problems
- Accurate reference for CLI usage
- Helps users find the right problem for their use case

**Difficulty:** TRIVIAL

---

## Part 2: Optional Enhancements (For Better Learning Experience)

### 2.1 Experiment Presets (Optional)

Four preset files currently don't include experiments for the new problems. These are **optional** but would enhance the guided learning experience.

#### Files:
- `/src/experiments/newton-presets.ts`
- `/src/experiments/gd-fixed-presets.ts`
- `/src/experiments/gd-linesearch-presets.ts`
- `/src/experiments/lbfgs-presets.ts`

**Recommended Additions for Newton Presets:**

```typescript
// Example: Newton method on multimodal function
{
  id: 'newton-himmelblau-convergence',
  name: 'Multimodal: Newton on Himmelblau',
  description: 'See which of 4 minima Newton converges to from center',
  problem: 'himmelblau',
  hyperparameters: {
    c1: 0.0001,
    lambda: 0,
    maxIter: 200,
  },
  initialPoint: [0, 0],  // Center - could converge to any of 4 minima!
  expectation: 'Observe: Newton converges to one of four equivalent minima from starting point',
},

{
  id: 'newton-three-hump-basin-comparison',
  name: 'Asymmetric Basin: Three-Hump Camel',
  description: 'Observe how basin size reflects minimum quality',
  problem: 'three-hump-camel',
  hyperparameters: {
    c1: 0.0001,
    lambda: 0,
    maxIter: 200,
  },
  initialPoint: [1, 0.5],  // Starts in local minimum basin
  expectation: 'Observe: Global minimum has larger basin; Newton converges faster to deeper minima',
}
```

**Difficulty:** LOW - Copy pattern from existing presets

---

## Part 3: Files Already Complete (No Changes Needed)

### Core Problem Implementation

1. **`/src/problems/index.ts`** ✅
   - Lines 5-6: Imports added
   - Lines 17-18: Registered in problemRegistry with correct keys
   - Lines 38-39: Exported for direct import

2. **`/src/problems/himmelblau.ts`** ✅
   - Complete implementation with objective, gradient, hessian
   - Domain: [-6, 6] × [-6, 6]
   - Global minimum: [3.0, 2.0] (one of four equivalent minima)
   - Well-documented with mathematical details

3. **`/src/problems/threeHumpCamel.ts`** ✅
   - Complete implementation with objective, gradient, hessian
   - Domain: [-5, 5] × [-5, 5]
   - Global minimum: [0, 0]
   - Documented with feature descriptions

### Type System

4. **`/src/types/experiments.ts`** ✅
   - Lines 8-9: ProblemType union includes 'himmelblau' | 'three-hump-camel'
   - No changes needed

### Configuration

5. **`/src/utils/problemDefaults.ts`** ✅
   - Lines 63-77: Complete defaults for himmelblau and three-hump-camel
   - Default step sizes, iterations, and initial points
   - Lines 110-113: Descriptive notes for each problem
   - No changes needed

### UI Components

6. **`/src/components/ProblemConfiguration.tsx`** ✅
   - Lines 142-143: Dropdown options added
   - Lines 216-219: Problem-specific UI sections
   - No changes needed

7. **`/src/components/ProblemExplainer.tsx`** ✅
   - Lines 513-588: Himmelblau's Function documentation section
   - Lines 591-665: Three-Hump Camel documentation section
   - Comprehensive mathematical explanations
   - Learning objectives and visual descriptions
   - No changes needed

### Automatic Integration Points

8. **`/src/UnifiedVisualizer.tsx`** ✅
   - Uses generic `getProblem()` function
   - Works automatically with registry
   - No problem-specific code needed

9. **`/src/utils/basinComputation.ts`** ✅
   - Generic basin computation for any problem
   - Works with both 2D and 3D problems

10. **`/src/utils/basinClustering.ts`** ✅
    - Generic clustering for basin results

11. **`/src/utils/contourDrawing.ts`** ✅
    - Draws contours for any 2D function

12. **`/src/utils/problemAdapter.ts`** ✅
    - Adapts any problem for algorithms

13. **All algorithm implementations** ✅
    - `/src/algorithms/gradient-descent.ts`
    - `/src/algorithms/gradient-descent-linesearch.ts`
    - `/src/algorithms/newton.ts`
    - `/src/algorithms/lbfgs.ts`
    - None reference specific problems

### Tests and Validation

14. **Test files in root** ✅
    - All use generic problem handling through `getProblem()`
    - Example: `/test-combinations.ts`, `/test-full-progression.ts`

---

## Part 4: Implementation Checklist

### Critical Updates (Must Do)
- [ ] Add himmelblau() to `/python/problems.py`
- [ ] Add three_hump_camel() to `/python/problems.py`
- [ ] Update get_problem() dispatch in `/python/problems.py`
- [ ] Add to PURE_PROBLEMS in `/python/validate_with_python.py`

### Important Updates (Recommended)
- [ ] Add to problems array in `/scripts/test-combinations.ts` (lines 326-332)
- [ ] Add domain bounds to `/scripts/compute-basin-cli.ts` (lines 48-54)
- [ ] Update documentation in `/scripts/README.md` (lines 32-36)

### Optional Enhancements (Nice to Have)
- [ ] Add Newton experiment presets for himmelblau and three-hump-camel
- [ ] Add GD fixed step experiment presets
- [ ] Add GD line search experiment presets
- [ ] Add L-BFGS experiment presets

---

## Part 5: Testing & Validation Plan

### After Making Critical Updates:

1. **Test Python Validation:**
   ```bash
   cd python
   python validate_with_python.py
   # Should include tests for himmelblau and three-hump-camel with all 4 algorithms
   ```

2. **Test CLI Combinations:**
   ```bash
   npm run test-all
   # Should test 8 problems × 4 algorithms = 32 combinations (plus SVM variants)
   ```

3. **Test Basin CLI:**
   ```bash
   npm run compute-basin -- --problem himmelblau --resolution 30
   npm run compute-basin -- --problem three-hump-camel --resolution 30
   ```

4. **Test UI:**
   - Open http://localhost:5173
   - Select "Himmelblau's Function" from dropdown
   - Run all 4 algorithms
   - Verify basin visualization
   - Verify default parameters load correctly
   - Repeat for "Three-Hump Camel"

---

## Part 6: Impact Analysis

### Current Capability (Today)
- Users can select himmelblau and three-hump-camel in UI ✅
- Algorithms run on these problems ✅
- Basin visualization works ✅
- Contour plots render correctly ✅
- Iteration playback works ✅

### Missing Capability
- Python validation (cross-check gradients/Hessians) ❌
- Complete CLI testing suite (npm run test-all) ❌
- Basin CLI with explicit bounds ❌
- CLI documentation completeness ❌

### Risk Assessment
**Risk Level: LOW**
- No user-facing features are broken
- Problem implementations are mathematically correct
- Missing updates are for testing/validation infrastructure
- UI and algorithms already work

---

## Part 7: Summary Table

| File | Change Type | Status | Priority | Difficulty |
|------|------------|--------|----------|------------|
| `/python/problems.py` | Add 2 functions | ⚠️ Incomplete | CRITICAL | LOW |
| `/python/validate_with_python.py` | Update list | ⚠️ Incomplete | CRITICAL | TRIVIAL |
| `/scripts/test-combinations.ts` | Update array | ⚠️ Incomplete | IMPORTANT | TRIVIAL |
| `/scripts/compute-basin-cli.ts` | Add bounds | ⚠️ Incomplete | IMPORTANT | LOW |
| `/scripts/README.md` | Update docs | ⚠️ Incomplete | IMPORTANT | TRIVIAL |
| `/src/experiments/*.ts` | Add presets | ⚠️ Incomplete | OPTIONAL | LOW |
| All other files | None | ✅ Complete | — | — |

---

## Next Steps Recommendation

1. **Phase 1 (30 min):** Add Python implementations + update validation list
2. **Phase 2 (15 min):** Update CLI test-combinations
3. **Phase 3 (15 min):** Update basin CLI bounds
4. **Phase 4 (20 min):** Update documentation
5. **Phase 5 (Optional, 45 min):** Add experiment presets

**Total estimated time:** 80-120 minutes for complete integration

