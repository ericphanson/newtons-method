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
import { Citation } from '../Citation';
import { References } from '../References';
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
  onNavigateToTab?: (tabId: string) => void;
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
  onNavigateToTab,
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
              <h3 className="text-lg font-bold text-teal-800 mb-2">What Is It?</h3>
              <p>
                Diagonal preconditioning uses per-coordinate adaptive learning rates based on the diagonal of the <GlossaryTooltip termKey="hessian" /> <InlineMath>\varH</InlineMath>.
                Instead of one step size for all directions (gradient descent) or computing the full inverse Hessian <InlineMath>{String.raw`\varH^{-1}`}</InlineMath> (Newton's method),
                it uses just the <strong>diagonal</strong> of <InlineMath>\varH</InlineMath> to scale each coordinate independently.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">When to Use</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Axis-aligned problems:</strong> When <InlineMath>\varH</InlineMath> is diagonal or nearly diagonal,
                  this method can achieve fast convergence. On strictly <GlossaryTooltip termKey="convex" /> quadratic functions with diagonal <InlineMath>\varH</InlineMath>,
                  diagonal preconditioning with <InlineMath>{String.raw`\varAlpha = 1`}</InlineMath> equals Newton's method and converges in one iteration<Citation citationKey="newton-computational-complexity" />
                </li>
                <li>
                  <strong>Need per-coordinate learning rates:</strong> When different coordinates have vastly
                  different scales or curvatures
                </li>
                <li>
                  <strong>Cannot afford full Newton:</strong> When <InlineMath>O(d^3)</InlineMath> matrix inversion
                  is too expensive but you can compute the Hessian diagonal in <InlineMath>O(d^2)</InlineMath> time
                </li>
                <li>
                  <strong>Avoid for rotated problems:</strong> Fails when <InlineMath>\varH</InlineMath> has large off-diagonal terms
                  (coordinate coupling). Use {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('newton')}
                      className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      Newton's method
                    </button>
                  ) : (
                    <strong>Newton's method</strong>
                  )} or {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('lbfgs')}
                      className="font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      L-BFGS
                    </button>
                  ) : (
                    <strong>L-BFGS</strong>
                  )} instead.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">Key Parameters</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong>Hessian damping (<InlineMath>\varLambdaDamp</InlineMath>):</strong> Numerical
                  stability term added to diagonal elements. Prevents division by zero when Hessian has zero or small eigenvalues.
                  Costs <InlineMath>O(d)</InlineMath> per iteration.
                </li>
                <li>
                  <strong>Line Search:</strong> Optional Armijo backtracking for step size <InlineMath>\varAlpha</InlineMath> (see {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('gd-linesearch')}
                      className="font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      GD with Line Search tab
                    </button>
                  ) : (
                    <strong>GD with Line Search tab</strong>
                  )} for details). Use for robustness on
                  non-quadratic problems. Disable (<InlineMath>\varAlpha = 1</InlineMath>) for pure diagonal Newton
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
                  display: <InlineMath>{String.raw`\varWZero \in \mathbb{R}^d`}</InlineMath>,
                  description: "initial parameter vector"
                },
                {
                  id: "f",
                  display: <InlineMath>\varF</InlineMath>,
                  description: "objective function to minimize"
                },
                {
                  id: "lambda_damp",
                  display: <InlineMath>\varLambdaDamp</InlineMath>,
                  description: "Hessian damping parameter"
                }
              ]}
              outputs={[
                {
                  id: "w_star",
                  display: <InlineMath>{String.raw`\varW^*`}</InlineMath>,
                  description: "optimized parameter vector"
                }
              ]}
              steps={[
                <>Initialize <InlineMath>{String.raw`\varW \leftarrow \varWZero`}</InlineMath> <Complexity>O(1)</Complexity></>,
                <><strong>repeat</strong> until convergence:</>,
                <>
                  <span className="ml-4">Compute gradient <InlineMath>{String.raw`\varGrad = \nabla f(\varW)`}</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Compute Hessian <InlineMath>{String.raw`\varH = H(\varW)`}</InlineMath> (matrix of second derivatives) <Complexity explanation="Problem-dependent">1 H eval</Complexity></span>
                </>,
                <>
                  <span className="ml-4"><strong>for</strong> each coordinate <InlineMath>{String.raw`i = 0`}</InlineMath> to <InlineMath>{String.raw`d-1`}</InlineMath>:</span>
                </>,
                <>
                  <span className="ml-8">Extract diagonal element: <InlineMath>{String.raw`d_i \leftarrow H_{ii}`}</InlineMath> <Complexity>O(1)</Complexity></span>
                </>,
                <>
                  <span className="ml-8">Compute preconditioner entry: <InlineMath>{String.raw`D_{ii} \leftarrow 1/(d_i + \varLambdaDamp)`}</InlineMath> <Complexity>O(1)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Compute preconditioned direction: <InlineMath>{String.raw`\varP = -\varD \cdot \varGrad`}</InlineMath> (element-wise multiply) <Complexity explanation="Element-wise multiply">O(d)</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Line search for step size <InlineMath>\varAlpha</InlineMath> (or use <InlineMath>{String.raw`\varAlpha = 1`}</InlineMath>) <Complexity explanation="Optional backtracking">0-4 f evals</Complexity></span>
                </>,
                <>
                  <span className="ml-4">Update parameters: <InlineMath>{String.raw`\varW \leftarrow \varW + \varAlpha \varP`}</InlineMath> <Complexity explanation="Vector addition">O(d)</Complexity></span>
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
              <BlockMath>{String.raw`\varW \leftarrow \varW - \varD \cdot \varGrad`}</BlockMath>
              <p className="text-sm mt-2">
                where <InlineMath>\varGrad = \nabla f(\varW)</InlineMath> is the gradient, and <InlineMath>{String.raw`\varD = \text{diag}(1/H_{00}, 1/H_{11}, ..., 1/H_{d-1,d-1})`}</InlineMath> is
                a diagonal matrix containing the inverse of each Hessian diagonal element (plus damping). The damping
                term <InlineMath>\varLambdaDamp</InlineMath> ensures numerical stability
                when diagonal entries are near zero: <InlineMath>{String.raw`D_{ii} = 1/(H_{ii} + \varLambdaDamp)`}</InlineMath>.
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
              <p className="text-sm text-green-900 font-semibold mb-1">✅ Perfect on Axis-Aligned Quadratics</p>
              <p className="text-sm text-green-800">
                When <InlineMath>\varH</InlineMath> is diagonal (e.g., <InlineMath>{String.raw`f(x,y) = x^2 + 100y^2`}</InlineMath>),
                the diagonal preconditioner <InlineMath>{String.raw`\varD = \varH^{-1}`}</InlineMath> exactly (ignoring damping)! For strictly convex quadratic functions
                with diagonal Hessian, diagonal preconditioning with <InlineMath>{String.raw`\varAlpha = 1`}</InlineMath> IS Newton's method,
                which converges in one iteration on quadratics.<Citation citationKey="newton-computational-complexity" /> The Hessian is constant for quadratics, making the
                diagonal approximation exact since all curvature information is on the diagonal.
              </p>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-3">
              <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ Fails on Rotated Problems</p>
              <p className="text-sm text-amber-800">
                When <InlineMath>\varH</InlineMath> has large off-diagonal terms (coordinate coupling), the diagonal approximation
                completely ignores this information. The method zig-zags like {onNavigateToTab ? (
                  <button
                    onClick={() => onNavigateToTab('gd-fixed')}
                    className="font-semibold text-green-700 hover:text-green-900 underline cursor-pointer"
                  >
                    gradient descent
                  </button>
                ) : (
                  <strong>gradient descent</strong>
                )} and requires
                many iterations. See the <strong>"Why Diagonal Fails on Rotation"</strong> section below for mathematical details.
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
                A diagonal preconditioner only uses the main diagonal of the Hessian matrix <InlineMath>\varH</InlineMath>
                (<InlineMath>{String.raw`H_{00}, H_{11}, ..., H_{d-1,d-1}`}</InlineMath>) and
                completely ignores the off-diagonal terms (<InlineMath>{String.raw`H_{ij}`}</InlineMath> where <InlineMath>{String.raw`i \neq j`}</InlineMath>).
                This works when <InlineMath>\varH</InlineMath> is diagonal (or nearly diagonal), but fails when coordinates are coupled.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">Example: Axis-Aligned vs Rotated</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-300 rounded p-3 bg-green-50">
                  <p className="font-semibold text-green-900 mb-2">✓ Axis-Aligned (Perfect)</p>
                  <p className="text-sm mb-2">Function: <InlineMath>{String.raw`f(x,y) = x^2 + 100y^2`}</InlineMath></p>
                  <p className="text-sm mb-2">Hessian:</p>
                  <BlockMath>{String.raw`\varH = \begin{bmatrix} 2 & 0 \\ 0 & 200 \end{bmatrix}`}</BlockMath>
                  <p className="text-sm mt-2">
                    Diagonal preconditioner: <InlineMath>{String.raw`\varD = \text{diag}(1/2, 1/200)`}</InlineMath>
                  </p>
                  <p className="text-sm mt-2 font-semibold">
                    Result: <InlineMath>{String.raw`\varD = \varH^{-1}`}</InlineMath> exactly! Converges immediately.
                  </p>
                </div>

                <div className="border border-red-300 rounded p-3 bg-red-50">
                  <p className="font-semibold text-red-900 mb-2">✗ Rotated 45° (Fails)</p>
                  <p className="text-sm mb-2">Function: <InlineMath>{String.raw`f(u,v) = u^2 + 100v^2`}</InlineMath></p>
                  <p className="text-sm mb-2">In <InlineMath>{String.raw`(x,y)`}</InlineMath> coordinates after rotation:</p>
                  <BlockMath>{String.raw`\varH = \begin{bmatrix} 51 & 49 \\ 49 & 51 \end{bmatrix}`}</BlockMath>
                  <p className="text-sm mt-2">
                    Diagonal preconditioner: <InlineMath>{String.raw`\varD \approx \text{diag}(1/51, 1/51)`}</InlineMath>
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
                {String.raw`\varH^{-1} \neq \text{diag}(1/H_{00}, 1/H_{11}, ...)`}
              </BlockMath>
              <p className="text-sm text-blue-800 mt-2">
                When <InlineMath>\varH</InlineMath> has large off-diagonal terms, computing only the diagonal gives a poor
                approximation to <InlineMath>{String.raw`\varH^{-1}`}</InlineMath>. The off-diagonal terms encode how
                coordinates are coupled, which is critical information for choosing the right step direction.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">What Newton's Method Does Better</h3>
              <p className="mb-2">
                {onNavigateToTab ? (
                  <button
                    onClick={() => onNavigateToTab('newton')}
                    className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                  >
                    Newton's method
                  </button>
                ) : (
                  <strong>Newton's method</strong>
                )} computes the full matrix inverse <InlineMath>{String.raw`\varH^{-1}`}</InlineMath>,
                which properly handles:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Coupling between coordinates (off-diagonal terms)</li>
                <li>Rotation of the coordinate system</li>
                <li>Both scaling AND rotation of the step direction</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Cost tradeoff:</strong> Newton needs <InlineMath>{String.raw`O(d^3)`}</InlineMath> for matrix inversion<Citation citationKey="newton-computational-complexity" /> vs <InlineMath>{String.raw`O(d^2)`}</InlineMath> for
                Hessian computation + <InlineMath>{String.raw`O(d)`}</InlineMath> for diagonal extraction in diagonal preconditioning.
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
                  Use {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('newton')}
                      className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      Newton's method
                    </button>
                  ) : (
                    <strong>Newton's method</strong>
                  )} when you need rotation invariance and can afford the <InlineMath>{String.raw`O(d^3)`}</InlineMath> cost
                </li>
                <li>
                  Consider {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('lbfgs')}
                      className="font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      L-BFGS
                    </button>
                  ) : (
                    <strong>L-BFGS</strong>
                  )} as a middle ground: approximates <InlineMath>{String.raw`\varH^{-1}`}</InlineMath> including
                  off-diagonal structure using only <InlineMath>{String.raw`O(Md)`}</InlineMath> memory and time
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* When Things Go Wrong */}
        <CollapsibleSection
          title="When Things Go Wrong"
          defaultExpanded={false}
          storageKey="diagonal-precond-when-wrong"
          id="when-things-go-wrong"
        >
          <div className="space-y-4 text-gray-800">
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

              <div className="space-y-3">
                <div>
                  <p className="font-semibold">❌ "Diagonal preconditioning always helps"</p>
                  <p className="text-sm ml-6">
                    ✓ Only helps when <InlineMath>\varH</InlineMath> is diagonal or nearly diagonal<br />
                    ✓ Can perform worse than {onNavigateToTab ? (
                      <button
                        onClick={() => onNavigateToTab('gd-fixed')}
                        className="font-semibold text-green-700 hover:text-green-900 underline cursor-pointer"
                      >
                        gradient descent
                      </button>
                    ) : (
                      <strong>gradient descent</strong>
                    )} on rotated problems<br />
                    ✓ Costs more per iteration (<InlineMath>{String.raw`O(d^2)`}</InlineMath> for Hessian vs <InlineMath>{String.raw`O(d)`}</InlineMath> for gradient)<br />
                  </p>
                </div>

                <div>
                  <p className="font-semibold">❌ "This is the same as per-coordinate learning rates in Adam/RMSProp"</p>
                  <p className="text-sm ml-6">
                    ✓ Similar idea but different source of information<br />
                    ✓ Diagonal preconditioning uses second derivatives (Hessian diagonal)<br />
                    ✓ Adam/RMSProp use exponential moving average of gradient squares<br />
                    ✓ Adam/RMSProp are <GlossaryTooltip termKey="first-order-method" /> (cheaper but less curvature info)<br />
                  </p>
                </div>

                <div>
                  <p className="font-semibold">❌ "Diagonal preconditioning converges in 1 iteration"</p>
                  <p className="text-sm ml-6">
                    ✓ Only true for strictly convex quadratic functions with diagonal Hessian<br />
                    ✓ General functions need multiple iterations<br />
                    ✓ Hessian changes as you move through parameter space<br />
                    ✓ Line search may choose <InlineMath>{String.raw`\varAlpha < 1`}</InlineMath> for stability
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-orange-800 mb-2">Troubleshooting</h3>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>
                  <strong>Slow convergence despite diagonal Hessian:</strong> Check damping parameter <InlineMath>\varLambdaDamp</InlineMath>. If too large,
                  preconditioner becomes identity matrix. If too small, numerical instability.
                </li>
                <li>
                  <strong>Method zig-zags:</strong> Hessian likely has large off-diagonal terms. Switch to {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('newton')}
                      className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      Newton
                    </button>
                  ) : (
                    <strong>Newton</strong>
                  )} or {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('lbfgs')}
                      className="font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      L-BFGS
                    </button>
                  ) : (
                    <strong>L-BFGS</strong>
                  )}.
                </li>
                <li>
                  <strong>Expensive per iteration:</strong> Computing full Hessian costs <InlineMath>{String.raw`O(d^2)`}</InlineMath>. If this is too expensive,
                  use {onNavigateToTab ? (
                    <button
                      onClick={() => onNavigateToTab('lbfgs')}
                      className="font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      L-BFGS
                    </button>
                  ) : (
                    <strong>L-BFGS</strong>
                  )} (approximates Hessian from gradients).
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-800 mb-2">When It Works Well</h3>
              <p className="text-sm mb-2">
                Diagonal preconditioning excels when:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Problem is naturally axis-aligned (features/variables don't interact)</li>
                <li>You can compute Hessian diagonal efficiently (some ML models support this)</li>
                <li>Variables have vastly different scales and gradient descent struggles</li>
                <li>Full Newton is too expensive but you need better than first-order methods</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* Mathematical Derivations */}
        <CollapsibleSection
          title="Mathematical Derivations"
          defaultExpanded={false}
          storageKey="diagonal-precond-math-derivations"
          id="mathematical-derivations"
        >
          <div className="space-y-4 text-gray-800">
            <p className="text-sm italic text-gray-600">
              <strong>Note:</strong> Diagonal preconditioning is a simplified form of {onNavigateToTab ? (
                <button
                  onClick={() => onNavigateToTab('newton')}
                  className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Newton's method
                </button>
              ) : (
                <strong>Newton's method</strong>
              )}. For full Newton convergence theory, see the Newton tab.
            </p>

            <div>
              <h3 className="text-lg font-bold text-indigo-800 mb-2">The Diagonal Approximation</h3>
              <p className="text-sm mb-2">
                Newton's method computes the search direction by solving:
              </p>
              <BlockMath>{String.raw`\varH \varP = -\varGrad`}</BlockMath>
              <p className="text-sm mt-2">
                where <InlineMath>\varH</InlineMath> is the Hessian and <InlineMath>\varGrad</InlineMath> is the gradient. The solution is <InlineMath>{String.raw`\varP = -\varH^{-1}\varGrad`}</InlineMath>.
              </p>
              <p className="text-sm mt-2">
                <strong>Diagonal preconditioning approximation:</strong> Replace <InlineMath>\varH</InlineMath> with its diagonal <InlineMath>\varD</InlineMath>:
              </p>
              <BlockMath>{String.raw`\varP \approx -\varD^{-1}\varGrad`}</BlockMath>
              <p className="text-sm mt-2">
                where <InlineMath>{String.raw`\varD = \text{diag}(H_{00}, H_{11}, ..., H_{d-1,d-1})`}</InlineMath>. Inverting a diagonal matrix is trivial: <InlineMath>{String.raw`\varD^{-1} = \text{diag}(1/H_{00}, 1/H_{11}, ..., 1/H_{d-1,d-1})`}</InlineMath>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence on Quadratic Functions</h3>
              <p className="text-sm mb-2">
                For strictly convex quadratic functions <InlineMath>{String.raw`f(\varW) = \frac{1}{2}\varW^T A \varW - b^T \varW`}</InlineMath> where <InlineMath>{String.raw`A`}</InlineMath> is positive definite:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>
                  <strong>If <InlineMath>{String.raw`A`}</InlineMath> is diagonal:</strong> Diagonal preconditioning with <InlineMath>{String.raw`\varAlpha = 1`}</InlineMath> is equivalent to Newton's method
                  and converges in one iteration (finds the exact optimum <InlineMath>{String.raw`\varW^* = A^{-1}b`}</InlineMath>).<Citation citationKey="newton-computational-complexity" />
                  This is because <InlineMath>{String.raw`\text{diag}(A) = A`}</InlineMath> when <InlineMath>{String.raw`A`}</InlineMath> is diagonal,
                  so the diagonal approximation is exact.
                </li>
                <li>
                  <strong>If <InlineMath>{String.raw`A`}</InlineMath> has off-diagonal terms:</strong> Convergence rate depends on how well <InlineMath>{String.raw`\text{diag}(A)`}</InlineMath> approximates <InlineMath>{String.raw`A`}</InlineMath>.
                  Can be arbitrarily slow if off-diagonal terms dominate.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-indigo-800 mb-2">Computational Complexity</h3>
              <p className="text-sm mb-2">
                Per-iteration cost breakdown:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li><strong>Gradient computation:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath> to <InlineMath>{String.raw`O(nd)`}</InlineMath> depending on problem</li>
                <li><strong>Hessian computation:</strong> <InlineMath>{String.raw`O(d^2)`}</InlineMath> to <InlineMath>{String.raw`O(nd^2)`}</InlineMath> in general (computing all <InlineMath>{String.raw`d^2`}</InlineMath> second partial derivatives)</li>
                <li><strong>Diagonal extraction:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath></li>
                <li><strong>Preconditioner construction:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath> (element-wise inverse)</li>
                <li><strong>Direction computation:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath> (element-wise multiply)</li>
                <li><strong>Line search:</strong> <InlineMath>{String.raw`O(1)`}</InlineMath> to several <InlineMath>\varF</InlineMath>-evals</li>
              </ul>
              <p className="text-sm mt-2">
                <strong>Total:</strong> <InlineMath>{String.raw`O(d^2)`}</InlineMath> dominated by Hessian computation. This is much cheaper
                than Newton's method which requires <InlineMath>{String.raw`O(d^3)`}</InlineMath> for solving the linear system via matrix factorization.<Citation citationKey="newton-computational-complexity" />
              </p>
            </div>

            <div className="bg-indigo-100 rounded p-4 mt-4">
              <p className="font-bold text-indigo-900 mb-2">Summary</p>
              <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
                <li>Diagonal preconditioning approximates Newton by keeping only diagonal Hessian elements</li>
                <li>Exact on diagonal quadratics (equals Newton's method), poor on problems with coordinate coupling</li>
                <li>Costs <InlineMath>{String.raw`O(d^2)`}</InlineMath> per iteration (cheaper than Newton's <InlineMath>{String.raw`O(d^3)`}</InlineMath>)<Citation citationKey="newton-computational-complexity" /></li>
                <li>Best when Hessian is diagonal or nearly diagonal</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <References usedIn="DiagonalPrecondTab" />
    </>
  );
};
