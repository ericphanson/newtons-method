import React from 'react';
import { fmt, fmtVec, norm, sub } from '../shared-utils';
import type { AlgorithmSummary } from '../algorithms/types';

interface IterationMetricsProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
  iterNum: number;
  totalIters: number;

  // Current iteration data
  loss: number;
  gradNorm: number;
  weights: number[];
  alpha: number;
  gradient?: number[];
  direction?: number[];

  // Historical data
  gradNormHistory?: number[];
  lossHistory?: number[];
  alphaHistory?: number[];
  weightsHistory?: number[][];

  // Algorithm-specific data
  eigenvalues?: number[];
  conditionNumber?: number;
  lineSearchTrials?: number;

  // Line search data
  lineSearchCanvasRef?: React.RefObject<HTMLCanvasElement>;

  // Hessian data (Newton only)
  hessianCanvasRef?: React.RefObject<HTMLCanvasElement>;
  hessian?: number[][];

  // Diagonal preconditioner data
  hessianDiagonal?: number[];
  preconditioner?: number[];

  tolerance: number;

  // Convergence thresholds for sparklines
  ftol?: number;
  xtol?: number;

  // Convergence summary
  summary?: AlgorithmSummary | null;

  // Callbacks
  onIterationChange?: (iter: number) => void;
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
  gradNormHistory,
  lossHistory,
  alphaHistory,
  weightsHistory,
  eigenvalues,
  conditionNumber,
  lineSearchTrials,
  lineSearchCanvasRef,
  hessianCanvasRef,
  hessianDiagonal,
  preconditioner,
  summary,
  tolerance,
  ftol = 1e-9,
  xtol = 1e-9,
  onIterationChange,
}) => {

  // Handle sparkline clicks to jump to iteration
  const handleSparklineClick = (e: React.MouseEvent<SVGSVGElement>, dataLength: number) => {
    if (!onIterationChange) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedIndex = Math.round((x / rect.width) * (dataLength - 1));
    const clampedIndex = Math.max(0, Math.min(dataLength - 1, clickedIndex));
    onIterationChange(clampedIndex);
  };

  // Prepare sparkline data - show full history including future iterations
  const sparklineData = gradNormHistory && gradNormHistory.length > 0
    ? gradNormHistory
    : [gradNorm];
  const maxGradNormInHistory = Math.max(...sparklineData, 1);
  const minGradNormInHistory = Math.min(...sparklineData, 0);

  // Prepare loss sparkline data
  const lossSparklineData = lossHistory && lossHistory.length > 0
    ? lossHistory
    : [loss];
  const maxLossInHistory = Math.max(...lossSparklineData, 1);
  const minLossInHistory = Math.min(...lossSparklineData, 0);

  // Prepare alpha sparkline data
  const alphaSparklineData = alphaHistory && alphaHistory.length > 0
    ? alphaHistory
    : [alpha];
  const maxAlphaInHistory = Math.max(...alphaSparklineData, 1);
  const minAlphaInHistory = Math.min(...alphaSparklineData, 0);

  // Compute function change history (relative function change between iterations)
  const functionChangeHistory: number[] = [];
  if (lossHistory && lossHistory.length > 1) {
    for (let i = 1; i < lossHistory.length; i++) {
      const funcChange = Math.abs(lossHistory[i] - lossHistory[i - 1]);
      const relativeFuncChange = funcChange / Math.max(Math.abs(lossHistory[i]), 1e-8);
      functionChangeHistory.push(relativeFuncChange);
    }
  }
  const hasFunctionChangeData = functionChangeHistory.length > 0;
  const maxFunctionChange = hasFunctionChangeData ? Math.max(...functionChangeHistory, ftol * 10) : ftol * 10;
  const minFunctionChange = hasFunctionChangeData ? Math.min(...functionChangeHistory, 0) : 0;

  // Current function change
  const currentFunctionChange = functionChangeHistory.length > iterNum && iterNum > 0
    ? functionChangeHistory[iterNum - 1]
    : (functionChangeHistory.length > 0 ? functionChangeHistory[functionChangeHistory.length - 1] : 0);

  // Compute step size history (relative step size between iterations)
  const stepSizeHistory: number[] = [];
  if (weightsHistory && weightsHistory.length > 1) {
    for (let i = 1; i < weightsHistory.length; i++) {
      const stepSize = norm(sub(weightsHistory[i], weightsHistory[i - 1]));
      const relativeStepSize = stepSize / Math.max(norm(weightsHistory[i]), 1.0);
      stepSizeHistory.push(relativeStepSize);
    }
  }
  const hasStepSizeData = stepSizeHistory.length > 0;
  const maxStepSize = hasStepSizeData ? Math.max(...stepSizeHistory, xtol * 10) : xtol * 10;
  const minStepSize = hasStepSizeData ? Math.min(...stepSizeHistory, 0) : 0;

  // Current step size
  const currentStepSize = stepSizeHistory.length > iterNum && iterNum > 0
    ? stepSizeHistory[iterNum - 1]
    : (stepSizeHistory.length > 0 ? stepSizeHistory[stepSizeHistory.length - 1] : 0);

  return (
    <div className="space-y-2 text-xs">
      {/* Iteration Header */}
      <div className="flex items-baseline justify-between">
        <div className="font-bold text-sm text-gray-900">
          Iter {iterNum + 1} / {totalIters}
        </div>
      </div>

      {/* Convergence Status */}
      {summary && (
        <div className={`p-2 rounded border ${
          summary.diverged
            ? 'border-red-300 bg-red-50'
            : summary.stalled
            ? 'border-yellow-300 bg-yellow-50'
            : summary.converged
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {summary.converged && !summary.stalled && (
              <span className="text-green-600 font-semibold">✓ Converged</span>
            )}
            {summary.stalled && (
              <span className="text-yellow-600 font-semibold">⚠ Stalled</span>
            )}
            {summary.diverged && (
              <span className="text-red-600 font-semibold">✗ Diverged</span>
            )}
            {summary.convergenceCriterion === 'maxiter' && (
              <span className="text-gray-600 font-semibold">⋯ Max Iterations</span>
            )}
          </div>
          <div className="text-xs text-gray-700">
            {summary.terminationMessage}
          </div>
        </div>
      )}

      {/* Gradient Norm with Sparkline */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-600">Grad Norm:</span>
          <span className="font-mono font-bold">{fmt(gradNorm)}</span>
        </div>
        {sparklineData.length > 1 && (
          <svg
            width="100%"
            height="24"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="overflow-visible cursor-pointer"
            onClick={(e) => handleSparklineClick(e, sparklineData.length)}
          >
            {/* Tolerance threshold line - always visible, clamped to range */}
            <line
              x1="0"
              x2="100"
              y1={Math.max(2, Math.min(18, 18 - ((tolerance - minGradNormInHistory) / (maxGradNormInHistory - minGradNormInHistory || 1)) * 16))}
              y2={Math.max(2, Math.min(18, 18 - ((tolerance - minGradNormInHistory) / (maxGradNormInHistory - minGradNormInHistory || 1)) * 16))}
              stroke="#10b981"
              strokeWidth="0.3"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
              opacity="0.6"
            />
            {/* Sparkline path */}
            <path
              d={sparklineData.map((val, i) => {
                const x = (i / Math.max(sparklineData.length - 1, 1)) * 100;
                const y = 18 - ((val - minGradNormInHistory) / (maxGradNormInHistory - minGradNormInHistory || 1)) * 16;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Current position marker */}
            <circle
              cx={(iterNum / Math.max(sparklineData.length - 1, 1)) * 100}
              cy={18 - ((gradNorm - minGradNormInHistory) / (maxGradNormInHistory - minGradNormInHistory || 1)) * 16}
              r="1"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* Loss with Sparkline */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-600">Loss:</span>
          <span className="font-mono font-bold">{fmt(loss)}</span>
        </div>
        {lossSparklineData.length > 1 && (
          <svg
            width="100%"
            height="24"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="overflow-visible cursor-pointer"
            onClick={(e) => handleSparklineClick(e, lossSparklineData.length)}
          >
            {/* Sparkline path */}
            <path
              d={lossSparklineData.map((val, i) => {
                const x = (i / Math.max(lossSparklineData.length - 1, 1)) * 100;
                const y = 18 - ((val - minLossInHistory) / (maxLossInHistory - minLossInHistory || 1)) * 16;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Current position marker */}
            <circle
              cx={(iterNum / Math.max(lossSparklineData.length - 1, 1)) * 100}
              cy={18 - ((loss - minLossInHistory) / (maxLossInHistory - minLossInHistory || 1)) * 16}
              r="1"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* Step Size with Sparkline */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-600">Step α:</span>
          <span className="font-mono font-bold">{fmt(alpha)}</span>
        </div>
        {alphaSparklineData.length > 1 && (
          <svg
            width="100%"
            height="24"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="overflow-visible cursor-pointer"
            onClick={(e) => handleSparklineClick(e, alphaSparklineData.length)}
          >
            {/* Sparkline path */}
            <path
              d={alphaSparklineData.map((val, i) => {
                const x = (i / Math.max(alphaSparklineData.length - 1, 1)) * 100;
                const y = 18 - ((val - minAlphaInHistory) / (maxAlphaInHistory - minAlphaInHistory || 1)) * 16;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Current position marker */}
            <circle
              cx={(iterNum / Math.max(alphaSparklineData.length - 1, 1)) * 100}
              cy={18 - ((alpha - minAlphaInHistory) / (maxAlphaInHistory - minAlphaInHistory || 1)) * 16}
              r="1"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* Function Change with Sparkline */}
      {hasFunctionChangeData && (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-gray-600">Rel. Func. Change:</span>
            <span className="font-mono font-bold">{fmt(currentFunctionChange)}</span>
          </div>
          {functionChangeHistory.length > 0 && (
            <svg
              width="100%"
              height="24"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="overflow-visible cursor-pointer"
              onClick={(e) => handleSparklineClick(e, functionChangeHistory.length)}
            >
              {/* ftol threshold line - always visible, clamped to range */}
              <line
                x1="0"
                x2="100"
                y1={Math.max(2, Math.min(18, 18 - ((ftol - minFunctionChange) / (maxFunctionChange - minFunctionChange || 1)) * 16))}
                y2={Math.max(2, Math.min(18, 18 - ((ftol - minFunctionChange) / (maxFunctionChange - minFunctionChange || 1)) * 16))}
                stroke="#f59e0b"
                strokeWidth="0.3"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
                opacity="0.6"
              />
              {/* Sparkline path */}
              <path
                d={functionChangeHistory.map((val, i) => {
                  const x = (i / Math.max(functionChangeHistory.length - 1, 1)) * 100;
                  const y = 18 - ((val - minFunctionChange) / (maxFunctionChange - minFunctionChange || 1)) * 16;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current position marker */}
              {iterNum > 0 && (
                <circle
                  cx={((iterNum - 1) / Math.max(functionChangeHistory.length - 1, 1)) * 100}
                  cy={18 - ((currentFunctionChange - minFunctionChange) / (maxFunctionChange - minFunctionChange || 1)) * 16}
                  r="1"
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth="0.3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          )}
        </div>
      )}

      {/* Step Size with Sparkline */}
      {hasStepSizeData && (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-gray-600">Rel. Step Size:</span>
            <span className="font-mono font-bold">{fmt(currentStepSize)}</span>
          </div>
          {stepSizeHistory.length > 0 && (
            <svg
              width="100%"
              height="24"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              className="overflow-visible cursor-pointer"
              onClick={(e) => handleSparklineClick(e, stepSizeHistory.length)}
            >
              {/* xtol threshold line - always visible, clamped to range */}
              <line
                x1="0"
                x2="100"
                y1={Math.max(2, Math.min(18, 18 - ((xtol - minStepSize) / (maxStepSize - minStepSize || 1)) * 16))}
                y2={Math.max(2, Math.min(18, 18 - ((xtol - minStepSize) / (maxStepSize - minStepSize || 1)) * 16))}
                stroke="#f59e0b"
                strokeWidth="0.3"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
                opacity="0.6"
              />
              {/* Sparkline path */}
              <path
                d={stepSizeHistory.map((val, i) => {
                  const x = (i / Math.max(stepSizeHistory.length - 1, 1)) * 100;
                  const y = 18 - ((val - minStepSize) / (maxStepSize - minStepSize || 1)) * 16;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current position marker */}
              {iterNum > 0 && (
                <circle
                  cx={((iterNum - 1) / Math.max(stepSizeHistory.length - 1, 1)) * 100}
                  cy={18 - ((currentStepSize - minStepSize) / (maxStepSize - minStepSize || 1)) * 16}
                  r="1"
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth="0.3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          )}
        </div>
      )}

      {/* Parameters - Single Line */}
      <div className="pt-1 border-t border-gray-200">
        <div className="text-gray-600 mb-0.5">Parameters:</div>
        <div className="font-mono text-xs">
          w = {fmtVec(weights)}
        </div>
      </div>

      {/* Gradient - Compact */}
      {gradient && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5">Gradient:</div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-gray-900">[{gradient.map((g) => g.toFixed(3)).join(', ')}]</div>
            {gradient.length >= 2 && (
              <svg width="24" height="24" viewBox="-2 -2 28 28" className="flex-shrink-0">
                <defs>
                  <marker id="gradient-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#6b7280" />
                  </marker>
                </defs>
                <line
                  x1={12 - 8 * Math.cos(Math.atan2(-gradient[1], gradient[0]))}
                  y1={12 - 8 * Math.sin(Math.atan2(-gradient[1], gradient[0]))}
                  x2={12 + 8 * Math.cos(Math.atan2(-gradient[1], gradient[0]))}
                  y2={12 + 8 * Math.sin(Math.atan2(-gradient[1], gradient[0]))}
                  stroke="#6b7280"
                  strokeWidth="2"
                  markerEnd="url(#gradient-arrowhead)"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Direction - Compact */}
      {direction && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5">Direction:</div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-gray-900">[{direction.map((d) => d.toFixed(3)).join(', ')}]</div>
            {direction.length >= 2 && (
              <svg width="24" height="24" viewBox="-2 -2 28 28" className="flex-shrink-0">
                <defs>
                  <marker id="direction-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#6b7280" />
                  </marker>
                </defs>
                <line
                  x1={12 - 8 * Math.cos(Math.atan2(-direction[1], direction[0]))}
                  y1={12 - 8 * Math.sin(Math.atan2(-direction[1], direction[0]))}
                  x2={12 + 8 * Math.cos(Math.atan2(-direction[1], direction[0]))}
                  y2={12 + 8 * Math.sin(Math.atan2(-direction[1], direction[0]))}
                  stroke="#6b7280"
                  strokeWidth="2"
                  markerEnd="url(#direction-arrowhead)"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Line Search Visualization - Compact */}
      {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs' || algorithm === 'diagonal-precond') &&
        lineSearchCanvasRef && (
          <div className="pt-1 border-t border-gray-200">
            <div className="text-gray-600 mb-1 text-xs font-semibold">
              Line Search ({lineSearchTrials || 0} trials)
            </div>
            <canvas
              ref={lineSearchCanvasRef}
              style={{ width: '100%', height: '200px' }}
              className="border border-gray-200 rounded"
            />
          </div>
        )}

      {/* Hessian Info - Compact */}
      {algorithm === 'newton' && eigenvalues && eigenvalues.length >= 2 && (
        <div className="pt-1 border-t border-gray-200">
          <div className="text-gray-600 mb-0.5 text-xs font-semibold">Hessian</div>
          <div className="flex gap-4 text-xs">
            <span>λ₁: {fmt(eigenvalues[0])}</span>
            <span>λ₂: {fmt(eigenvalues[eigenvalues.length - 1])}</span>
          </div>
          {conditionNumber && (
            <div className="text-xs text-gray-700 mt-0.5">κ = {conditionNumber.toFixed(3)}</div>
          )}
          {hessianCanvasRef && (
            <div className="mt-1">
              <canvas
                ref={hessianCanvasRef}
                style={{ width: '100%', height: '300px' }}
                className="border border-gray-200 rounded"
              />
            </div>
          )}
        </div>
      )}

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
    </div>
  );
};
