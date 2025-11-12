import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { resolveProblem, requiresDataset } from '../../problems/registry';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { Pseudocode, Complexity } from '../Pseudocode';
import { GlossaryTooltip } from '../GlossaryTooltip';
import type { ProblemFunctions } from '../../algorithms/types';
import type { DiagonalPrecondIteration } from '../../algorithms/diagonal-preconditioner';
import type { ExperimentPreset } from '../../types/experiments';
import { computeIterationSummary } from '../../utils/iterationSummaryUtils';

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
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  problemParameters: Record<string, number | string>;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
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
  problemFuncs,
  problem: problemDefinition,
  currentProblem,
  problemParameters,
  bounds,
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
                summary={computeIterationSummary({
                  currentIndex: currentIter,
                  totalIterations: iterations.length,
                  gradNorm: iterations[currentIter].gradNorm,
                  loss: iterations[currentIter].newLoss,
                  location: iterations[currentIter].wNew,
                  gtol: diagPrecondTolerance,
                  ftol: diagPrecondFtol,
                  xtol: diagPrecondXtol,
                  isSecondOrder: false,
                  maxIter,
                  previousLoss: currentIter > 0 ? iterations[currentIter - 1].newLoss : undefined,
                  previousLocation: currentIter > 0 ? iterations[currentIter - 1].wNew : undefined
                })}
                onIterationChange={onIterChange}
              />
            </div>
          )}
        </div>

        {/* Quick Start */}
        <CollapsibleSection
          title="Quick Start"
          defaultExpanded={true}
          storageKey="diagonal-precond-quick-start"
          id="quick-start"
        >
          <div className="space-y-4 text-gray-800">
            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">What Is Diagonal Preconditioning?</h3>
              <p>
                Diagonal preconditioning uses per-coordinate adaptive learning rates based on the diagonal of the <GlossaryTooltip termKey="hessian" />.
                Instead of one step size for all directions (gradient descent) or computing the full inverse Hessian (Newton's method),
                it uses just the <strong>diagonal</strong> of the Hessian to scale each coordinate independently.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">When to Use</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Axis-aligned problems:</strong> When the Hessian is diagonal or nearly diagonal,
                  this method achieves Newton-like convergence in 1-2 iterations
                </li>
                <li>
                  <strong>Need per-coordinate learning rates:</strong> When different coordinates have vastly
                  different scales or curvatures
                </li>
                <li>
                  <strong>Cannot afford full Newton:</strong> When <InlineMath>O(d^3)</InlineMath> matrix inversion
                  is too expensive but you can compute the Hessian diagonal
                </li>
                <li>
                  <strong>Avoid for rotated problems:</strong> Fails when Hessian has large off-diagonal terms
                  (coordinate coupling). Use Newton's method or L-BFGS instead.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">Key Parameters</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Hessian damping (<InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath>):</strong> Numerical
                  stability term added to diagonal elements. Prevents division by zero when Hessian has zero eigenvalues.
                  Costs <InlineMath>O(d)</InlineMath> per iteration.
                </li>
                <li>
                  <strong>Line Search:</strong> Optional Armijo backtracking for step size. Use for robustness on
                  non-quadratic problems. Disable (<InlineMath>\alpha = 1</InlineMath>) for pure diagonal Newton
                  step on quadratic problems.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">What to Try</h3>
              <p>
                See the <strong>"Try This"</strong> section below for experiments demonstrating when diagonal
                preconditioning excels (axis-aligned quadratics) and when it fails (rotated problems).
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
              <p className="font-semibold text-blue-900 mb-2">💡 Key Insight</p>
              <p className="text-sm text-blue-800">
                Diagonal preconditioning is the simplest <GlossaryTooltip termKey="second-order-method" />. It captures
                per-coordinate curvature but ignores coordinate coupling. Think of it as "Newton's method
                if the world were axis-aligned."
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* How It Works */}
        <CollapsibleSection
          title="How Diagonal Preconditioning Works"
          defaultExpanded={false}
          storageKey="diagonal-precond-how-it-works"
          id="how-it-works"
        >
          <div className="space-y-4 text-gray-800">
            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">High-Level Algorithm</h3>
              <p className="mb-3">
                Let <InlineMath>{String.raw`w \in \mathbb{R}^d`}</InlineMath> be the parameter vector we want to optimize,
                where <InlineMath>d</InlineMath> is the dimension (number of parameters).
                Let <InlineMath>{String.raw`i \in \{0, 1, ..., d-1\}`}</InlineMath> index individual coordinates.
              </p>
            </div>

            <Pseudocode
              color="teal"
              inputs={[
                {
                  id: "w_0",
                  display: <InlineMath>{String.raw`w_0 \in \mathbb{R}^d`}</InlineMath>,
                  description: "initial parameter vector"
                },
                {
                  id: "f",
                  display: <InlineMath>f</InlineMath>,
                  description: "objective function to minimize"
                },
                {
                  id: "lambda_damp",
                  display: <InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath>,
                  description: "Hessian damping parameter"
                }
              ]}
              outputs={[
                {
                  id: "w_star",
                  display: <InlineMath>{String.raw`w^*`}</InlineMath>,
                  description: "optimized parameter vector"
                }
              ]}
              steps={[
                <>Initialize <InlineMath>\varW \leftarrow w_0</InlineMath> <Complexity>O(1)</Complexity></>,
                <><strong>repeat</strong> until convergence:</>,
                <>
                  <span className="ml-4">Compute gradient <InlineMath>\varGrad = \nabla f(\varW)</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Compute Hessian <InlineMath>\varH = H(\varW)</InlineMath> (matrix of second derivatives) <Complexity explanation="Problem-dependent">1 H eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4"><strong>for</strong> each coordinate <InlineMath>i = 0</InlineMath> to <InlineMath>d-1</InlineMath>:</span>
                </>,
                <>
                  <span className="ml-8">Extract diagonal element: <InlineMath>{String.raw`d_i \leftarrow H_{ii}`}</InlineMath> <Complexity>O(1)</Complexity></span>
                </>,
                <>
                  <span className="ml-8">Compute preconditioner entry: <InlineMath>{String.raw`D_{ii} \leftarrow 1/(d_i + \lambda_{\text{damp}})`}</InlineMath> <Complexity>O(1)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Compute preconditioned direction: <InlineMath>\varP = -\varD \cdot \varGrad</InlineMath> (element-wise multiply) <Complexity explanation="Element-wise multiply">O(d)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Line search for step size <InlineMath>\varAlpha</InlineMath> (or use <InlineMath>\varAlpha = 1</InlineMath>) <Complexity explanation="Optional backtracking">0-4 f evals</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Update parameters: <InlineMath>\varW \leftarrow \varW + \varAlpha \varP</InlineMath> <Complexity explanation="Vector addition">O(d)</Complexity></span>
                </>,
                <><strong>return</strong> <InlineMath>\varW</InlineMath> <Complexity>O(1)</Complexity></>
              ]}
            />

            <div className="mt-4">
              <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Update Rule</h3>
              <p className="mb-2">
                At each iteration, we update parameters using per-coordinate adaptive learning rates
                derived from the Hessian diagonal:
              </p>
              <BlockMath>{String.raw`w \leftarrow w - D \cdot \nabla f(w)`}</BlockMath>
              <p className="text-sm mt-2">
                where <InlineMath>{String.raw`D = \text{diag}(1/H_{00}, 1/H_{11}, ..., 1/H_{d-1,d-1})`}</InlineMath> is
                a diagonal matrix containing the inverse of each Hessian diagonal element. The damping
                term <InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath> ensures numerical stability
                when diagonal entries are near zero.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">Computational Cost</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Per iteration:</strong> <InlineMath>O(d^2)</InlineMath> to compute Hessian, <InlineMath>O(d)</InlineMath> for diagonal extraction and preconditioner construction</li>
                <li><strong>Memory:</strong> <InlineMath>O(d^2)</InlineMath> for Hessian (if stored), <InlineMath>O(d)</InlineMath> for diagonal preconditioner</li>
                <li><strong>Cheaper than Newton:</strong> No matrix inversion (<InlineMath>O(d^3)</InlineMath>), just element-wise division (<InlineMath>O(d)</InlineMath>)</li>
                <li><strong>More expensive than gradient descent:</strong> Requires full Hessian computation</li>
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-3">
              <p className="text-sm text-green-900 font-semibold mb-1">✅ Perfect on Axis-Aligned Problems</p>
              <p className="text-sm text-green-800">
                When the Hessian is diagonal (e.g., <InlineMath>{String.raw`f(x,y) = x^2 + 100y^2`}</InlineMath>),
                the diagonal preconditioner <InlineMath>{String.raw`D = H^{-1}`}</InlineMath> exactly! This achieves
                Newton-like convergence in 1-2 iterations because we're capturing all the curvature information.
              </p>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-3">
              <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ Fails on Rotated Problems</p>
              <p className="text-sm text-amber-800">
                When the Hessian has large off-diagonal terms (coordinate coupling), the diagonal approximation
                completely ignores this information. The method zig-zags like gradient descent and requires
                many iterations. See the "Why Diagonal Fails on Rotation" section below for mathematical details.
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
                A diagonal preconditioner only uses the main diagonal of the Hessian matrix
                (<InlineMath>{String.raw`H_{00}, H_{11}, ..., H_{d-1,d-1}`}</InlineMath>) and
                completely ignores the off-diagonal terms (<InlineMath>{String.raw`H_{ij}`}</InlineMath> where <InlineMath>i \neq j</InlineMath>).
                This works when the Hessian is diagonal (or nearly diagonal), but fails when coordinates are coupled.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">Example: Axis-Aligned vs Rotated</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-300 rounded p-3 bg-green-50">
                  <p className="font-semibold text-green-900 mb-2">✓ Axis-Aligned (Perfect)</p>
                  <p className="text-sm mb-2">Function: <InlineMath>{String.raw`f(x,y) = x^2 + 100y^2`}</InlineMath></p>
                  <p className="text-sm mb-2">Hessian:</p>
                  <BlockMath>{String.raw`H = \begin{bmatrix} 2 & 0 \\ 0 & 200 \end{bmatrix}`}</BlockMath>
                  <p className="text-sm mt-2">
                    Diagonal preconditioner: <InlineMath>{String.raw`D = \text{diag}(1/2, 1/200)`}</InlineMath>
                  </p>
                  <p className="text-sm mt-2 font-semibold">
                    Result: <InlineMath>{String.raw`D = H^{-1}`}</InlineMath> exactly! Converges immediately.
                  </p>
                </div>

                <div className="border border-red-300 rounded p-3 bg-red-50">
                  <p className="font-semibold text-red-900 mb-2">✗ Rotated 45° (Fails)</p>
                  <p className="text-sm mb-2">Function: <InlineMath>{String.raw`f(u,v) = u^2 + 100v^2`}</InlineMath></p>
                  <p className="text-sm mb-2">In <InlineMath>(x,y)</InlineMath> coordinates after rotation:</p>
                  <BlockMath>{String.raw`H = \begin{bmatrix} 51 & 49 \\ 49 & 51 \end{bmatrix}`}</BlockMath>
                  <p className="text-sm mt-2">
                    Diagonal preconditioner: <InlineMath>{String.raw`D \approx \text{diag}(1/51, 1/51)`}</InlineMath>
                  </p>
                  <p className="text-sm mt-2 font-semibold text-red-900">
                    Result: Ignores off-diagonal 49! Wrong scaling, many iterations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
              <p className="font-semibold text-blue-900 mb-2">💡 The Mathematical Issue</p>
              <p className="text-sm text-blue-800 mb-2">
                The inverse of a matrix is NOT just the inverse of its diagonal:
              </p>
              <BlockMath>
                {String.raw`H^{-1} \neq \text{diag}(1/H_{00}, 1/H_{11}, ...)`}
              </BlockMath>
              <p className="text-sm text-blue-800 mt-2">
                When <InlineMath>\varH</InlineMath> has large off-diagonal terms, computing only the diagonal gives a poor
                approximation to <InlineMath>{String.raw`H^{-1}`}</InlineMath>. The off-diagonal terms encode how
                coordinates are coupled, which is critical information for choosing the right step direction.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">What Newton's Method Does Better</h3>
              <p className="mb-2">
                Newton's method computes the full matrix inverse <InlineMath>{String.raw`H^{-1}`}</InlineMath>,
                which properly handles:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Coupling between coordinates (off-diagonal terms)</li>
                <li>Rotation of the coordinate system</li>
                <li>Both scaling AND rotation of the step direction</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Cost tradeoff:</strong> Newton needs <InlineMath>O(d^3)</InlineMath> for matrix inversion vs <InlineMath>O(d^2)</InlineMath> for
                Hessian computation + <InlineMath>O(d)</InlineMath> for diagonal extraction in diagonal preconditioning.
              </p>
            </div>

            <div className="bg-indigo-100 rounded p-4">
              <p className="font-bold text-indigo-900 mb-2">Key Takeaways</p>
              <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
                <li>
                  Use diagonal preconditioning when you know the problem is axis-aligned or when you
                  need something cheaper than Newton but better than gradient descent
                </li>
                <li>
                  Use Newton's method when you need rotation invariance and can afford the <InlineMath>O(d^3)</InlineMath> cost
                </li>
                <li>
                  Consider L-BFGS as a middle ground: approximates <InlineMath>{String.raw`H^{-1}`}</InlineMath> including
                  off-diagonal structure using only <InlineMath>O(Md)</InlineMath> memory and time
                </li>
              </ul>
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
