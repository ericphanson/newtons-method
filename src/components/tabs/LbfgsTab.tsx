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
  onResetIter,
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
          <p><strong>What it is:</strong> Instead of storing the full Hessian H (n×n matrix), we store only M={lbfgsM} recent (s, y) pairs.</p>
          <p><strong>s</strong> = parameter change = <InlineMath>{String.raw`w_{\text{new}} - w_{\text{old}}`}</InlineMath> (where we moved)</p>
          <p><strong>y</strong> = gradient change = <InlineMath>{String.raw`\nabla f_{\text{new}} - \nabla f_{\text{old}}`}</InlineMath> (how the slope changed)</p>
          <p><strong>Acceptance criteria:</strong> L-BFGS only stores pairs where <InlineMath>{`s^T y > 0`}</InlineMath> (positive curvature). This ensures the approximate Hessian B stays positive definite, guaranteeing descent directions even in non-convex regions where the true Hessian H may have negative eigenvalues.</p>
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

      {/* Two-Loop Recursion */}
      <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg shadow-md p-6 mb-6" data-scroll-target="two-loop-recursion">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Two-Loop Recursion Details</h2>
        <div className="space-y-3 text-gray-800 mb-4">
          <p><strong>The challenge:</strong> We have M={lbfgsM} memory pairs (s, y) showing how parameters and gradients changed. How can we get an inverse Hessian approximation H⁻¹ from this?</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
            <p className="font-semibold text-blue-900 mb-3">Building intuition from Taylor expansion:</p>

            <p className="text-sm text-blue-800 mb-2">
              <strong>1. Taylor expansion:</strong> The gradient at a new point relates to the old gradient via the Hessian:<br/>
              <span className="ml-4 inline-block my-1">
                <InlineMath>{String.raw`\nabla f(x_{\text{new}}) \approx \nabla f(x_{\text{old}}) + H \cdot s`}</InlineMath>
              </span><br/>
              where <InlineMath>{String.raw`s = x_{\text{new}} - x_{\text{old}}`}</InlineMath> is the parameter change.
            </p>

            <p className="text-sm text-blue-800 mb-2">
              <strong>2. Rearranging:</strong> Define <InlineMath>{String.raw`y = \nabla f(x_{\text{new}}) - \nabla f(x_{\text{old}})`}</InlineMath> (gradient change). Then:<br/>
              <span className="ml-4 inline-block my-1"><InlineMath>{String.raw`y = H \cdot s`}</InlineMath></span><br/>
              <span className="ml-4 inline-block my-1"><InlineMath>{String.raw`H^{-1} \cdot y = s`}</InlineMath></span> (the <strong>secant equation</strong>)
            </p>

            <p className="text-sm text-blue-800 mb-2">
              <strong>3. Why we want this:</strong> If our approximate inverse Hessian <InlineMath>{String.raw`B^{-1}`}</InlineMath> satisfies <InlineMath>{String.raw`B^{-1} \cdot y = s`}</InlineMath> for all our observed <InlineMath>(s, y)</InlineMath> pairs, then <InlineMath>{String.raw`B^{-1}`}</InlineMath> plays the same role as <InlineMath>{String.raw`H^{-1}`}</InlineMath> in the Taylor expansion. It correctly relates parameter changes to gradient changes!
            </p>

            <p className="text-sm text-blue-800 mb-2">
              <strong>4. Iterative updates:</strong> Given a new pair <InlineMath>(s_k, y_k)</InlineMath>, how do we update our approximate Hessian <InlineMath>B_k</InlineMath> to satisfy the new secant equation? The BFGS update is:
            </p>
            <div className="ml-4 my-2">
              <BlockMath>{String.raw`B_{k+1} = (I - \rho_k s_k y_k^T) B_k (I - \rho_k y_k s_k^T) + \rho_k s_k s_k^T`}</BlockMath>
            </div>
            <p className="text-sm text-blue-800">
              where <InlineMath>{String.raw`\rho_k = 1/(s_k^T y_k)`}</InlineMath>.
            </p>

            <div className="bg-blue-100 border border-blue-300 rounded p-3 my-2">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Verification: Does <InlineMath>{String.raw`B_{k+1} y_k = s_k`}</InlineMath>?
              </p>
              <p className="text-xs text-blue-800 mb-2">
                Multiply the BFGS formula by <InlineMath>y_k</InlineMath>:
              </p>
              <div className="ml-2 my-2">
                <BlockMath>{String.raw`B_{k+1} y_k = \left[(I - \rho s y^T) B_k (I - \rho y s^T) + \rho s s^T\right] y_k`}</BlockMath>
              </div>
              <p className="text-xs text-blue-800 mb-2">
                <strong>Key step:</strong> What is <InlineMath>(I - \rho y s^T) y_k</InlineMath>?
              </p>
              <div className="ml-2 my-2">
                <BlockMath>{String.raw`(I - \rho y s^T) y_k = y_k - \rho y (s^T y_k) = y_k - \rho (s^T y) y_k`}</BlockMath>
              </div>
              <p className="text-xs text-blue-800 mb-2">
                Since <InlineMath>{String.raw`\rho = 1/(s^T y)`}</InlineMath>, we have <InlineMath>{String.raw`\rho(s^T y) = 1`}</InlineMath>, so:
              </p>
              <div className="ml-2 my-2">
                <BlockMath>{String.raw`(I - \rho y s^T) y_k = y_k - y_k = \mathbf{0}`}</BlockMath>
              </div>
              <p className="text-xs text-blue-800 mb-2">
                Therefore the entire <InlineMath>B_k</InlineMath> term vanishes! We're left with:
              </p>
              <div className="ml-2 my-2">
                <BlockMath>{String.raw`B_{k+1} y_k = (I - \rho s y^T) B_k \cdot \mathbf{0} + \rho s s^T y_k = \rho (s^T y) s = s_k \,\checkmark`}</BlockMath>
              </div>
              <p className="text-xs text-blue-800 mt-2">
                <strong>The magic:</strong> The formula is specifically designed so <InlineMath>B_k</InlineMath> drops out completely when multiplied by <InlineMath>y_k</InlineMath>, leaving only the new curvature information <InlineMath>s_k</InlineMath>.
              </p>
            </div>

            <p className="text-sm text-blue-800 mt-2">
              <strong>5. Why rank-2?</strong> This update can be decomposed into two rank-1 operations:<br/>
              • <strong>Rank-1 removal:</strong> Subtract out the "old guess" about curvature (term with <InlineMath>B_k y</InlineMath>)<br/>
              • <strong>Rank-1 addition:</strong> Add the "new observation" about curvature (term with <InlineMath>s_k s_k^T</InlineMath>)<br/>
              <br/>
              We need both because we have one vector constraint (the secant equation) but must maintain symmetry (<InlineMath>B = B^T</InlineMath>). A single rank-1 update can't do both. The rank-2 update is the minimal symmetric modification that satisfies the secant equation while preserving positive definiteness.
            </p>

            <p className="text-sm text-blue-800 mt-2 font-semibold">
              L-BFGS applies M of these updates sequentially starting from <InlineMath>B_0 = (1/\gamma)I</InlineMath>, but <strong>never forms the matrix</strong> - the two-loop recursion below implicitly applies all M updates to compute <InlineMath>{String.raw`B^{-1}\nabla f`}</InlineMath>!
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 my-3">
            <p className="font-semibold text-green-900 mb-3">How the two-loop recursion implements the updates:</p>

            <p className="text-sm text-green-800 mb-2">
              <strong>The challenge:</strong> We've applied M BFGS updates to get <InlineMath>{String.raw`B_0 \to B_1 \to \cdots \to B_M`}</InlineMath>. Now we need <InlineMath>{String.raw`B_M^{-1} \nabla f`}</InlineMath>, but forming <InlineMath>B_M</InlineMath> or <InlineMath>{String.raw`B_M^{-1}`}</InlineMath> explicitly would cost O(n²) space!
            </p>

            <p className="text-sm text-green-800 mb-2">
              <strong>Key observation:</strong> Each BFGS update has a special structure. The inverse of the update can be written as:
            </p>
            <div className="ml-4 my-2">
              <BlockMath>{String.raw`B_{k+1}^{-1} = \text{(apply inverse of rank-2 update)} \circ B_k^{-1}`}</BlockMath>
            </div>

            <p className="text-sm text-green-800 mb-2">
              So computing <InlineMath>{String.raw`B_M^{-1} \nabla f`}</InlineMath> is like peeling an onion:
            </p>
            <div className="ml-4 my-2 text-sm text-green-800">
              <BlockMath>{String.raw`B_M^{-1} \nabla f = (\text{undo update M}) \circ (\text{undo update M-1}) \circ \cdots \circ (\text{undo update 1}) \circ B_0^{-1} \nabla f`}</BlockMath>
            </div>

            <p className="text-sm text-green-800 mt-3">
              <strong>The two-loop algorithm does exactly this:</strong>
            </p>
            <ul className="text-sm text-green-800 ml-6 list-disc space-y-1">
              <li><strong>First loop (backward):</strong> Undo updates M, M-1, ..., 1 in reverse order, transforming <InlineMath>{String.raw`\nabla f \to q`}</InlineMath></li>
              <li><strong>Middle step:</strong> Apply <InlineMath>{String.raw`B_0^{-1} = \gamma I`}</InlineMath> to get <InlineMath>r = \gamma q</InlineMath></li>
              <li><strong>Second loop (forward):</strong> Re-apply updates 1, 2, ..., M but on the transformed vector, adjusting <InlineMath>r</InlineMath> to get <InlineMath>{String.raw`B_M^{-1} \nabla f`}</InlineMath></li>
            </ul>

            <p className="text-sm text-green-800 mt-3 font-semibold">
              Result: We compute <InlineMath>{String.raw`B_M^{-1} \nabla f`}</InlineMath> using only the stored vectors (s, y), never forming any matrix!
            </p>
          </div>

          <p><strong>Efficiency:</strong> O(m·n) = O({lbfgsM}·3) = {lbfgsM * 3} operations vs O(n³) = O(27) for full Hessian inversion!</p>
        </div>

        {iterations[currentIter]?.twoLoopData ? (
          <>
            <h3 className="text-xl font-bold text-indigo-800 mb-3">First Loop (Backward Pass)</h3>
            <p className="text-gray-800 mb-3">
              <strong>What we're doing:</strong> Transform the gradient ∇f into a vector q that "forgets" the direct effect of our stored pairs.
              Start with q = ∇f, then for each pair (newest to oldest), compute how much that pair contributes (αᵢ = ρᵢ(sᵢᵀq)) and subtract its gradient effect: q ← q - αᵢyᵢ.
            </p>
            <p className="text-gray-700 text-sm mb-3">
              <strong>Why backward?</strong> We process pairs from newest to oldest because recent pairs capture the most relevant local curvature.
              The algorithm builds up α values that we'll use in the second loop.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                <thead className="bg-indigo-200">
                  <tr>
                    <th className="px-4 py-2 text-left">i</th>
                    <th className="px-4 py-2 text-left">ρᵢ</th>
                    <th className="px-4 py-2 text-left">sᵢᵀq</th>
                    <th className="px-4 py-2 text-left bg-yellow-100">αᵢ = ρᵢ(sᵢᵀq)</th>
                    <th className="px-4 py-2 text-left">q after update</th>
                  </tr>
                </thead>
                <tbody>
                  {iterations[currentIter].twoLoopData!.firstLoop.map((row, idx) => (
                    <tr key={idx} className="border-t border-indigo-200">
                      <td className="px-4 py-2 font-mono">{row.i}</td>
                      <td className="px-4 py-2 font-mono">{fmt(row.rho)}</td>
                      <td className="px-4 py-2 font-mono">{fmt(row.sTq)}</td>
                      <td className="px-4 py-2 font-mono bg-yellow-50">{fmt(row.alpha)}</td>
                      <td className="px-4 py-2 font-mono">{fmtVec(row.q)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-200 rounded p-4 mb-6">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Initial Hessian Scaling</h3>
              <p className="font-mono">γ = (sₘᵀyₘ)/(yₘᵀyₘ) = {fmt(iterations[currentIter].twoLoopData!.gamma)}</p>
              <p className="mt-2">
                <strong>r = γq.</strong> This scales q by typical curvature estimated from the most recent memory pair.
                Think of γ as a "base learning rate" that captures the overall scale of the problem. Then r = γq gives us H₀⁻¹∇f where H₀ = (1/γ)I is our initial Hessian approximation.
              </p>
            </div>

            <h3 className="text-xl font-bold text-indigo-800 mb-3">Second Loop (Forward Pass)</h3>
            <p className="text-gray-800 mb-3">
              <strong>What we're doing:</strong> Refine r by adding back corrections from our memory pairs (oldest to newest).
              For each pair, compute β = ρᵢ(yᵢᵀr) (how much that pair affects our current direction), then add a correction term (αᵢ - β)sᵢ.
            </p>
            <p className="text-gray-700 text-sm mb-3">
              <strong>Why forward?</strong> We build up the solution from the base H₀⁻¹ by progressively applying corrections from older to newer pairs.
              Each correction adjusts our direction to account for curvature captured by that pair. The final r ≈ H⁻¹∇f is our quasi-Newton direction!
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                <thead className="bg-indigo-200">
                  <tr>
                    <th className="px-4 py-2 text-left">i</th>
                    <th className="px-4 py-2 text-left">yᵢᵀr</th>
                    <th className="px-4 py-2 text-left">β = ρᵢ(yᵢᵀr)</th>
                    <th className="px-4 py-2 text-left bg-green-100">αᵢ - β</th>
                    <th className="px-4 py-2 text-left">r after update</th>
                  </tr>
                </thead>
                <tbody>
                  {iterations[currentIter].twoLoopData!.secondLoop.map((row, idx) => (
                    <tr key={idx} className="border-t border-indigo-200">
                      <td className="px-4 py-2 font-mono">{row.i}</td>
                      <td className="px-4 py-2 font-mono">{fmt(row.yTr)}</td>
                      <td className="px-4 py-2 font-mono">{fmt(row.beta)}</td>
                      <td className="px-4 py-2 font-mono bg-green-50">{fmt(row.correction)}</td>
                      <td className="px-4 py-2 font-mono">{fmtVec(row.r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-200 rounded p-4">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Final Direction</h3>
              <p><strong>p = -r = {fmtVec(iterations[currentIter].direction)}</strong></p>
              <p className="text-sm mt-2">This is our Newton-like direction that accounts for curvature!</p>
            </div>
          </>
        ) : (
          <div className="bg-indigo-50 rounded-lg p-6 text-center">
            <p className="text-indigo-800 font-semibold">Two-loop recursion not used yet (Iteration 0)</p>
            <p className="text-sm text-indigo-700 mt-2">Starting from iteration 1, this section will show the two-loop algorithm that computes the search direction using stored memory pairs.</p>
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
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg p-6" data-scroll-target="approximate-hessian">
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
                  <div className="bg-white rounded-lg p-4 shadow">
                    <h3 className="text-lg font-bold text-purple-900 mb-3">True Hessian H</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-gray-700">Matrix:</p>
                        <div className="font-mono text-sm">
                          {iterations[currentIter].hessianComparison.trueHessian.map((row, i) => (
                            <div key={i}>
                              [{row.map(val => fmt(val)).join(', ')}]
                            </div>
                          ))}
                        </div>
                      </div>
                      {iterations[currentIter].hessianComparison.trueEigenvalues && (
                        <div>
                          <p className="font-semibold text-gray-700">Eigenvalues:</p>
                          <p className="font-mono text-sm">
                            λ₁ = {fmt(iterations[currentIter].hessianComparison.trueEigenvalues.lambda1)},
                            λ₂ = {fmt(iterations[currentIter].hessianComparison.trueEigenvalues.lambda2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approximate Hessian */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Approximate Hessian B</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-gray-700">Matrix:</p>
                      <div className="font-mono text-sm">
                        {iterations[currentIter].hessianComparison.approximateHessian.map((row, i) => (
                          <div key={i}>
                            [{row.map(val => fmt(val)).join(', ')}]
                          </div>
                        ))}
                      </div>
                    </div>
                    {iterations[currentIter].hessianComparison.approximateEigenvalues && (
                      <div>
                        <p className="font-semibold text-gray-700">Eigenvalues:</p>
                        <p className="font-mono text-sm">
                          λ₁ = {fmt(iterations[currentIter].hessianComparison.approximateEigenvalues.lambda1)},
                          λ₂ = {fmt(iterations[currentIter].hessianComparison.approximateEigenvalues.lambda2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error metric */}
              {iterations[currentIter].hessianComparison.frobeniusError !== null && iterations[currentIter].hessianComparison.frobeniusError !== undefined && (
                <div className="bg-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-900 mb-2">Approximation Quality</h3>
                  <p className="font-mono">
                    Frobenius Error ||H - B||<sub>F</sub> = {fmt(iterations[currentIter].hessianComparison.frobeniusError!)}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Lower is better. As L-BFGS builds memory, the approximation typically improves.
                  </p>
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
        </div>
      </CollapsibleSection>

      {/* L-BFGS - Quick Start */}
      <CollapsibleSection
        title="Quick Start"
        defaultExpanded={false}
        storageKey="lbfgs-quick-start"
        id="quick-start"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">The Core Idea</h3>
            <p>
              Newton's method uses <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> for smarter steps,
              but computing H costs O(d³) and storing it costs O(d²). <strong>L-BFGS approximates</strong>{' '}
              <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> using only recent gradient changes—no
              Hessian computation or storage needed. We add Hessian damping (Levenberg-Marquardt regularization) for
              numerical stability.
            </p>
            <p className="mt-2 text-sm">
              <strong>Key insight:</strong> No matrices are ever formed or inverted! The two-loop recursion
              implicitly applies H<sup>−1</sup> using only vector operations: O(Md) time, O(Md) memory.
            </p>
          </div>

          <Pseudocode
            color="amber"
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
                <span className="ml-4 ml-8 text-sm text-gray-600">(Uses initial Hessian approx. <Var id="B_0" type="d×d matrix (scaled identity)"><InlineMath>{`B_0`}</InlineMath></Var> + <Var id="lambda_damp" type="scalar"><InlineMath>{`\\lambda_{\\text{damp}}`}</InlineMath></Var> · <Var id="I" type="d×d matrix"><InlineMath>I</InlineMath></Var> with damping)</span>
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

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Key Idea</h3>
            <p>
              <InlineMath>(s, y)</InlineMath> pairs implicitly capture curvature: "when we moved
              by <InlineMath>s</InlineMath>, the gradient changed by <InlineMath>y</InlineMath>".
            </p>
            <p className="mt-2">
              The <strong>two-loop recursion</strong> transforms <InlineMath>\nabla f</InlineMath>{' '}
              into <InlineMath>{'p \\approx -H^{-1}\\nabla f'}</InlineMath> using only these pairs.
            </p>
            <p className="mt-2 font-semibold">No Hessian matrix ever computed or stored!</p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Key Formula</h3>
            <p>L-BFGS direction (with damping):</p>
            <BlockMath>{'p = -(B + \\lambda_{\\text{damp}} I)^{-1}\\nabla f'}</BlockMath>
            <p className="text-sm mt-2">
              <strong>Intuition:</strong> <InlineMath>{`B^{-1}`}</InlineMath> is built from recent gradient changes via two-loop recursion,
              approximating <InlineMath>{`H^{-1}`}</InlineMath>. Adding <InlineMath>{`\\lambda_{\\text{damp}} I`}</InlineMath> to the
              initial approximation improves numerical stability.
            </p>
            <p className="text-sm mt-2">
              <strong>Implementation note:</strong> B and B<sup>−1</sup> are never formed as matrices!
              Damping is applied by modifying the initial scaling factor: <InlineMath>{'\\gamma_{\\text{damped}} = \\gamma/(1 + \\lambda_{\\text{damp}}\\gamma)'}</InlineMath>,
              which is mathematically equivalent to <InlineMath>{String.raw`(B_0 + \lambda I)^{-1}`}</InlineMath> where <InlineMath>{'B_0 = (1/\\gamma)I'}</InlineMath>.
              All operations are vector arithmetic in the two-loop recursion.
            </p>
            <p className="text-sm mt-1 text-gray-600">
              (When λ_damp = 0, this is pure L-BFGS: <InlineMath>{'p \\approx -B^{-1}\\nabla f'}</InlineMath>)
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">When to Use</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Large problems (n &gt; 1000 parameters)</li>
              <li>Memory constrained environments</li>
              <li>Smooth, differentiable objectives</li>
              <li>When Newton too expensive, gradient descent too slow</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Key Parameters</h3>
            <p className="mb-2">
              <strong>M = memory size</strong> (typically 5-20)
            </p>
            <ul className="list-disc ml-6 space-y-1 mb-3">
              <li>Larger M = better Hessian approximation but more computation</li>
              <li>M=10 often works well in practice</li>
            </ul>
            <p className="mb-2">
              <strong>Hessian Damping Parameter (λ<sub>damp</sub>)</strong>
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Lower to ~0 to see pure L-BFGS behavior (may be unstable)</li>
              <li>Default 0.01 provides stability without changing the problem significantly</li>
              <li>Increase to 0.1+ for very ill-conditioned problems</li>
            </ul>
          </div>

          <div className="bg-amber-100 rounded p-3">
            <p className="font-bold text-sm">Assumptions:</p>
            <ul className="text-sm list-disc ml-6">
              <li>f is differentiable</li>
              <li>Gradients are Lipschitz continuous (smoothness)</li>
              <li>Convexity helpful but not required</li>
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
              Quasi-Newton direction <InlineMath>{'p \\approx -H^{-1}\\nabla f'}</InlineMath> is only
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
                  (near minimum, after building history), <InlineMath>\alpha = 1</InlineMath> is
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

      {/* L-BFGS - Try This */}
      <CollapsibleSection
        title="Try This"
        defaultExpanded={false}
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
                <p className="font-semibold">❌ "More memory (larger M) is always better"</p>
                <p className="text-sm ml-6">
                  ✓ Diminishing returns: M=5-20 usually sufficient<br />
                  ✓ Larger M = more computation per iteration<br />
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
          </div>

          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Instability / Erratic steps</strong> → increase Hessian damping (λ_damp) to 0.1 or higher
              </li>
              <li>
                <strong>Slow convergence</strong> → increase M for better Hessian approximation, or λ_damp too high (try lowering toward 0.01)
              </li>
              <li>
                <strong>Oscillation</strong> → decrease M or line search c1 parameter
              </li>
              <li>
                <strong>Memory issues</strong> → M too large for hardware, decrease M
              </li>
              <li>
                <strong>Numerical issues</strong> → Hessian approximation ill-conditioned, increase λ_damp or restart with fresh memory
              </li>
              <li>
                <strong>Non-smooth objective</strong> → consider specialized variants
                (OWL-QN for L1) or smoothing techniques
              </li>
              <li>
                <strong>Stale curvature</strong> → problem landscape changes dramatically,
                consider restarting with fresh memory
              </li>
            </ul>
          </div>

          <div className="bg-amber-100 rounded p-3">
            <p className="font-bold text-sm mb-2">When to Switch Algorithms</p>
            <ul className="text-sm list-disc ml-6">
              <li>Problem too small (n &lt; 100) → consider full BFGS or Newton</li>
              <li>Non-smooth objective → use subgradient methods or specialized variants</li>
              <li>Stochastic setting (mini-batches) → use stochastic variants or Adam</li>
              <li>Need exact second-order convergence → use Newton's method</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS - Mathematical Derivations */}
      <CollapsibleSection
        title="Mathematical Derivations"
        defaultExpanded={false}
        storageKey="lbfgs-math-derivations"
        id="mathematical-derivations"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Secant Equation</h3>
            <p>Newton uses: <InlineMath>Hp = -\nabla f</InlineMath> (exact)</p>
            <p className="mt-2">Quasi-Newton: approximate H or H⁻¹ from gradients</p>
            <p className="mt-2"><strong>Key insight:</strong></p>
            <BlockMath>{String.raw`y_k = \nabla f_{k+1} - \nabla f_k \approx H s_k`}</BlockMath>
            <p className="text-sm mt-2">
              Where <InlineMath>{String.raw`s_k = w_{k+1} - w_k`}</InlineMath> (parameter change)
            </p>
            <p className="text-sm mt-2">
              This <strong>secant equation</strong> relates gradient changes to parameter
              changes via approximate Hessian.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">BFGS Update Formula</h3>
            <p>Start with approximation <InlineMath>B_k \approx H</InlineMath></p>
            <p className="mt-2">
              Update to <InlineMath>{String.raw`B_{k+1}`}</InlineMath> satisfying secant equation:
            </p>
            <BlockMath>{String.raw`B_{k+1}s_k = y_k`}</BlockMath>
            <p className="mt-2"><strong>BFGS formula:</strong></p>
            <BlockMath>
              {String.raw`B_{k+1} = B_k - \frac{B_k s_k s_k^T B_k}{ s_k^T B_k s_k} + \frac{y_k y_k^T}{ y_k^T s_k}`}
            </BlockMath>
            <p className="text-sm mt-2">
              Maintains positive definiteness if <InlineMath>{`y_k^T s_k > 0`}</InlineMath>
              (guaranteed by Wolfe line search).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Limited Memory?</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Full BFGS:</strong> stores <InlineMath>B_k</InlineMath> (n×n matrix)
                → O(n²) memory
              </li>
              <li>
                <strong>L-BFGS:</strong> don't store <InlineMath>B_k</InlineMath>, instead
                store M recent <InlineMath>(s,y)</InlineMath> pairs → O(Mn) memory
              </li>
              <li>
                Implicitly represent <InlineMath>{String.raw`B_k^{-1}`}</InlineMath> via two-loop recursion
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Two-Loop Recursion</h3>
            <p className="mb-2">
              <strong>Given:</strong> M pairs <InlineMath>(s_i, y_i)</InlineMath> and
              gradient <InlineMath>q = \nabla f</InlineMath>
            </p>
            <p className="mb-2">
              <strong>Goal:</strong> compute <InlineMath>{String.raw`p = B_k^{-1} q \approx -H^{-1}\nabla f`}</InlineMath>
            </p>

            <div className="bg-indigo-50 rounded p-3 mt-3">
              <p className="font-semibold mb-2">Backward Loop (i = k-1, k-2, ..., k-M):</p>
              <div className="text-sm font-mono space-y-1">
                <div><InlineMath>{String.raw`\rho_i = 1/(y_i^T s_i)`}</InlineMath></div>
                <div><InlineMath>{String.raw`\alpha_i = \rho_i s_i^T q`}</InlineMath></div>
                <div><InlineMath>{String.raw`q \leftarrow q - \alpha_i y_i`}</InlineMath></div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded p-3 mt-3">
              <p className="font-semibold mb-2">Initialize (with Hessian Damping):</p>
              <div className="text-sm space-y-1">
                <div>
                  <InlineMath>{String.raw`\gamma_{\text{base}} = s_{k-1}^T y_{k-1} / y_{k-1}^T y_{k-1}`}</InlineMath>
                </div>
                <div>
                  <InlineMath>{String.raw`\gamma = \gamma_{\text{base}} / (1 + \lambda_{\text{damp}} \cdot \gamma_{\text{base}})`}</InlineMath> (damped)
                </div>
                <div>
                  <InlineMath>{String.raw`r = \gamma I \cdot q = \gamma q`}</InlineMath> where{' '}
                  <InlineMath>{String.raw`H_0^{-1} = \gamma I`}</InlineMath>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  When λ<sub>damp</sub> = 0, this reduces to <InlineMath>{String.raw`\gamma = \gamma_{\text{base}}`}</InlineMath> (pure L-BFGS)
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded p-3 mt-3">
              <p className="font-semibold mb-2">Forward Loop (i = k-M, k-M+1, ..., k-1):</p>
              <div className="text-sm font-mono space-y-1">
                <div><InlineMath>{String.raw`\beta = \rho_i y_i^T r`}</InlineMath></div>
                <div><InlineMath>{String.raw`r \leftarrow r + s_i (\alpha_i - \beta)`}</InlineMath></div>
              </div>
            </div>

            <p className="mt-3">
              <strong>Result:</strong> <InlineMath>{String.raw`p = r \approx -H^{-1}\nabla f`}</InlineMath>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Each (s,y) pair represents one rank-2 update to Hessian approximation</li>
              <li>
                Two-loop recursion applies these updates implicitly without forming{' '}
                <InlineMath>B_k</InlineMath>
              </li>
              <li>
                Mathematically equivalent to full BFGS but O(Mn) instead of O(n²)
              </li>
              <li>Clever matrix algebra exploits structure of BFGS update</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
            <p><strong><GlossaryTooltip termKey="superlinear-convergence" />:</strong></p>
            <BlockMath>{String.raw`\lim_{k \to \infty} \frac{\|e_{k+1}\|}{\|e_k\|} = 0`}</BlockMath>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li>Faster than linear (GD) but slower than quadratic (Newton)</li>
              <li>Depends on M: larger M → closer to Newton rate</li>
              <li>In practice: M=10 often sufficient for near-Newton performance</li>
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
            <h3 className="text-lg font-bold text-purple-800 mb-2">Memory-Computation Tradeoff</h3>
            <p className="mb-2"><strong>M selection guidelines:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>M=3-5:</strong> minimal memory, acceptable for well-conditioned problems</li>
              <li><strong>M=5-10:</strong> good balance for most problems (recommended)</li>
              <li><strong>M=10-20:</strong> better approximation, higher cost</li>
              <li><strong>M&gt;50:</strong> rarely beneficial, diminishing returns</li>
            </ul>
            <p className="text-sm mt-2">
              <strong>Problem-dependent:</strong> Ill-conditioned problems benefit from larger M
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
                    <th className="border p-2">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2"><strong>BFGS</strong></td>
                    <td className="border p-2">O(n²)</td>
                    <td className="border p-2">O(n²)</td>
                    <td className="border p-2">n &lt; 100</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><strong>L-BFGS</strong></td>
                    <td className="border p-2">O(Mn)</td>
                    <td className="border p-2">O(Mn)</td>
                    <td className="border p-2">n &gt; 100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Why Two-Loop Recursion is Efficient</h3>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>
                Avoids forming explicit matrix <InlineMath>B_k</InlineMath> or{' '}
                <InlineMath>{String.raw`B_k^{-1}`}</InlineMath>
              </li>
              <li>
                Implicit representation via <InlineMath>(s,y)</InlineMath> pairs
              </li>
              <li>Applies rank-2 updates in sequence</li>
              <li>Exploits structure of BFGS update formula (Sherman-Morrison-Woodbury)</li>
              <li>Cache-friendly: sequential access to small vectors</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Relationship to Conjugate Gradient</h3>
            <p className="mb-2">Both use history to improve search directions:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Conjugate Gradient:</strong> uses gradient history to build
                conjugate directions
              </li>
              <li>
                <strong>L-BFGS:</strong> uses <InlineMath>(s,y)</InlineMath> history to
                approximate <InlineMath>{String.raw`H^{-1}`}</InlineMath>
              </li>
              <li>
                <strong>For quadratics:</strong> CG converges in at most n steps
              </li>
              <li>
                <strong>For non-quadratic:</strong> L-BFGS more robust and practical
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Modified L-BFGS Methods</h3>

            <div className="mt-2">
              <p className="font-semibold">Hessian Damping (Levenberg-Marquardt style):</p>
              <BlockMath>{'p = -(B + \\lambda I)^{-1}\\nabla f'}</BlockMath>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Regularizes the initial Hessian approximation <InlineMath>{'B_0 = (1/\\gamma)I'}</InlineMath></li>
                <li>Implemented as: <InlineMath>{'\\gamma_{\\text{damped}} = \\gamma/(1 + \\lambda\\gamma)'}</InlineMath></li>
                <li><InlineMath>\lambda=0</InlineMath>: pure L-BFGS; <InlineMath>\lambda\to\infty</InlineMath>: gradient descent</li>
                <li>Exact analog to Newton's Hessian damping, applied to approximate Hessian</li>
                <li>Improves numerical stability without changing the problem significantly (λ ≈ 0.01)</li>
              </ul>
            </div>

            <div className="mt-3">
              <p className="font-semibold">Powell's Damping:</p>
              <p className="text-sm">Modifies gradient differences to ensure positive curvature condition</p>
            </div>
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
