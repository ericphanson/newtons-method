import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { GlossaryTooltip } from '../GlossaryTooltip';
import { resolveProblem, requiresDataset } from '../../problems/registry';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { fmt, fmtVec } from '../../shared-utils';
import { Pseudocode, Var, Complexity } from '../Pseudocode';
import { ArmijoLineSearch } from '../ArmijoLineSearch';
import { LineChart } from '../LineChart';
import type { ProblemFunctions } from '../../algorithms/types';
import type { LBFGSIteration } from '../../algorithms/lbfgs';
import type { ExperimentPreset } from '../../types/experiments';
import { computeIterationSummary } from '../../utils/iterationSummaryUtils';

interface LbfgsTabProps {
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;
  lbfgsC1: number;
  onLbfgsC1Change: (val: number) => void;
  lbfgsM: number;
  onLbfgsMChange: (val: number) => void;
  lbfgsHessianDamping: number;
  onLbfgsHessianDampingChange: (val: number) => void;
  lbfgsTolerance: number;
  onLbfgsToleranceChange: (val: number) => void;
  iterations: LBFGSIteration[];
  currentIter: number;
  onIterChange: (val: number) => void;
  onResetIter: () => void;
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  problemParameters: Record<string, number | string>;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  paramCanvasRef: React.RefObject<HTMLCanvasElement>;
  lineSearchCanvasRef: React.RefObject<HTMLCanvasElement>;
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
  configurationExpanded?: boolean;
  onConfigurationExpandedChange?: (expanded: boolean) => void;
}

export const LbfgsTab: React.FC<LbfgsTabProps> = ({
  maxIter,
  onMaxIterChange,
  initialW0,
  onInitialW0Change,
  initialW1,
  onInitialW1Change,
  lbfgsC1,
  onLbfgsC1Change,
  lbfgsM,
  onLbfgsMChange,
  lbfgsHessianDamping,
  onLbfgsHessianDampingChange,
  lbfgsTolerance,
  onLbfgsToleranceChange,
  iterations,
  currentIter,
  onIterChange,
  problemFuncs,
  problem: problemDefinition,
  currentProblem,
  problemParameters,
  bounds,
  paramCanvasRef,
  lineSearchCanvasRef,
  experimentLoading,
  onLoadExperiment,
  configurationExpanded,
  onConfigurationExpandedChange,
}) => {
  const experiments = React.useMemo(
    () => getExperimentsForAlgorithm('lbfgs'),
    []
  );

  // Extract eigenvalue evolution history for sparklines
  const hessianMetrics = React.useMemo(() => {
    if (!iterations || iterations.length === 0) return null;

    // Find iterations with hessian comparison data
    const iterationsWithHessian = iterations
      .map((iter, index) => ({ iter, originalIndex: index }))
      .filter(({ iter }) => iter.hessianComparison);

    if (iterationsWithHessian.length === 0) return null;

    const lambda1True: number[] = [];
    const lambda1Approx: number[] = [];
    const lambda2True: number[] = [];
    const lambda2Approx: number[] = [];
    const lambdaMinTrue: number[] = [];
    const lambdaMinApprox: number[] = [];
    const lambdaMaxTrue: number[] = [];
    const lambdaMaxApprox: number[] = [];
    const conditionNumber: number[] = [];
    const frobeniusErrorPercent: number[] = [];
    const indices: number[] = [];

    iterationsWithHessian.forEach(({ iter, originalIndex }) => {
      const hc = iter.hessianComparison!;
      indices.push(originalIndex);

      // True eigenvalues
      if (hc.trueEigenvalues) {
        lambda1True.push(hc.trueEigenvalues.lambda1);
        lambda2True.push(hc.trueEigenvalues.lambda2);
        lambdaMinTrue.push(Math.min(hc.trueEigenvalues.lambda1, hc.trueEigenvalues.lambda2));
        lambdaMaxTrue.push(Math.max(hc.trueEigenvalues.lambda1, hc.trueEigenvalues.lambda2));
      }

      // Approximate eigenvalues
      lambda1Approx.push(hc.approximateEigenvalues.lambda1);
      lambda2Approx.push(hc.approximateEigenvalues.lambda2);
      lambdaMinApprox.push(Math.min(hc.approximateEigenvalues.lambda1, hc.approximateEigenvalues.lambda2));
      lambdaMaxApprox.push(Math.max(hc.approximateEigenvalues.lambda1, hc.approximateEigenvalues.lambda2));

      // Condition number Q = λ_max / λ_min
      const lambdaMax = Math.max(hc.approximateEigenvalues.lambda1, hc.approximateEigenvalues.lambda2);
      const lambdaMin = Math.min(hc.approximateEigenvalues.lambda1, hc.approximateEigenvalues.lambda2);
      if (lambdaMin > 1e-12) {
        conditionNumber.push(lambdaMax / lambdaMin);
      } else {
        conditionNumber.push(1e6); // Cap at large value for display
      }

      // Frobenius error as percentage
      if (hc.frobeniusError !== null && hc.frobeniusError !== undefined && hc.trueHessian) {
        const frobeniusNormH = Math.sqrt(hc.trueHessian.reduce((sum, row) =>
          sum + row.reduce((rowSum, val) => rowSum + val * val, 0), 0));
        const relativeError = (hc.frobeniusError / frobeniusNormH) * 100;
        frobeniusErrorPercent.push(relativeError);
      }
    });

    // Map current iteration to sparkline index
    const sparklineIndex = indices.indexOf(currentIter);

    return {
      lambda1True,
      lambda1Approx,
      lambda2True,
      lambda2Approx,
      lambdaMinTrue,
      lambdaMinApprox,
      lambdaMaxTrue,
      lambdaMaxApprox,
      conditionNumber,
      frobeniusErrorPercent,
      sparklineIndex: sparklineIndex >= 0 ? sparklineIndex : 0,
      indices, // Return indices to map clicks back to iteration numbers
    };
  }, [iterations, currentIter]);

  // Handler to map sparkline clicks to iteration changes
  const handleSparklineClick = React.useCallback((sparklineIdx: number) => {
    if (hessianMetrics?.indices && sparklineIdx >= 0 && sparklineIdx < hessianMetrics.indices.length) {
      onIterChange(hessianMetrics.indices[sparklineIdx]);
    }
  }, [hessianMetrics, onIterChange]);

  return (
    <>
      {/* 1. Configuration Section */}
      <CollapsibleSection
        title="Algorithm Configuration"
        defaultExpanded={false}
        expanded={configurationExpanded}
        onExpandedChange={onConfigurationExpandedChange}
        data-scroll-target="configuration"
      >
        <AlgorithmConfiguration
          algorithm="lbfgs"
          maxIter={maxIter}
          onMaxIterChange={onMaxIterChange}
          initialW0={initialW0}
          onInitialW0Change={onInitialW0Change}
          initialW1={initialW1}
          onInitialW1Change={onInitialW1Change}
          lbfgsC1={lbfgsC1}
          onLbfgsC1Change={onLbfgsC1Change}
          lbfgsM={lbfgsM}
          onLbfgsMChange={onLbfgsMChange}
          lbfgsHessianDamping={lbfgsHessianDamping}
          onLbfgsHessianDampingChange={onLbfgsHessianDampingChange}
          lbfgsTolerance={lbfgsTolerance}
          onLbfgsToleranceChange={onLbfgsToleranceChange}
          problemFuncs={problemFuncs}
          problem={problemDefinition}
          currentProblem={currentProblem}
          bounds={bounds}
        />
      </CollapsibleSection>

      {/* 2. Side-by-Side: Canvas + Metrics */}
      <div className="flex gap-4 mb-6" data-scroll-target="canvas">
        {/* Left: Parameter Space Visualization */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Parameter Space</h3>
          <p className="text-sm text-gray-600 mb-3">
            Loss landscape. Orange path = trajectory. Red dot = current position.
          </p>

          <canvas ref={paramCanvasRef} style={{ width: '100%', height: '500px' }} className="border border-gray-300 rounded" />

          {/* Legend for optimum markers */}
          {!requiresDataset(currentProblem) && (
            <div className="mt-3 flex gap-4 text-sm text-gray-700">
              {(() => {
                const problem = resolveProblem(currentProblem, problemParameters);
                return (
                  <>
                    {problem.globalMinimum && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">★</span>
                        <span>Global minimum</span>
                      </div>
                    )}
                    {problem.criticalPoint && (
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
        {iterations.length > 0 && iterations[currentIter] && (
          <div className="w-80 bg-white rounded-lg shadow-md p-4" data-scroll-target="metrics">
            <IterationMetrics
              algorithm="lbfgs"
              iterNum={currentIter}
              totalIters={iterations.length}
              loss={iterations[currentIter].newLoss}
              gradNorm={iterations[currentIter].gradNorm}
              weights={iterations[currentIter].wNew}
              alpha={iterations[currentIter].alpha}
              gradient={iterations[currentIter].grad}
              direction={iterations[currentIter].direction}
              gradNormHistory={iterations.map(iter => iter.gradNorm)}
              lossHistory={iterations.map(iter => iter.newLoss)}
              alphaHistory={iterations.map(iter => iter.alpha)}
              weightsHistory={iterations.map(iter => iter.wNew)}
              lineSearchTrials={iterations[currentIter].lineSearchTrials?.length}
              lineSearchCanvasRef={lineSearchCanvasRef}
              tolerance={lbfgsTolerance}
              ftol={1e-9}
              xtol={1e-9}
              summary={computeIterationSummary({
                currentIndex: currentIter,
                totalIterations: iterations.length,
                gradNorm: iterations[currentIter].gradNorm,
                loss: iterations[currentIter].newLoss,
                location: iterations[currentIter].wNew,
                gtol: lbfgsTolerance,
                ftol: 1e-9,
                xtol: 1e-9,
                isSecondOrder: true,
                maxIter,
                previousLoss: currentIter > 0 ? iterations[currentIter - 1].newLoss : undefined,
                previousLocation: currentIter > 0 ? iterations[currentIter - 1].wNew : undefined
              })}
              onIterationChange={onIterChange}
            />
          </div>
        )}
      </div>

      {/* L-BFGS Memory Section */}
      <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg shadow-md p-6 mb-6" data-scroll-target="lbfgs-memory">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">L-BFGS Memory</h2>
        <div className="space-y-3 text-gray-800 mb-4">
          <p><strong>What it is:</strong> Instead of storing the full Hessian <InlineMath>\varH</InlineMath> (n×n matrix), we store only <InlineMath>\varM</InlineMath>={lbfgsM} recent (<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>) pairs.</p>
          <p><InlineMath>\varS</InlineMath> = parameter change = <InlineMath>{String.raw`w_{\text{new}} - w_{\text{old}}`}</InlineMath> (where we moved)</p>
          <p><InlineMath>\varY</InlineMath> = gradient change = <InlineMath>{String.raw`\nabla f_{\text{new}} - \nabla f_{\text{old}}`}</InlineMath> (how the slope changed)</p>
          <p><strong>Acceptance criteria:</strong> L-BFGS only stores pairs where <InlineMath>{String.raw`\varS^T \varY > 0`}</InlineMath> (positive curvature). This helps maintain positive definiteness of the approximate Hessian <InlineMath>\varB</InlineMath>, promoting descent directions even in non-convex regions where the true Hessian <InlineMath>\varH</InlineMath> may have negative eigenvalues.</p>
        </div>

        {/* Memory table */}
        {iterations[currentIter]?.allCurvaturePairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
              <thead className="bg-amber-200">
                <tr>
                  <th className="px-4 py-2 text-left">Pair</th>
                  <th className="px-4 py-2 text-left">s (parameter change)</th>
                  <th className="px-4 py-2 text-left">y (gradient change)</th>
                  <th className="px-4 py-2 text-left">sᵀy</th>
                  <th className="px-4 py-2 text-left bg-amber-300">sᵀy {'>'} 0?</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Find which accepted pairs are in active memory (last M accepted pairs)
                  const acceptedPairs = iterations[currentIter].allCurvaturePairs
                    .map((p, idx) => ({ pair: p, originalIdx: idx }))
                    .filter(p => p.pair.accepted);
                  const activeMemoryStartIdx = Math.max(0, acceptedPairs.length - lbfgsM);
                  const activeMemoryIndices = new Set(
                    acceptedPairs.slice(activeMemoryStartIdx).map(p => p.originalIdx)
                  );

                  return iterations[currentIter].allCurvaturePairs.map((pair, idx) => {
                    const isInActiveMemory = activeMemoryIndices.has(idx);
                    const isGrayedOut = !isInActiveMemory;

                    return (
                      <tr key={idx} className={`border-t ${
                        isInActiveMemory ? 'border-amber-200' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <td className={`px-4 py-2 font-mono ${isGrayedOut ? 'text-gray-400' : ''}`}>{idx + 1}</td>
                        <td className={`px-4 py-2 font-mono ${isGrayedOut ? 'text-gray-400' : ''}`}>{fmtVec(pair.s)}</td>
                        <td className={`px-4 py-2 font-mono ${isGrayedOut ? 'text-gray-400' : ''}`}>{fmtVec(pair.y)}</td>
                        <td className={`px-4 py-2 font-mono ${isGrayedOut ? 'text-gray-400' : ''}`}>{fmt(pair.sTy)}</td>
                        <td className="px-4 py-2">
                          {pair.accepted ? (
                            <span className={`font-bold ${isInActiveMemory ? 'text-green-700' : 'text-gray-400'}`}>
                              ✓ Accepted{!isInActiveMemory && ' (evicted)'}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold">✗ Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center">
            <p className="text-amber-800 font-semibold">No curvature pairs yet (Iteration 0)</p>
            <p className="text-sm text-amber-700 mt-2">Curvature pairs will be computed starting from iteration 1. First iteration uses steepest descent direction.</p>
          </div>
        )}
      </div>

      {/* Approximate Hessian Comparison */}
      <CollapsibleSection
        title="Approximate Hessian Comparison (2D Visualization)"
        defaultExpanded={true}
        storageKey="lbfgs-hessian-comparison"
        id="approximate-hessian"
      >
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="font-bold text-yellow-900">Note: L-BFGS never computes this matrix!</p>
            <p className="text-sm text-yellow-800 mt-1">
              We reconstruct the approximate Hessian here in 2D just to show approximation quality.
              In practice, L-BFGS works implicitly through the two-loop recursion without ever forming
              the full Hessian matrix. This visualization is only possible in low dimensions.
            </p>
          </div>

          {iterations[currentIter]?.hessianComparison ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* True Hessian */}
                {iterations[currentIter].hessianComparison.trueHessian && (
                  (() => {
                    const matrixStr = iterations[currentIter].hessianComparison.trueHessian!.map(row =>
                      row.map(val => val.toFixed(2)).join(' & ')
                    ).join(' \\\\\\\\ ');
                    const lambda1 = fmt(iterations[currentIter].hessianComparison.trueEigenvalues?.lambda1 ?? 0);
                    const lambda2 = fmt(iterations[currentIter].hessianComparison.trueEigenvalues?.lambda2 ?? 0);
                    return (
                      <div className="bg-white rounded-lg p-4 shadow">
                        <h3 className="text-lg font-bold text-purple-900 mb-3">True Hessian <InlineMath>\varH</InlineMath></h3>
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-gray-700">Matrix:</p>
                            <BlockMath>{String.raw`\begin{pmatrix} ` + matrixStr + String.raw` \end{pmatrix}`}</BlockMath>
                          </div>
                          {iterations[currentIter].hessianComparison.trueEigenvalues && (
                            <div>
                              <p className="font-semibold text-gray-700">Eigenvalues:</p>
                              <p className="text-sm">
                                <InlineMath>{String.raw`\lambda_1 = ` + lambda1}</InlineMath>,{' '}
                                <InlineMath>{String.raw`\lambda_2 = ` + lambda2}</InlineMath>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Approximate Hessian */}
                {(() => {
                  const matrixStr = iterations[currentIter].hessianComparison.approximateHessian.map(row =>
                    row.map(val => val.toFixed(2)).join(' & ')
                  ).join(' \\\\\\\\ ');
                  const lambda1 = fmt(iterations[currentIter].hessianComparison.approximateEigenvalues?.lambda1 ?? 0);
                  const lambda2 = fmt(iterations[currentIter].hessianComparison.approximateEigenvalues?.lambda2 ?? 0);
                  return (
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="text-lg font-bold text-purple-900 mb-3">Approximate Hessian <InlineMath>\varB</InlineMath></h3>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-gray-700">Matrix:</p>
                          <BlockMath>{String.raw`\begin{pmatrix} ` + matrixStr + String.raw` \end{pmatrix}`}</BlockMath>
                        </div>
                        {iterations[currentIter].hessianComparison.approximateEigenvalues && (
                          <div>
                            <p className="font-semibold text-gray-700">Eigenvalues:</p>
                            <p className="text-sm">
                              <InlineMath>{String.raw`\lambda_1 = ` + lambda1}</InlineMath>,{' '}
                              <InlineMath>{String.raw`\lambda_2 = ` + lambda2}</InlineMath>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Error metric */}
              {iterations[currentIter].hessianComparison.frobeniusError !== null && iterations[currentIter].hessianComparison.frobeniusError !== undefined && iterations[currentIter].hessianComparison.trueHessian && (
                (() => {
                  const trueHessian = iterations[currentIter].hessianComparison.trueHessian!;
                  const frobeniusNormH = Math.sqrt(trueHessian.reduce((sum, row) =>
                    sum + row.reduce((rowSum, val) => rowSum + val * val, 0), 0));
                  const relativeError = (iterations[currentIter].hessianComparison.frobeniusError! / frobeniusNormH) * 100;
                  const errorStr = relativeError.toFixed(1);
                  return (
                    <div className="bg-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-purple-900 mb-3">Approximation Error</h3>

                      {hessianMetrics && hessianMetrics.frobeniusErrorPercent.length > 1 ? (
                        <div className="grid grid-cols-5 gap-4 items-center">
                          {/* Left: Formula and text - takes 2/5 columns */}
                          <div className="col-span-2">
                            <p>
                              Relative Error: <InlineMath>{String.raw`\frac{\|H - B\|_F}{\|H\|_F} = ` + errorStr + String.raw`\%`}</InlineMath>
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              Lower is better. As L-BFGS builds memory, the approximation typically improves.
                            </p>
                          </div>

                          {/* Right: Evolution chart - takes 3/5 columns */}
                          <div className="col-span-3">
                            <LineChart
                              title={<span className="sr-only">Error Evolution</span>}
                              series={[
                                {
                                  label: 'Relative Error (%)',
                                  data: hessianMetrics.frobeniusErrorPercent,
                                  color: '#7c3aed',
                                  strokeDasharray: undefined,
                                },
                              ]}
                              currentIndex={hessianMetrics.sparklineIndex}
                              xAxisLabel="Iter"
                              yAxisLabel="%"
                              onPointSelect={handleSparklineClick}
                              height={110}
                              transparentBackground={true}
                              showLegend={false}
                              forceYMin={0}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>
                            Relative Error: <InlineMath>{String.raw`\frac{\|H - B\|_F}{\|H\|_F} = ` + errorStr + String.raw`\%`}</InlineMath>
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
                            Lower is better. As L-BFGS builds memory, the approximation typically improves.
                          </p>
                        </>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Eigenvalue Evolution Charts */}
              {hessianMetrics && hessianMetrics.lambda1Approx.length > 1 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-bold text-purple-900">Eigenvalue Evolution Over Iterations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Watch how L-BFGS's approximate Hessian eigenvalues converge to the true Hessian as memory builds.
                    Click any plot to jump to that iteration.
                  </p>

                  {/* Two charts: one for lambda_max, one for lambda_min */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Lambda Max Plot */}
                    {hessianMetrics.lambdaMaxTrue.length > 0 && (
                      <LineChart
                        title={<>Maximum Eigenvalue (<InlineMath>{String.raw`\lambda_{\max}`}</InlineMath>)</>}
                        series={[
                          {
                            label: 'True H',
                            data: hessianMetrics.lambdaMaxTrue,
                            color: '#9333ea',
                            strokeDasharray: undefined,
                          },
                          {
                            label: 'Approx B',
                            data: hessianMetrics.lambdaMaxApprox,
                            color: '#f59e0b',
                            strokeDasharray: '6,3',
                          },
                        ]}
                        currentIndex={hessianMetrics.sparklineIndex}
                        xAxisLabel="Iteration"
                        yAxisLabel="λ_max"
                        onPointSelect={handleSparklineClick}
                        height={250}
                      />
                    )}

                    {/* Lambda Min Plot */}
                    {hessianMetrics.lambdaMinTrue.length > 0 && (
                      <LineChart
                        title={<>Minimum Eigenvalue (<InlineMath>{String.raw`\lambda_{\min}`}</InlineMath>)</>}
                        series={[
                          {
                            label: 'True H',
                            data: hessianMetrics.lambdaMinTrue,
                            color: '#9333ea',
                            strokeDasharray: undefined,
                          },
                          {
                            label: 'Approx B',
                            data: hessianMetrics.lambdaMinApprox,
                            color: '#f59e0b',
                            strokeDasharray: '6,3',
                          },
                        ]}
                        currentIndex={hessianMetrics.sparklineIndex}
                        xAxisLabel="Iteration"
                        yAxisLabel="λ_min"
                        onPointSelect={handleSparklineClick}
                        height={250}
                        forcedYTicks={[0]}
                      />
                    )}
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 rounded p-3 mt-4">
                    <p><strong>Reading these plots:</strong></p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Dashed orange (Approx B) should converge to solid purple (True H)</li>
                      <li>Zero line in <InlineMath>{String.raw`\lambda_{\min}`}</InlineMath> shows positive/negative curvature boundary</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <p className="text-purple-800 font-semibold">Hessian comparison not available yet</p>
              <p className="text-sm text-purple-700 mt-2">
                This visualization will appear when Hessian comparison data is computed.
              </p>
            </div>
          )}
      </CollapsibleSection>

      {/* L-BFGS - Quick Start */}
      <CollapsibleSection
        title="Quick Start"
        defaultExpanded={true}
        storageKey="lbfgs-quick-start"
        id="quick-start"
      >
        <div className="space-y-3 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">What is L-BFGS?</h3>
            <p>
              Newton's method uses the search direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`H^{-1}\nabla f`}</InlineMath></Var> for smarter steps,
              but computing the Hessian <InlineMath>\varH</InlineMath> costs <InlineMath>O(d^3)</InlineMath> and storing it costs <InlineMath>O(d^2)</InlineMath>. <strong>L-BFGS approximates</strong> the same direction using only <InlineMath>\varM</InlineMath> recent gradient changes, requiring just <InlineMath>O(Md)</InlineMath> memory and <InlineMath>O(Md)</InlineMath> time per iteration.
              No Hessian matrix is ever formed or inverted!
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">When to Use</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Large-scale problems where Newton's method (<InlineMath>O(d^3)</InlineMath> cost) is prohibitively expensive</li>
              <li>Non-convex optimization near saddle points — L-BFGS only uses positive curvature (<InlineMath>{`s^T y > 0`}</InlineMath>), making it more robust than Newton</li>
              <li>Smooth, differentiable objectives</li>
              <li>When gradient descent is too slow but full second-order methods are too expensive</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Key Parameters</h3>
            <p className="mb-1">
              <strong><InlineMath>\varM</InlineMath> (memory size):</strong> Number of recent gradient changes to store.
              Larger <InlineMath>\varM</InlineMath> gives better Hessian approximation but costs more computation (<InlineMath>O(Md)</InlineMath> per iteration).
              Trade-off between approximation quality and computational cost.
            </p>
            <p>
              <strong>Hessian Damping (<InlineMath>\varLambdaDamp</InlineMath>):</strong> Regularization for numerical stability.
              <InlineMath>\varLambdaDamp</InlineMath> = 0 gives pure L-BFGS; increasing <InlineMath>\varLambdaDamp</InlineMath> adds more regularization, eventually reducing to gradient descent as <InlineMath>{String.raw`\lambda_{\text{damp}} \to \infty`}</InlineMath>.
            </p>
          </div>

          <div className="bg-amber-100 rounded p-3">
            <p className="font-bold text-sm mb-1">Want to understand how it works?</p>
            <p className="text-sm">
              Expand <strong>"How L-BFGS Works"</strong> below for the full algorithm and mathematical details.
              Or jump straight to <strong>"Try This"</strong> to run experiments!
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS - Try This */}
      <CollapsibleSection
        title="Try This"
        defaultExpanded={true}
        storageKey="lbfgs-try-this"
        id="try-this"
      >
        <div className="space-y-3">
          <p className="text-gray-800 mb-4">
            Run these experiments to see L-BFGS in action and understand how memory affects performance:
          </p>

          <ExperimentCardList
            experiments={experiments}
            experimentLoading={experimentLoading}
            onLoadExperiment={onLoadExperiment}
          />
        </div>
      </CollapsibleSection>

      {/* How L-BFGS Works - Comprehensive Deep Dive */}
      <CollapsibleSection
        title="How L-BFGS Works"
        defaultExpanded={false}
        storageKey="lbfgs-how-it-works"
        id="how-it-works"
      >
        <div className="space-y-6 text-gray-800">
          {/* High-Level Algorithm */}
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-3">The Algorithm</h3>
            <Pseudocode
              color="indigo"
              inputs={[
                {
                  id: "w_0",
                  display: <InlineMath>{`w_0 \\in \\mathbb{R}^d`}</InlineMath>,
                  description: "initial parameter vector"
                },
                {
                  id: "f",
                  display: <InlineMath>f</InlineMath>,
                  description: "objective function to minimize"
                },
                {
                  id: "M",
                  display: <InlineMath>M</InlineMath>,
                  description: "memory size (number of recent pairs to keep)"
                },
                {
                  id: "lambda_damp",
                  display: <InlineMath>{`\\lambda_{\\text{damp}}`}</InlineMath>,
                  description: "Hessian damping parameter"
                }
              ]}
              outputs={[
                {
                  id: "w_star",
                  display: <InlineMath>{`w^*`}</InlineMath>,
                  description: "optimized parameter vector"
                }
              ]}
              steps={[
                <>Initialize <Var id="w" type="vector ℝᵈ"><InlineMath>w</InlineMath></Var> ← <Var id="w_0" type="vector ℝᵈ"><InlineMath>{`w_0`}</InlineMath></Var>, history = [ ] (empty list of pairs)</>,
                <><strong>repeat</strong> until convergence:</>,
                <>
                  <span className="ml-4">Compute gradient <Var id="grad" type="vector ℝᵈ"><InlineMath>\nabla f(w)</InlineMath></Var> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Use <strong>two-loop recursion</strong> to compute <Var id="p" type="vector ℝᵈ"><InlineMath>p</InlineMath></Var> ≈ −<Var id="H_inv" type="d×d matrix (implicit)"><InlineMath>{`H^{-1}`}</InlineMath></Var><Var id="grad" type="vector ℝᵈ"><InlineMath>\nabla f</InlineMath></Var> from history <Complexity explanation="M pairs × d, vector ops only">O(Md)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Line search for step size <Var id="alpha" type="scalar"><InlineMath>\alpha</InlineMath></Var> <Complexity explanation="Backtracking">≈1-4 f evals</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Save old gradient <Var id="grad_old" type="vector ℝᵈ"><InlineMath>{'\\nabla f_{\\text{old}}'}</InlineMath></Var> ← <Var id="grad" type="vector ℝᵈ"><InlineMath>\nabla f</InlineMath></Var></span>
                </>,
                <>
                  <span className="ml-4"><Var id="w" type="vector ℝᵈ"><InlineMath>w</InlineMath></Var> ← <Var id="w" type="vector ℝᵈ"><InlineMath>w</InlineMath></Var> + <Var id="alpha" type="scalar"><InlineMath>\alpha</InlineMath></Var> <Var id="p" type="vector ℝᵈ"><InlineMath>p</InlineMath></Var> <Complexity>O(d)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Compute new gradient <Var id="grad" type="vector ℝᵈ"><InlineMath>\nabla f(w)</InlineMath></Var> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Store new pair: <Var id="s" type="vector ℝᵈ"><InlineMath>s</InlineMath></Var> ← <Var id="alpha" type="scalar"><InlineMath>\alpha</InlineMath></Var> <Var id="p" type="vector ℝᵈ"><InlineMath>p</InlineMath></Var>, <Var id="y" type="vector ℝᵈ"><InlineMath>y</InlineMath></Var> ← <Var id="grad" type="vector ℝᵈ"><InlineMath>\nabla f</InlineMath></Var> − <Var id="grad_old" type="vector ℝᵈ"><InlineMath>{'\\nabla f_{\\text{old}}'}</InlineMath></Var> <Complexity>O(d)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Add (<Var id="s" type="vector ℝᵈ"><InlineMath>s</InlineMath></Var>, <Var id="y" type="vector ℝᵈ"><InlineMath>y</InlineMath></Var>) to history; if |history| {'>'} <Var id="M" type="scalar"><InlineMath>M</InlineMath></Var>, remove oldest pair <Complexity>O(1)</Complexity></span>
                </>,
                <><strong>return</strong> <Var id="w" type="vector ℝᵈ"><InlineMath>w</InlineMath></Var></>
              ]}
            />
          </div>

          {/* Building Intuition */}
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-3">Building Intuition: From Taylor Series to BFGS</h3>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
              <p className="font-semibold text-blue-900 mb-3">Why (s, y) pairs capture curvature:</p>

              <p className="text-sm text-blue-800 mb-2">
                <strong>1. Taylor expansion:</strong> The gradient at a new point relates to the old gradient via the Hessian <InlineMath>\varH</InlineMath>:<br/>
                <span className="ml-4 inline-block my-1">
                  <InlineMath>{String.raw`\nabla f(w_{\text{new}}) \approx \nabla f(w_{\text{old}}) + \varH \cdot \varS`}</InlineMath>
                </span><br/>
                where <InlineMath>\varS</InlineMath> = <InlineMath>{String.raw`w_{\text{new}} - w_{\text{old}}`}</InlineMath> is the parameter change (where we stepped).
              </p>

              <p className="text-sm text-blue-800 mb-2">
                <strong>2. Rearranging:</strong> Define <InlineMath>\varY</InlineMath> = <InlineMath>{String.raw`\nabla f(w_{\text{new}}) - \nabla f(w_{\text{old}})`}</InlineMath> (gradient change, how the slope changed). Then:<br/>
                <span className="ml-4 inline-block my-1"><InlineMath>{String.raw`\varY = \varH \cdot \varS`}</InlineMath></span><br/>
                <span className="ml-4 inline-block my-1"><InlineMath>{String.raw`\varH^{-1} \cdot \varY = \varS`}</InlineMath></span> (the <strong>secant equation</strong>)
              </p>

              <p className="text-sm text-blue-800 mb-2">
                <strong>3. Why we want this:</strong> If our approximate inverse Hessian <InlineMath>{String.raw`\varB^{-1}`}</InlineMath> satisfies <InlineMath>{String.raw`\varB^{-1} \cdot \varY = \varS`}</InlineMath> for all our observed (<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>) pairs, then <InlineMath>{String.raw`\varB^{-1}`}</InlineMath> plays the same role as <InlineMath>{String.raw`\varH^{-1}`}</InlineMath> in the Taylor expansion. It correctly relates parameter changes to gradient changes!
              </p>

              <div className="bg-amber-50 border border-amber-400 rounded p-3 my-2">
                <p className="text-sm text-amber-900 font-semibold mb-2">
                  🛡️ Curvature Filtering: L-BFGS's Secret to Robustness
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  <strong>Key difference from Newton:</strong> L-BFGS <strong>only accepts pairs where s<sup>T</sup>y &gt; 0</strong> (positive curvature). Pairs with s<sup>T</sup>y ≤ 0 are rejected and never stored in memory.
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  <strong>Why this matters:</strong> Near saddle points or in non-convex regions, the true Hessian H may have negative eigenvalues. Newton's method uses this negative curvature and can converge to saddle points or maxima. By filtering out negative curvature, L-BFGS helps keep its approximate Hessian B positive definite, promoting valid descent directions.
                </p>
                <p className="text-xs text-amber-800">
                  <strong>Result:</strong> L-BFGS is more robust than Newton on non-convex problems like Himmelblau's function, where it successfully avoids saddle points that trap Newton. This selective memory trades perfect Hessian approximation for better robustness through curvature filtering.
                </p>
              </div>

              <p className="text-sm text-blue-800 mb-2">
                <strong>4. BFGS update formula:</strong> Given a new pair (<InlineMath>\varS_k</InlineMath>, <InlineMath>\varY_k</InlineMath>), how do we update our approximate Hessian <InlineMath>\varBK</InlineMath> to satisfy the new secant equation? The BFGS update is:
              </p>
              <div className="ml-4 my-2">
                <BlockMath>{String.raw`\varB_{k+1} = (\varI - \varRho_k \varS_k \varY_k^T) \varBK (\varI - \varRho_k \varY_k \varS_k^T) + \varRho_k \varS_k \varS_k^T`}</BlockMath>
              </div>
              <p className="text-sm text-blue-800">
                where <InlineMath>\varRho_k</InlineMath> is a scaling factor equal to <InlineMath>{String.raw`1/(\varS_k^T \varY_k)`}</InlineMath> (the reciprocal of the curvature).
              </p>

              <div className="bg-blue-100 border border-blue-300 rounded p-3 my-2">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  Verification: Does <InlineMath>{String.raw`\varB_{k+1} \varY_k = \varS_k`}</InlineMath>?
                </p>
                <p className="text-xs text-blue-800 mb-2">
                  Multiply the BFGS formula by <InlineMath>\varY_k</InlineMath>:
                </p>
                <div className="ml-2 my-2">
                  <BlockMath>{String.raw`\varB_{k+1} \varY_k = \left[(\varI - \varRho \varS \varY^T) \varBK (\varI - \varRho \varY \varS^T) + \varRho \varS \varS^T\right] \varY_k`}</BlockMath>
                </div>
                <p className="text-xs text-blue-800 mb-2">
                  <strong>Key step:</strong> What is <InlineMath>{String.raw`(\varI - \varRho \varY \varS^T) \varY_k`}</InlineMath>?
                </p>
                <div className="ml-2 my-2">
                  <BlockMath>{String.raw`(\varI - \varRho \varY \varS^T) \varY_k = \varY_k - \varRho \varY (\varS^T \varY_k) = \varY_k - \varRho (\varS^T \varY) \varY_k`}</BlockMath>
                </div>
                <p className="text-xs text-blue-800 mb-2">
                  Since <InlineMath>{String.raw`\varRho = 1/(\varS^T \varY)`}</InlineMath>, we have <InlineMath>{String.raw`\varRho(\varS^T \varY) = 1`}</InlineMath>, so:
                </p>
                <div className="ml-2 my-2">
                  <BlockMath>{String.raw`(\varI - \varRho \varY \varS^T) \varY_k = \varY_k - \varY_k = \mathbf{0}`}</BlockMath>
                </div>
                <p className="text-xs text-blue-800 mb-2">
                  Therefore the entire <InlineMath>\varBK</InlineMath> term vanishes! We're left with:
                </p>
                <div className="ml-2 my-2">
                  <BlockMath>{String.raw`\varB_{k+1} \varY_k = (\varI - \varRho \varS \varY^T) \varBK \cdot \mathbf{0} + \varRho \varS \varS^T \varY_k = \varRho (\varS^T \varY) \varS = \varS_k \,\checkmark`}</BlockMath>
                </div>
                <p className="text-xs text-blue-800 mt-2">
                  <strong>The magic:</strong> The formula is specifically designed so <InlineMath>\varBK</InlineMath> drops out completely when multiplied by <InlineMath>\varY_k</InlineMath>, leaving only the new curvature information <InlineMath>\varS_k</InlineMath>.
                </p>
              </div>

              <p className="text-sm text-blue-800 mt-2">
                <strong>5. Why rank-2?</strong> This update can be decomposed into two rank-1 operations:<br/>
                • <strong>Rank-1 removal:</strong> Subtract out the "old guess" about curvature<br/>
                • <strong>Rank-1 addition:</strong> Add the "new observation" about curvature<br/>
                <br/>
                We need both because we have one vector constraint (the secant equation) but must maintain symmetry (<InlineMath>{String.raw`\varB = \varB^T`}</InlineMath>). A single rank-1 update can't do both. The rank-2 update is the minimal symmetric modification that satisfies the secant equation while preserving positive definiteness.
              </p>

              <p className="text-sm text-blue-800 mt-2 font-semibold">
                L-BFGS applies <InlineMath>\varM</InlineMath> of these updates sequentially starting from <InlineMath>{String.raw`\varBZero = (1/\varGamma)\varI`}</InlineMath>, but <strong>never forms the matrix</strong> — the two-loop recursion below implicitly applies all <InlineMath>\varM</InlineMath> updates to compute the search direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B^{-1}\nabla f`}</InlineMath></Var>!
              </p>
            </div>
          </div>

          {/* Two-Loop Recursion */}
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-3">The Two-Loop Recursion</h3>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-3">
              <p className="font-semibold text-green-900 mb-3">How we compute the search direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B_M^{-1}\nabla f`}</InlineMath></Var> without forming any matrix:</p>

              <p className="text-sm text-green-800 mb-2">
                <strong>The challenge:</strong> We've applied <InlineMath>\varM</InlineMath> BFGS updates to get <InlineMath>\varBZero</InlineMath> → <InlineMath>\varBOne</InlineMath> → ⋯ → <InlineMath>\varBM</InlineMath>. Now we need the direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B_M^{-1}\nabla f`}</InlineMath></Var>, but forming <InlineMath>\varBM</InlineMath> or its inverse explicitly would cost O(d²) space!
              </p>

              <p className="text-sm text-green-800 mb-2">
                <strong>Key observation:</strong> Each BFGS update has a special structure. The inverse of the update can be applied recursively:
              </p>
              <div className="ml-4 my-2 text-sm text-green-800">
                <BlockMath>{String.raw`\varBM^{-1} \nabla f = (\text{undo update M}) \circ (\text{undo update M-1}) \circ \cdots \circ (\text{undo update 1}) \circ \varBZero^{-1} \nabla f`}</BlockMath>
              </div>

              <p className="text-sm text-green-800 mt-3">
                <strong>The two-loop algorithm does exactly this:</strong>
              </p>
              <ul className="text-sm text-green-800 ml-6 list-disc space-y-1">
                <li><strong>First loop (backward):</strong> Undo updates <InlineMath>\varM</InlineMath>, <InlineMath>M-1</InlineMath>, ..., 1 in reverse order, transforming <InlineMath>\nabla f</InlineMath> → <InlineMath>\varQ</InlineMath></li>
                <li><strong>Middle step:</strong> Apply <InlineMath>{String.raw`\varBZero^{-1} = \varGamma \varI`}</InlineMath> to get <InlineMath>{String.raw`\varR = \varGamma \varQ`}</InlineMath></li>
                <li><strong>Second loop (forward):</strong> Re-apply updates 1, 2, ..., <InlineMath>\varM</InlineMath> on the transformed vector, adjusting <InlineMath>\varR</InlineMath> to get the final direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B_M^{-1}\nabla f`}</InlineMath></Var></li>
              </ul>

              <p className="text-sm text-green-800 mt-3 font-semibold">
                Result: We compute the search direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B_M^{-1}\nabla f`}</InlineMath></Var> using only the stored vectors (<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>), never forming any matrix!
              </p>

              <p className="text-sm text-green-800 mt-2">
                <strong>Efficiency:</strong> <InlineMath>O(Md)</InlineMath> time and <InlineMath>O(Md)</InlineMath> memory vs <InlineMath>O(d³)</InlineMath> time and <InlineMath>O(d²)</InlineMath> memory for full Hessian inversion.
              </p>
            </div>

            {iterations[currentIter]?.twoLoopData ? (
              <>
                <h4 className="text-lg font-bold text-indigo-800 mb-3 mt-4">Detailed Algorithm</h4>

                <Pseudocode
                  color="indigo"
                  inputs={[
                    {
                      id: "grad_f",
                      display: <InlineMath>{`\\nabla f \\in \\mathbb{R}^d`}</InlineMath>,
                      description: "current gradient vector"
                    },
                    {
                      id: "memory",
                      display: <InlineMath>{String.raw`[(\varSOne,\varYOne), \ldots, (\varSM,\varYM)]`}</InlineMath>,
                      description: "M most recent accepted curvature pairs"
                    }
                  ]}
                  outputs={[
                    {
                      id: "direction",
                      display: <InlineMath>{String.raw`-B_M^{-1} \nabla f`}</InlineMath>,
                      description: "quasi-Newton search direction"
                    }
                  ]}
                  steps={[
                    <>Initialize working vector <Var id="q" type="vector ℝᵈ"><InlineMath>q</InlineMath></Var> ← <Var id="grad_f" type="vector ℝᵈ"><InlineMath>\nabla f</InlineMath></Var> <Complexity>O(1)</Complexity></>,
                    <><strong>for</strong> <Var id="i" type="scalar"><InlineMath>i</InlineMath></Var> = <InlineMath>{String.raw`M, M\!-\!1, \ldots, 1`}</InlineMath> (backward through memory, where <InlineMath>i</InlineMath> indexes memory pairs, not iterations):</>,
                    <><span className="ml-4">Compute <Var id="rho_i" type="scalar"><InlineMath>\rho_i</InlineMath></Var> ← <InlineMath>{String.raw`1 / (\varSI^T \varYI)`}</InlineMath> <Complexity explanation="Inner product + division">O(d)</Complexity></span></>,
                    <><span className="ml-4">Compute and store <Var id="alpha_i" type="scalar"><InlineMath>\alpha_i</InlineMath></Var> ← <Var id="rho_i" type="scalar"><InlineMath>\rho_i</InlineMath></Var> · (<InlineMath>\varSI^T q</InlineMath>) <Complexity explanation="Inner product">O(d)</Complexity></span></>,
                    <><span className="ml-4">Update <Var id="q" type="vector ℝᵈ"><InlineMath>q</InlineMath></Var> ← <Var id="q" type="vector ℝᵈ"><InlineMath>q</InlineMath></Var> - <Var id="alpha_i" type="scalar"><InlineMath>\alpha_i</InlineMath></Var> <InlineMath>\varYI</InlineMath> <Complexity explanation="Vector operations">O(d)</Complexity></span></>,
                    <>Compute scaling <Var id="gamma" type="scalar"><InlineMath>\gamma</InlineMath></Var> ← <InlineMath>{String.raw`(\varSM^T \varYM) / (\varYM^T \varYM)`}</InlineMath> (estimates optimal scaling for initial Hessian <InlineMath>\varBZero</InlineMath>) <Complexity explanation="Two inner products">O(d)</Complexity></>,
                    <>Scale result <Var id="r" type="vector ℝᵈ"><InlineMath>r</InlineMath></Var> ← <Var id="gamma" type="scalar"><InlineMath>\gamma</InlineMath></Var> <Var id="q" type="vector ℝᵈ"><InlineMath>q</InlineMath></Var> (applies <InlineMath>{String.raw`\varBZero^{-1} = \varGamma \varI`}</InlineMath>, a scaled identity matrix) <Complexity explanation="Scalar-vector multiplication">O(d)</Complexity></>,
                    <><strong>for</strong> <Var id="i" type="scalar"><InlineMath>i</InlineMath></Var> = <InlineMath>{String.raw`1, 2, \ldots, M`}</InlineMath> (forward through memory):</>,
                    <><span className="ml-4">Compute <Var id="rho_i" type="scalar"><InlineMath>\rho_i</InlineMath></Var> ← <InlineMath>{String.raw`1 / (\varSI^T \varYI)`}</InlineMath> <Complexity explanation="Inner product + division">O(d)</Complexity></span></>,
                    <><span className="ml-4">Compute correction <Var id="beta_i" type="scalar"><InlineMath>\beta_i</InlineMath></Var> ← <Var id="rho_i" type="scalar"><InlineMath>\rho_i</InlineMath></Var> · (<InlineMath>\varYI^T r</InlineMath>) <Complexity explanation="Inner product">O(d)</Complexity></span></>,
                    <><span className="ml-4">Update <Var id="r" type="vector ℝᵈ"><InlineMath>r</InlineMath></Var> ← <Var id="r" type="vector ℝᵈ"><InlineMath>r</InlineMath></Var> + (<Var id="alpha_i" type="scalar"><InlineMath>\alpha_i</InlineMath></Var> - <Var id="beta_i" type="scalar"><InlineMath>\beta_i</InlineMath></Var>) <InlineMath>\varSI</InlineMath> <Complexity explanation="Vector operations">O(d)</Complexity></span></>,
                    <><strong>return</strong> search direction -<Var id="r" type="vector ℝᵈ"><InlineMath>r</InlineMath></Var> (negated for descent) <Complexity>O(1)</Complexity></>
                  ]}
                />
              </>
            ) : (
              <div className="bg-indigo-50 rounded-lg p-4 text-center mt-3">
                <p className="text-indigo-800 font-semibold">Two-loop recursion details will appear here</p>
                <p className="text-sm text-indigo-700 mt-2">Starting from iteration 1, you'll see the detailed two-loop algorithm that computes the search direction.</p>
              </div>
            )}
          </div>

          {/* Hessian Damping */}
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-3">Hessian Damping</h3>

            <p className="mb-3">
              L-BFGS direction with damping:
            </p>
            <BlockMath>{String.raw`\varP = -(\varB + \varLambdaDamp \varI)^{-1}\nabla f`}</BlockMath>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-3">
              <p className="font-semibold text-amber-900 mb-2">Why add damping?</p>
              <p className="text-sm text-amber-800 mb-2">
                The approximate Hessian <InlineMath>\varB</InlineMath> can become ill-conditioned or nearly singular, especially:
              </p>
              <ul className="list-disc ml-6 text-sm text-amber-800 space-y-1">
                <li>Early in optimization when we have few memory pairs</li>
                <li>In saddle regions where the true Hessian has negative eigenvalues</li>
                <li>When the curvature information in memory is stale or inconsistent</li>
              </ul>
              <p className="text-sm text-amber-800 mt-3">
                Adding <InlineMath>\varLambdaDamp \varI</InlineMath> ensures the direction remains a valid descent direction and improves numerical stability.
              </p>
            </div>

            <p className="mb-2"><strong>Implementation:</strong></p>
            <p className="text-sm mb-2">
              We never form <InlineMath>\varB</InlineMath> explicitly! Instead, damping is applied by modifying the initial scaling factor in the two-loop recursion:
            </p>
            <BlockMath>{String.raw`\varGamma_{\text{damped}} = \frac{\varGamma_{\text{base}}}{1 + \varLambdaDamp \cdot \varGamma_{\text{base}}}`}</BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`\varGamma_{\text{base}} = \varS^T \varY / \varY^T \varY`}</InlineMath> is the standard L-BFGS scaling.
            </p>
            <p className="text-sm mt-2">
              This is mathematically equivalent to <InlineMath>{String.raw`(\varBZero + \varLambdaDamp \varI)^{-1}`}</InlineMath> where <InlineMath>{String.raw`\varBZero = (1/\varGamma)\varI`}</InlineMath>.
            </p>

            <div className="bg-gray-100 rounded p-3 mt-3">
              <p className="font-bold text-sm mb-2">Effect of λ<sub>damp</sub>:</p>
              <ul className="text-sm list-disc ml-6 space-y-1">
                <li><strong>λ = 0:</strong> Pure L-BFGS (no regularization)</li>
                <li><strong>Small λ:</strong> Adds stability with minimal impact on convergence direction</li>
                <li><strong>Large λ:</strong> More regularization, trades Newton-like steps for stability</li>
                <li><strong>λ → ∞:</strong> Reduces to gradient descent (pure regularization)</li>
              </ul>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-indigo-100 rounded p-4">
            <p className="font-bold text-indigo-900 mb-2">Key Takeaways</p>
            <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
              <li>(<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>) pairs capture curvature through the secant equation: <InlineMath>{String.raw`\varB \varY = \varS`}</InlineMath></li>
              <li>BFGS updates maintain positive definiteness and satisfy the secant equation</li>
              <li>Two-loop recursion computes the search direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`B^{-1}\nabla f`}</InlineMath></Var> using only vectors, never matrices</li>
              <li>Hessian damping improves stability without changing the problem significantly</li>
              <li>Total cost: <InlineMath>O(Md)</InlineMath> time and <InlineMath>O(Md)</InlineMath> memory per iteration</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS - Line Search Details */}
      <CollapsibleSection
        title="Line Search Details"
        defaultExpanded={false}
        storageKey="lbfgs-line-search-details"
        id="line-search-details"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Why Line Search for L-BFGS</h3>
            <p>
              Quasi-Newton direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`p \approx -H^{-1}\nabla f`}</InlineMath></Var> is only
              an approximation:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>
                <strong>Not guaranteed to be descent direction</strong> if approximation poor
              </li>
              <li>
                <strong>Line search ensures we actually decrease the loss</strong>
              </li>
              <li>
                <strong>Essential for convergence guarantees</strong>
              </li>
            </ul>
            <p className="text-sm mt-2">
              Without line search, L-BFGS can diverge even on well-behaved problems.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Current Method: Armijo Backtracking</h3>
            <ArmijoLineSearch
              color="amber"
              initialAlpha="1 (try full step first)"
              typicalFEvals="1-4"
              c1Value={lbfgsC1}
              verdict={{
                title: "Critical for L-BFGS!",
                description: "L-BFGS uses an approximate Hessian, so line search is essential for robustness. The overhead is minimal (often accepts α = 1 after warm-up) and prevents the disasters that can happen with a fixed step size on an approximate direction."
              }}
              benefits={[
                'Safety: Prevents bad steps from approximate Hessian',
                'Robustness: Works even with limited memory or poor approximation',
                'Faster convergence: Better steps mean fewer total iterations'
              ]}
              additionalNotes={
                <p className="text-sm">
                  <strong>Typical behavior:</strong> When the quasi-Newton approximation is good
                  (near minimum, after building history), <InlineMath>\varAlpha</InlineMath> = 1 is
                  often accepted. When approximation is poor (early iterations, far from minimum),
                  backtracking finds smaller steps.
                </p>
              }
            />
          </div>

          <div className="bg-amber-100 rounded p-3 mt-3">
            <p className="font-bold text-sm mb-2">Wolfe Conditions (Advanced)</p>
            <p className="text-sm">
              Full BFGS theory requires <strong>Wolfe conditions</strong> (Armijo + curvature
              condition) to guarantee positive definiteness. This implementation uses Armijo
              backtracking, which works well in practice for L-BFGS.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS - When Things Go Wrong */}
      <CollapsibleSection
        title="When Things Go Wrong"
        defaultExpanded={false}
        storageKey="lbfgs-when-wrong"
        id="when-things-go-wrong"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">❌ "L-BFGS is always better than gradient descent"</p>
                <p className="text-sm ml-6">
                  ✓ Requires smooth objectives and good line search<br />
                  ✓ Can fail on non-smooth problems (L1 regularization, ReLU, kinks)<br />
                  ✓ More complex to implement and debug
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "L-BFGS equals Newton's method"</p>
                <p className="text-sm ml-6">
                  ✓ Only approximates Newton direction<br />
                  ✓ Approximation quality depends on M and problem structure<br />
                  ✓ Superlinear vs quadratic convergence
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "More memory (larger <InlineMath>\varM</InlineMath>) is always better"</p>
                <p className="text-sm ml-6">
                  ✓ Diminishing returns as <InlineMath>\varM</InlineMath> increases<br />
                  ✓ Larger <InlineMath>\varM</InlineMath> = more computation per iteration (<InlineMath>O(Md)</InlineMath>)<br />
                  ✓ Very old pairs may contain stale curvature information
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
            <ul className="space-y-2">
              <li>
                <strong>Strongly convex:</strong> Superlinear convergence guaranteed
                (between linear GD and quadratic Newton)
              </li>
              <li>
                <strong>Convex:</strong> Converges to global minimum
              </li>
              <li>
                <strong>Non-convex:</strong> Can converge to local minima, no global
                guarantees (like all local methods)
              </li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-3">
              <p className="text-sm text-green-900 font-semibold mb-1">
                ✓ Advantage over Newton in non-convex regions
              </p>
              <p className="text-sm text-green-800">
                L-BFGS filters out negative curvature pairs (<InlineMath>{String.raw`\varS^T \varY \leq 0`}</InlineMath>), keeping its approximate Hessian <InlineMath>\varB</InlineMath> positive definite.
                Newton's method uses the true Hessian <InlineMath>\varH</InlineMath>, which can have negative eigenvalues near saddle points, potentially causing convergence to saddles or maxima.
                This makes L-BFGS more robust on non-convex problems like Himmelblau's function.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Common Issues You Can Observe</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Instability / Erratic steps:</strong> Watch the step sizes and loss values.
                If steps are erratic, the Hessian approximation may be ill-conditioned.
                The damping parameter adds regularization (moves toward gradient descent).
              </li>
              <li>
                <strong>Slow convergence:</strong> Compare iterations needed vs gradient descent or Newton.
                Slow convergence suggests either: (a) <InlineMath>\varM</InlineMath> is too small to capture curvature, or (b) damping is too aggressive.
                Trade-off: larger <InlineMath>\varM</InlineMath> improves approximation but increases cost (<InlineMath>O(Md)</InlineMath> per iteration).
              </li>
              <li>
                <strong>Rejected curvature pairs:</strong> Check the memory table's "sᵀy &gt; 0?" column.
                Rejected pairs indicate steps that didn't provide useful positive curvature information.
                This is normal and expected, especially in non-convex regions.
              </li>
              <li>
                <strong>Poor Hessian approximation:</strong> Use the eigenvalue evolution plots to see how well
                the approximate Hessian <InlineMath>\varB</InlineMath> matches the true Hessian <InlineMath>\varH</InlineMath>. Large gaps indicate the limited memory
                isn't capturing the full curvature structure.
              </li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS - Mathematical Details */}
      <CollapsibleSection
        title="Mathematical Details"
        defaultExpanded={false}
        storageKey="lbfgs-math-derivations"
        id="mathematical-derivations"
      >
        <div className="space-y-4 text-gray-800">
          <p className="text-sm italic">
            For the full explanation of the secant equation, BFGS updates, and two-loop recursion, see the <strong>"How L-BFGS Works"</strong> section above.
            This section covers advanced theoretical topics.
          </p>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Memory vs. Computation Tradeoff</h3>
            <p className="mb-2">Why use limited memory instead of full BFGS?</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Full BFGS:</strong> stores <InlineMath>\varBK</InlineMath> (d×d matrix)
                → O(d²) memory, O(d²) update cost
              </li>
              <li>
                <strong>L-BFGS:</strong> stores only <InlineMath>\varM</InlineMath> recent (<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>) pairs
                → O(Md) memory, O(Md) computation
              </li>
              <li>
                <strong>Scaling advantage:</strong> L-BFGS memory and computation scale linearly with <InlineMath>d</InlineMath> instead of quadratically, making it practical for large-scale problems.
              </li>
            </ul>
            <p className="text-sm mt-2">
              The trade-off: L-BFGS uses less information (only <InlineMath>\varM</InlineMath> recent pairs) so approximation quality may be worse than full BFGS,
              but the computational savings often outweigh this cost for large problems.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
            <p className="mb-2"><strong><GlossaryTooltip termKey="superlinear-convergence" />:</strong></p>
            <p className="text-sm mb-2">
              Let <InlineMath>\varWStar</InlineMath> denote the optimal parameters that minimize the objective function. Define the error at iteration <InlineMath>k</InlineMath> as <InlineMath>e_k = \|w_k - w^*\|</InlineMath> (distance from optimal parameters). L-BFGS exhibits superlinear convergence:
            </p>
            <BlockMath>{String.raw`\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0`}</BlockMath>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li>Faster than linear convergence (gradient descent) but slower than quadratic (Newton's method)</li>
              <li>Convergence rate depends on <InlineMath>\varM</InlineMath>: larger <InlineMath>\varM</InlineMath> → closer to Newton's quadratic rate</li>
              <li>Requires strong convexity for convergence guarantees; works well empirically on non-convex problems too</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Connection to Conjugate Gradient</h3>
            <p className="mb-2">Both L-BFGS and conjugate gradient (CG) use history to improve search directions:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li><strong>CG:</strong> Uses gradient history to build conjugate directions. Converges in at most <InlineMath>d</InlineMath> steps on quadratic functions.</li>
              <li><strong>L-BFGS:</strong> Uses (<InlineMath>\varS</InlineMath>, <InlineMath>\varY</InlineMath>) history to approximate the Newton direction <Var id="p" type="vector ℝᵈ"><InlineMath>{String.raw`H^{-1}\nabla f`}</InlineMath></Var>. More robust on non-quadratic functions.</li>
              <li>For strictly convex quadratics, L-BFGS with sufficient memory (<InlineMath>\varM</InlineMath>=<InlineMath>d</InlineMath>) reduces to BFGS, which is related to CG.</li>
              <li>L-BFGS generally more practical for general non-linear optimization.</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Advanced Topics"
        defaultExpanded={false}
        storageKey="lbfgs-advanced"
        id="advanced-topics"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Gradient computation:</strong> O(n) to O(n²) depending on problem
              </li>
              <li>
                <strong>Two-loop recursion:</strong> O(Mn) operations
              </li>
              <li>
                <strong>Line search:</strong> multiple gradient evaluations
              </li>
              <li>
                <strong>Total per iteration:</strong> O(Mn) time, O(Mn) memory
              </li>
            </ul>
            <p className="text-sm mt-2 italic">
              <strong>Example:</strong> For n=1000, M=10: ~10,000 operations vs
              ~1 billion for Newton's method
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Full BFGS vs L-BFGS</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="border p-2">Method</th>
                    <th className="border p-2">Memory</th>
                    <th className="border p-2">Update Cost</th>
                    <th className="border p-2">Trade-off</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2"><strong>BFGS</strong></td>
                    <td className="border p-2">O(d²)</td>
                    <td className="border p-2">O(d²)</td>
                    <td className="border p-2">Better approximation, higher cost</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><strong>L-BFGS</strong></td>
                    <td className="border p-2">O(Md)</td>
                    <td className="border p-2">O(Md)</td>
                    <td className="border p-2">Scales to large d</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-2">
              L-BFGS becomes essential when d is large enough that O(d²) memory/computation is prohibitive.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Extensions and Variants</h3>

            <div className="space-y-2 mt-2">
              <div>
                <p className="font-semibold">OWL-QN (Orthant-Wise Limited-memory Quasi-Newton)</p>
                <p className="text-sm ml-4">
                  L-BFGS for L1-regularized problems, handles non-smoothness at zero
                </p>
              </div>

              <div>
                <p className="font-semibold">Stochastic L-BFGS</p>
                <p className="text-sm ml-4">
                  Mini-batch variants for large datasets, stabilization techniques needed
                </p>
              </div>

              <div>
                <p className="font-semibold">Block L-BFGS</p>
                <p className="text-sm ml-4">
                  Exploits problem structure (e.g., layers in neural networks)
                </p>
              </div>

              <div>
                <p className="font-semibold">L-BFGS-B</p>
                <p className="text-sm ml-4">
                  Extension to bound-constrained optimization (box constraints)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-100 rounded p-3">
            <p className="font-bold text-sm mb-2">Historical Note</p>
            <p className="text-sm">
              L-BFGS was developed by Jorge Nocedal in 1980. The "L" stands for
              "Limited-memory". It's one of the most widely used optimization algorithms
              in practice, powering everything from machine learning libraries to
              engineering simulation software.
            </p>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
};
