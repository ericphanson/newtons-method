import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationPlayback } from '../IterationPlayback';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { GlossaryTooltip } from '../GlossaryTooltip';
import { getProblem } from '../../problems';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { fmt, fmtVec } from '../../shared-utils';
import { Pseudocode, Var } from '../Pseudocode';
import type { ProblemFunctions, AlgorithmSummary } from '../../algorithms/types';
import type { LBFGSIteration } from '../../algorithms/lbfgs';
import type { ExperimentPreset } from '../../types/experiments';

type LogisticMinimum = [number, number] | [number, number, number] | null;

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
  summary: AlgorithmSummary | null;
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  biasSlice: number;
  logisticGlobalMin: LogisticMinimum;
  paramCanvasRef: React.RefObject<HTMLCanvasElement>;
  lineSearchCanvasRef: React.RefObject<HTMLCanvasElement>;
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
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
  summary,
  problemFuncs,
  problem: problemDefinition,
  currentProblem,
  bounds,
  biasSlice,
  logisticGlobalMin,
  paramCanvasRef,
  lineSearchCanvasRef,
  experimentLoading,
  onLoadExperiment,
}) => {
  const experiments = React.useMemo(
    () => getExperimentsForAlgorithm('lbfgs'),
    []
  );

  return (
    <>
      {/* 1. Configuration Section */}
      <CollapsibleSection title="Algorithm Configuration" defaultExpanded={false} data-scroll-target="configuration">
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
          biasSlice={biasSlice}
        />
      </CollapsibleSection>

      {/* 2. Playback Section */}
      {iterations.length > 0 && (
        <IterationPlayback
          currentIter={currentIter}
          totalIters={iterations.length}
          onIterChange={onIterChange}
          onReset={onResetIter}
        />
      )}

      {/* 3. Side-by-Side: Canvas + Metrics */}
      <div className="flex gap-4 mb-6" data-scroll-target="canvas">
        {/* Left: Parameter Space Visualization */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4" id="parameter-space">
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

          <canvas ref={paramCanvasRef} style={{ width: '100%', height: '500px' }} className="border border-gray-300 rounded" />

          {/* Legend for optimum markers */}
          {currentProblem !== 'logistic-regression' && (
            <div className="mt-3 flex gap-4 text-sm text-gray-700">
              {(() => {
                const problem = getProblem(currentProblem);
                if (!problem) return null;
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
              summary={summary}
              onIterationChange={onIterChange}
            />
          </div>
        )}
      </div>

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
              but computing H costs O(n³). <strong>L-BFGS approximates</strong>{' '}
              <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> using only recent gradient changes—no
              Hessian computation needed. We add Hessian damping (Levenberg-Marquardt regularization) for
              numerical stability.
            </p>
          </div>

          <Pseudocode
            color="amber"
            inputs={[
              {
                id: "w",
                display: <InlineMath>w \in \mathbb{'R'}^d</InlineMath>,
                description: "current parameter vector"
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
                display: <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>,
                description: "Hessian damping parameter"
              }
            ]}
            outputs={[
              {
                id: "w_new",
                display: <InlineMath>w'</InlineMath>,
                description: "updated parameter vector"
              }
            ]}
            steps={[
              <>Compute gradient <Var id="grad"><InlineMath>\nabla f(<Var id="w">w</Var>)</InlineMath></Var></>,
              <>
                Use <strong>two-loop recursion</strong> to compute{' '}
                <Var id="p"><InlineMath>p</InlineMath></Var> ≈ −<Var id="H_inv"><InlineMath>{'H^{-1}'}</InlineMath></Var><Var id="grad"><InlineMath>\nabla f</InlineMath></Var> from <Var id="M"><InlineMath>M</InlineMath></Var> recent (<Var id="s"><InlineMath>s</InlineMath></Var>,<Var id="y"><InlineMath>y</InlineMath></Var>) pairs
              </>,
              <>Add damping to initial Hessian approximation: <Var id="B_0"><InlineMath>{'B_0'}</InlineMath></Var> + <Var id="lambda_damp"><InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath></Var> · <Var id="I"><InlineMath>I</InlineMath></Var></>,
              <>Line search for step size <Var id="alpha"><InlineMath>\alpha</InlineMath></Var></>,
              <>Update <Var id="w"><InlineMath>w</InlineMath></Var> ← <Var id="w"><InlineMath>w</InlineMath></Var> + <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> <Var id="p"><InlineMath>p</InlineMath></Var></>,
              <>
                Store new pair: <Var id="s"><InlineMath>s</InlineMath></Var> = <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> <Var id="p"><InlineMath>p</InlineMath></Var> (parameter change),{' '}
                <Var id="y"><InlineMath>y</InlineMath></Var> = <Var id="grad"><InlineMath>{'\\nabla f_{\\text{new}}'}</InlineMath></Var> − <Var id="grad"><InlineMath>{'\\nabla f_{\\text{old}}'}</InlineMath></Var> (gradient change)
              </>,
              <>Keep only <Var id="M"><InlineMath>M</InlineMath></Var> most recent pairs (discard oldest)</>
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
              <strong>Implementation:</strong> Damping is applied by modifying the initial scaling factor: <InlineMath>{'\\gamma_{\\text{damped}} = \\gamma/(1 + \\lambda_{\\text{damp}}\\gamma)'}</InlineMath>,
              which is mathematically equivalent to <InlineMath>{String.raw`(B_0 + \lambda I)^{-1}`}</InlineMath> where <InlineMath>{'B_0 = (1/\\gamma)I'}</InlineMath>.
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
            <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
            <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
            <p className="text-sm mt-2">
              Where <InlineMath>c_1 = </InlineMath>{lbfgsC1.toFixed(4)} controls how much decrease we require.
            </p>

            <div className="mt-3">
              <p className="font-semibold">Backtracking Algorithm:</p>
              <ol className="list-decimal ml-6 space-y-1 text-sm">
                <li>Start with <InlineMath>\alpha = 1</InlineMath> (try full step first)</li>
                <li>Check if Armijo condition satisfied</li>
                <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
                <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
              </ol>
            </div>

            <p className="text-sm mt-3">
              <strong>Typical behavior:</strong> When the quasi-Newton approximation is good
              (near minimum, after building history), <InlineMath>\alpha = 1</InlineMath> is
              often accepted. When approximation is poor (early iterations, far from minimum),
              backtracking finds smaller steps.
            </p>
          </div>

          <div className="bg-amber-100 rounded p-3">
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

      {/* L-BFGS Memory Section */}
      <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">L-BFGS Memory</h2>
        <div className="space-y-3 text-gray-800 mb-4">
          <p><strong>What it is:</strong> Instead of storing the full Hessian H (n×n matrix), we store only M={lbfgsM} recent (s, y) pairs.</p>
          <p><strong>s</strong> = parameter change = <InlineMath>{String.raw`w_{\text{new}} - w_{\text{old}}`}</InlineMath> (where we moved)</p>
          <p><strong>y</strong> = gradient change = <InlineMath>{String.raw`\nabla f_{\text{new}} - \nabla f_{\text{old}}`}</InlineMath> (how the slope changed)</p>
          <p><strong>Why it works:</strong> These pairs implicitly capture curvature: "when we moved in direction s, the gradient changed by y". This is enough to approximate H⁻¹!</p>
        </div>

        {iterations[currentIter]?.memory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
              <thead className="bg-amber-200">
                <tr>
                  <th className="px-4 py-2 text-left">Pair</th>
                  <th className="px-4 py-2 text-left">s (parameter change)</th>
                  <th className="px-4 py-2 text-left">y (gradient change)</th>
                  <th className="px-4 py-2 text-left">sᵀy</th>
                  <th className="px-4 py-2 text-left">ρ = 1/(sᵀy)</th>
                </tr>
              </thead>
              <tbody>
                {iterations[currentIter].memory.map((mem, idx) => (
                  <tr key={idx} className="border-t border-amber-200">
                    <td className="px-4 py-2 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2 font-mono">{fmtVec(mem.s)}</td>
                    <td className="px-4 py-2 font-mono">{fmtVec(mem.y)}</td>
                    <td className="px-4 py-2 font-mono">{fmt(1 / mem.rho)}</td>
                    <td className="px-4 py-2 font-mono">{fmt(mem.rho)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center">
            <p className="text-amber-800 font-semibold">No memory pairs yet (Iteration 0)</p>
            <p className="text-sm text-amber-700 mt-2">Memory will be populated starting from iteration 1. First iteration uses steepest descent direction.</p>
          </div>
        )}
      </div>

      {/* Two-Loop Recursion */}
      <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Two-Loop Recursion Details</h2>
        <div className="space-y-3 text-gray-800 mb-4">
          <p><strong>Goal:</strong> Compute p ≈ -H⁻¹∇f using only the stored (s, y) pairs.</p>
          <p><strong>Intuition:</strong> Transform the gradient by "undoing" the effect of past updates (first loop), scale by typical curvature, then "redo" them with corrections (second loop).</p>
          <p><strong>Efficiency:</strong> O(m·n) = O({lbfgsM}·3) = {lbfgsM * 3} operations vs O(n³) = O(27) for full Hessian inversion!</p>
        </div>

        {iterations[currentIter]?.twoLoopData ? (
          <>
            <h3 className="text-xl font-bold text-indigo-800 mb-3">First Loop (Backward Pass)</h3>
            <p className="text-gray-800 mb-3">Start with q = ∇f. For each stored pair (newest to oldest), remove its effect on the gradient.</p>
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
              <p className="mt-2">r = γq. This estimates typical curvature from the most recent pair.</p>
            </div>

            <h3 className="text-xl font-bold text-indigo-800 mb-3">Second Loop (Forward Pass)</h3>
            <p className="text-gray-800 mb-3">Now apply corrections by adding back scaled parameter changes.</p>
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
    </>
  );
};
