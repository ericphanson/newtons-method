import React, { useRef, useEffect, useState } from 'react';
import { ProblemFunctions } from '../algorithms/types';
import { computeParamSweepIncremental, ParamSweepData } from '../utils/paramSweepComputation';
import { LineChart } from './LineChart';

interface ParamSweepProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
  problemFuncs: ProblemFunctions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseParams: any;
  paramName: string;
  paramDisplayName: string;
  paramValues: number[];
  paramFormatter?: (value: number) => string;
  yAxisLabel?: string;
  showLineSearchTrials?: boolean;
}

export const ParamSweep: React.FC<ParamSweepProps> = ({
  algorithm,
  problemFuncs,
  baseParams,
  paramName,
  paramDisplayName,
  paramValues,
  paramFormatter = (v) => v.toExponential(1),
  yAxisLabel = 'Iterations to Convergence',
  showLineSearchTrials = false
}) => {
  const taskIdRef = useRef(0);
  const [sweepData, setSweepData] = useState<ParamSweepData | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Track page visibility to prevent computation when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Compute sweep when params change
  useEffect(() => {
    const computeSweep = async () => {
      // Don't compute if tab is not visible
      if (!isVisible) {
        console.log('Parameter sweep skipped - tab not visible');
        return;
      }

      // Start new computation - clear old data to avoid showing stale results
      setSweepData(null);
      setIsComputing(true);
      setProgress(0);
      const taskId = ++taskIdRef.current;

      console.group('🚀 Parameter Sweep Started');
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Parameter: ${paramName} (${paramDisplayName})`);
      console.log(`Values: ${paramValues.length} points`);
      console.log(`Algorithm: ${algorithm}`);
      console.log(`Base params:`, baseParams);
      console.groupEnd();

      const result = await computeParamSweepIncremental(
        algorithm,
        problemFuncs,
        baseParams,
        paramName,
        paramValues,
        taskIdRef,
        taskId,
        (completed, total) => {
          setProgress(Math.floor((completed / total) * 100));
        }
      );

      if (result.data) {
        console.group('✅ Parameter Sweep Finished');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        if (result.timing) {
          console.log(`Total time: ${result.timing.totalTime.toFixed(1)}ms`);
          console.log(`Avg per point: ${result.timing.avgPerPoint.toFixed(1)}ms`);
        }
        console.groupEnd();

        setSweepData(result.data);
        setIsComputing(false);
      } else {
        // Computation was cancelled
        setIsComputing(false);
        setProgress(0);
      }
    };

    computeSweep();
  }, [
    algorithm,
    problemFuncs,
    paramName,
    paramDisplayName,
    // Serialize paramValues and baseParams to detect changes
    JSON.stringify(paramValues),
    JSON.stringify(baseParams)
    // Note: isVisible is intentionally NOT in dependencies
    // It should only prevent computation from starting, not trigger new ones
  ]);

  // Prepare data for charts (must be before conditional returns to satisfy hooks rules)
  const convergedPoints = sweepData?.points.filter(p => p.converged && !p.diverged) || [];
  const failedPoints = sweepData?.points.filter(p => !p.converged || p.diverged) || [];

  // Series 1: Iterations
  const iterationData = sweepData?.points.map(p => {
    // If didn't converge, show maxIter as a visual indicator
    if (!p.converged || p.diverged) {
      return baseParams.maxIter || p.iterations;
    }
    return p.iterations;
  }) || [];

  // Series 2: Final gradient norm (log scale indicators)
  const gradNormData = sweepData?.points.map(p => {
    if (!isFinite(p.finalGradNorm)) return 1; // Diverged
    return Math.max(1e-10, p.finalGradNorm); // Clamp for log scale
  }) || [];

  // Series 3: Line search trials (if applicable)
  const lineSearchData = sweepData?.points.map(p => p.avgLineSearchTrials || 0) || [];
  const hasLineSearchData = lineSearchData.some(v => v > 0);

  // Create title with failure indicator
  const chartTitle = failedPoints.length > 0
    ? `${yAxisLabel} vs ${paramDisplayName} (✗ = failed to converge)`
    : `${yAxisLabel} vs ${paramDisplayName}`;

  // Now do conditional returns AFTER all hooks
  if (!sweepData && !isComputing) {
    return null;
  }

  if (isComputing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-sm text-gray-600">
          Computing {paramDisplayName} sweep... {progress}%
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (!sweepData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary stats - compact single line */}
      <div className="text-xs text-gray-700 flex items-center gap-4">
        <span>
          <span className="text-green-700 font-semibold">{convergedPoints.length}</span>
          <span className="text-gray-500">/{sweepData.points.length} converged</span>
        </span>
        {failedPoints.length > 0 && (
          <span>
            <span className="text-red-700 font-semibold">{failedPoints.length}</span>
            <span className="text-gray-500"> failed</span>
          </span>
        )}
        {convergedPoints.length > 0 && (
          <span className="text-blue-700">
            Best: <span className="font-semibold">{Math.min(...convergedPoints.map(p => p.iterations))} iters</span>
            {' '}at {paramDisplayName} = {paramFormatter(
              convergedPoints.reduce((best, p) =>
                p.iterations < best.iterations ? p : best
              ).paramValue
            )}
          </span>
        )}
      </div>

      {/* Side-by-side charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 1: Iterations vs Parameter */}
        <div className="relative">
          <LineChart
            title={chartTitle}
            series={[
              {
                label: 'Iterations',
                data: iterationData,
                color: '#0d9488'
              }
            ]}
            xAxisLabel={paramDisplayName}
            yAxisLabel={yAxisLabel}
            height={250}
            showLegend={false}
            forceYMin={0}
            xTickLabels={sweepData.points.map(p => paramFormatter(p.paramValue))}
          />
          {/* Overlay X markers for failed points */}
          {failedPoints.length > 0 && (
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width="100%"
              height="250"
              viewBox="0 0 600 250"
              style={{ overflow: 'visible' }}
            >
              {sweepData.points.map((point, idx) => {
                if (point.converged && !point.diverged) return null;

                // Calculate position (matching LineChart layout)
                const MARGIN = { top: 15, right: 20, bottom: 30, left: 55 };
                const PLOT_WIDTH = 600 - MARGIN.left - MARGIN.right;
                const x = MARGIN.left + (idx / Math.max(sweepData.points.length - 1, 1)) * PLOT_WIDTH;
                const y = MARGIN.top + 10; // Near top of chart

                return (
                  <g key={idx}>
                    {/* Red X marker */}
                    <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} stroke="#dc2626" strokeWidth="2.5" />
                    <line x1={x - 5} y1={y + 5} x2={x + 5} y2={y - 5} stroke="#dc2626" strokeWidth="2.5" />
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Chart 2: Line search trials (if applicable) */}
        {showLineSearchTrials && hasLineSearchData && (
          <LineChart
            title={`Avg Line Search Trials vs ${paramDisplayName}`}
            series={[
              {
                label: 'Avg Trials',
                data: lineSearchData,
                color: '#8b5cf6'
              }
            ]}
            xAxisLabel={paramDisplayName}
            yAxisLabel="Avg Backtracking Steps"
            height={250}
            showLegend={false}
            forceYMin={0}
            xTickLabels={sweepData.points.map(p => paramFormatter(p.paramValue))}
          />
        )}
      </div>

      {/* Data table for detailed inspection */}
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          View detailed data ({sweepData.points.length} points)
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">{paramDisplayName}</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Iterations</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Final Loss</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Grad Norm</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                {hasLineSearchData && (
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Avg LS Trials</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sweepData.points.map((point, idx) => (
                <tr key={idx} className={point.converged ? '' : 'bg-red-50'}>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {paramFormatter(point.paramValue)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {point.iterations}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-xs">
                    {point.finalLoss.toExponential(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-xs">
                    {point.finalGradNorm.toExponential(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {point.diverged ? (
                      <span className="text-red-700 font-semibold">DIV</span>
                    ) : point.converged ? (
                      <span className="text-green-700">✓</span>
                    ) : point.stalled ? (
                      <span className="text-yellow-700">STALL</span>
                    ) : (
                      <span className="text-gray-500">MAX</span>
                    )}
                  </td>
                  {hasLineSearchData && (
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      {point.avgLineSearchTrials?.toFixed(1) || '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
