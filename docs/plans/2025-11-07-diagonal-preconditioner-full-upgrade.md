# Diagonal Preconditioner Tab - Full Upgrade to Production Standard

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the diagonal preconditioner tab to match the production quality of Newton and GD+LS tabs by replacing custom UI with shared components, adding full visualization, metrics, documentation, and experiment presets.

**Architecture:** Replace custom inline UI (lines 4646-4831 in UnifiedVisualizer.tsx) with the same component architecture used by Newton and GD+LS: AlgorithmConfiguration for settings, IterationPlayback for controls, IterationMetrics for data display, CollapsibleSection for documentation, and full canvas visualization for parameter space exploration.

**Tech Stack:** React, TypeScript, HTML Canvas, KaTeX (LaTeX math rendering)

---

## Phase 1: Component Integration Foundation

### Task 1: Add Diagonal Preconditioner Support to IterationMetrics Component

**Files:**
- Modify: `src/components/IterationMetrics.tsx:6`
- Modify: `src/components/IterationMetrics.tsx:49-73`

**Step 1: Update algorithm type to include diagonal-precond**

In `src/components/IterationMetrics.tsx`, line 6, change:

```typescript
algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
```

To:

```typescript
algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
```

**Step 2: Add diagonal preconditioner-specific props**

In `src/components/IterationMetrics.tsx`, after line 34 (after `hessian?: number[][];`), add:

```typescript
// Diagonal preconditioner data
hessianDiagonal?: number[];
preconditioner?: number[];
```

**Step 3: Update component destructuring**

In `src/components/IterationMetrics.tsx`, line 49-73, add to destructuring parameters:

```typescript
hessianDiagonal,
preconditioner,
```

**Step 4: Add diagonal preconditioner metrics display section**

In `src/components/IterationMetrics.tsx`, find where algorithm-specific data is displayed (around line 200+), and add a new section after the existing algorithm-specific sections:

```typescript
{/* Diagonal Preconditioner Specific Metrics */}
{algorithm === 'diagonal-precond' && hessianDiagonal && preconditioner && (
  <div className="space-y-3">
    <div className="border-t border-gray-200 pt-3">
      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
        Diagonal Preconditioner
      </h4>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Hessian Diagonal:</span>
          <div className="font-mono text-xs mt-1 bg-gray-50 p-2 rounded">
            [{hessianDiagonal.map(x => x.toFixed(4)).join(', ')}]
          </div>
        </div>

        <div>
          <span className="text-gray-600">Preconditioner D:</span>
          <div className="font-mono text-xs mt-1 bg-gray-50 p-2 rounded">
            [{preconditioner.map(x => x.toFixed(4)).join(', ')}]
          </div>
          <p className="text-xs text-gray-500 mt-1">
            D = diag(1/H₀₀, 1/H₁₁, ...) provides per-coordinate step sizes
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

**Step 5: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 6: Commit**

```bash
git add src/components/IterationMetrics.tsx
git commit -m "feat(diagonal-precond): add diagonal preconditioner support to IterationMetrics component"
```

---

### Task 2: Add Diagonal Preconditioner Support to AlgorithmConfiguration Component

**Files:**
- Modify: `src/components/AlgorithmConfiguration.tsx:7`
- Modify: `src/components/AlgorithmConfiguration.tsx:6-56`
- Modify: `src/components/AlgorithmConfiguration.tsx:58-467`

**Step 1: Update algorithm type to include diagonal-precond**

In `src/components/AlgorithmConfiguration.tsx`, line 7, change:

```typescript
algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
```

To:

```typescript
algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
```

**Step 2: Add diagonal preconditioner props to interface**

In `src/components/AlgorithmConfiguration.tsx`, after line 48 (after lbfgs parameters), add:

```typescript
diagPrecondUseLineSearch?: boolean;
onDiagPrecondUseLineSearchChange?: (val: boolean) => void;
diagPrecondC1?: number;
onDiagPrecondC1Change?: (val: number) => void;
diagPrecondEpsilon?: number;
onDiagPrecondEpsilonChange?: (val: number) => void;
diagPrecondTolerance?: number;
onDiagPrecondToleranceChange?: (val: number) => void;
```

**Step 3: Add diagonal preconditioner configuration section**

In `src/components/AlgorithmConfiguration.tsx`, after the lbfgs section (around line 397), before the Max Iterations section, add:

```typescript
{algorithm === 'diagonal-precond' && (
  <div className="col-span-2 space-y-4">
    {/* Use Line Search Toggle */}
    <div>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={props.diagPrecondUseLineSearch ?? false}
          onChange={(e) => props.onDiagPrecondUseLineSearchChange?.(e.target.checked)}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="text-sm font-medium text-gray-700">Use Armijo Line Search</span>
      </label>
      <p className="text-xs text-gray-500 mt-1 ml-7">
        Enable backtracking line search for robustness (vs. full step α=1)
      </p>
    </div>

    {/* Armijo c1 - shown when line search enabled */}
    {props.diagPrecondUseLineSearch && (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Armijo c<sub>1</sub>:
          </label>
          <input
            type="range"
            min="-5"
            max="-1"
            step="0.1"
            value={Math.log10(props.diagPrecondC1 ?? 1e-4)}
            onChange={(e) => {
              const val = Math.pow(10, parseFloat(e.target.value));
              props.onDiagPrecondC1Change?.(val);
            }}
            className="flex-1"
          />
          <div className="text-sm text-gray-600 w-16 text-right">
            {props.diagPrecondC1?.toExponential(1)}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Line search parameter (smaller = stricter decrease requirement)
        </p>
      </div>
    )}

    {/* Epsilon (numerical stability) */}
    <div>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Epsilon ε (stability):
        </label>
        <input
          type="range"
          min="-10"
          max="-6"
          step="0.5"
          value={Math.log10(props.diagPrecondEpsilon ?? 1e-8)}
          onChange={(e) => {
            const val = Math.pow(10, parseFloat(e.target.value));
            props.onDiagPrecondEpsilonChange?.(val);
          }}
          className="flex-1"
        />
        <div className="text-sm text-gray-600 w-16 text-right">
          {props.diagPrecondEpsilon?.toExponential(1)}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Prevents division by zero in preconditioner: D = diag(1/(H_ii + ε))
      </p>
    </div>

    {/* Gradient Tolerance */}
    <div>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Gradient Tolerance (gtol):
        </label>
        <input
          type="range"
          min="-12"
          max="-2"
          step="0.1"
          value={Math.log10(props.diagPrecondTolerance ?? 1e-6)}
          onChange={(e) => {
            const val = Math.pow(10, parseFloat(e.target.value));
            props.onDiagPrecondToleranceChange?.(val);
          }}
          className="flex-1"
        />
        <div className="text-sm text-gray-600 w-16 text-right">
          {props.diagPrecondTolerance?.toExponential(1)}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Convergence threshold for gradient norm
      </p>
    </div>
  </div>
)}
```

**Step 4: Update BasinPicker to support diagonal-precond**

In `src/components/AlgorithmConfiguration.tsx`, in the BasinPicker props (around line 422), update the algorithm check and parameters:

Find the line:
```typescript
algorithm={algorithm}
```

And update the algorithmParams object to include diagonal preconditioner parameters:

```typescript
algorithmParams={{
  maxIter: props.maxIter,
  // GD Fixed step size
  alpha: props.gdFixedAlpha,
  // Line search c1 parameter (algorithm-specific)
  c1: algorithm === 'gd-linesearch'
    ? props.gdLSC1
    : algorithm === 'newton'
    ? props.newtonC1
    : algorithm === 'lbfgs'
    ? props.lbfgsC1
    : algorithm === 'diagonal-precond'
    ? props.diagPrecondC1
    : undefined,
  // Diagonal preconditioner specific
  useLineSearch: algorithm === 'diagonal-precond' ? props.diagPrecondUseLineSearch : undefined,
  epsilon: algorithm === 'diagonal-precond' ? props.diagPrecondEpsilon : undefined,
  // L-BFGS memory parameter
  m: props.lbfgsM,
  // Hessian damping (algorithm-specific)
  hessianDamping: algorithm === 'newton'
    ? props.newtonHessianDamping
    : algorithm === 'lbfgs'
    ? props.lbfgsHessianDamping
    : undefined,
  // Newton line search method
  lineSearch: props.newtonLineSearch,
  // Tolerance (algorithm-specific)
  tolerance: algorithm === 'gd-fixed'
    ? props.gdFixedTolerance
    : algorithm === 'gd-linesearch'
    ? props.gdLSTolerance
    : algorithm === 'newton'
    ? props.newtonTolerance
    : algorithm === 'diagonal-precond'
    ? props.diagPrecondTolerance
    : props.lbfgsTolerance,
  // 3D problem bias slice
  biasSlice: props.biasSlice
}}
```

**Step 5: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 6: Commit**

```bash
git add src/components/AlgorithmConfiguration.tsx
git commit -m "feat(diagonal-precond): add diagonal preconditioner support to AlgorithmConfiguration component"
```

---

### Task 3: Fix Unused Summary State and Wire Summary Display

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:118`

**Step 1: Fix the unused summary state variable**

In `src/UnifiedVisualizer.tsx`, line 118, change:

```typescript
const [, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
```

To:

```typescript
const [diagPrecondSummary, setDiagPrecondSummary] = useState<AlgorithmSummary | null>(null);
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "fix(diagonal-precond): enable summary state for convergence tracking"
```

---

## Phase 2: Canvas Visualization Infrastructure

### Task 4: Add Canvas Refs for Diagonal Preconditioner

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (after line 139, in the refs section)

**Step 1: Add canvas refs**

In `src/UnifiedVisualizer.tsx`, find where other algorithm canvas refs are declared (look for `newtonParamCanvasRef`, `gdLSParamCanvasRef`, etc.). After those declarations, add:

```typescript
// Diagonal Preconditioner refs
const diagPrecondParamCanvasRef = useRef<HTMLCanvasElement>(null);
const diagPrecondLineSearchCanvasRef = useRef<HTMLCanvasElement>(null);
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): add canvas refs for visualization"
```

---

### Task 5: Add Canvas Drawing Effect for Parameter Space

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add useEffect after other canvas drawing effects)

**Step 1: Find where canvas drawing effects are located**

Search for `useEffect` blocks that draw to canvas (look for patterns like `drawHeatmap`, `drawContours` for Newton or GD+LS canvases).

**Step 2: Add diagonal preconditioner parameter space canvas drawing effect**

After the existing canvas drawing effects, add:

```typescript
// Diagonal Preconditioner: Draw parameter space visualization
useEffect(() => {
  const canvas = diagPrecondParamCanvasRef.current;
  if (!canvas || diagPrecondIterations.length === 0) return;

  const problem = getCurrentProblem();
  const { ctx, width, height } = setupCanvas(canvas);

  // Define parameter space bounds
  const bounds = {
    minW0: visualizationBounds.w0[0],
    maxW0: visualizationBounds.w0[1],
    minW1: visualizationBounds.w1[0],
    maxW1: visualizationBounds.w1[1],
  };

  // Draw loss landscape
  drawHeatmap(
    ctx,
    width,
    height,
    bounds,
    (w0, w1) => {
      const w = problem.dimensionality === 3
        ? [w0, w1, logisticGlobalMin?.[2] ?? 0]
        : [w0, w1];
      return problem.objective(w);
    }
  );

  // Draw contour lines
  drawContours(
    ctx,
    width,
    height,
    bounds,
    (w0, w1) => {
      const w = problem.dimensionality === 3
        ? [w0, w1, logisticGlobalMin?.[2] ?? 0]
        : [w0, w1];
      return problem.objective(w);
    }
  );

  // Draw axes
  drawAxes(ctx, width, height, bounds);

  // Draw global minimum marker (if not logistic regression)
  if (currentProblem !== 'logistic-regression') {
    const problemDef = getProblem(currentProblem);
    if (problemDef) {
      drawOptimumMarkers(ctx, width, height, bounds, problemDef);
    }
  }

  // Draw optimization trajectory
  const trajectory = diagPrecondIterations
    .slice(0, diagPrecondCurrentIter + 1)
    .map((iter) => iter.wNew);

  if (trajectory.length > 0) {
    ctx.strokeStyle = 'rgba(255, 140, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    trajectory.forEach((w, idx) => {
      const w0 = w[0];
      const w1 = w[1];
      const x = ((w0 - bounds.minW0) / (bounds.maxW0 - bounds.minW0)) * width;
      const y = height - ((w1 - bounds.minW1) / (bounds.maxW1 - bounds.minW1)) * height;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points along trajectory
    trajectory.forEach((w, idx) => {
      const w0 = w[0];
      const w1 = w[1];
      const x = ((w0 - bounds.minW0) / (bounds.maxW0 - bounds.minW0)) * width;
      const y = height - ((w1 - bounds.minW1) / (bounds.maxW1 - bounds.minW1)) * height;

      ctx.fillStyle = idx === diagPrecondCurrentIter ? 'red' : 'rgba(255, 140, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, idx === diagPrecondCurrentIter ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}, [
  diagPrecondIterations,
  diagPrecondCurrentIter,
  currentProblem,
  visualizationBounds,
  logisticGlobalMin,
  rotationAngle,
  conditionNumber,
  rosenbrockB,
  separatingHyperplaneVariant,
]);
```

**Step 3: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): add parameter space canvas drawing"
```

---

### Task 6: Add Line Search Canvas Drawing Effect

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add useEffect after parameter space effect)

**Step 1: Add line search canvas drawing effect**

After the parameter space canvas effect, add:

```typescript
// Diagonal Preconditioner: Draw line search visualization
useEffect(() => {
  const canvas = diagPrecondLineSearchCanvasRef.current;
  if (!canvas || !diagPrecondUseLineSearch || diagPrecondIterations.length === 0) return;

  const currentIter = diagPrecondIterations[diagPrecondCurrentIter];
  if (!currentIter || !currentIter.lineSearchTrials) return;

  const { ctx, width, height } = setupCanvas(canvas);

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw axes
  const padding = 40;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw line search curve if available
  if (currentIter.lineSearchTrials && currentIter.lineSearchTrials.length > 0) {
    const trials = currentIter.lineSearchTrials;
    const maxAlpha = Math.max(...trials.map((t) => t.alpha));
    const losses = trials.map((t) => t.loss);
    const maxLoss = Math.max(...losses);
    const minLoss = Math.min(...losses);

    // Draw loss curve
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();

    trials.forEach((trial, idx) => {
      const x = padding + (trial.alpha / maxAlpha) * plotWidth;
      const y =
        height -
        padding -
        ((trial.loss - minLoss) / (maxLoss - minLoss)) * plotHeight;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Mark accepted alpha
    if (currentIter.alpha !== undefined) {
      const acceptedTrial = trials.find((t) => t.alpha === currentIter.alpha);
      if (acceptedTrial) {
        const x = padding + (acceptedTrial.alpha / maxAlpha) * plotWidth;
        const y =
          height -
          padding -
          ((acceptedTrial.loss - minLoss) / (maxLoss - minLoss)) * plotHeight;

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Draw axis labels
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';
  ctx.fillText('α', width - padding + 5, height - padding + 5);
  ctx.fillText('Loss', padding - 30, padding - 10);
}, [diagPrecondIterations, diagPrecondCurrentIter, diagPrecondUseLineSearch]);
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): add line search canvas visualization"
```

---

## Phase 3: Replace Custom UI with Shared Components

### Task 7: Add runDiagPrecond Function Reference

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (find the runDiagPrecond function definition)

**Step 1: Verify runDiagPrecond function exists and note its location**

Search for `const runDiagPrecond` or `function runDiagPrecond` in `src/UnifiedVisualizer.tsx`.

Expected: Function should exist, likely around line 720 or in the algorithm running section.

If it doesn't exist, we'll need to create it in the next task. For now, just note its location.

**Step 2: Ensure it sets the summary**

Verify the function calls `setDiagPrecondSummary(result.summary)` where `result` is the return value from `runDiagonalPreconditioner`.

If it doesn't set the summary, add this line:

```typescript
setDiagPrecondSummary(result.summary);
```

Right after:

```typescript
setDiagPrecondIterations(result.iterations);
```

**Step 3: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "fix(diagonal-precond): ensure summary is set when algorithm runs"
```

---

### Task 8: Replace Custom UI Section - Part 1 (Configuration)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:4646-4831` (replace entire diagonal-precond section)

**Step 1: Delete old custom configuration UI**

In `src/UnifiedVisualizer.tsx`, find the diagonal preconditioner tab content (starts around line 4646 with `} : selectedTab === 'diagonal-precond' ? (`).

Delete lines 4648-4742 (the old configuration section from "Algorithm Configuration" to the "Run Diagonal Preconditioner" button and everything inside).

**Step 2: Add AlgorithmConfiguration component**

Replace the deleted section with:

```typescript
<>
  {/* 1. Configuration Section */}
  <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
    <AlgorithmConfiguration
      algorithm="diagonal-precond"
      maxIter={maxIter}
      onMaxIterChange={setMaxIter}
      initialW0={initialW0}
      onInitialW0Change={setInitialW0}
      initialW1={initialW1}
      onInitialW1Change={setInitialW1}
      diagPrecondUseLineSearch={diagPrecondUseLineSearch}
      onDiagPrecondUseLineSearchChange={setDiagPrecondUseLineSearch}
      diagPrecondC1={diagPrecondC1}
      onDiagPrecondC1Change={setDiagPrecondC1}
      diagPrecondEpsilon={diagPrecondEpsilon}
      onDiagPrecondEpsilonChange={setDiagPrecondEpsilon}
      diagPrecondTolerance={diagPrecondTolerance}
      onDiagPrecondToleranceChange={setDiagPrecondTolerance}
      problemFuncs={problemFuncs}
      problem={problem}
      currentProblem={currentProblem}
      bounds={bounds}
      biasSlice={biasSlice}
    />
  </CollapsibleSection>
```

**Step 3: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Verify UI displays in browser**

Run: `npm run dev`
Navigate to the diagonal preconditioner tab
Expected: Configuration section appears with proper controls

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): replace custom config UI with AlgorithmConfiguration component"
```

---

### Task 9: Replace Custom UI Section - Part 2 (Playback Controls)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:4744-4828` (replace iteration controls)

**Step 1: Delete old custom iteration controls**

In `src/UnifiedVisualizer.tsx`, find and delete the old iteration metrics and controls section (lines 4744-4828, from "Iteration Metrics" heading through the Previous/Next/Last buttons).

**Step 2: Add IterationPlayback component**

After the AlgorithmConfiguration section, add:

```typescript
  {/* 2. Playback Section */}
  {diagPrecondIterations.length > 0 && (
    <IterationPlayback
      currentIter={diagPrecondCurrentIter}
      totalIters={diagPrecondIterations.length}
      onIterChange={setDiagPrecondCurrentIter}
      onReset={() => setDiagPrecondCurrentIter(0)}
    />
  )}
```

**Step 3: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): replace custom iteration controls with IterationPlayback component"
```

---

### Task 10: Replace Custom UI Section - Part 3 (Canvas and Metrics Display)

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add side-by-side layout after playback)

**Step 1: Add side-by-side canvas and metrics layout**

After the IterationPlayback component, add:

```typescript
  {/* 3. Side-by-Side: Canvas + Metrics */}
  <div className="flex gap-4 mb-6">
    {/* Left: Parameter Space Visualization */}
    <div className="flex-1 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
      <p className="text-sm text-gray-600 mb-3">
        Loss landscape. Orange path = trajectory. Red dot = current position.
      </p>

      {/* 2D slice notation for 3D problems */}
      {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && logisticGlobalMin && logisticGlobalMin.length >= 3 && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
          <span className="font-medium">2D slice:</span> w₂ = {(logisticGlobalMin[2] ?? 0).toFixed(3)} (bias from optimal solution)
        </div>
      )}

      <canvas ref={diagPrecondParamCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

      {/* Legend for optimum markers */}
      {currentProblem !== 'logistic-regression' && (
        <div className="mt-3 flex gap-4 text-sm text-gray-700">
          {(() => {
            const problemDef = getProblem(currentProblem);
            if (!problemDef) return null;
            return (
              <>
                {problemDef.globalMinimum && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">★</span>
                    <span>Global minimum</span>
                  </div>
                )}
                {problemDef.criticalPoint && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☆</span>
                    <span>Critical point (saddle)</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>

    {/* Right: Metrics Column */}
    {diagPrecondIterations.length > 0 && diagPrecondIterations[diagPrecondCurrentIter] && (
      <div className="w-80 bg-white rounded-lg shadow-md p-4">
        <IterationMetrics
          algorithm="diagonal-precond"
          iterNum={diagPrecondCurrentIter}
          totalIters={diagPrecondIterations.length}
          loss={diagPrecondIterations[diagPrecondCurrentIter].newLoss}
          gradNorm={diagPrecondIterations[diagPrecondCurrentIter].gradNorm}
          weights={diagPrecondIterations[diagPrecondCurrentIter].wNew}
          alpha={diagPrecondIterations[diagPrecondCurrentIter].alpha ?? 1.0}
          gradient={diagPrecondIterations[diagPrecondCurrentIter].grad}
          direction={diagPrecondIterations[diagPrecondCurrentIter].direction}
          gradNormHistory={diagPrecondIterations.map(iter => iter.gradNorm)}
          lossHistory={diagPrecondIterations.map(iter => iter.newLoss)}
          alphaHistory={diagPrecondIterations.map(iter => iter.alpha ?? 1.0)}
          weightsHistory={diagPrecondIterations.map(iter => iter.wNew)}
          hessianDiagonal={diagPrecondIterations[diagPrecondCurrentIter].hessianDiagonal}
          preconditioner={diagPrecondIterations[diagPrecondCurrentIter].preconditioner}
          lineSearchTrials={diagPrecondIterations[diagPrecondCurrentIter].lineSearchTrials?.length}
          lineSearchCanvasRef={diagPrecondUseLineSearch ? diagPrecondLineSearchCanvasRef : undefined}
          tolerance={diagPrecondTolerance}
          ftol={1e-9}
          xtol={1e-9}
          summary={diagPrecondSummary}
          onIterationChange={setDiagPrecondCurrentIter}
        />
      </div>
    )}
  </div>
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Verify full layout in browser**

Run: `npm run dev`
Navigate to the diagonal preconditioner tab, run the algorithm
Expected: Side-by-side canvas and metrics display correctly

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "feat(diagonal-precond): add canvas visualization and metrics with side-by-side layout"
```

---

## Phase 4: Documentation and Educational Content

### Task 11: Add Quick Start Section

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add after canvas/metrics section)

**Step 1: Add Quick Start CollapsibleSection**

After the side-by-side canvas/metrics div, add:

```typescript
  {/* Quick Start */}
  <CollapsibleSection
    title="Quick Start"
    defaultExpanded={true}
    storageKey="diagonal-precond-quick-start"
  >
    <div className="space-y-4 text-gray-800">
      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Idea</h3>
        <p>
          Instead of using one step size for all directions (gradient descent) or computing
          the full inverse Hessian (Newton), use just the <strong>diagonal</strong> of the
          Hessian to get per-coordinate step sizes.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">The Algorithm</h3>
        <ol className="list-decimal ml-6 space-y-1">
          <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
          <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of second derivatives)</li>
          <li>Extract diagonal: <InlineMath>{'d_i = H_{ii}'}</InlineMath> for each coordinate</li>
          <li>
            Build diagonal preconditioner:{' '}
            <InlineMath>{'D = \\text{diag}(1/(H_{00}+\\varepsilon), 1/(H_{11}+\\varepsilon), ...)'}</InlineMath>
          </li>
          <li>Compute preconditioned direction: <InlineMath>{'p = -D \\cdot \\nabla f'}</InlineMath></li>
          <li>Take step: <InlineMath>{'w \\leftarrow w + \\alpha p'}</InlineMath> (α=1 or from line search)</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">Key Formula</h3>
        <p>Update rule with diagonal preconditioning:</p>
        <BlockMath>{'w_{\\text{new}} = w_{\\text{old}} - D \\cdot \\nabla f(w_{\\text{old}})'}</BlockMath>
        <p className="text-sm mt-2">
          Where <InlineMath>{'D = \\text{diag}(1/H_{00}, 1/H_{11}, ...)'}</InlineMath> gives different
          step sizes per coordinate based on local curvature.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">When It Works (And When It Doesn't)</h3>
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="font-semibold text-green-900">✓ Perfect on axis-aligned problems</p>
            <p className="text-sm text-gray-700">
              When the Hessian is diagonal (e.g., <InlineMath>{'f(x,y) = x^2 + 100y^2'}</InlineMath>),
              our diagonal preconditioner <InlineMath>{'D = H^{-1}'}</InlineMath> exactly! Converges in
              1-2 iterations like Newton's method.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="font-semibold text-red-900">✗ Struggles on rotated problems</p>
            <p className="text-sm text-gray-700">
              When Hessian has large off-diagonal terms (e.g., rotated ellipse), diagonal
              approximation misses critical coupling between coordinates. Takes many iterations
              and zig-zags like gradient descent.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">Computational Cost</h3>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Per iteration:</strong> O(n²) to compute Hessian, O(n) for diagonal extraction</li>
          <li><strong>Memory:</strong> O(n²) for Hessian, O(n) for diagonal</li>
          <li><strong>Cheaper than Newton:</strong> No matrix inversion (O(n³)), just element-wise division</li>
          <li><strong>More expensive than GD:</strong> Requires Hessian computation</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">Parameters</h3>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            <strong>Epsilon (ε):</strong> Numerical stability term prevents division by zero.
            Default 10⁻⁸ works well. Increase if you see instability.
          </li>
          <li>
            <strong>Line Search:</strong> Optional Armijo backtracking. Use for robustness on
            non-quadratic problems. Disable (α=1) for pure diagonal Newton step on quadratics.
          </li>
        </ul>
      </div>

      <div className="bg-blue-100 rounded p-3">
        <p className="font-bold text-sm">Key Insight:</p>
        <p className="text-sm">
          Diagonal preconditioning is the simplest second-order method. It captures
          per-coordinate curvature but ignores coupling. Think of it as "Newton's method
          if the world were axis-aligned."
        </p>
      </div>
    </div>
  </CollapsibleSection>
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Verify in browser**

Run: `npm run dev`
Navigate to diagonal preconditioner tab
Expected: Quick Start section displays with proper LaTeX rendering

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "docs(diagonal-precond): add Quick Start educational section"
```

---

### Task 12: Add "Why Diagonal Fails on Rotation" Section

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (add after Quick Start)

**Step 1: Add rotation explanation section**

After the Quick Start section, add:

```typescript
  {/* Why Diagonal Fails on Rotation */}
  <CollapsibleSection
    title="Why Diagonal Preconditioner Fails on Rotated Problems"
    defaultExpanded={true}
    storageKey="diagonal-precond-rotation-failure"
  >
    <div className="space-y-4 text-gray-800">
      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">The Problem: Off-Diagonal Terms</h3>
        <p>
          A diagonal preconditioner only uses the main diagonal of the Hessian matrix and
          completely ignores the off-diagonal terms. This works when the Hessian is diagonal
          (or nearly diagonal), but fails when coordinates are coupled.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">Example: Axis-Aligned vs Rotated</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-green-300 rounded p-3 bg-green-50">
            <p className="font-semibold text-green-900 mb-2">✓ Axis-Aligned (Perfect)</p>
            <p className="text-sm mb-2">Function: <InlineMath>{'f(x,y) = x^2 + 100y^2'}</InlineMath></p>
            <p className="text-sm mb-2">Hessian:</p>
            <BlockMath>{'H = \\begin{bmatrix} 2 & 0 \\\\ 0 & 200 \\end{bmatrix}'}</BlockMath>
            <p className="text-sm mt-2">
              Diagonal preconditioner: <InlineMath>{'D = \\text{diag}(1/2, 1/200)'}</InlineMath>
            </p>
            <p className="text-sm mt-2 font-semibold">
              Result: <InlineMath>{'D = H^{-1}'}</InlineMath> exactly! Converges immediately.
            </p>
          </div>

          <div className="border border-red-300 rounded p-3 bg-red-50">
            <p className="font-semibold text-red-900 mb-2">✗ Rotated 45° (Fails)</p>
            <p className="text-sm mb-2">Function: <InlineMath>{'f(u,v) = u^2 + 100v^2'}</InlineMath></p>
            <p className="text-sm mb-2">In (x,y) coordinates after rotation:</p>
            <BlockMath>{'H = \\begin{bmatrix} 51 & 49 \\\\ 49 & 51 \\end{bmatrix}'}</BlockMath>
            <p className="text-sm mt-2">
              Diagonal preconditioner: <InlineMath>{'D \\approx \\text{diag}(1/51, 1/51)'}</InlineMath>
            </p>
            <p className="text-sm mt-2 font-semibold text-red-900">
              Result: Ignores off-diagonal 49! Wrong scaling, many iterations.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-100 rounded p-4">
        <h3 className="text-lg font-bold text-amber-900 mb-2">The Mathematical Issue</h3>
        <p className="mb-2">
          The inverse of a matrix is NOT just the inverse of its diagonal:
        </p>
        <BlockMath>
          {'H^{-1} \\neq \\text{diag}(1/H_{00}, 1/H_{11}, ...)'}
        </BlockMath>
        <p className="text-sm mt-2">
          When H has large off-diagonal terms, computing only the diagonal gives a poor
          approximation to <InlineMath>{'H^{-1}'}</InlineMath>.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-teal-800 mb-2">What Newton's Method Does Better</h3>
        <p className="mb-2">
          Newton's method computes the full matrix inverse <InlineMath>{'H^{-1}'}</InlineMath>,
          which properly handles:
        </p>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>Coupling between coordinates (off-diagonal terms)</li>
          <li>Rotation of the coordinate system</li>
          <li>Both scaling AND rotation of the step direction</li>
        </ul>
        <p className="text-sm mt-3">
          <strong>Cost tradeoff:</strong> Newton needs O(n³) for matrix inversion vs O(n²) for
          Hessian computation + O(n) for diagonal extraction in diagonal preconditioning.
        </p>
      </div>

      <div className="bg-teal-100 rounded p-3">
        <p className="font-bold text-sm mb-2">Key Takeaway:</p>
        <p className="text-sm">
          Use diagonal preconditioning when you know the problem is axis-aligned or when you
          need something cheaper than Newton but better than gradient descent. Use Newton's
          method when you need rotation invariance and can afford the O(n³) cost.
        </p>
      </div>
    </div>
  </CollapsibleSection>
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "docs(diagonal-precond): add rotation failure explanation section"
```

---

### Task 13: Wire Up Experiment Presets

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (find and update experiments section)
- Reference: `src/experiments/diagonal-precond-presets.ts` (already exists)

**Step 1: Find the experiment loading logic**

Search for where experiments are loaded for other algorithms (look for `getExperimentsForAlgorithm` or `loadExperiment` function).

**Step 2: Verify diagonal preconditioner experiments are registered**

Check `src/experiments/index.ts` to ensure diagonal preconditioner experiments are exported.

If not present, add to `src/experiments/index.ts`:

```typescript
export { diagonalPrecondExperiments } from './diagonal-precond-presets';
```

And in the `getExperimentsForAlgorithm` function, add the diagonal-precond case:

```typescript
case 'diagonal-precond':
  return diagonalPrecondExperiments;
```

**Step 3: Add "Try This" experiments section**

After the rotation failure section, add:

```typescript
  {/* Try This */}
  <CollapsibleSection
    title="Try This"
    defaultExpanded={true}
    storageKey="diagonal-precond-try-this"
  >
    <div className="space-y-3">
      <p className="text-gray-800 mb-4">
        Run these experiments to see when diagonal preconditioning excels and when it struggles:
      </p>

      <div className="space-y-3">
        {/* Success: Axis-Aligned */}
        <div className="border border-green-200 rounded p-3 bg-green-50">
          <div className="flex items-start gap-2">
            <button
              className={`text-green-600 font-bold text-lg hover:text-green-700 disabled:opacity-50 ${
                experimentLoading ? 'cursor-wait' : 'cursor-pointer'
              }`}
              onClick={() => {
                const experiments = getExperimentsForAlgorithm('diagonal-precond');
                const exp = experiments.find(e => e.id === 'diag-precond-aligned-success');
                if (exp) loadExperiment(exp);
              }}
              disabled={experimentLoading}
              aria-label="Load experiment: Success - Aligned with Axes"
            >
              {experimentLoading ? <LoadingSpinner /> : '▶'}
            </button>
            <div>
              <p className="font-semibold text-green-900">Success: Aligned with Axes</p>
              <p className="text-sm text-gray-700">
                Ill-conditioned quadratic aligned with axes - diagonal preconditioner is perfect!
              </p>
              <p className="text-xs text-gray-600 mt-1 italic">
                Observe: Converges in 1-2 iterations! D perfectly inverts diagonal Hessian
              </p>
            </div>
          </div>
        </div>

        {/* Failure: Rotated */}
        <div className="border border-red-200 rounded p-3 bg-red-50">
          <div className="flex items-start gap-2">
            <button
              className={`text-red-600 font-bold text-lg hover:text-red-700 disabled:opacity-50 ${
                experimentLoading ? 'cursor-wait' : 'cursor-pointer'
              }`}
              onClick={() => {
                const experiments = getExperimentsForAlgorithm('diagonal-precond');
                const exp = experiments.find(e => e.id === 'diag-precond-rotated-failure');
                if (exp) loadExperiment(exp);
              }}
              disabled={experimentLoading}
              aria-label="Load experiment: Failure - Rotated Problem"
            >
              {experimentLoading ? <LoadingSpinner /> : '▶'}
            </button>
            <div>
              <p className="font-semibold text-red-900">Failure: Rotated Problem</p>
              <p className="text-sm text-gray-700">
                Same problem rotated 45° - diagonal preconditioner struggles!
              </p>
              <p className="text-xs text-gray-600 mt-1 italic">
                Observe: Takes 40+ iterations! Off-diagonal Hessian terms ignored
              </p>
            </div>
          </div>
        </div>

        {/* Compare: Diagonal vs GD+LS */}
        <div className="border border-blue-200 rounded p-3 bg-blue-50">
          <div className="flex items-start gap-2">
            <button
              className={`text-blue-600 font-bold text-lg hover:text-blue-700 disabled:opacity-50 ${
                experimentLoading ? 'cursor-wait' : 'cursor-pointer'
              }`}
              onClick={() => {
                const experiments = getExperimentsForAlgorithm('diagonal-precond');
                const exp = experiments.find(e => e.id === 'diag-precond-compare-gd');
                if (exp) loadExperiment(exp);
              }}
              disabled={experimentLoading}
              aria-label="Load experiment: Compare - Diagonal vs GD+LS"
            >
              {experimentLoading ? <LoadingSpinner /> : '▶'}
            </button>
            <div>
              <p className="font-semibold text-blue-900">Compare: Diagonal vs GD+LS</p>
              <p className="text-sm text-gray-700">
                Side-by-side: Diagonal vastly outperforms gradient descent when aligned
              </p>
              <p className="text-xs text-gray-600 mt-1 italic">
                Observe: Diagonal (2 iters) vs GD+LS (30+ iters) on axis-aligned problem
              </p>
            </div>
          </div>
        </div>

        {/* Compare: Diagonal vs Newton */}
        <div className="border border-purple-200 rounded p-3 bg-purple-50">
          <div className="flex items-start gap-2">
            <button
              className={`text-purple-600 font-bold text-lg hover:text-purple-700 disabled:opacity-50 ${
                experimentLoading ? 'cursor-wait' : 'cursor-pointer'
              }`}
              onClick={() => {
                const experiments = getExperimentsForAlgorithm('diagonal-precond');
                const exp = experiments.find(e => e.id === 'diag-precond-compare-newton');
                if (exp) loadExperiment(exp);
              }}
              disabled={experimentLoading}
              aria-label="Load experiment: The Rotation Invariance Story"
            >
              {experimentLoading ? <LoadingSpinner /> : '▶'}
            </button>
            <div>
              <p className="font-semibold text-purple-900">The Rotation Invariance Story</p>
              <p className="text-sm text-gray-700">
                Side-by-side: Diagonal struggles, Newton excels on rotated problem
              </p>
              <p className="text-xs text-gray-600 mt-1 italic">
                Observe: Diagonal (40 iters) vs Newton (2 iters) - full matrix is rotation-invariant!
              </p>
            </div>
          </div>
        </div>

        {/* Demo: Circular Bowl */}
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex items-start gap-2">
            <button
              className={`text-gray-600 font-bold text-lg hover:text-gray-700 disabled:opacity-50 ${
                experimentLoading ? 'cursor-wait' : 'cursor-pointer'
              }`}
              onClick={() => {
                const experiments = getExperimentsForAlgorithm('diagonal-precond');
                const exp = experiments.find(e => e.id === 'diag-precond-circular');
                if (exp) loadExperiment(exp);
              }}
              disabled={experimentLoading}
              aria-label="Load experiment: Circular Bowl Demo"
            >
              {experimentLoading ? <LoadingSpinner /> : '▶'}
            </button>
            <div>
              <p className="font-semibold text-gray-900">Demo: Circular Bowl (No Rotation Dependence)</p>
              <p className="text-sm text-gray-700">
                Circular problem (κ=1) has no preferred direction
              </p>
              <p className="text-xs text-gray-600 mt-1 italic">
                Observe: Even diagonal works well - all methods converge similarly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CollapsibleSection>
```

**Step 4: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Test experiment buttons work**

Run: `npm run dev`
Navigate to diagonal preconditioner tab
Click an experiment button
Expected: Experiment loads and runs successfully

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx src/experiments/index.ts
git commit -m "feat(diagonal-precond): add Try This experiments section with presets"
```

---

### Task 14: Close the Diagonal Preconditioner Section

**Files:**
- Modify: `src/UnifiedVisualizer.tsx` (ensure proper closing tags)

**Step 1: Verify proper section closure**

Make sure the diagonal preconditioner section (starting with the `selectedTab === 'diagonal-precond'` conditional) has proper closing:

```typescript
        </>
      ) : selectedTab === 'diagonal-precond' ? (
        <>
          {/* All the sections we added */}
        </>
      ) : null}
```

**Step 2: Remove any remaining old custom UI code**

Search for any remaining fragments of the old diagonal preconditioner custom UI (look for lines 4646-4831 area) and ensure they're all replaced with the new component-based structure.

**Step 3: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Full smoke test**

Run: `npm run dev`

Test each section:
1. Configuration loads properly
2. Basin picker works
3. Algorithm runs without errors
4. Canvas displays correctly
5. Metrics show data
6. Playback controls work
7. Documentation sections display
8. Experiment buttons work

**Step 5: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor(diagonal-precond): complete UI upgrade, remove all custom code"
```

---

## Phase 5: Advanced Enhancements (Optional)

### Task 15: Add Enhanced Termination Criteria to Algorithm

**Files:**
- Modify: `src/algorithms/diagonal-preconditioner.ts:38-56`
- Modify: `src/algorithms/diagonal-preconditioner.ts:140-178`

**Step 1: Add termination parameters to options interface**

In `src/algorithms/diagonal-preconditioner.ts`, line 38-56, update the options parameter to include termination criteria:

```typescript
export const runDiagonalPreconditioner = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    useLineSearch?: boolean;
    c1?: number;
    lambda?: number;
    epsilon?: number;
    termination?: {
      gtol?: number;
      ftol?: number;
      xtol?: number;
    };
  }
): AlgorithmResult<DiagonalPrecondIteration> => {
  const {
    maxIter,
    initialPoint,
    tolerance = 1e-6,
    useLineSearch = false,
    c1 = 0.0001,
    lambda = 0,
    epsilon = 1e-8,
    termination
  } = options;

  // Extract termination thresholds (backward compatible with tolerance parameter)
  const gtol = termination?.gtol ?? tolerance;
  const ftol = termination?.ftol ?? 1e-9;
  const xtol = termination?.xtol ?? 1e-9;
```

**Step 2: Add termination tracking variables**

After the options destructuring, add:

```typescript
  const iterations: DiagonalPrecondIteration[] = [];
  let previousLoss: number | null = null;
  let previousW: number[] | null = null;
  let terminationReason: ConvergenceCriterion | null = null;
```

**Step 3: Update main loop with termination checks**

In the main iteration loop (around line 67-139), after computing `gradNorm`, add:

```typescript
    // Check gradient norm convergence
    if (gradNorm < gtol) {
      terminationReason = 'gradient';
      // Will store iteration at end of loop
    }

    // Check function value stalling (scipy-style: relative tolerance)
    if (previousLoss !== null && ftol > 0) {
      const funcChange = Math.abs(loss - previousLoss);
      const relativeFuncChange = funcChange / Math.max(Math.abs(loss), 1e-8);
      if (relativeFuncChange < ftol && terminationReason === null) {
        terminationReason = 'ftol';
      }
    }
```

And after computing `wNew`, add:

```typescript
    // Check step size stalling (scipy-style: average absolute step per dimension)
    if (xtol > 0) {
      const step = sub(wNew, w);
      const stepSize = norm(step);
      const dimension = w.length;
      // Use RMS step size per dimension
      const avgStepSize = stepSize / Math.sqrt(dimension);
      if (avgStepSize < xtol && terminationReason === null) {
        terminationReason = 'xtol';
      }
    }
```

**Step 4: Update iteration storage and loop control**

After the iteration push, add:

```typescript
    // Update for next iteration
    previousLoss = loss;
    previousW = [...w];
    w = wNew;

    // Early stopping if any termination criterion met
    if (terminationReason !== null) {
      break;
    }
```

**Step 5: Update summary computation**

Replace the existing summary computation (lines 140-178) with:

```typescript
  // If loop completed without early termination
  if (terminationReason === null) {
    terminationReason = 'maxiter';
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  // Compute final step size and function change
  const absoluteStepSize = previousW ? norm(sub(finalLocation, previousW)) : undefined;
  const absoluteFuncChange = previousLoss !== null ? Math.abs(finalLoss - previousLoss) : undefined;

  // Compute relative values (for scipy-style tolerance checking)
  const finalStepSize = absoluteStepSize !== undefined
    ? absoluteStepSize / Math.max(norm(finalLocation), 1.0)
    : undefined;
  const finalFunctionChange = absoluteFuncChange !== undefined
    ? absoluteFuncChange / Math.max(Math.abs(finalLoss), 1e-8)
    : undefined;

  // Determine convergence flags
  const converged = ['gradient', 'ftol', 'xtol'].includes(terminationReason);
  const diverged = terminationReason === 'diverged';
  const stalled = ['ftol', 'xtol'].includes(terminationReason);

  // Generate human-readable termination message
  const terminationMessage = getTerminationMessage(terminationReason, {
    gradNorm: finalGradNorm,
    gtol,
    stepSize: finalStepSize,
    xtol,
    funcChange: finalFunctionChange,
    ftol,
    iters: iterations.length,
    maxIter
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled,
    finalLocation,
    finalLoss,
    finalGradNorm,
    finalStepSize,
    finalFunctionChange,
    iterationCount: iterations.length,
    convergenceCriterion: terminationReason,
    terminationMessage
  };

  return { iterations, summary };
```

**Step 6: Add missing imports**

At the top of the file, ensure you have:

```typescript
import { norm, scale, add, sub } from '../shared-utils';
```

**Step 7: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 8: Test enhanced termination**

Run: `npm run dev`
Run diagonal preconditioner on different problems
Expected: Summary shows proper termination reasons (gradient, ftol, xtol, maxiter)

**Step 9: Commit**

```bash
git add src/algorithms/diagonal-preconditioner.ts
git commit -m "feat(diagonal-precond): add enhanced termination criteria (ftol, xtol)"
```

---

## Phase 6: Testing and Polish

### Task 16: Integration Test - Full Workflow

**Files:**
- Manual testing workflow

**Step 1: Test all algorithms tab switching**

Run: `npm run dev`

Test sequence:
1. Switch between all tabs (Algorithms, GD Fixed, GD+LS, Diagonal Precond, Newton, L-BFGS)
2. Verify no console errors
3. Verify all tabs load without visual glitches

Expected: Clean switching, no errors

**Step 2: Test diagonal preconditioner full workflow**

On diagonal preconditioner tab:
1. Change problem type to "Ill-Conditioned Quadratic"
2. Adjust parameters (epsilon, line search toggle, tolerance)
3. Click basin picker to set initial point
4. Run algorithm
5. Use playback controls (play, pause, slider, speed)
6. Click on sparkline charts to jump to iterations
7. Verify canvas shows trajectory
8. Verify metrics update correctly
9. Read convergence summary

Expected: All features work smoothly

**Step 3: Test experiment presets**

Click each experiment button in Try This section:
1. "Success: Aligned with Axes" - verify 1-2 iteration convergence
2. "Failure: Rotated Problem" - verify many iterations
3. "Compare: Diagonal vs GD+LS" - verify comparison mode loads
4. "The Rotation Invariance Story" - verify comparison mode loads
5. "Circular Bowl Demo" - verify works correctly

Expected: All experiments load and run correctly

**Step 4: Test edge cases**

Test scenarios:
1. Run from different initial points
2. Toggle line search mid-experiment
3. Change epsilon to extreme values (10⁻¹⁰ and 10⁻⁶)
4. Max out iterations to test maxiter termination
5. Test on all problem types (logistic, quadratic, rosenbrock, etc.)

Expected: No crashes, appropriate behavior

**Step 5: Visual quality check**

Compare diagonal preconditioner tab to Newton tab:
1. Layout should match
2. Colors should be consistent
3. Spacing should be similar
4. Documentation quality should match
5. Canvas visualization should look similar

Expected: Professional, consistent quality

**Step 6: Document any issues found**

Create GitHub issues for any bugs discovered

**Step 7: No commit needed - testing only**

---

### Task 17: Update Tab Button Styling for Consistency

**Files:**
- Modify: `src/UnifiedVisualizer.tsx:1651-1661` (diagonal preconditioner tab button)

**Step 1: Update diagonal preconditioner tab button styling**

In `src/UnifiedVisualizer.tsx`, find the diagonal preconditioner tab button (around line 1651-1661).

Change from:

```typescript
<button
  onClick={() => setSelectedTab('diagonal-precond')}
  className={`px-6 py-3 font-medium transition-colors ${
    selectedTab === 'diagonal-precond'
      ? 'bg-teal-100 text-teal-900 border-b-2 border-teal-500'
      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
  }`}
>
  Diagonal Preconditioner
</button>
```

To match other tabs:

```typescript
<button
  onClick={() => setSelectedTab('diagonal-precond')}
  className={`flex-1 px-4 py-4 font-semibold text-sm ${
    selectedTab === 'diagonal-precond'
      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50'
      : 'text-gray-600 hover:bg-gray-50'
  }`}
>
  Diagonal Precond
</button>
```

**Step 2: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Verify styling looks consistent**

Run: `npm run dev`
Check that diagonal preconditioner tab button matches others in size, spacing, and colors

**Step 4: Commit**

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "style(diagonal-precond): update tab button to match other algorithms"
```

---

### Task 18: Add Hessian Diagonal Visualization (Optional Enhancement)

**Files:**
- Create: `src/UnifiedVisualizer.tsx` (add new canvas ref and effect)

**Step 1: Add Hessian diagonal canvas ref**

After `diagPrecondLineSearchCanvasRef`, add:

```typescript
const diagPrecondHessianDiagCanvasRef = useRef<HTMLCanvasElement>(null);
```

**Step 2: Add Hessian diagonal visualization effect**

Add this useEffect:

```typescript
// Diagonal Preconditioner: Draw Hessian diagonal history
useEffect(() => {
  const canvas = diagPrecondHessianDiagCanvasRef.current;
  if (!canvas || diagPrecondIterations.length === 0) return;

  const { ctx, width, height } = setupCanvas(canvas);

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  const padding = 40;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  // Draw axes
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  // Draw Hessian diagonal values over iterations
  const dimension = diagPrecondIterations[0].hessianDiagonal.length;
  const colors = ['#3b82f6', '#f59e0b', '#10b981'];

  for (let dim = 0; dim < dimension; dim++) {
    const values = diagPrecondIterations.map(iter => iter.hessianDiagonal[dim]);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values, 0);

    ctx.strokeStyle = colors[dim % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();

    diagPrecondIterations.forEach((iter, idx) => {
      const x = padding + (idx / (diagPrecondIterations.length - 1)) * plotWidth;
      const y =
        height -
        padding -
        ((iter.hessianDiagonal[dim] - minVal) / (maxVal - minVal)) * plotHeight;

      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Draw labels
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';
  ctx.fillText('Iteration', width - padding - 40, height - padding + 25);
  ctx.save();
  ctx.translate(padding - 25, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('H_ii', 0, 0);
  ctx.restore();

  // Draw legend
  for (let dim = 0; dim < dimension; dim++) {
    ctx.fillStyle = colors[dim % colors.length];
    ctx.fillRect(width - padding - 80, padding + dim * 20, 15, 10);
    ctx.fillStyle = '#333';
    ctx.fillText(`H_${dim}${dim}`, width - padding - 60, padding + dim * 20 + 9);
  }
}, [diagPrecondIterations]);
```

**Step 3: Add canvas to IterationMetrics**

Update the IterationMetrics call to include:

```typescript
hessianDiagCanvasRef={diagPrecondHessianDiagCanvasRef}
```

And add the canvas rendering in IterationMetrics component similar to how Newton renders Hessian.

**Step 4: Test the changes compile**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Verify visualization**

Run: `npm run dev`
Expected: Hessian diagonal history shows over iterations

**Step 6: Commit**

```bash
git add src/UnifiedVisualizer.tsx src/components/IterationMetrics.tsx
git commit -m "feat(diagonal-precond): add Hessian diagonal history visualization"
```

---

### Task 19: Final Code Review and Cleanup

**Files:**
- All modified files

**Step 1: Review all changed files**

Run: `git diff main`

Check for:
- Unused imports
- Console.log statements
- Commented-out code
- TODO comments that should be removed
- Inconsistent formatting

**Step 2: Run linter**

Run: `npm run lint`

Fix any linting errors:
Run: `npm run lint -- --fix`

**Step 3: Run type check**

Run: `npm run type-check` (or `npx tsc --noEmit`)

Fix any TypeScript errors

**Step 4: Format code**

Run: `npm run format` (if available)

Or manually ensure consistent formatting

**Step 5: Test full build**

Run: `npm run build`
Expected: Clean build with no warnings or errors

**Step 6: Commit cleanup**

```bash
git add -A
git commit -m "chore(diagonal-precond): code cleanup, remove unused code, fix linting"
```

---

### Task 20: Final Integration Test and Documentation

**Files:**
- Manual testing
- Update: `docs/diagonal-preconditioner-guide.md` (if needed)

**Step 1: Complete smoke test**

Run: `npm run dev`

Full test checklist:
- [ ] All tabs load without errors
- [ ] Diagonal preconditioner tab looks professional
- [ ] Configuration changes trigger re-runs correctly
- [ ] Basin picker works
- [ ] Canvas visualization renders correctly
- [ ] Trajectory displays correctly
- [ ] Metrics update correctly
- [ ] Playback controls work (play/pause/slider/speed)
- [ ] Sparkline charts are interactive
- [ ] Convergence summary displays
- [ ] All experiment presets work
- [ ] Comparison mode works with diagonal preconditioner
- [ ] Documentation is clear and helpful
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no lag)

**Step 2: Cross-browser test (if applicable)**

Test in:
- Chrome
- Firefox
- Safari

Expected: Works consistently

**Step 3: Update documentation**

If `docs/diagonal-preconditioner-guide.md` exists, update it to reflect new UI.

Otherwise, create brief upgrade notes:

Create: `docs/diagonal-preconditioner-upgrade-notes.md`

```markdown
# Diagonal Preconditioner Tab Upgrade

## Completed
- ✅ Replaced custom UI with shared component architecture
- ✅ Added full canvas visualization (parameter space + line search)
- ✅ Integrated IterationMetrics component with sparklines
- ✅ Integrated IterationPlayback component with controls
- ✅ Integrated AlgorithmConfiguration component
- ✅ Added comprehensive documentation sections
- ✅ Wired up experiment presets
- ✅ Added enhanced termination criteria (ftol, xtol)
- ✅ Fixed summary state display

## Now Matches Newton/GD+LS Quality
- Same component architecture
- Same visualization quality
- Same documentation depth
- Same user experience consistency
```

**Step 4: Final commit**

```bash
git add docs/
git commit -m "docs(diagonal-precond): add upgrade completion notes"
```

---

## Implementation Complete!

**Summary:**
- ✅ 20 tasks completed
- ✅ Component architecture unified
- ✅ Full visualization added
- ✅ Documentation comprehensive
- ✅ Experiments integrated
- ✅ Code quality maintained

**Next Steps:**
1. Create PR from this branch
2. Request code review
3. Address any feedback
4. Merge to main

**Total Estimated Time:** 14-20 hours
**Actual Time:** [To be filled in after execution]
