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

  // Line search data
  lineSearchCanvasRef?: React.RefObject<HTMLCanvasElement>;

  // Hessian data (Newton only)
  hessianCanvasRef?: React.RefObject<HTMLCanvasElement>;
  hessian?: number[][];

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
  lineSearchCanvasRef,
  hessianCanvasRef,
  hessian,
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
    <div className="space-y-2 text-xs">
      {/* Iteration Header */}
      <div className="flex items-baseline justify-between">
        <div className="font-bold text-sm text-gray-900">
          Iter {iterNum + 1} / {totalIters}
        </div>
        <span className={`text-xs px-1.5 py-0.5 ${statusBadge.bg} ${statusBadge.color} rounded font-bold`}>
          {isConverged ? '✓' : '⚠'}
        </span>
      </div>

      {/* Convergence - Single Line */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-600">Grad Norm:</span>
          <span className="font-mono font-bold">{fmt(gradNorm)}</span>
        </div>
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${convergencePercent}%`,
              background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
            }}
          ></div>
        </div>
      </div>

      {/* Loss - Single Line */}
      <div className="flex items-baseline justify-between">
        <span className="text-gray-600">Loss:</span>
        <div className="flex items-baseline gap-1">
          <span className="font-mono font-bold text-gray-900">{fmt(loss)}</span>
          {prevLoss !== undefined && (
            <span className={`text-xs ${lossDelta < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {lossDelta < 0 ? '↓' : '↑'}{lossPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Movement - Single Line */}
      <div className="flex items-baseline justify-between">
        <span className="text-gray-600">Movement:</span>
        <span className="font-mono font-bold text-gray-900">{movementMagnitude.toFixed(4)}</span>
      </div>

      {/* Step Size */}
      <div className="flex items-baseline justify-between">
        <span className="text-gray-600">Step α:</span>
        <span className="font-mono text-gray-900">{fmt(alpha)}</span>
      </div>

      {/* Parameters - Single Line */}
      <div className="pt-1 border-t border-gray-200">
        <div className="text-gray-600 mb-0.5">Parameters:</div>
        <div className="font-mono text-xs">
          {weights.map((w, i) => `w${i}=${fmt(w)}`).join(', ')}
        </div>
      </div>

      {/* Gradient - Compact */}
      {gradient && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5">Gradient:</div>
          <div className="font-mono text-xs text-gray-900">[{fmtVec(gradient)}]</div>
        </div>
      )}

      {/* Direction - Compact */}
      {direction && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5">Direction:</div>
          <div className="font-mono text-xs text-gray-900">[{direction.map((d) => d.toFixed(2)).join(', ')}]</div>
        </div>
      )}

      {/* Algorithm Info - Minimal */}
      {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5">
            {algorithm === 'gd-linesearch' ? 'GD (Line Search)' : algorithm === 'newton' ? 'Newton' : 'L-BFGS'}
          </div>
          {lineSearchTrials && (
            <div className="text-xs text-gray-700">Trials: {lineSearchTrials}</div>
          )}
          {conditionNumber && (
            <div className="text-xs text-gray-700">κ = {conditionNumber.toFixed(1)}</div>
          )}
        </div>
      )}

      {/* Line Search Visualization - Compact */}
      {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') &&
        lineSearchCanvasRef && (
          <div className="pt-1 border-t border-gray-200">
            <div className="text-gray-600 mb-1 text-xs font-semibold">
              Line Search ({lineSearchTrials || 0} trials)
            </div>
            <canvas
              ref={lineSearchCanvasRef}
              style={{ width: '100%', height: '120px' }}
              className="border border-gray-200 rounded"
            />
          </div>
        )}

      {/* Hessian Info - Compact */}
      {algorithm === 'newton' && eigenvalues && eigenvalues.length >= 2 && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5 text-xs font-semibold">Hessian</div>
          <div className="flex justify-between text-xs">
            <span>λ₁: {fmt(eigenvalues[0])}</span>
            <span>λ₂: {fmt(eigenvalues[eigenvalues.length - 1])}</span>
          </div>
          {conditionNumber && (
            <div className="text-xs text-gray-700 mt-0.5">κ = {conditionNumber.toFixed(1)}</div>
          )}
          {hessianCanvasRef && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                Matrix ▼
              </summary>
              <canvas
                ref={hessianCanvasRef}
                style={{ width: '100%', height: '100px' }}
                className="border border-gray-200 rounded mt-1"
              />
            </details>
          )}
        </div>
      )}
    </div>
  );
};
