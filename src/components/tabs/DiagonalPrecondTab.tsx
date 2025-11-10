import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationPlayback } from '../IterationPlayback';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { getProblem } from '../../problems';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { Pseudocode, Var } from '../Pseudocode';
import type { ProblemFunctions, AlgorithmSummary } from '../../algorithms/types';
import type { DiagonalPrecondIteration } from '../../algorithms/diagonal-preconditioner';
import type { ExperimentPreset } from '../../types/experiments';
import { isDatasetProblem } from '../../utils/problemHelpers';

type LogisticMinimum = [number, number] | [number, number, number] | null;

interface DiagonalPrecondTabProps {
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;
  diagPrecondLineSearch: 'armijo' | 'none';
  onDiagPrecondLineSearchChange: (val: 'armijo' | 'none') => void;
  diagPrecondC1: number;
  onDiagPrecondC1Change: (val: number) => void;
  diagPrecondHessianDamping: number;
  onDiagPrecondHessianDampingChange: (val: number) => void;
  diagPrecondTolerance: number;
  onDiagPrecondToleranceChange: (val: number) => void;
  diagPrecondFtol: number;
  onDiagPrecondFtolChange: (val: number) => void;
  diagPrecondXtol: number;
  onDiagPrecondXtolChange: (val: number) => void;
  iterations: DiagonalPrecondIteration[];
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

export const DiagonalPrecondTab: React.FC<DiagonalPrecondTabProps> = ({
  maxIter,
  onMaxIterChange,
  initialW0,
  onInitialW0Change,
  initialW1,
  onInitialW1Change,
  diagPrecondLineSearch,
  onDiagPrecondLineSearchChange,
  diagPrecondC1,
  onDiagPrecondC1Change,
  diagPrecondHessianDamping,
  onDiagPrecondHessianDampingChange,
  diagPrecondTolerance,
  onDiagPrecondToleranceChange,
  diagPrecondFtol,
  onDiagPrecondFtolChange,
  diagPrecondXtol,
  onDiagPrecondXtolChange,
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
    () => getExperimentsForAlgorithm('diagonal-precond'),
    []
  );

  return (
    <>
      {/* Diagonal Preconditioner Tab Content */}
      <div className="space-y-4">
        {/* 1. Configuration Section */}
        <CollapsibleSection title="Algorithm Configuration" defaultExpanded={false} data-scroll-target="configuration">
          <AlgorithmConfiguration
            algorithm="diagonal-precond"
            maxIter={maxIter}
            onMaxIterChange={onMaxIterChange}
            initialW0={initialW0}
            onInitialW0Change={onInitialW0Change}
            initialW1={initialW1}
            onInitialW1Change={onInitialW1Change}
            diagPrecondLineSearch={diagPrecondLineSearch}
            onDiagPrecondLineSearchChange={onDiagPrecondLineSearchChange}
            diagPrecondC1={diagPrecondC1}
            onDiagPrecondC1Change={onDiagPrecondC1Change}
            diagPrecondHessianDamping={diagPrecondHessianDamping}
            onDiagPrecondHessianDampingChange={onDiagPrecondHessianDampingChange}
            diagPrecondTolerance={diagPrecondTolerance}
            onDiagPrecondToleranceChange={onDiagPrecondToleranceChange}
            diagPrecondFtol={diagPrecondFtol}
            onDiagPrecondFtolChange={onDiagPrecondFtolChange}
            diagPrecondXtol={diagPrecondXtol}
            onDiagPrecondXtolChange={onDiagPrecondXtolChange}
            problemFuncs={problemFuncs}
            problem={problemDefinition}
            currentProblem={currentProblem}
            bounds={bounds}
            biasSlice={biasSlice}
          />
        </CollapsibleSection>
        {/* 2. Playback Section */}
        {(
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
                algorithm="diagonal-precond"
                iterNum={currentIter}
                totalIters={iterations.length}
                loss={iterations[currentIter].newLoss}
                gradNorm={iterations[currentIter].gradNorm}
                weights={iterations[currentIter].wNew}
                alpha={iterations[currentIter].alpha ?? 1.0}
                gradient={iterations[currentIter].grad}
                direction={iterations[currentIter].direction}
                gradNormHistory={iterations.map(iter => iter.gradNorm)}
                lossHistory={iterations.map(iter => iter.newLoss)}
                alphaHistory={iterations.map(iter => iter.alpha ?? 1.0)}
                weightsHistory={iterations.map(iter => iter.wNew)}
                hessianDiagonal={iterations[currentIter].hessianDiagonal}
                preconditioner={iterations[currentIter].preconditioner}
                lineSearchTrials={iterations[currentIter].lineSearchTrials?.length}
                lineSearchCanvasRef={diagPrecondLineSearch !== 'none' ? lineSearchCanvasRef : undefined}
                tolerance={diagPrecondTolerance}
                ftol={diagPrecondFtol}
                xtol={diagPrecondXtol}
                summary={summary}
                onIterationChange={onIterChange}
              />
            </div>
          )}
        </div>

        {/* Quick Start */}
        <CollapsibleSection
          title="Quick Start"
          defaultExpanded={false}
          storageKey="diagonal-precond-quick-start"
          id="quick-start"
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

            <Pseudocode
              color="teal"
              inputs={[
                {
                  id: "w_0",
                  display: <InlineMath>{'w_0 \\in \\mathbb{R}^d'}</InlineMath>,
                  description: "initial parameter vector"
                },
                {
                  id: "f",
                  display: <InlineMath>f</InlineMath>,
                  description: "objective function to minimize"
                },
                {
                  id: "lambda_damp",
                  display: <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>,
                  description: "Hessian damping parameter"
                }
              ]}
              outputs={[
                {
                  id: "w_star",
                  display: <InlineMath>{'w^*'}</InlineMath>,
                  description: "optimized parameter vector"
                }
              ]}
              steps={[
                <>Initialize <Var id="w"><InlineMath>w</InlineMath></Var> ← <Var id="w_0"><InlineMath>{'w_0'}</InlineMath></Var></>,
                <><strong>repeat</strong> until convergence:</>,
                <>
                  <span className="ml-4">Compute gradient <Var id="grad"><InlineMath>\nabla f(w)</InlineMath></Var></span>
                </>,
                <>
                  <span className="ml-4">Compute Hessian <Var id="H"><InlineMath>H(w)</InlineMath></Var> (matrix of second derivatives)</span>
                </>,
                <>
                  <span className="ml-4">Extract diagonal: <Var id="d_i"><InlineMath>{'d_i'}</InlineMath></Var> ← <Var id="H"><InlineMath>{'H_{ii}'}</InlineMath></Var> for each coordinate <InlineMath>i</InlineMath></span>
                </>,
                <>
                  <span className="ml-4">Build diagonal preconditioner: <Var id="D"><InlineMath>{'D'}</InlineMath></Var> ← <InlineMath>{'\\text{diag}(1/(H_{00}+\\lambda_{\\text{damp}}), 1/(H_{11}+\\lambda_{\\text{damp}}), ...)'}</InlineMath></span>
                </>,
                <>
                  <span className="ml-4">Compute preconditioned direction: <Var id="p"><InlineMath>p</InlineMath></Var> ← −<Var id="D"><InlineMath>D</InlineMath></Var> · <Var id="grad"><InlineMath>\nabla f</InlineMath></Var></span>
                </>,
                <>
                  <span className="ml-4">Line search for step size <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> (or use <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> = 1)</span>
                </>,
                <>
                  <span className="ml-4"><Var id="w"><InlineMath>w</InlineMath></Var> ← <Var id="w"><InlineMath>w</InlineMath></Var> + <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> <Var id="p"><InlineMath>p</InlineMath></Var></span>
                </>,
                <><strong>return</strong> <Var id="w"><InlineMath>w</InlineMath></Var></>
              ]}
            />

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
                    When the Hessian is diagonal (e.g., <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath>),
                    our diagonal preconditioner <InlineMath>{`D = H^{-1}`}</InlineMath> exactly! Converges in
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
                  <strong>Hessian damping (λ<sub>damp</sub>):</strong> Numerical stability term prevents division by zero. Increase if you see instability.
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

        {/* Why Diagonal Fails on Rotation */}
        <CollapsibleSection
          title="Why Diagonal Preconditioner Fails on Rotated Problems"
          defaultExpanded={false}
          storageKey="diagonal-precond-rotation-failure"
          id="rotation-failure"
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
                  <p className="text-sm mb-2">Function: <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath></p>
                  <p className="text-sm mb-2">Hessian:</p>
                  <BlockMath>{String.raw`H = \begin{bmatrix} 2 & 0 \\ 0 & 200 \end{bmatrix}`}</BlockMath>
                  <p className="text-sm mt-2">
                    Diagonal preconditioner: <InlineMath>{'D = \\text{diag}(1/2, 1/200)'}</InlineMath>
                  </p>
                  <p className="text-sm mt-2 font-semibold">
                    Result: <InlineMath>{`D = H^{-1}`}</InlineMath> exactly! Converges immediately.
                  </p>
                </div>

                <div className="border border-red-300 rounded p-3 bg-red-50">
                  <p className="font-semibold text-red-900 mb-2">✗ Rotated 45° (Fails)</p>
                  <p className="text-sm mb-2">Function: <InlineMath>f(u,v) = u^2 + 100v^2</InlineMath></p>
                  <p className="text-sm mb-2">In (x,y) coordinates after rotation:</p>
                  <BlockMath>{String.raw`H = \begin{bmatrix} 51 & 49 \\ 49 & 51 \end{bmatrix}`}</BlockMath>
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
                approximation to <InlineMath>{`H^{-1}`}</InlineMath>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">What Newton's Method Does Better</h3>
              <p className="mb-2">
                Newton's method computes the full matrix inverse <InlineMath>{`H^{-1}`}</InlineMath>,
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

        {/* Try This */}
        <CollapsibleSection
          title="Try This"
          defaultExpanded={false}
          storageKey="diagonal-precond-try-this"
          id="try-this"
        >
          <div className="space-y-3">
            <p className="text-gray-800 mb-4">
              Run these experiments to see when diagonal preconditioning excels and when it struggles:
            </p>

            <ExperimentCardList
              experiments={experiments}
              experimentLoading={experimentLoading}
              onLoadExperiment={onLoadExperiment}
            />
          </div>
        </CollapsibleSection>
      </div>
    </>
  );
};
