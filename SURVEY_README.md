# Newton's Method Codebase: Problem Integration Survey

This directory now contains comprehensive documentation of how problems are defined and integrated throughout the Newton's method visualization codebase.

## Documents

### 1. **PROBLEM_INTEGRATION_SURVEY.md** (28 KB, primary reference)
The complete technical guide with:
- Problem interface definitions and requirements
- All 6 current problems explained with code samples
- Registry system architecture
- Adapter patterns and type system
- Complete integration checklist for new problems
- Step-by-step implementation guide with example (cubic problem)
- Detailed notes on each existing problem

**Best for:**
- Understanding the full system architecture
- Implementing a new problem with full detail
- Learning the code patterns and design principles
- Finding specific file locations

### 2. **INTEGRATION_QUICK_REFERENCE.txt** (15 KB, quick lookup)
Visual ASCII guide with:
- File location index
- Interface diagrams
- 8-step integration checklist
- Critical code sections to update
- Problem characteristics table
- Worked example: adding a cubic problem
- Bare minimum steps (5 files to update)

**Best for:**
- Quick lookup during implementation
- Visual understanding of dependencies
- Reference while coding
- Finding file paths quickly

## Quick Start: Adding a New Problem

### Absolute Minimum (5 files)
1. Create `/src/problems/new-problem.ts`
2. Register in `/src/problems/index.ts`
3. Add type in `/src/types/experiments.ts`
4. Update `/src/UnifiedVisualizer.tsx` (2 functions)
5. Add dropdown option in `/src/components/ProblemConfiguration.tsx`

**Result:** Problem works with all 4 algorithms and basin visualization

### Complete Integration (8-14 files)
Add defaults, documentation, parameter UI, validation, and experiment presets.

See **INTEGRATION_QUICK_REFERENCE.txt** "Integration Checklist" section for the complete list.

## Key Files You'll Need to Understand

### Problem Definition
- `/src/problems/` - Problem implementations (4 files)
- `/src/types/experiments.ts` - TypeScript interfaces

### Integration Points
- `/src/UnifiedVisualizer.tsx` - Main integrator (2 critical functions)
- `/src/components/ProblemConfiguration.tsx` - UI
- `/src/utils/problemDefaults.ts` - Default parameters
- `/src/utils/problemAdapter.ts` - Algorithm adapter

### Current Problems (Examples)
- **Quadratic** - `/src/problems/quadratic.ts` (parametrized)
- **Rosenbrock** - `/src/problems/rosenbrock.ts` (parametrized)
- **Saddle Point** - `/src/problems/saddle.ts` (static)
- **Logistic Regression** - `/src/utils/logisticRegression.ts` (dynamic 3D)
- **Separating Hyperplane** - `/src/utils/separatingHyperplane.ts` (dynamic 3D with variants)

## System Overview

**6 Total Problems:**
- 4 pure optimization (2D, in registry): Quadratic, Ill-Conditioned, Rosenbrock, Saddle
- 2 dataset-based (3D, dynamic): Logistic Regression, Separating Hyperplane

**Key Design Patterns:**
- **Registry Pattern** - 2D problems stored in static registry
- **Factory Functions** - Parametrized problems created on-demand
- **Adapter Pattern** - Unified interface for algorithms
- **Reactive Updates** - Parameter changes trigger algorithm recomputation

**Two Interfaces:**
- `ProblemDefinition` - How you define a problem (objective, gradient, Hessian)
- `ProblemFunctions` - How algorithms use a problem (adapted format)

## Problem Requirements

### Minimum Implementation
Every problem must provide:
```typescript
interface ProblemDefinition {
  name: string;                           // Display name
  description: string;                    // Technical description
  objective: (w: number[]) => number;     // f(w)
  gradient: (w: number[]) => number[];    // ∇f(w)
  hessian?: (w: number[]) => number[][];  // H(w) - optional but needed for Newton
  domain: { w0: [min, max]; w1: [min, max] };
  globalMinimum?: [number, number];       // If exists
  criticalPoint?: [number, number];       // For saddles
}
```

### Additional Requirements
- Type registration in `ProblemType` union
- Default parameters in `problemDefaults.ts`
- UI dropdown option in `ProblemConfiguration.tsx`
- Integration in `UnifiedVisualizer.tsx` (2 functions)
- Optional: parameter sliders, documentation, Python validation

## Integration Points Summary

| File | Change | For New Problem |
|------|--------|-----------------|
| `/src/problems/new.ts` | Create | Definition |
| `/src/problems/index.ts` | Add export | Register |
| `/src/types/experiments.ts` | Update union | Type |
| `/src/utils/problemDefaults.ts` | Add cases | Defaults |
| `/src/components/ProblemConfiguration.tsx` | Add option | UI dropdown |
| `/src/UnifiedVisualizer.tsx` | Update 2 functions | Integration |
| `/src/components/ProblemExplainer.tsx` | Add section | Documentation |
| `/python/problems.py` | Add function | Validation |
| `/src/experiments/*-presets.ts` | Create/update | Presets (optional) |

## Existing Problems: Quick Reference

### 1. Quadratic Bowl (2D, parametrized)
- **Location:** `/src/problems/quadratic.ts`
- **Function:** `f(w) = w0² + w1²` (or rotated)
- **Parameter:** Rotation angle θ (0°-90°)
- **Key Learning:** Rotation invariance of Newton vs GD

### 2. Ill-Conditioned Quadratic (2D, parametrized)
- **Location:** `/src/problems/quadratic.ts`
- **Function:** `f(w) = w0² + κ*w1²` (elongated ellipse)
- **Parameter:** Condition number κ (1-1000)
- **Key Learning:** How conditioning affects GD zig-zagging

### 3. Rosenbrock (2D, parametrized)
- **Location:** `/src/problems/rosenbrock.ts`
- **Function:** `f(w) = (1-w0)² + b(w1-w0²)²` (banana valley)
- **Parameter:** Steepness b (10-1000)
- **Key Learning:** Why steep gradients are hard for first-order methods

### 4. Saddle Point (2D, static)
- **Location:** `/src/problems/saddle.ts`
- **Function:** `f(w) = w0² - w1²` (hyperbolic paraboloid)
- **Parameter:** None
- **Key Learning:** Negative eigenvalues in Hessian indicate saddle, not minimum

### 5. Logistic Regression (3D, dynamic)
- **Location:** `/src/utils/logisticRegression.ts`
- **Function:** Binary cross-entropy + L2 regularization
- **Parameter:** Regularization λ
- **Key Learning:** How dataset affects optimization behavior

### 6. Separating Hyperplane (3D, dynamic, 3 variants)
- **Location:** `/src/utils/separatingHyperplane.ts`
- **Variants:** Soft-margin SVM, Perceptron, Squared-Hinge
- **Parameter:** Regularization λ + variant selection
- **Key Learning:** How different loss functions affect solutions

## Important Notes

### Parametrized Problems
Problems with parameters use **factory functions** that return a new `ProblemDefinition` each time the parameter changes. This enables:
- Live parameter adjustment via sliders
- Real-time algorithm recomputation
- Interactive exploration of parameter effects

### 2D vs 3D Visualization
- **2D Problems:** Full parameter space shown in visualization
- **3D Problems:** 2D slice at fixed bias value; bias is adjustable

### Basin Computation
- Works with any problem through the `ProblemFunctions` adapter
- Automatically handles 2D and 3D problems correctly
- Computes convergence from 400 initial points (20x20 grid)

### Validation
- All problems should have Python implementations in `/python/problems.py`
- Use these to numerically verify gradients and Hessians
- Cross-validation catches subtle mathematical errors

## Next Steps

1. **To understand the system:** Read PROBLEM_INTEGRATION_SURVEY.md sections 1-3
2. **To implement a new problem:** Use INTEGRATION_QUICK_REFERENCE.txt checklist
3. **To see working examples:** Read PROBLEM_INTEGRATION_SURVEY.md section 11
4. **During implementation:** Reference the quick lookup document

## Files Generated

This survey was created via thorough codebase analysis on 2025-11-07:
- **PROBLEM_INTEGRATION_SURVEY.md** - Comprehensive reference (14 sections, ~1200 lines)
- **INTEGRATION_QUICK_REFERENCE.txt** - Visual quick lookup
- **SURVEY_README.md** - This file

All files are in `/Users/eph/newtons-method/` directory.
