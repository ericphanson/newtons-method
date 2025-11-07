# Design: Adding Multimodal Canonical Test Functions

**Date:** 2025-11-07
**Status:** Approved

## Overview

Add two canonical multimodal optimization test functions to the Newton's method visualizer to demonstrate interesting basins of convergence with multiple local minima.

## Problems to Add

### 1. Himmelblau's Function

**Equation:** `f(x,y) = (x² + y - 11)² + (x + y² - 7)²`

**Properties:**
- Four global minima (all with f = 0)
- Perfectly symmetric basins
- Well-known optimization benchmark
- Creates beautiful fractal-like basin boundaries

**Minima locations:**
1. (3.0, 2.0)
2. (-2.805118, 3.131312)
3. (-3.779310, -3.283186)
4. (3.584428, -1.848126)

**Domain:** [-6, 6] × [-6, 6]

**Gradient:**
```
∇f = [4x(x² + y - 11) + 2(x + y² - 7),
      2(x² + y - 11) + 4y(x + y² - 7)]
```

### 2. Three-Hump Camel Function

**Equation:** `f(x,y) = 2x² - 1.05x⁴ + x⁶/6 + xy + y²`

**Properties:**
- Three local minima (1 global, 2 local)
- Standard benchmark function
- Simple polynomial form
- Asymmetric basins of different sizes

**Minima locations:**
- Global: (0, 0) with f = 0
- Local: approximately (±1.7, ∓0.85) with f ≈ 0.0

**Domain:** [-5, 5] × [-5, 5]

**Gradient:**
```
∇f = [4x - 4.2x³ + x⁵ + y,
      x + 2y]
```

**Hessian:**
```
H = [[4 - 12.6x² + 5x⁴, 1],
     [1, 2]]
```

## Implementation Architecture

### File Structure

**New files:**
1. `/src/problems/himmelblau.ts` - Himmelblau problem definition
2. `/src/problems/threeHumpCamel.ts` - Three-Hump Camel problem definition

**Modified files (14 integration points):**
1. `/src/problems/index.ts` - Register both problems
2. `/src/types/experiments.ts` - Add problem types
3. `/src/utils/problemDefaults.ts` - Add default parameters
4. `/src/components/ProblemConfiguration.tsx` - Add UI dropdowns
5. `/src/UnifiedVisualizer.tsx` - Update `getCurrentProblem()`
6. `/src/UnifiedVisualizer.tsx` - Update `getCurrentProblemFunctions()`
7. `/src/components/ProblemExplainer.tsx` - Add documentation
8. `/python/problems.py` - Add Python validation (optional)

### Problem Definition Interface

Both problems follow the existing `ProblemDefinition` interface:

```typescript
interface ProblemDefinition {
  objective: (x: number, y: number) => number;
  gradient: (x: number, y: number) => [number, number];
  hessian: (x: number, y: number) => [[number, number], [number, number]];
  domain: { xMin: number; xMax: number; yMin: number; yMax: number };
  minima?: Array<{ x: number; y: number; value: number }>;
  description?: string;
}
```

### Key Design Decisions

1. **Pure optimization problems**: No datasets, just mathematical functions (like Rosenbrock, Quadratic)
2. **Hand-coded derivatives**: Gradient and Hessian explicitly coded for clarity and pedagogy
3. **Exact minima locations**: Store known minima for visualization and validation
4. **Standard domains**: Use literature-standard domains for each function
5. **Pedagogical comments**: Add detailed comments explaining the mathematics

## Default Parameters

Both problems will use standard Newton's method defaults:
- Learning rate: 1.0 (pure Newton's method)
- Max iterations: 50-100
- Tolerance: 1e-6

## UI Integration

**Problem selector dropdown** will include:
- "Himmelblau's Function"
- "Three-Hump Camel"

**Problem explainer** will show:
- Equation with proper mathematical notation
- Number of minima and their properties
- Brief description of basin structure
- Reference to optimization literature

## Validation

Both functions can be validated in Python to ensure correctness:
- Test objective values at known minima
- Verify gradient is zero at minima
- Check Hessian positive definite at minima

## Success Criteria

1. Both problems render basin visualizations correctly
2. Newton's method converges to correct minima from various starting points
3. Basin boundaries visible at current UI resolution
4. Code includes clear pedagogical comments
5. All 14 integration points updated correctly
