# Basin of Convergence Visualization Design

**Date:** 2025-11-07
**Status:** Design Approved
**Author:** Brainstorming session with user

## Executive Summary

Replace the current w₀/w₁ slider-based initial point picker with an interactive basin of convergence map. Users click directly on the basin visualization to select starting points, seeing at a glance how different regions of parameter space behave. The basin computation runs in the background using time-budgeted incremental rendering to keep the UI responsive.

**Key Constraint:** This should feel like a natural enhancement to the initial point picker, not a heavyweight "feature." The computational complexity is downplayed in the UX.

## Goals

1. **Visual Intuition**: Show users the "landscape" of convergence behavior across parameter space
2. **Better Point Selection**: Click to pick initial points instead of fiddling with sliders
3. **Pedagogical Value**:
   - Convergence speed visualization (light = fast, dark = slow)
   - Multi-modal basin boundaries (different colors for different minima)
   - Algorithm comparison (see how Newton vs L-BFGS basins differ)
4. **Maintain Performance**: Never freeze the UI or trigger "page not responsive" warnings

## Non-Goals

- Pre-computation or offline generation
- Ultra high-resolution "fractal art" mode (future enhancement)
- Web Workers (start simple, add later if needed)
- Adaptive/smart sampling (regular grid is fast enough)

## Design Principles

- **Respectful Computation**: 10ms time budget per frame, yield frequently via RAF
- **Cache-First**: Compute once per problem/algorithm config, cache for instant tab switching
- **Latest Wins**: No queue buildup - cancel stale computations when params change
- **Uniform Interface**: Algorithms expose standardized convergence reporting

## Benchmark Data

Performance measured on real TypeScript implementations:

| Problem | Algorithm | 50×50 Grid | Est. 100×100 |
|---------|-----------|------------|--------------|
| Rosenbrock | Newton | 0.76s | ~3.0s |
| Rosenbrock | L-BFGS | 0.69s | ~2.7s |
| Quadratic | Newton | 0.24s | ~1.0s |
| Ill-conditioned | Newton | 0.22s | ~0.9s |

**Decision:** Use fixed 50×50 grid (~0.8s typical, ~2,500 algorithm runs). Small canvas (~250px) makes this resolution visually smooth.

## UI Changes

### Before
```
Algorithm Configuration Panel:
├── Problem selector
├── Initial Point (w₀ slider)
├── Initial Point (w₁ slider)
├── Algorithm hyperparameters
└── ...
```

### After
```
Algorithm Configuration Panel:
├── Problem selector
├── Basin Map (250×250px clickable canvas)
│   ├── "Click to change initial point" label
│   ├── [3D only] "Slice at bias = X.XX" note
│   ├── Crosshair showing current point
│   └── Colorbar/legend
├── Algorithm hyperparameters (unchanged)
└── ...
```

**Key Change:** Sliders completely removed. Point selection is now click-only.

## Architecture

### High-Level Data Flow

```
Problem params change
    ↓
Check cache for basin (keyed by problem + algorithm + params)
    ├─→ Cache hit: Render immediately
    └─→ Cache miss: Start incremental computation
            ↓
        Time-budgeted computation (10ms/frame)
            ├─→ Compute ~30-40 points per frame
            ├─→ Yield via requestAnimationFrame
            ├─→ Check cancellation flag (taskId)
            └─→ Repeat until done or cancelled
            ↓
        Cache result + render
            ↓
User clicks basin map
    ↓
Set new initial point → Recompute trajectory (existing flow)
```

### Component Structure

```typescript
// New component
<BasinPicker
  problem={currentProblem}
  algorithm={currentAlgorithm}
  algorithmParams={params}
  initialPoint={currentInitialPoint}
  onInitialPointChange={setInitialPoint}
/>

// Replaces existing sliders in AlgorithmConfiguration.tsx
```

## Data Structures

### Basin Data
```typescript
interface BasinPoint {
  convergenceLoc: [number, number];  // Where it converged (w0, w1)
  iterations: number;                // Iteration count
  converged: boolean;                // Met convergence criteria
  diverged: boolean;                 // Hit NaN/Infinity
}

interface BasinData {
  resolution: number;                // 50
  bounds: {
    minW0: number;
    maxW0: number;
    minW1: number;
    maxW1: number;
  };
  grid: BasinPoint[][];              // [50][50]
}
```

### Cache
```typescript
interface BasinCacheKey {
  problem: string;           // "rosenbrock"
  algorithm: string;         // "newton"
  lambda: number;           // Problem regularization
  rotationAngle?: number;   // For rotated problems
  variant?: string;         // For separating-hyperplane
  // All params that affect the loss landscape
}

interface BasinCacheEntry {
  key: BasinCacheKey;
  data: BasinData;
  timestamp: number;        // For LRU eviction
}

class BasinCache {
  private cache = new Map<string, BasinCacheEntry>();
  private maxSize = 8;  // ~400KB total (50KB per basin)

  get(key: BasinCacheKey): BasinCacheEntry | undefined;
  set(key: BasinCacheKey, entry: BasinCacheEntry): void;
}
```

**Cache Behavior:**
- Cache key includes all params that affect landscape (no explicit clear needed)
- LRU eviction when size limit reached
- Cache per algorithm → instant tab switching if cached
- No pre-warming (compute only for active tab)

## Algorithm Interface Enhancement

### Current Interface
```typescript
runNewton(...): NewtonIteration[]
```

### New Interface
```typescript
interface AlgorithmResult {
  iterations: Iteration[];     // Full history (for trajectory viz)
  summary: {
    converged: boolean;        // Met gradient threshold?
    diverged: boolean;         // NaN/Infinity?
    finalLocation: number[];   // Final parameter values
    finalLoss: number;
    finalGradNorm: number;
    iterationCount: number;
    convergenceCriterion: string;  // "gradient" | "maxiter" | "diverged"
  };
}

// All algorithms return uniform interface
runNewton(...): AlgorithmResult
runLBFGS(...): AlgorithmResult
runGradientDescent(...): AlgorithmResult
runGradientDescentLineSearch(...): AlgorithmResult
```

**Benefits:**
- Basin code doesn't guess about convergence
- Algorithms own their convergence criteria
- Future algorithms automatically compatible

## Color Encoding

### Unified Hue + Lightness Scheme

**Hue (color):** Which basin (minimum)
- Single minimum → One hue (e.g., 210° = blue)
- Multi-modal → Distinct hues per basin (0°=red, 120°=green, 240°=blue)

**Lightness:** Convergence speed
- Light (80%) = Fast convergence (few iterations)
- Dark (30%) = Slow convergence (many iterations)
- Use log scale: `lightness = 80 - 50 * log(iter/minIter) / log(maxIter/minIter)`

**Special Cases:**
- Diverged points: Very dark (10% lightness), hue=0
- Non-converged (hit maxIter): Dark gray (20% lightness)

### Multi-Modal Clustering

```typescript
function clusterConvergenceLocations(basinData: BasinData): number[] {
  const locations = basinData.grid.flat()
    .filter(p => p.converged)
    .map(p => p.convergenceLoc);

  // Simple distance-based clustering
  const THRESHOLD = 0.1;  // Points within 0.1 are "same minimum"
  const clusters = simpleClustering(locations, THRESHOLD);

  // Assign cluster ID to each grid point
  return basinData.grid.flat().map(point => {
    if (!point.converged) return -1;
    return findCluster(point.convergenceLoc, clusters);
  });
}
```

### Colorbar/Legend

**Single Minimum:**
- Vertical gradient bar (light → dark)
- Labels: "Fast" (top), "Slow" (bottom)

**Multi-Modal:**
- Color swatches with labels
- Example: [Blue] Min 1, [Red] Min 2, [Green] Min 3
- Plus lightness gradient for one representative hue

## Incremental Computation

### Time-Budgeted RAF Loop

```typescript
async function computeBasinIncremental(
  problemFuncs: ProblemFunctions,
  algorithm: string,
  algorithmParams: any,
  bounds: { minW0, maxW0, minW1, maxW1 },
  cacheKey: BasinCacheKey
): Promise<BasinData | null> {

  const RESOLUTION = 50;
  const FRAME_BUDGET_MS = 10;  // Stay well under 16ms frame time
  const taskId = ++taskIdCounterRef.current;

  const basinData = initializeBasinData(RESOLUTION, bounds);
  let pointIndex = 0;
  const totalPoints = RESOLUTION * RESOLUTION;

  while (pointIndex < totalPoints) {
    // Yield to browser
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Check cancellation
    if (taskIdCounterRef.current !== taskId) {
      return null;  // Stale computation
    }

    const frameStart = performance.now();

    // Compute as many points as we can in our time budget
    while (pointIndex < totalPoints) {
      const i = Math.floor(pointIndex / RESOLUTION);
      const j = pointIndex % RESOLUTION;

      const w0 = bounds.minW0 + (j / (RESOLUTION - 1)) * (bounds.maxW0 - bounds.minW0);
      const w1 = bounds.minW1 + (i / (RESOLUTION - 1)) * (bounds.maxW1 - bounds.minW1);

      const result = runAlgorithm(problemFuncs, {
        ...algorithmParams,
        initialPoint: [w0, w1]
      });

      basinData.grid[i][j] = {
        convergenceLoc: result.summary.finalLocation.slice(0, 2),
        iterations: result.summary.iterationCount,
        converged: result.summary.converged,
        diverged: result.summary.diverged
      };

      pointIndex++;

      // Check time budget
      if (performance.now() - frameStart > FRAME_BUDGET_MS) {
        break;  // Yield to browser
      }
    }

    // Optional: Show progress every ~20%
    const progress = pointIndex / totalPoints;
    if (Math.floor(progress * 5) > Math.floor((pointIndex - 1) / totalPoints * 5)) {
      renderPartialBasin(basinData, pointIndex);
    }
  }

  // Cache and return
  basinCache.set(cacheKey, { key: cacheKey, data: basinData, timestamp: Date.now() });
  return basinData;
}
```

**Cancellation Pattern:**
- Increment `taskIdCounterRef.current` when params change
- Old computation checks flag every ~15ms (after one row)
- Bails out cleanly if stale
- No queue buildup - at most 1 computation running + 1 pending

**Time Budget:**
- 10ms per frame = ~60fps + headroom for React
- Typical: ~30-40 points computed per frame
- Total time: 50-80 frames × 16ms = 0.8-1.3 seconds wall time

## User Interaction

### Click Handling

```typescript
function handleBasinCanvasClick(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  basinData: BasinData,
  setInitialPoint: (point: [number, number]) => void
) {
  const rect = canvas.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  const { minW0, maxW0, minW1, maxW1 } = basinData.bounds;

  const w0 = minW0 + (canvasX / canvas.width) * (maxW0 - minW0);
  const w1 = maxW1 - (canvasY / canvas.height) * (maxW1 - minW1);  // Flip Y

  setInitialPoint([w0, w1]);  // Triggers trajectory recompute
}
```

### Crosshair Rendering

```typescript
function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  initialPoint: [number, number],
  bounds: { minW0, maxW0, minW1, maxW1 },
  canvasWidth: number,
  canvasHeight: number
) {
  const [w0, w1] = initialPoint;

  // Convert to canvas coordinates
  const x = ((w0 - bounds.minW0) / (bounds.maxW0 - bounds.minW0)) * canvasWidth;
  const y = ((bounds.maxW1 - w1) / (bounds.maxW1 - bounds.minW1)) * canvasHeight;

  // Dashed white crosshair
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  const size = 15;

  // Horizontal + vertical lines
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Center dot
  ctx.setLineDash([]);
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}
```

### Canvas Styling

- Size: 250×250px
- Cursor: `cursor-crosshair`
- Border: 1px gray
- Label above: "Click to change initial point"
- Label below (3D only): "Slice at bias = X.XX"

## Edge Cases & Error Handling

### Algorithm Failures

```typescript
function computeBasinPoint(...): BasinPoint {
  try {
    const result = runAlgorithm(...);
    return { /* normal result */ };
  } catch (error) {
    // Singular Hessian, numerical overflow, etc.
    console.warn('Algorithm failed at point', initialPoint, error);
    return {
      convergenceLoc: [NaN, NaN],
      iterations: 0,
      converged: false,
      diverged: true
    };
  }
}
```

### 3D Problems

For logistic regression and separating hyperplane (3D problems):
- Compute basin at fixed bias slice (current bias value or 0)
- Initial point from click becomes `[w0, w1, biasSlice]`
- Show slice label: "Slice at bias = X.XX" (match main canvas style)

### All Points Diverge

If all 2,500 points diverge (pathological problem/params):
- Render all dark (10% lightness)
- Show warning: "All starting points diverged"

### All Same Speed

If all converged points have same iteration count:
- Use middle lightness (55%)
- Disable lightness gradient in colorbar

### Empty Cache on Mount

First render before any computation completes:
- Show gray placeholder with "Computing basin..." text
- Or: Show empty canvas with just crosshair

## Implementation Phases

### Phase 1: Algorithm Interface (Foundation)
1. Update all 4 algorithm implementations to return `AlgorithmResult`
2. Maintain backward compatibility (existing viz code uses `iterations` array)
3. Test: Ensure existing trajectory visualization still works
4. Test: Verify convergence detection matches old heuristics

### Phase 2: Basin Computation (Core Logic)
1. Implement `BasinData` structures
2. Implement `computeBasinIncremental` with RAF time-budgeting
3. Implement cancellation via `taskIdRef`
4. Test: Benchmark confirms ~0.8s for 50×50 Rosenbrock
5. Test: Verify cancellation works (no queue buildup on rapid slider changes)

### Phase 3: Caching (Performance)
1. Implement `BasinCache` with LRU eviction
2. Implement cache key generation from problem/algorithm/params
3. Test: Switching tabs uses cached basins (instant render)
4. Test: Changing lambda invalidates cache (recomputes)

### Phase 4: Color Encoding (Visualization)
1. Implement clustering for multi-modal problems
2. Implement hue assignment (single vs multi-modal)
3. Implement lightness mapping (log scale)
4. Test: Single-minimum problems show one hue gradient
5. Test: Multi-modal problems show distinct colored regions

### Phase 5: UI Integration (User Facing)
1. Create `BasinPicker` component
2. Remove w₀/w₁ sliders from `AlgorithmConfiguration`
3. Implement click-to-set-initial-point
4. Implement crosshair rendering
5. Implement colorbar/legend
6. Test: Clicking basin updates trajectory
7. Test: Crosshair follows clicks

### Phase 6: Polish (Edge Cases)
1. Handle 3D problems with bias slice label
2. Handle all-diverged edge case
3. Handle algorithm failures (try-catch)
4. Add progress indicator (optional)
5. Test: 3D problems render correctly
6. Test: Pathological cases don't crash

## Testing Strategy

### Unit Tests
- `clusterConvergenceLocations`: Correctly identifies distinct minima
- `encodeBasinColors`: Maps iterations to lightness correctly
- `BasinCache`: LRU eviction works as expected
- Click coordinate conversion: Canvas → parameter space

### Integration Tests
- Basin computation completes without freezing UI
- Cancellation prevents queue buildup
- Cache hit/miss behavior correct
- Tab switching uses cached basins

### Manual Testing
- Drag problem sliders rapidly → UI stays responsive
- Switch algorithm tabs → instant render from cache
- Click basin → trajectory updates correctly
- 3D problems show correct slice label
- Multi-modal problems show distinct colored regions

### Benchmark Validation
- 50×50 Rosenbrock Newton completes in <1s
- Time-per-point stays under 0.5ms average
- Frame budget never exceeded (check with performance profiler)

## Future Enhancements (Out of Scope)

1. **Adaptive Resolution**: Start coarse (30×30), refine on idle (60×60)
2. **Web Workers**: Offload computation for even smoother UX
3. **Fractal Mode**: Ultra high-res (200×200) for boundary art
4. **Boundary-Focused Sampling**: Adaptive sampling at basin edges
5. **Animation**: Show basin "filling in" as computation progresses
6. **Export**: Save basin as image or data file
7. **Comparison Mode**: Side-by-side basins for different algorithms
8. **Pre-warming**: Compute inactive tab basins during idle time

## Open Questions

None - design approved.

## Success Metrics

- Basin computation completes in <1.5s for typical problems
- UI stays responsive (no "page not responsive" warnings)
- Cache hit rate >80% during typical exploration (switch tabs, adjust hyperparams)
- User feedback: "easier to understand convergence behavior"

## References

- Benchmark script: `scripts/benchmark-basin.ts`
- MIT OpenCourseWare: Basin of Attraction visualization guidelines
- Research: Hybrid Active Learning (HAL) for basin boundary detection (future)
- Low-discrepancy sequences (Sobol, Halton) for future adaptive sampling
