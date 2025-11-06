import React from 'react';
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
