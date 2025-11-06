# Iteration UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the iteration UI with clear separation between Configuration (editable), Playback (navigation), and Metrics (read-only) to eliminate confusion about which controls modify the algorithm vs navigate through results.

**Architecture:** Reorganize the UnifiedVisualizer.tsx component to follow a top-to-bottom flow: Configuration → Playback → Metrics. Remove the "Run Algorithm" button (auto-runs on config change). Move algorithm-specific visualizations (line search plots, Hessian info) into the metrics section with conditional rendering. Add convergence-first hierarchy with gradient norm as hero metric.

**Tech Stack:** React, TypeScript, Tailwind CSS, HTML Canvas API

**Reference Mockup:** [docs/mockup-final-design.html](../mockup-final-design.html)

---

## Task 1: Extract Configuration Section Component

**Goal:** Separate configuration controls into a reusable component for clarity.

**Files:**
- Create: `src/components/AlgorithmConfiguration.tsx`
- Modify: `src/UnifiedVisualizer.tsx` (will use in Task 2)

### Step 1: Create AlgorithmConfiguration component file

Create `src/components/AlgorithmConfiguration.tsx`:

```typescript
import React from 'react';
import { InlineMath } from './Math';

interface AlgorithmConfigurationProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';

  // Shared parameters
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;

  // Algorithm-specific parameters
  gdFixedAlpha?: number;
  onGdFixedAlphaChange?: (val: number) => void;
  gdFixedTolerance?: number;
  onGdFixedToleranceChange?: (val: number) => void;

  gdLSC1?: number;
  onGdLSC1Change?: (val: number) => void;
  gdLSTolerance?: number;
  onGdLSToleranceChange?: (val: number) => void;

  newtonC1?: number;
  onNewtonC1Change?: (val: number) => void;
  newtonTolerance?: number;
  onNewtonToleranceChange?: (val: number) => void;

  lbfgsC1?: number;
  onLbfgsC1Change?: (val: number) => void;
  lbfgsM?: number;
  onLbfgsMChange?: (val: number) => void;
  lbfgsTolerance?: number;
  onLbfgsToleranceChange?: (val: number) => void;
}

export const AlgorithmConfiguration: React.FC<AlgorithmConfigurationProps> = (props) => {
  const { algorithm } = props;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Algorithm Configuration</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Algorithm-specific parameters */}
        {algorithm === 'gd-fixed' && (
          <>
            {/* Step Size */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Step Size <InlineMath>\alpha</InlineMath>:
                </label>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  EDITABLE
                </span>
              </div>
              <input
                type="number"
                value={props.gdFixedAlpha}
                onChange={(e) => props.onGdFixedAlphaChange?.(Number(e.target.value))}
                step="0.01"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Learning rate (constant for all iterations)
              </p>
            </div>

            {/* Tolerance */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Tolerance:</label>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  EDITABLE
                </span>
              </div>
              <input
                type="text"
                value={props.gdFixedTolerance?.toExponential(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) props.onGdFixedToleranceChange?.(val);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') && (
          <>
            {/* Armijo c1 */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Armijo c<sub>1</sub>:
                </label>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  EDITABLE
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="-1"
                step="0.1"
                value={Math.log10(
                  algorithm === 'gd-linesearch'
                    ? props.gdLSC1!
                    : algorithm === 'newton'
                    ? props.newtonC1!
                    : props.lbfgsC1!
                )}
                onChange={(e) => {
                  const val = Math.pow(10, parseFloat(e.target.value));
                  if (algorithm === 'gd-linesearch') props.onGdLSC1Change?.(val);
                  else if (algorithm === 'newton') props.onNewtonC1Change?.(val);
                  else props.onLbfgsC1Change?.(val);
                }}
                className="w-full mb-2"
              />
              <div className="text-sm text-gray-600">
                {algorithm === 'gd-linesearch'
                  ? props.gdLSC1?.toExponential(1)
                  : algorithm === 'newton'
                  ? props.newtonC1?.toExponential(1)
                  : props.lbfgsC1?.toExponential(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Line search parameter (smaller = stricter decrease requirement)
              </p>
            </div>

            {/* Tolerance */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Tolerance:</label>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  EDITABLE
                </span>
              </div>
              <input
                type="text"
                value={
                  algorithm === 'gd-linesearch'
                    ? props.gdLSTolerance?.toExponential(1)
                    : algorithm === 'newton'
                    ? props.newtonTolerance?.toExponential(1)
                    : props.lbfgsTolerance?.toExponential(1)
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    if (algorithm === 'gd-linesearch') props.onGdLSToleranceChange?.(val);
                    else if (algorithm === 'newton') props.onNewtonToleranceChange?.(val);
                    else props.onLbfgsToleranceChange?.(val);
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {algorithm === 'lbfgs' && (
          <>
            {/* Memory M */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Memory M:</label>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  EDITABLE
                </span>
              </div>
              <input
                type="number"
                value={props.lbfgsM}
                onChange={(e) => props.onLbfgsMChange?.(Number(e.target.value))}
                min="1"
                max="20"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of (s, y) pairs to store for curvature approximation
              </p>
            </div>
          </>
        )}

        {/* Max Iterations (all algorithms) */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Max Iterations:</label>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              EDITABLE
            </span>
          </div>
          <input
            type="number"
            value={props.maxIter}
            onChange={(e) => props.onMaxIterChange(Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum iterations before stopping</p>
        </div>

        {/* Initial Point (all algorithms) */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Initial Point:</label>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
              EDITABLE
            </span>
          </div>
          <div className="flex gap-2 items-baseline mb-2">
            <span className="text-sm text-gray-600">
              <InlineMath>w_0</InlineMath>:
            </span>
            <input
              type="number"
              value={props.initialW0}
              onChange={(e) => props.onInitialW0Change(Number(e.target.value))}
              step="0.1"
              className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
            />
            <span className="text-sm text-gray-600">
              <InlineMath>w_1</InlineMath>:
            </span>
            <input
              type="number"
              value={props.initialW1}
              onChange={(e) => props.onInitialW1Change(Number(e.target.value))}
              step="0.1"
              className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">Starting position in parameter space</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>💡 Auto-run:</strong> Algorithm runs automatically when any parameter changes
          (computation is fast!)
        </p>
      </div>
    </div>
  );
};
```

### Step 2: Commit configuration component

```bash
git add src/components/AlgorithmConfiguration.tsx
git commit -m "feat(ui): add AlgorithmConfiguration component

- Extracts configuration controls into separate component
- Supports all 4 algorithms (GD Fixed, GD LS, Newton, L-BFGS)
- Shows EDITABLE badges for clarity
- Includes auto-run notice
"
```

---

## Task 2: Create Iteration Playback Component

**Goal:** Extract navigation controls into dedicated component with video player metaphor.

**Files:**
- Create: `src/components/IterationPlayback.tsx`

### Step 1: Create IterationPlayback component

Create `src/components/IterationPlayback.tsx`:

```typescript
import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface IterationPlaybackProps {
  currentIter: number;
  totalIters: number;
  onIterChange: (iter: number) => void;
  onReset: () => void;
}

export const IterationPlayback: React.FC<IterationPlaybackProps> = ({
  currentIter,
  totalIters,
  onIterChange,
  onReset,
}) => {
  const handlePrevious = () => {
    if (currentIter > 0) {
      onIterChange(currentIter - 1);
    }
  };

  const handleNext = () => {
    if (currentIter < totalIters - 1) {
      onIterChange(currentIter + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Iteration Playback</h2>
        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded font-semibold">
          NAVIGATION
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        <button
          onClick={handlePrevious}
          disabled={currentIter === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
        >
          <ArrowLeft size={18} />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIter === totalIters - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
        >
          Next
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Timeline Scrubber */}
      <div className="mt-4">
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalIters - 1)}
            value={currentIter}
            onChange={(e) => onIterChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium text-gray-700 min-w-[60px]">
            {totalIters > 0 ? `${currentIter + 1} / ${totalIters}` : '0 / 0'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Drag to navigate through iterations (like a video timeline)
        </p>
      </div>
    </div>
  );
};
```

### Step 2: Commit playback component

```bash
git add src/components/IterationPlayback.tsx
git commit -m "feat(ui): add IterationPlayback component

- Video player-style navigation controls
- Reset, Previous, Next buttons
- Timeline scrubber with iteration counter
- NAVIGATION badge for clarity
"
```

---

## Task 3: Create Iteration Metrics Component

**Goal:** Create comprehensive metrics display with convergence-first hierarchy.

**Files:**
- Create: `src/components/IterationMetrics.tsx`

### Step 1: Create IterationMetrics component

Create `src/components/IterationMetrics.tsx`:

```typescript
import React from 'react';
import { InlineMath } from './Math';
import { fmt, fmtVec } from '../shared-utils';

interface IterationMetricsProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
  iterNum: number;
  totalIters: number;

  // Current iteration data
  loss: number;
  gradNorm: number;
  weights: number[];
  alpha: number;
  gradient?: number[];
  direction?: number[];

  // Previous iteration data (for deltas)
  prevLoss?: number;
  prevGradNorm?: number;

  // Algorithm-specific data
  eigenvalues?: number[];
  conditionNumber?: number;
  lineSearchTrials?: number;

  tolerance: number;
}

export const IterationMetrics: React.FC<IterationMetricsProps> = ({
  algorithm,
  iterNum,
  totalIters,
  loss,
  gradNorm,
  weights,
  alpha,
  gradient,
  direction,
  prevLoss,
  prevGradNorm,
  eigenvalues,
  conditionNumber,
  lineSearchTrials,
  tolerance,
}) => {
  // Calculate deltas
  const lossDelta = prevLoss !== undefined ? loss - prevLoss : 0;
  const lossPercent = prevLoss !== undefined && prevLoss !== 0
    ? ((lossDelta / prevLoss) * 100).toFixed(1)
    : '0.0';
  const gradNormDelta = prevGradNorm !== undefined ? gradNorm - prevGradNorm : 0;
  const gradNormPercent = prevGradNorm !== undefined && prevGradNorm !== 0
    ? ((gradNormDelta / prevGradNorm) * 100).toFixed(1)
    : '0.0';

  // Calculate convergence progress (0-100%)
  const maxGradNorm = 1000; // Assume starting gradient norm ~1000 (can be refined)
  const convergencePercent = Math.min(100, Math.max(0, ((maxGradNorm - gradNorm) / maxGradNorm) * 100));

  // Determine convergence status
  const isConverged = gradNorm < tolerance;
  const statusBadge = isConverged
    ? { text: '✓ Converged', bg: 'bg-green-200', color: 'text-green-900' }
    : { text: '⚠️ In Progress', bg: 'bg-amber-200', color: 'text-amber-900' };

  // Calculate movement magnitude
  const movementMagnitude = weights.length === 2
    ? Math.sqrt(
        Math.pow(weights[0] - (direction?.[0] || 0) * alpha, 2) +
        Math.pow(weights[1] - (direction?.[1] || 0) * alpha, 2)
      )
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Iteration {iterNum + 1} / {totalIters}
        </h2>
        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded font-semibold">
          READ ONLY
        </span>
      </div>

      {/* Convergence Hero Section */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Convergence Status
          </h3>
          <span className={`text-xs px-2 py-1 ${statusBadge.bg} ${statusBadge.color} rounded font-bold`}>
            {statusBadge.text}
          </span>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Gradient Norm</div>
          <div className="text-3xl font-bold text-gray-900 font-mono">{fmt(gradNorm)}</div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">
            Progress to convergence (target &lt; {tolerance.toExponential(0)})
          </div>
          <div className="bg-gray-200 h-6 rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${convergencePercent}%`,
                background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {isConverged
              ? 'Converged!'
              : `~${Math.max(0, totalIters - iterNum - 1)} iterations remaining`}
          </div>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Loss Panel */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Loss</h3>
          <div className="font-mono text-2xl font-bold text-gray-900 mb-2">{fmt(loss)}</div>
          {prevLoss !== undefined && (
            <div className={`text-xs font-semibold ${lossDelta < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {lossDelta < 0 ? '↓' : '↑'} {Math.abs(lossDelta).toFixed(3)} ({lossPercent}%)
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">Objective function value</div>
        </div>

        {/* Movement Panel */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Movement</h3>
          <div className="font-mono text-2xl font-bold text-gray-900 mb-2">
            {movementMagnitude.toFixed(4)}
          </div>
          <div className="text-xs text-gray-700">
            ||Δw||<sub>2</sub> in parameter space
          </div>
          <div className="text-xs text-gray-500 mt-1">Step size α: {fmt(alpha)}</div>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Parameters</h3>
        <div className="grid grid-cols-2 gap-3">
          {weights.map((w, i) => (
            <div key={i} className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-600 font-semibold mb-1">
                w<sub>{i}</sub>
              </div>
              <div className="font-mono text-lg font-bold text-gray-900">{fmt(w)}</div>
              {direction && (
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Δ = {(direction[i] * alpha).toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
        {direction && (
          <div className="mt-3 text-xs text-gray-700">
            <strong>Direction:</strong>{' '}
            <span className="font-mono">[{direction.map((d) => d.toFixed(2)).join(', ')}]</span>{' '}
            (normalized)
          </div>
        )}
      </div>

      {/* Gradient Details */}
      {gradient && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Gradient ∇f
          </h3>
          <div className="font-mono text-sm text-gray-900 mb-2">[{fmtVec(gradient)}]</div>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <div className="text-gray-600">Norm ||∇f||₂</div>
              <div className="font-mono font-semibold">{fmt(gradNorm)}</div>
            </div>
            <div>
              <div className="text-gray-600">Max component</div>
              <div className="font-mono font-semibold">
                {Math.max(...gradient.map(Math.abs)).toFixed(3)}
              </div>
            </div>
            {prevGradNorm !== undefined && (
              <>
                <div>
                  <div className="text-gray-600">Change from prev</div>
                  <div className={`font-mono font-semibold ${gradNormDelta < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gradNormDelta.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Reduction rate</div>
                  <div className={`font-mono font-semibold ${gradNormDelta < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gradNormPercent}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Algorithm Info Panel (conditionally rendered) */}
      {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Algorithm Info
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <div className="text-gray-600 text-xs">Method</div>
              <div className="font-semibold text-gray-900">
                {algorithm === 'gd-linesearch' ? 'GD (Line Search)' : algorithm === 'newton' ? 'Newton' : 'L-BFGS'}
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs">Line Search</div>
              <div className="font-semibold text-gray-900">Armijo (pluggable)</div>
            </div>
            {lineSearchTrials && (
              <div>
                <div className="text-gray-600 text-xs">Trials</div>
                <div className="font-semibold text-gray-900">{lineSearchTrials}</div>
              </div>
            )}
            {conditionNumber && (
              <div>
                <div className="text-gray-600 text-xs">Condition #</div>
                <div className="font-semibold text-gray-900">κ = {conditionNumber.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hessian Info Panel (only for Newton) */}
      {algorithm === 'newton' && eigenvalues && eigenvalues.length >= 2 && (
        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Hessian Analysis (Newton only)
          </h3>

          {/* Eigenvalues */}
          <div className="bg-white rounded p-3 border border-gray-300 mb-3">
            <div className="text-xs font-bold text-gray-700 mb-2">Eigenvalues</div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <div className="text-gray-600">λ₁ (max)</div>
                <div className="font-semibold text-gray-900">{fmt(eigenvalues[0])}</div>
              </div>
              <div>
                <div className="text-gray-600">λ₂ (min)</div>
                <div className="font-semibold text-gray-900">
                  {fmt(eigenvalues[eigenvalues.length - 1])}
                </div>
              </div>
            </div>
            {conditionNumber && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Condition number κ</span>
                  <span className="font-semibold text-gray-900">{conditionNumber.toFixed(1)}</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {eigenvalues.every((e) => e > 0) ? '✓ Positive definite (all λ > 0)' : '⚠️ Not positive definite'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Step 2: Commit metrics component

```bash
git add src/components/IterationMetrics.tsx
git commit -m "feat(ui): add IterationMetrics component

- Convergence-first hierarchy with gradient norm hero
- Detailed metrics: loss, movement, parameters, gradient
- Algorithm-specific panels (line search info, Hessian)
- Conditional rendering based on algorithm type
- Delta calculations for loss and gradient norm
"
```

---

## Task 4: Integrate Components into UnifiedVisualizer

**Goal:** Refactor UnifiedVisualizer to use new components in correct order.

**Files:**
- Modify: `src/UnifiedVisualizer.tsx`

### Step 1: Import new components

Add imports at the top of `src/UnifiedVisualizer.tsx` (after line 31):

```typescript
import { AlgorithmConfiguration } from './components/AlgorithmConfiguration';
import { IterationPlayback } from './components/IterationPlayback';
import { IterationMetrics } from './components/IterationMetrics';
```

### Step 2: Replace algorithm-specific sections

In `src/UnifiedVisualizer.tsx`, locate the section starting around line 1981 where algorithm-specific content begins. Replace the configuration inputs, navigation controls, and iteration display for each algorithm with the new components.

For **GD Fixed** (lines ~1984-2336), replace with:

```typescript
{selectedTab === 'gd-fixed' && (
  <>
    {/* 1. Configuration Section */}
    <AlgorithmConfiguration
      algorithm="gd-fixed"
      maxIter={maxIter}
      onMaxIterChange={setMaxIter}
      initialW0={initialW0}
      onInitialW0Change={setInitialW0}
      initialW1={initialW1}
      onInitialW1Change={setInitialW1}
      gdFixedAlpha={gdFixedAlpha}
      onGdFixedAlphaChange={setGdFixedAlpha}
      gdFixedTolerance={gdFixedTolerance}
      onGdFixedToleranceChange={setGdFixedTolerance}
    />

    {/* 2. Playback Section */}
    {gdFixedIterations.length > 0 && (
      <IterationPlayback
        currentIter={gdFixedCurrentIter}
        totalIters={gdFixedIterations.length}
        onIterChange={setGdFixedCurrentIter}
        onReset={() => setGdFixedCurrentIter(0)}
      />
    )}

    {/* 3. Metrics Section */}
    {gdFixedIterations.length > 0 && gdFixedIterations[gdFixedCurrentIter] && (
      <IterationMetrics
        algorithm="gd-fixed"
        iterNum={gdFixedCurrentIter}
        totalIters={gdFixedIterations.length}
        loss={gdFixedIterations[gdFixedCurrentIter].newLoss}
        gradNorm={gdFixedIterations[gdFixedCurrentIter].gradNorm}
        weights={gdFixedIterations[gdFixedCurrentIter].wNew}
        alpha={gdFixedIterations[gdFixedCurrentIter].alpha}
        gradient={gdFixedIterations[gdFixedCurrentIter].grad}
        direction={gdFixedIterations[gdFixedCurrentIter].direction}
        prevLoss={gdFixedCurrentIter > 0 ? gdFixedIterations[gdFixedCurrentIter - 1].newLoss : undefined}
        prevGradNorm={gdFixedCurrentIter > 0 ? gdFixedIterations[gdFixedCurrentIter - 1].gradNorm : undefined}
        tolerance={gdFixedTolerance}
      />
    )}

    {/* Rest of GD Fixed content (visualizations, experiments, etc.) */}
    {/* ... keep existing canvas sections ... */}
  </>
)}
```

For **GD Line Search** (lines ~2810-3436), replace with:

```typescript
{selectedTab === 'gd-linesearch' && (
  <>
    {/* 1. Configuration Section */}
    <AlgorithmConfiguration
      algorithm="gd-linesearch"
      maxIter={maxIter}
      onMaxIterChange={setMaxIter}
      initialW0={initialW0}
      onInitialW0Change={setInitialW0}
      initialW1={initialW1}
      onInitialW1Change={setInitialW1}
      gdLSC1={gdLSC1}
      onGdLSC1Change={setGdLSC1}
      gdLSTolerance={gdLSTolerance}
      onGdLSToleranceChange={setGdLSTolerance}
    />

    {/* 2. Playback Section */}
    {gdLSIterations.length > 0 && (
      <IterationPlayback
        currentIter={gdLSCurrentIter}
        totalIters={gdLSIterations.length}
        onIterChange={setGdLSCurrentIter}
        onReset={() => setGdLSCurrentIter(0)}
      />
    )}

    {/* 3. Metrics Section */}
    {gdLSIterations.length > 0 && gdLSIterations[gdLSCurrentIter] && (
      <IterationMetrics
        algorithm="gd-linesearch"
        iterNum={gdLSCurrentIter}
        totalIters={gdLSIterations.length}
        loss={gdLSIterations[gdLSCurrentIter].newLoss}
        gradNorm={gdLSIterations[gdLSCurrentIter].gradNorm}
        weights={gdLSIterations[gdLSCurrentIter].wNew}
        alpha={gdLSIterations[gdLSCurrentIter].alpha}
        gradient={gdLSIterations[gdLSCurrentIter].grad}
        direction={gdLSIterations[gdLSCurrentIter].direction}
        prevLoss={gdLSCurrentIter > 0 ? gdLSIterations[gdLSCurrentIter - 1].newLoss : undefined}
        prevGradNorm={gdLSCurrentIter > 0 ? gdLSIterations[gdLSCurrentIter - 1].gradNorm : undefined}
        lineSearchTrials={gdLSIterations[gdLSCurrentIter].lineSearchTrials?.length}
        tolerance={gdLSTolerance}
      />
    )}

    {/* Rest of GD LS content (visualizations, line search canvas, etc.) */}
    {/* ... keep existing canvas sections ... */}
  </>
)}
```

For **Newton** (lines ~3437-3996), replace with:

```typescript
{selectedTab === 'newton' && (
  <>
    {/* 1. Configuration Section */}
    <AlgorithmConfiguration
      algorithm="newton"
      maxIter={maxIter}
      onMaxIterChange={setMaxIter}
      initialW0={initialW0}
      onInitialW0Change={setInitialW0}
      initialW1={initialW1}
      onInitialW1Change={setInitialW1}
      newtonC1={newtonC1}
      onNewtonC1Change={setNewtonC1}
      newtonTolerance={newtonTolerance}
      onNewtonToleranceChange={setNewtonTolerance}
    />

    {/* 2. Playback Section */}
    {newtonIterations.length > 0 && (
      <IterationPlayback
        currentIter={newtonCurrentIter}
        totalIters={newtonIterations.length}
        onIterChange={setNewtonCurrentIter}
        onReset={() => setNewtonCurrentIter(0)}
      />
    )}

    {/* 3. Metrics Section */}
    {newtonIterations.length > 0 && newtonIterations[newtonCurrentIter] && (
      <IterationMetrics
        algorithm="newton"
        iterNum={newtonCurrentIter}
        totalIters={newtonIterations.length}
        loss={newtonIterations[newtonCurrentIter].newLoss}
        gradNorm={newtonIterations[newtonCurrentIter].gradNorm}
        weights={newtonIterations[newtonCurrentIter].wNew}
        alpha={newtonIterations[newtonCurrentIter].alpha}
        gradient={newtonIterations[newtonCurrentIter].grad}
        direction={newtonIterations[newtonCurrentIter].direction}
        prevLoss={newtonCurrentIter > 0 ? newtonIterations[newtonCurrentIter - 1].newLoss : undefined}
        prevGradNorm={newtonCurrentIter > 0 ? newtonIterations[newtonCurrentIter - 1].gradNorm : undefined}
        eigenvalues={newtonIterations[newtonCurrentIter].eigenvalues}
        conditionNumber={newtonIterations[newtonCurrentIter].conditionNumber}
        lineSearchTrials={newtonIterations[newtonCurrentIter].lineSearchTrials?.length}
        tolerance={newtonTolerance}
      />
    )}

    {/* Rest of Newton content (visualizations, Hessian canvas, line search canvas, etc.) */}
    {/* ... keep existing canvas sections ... */}
  </>
)}
```

For **L-BFGS** (lines ~3997-4869), replace with:

```typescript
{selectedTab === 'lbfgs' && (
  <>
    {/* 1. Configuration Section */}
    <AlgorithmConfiguration
      algorithm="lbfgs"
      maxIter={maxIter}
      onMaxIterChange={setMaxIter}
      initialW0={initialW0}
      onInitialW0Change={setInitialW0}
      initialW1={initialW1}
      onInitialW1Change={setInitialW1}
      lbfgsC1={lbfgsC1}
      onLbfgsC1Change={setLbfgsC1}
      lbfgsM={lbfgsM}
      onLbfgsMChange={setLbfgsM}
      lbfgsTolerance={lbfgsTolerance}
      onLbfgsToleranceChange={setLbfgsTolerance}
    />

    {/* 2. Playback Section */}
    {lbfgsIterations.length > 0 && (
      <IterationPlayback
        currentIter={lbfgsCurrentIter}
        totalIters={lbfgsIterations.length}
        onIterChange={setLbfgsCurrentIter}
        onReset={() => setLbfgsCurrentIter(0)}
      />
    )}

    {/* 3. Metrics Section */}
    {lbfgsIterations.length > 0 && lbfgsIterations[lbfgsCurrentIter] && (
      <IterationMetrics
        algorithm="lbfgs"
        iterNum={lbfgsCurrentIter}
        totalIters={lbfgsIterations.length}
        loss={lbfgsIterations[lbfgsCurrentIter].newLoss}
        gradNorm={lbfgsIterations[lbfgsCurrentIter].gradNorm}
        weights={lbfgsIterations[lbfgsCurrentIter].wNew}
        alpha={lbfgsIterations[lbfgsCurrentIter].alpha}
        gradient={lbfgsIterations[lbfgsCurrentIter].grad}
        direction={lbfgsIterations[lbfgsCurrentIter].direction}
        prevLoss={lbfgsCurrentIter > 0 ? lbfgsIterations[lbfgsCurrentIter - 1].newLoss : undefined}
        prevGradNorm={lbfgsCurrentIter > 0 ? lbfgsIterations[lbfgsCurrentIter - 1].gradNorm : undefined}
        lineSearchTrials={lbfgsIterations[lbfgsCurrentIter].lineSearchTrials?.length}
        tolerance={lbfgsTolerance}
      />
    )}

    {/* Rest of L-BFGS content (visualizations, line search canvas, memory table, etc.) */}
    {/* ... keep existing canvas sections ... */}
  </>
)}
```

### Step 3: Commit integration

```bash
git add src/UnifiedVisualizer.tsx
git commit -m "refactor(ui): integrate new components into UnifiedVisualizer

- Use AlgorithmConfiguration, IterationPlayback, IterationMetrics
- Maintain Config → Playback → Metrics order for all algorithms
- Keep existing visualizations and educational content
- Remove old inline configuration/navigation/metrics code
"
```

---

## Task 5: Add Line Search Visualization to Metrics

**Goal:** Move line search canvas into IterationMetrics component for algorithms that use line search.

**Files:**
- Modify: `src/components/IterationMetrics.tsx`
- Modify: `src/UnifiedVisualizer.tsx` (pass canvas ref and data)

### Step 1: Update IterationMetrics to accept line search data

Modify `src/components/IterationMetrics.tsx` to add line search visualization:

Add to interface:

```typescript
interface IterationMetricsProps {
  // ... existing props ...

  // Line search data
  lineSearchCanvasRef?: React.RefObject<HTMLCanvasElement>;
  lineSearchCurve?: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
  lineSearchTrialsData?: Array<{
    alpha: number;
    loss: number;
    satisfied: boolean;
  }>;
}
```

Add line search visualization section after Algorithm Info panel:

```typescript
{/* Line Search Visualization (for algorithms with line search) */}
{(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') &&
  lineSearchCanvasRef && (
    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
      <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
        Line Search Visualization
      </h3>
      <div className="bg-white rounded p-3 border border-gray-300">
        <div className="text-xs font-bold text-gray-700 mb-2">
          Line Search Process ({lineSearchTrials || 0} trials)
        </div>
        <canvas
          ref={lineSearchCanvasRef}
          style={{ width: '100%', height: '200px' }}
          className="border border-gray-200 rounded"
        />
        <p className="text-xs text-gray-600 mt-2">
          Blue line = actual loss f(w + αd), Orange dashed = Armijo condition upper bound. Green
          dot = accepted step, Red dots = rejected trials.
        </p>
      </div>
    </div>
  )}
```

### Step 2: Pass canvas refs from UnifiedVisualizer

In `src/UnifiedVisualizer.tsx`, update the IterationMetrics calls to pass line search canvas refs:

For **GD Line Search**:

```typescript
<IterationMetrics
  // ... existing props ...
  lineSearchCanvasRef={gdLSLineSearchCanvasRef}
  lineSearchCurve={gdLSIterations[gdLSCurrentIter].lineSearchCurve}
  lineSearchTrialsData={gdLSIterations[gdLSCurrentIter].lineSearchTrials}
/>
```

For **Newton**:

```typescript
<IterationMetrics
  // ... existing props ...
  lineSearchCanvasRef={newtonLineSearchCanvasRef}
  lineSearchCurve={newtonIterations[newtonCurrentIter].lineSearchCurve}
  lineSearchTrialsData={newtonIterations[newtonCurrentIter].lineSearchTrials}
/>
```

For **L-BFGS**:

```typescript
<IterationMetrics
  // ... existing props ...
  lineSearchCanvasRef={lbfgsLineSearchCanvasRef}
  lineSearchCurve={lbfgsIterations[lbfgsCurrentIter].lineSearchCurve}
  lineSearchTrialsData={lbfgsIterations[lbfgsCurrentIter].lineSearchTrials}
/>
```

### Step 3: Remove old line search canvas sections

In `src/UnifiedVisualizer.tsx`, remove the old standalone line search canvas sections (they're now integrated into IterationMetrics):

- For GD LS: Remove lines ~3425-3436
- For Newton: Remove lines ~3988-3995
- For L-BFGS: Remove lines ~4720-4726

### Step 4: Commit line search integration

```bash
git add src/components/IterationMetrics.tsx src/UnifiedVisualizer.tsx
git commit -m "feat(ui): integrate line search visualization into metrics

- Move line search canvas into IterationMetrics component
- Show inline with other iteration metrics
- Remove duplicate canvas sections from UnifiedVisualizer
- Conditional rendering for GD-LS, Newton, L-BFGS
"
```

---

## Task 6: Add Hessian Visualization to Metrics

**Goal:** Move Hessian canvas into IterationMetrics for Newton's method.

**Files:**
- Modify: `src/components/IterationMetrics.tsx`
- Modify: `src/UnifiedVisualizer.tsx`

### Step 1: Update IterationMetrics for Hessian canvas

Add to interface in `src/components/IterationMetrics.tsx`:

```typescript
interface IterationMetricsProps {
  // ... existing props ...

  // Hessian data (Newton only)
  hessianCanvasRef?: React.RefObject<HTMLCanvasElement>;
  hessian?: number[][];
}
```

Update the Hessian panel section to include expandable matrix visualization:

```typescript
{/* Hessian Info Panel (only for Newton) */}
{algorithm === 'newton' && eigenvalues && eigenvalues.length >= 2 && (
  <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
    <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
      Hessian Analysis (Newton only)
    </h3>

    {/* Eigenvalues */}
    <div className="bg-white rounded p-3 border border-gray-300 mb-3">
      <div className="text-xs font-bold text-gray-700 mb-2">Eigenvalues</div>
      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <div className="text-gray-600">λ₁ (max)</div>
          <div className="font-semibold text-gray-900">{fmt(eigenvalues[0])}</div>
        </div>
        <div>
          <div className="text-gray-600">λ₂ (min)</div>
          <div className="font-semibold text-gray-900">
            {fmt(eigenvalues[eigenvalues.length - 1])}
          </div>
        </div>
      </div>
      {conditionNumber && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Condition number κ</span>
            <span className="font-semibold text-gray-900">{conditionNumber.toFixed(1)}</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            {eigenvalues.every((e) => e > 0) ? '✓ Positive definite (all λ > 0)' : '⚠️ Not positive definite'}
          </div>
        </div>
      )}
    </div>

    {/* Hessian Matrix Visualization */}
    {hessianCanvasRef && (
      <details className="bg-white rounded p-3 border border-gray-300">
        <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
          View Hessian Matrix Visualization ▼
        </summary>
        <div className="mt-3">
          <canvas
            ref={hessianCanvasRef}
            style={{ width: '100%', height: '200px' }}
            className="border border-gray-200 rounded"
          />
          {hessian && (
            <pre className="font-mono text-xs mt-2 p-2 bg-gray-50 rounded">
{`⎡ ${hessian[0].map(fmt).join('  ')} ⎤\n⎣ ${hessian[1].map(fmt).join('  ')} ⎦`}
            </pre>
          )}
        </div>
      </details>
    )}
  </div>
)}
```

### Step 2: Pass Hessian data from UnifiedVisualizer

In `src/UnifiedVisualizer.tsx`, update Newton's IterationMetrics call:

```typescript
<IterationMetrics
  // ... existing props ...
  hessianCanvasRef={newtonHessianCanvasRef}
  hessian={newtonIterations[newtonCurrentIter].hessian}
/>
```

### Step 3: Remove old Hessian canvas section

In `src/UnifiedVisualizer.tsx`, remove the standalone Hessian canvas section for Newton (lines ~3980-3986).

### Step 4: Commit Hessian integration

```bash
git add src/components/IterationMetrics.tsx src/UnifiedVisualizer.tsx
git commit -m "feat(ui): integrate Hessian visualization into metrics

- Move Hessian canvas into IterationMetrics (Newton only)
- Add expandable details section for matrix view
- Display Hessian matrix in ASCII art format
- Remove duplicate canvas section from UnifiedVisualizer
"
```

---

## Task 7: Test All Algorithms

**Goal:** Verify the redesigned UI works correctly for all algorithms and problem types.

**Files:**
- None (manual testing)

### Step 1: Test GD Fixed Step

Run: `npm run dev`

1. Navigate to http://localhost:5173
2. Select "GD (Fixed Step)" tab
3. Verify:
   - Configuration section shows: Step Size α, Tolerance, Max Iterations, Initial Point
   - "EDITABLE" badges visible
   - "Auto-run" notice present
   - Change Step Size α → algorithm re-runs automatically
   - Playback section appears with Reset/Prev/Next buttons
   - Timeline scrubber works
   - "NAVIGATION" badge visible
   - Metrics section shows:
     - "READ ONLY" badge
     - Convergence hero section (amber background)
     - Gradient norm prominent
     - Progress bar
     - Loss and Movement panels
     - Parameters grid
     - Gradient details
   - NO Line Search panel (GD Fixed doesn't use line search)
   - NO Hessian panel

Expected: All UI elements render correctly, algorithm runs on config change, navigation works.

### Step 2: Test GD Line Search

1. Select "GD (Line Search)" tab
2. Verify:
   - Configuration shows: Armijo c1, Tolerance, Max Iterations, Initial Point
   - Change Armijo c1 → algorithm re-runs
   - Playback controls work
   - Metrics section includes:
     - Convergence hero
     - All standard metrics
     - Algorithm Info panel (blue background)
     - "Line Search: Armijo (pluggable)"
     - Trials count
     - Line Search Visualization canvas
   - NO Hessian panel

Expected: Line search visualization shows blue curve, orange dashed Armijo bound, green/red trial dots.

### Step 3: Test Newton's Method

1. Select "Newton" tab
2. Verify:
   - Configuration shows: Armijo c1, Tolerance, Max Iterations, Initial Point
   - Metrics section includes:
     - All standard metrics
     - Algorithm Info panel with line search details
     - Line Search Visualization canvas
     - Hessian Analysis panel (purple background)
     - Eigenvalues (λ₁, λ₂)
     - Condition number κ
     - "Positive definite" check
     - Expandable Hessian matrix visualization
   - Expand "View Hessian Matrix Visualization"
   - Verify canvas and ASCII matrix display

Expected: Both line search AND Hessian sections visible and functional.

### Step 4: Test L-BFGS

1. Select "L-BFGS" tab
2. Verify:
   - Configuration shows: Memory M, Armijo c1, Tolerance, Max Iterations, Initial Point
   - Change Memory M → algorithm re-runs
   - Metrics section includes:
     - All standard metrics
     - Algorithm Info panel
     - Line Search Visualization
   - NO Hessian panel (L-BFGS uses quasi-Newton approximation)

Expected: Line search visible, no Hessian panel.

### Step 5: Test problem switching

1. Switch between problem types (Quadratic, Ill-Conditioned, Rosenbrock, Saddle)
2. Verify algorithm re-runs for each problem
3. Verify metrics update correctly
4. Check that convergence progress bar adapts to each problem

Expected: UI remains consistent across problem types.

### Step 6: Test iteration navigation

1. For any algorithm with iterations:
2. Click "Next" repeatedly → verify metrics update for each iteration
3. Drag timeline scrubber → verify metrics jump to selected iteration
4. Click "Previous" → verify backward navigation works
5. Click "Reset" → verify returns to iteration 0
6. Test disabled states (Prev at iter 0, Next at last iter)

Expected: Navigation controls work smoothly, metrics always sync with current iteration.

### Step 7: Visual regression check

Compare new UI against mockup ([docs/mockup-final-design.html](../mockup-final-design.html)):

1. Configuration section matches mockup styling
2. Playback section uses same button styles
3. Metrics section follows same visual hierarchy
4. Colors match (amber for convergence, blue for line search, purple for Hessian)
5. Typography consistent (font sizes, monospace for numbers)
6. Spacing matches (p-6, p-4, mb-4, gap-4)

Expected: Visual appearance closely matches mockup design.

### Step 8: Document test results

If all tests pass, create summary:

```bash
echo "# UI Redesign Test Results

## Test Date: $(date)

## Algorithms Tested:
- ✓ GD Fixed Step
- ✓ GD Line Search
- ✓ Newton's Method
- ✓ L-BFGS

## Functionality Verified:
- ✓ Auto-run on config change
- ✓ Iteration navigation (Prev/Next/Reset/Scrubber)
- ✓ Metrics display (convergence, loss, gradient, params)
- ✓ Conditional rendering (line search, Hessian)
- ✓ Problem switching
- ✓ Visual consistency with mockup

## Issues Found:
(None if all passed, otherwise list here)

" > docs/test-results-ui-redesign.md

git add docs/test-results-ui-redesign.md
git commit -m "docs: add UI redesign test results"
```

---

## Task 8: Update Documentation

**Goal:** Document the new UI structure and components.

**Files:**
- Update: `README.md` (if exists)
- Create: `docs/ui-architecture.md`

### Step 1: Create UI architecture documentation

Create `docs/ui-architecture.md`:

```markdown
# UI Architecture

## Overview

The UnifiedVisualizer UI follows a three-section architecture to provide clear separation of concerns:

1. **Configuration (Editable)** - Algorithm hyperparameters
2. **Playback (Navigation)** - Iteration timeline controls
3. **Metrics (Read-Only)** - Iteration data visualization

This design eliminates confusion between modifying algorithm settings and navigating through results.

## Components

### AlgorithmConfiguration

**Location:** `src/components/AlgorithmConfiguration.tsx`

**Purpose:** Displays editable algorithm hyperparameters.

**Props:**
- `algorithm`: Which algorithm ('gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs')
- Shared parameters: `maxIter`, `initialW0`, `initialW1`
- Algorithm-specific parameters (optional based on algorithm)

**Behavior:**
- Shows "EDITABLE" badges on all inputs
- Conditionally renders algorithm-specific controls
- Displays "Auto-run" notice (algorithm re-runs on any change)

### IterationPlayback

**Location:** `src/components/IterationPlayback.tsx`

**Purpose:** Navigation controls for stepping through iterations.

**Props:**
- `currentIter`: Current iteration index (0-based)
- `totalIters`: Total number of iterations
- `onIterChange`: Callback when iteration changes
- `onReset`: Callback to reset to iteration 0

**Features:**
- Reset, Previous, Next buttons
- Timeline scrubber (range slider)
- Iteration counter display
- "NAVIGATION" badge
- Disabled states at boundaries

### IterationMetrics

**Location:** `src/components/IterationMetrics.tsx`

**Purpose:** Displays all iteration data with convergence-first hierarchy.

**Props:**
- `algorithm`: Algorithm type (determines conditional rendering)
- Iteration data: `loss`, `gradNorm`, `weights`, `alpha`, `gradient`, `direction`
- Previous iteration data: `prevLoss`, `prevGradNorm` (for delta calculations)
- Algorithm-specific: `eigenvalues`, `conditionNumber`, `lineSearchTrials`
- Visualization refs: `lineSearchCanvasRef`, `hessianCanvasRef`

**Sections:**
1. **Convergence Hero** (Amber background)
   - Gradient norm (large, prominent)
   - Progress bar showing % to convergence target
   - Status badge (✓ Converged / ⚠️ In Progress)
   - Estimated iterations remaining

2. **Detailed Metrics** (2-column grid)
   - Loss panel: value, delta, percentage change
   - Movement panel: ||Δw||₂ magnitude, step size α

3. **Parameters Grid**
   - Individual cards for each weight
   - Shows current value and delta
   - Direction vector (normalized)

4. **Gradient Details**
   - Full gradient vector
   - Norm, max component
   - Change from previous, reduction rate

5. **Algorithm Info Panel** (Blue background, conditional)
   - Method name
   - Line search type ("Armijo (pluggable)")
   - Trials count
   - Condition number (if applicable)
   - Line Search Visualization canvas

6. **Hessian Analysis Panel** (Purple background, Newton only)
   - Eigenvalues (λ₁, λ₂)
   - Condition number κ
   - Positive definite check
   - Expandable Hessian matrix visualization

## Conditional Rendering Logic

| Algorithm | Config Params | Line Search Panel | Hessian Panel |
|-----------|---------------|-------------------|---------------|
| GD Fixed | Step size α, Tolerance | No | No |
| GD Line Search | Armijo c₁, Tolerance | Yes | No |
| Newton | Armijo c₁, Tolerance | Yes | Yes |
| L-BFGS | Memory M, Armijo c₁, Tolerance | Yes | No |

## Visual Design System

**Colors:**
- Configuration: White background, blue EDITABLE badges
- Playback: White background, gray NAVIGATION badge
- Metrics: White background, gray READ ONLY badge
- Convergence: Amber background (`bg-amber-50`, `border-amber-200`)
- Line Search: Blue background (`bg-blue-50`, `border-blue-200`)
- Hessian: Purple background (`bg-purple-50`, `border-purple-200`)

**Typography:**
- Section titles: `text-xl font-bold text-gray-900`
- Subsection headers: `text-sm font-bold text-gray-800 uppercase tracking-wide`
- Numeric values: `font-mono` (monospace)
- Helper text: `text-xs text-gray-500`

**Spacing:**
- Section padding: `p-6`
- Inner panel padding: `p-4`, `p-3`
- Margins between sections: `mb-6`
- Margins between subsections: `mb-4`
- Grid gaps: `gap-4`, `gap-3`

## Workflow

1. **User changes config** → Algorithm auto-runs → Iterations generated
2. **User navigates iterations** → Playback controls update current iteration
3. **Metrics display updates** → Shows data for current iteration
4. **Canvas visualizations re-render** → Line search, Hessian updated

## Future Extensibility

### Adding New Line Search Methods

To support pluggable line search:

1. Ensure iteration data includes `lineSearchCurve` and `lineSearchTrials`
2. Pass data to `IterationMetrics` via props
3. Canvas rendering in `UnifiedVisualizer` already supports different methods
4. UI will display "(pluggable)" label automatically

### Adding New Algorithms

To add a new algorithm:

1. Add algorithm type to union: `'new-algorithm'`
2. Update `AlgorithmConfiguration` to handle new parameters
3. Update `IterationMetrics` conditional logic if needed
4. Add algorithm-specific state to `UnifiedVisualizer`
5. Follow same Config → Playback → Metrics structure

## References

- Design Mockup: [docs/mockup-final-design.html](../mockup-final-design.html)
- Implementation Plan: [docs/plans/2025-11-06-iteration-ui-redesign.md](../plans/2025-11-06-iteration-ui-redesign.md)
- Original Design Exploration: [docs/iteration-ui-design-summary.md](../iteration-ui-design-summary.md)
```

### Step 2: Commit documentation

```bash
git add docs/ui-architecture.md
git commit -m "docs: add UI architecture documentation

- Document three-section structure (Config, Playback, Metrics)
- Describe all three new components
- Explain conditional rendering logic
- Provide design system reference
- Guide for future extensibility
"
```

---

## Summary

This plan implements the iteration UI redesign by:

1. **Extracting components** - AlgorithmConfiguration, IterationPlayback, IterationMetrics
2. **Reorganizing flow** - Configuration → Playback → Metrics (top to bottom)
3. **Adding clarity** - EDITABLE, NAVIGATION, READ ONLY badges
4. **Convergence-first** - Gradient norm hero section with progress bar
5. **Conditional rendering** - Line search and Hessian panels only when applicable
6. **Rich metrics** - Loss, movement, parameters, gradient details with deltas
7. **Integrated visualizations** - Line search and Hessian canvases within metrics section

The implementation follows TDD principles (though UI testing is manual), maintains DRY by extracting reusable components, and adheres to YAGNI by only adding features specified in the mockup.

## Files Modified/Created

**Created:**
- `src/components/AlgorithmConfiguration.tsx`
- `src/components/IterationPlayback.tsx`
- `src/components/IterationMetrics.tsx`
- `docs/ui-architecture.md`
- `docs/test-results-ui-redesign.md`

**Modified:**
- `src/UnifiedVisualizer.tsx` (major refactor)

**Total Commits:** 8

**Estimated Time:** ~2-3 hours (for experienced developer)
