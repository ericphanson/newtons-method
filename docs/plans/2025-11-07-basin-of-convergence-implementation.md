# Basin of Convergence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace slider-based initial point picker with interactive basin of convergence visualization that shows convergence behavior across parameter space.

**Architecture:** Time-budgeted incremental computation (10ms/frame) with LRU caching per algorithm/problem config. Unified color encoding (hue=basin, lightness=speed). Algorithms enhanced to report convergence metadata.

**Tech Stack:** React, TypeScript, Canvas API, existing algorithm implementations

---

## Task 1: Add AlgorithmResult Interface

**Files:**
- Modify: `src/algorithms/types.ts`

**Step 1: Add AlgorithmResult interface to types**

```typescript
// Add after existing interfaces in src/algorithms/types.ts

export interface AlgorithmSummary {
  converged: boolean;              // Did it meet convergence criteria?
  diverged: boolean;               // Did it hit NaN/Infinity?
  finalLocation: number[];         // Where it ended up [w0, w1, ...]
  finalLoss: number;
  finalGradNorm: number;
  iterationCount: number;
  convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
}

export interface AlgorithmResult<T> {
  iterations: T[];                 // Full iteration history
  summary: AlgorithmSummary;
}
```

**Step 2: Commit**

```bash
git add src/algorithms/types.ts
git commit -m "feat(algorithms): add AlgorithmResult interface for uniform convergence reporting"
```

---

## Task 2: Update runNewton to Return AlgorithmResult

**Files:**
- Modify: `src/algorithms/newton.ts`

**Step 1: Update runNewton signature and return type**

Find the line `export const runNewton = (` (around line 135) and update:

```typescript
export const runNewton = (
  problem: ProblemFunctions,
  options: AlgorithmOptions
): AlgorithmResult<NewtonIteration> => {
```

**Step 2: Compute summary at end of runNewton**

Before the `return iterations;` statement (around line 246), add:

```typescript
  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
```

**Step 3: Update import statement**

At the top of the file, update the import from types.ts:

```typescript
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
```

**Step 4: Commit**

```bash
git add src/algorithms/newton.ts
git commit -m "feat(newton): return AlgorithmResult with convergence summary"
```

---

## Task 3: Update runLBFGS to Return AlgorithmResult

**Files:**
- Modify: `src/algorithms/lbfgs.ts`

**Step 1: Find the export statement and update return type**

Find `export const runLBFGS = (` and update:

```typescript
export const runLBFGS = (
  problem: ProblemFunctions,
  options: AlgorithmOptions
): AlgorithmResult<LBFGSIteration> => {
```

**Step 2: Add convergence summary before return**

Before the `return iterations;` statement, add the same summary computation as Newton (adjust for LBFGS variable names):

```typescript
  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
```

**Step 3: Update imports**

```typescript
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
```

**Step 4: Commit**

```bash
git add src/algorithms/lbfgs.ts
git commit -m "feat(lbfgs): return AlgorithmResult with convergence summary"
```

---

## Task 4: Update runGradientDescent to Return AlgorithmResult

**Files:**
- Modify: `src/algorithms/gradient-descent.ts`

**Step 1: Update return type**

Find `export const runGradientDescent = (` and update:

```typescript
export const runGradientDescent = (
  problem: ProblemFunctions,
  options: AlgorithmOptions
): AlgorithmResult<GradientDescentIteration> => {
```

**Step 2: Add convergence summary**

Before the `return iterations;` statement, add:

```typescript
  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
```

**Step 3: Update imports**

```typescript
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
```

**Step 4: Commit**

```bash
git add src/algorithms/gradient-descent.ts
git commit -m "feat(gd-fixed): return AlgorithmResult with convergence summary"
```

---

## Task 5: Update runGradientDescentLineSearch to Return AlgorithmResult

**Files:**
- Modify: `src/algorithms/gradient-descent-linesearch.ts`

**Step 1: Update return type**

```typescript
export const runGradientDescentLineSearch = (
  problem: ProblemFunctions,
  options: AlgorithmOptions
): AlgorithmResult<GradientDescentLineSearchIteration> => {
```

**Step 2: Add convergence summary**

Before the `return iterations;` statement:

```typescript
  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
```

**Step 3: Update imports**

```typescript
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
```

**Step 4: Commit**

```bash
git add src/algorithms/gradient-descent-linesearch.ts
git commit -m "feat(gd-linesearch): return AlgorithmResult with convergence summary"
```

---

## Task 6: Update Algorithm Callers (UnifiedVisualizer)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Find all runAlgorithm calls and extract iterations**

Search for `runNewton`, `runLBFGS`, `runGradientDescent`, `runGradientDescentLineSearch` calls.

For each, change from:
```typescript
const iterations = runNewton(problemFuncs, { ... });
```

To:
```typescript
const result = runNewton(problemFuncs, { ... });
const iterations = result.iterations;
```

**Step 2: Verify no compilation errors**

Run: `npm run build`

Expected: Success (no TypeScript errors)

**Step 3: Test that visualization still works**

Run: `npm run dev`

Expected: Open browser, verify trajectory visualization displays correctly for all algorithms

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor: update algorithm callers to use AlgorithmResult"
```

---

## Task 7: Update Test Script (test-combinations.ts)

**Files:**
- Modify: `scripts/test-combinations.ts`

**Step 1: Update runTest function**

Find the algorithm calls in `runTest` function (lines ~96-144) and update:

```typescript
// Before: const iterations = runAlgorithm(...)
// After:
let result: any;
switch (algorithm) {
  case 'gd-fixed':
    result = runGradientDescent(problemFuncs, { ... });
    break;
  case 'gd-linesearch':
    result = runGradientDescentLineSearch(problemFuncs, { ... });
    break;
  case 'newton':
    result = runNewton(problemFuncs, { ... });
    break;
  case 'lbfgs':
    result = runLBFGS(problemFuncs, { ... });
    break;
}

const iterations = result.iterations;
```

**Step 2: Test script still works**

Run: `npm run test-combo -- --problem quadratic --algorithm newton`

Expected: Output shows "CONVERGED in X iterations"

**Step 3: Commit**

```bash
git add scripts/test-combinations.ts
git commit -m "refactor: update test script to use AlgorithmResult"
```

---

## Task 8: Create Basin Data Types

**Files:**
- Create: `src/types/basin.ts`

**Step 1: Create new types file**

```typescript
/**
 * Types for basin of convergence visualization
 */

export interface BasinPoint {
  convergenceLoc: [number, number];  // Where it converged (w0, w1)
  iterations: number;                // Iteration count
  converged: boolean;                // Met convergence criteria
  diverged: boolean;                 // Hit NaN/Infinity
}

export interface BasinData {
  resolution: number;                // Grid resolution (e.g., 50)
  bounds: {
    minW0: number;
    maxW0: number;
    minW1: number;
    maxW1: number;
  };
  grid: BasinPoint[][];              // [resolution][resolution]
}

export interface BasinCacheKey {
  problem: string;                   // "rosenbrock"
  algorithm: string;                 // "newton"
  lambda: number;                    // Problem regularization
  rotationAngle?: number;            // For rotated problems
  variant?: string;                  // For separating-hyperplane
}

export interface BasinCacheEntry {
  key: BasinCacheKey;
  data: BasinData;
  timestamp: number;                 // For LRU eviction
}

export interface ColorEncoding {
  hue: number;                       // 0-360, which basin
  lightness: number;                 // 0-100, convergence speed
}
```

**Step 2: Commit**

```bash
git add src/types/basin.ts
git commit -m "feat(basin): add TypeScript types for basin visualization"
```

---

## Task 9: Create BasinCache Class

**Files:**
- Create: `src/utils/basinCache.ts`

**Step 1: Implement cache class**

```typescript
import { BasinCacheKey, BasinCacheEntry } from '../types/basin';

export class BasinCache {
  private cache = new Map<string, BasinCacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 8) {
    this.maxSize = maxSize;
  }

  private keyToString(key: BasinCacheKey): string {
    return JSON.stringify(key);
  }

  get(key: BasinCacheKey): BasinCacheEntry | undefined {
    const keyStr = this.keyToString(key);
    const entry = this.cache.get(keyStr);

    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
    }

    return entry;
  }

  set(key: BasinCacheKey, entry: BasinCacheEntry): void {
    const keyStr = this.keyToString(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(keyStr)) {
      let oldestKey = '';
      let oldestTime = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(keyStr, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

**Step 2: Commit**

```bash
git add src/utils/basinCache.ts
git commit -m "feat(basin): implement LRU cache for basin data"
```

---

## Task 10: Create Basin Computation Utility

**Files:**
- Create: `src/utils/basinComputation.ts`

**Step 1: Create computation utilities**

```typescript
import { ProblemFunctions, AlgorithmOptions } from '../algorithms/types';
import { BasinData, BasinPoint } from '../types/basin';
import { runNewton } from '../algorithms/newton';
import { runLBFGS } from '../algorithms/lbfgs';
import { runGradientDescent } from '../algorithms/gradient-descent';
import { runGradientDescentLineSearch } from '../algorithms/gradient-descent-linesearch';

/**
 * Compute basin point by running algorithm from a starting point
 */
export function computeBasinPoint(
  initialPoint: [number, number] | [number, number, number],
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs',
  algorithmParams: any
): BasinPoint {
  try {
    let result: any;

    switch (algorithm) {
      case 'gd-fixed':
        result = runGradientDescent(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'gd-linesearch':
        result = runGradientDescentLineSearch(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'newton':
        result = runNewton(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'lbfgs':
        result = runLBFGS(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    return {
      convergenceLoc: result.summary.finalLocation.slice(0, 2) as [number, number],
      iterations: result.summary.iterationCount,
      converged: result.summary.converged,
      diverged: result.summary.diverged
    };
  } catch (error) {
    // Algorithm threw error (singular Hessian, numerical issues)
    console.warn('Algorithm failed at point', initialPoint, error);
    return {
      convergenceLoc: [NaN, NaN],
      iterations: 0,
      converged: false,
      diverged: true
    };
  }
}

/**
 * Initialize empty basin data structure
 */
export function initializeBasinData(
  resolution: number,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number }
): BasinData {
  const grid: BasinPoint[][] = Array(resolution)
    .fill(null)
    .map(() =>
      Array(resolution)
        .fill(null)
        .map(() => ({
          convergenceLoc: [0, 0] as [number, number],
          iterations: 0,
          converged: false,
          diverged: false
        }))
    );

  return { resolution, bounds, grid };
}
```

**Step 2: Commit**

```bash
git add src/utils/basinComputation.ts
git commit -m "feat(basin): add basin point computation utilities"
```

---

## Task 11: Create Incremental Basin Computation with Time-Budgeting

**Files:**
- Modify: `src/utils/basinComputation.ts`

**Step 1: Add incremental computation function**

Add to the end of `basinComputation.ts`:

```typescript
const FRAME_BUDGET_MS = 10;

/**
 * Compute basin incrementally with time-budgeted RAF loop
 * Returns null if cancelled (taskId changed)
 */
export async function computeBasinIncremental(
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs',
  algorithmParams: any,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number },
  resolution: number,
  taskIdRef: { current: number },
  currentTaskId: number,
  onProgress?: (completed: number, total: number) => void
): Promise<BasinData | null> {
  const basinData = initializeBasinData(resolution, bounds);
  let pointIndex = 0;
  const totalPoints = resolution * resolution;

  while (pointIndex < totalPoints) {
    // Yield to browser
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Check cancellation
    if (taskIdRef.current !== currentTaskId) {
      console.log('Basin computation cancelled');
      return null;
    }

    const frameStart = performance.now();

    // Compute as many points as we can in our time budget
    while (pointIndex < totalPoints) {
      const i = Math.floor(pointIndex / resolution);
      const j = pointIndex % resolution;

      // Compute starting point in parameter space
      const w0 = bounds.minW0 + (j / (resolution - 1)) * (bounds.maxW0 - bounds.minW0);
      const w1 = bounds.minW1 + (i / (resolution - 1)) * (bounds.maxW1 - bounds.minW1);

      // Handle 3D problems (logistic regression, separating hyperplane)
      const initialPoint: [number, number] | [number, number, number] =
        problemFuncs.dimensionality === 3
          ? [w0, w1, algorithmParams.biasSlice || 0]
          : [w0, w1];

      // Run algorithm from this starting point
      const result = computeBasinPoint(
        initialPoint,
        problemFuncs,
        algorithm,
        algorithmParams
      );

      basinData.grid[i][j] = result;
      pointIndex++;

      // Check time budget
      if (performance.now() - frameStart > FRAME_BUDGET_MS) {
        break; // Yield to browser
      }
    }

    // Report progress
    if (onProgress) {
      onProgress(pointIndex, totalPoints);
    }
  }

  return basinData;
}
```

**Step 2: Commit**

```bash
git add src/utils/basinComputation.ts
git commit -m "feat(basin): add incremental time-budgeted computation"
```

---

## Task 12: Create Basin Clustering Utility

**Files:**
- Create: `src/utils/basinClustering.ts`

**Step 1: Implement simple distance-based clustering**

```typescript
import { BasinData } from '../types/basin';

const CLUSTER_THRESHOLD = 0.1;

/**
 * Simple distance-based clustering of convergence locations
 * Returns array of cluster IDs for each grid point (row-major order)
 * -1 means no cluster (diverged/didn't converge)
 */
export function clusterConvergenceLocations(basinData: BasinData): number[] {
  // Extract all convergence locations
  const locations: Array<{ loc: [number, number]; index: number }> = [];

  basinData.grid.forEach((row, i) => {
    row.forEach((point, j) => {
      if (point.converged) {
        locations.push({
          loc: point.convergenceLoc,
          index: i * basinData.resolution + j
        });
      }
    });
  });

  // Build clusters
  const clusters: Array<[number, number]> = [];
  const pointToCluster = new Map<number, number>();

  locations.forEach(({ loc, index }) => {
    // Check if this point is close to any existing cluster center
    let assignedCluster = -1;

    for (let c = 0; c < clusters.length; c++) {
      const center = clusters[c];
      const dist = Math.sqrt(
        Math.pow(loc[0] - center[0], 2) + Math.pow(loc[1] - center[1], 2)
      );

      if (dist < CLUSTER_THRESHOLD) {
        assignedCluster = c;
        break;
      }
    }

    // Create new cluster if no match
    if (assignedCluster === -1) {
      assignedCluster = clusters.length;
      clusters.push(loc);
    }

    pointToCluster.set(index, assignedCluster);
  });

  // Build result array
  const result: number[] = [];
  for (let i = 0; i < basinData.resolution; i++) {
    for (let j = 0; j < basinData.resolution; j++) {
      const index = i * basinData.resolution + j;
      const point = basinData.grid[i][j];

      if (!point.converged) {
        result.push(-1);
      } else {
        result.push(pointToCluster.get(index) || 0);
      }
    }
  }

  return result;
}

/**
 * Assign hues to clusters
 * Single cluster: all one hue (blue)
 * Multiple clusters: spread across spectrum
 */
export function assignHuesToClusters(numClusters: number): number[] {
  if (numClusters === 0) return [];
  if (numClusters === 1) return [210]; // Blue

  // Spread across spectrum
  const hues: number[] = [];
  for (let i = 0; i < numClusters; i++) {
    hues.push((i * 360) / numClusters);
  }
  return hues;
}
```

**Step 2: Commit**

```bash
git add src/utils/basinClustering.ts
git commit -m "feat(basin): add convergence location clustering"
```

---

## Task 13: Create Basin Color Encoding Utility

**Files:**
- Create: `src/utils/basinColorEncoding.ts`

**Step 1: Implement color encoding**

```typescript
import { BasinData, ColorEncoding } from '../types/basin';
import { clusterConvergenceLocations, assignHuesToClusters } from './basinClustering';

/**
 * Encode basin data as colors (hue=basin, lightness=speed)
 */
export function encodeBasinColors(basinData: BasinData): ColorEncoding[][] {
  // Step 1: Cluster convergence locations
  const clusterIds = clusterConvergenceLocations(basinData);
  const maxClusterId = Math.max(...clusterIds);
  const numClusters = maxClusterId + 1;

  // Step 2: Assign hue to each cluster
  const clusterHues = assignHuesToClusters(numClusters);

  // Step 3: Find iteration range for lightness mapping
  const validPoints = basinData.grid.flat().filter(p => p.converged);

  if (validPoints.length === 0) {
    // All points diverged - return all dark
    return basinData.grid.map(row =>
      row.map(() => ({ hue: 0, lightness: 10 }))
    );
  }

  const minIter = Math.min(...validPoints.map(p => p.iterations));
  const maxIter = Math.max(...validPoints.map(p => p.iterations));

  // Step 4: Encode each grid point
  return basinData.grid.map((row, i) =>
    row.map((point, j) => {
      if (point.diverged) {
        return { hue: 0, lightness: 10 }; // Very dark
      }
      if (!point.converged) {
        return { hue: 0, lightness: 20 }; // Dark gray
      }

      const pointIndex = i * basinData.resolution + j;
      const clusterId = clusterIds[pointIndex];
      const hue = clusterId >= 0 ? clusterHues[clusterId] : 0;

      // Map iterations to lightness (log scale)
      let lightness = 55; // Default middle
      if (maxIter > minIter) {
        const t =
          (Math.log(point.iterations) - Math.log(minIter)) /
          (Math.log(maxIter) - Math.log(minIter));
        lightness = 80 - t * 50; // Range: 80% (fast) to 30% (slow)
      }

      return { hue, lightness };
    })
  );
}
```

**Step 2: Commit**

```bash
git add src/utils/basinColorEncoding.ts
git commit -m "feat(basin): add color encoding (hue=basin, lightness=speed)"
```

---

## Task 14: Create BasinPicker Component (Structure)

**Files:**
- Create: `src/components/BasinPicker.tsx`

**Step 1: Create component skeleton**

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { BasinData, BasinCacheKey, ColorEncoding } from '../types/basin';
import { ProblemFunctions } from '../algorithms/types';
import { BasinCache } from '../utils/basinCache';

interface BasinPickerProps {
  problem: any;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
  algorithmParams: any;
  problemFuncs: ProblemFunctions;
  initialPoint: [number, number] | [number, number, number];
  onInitialPointChange: (point: [number, number] | [number, number, number]) => void;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
}

// Global cache instance
const basinCache = new BasinCache(8);

export const BasinPicker: React.FC<BasinPickerProps> = ({
  problem,
  algorithm,
  algorithmParams,
  problemFuncs,
  initialPoint,
  onInitialPointChange,
  bounds
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskIdRef = useRef(0);
  const [basinData, setBasinData] = useState<BasinData | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);

  // TODO: Add computation logic
  // TODO: Add rendering logic
  // TODO: Add click handling

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Click to change initial point
      </label>

      {problemFuncs.dimensionality === 3 && (
        <div className="text-xs text-gray-500 italic mb-1">
          Slice at bias = {(algorithmParams.biasSlice || 0).toFixed(2)}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="border border-gray-300 cursor-crosshair"
        style={{ width: 250, height: 250 }}
      />

      {isComputing && (
        <div className="text-xs text-gray-500 mt-1">
          Computing basin... {progress}%
        </div>
      )}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/BasinPicker.tsx
git commit -m "feat(basin): create BasinPicker component skeleton"
```

---

## Task 15: Add Basin Computation Hook to BasinPicker

**Files:**
- Modify: `src/components/BasinPicker.tsx`

**Step 1: Add imports**

```typescript
import { computeBasinIncremental } from '../utils/basinComputation';
import { encodeBasinColors } from '../utils/basinColorEncoding';
```

**Step 2: Add computation effect**

Add after the state declarations:

```typescript
  // Build cache key
  const cacheKey: BasinCacheKey = {
    problem: problem.name,
    algorithm,
    lambda: problem.lambda || 0,
    rotationAngle: problem.rotationAngle,
    variant: problem.variant
  };

  // Compute basin when params change
  useEffect(() => {
    const computeBasin = async () => {
      // Check cache first
      const cached = basinCache.get(cacheKey);
      if (cached) {
        setBasinData(cached.data);
        setIsComputing(false);
        return;
      }

      // Start new computation
      setIsComputing(true);
      setProgress(0);
      const taskId = ++taskIdRef.current;

      const result = await computeBasinIncremental(
        problemFuncs,
        algorithm,
        algorithmParams,
        bounds,
        50, // resolution
        taskIdRef,
        taskId,
        (completed, total) => {
          setProgress(Math.floor((completed / total) * 100));
        }
      );

      if (result) {
        // Store in cache
        basinCache.set(cacheKey, {
          key: cacheKey,
          data: result,
          timestamp: Date.now()
        });

        setBasinData(result);
        setIsComputing(false);
      }
    };

    computeBasin();
  }, [
    problem.name,
    algorithm,
    problem.lambda,
    problem.rotationAngle,
    problem.variant,
    bounds.minW0,
    bounds.maxW0,
    bounds.minW1,
    bounds.maxW1
  ]);
```

**Step 3: Commit**

```bash
git add src/components/BasinPicker.tsx
git commit -m "feat(basin): add incremental computation with caching"
```

---

## Task 16: Add Basin Rendering to BasinPicker

**Files:**
- Modify: `src/components/BasinPicker.tsx`

**Step 1: Add rendering effect**

Add after the computation effect:

```typescript
  // Render basin when data changes
  useEffect(() => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Encode colors
    const colors = encodeBasinColors(basinData);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw basin
    const cellWidth = canvas.width / basinData.resolution;
    const cellHeight = canvas.height / basinData.resolution;

    for (let i = 0; i < basinData.resolution; i++) {
      for (let j = 0; j < basinData.resolution; j++) {
        const color = colors[i][j];
        const x = j * cellWidth;
        const y = i * cellHeight;

        ctx.fillStyle = `hsl(${color.hue}, 70%, ${color.lightness}%)`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }

    // Draw crosshair
    const [w0, w1] = initialPoint;
    const xPos =
      ((w0 - basinData.bounds.minW0) / (basinData.bounds.maxW0 - basinData.bounds.minW0)) *
      canvas.width;
    const yPos =
      ((basinData.bounds.maxW1 - w1) / (basinData.bounds.maxW1 - basinData.bounds.minW1)) *
      canvas.height;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    const size = 15;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(xPos - size, yPos);
    ctx.lineTo(xPos + size, yPos);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(xPos, yPos - size);
    ctx.lineTo(xPos, yPos + size);
    ctx.stroke();

    // Center dot
    ctx.setLineDash([]);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(xPos, yPos, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, [basinData, initialPoint]);
```

**Step 2: Commit**

```bash
git add src/components/BasinPicker.tsx
git commit -m "feat(basin): add canvas rendering with crosshair"
```

---

## Task 17: Add Click Handling to BasinPicker

**Files:**
- Modify: `src/components/BasinPicker.tsx`

**Step 1: Add click handler**

Add before the return statement:

```typescript
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const { minW0, maxW0, minW1, maxW1 } = basinData.bounds;

    const w0 = minW0 + (canvasX / canvas.width) * (maxW0 - minW0);
    const w1 = maxW1 - (canvasY / canvas.height) * (maxW1 - minW1);

    // Handle 3D problems
    if (problemFuncs.dimensionality === 3) {
      onInitialPointChange([w0, w1, algorithmParams.biasSlice || 0]);
    } else {
      onInitialPointChange([w0, w1]);
    }
  };
```

**Step 2: Add onClick to canvas**

Update the canvas element:

```typescript
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="border border-gray-300 cursor-crosshair"
        style={{ width: 250, height: 250 }}
        onClick={handleCanvasClick}
      />
```

**Step 3: Commit**

```bash
git add src/components/BasinPicker.tsx
git commit -m "feat(basin): add click-to-select initial point"
```

---

## Task 18: Integrate BasinPicker into AlgorithmConfiguration

**Files:**
- Modify: `src/components/AlgorithmConfiguration.tsx`

**Step 1: Add imports**

Add at the top:

```typescript
import { BasinPicker } from './BasinPicker';
import { ProblemFunctions } from '../algorithms/types';
```

**Step 2: Add props for basin picker**

Add to `AlgorithmConfigurationProps` interface:

```typescript
  // For basin picker
  problemFuncs: ProblemFunctions;
  problem: any;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  biasSlice?: number;
```

**Step 3: Replace sliders with BasinPicker**

Find the section with w0/w1 sliders (around line 80-120) and replace with:

```typescript
        {/* Basin Picker (replaces sliders) */}
        <div className="col-span-2">
          <BasinPicker
            problem={props.problem}
            algorithm={algorithm}
            algorithmParams={{
              maxIter: props.maxIter,
              alpha: props.gdFixedAlpha,
              c1: props.gdLSC1 || props.newtonC1 || props.lbfgsC1,
              m: props.lbfgsM,
              hessianDamping: props.newtonHessianDamping || props.lbfgsHessianDamping,
              lineSearch: props.newtonLineSearch,
              tolerance: 1e-5,
              lambda: 0,
              biasSlice: props.biasSlice
            }}
            problemFuncs={props.problemFuncs}
            initialPoint={[props.initialW0, props.initialW1, props.biasSlice || 0]}
            onInitialPointChange={(point) => {
              props.onInitialW0Change(point[0]);
              props.onInitialW1Change(point[1]);
            }}
            bounds={props.bounds}
          />
        </div>
```

**Step 4: Commit**

```bash
git add src/components/AlgorithmConfiguration.tsx
git commit -m "feat(basin): integrate BasinPicker into AlgorithmConfiguration"
```

---

## Task 19: Update UnifiedVisualizer to Pass Basin Props

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

**Step 1: Find AlgorithmConfiguration usage**

Search for `<AlgorithmConfiguration` and add the new props:

```typescript
          <AlgorithmConfiguration
            algorithm={activeAlgorithm}
            // ... existing props ...
            problemFuncs={problemFuncs}
            problem={currentProblem}
            bounds={bounds}
            biasSlice={biasSlice}
          />
```

**Step 2: Verify bounds variable exists**

Search for where `bounds` is defined. If it doesn't exist, add near other state:

```typescript
  const bounds = {
    minW0: -3,
    maxW0: 3,
    minW1: -3,
    maxW1: 3
  };
```

**Step 3: Compile and test**

Run: `npm run dev`

Expected: Basin picker appears in place of sliders

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(basin): pass basin props from UnifiedVisualizer"
```

---

## Task 20: Add Colorbar Legend Component

**Files:**
- Create: `src/components/ColorbarLegend.tsx`

**Step 1: Create component**

```typescript
import React, { useRef, useEffect } from 'react';

interface ColorbarLegendProps {
  hues: number[];            // Hues for each cluster
  isMultiModal: boolean;     // Multiple clusters?
}

export const ColorbarLegend: React.FC<ColorbarLegendProps> = ({ hues, isMultiModal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isMultiModal) {
      // Draw discrete swatches
      hues.forEach((hue, idx) => {
        const y = idx * 30;
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.fillRect(0, y, 20, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Min ${idx + 1}`, 25, y + 15);
      });
    } else {
      // Draw gradient
      const hue = hues[0] || 210;
      const height = 100;

      for (let i = 0; i < height; i++) {
        const lightness = 80 - (i / height) * 50;
        ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
        ctx.fillRect(0, i, 20, 1);
      }

      ctx.fillStyle = '#000';
      ctx.font = '11px sans-serif';
      ctx.fillText('Fast', 25, 10);
      ctx.fillText('Slow', 25, height - 5);
    }
  }, [hues, isMultiModal]);

  return (
    <div className="mt-2">
      <canvas
        ref={canvasRef}
        width={80}
        height={isMultiModal ? hues.length * 30 : 100}
        className="border border-gray-200"
      />
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/ColorbarLegend.tsx
git commit -m "feat(basin): add colorbar legend component"
```

---

## Task 21: Add Colorbar to BasinPicker

**Files:**
- Modify: `src/components/BasinPicker.tsx`

**Step 1: Import ColorbarLegend**

```typescript
import { ColorbarLegend } from './ColorbarLegend';
import { clusterConvergenceLocations, assignHuesToClusters } from '../utils/basinClustering';
```

**Step 2: Compute cluster hues**

Add after basinData state:

```typescript
  const clusterHues = React.useMemo(() => {
    if (!basinData) return [];
    const clusterIds = clusterConvergenceLocations(basinData);
    const numClusters = Math.max(...clusterIds) + 1;
    return assignHuesToClusters(numClusters);
  }, [basinData]);
```

**Step 3: Add to JSX**

Add after the canvas:

```typescript
      {basinData && (
        <ColorbarLegend
          hues={clusterHues}
          isMultiModal={clusterHues.length > 1}
        />
      )}
```

**Step 4: Commit**

```bash
git add src/components/BasinPicker.tsx
git commit -m "feat(basin): add colorbar legend to picker"
```

---

## Task 22: Test Full Integration

**Files:**
- None (testing only)

**Step 1: Build project**

Run: `npm run build`

Expected: Success, no TypeScript errors

**Step 2: Start dev server**

Run: `npm run dev`

**Step 3: Manual testing checklist**

- [ ] Basin appears in place of sliders
- [ ] Basin computes on page load (~1 second)
- [ ] Clicking basin updates trajectory
- [ ] Crosshair follows clicks
- [ ] Switching algorithm tabs shows cached basin (instant) or computes new
- [ ] Changing problem params triggers recomputation
- [ ] 3D problems (logistic regression) show "Slice at bias = X" label
- [ ] Colorbar shows gradient for single-minimum problems
- [ ] UI stays responsive during computation (no freezing)

**Step 4: Test all algorithm/problem combinations**

For each:
- Quadratic + Newton
- Rosenbrock + Newton
- Ill-conditioned + Newton
- Rosenbrock + L-BFGS
- Logistic Regression + Newton

Expected: Basin renders correctly, click-to-select works

**Step 5: Document any issues found**

If bugs found, create follow-up tasks to fix

---

## Task 23: Add Multi-Modal Test Problem (Optional Enhancement)

**Files:**
- Create: `src/problems/himmelblau.ts`

**Step 1: Implement Himmelblau function**

```typescript
/**
 * Himmelblau function - classic multi-modal test function
 * Has 4 local minima:
 * - (3, 2) with f(x) = 0
 * - (-2.805118, 3.131312) with f(x) = 0
 * - (-3.779310, -3.283186) with f(x) = 0
 * - (3.584428, -1.848126) with f(x) = 0
 */

import { Problem } from './index';

export const himmelblau: Problem = {
  name: 'himmelblau',
  displayName: "Himmelblau's Function",
  description: 'Multi-modal function with 4 local minima',
  dimensionality: 2,

  objective: (w: number[]) => {
    const [x, y] = w;
    const term1 = x * x + y - 11;
    const term2 = x + y * y - 7;
    return term1 * term1 + term2 * term2;
  },

  gradient: (w: number[]) => {
    const [x, y] = w;
    const term1 = x * x + y - 11;
    const term2 = x + y * y - 7;

    const dx = 4 * x * term1 + 2 * term2;
    const dy = 2 * term1 + 4 * y * term2;

    return [dx, dy];
  },

  hessian: (w: number[]) => {
    const [x, y] = w;

    const dxx = 12 * x * x + 4 * y - 42;
    const dyy = 12 * y * y + 4 * x - 26;
    const dxy = 4 * x + 4 * y;

    return [
      [dxx, dxy],
      [dxy, dyy]
    ];
  },

  hasHessian: true
};
```

**Step 2: Register in problems index**

Add to `src/problems/index.ts`:

```typescript
import { himmelblau } from './himmelblau';

// Add to problems object
export const problems: Record<string, Problem> = {
  // ... existing problems ...
  'himmelblau': himmelblau
};
```

**Step 3: Test Himmelblau basin**

Run: `npm run dev`

Select Himmelblau problem, verify 4 colored regions appear

**Step 4: Commit**

```bash
git add src/problems/himmelblau.ts src/problems/index.ts
git commit -m "feat(basin): add Himmelblau multi-modal test function"
```

---

## Success Criteria

- [ ] All 4 algorithms return AlgorithmResult interface
- [ ] Basin computes in background without freezing UI
- [ ] Cache works (algorithm tab switching instant for cached basins)
- [ ] Click-to-select updates trajectory correctly
- [ ] Crosshair renders at correct position
- [ ] Colorbar legend displays (gradient for single, swatches for multi)
- [ ] 3D problems show slice label
- [ ] Compilation succeeds with no TypeScript errors
- [ ] Manual testing passes for all algorithm/problem combinations

## Notes

- Keep commits small and focused (one logical change per commit)
- Test after each major change (algorithm updates, basin computation, UI integration)
- If basin computation feels slow, verify 10ms time budget is working
- Cache debugging: Check browser console for "Basin computation cancelled" messages
- For multi-modal clustering issues, adjust CLUSTER_THRESHOLD in basinClustering.ts
