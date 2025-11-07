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

  // Historical data
  gradNormHistory?: number[];
  lossHistory?: number[];
  alphaHistory?: number[];

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
  gradNormHistory,
  lossHistory,
  alphaHistory,
  eigenvalues,
  conditionNumber,
  lineSearchTrials,
  lineSearchCanvasRef,
  hessianCanvasRef,
  hessian,
  tolerance,
}) => {

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

  return (
    <div className="space-y-2 text-xs">
      {/* Iteration Header */}
      <div className="flex items-baseline justify-between">
        <div className="font-bold text-sm text-gray-900">
          Iter {iterNum + 1} / {totalIters}
        </div>
      </div>

      {/* Gradient Norm with Sparkline */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-600">Grad Norm:</span>
          <span className="font-mono font-bold">{fmt(gradNorm)}</span>
        </div>
        {sparklineData.length > 1 && (
          <svg width="100%" height="24" viewBox="0 0 100 20" preserveAspectRatio="none" className="overflow-visible">
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
          <svg width="100%" height="24" viewBox="0 0 100 20" preserveAspectRatio="none" className="overflow-visible">
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
          <svg width="100%" height="24" viewBox="0 0 100 20" preserveAspectRatio="none" className="overflow-visible">
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
      {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') &&
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
    </div>
  );
};
