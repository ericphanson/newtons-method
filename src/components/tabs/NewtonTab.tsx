import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { GlossaryTooltip } from '../GlossaryTooltip';
import { resolveProblem, requiresDataset } from '../../problems/registry';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { Pseudocode, Complexity } from '../Pseudocode';
import { ArmijoLineSearch } from '../ArmijoLineSearch';
import { Citation } from '../Citation';
import { References } from '../References';
import type { ProblemFunctions } from '../../algorithms/types';
import type { NewtonIteration } from '../../algorithms/newton';
import type { ExperimentPreset } from '../../types/experiments';
import { computeIterationSummary } from '../../utils/iterationSummaryUtils';

interface NewtonTabProps {
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;
  newtonC1: number;
  onNewtonC1Change: (val: number) => void;
  newtonLineSearch: 'armijo' | 'none';
  onNewtonLineSearchChange: (val: 'armijo' | 'none') => void;
  newtonHessianDamping: number;
  onNewtonHessianDampingChange: (val: number) => void;
  newtonTolerance: number;
  onNewtonToleranceChange: (val: number) => void;
  newtonFtol: number;
  onNewtonFtolChange: (val: number) => void;
  newtonXtol: number;
  onNewtonXtolChange: (val: number) => void;
  iterations: NewtonIteration[];
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
  hessianCanvasRef: React.RefObject<HTMLCanvasElement>;
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
  configurationExpanded?: boolean;
  onConfigurationExpandedChange?: (expanded: boolean) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const NewtonTab: React.FC<NewtonTabProps> = ({
  maxIter,
  onMaxIterChange,
  initialW0,
  onInitialW0Change,
  initialW1,
  onInitialW1Change,
  newtonC1,
  onNewtonC1Change,
  newtonLineSearch,
  onNewtonLineSearchChange,
  newtonHessianDamping,
  onNewtonHessianDampingChange,
  newtonTolerance,
  onNewtonToleranceChange,
  newtonFtol,
  onNewtonFtolChange,
  newtonXtol,
  onNewtonXtolChange,
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
  hessianCanvasRef,
  experimentLoading,
  onLoadExperiment,
  configurationExpanded,
  onConfigurationExpandedChange,
  onNavigateToTab,
}) => {
  const experiments = React.useMemo(
    () => getExperimentsForAlgorithm('newton'),
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
          algorithm="newton"
          maxIter={maxIter}
          onMaxIterChange={onMaxIterChange}
          initialW0={initialW0}
          onInitialW0Change={onInitialW0Change}
          initialW1={initialW1}
          onInitialW1Change={onInitialW1Change}
          newtonC1={newtonC1}
          onNewtonC1Change={onNewtonC1Change}
          newtonLineSearch={newtonLineSearch}
          onNewtonLineSearchChange={onNewtonLineSearchChange}
          newtonHessianDamping={newtonHessianDamping}
          onNewtonHessianDampingChange={onNewtonHessianDampingChange}
          newtonTolerance={newtonTolerance}
          onNewtonToleranceChange={onNewtonToleranceChange}
          newtonFtol={newtonFtol}
          onNewtonFtolChange={onNewtonFtolChange}
          newtonXtol={newtonXtol}
          onNewtonXtolChange={onNewtonXtolChange}
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
              algorithm="newton"
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
              eigenvalues={iterations[currentIter].eigenvalues}
              conditionNumber={iterations[currentIter].conditionNumber}
              lineSearchTrials={iterations[currentIter].lineSearchTrials?.length}
              lineSearchCanvasRef={newtonLineSearch === 'armijo' ? lineSearchCanvasRef : undefined}
              hessianCanvasRef={hessianCanvasRef}
              hessian={iterations[currentIter].hessian}
              tolerance={newtonTolerance}
              ftol={newtonFtol}
              xtol={newtonXtol}
              summary={computeIterationSummary({
                currentIndex: currentIter,
                totalIterations: iterations.length,
                gradNorm: iterations[currentIter].gradNorm,
                loss: iterations[currentIter].newLoss,
                location: iterations[currentIter].wNew,
                gtol: newtonTolerance,
                ftol: newtonFtol,
                xtol: newtonXtol,
                eigenvalues: iterations[currentIter].eigenvalues,
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

      {/* Newton's Method - Quick Start */}
      <CollapsibleSection
        title="Quick Start"
        defaultExpanded={true}
        storageKey="newton-quick-start"
        id="quick-start"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">The Core Idea</h3>
            <p>
              Gradient descent uses first derivatives. Newton's method uses second derivatives
              (the <strong><GlossaryTooltip termKey="hessian" /> matrix</strong>) to see the curvature and take smarter steps
              toward the minimum. We add Hessian damping (Levenberg-Marquardt regularization) for
              numerical stability.
            </p>
          </div>

          <Pseudocode
            color="blue"
            inputs={[
              {
                id: "w_0",
                display: <InlineMath>{String.raw`\varWZero \in \mathbb{R}^d`}</InlineMath>,
                description: "initial parameter vector"
              },
              {
                id: "f",
                display: <InlineMath>{String.raw`\varF`}</InlineMath>,
                description: "objective function to minimize"
              },
              {
                id: "lambda_damp",
                display: <InlineMath>{String.raw`\varLambdaDamp`}</InlineMath>,
                description: "Hessian damping parameter"
              }
            ]}
            outputs={[
              {
                id: "w_star",
                display: <InlineMath>{String.raw`\varWStar`}</InlineMath>,
                description: "optimized parameter vector"
              }
            ]}
            steps={[
              <>Initialize <InlineMath>{String.raw`\varW`}</InlineMath> ← <InlineMath>{String.raw`\varWZero`}</InlineMath></>,
              <><strong>repeat</strong> until convergence:</>,
              <>
                <span className="ml-4">Compute gradient <InlineMath>{String.raw`\varGrad(\varW)`}</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
              </>,
              <>
                <span className="ml-4">Compute Hessian <InlineMath>{String.raw`\varH(\varW)`}</InlineMath> <Complexity explanation="Problem-dependent">1 H eval</Complexity></span>
              </>,
              <>
                <span className="ml-4">Add damping: <InlineMath>{String.raw`H_d`}</InlineMath> ← <InlineMath>{String.raw`\varH + \varLambdaDamp \cdot \varI`}</InlineMath> <Complexity explanation="Add diagonal">O(d)</Complexity></span>
              </>,
              <>
                <span className="ml-4">Solve linear system <InlineMath>{String.raw`H_d \varP = -\varGrad`}</InlineMath> for <InlineMath>{String.raw`\varP`}</InlineMath> <Complexity explanation="Cholesky/LU, never invert">O(d³)</Complexity></span>
              </>,
              <>
                <span className="ml-4">Line search for step size <InlineMath>{String.raw`\varAlpha`}</InlineMath> <Complexity explanation="Backtracking">≈1-3 f evals</Complexity></span>
              </>,
              <>
                <span className="ml-4"><InlineMath>{String.raw`\varW`}</InlineMath> ← <InlineMath>{String.raw`\varW + \varAlpha \varP`}</InlineMath> <Complexity>O(d)</Complexity></span>
              </>,
              <><strong>return</strong> <InlineMath>{String.raw`\varW`}</InlineMath></>
            ]}
          />

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Key Formula</h3>
            <p>
              Let <InlineMath>\varH</InlineMath> be the <GlossaryTooltip termKey="hessian" /> matrix (d×d matrix of second derivatives),
              <InlineMath>\varGrad</InlineMath> be the gradient vector (∇f ∈ ℝ<sup>d</sup>),
              <InlineMath>\varP</InlineMath> be the search direction vector (∈ ℝ<sup>d</sup>),
              <InlineMath>\varLambdaDamp</InlineMath> be the damping parameter (scalar ≥ 0), and
              <InlineMath>\varI</InlineMath> be the d×d identity matrix.
            </p>
            <p className="mt-2">Newton direction via linear solve (with damping):</p>
            <BlockMath>{'(\\varH + \\varLambdaDamp \\varI) \\varP = -\\varGrad'}</BlockMath>
            <p className="text-sm mt-2">
              <strong>Implementation note:</strong> Never invert <InlineMath>\varH</InlineMath>! Instead, solve the linear system using
              Cholesky decomposition (if <InlineMath>\varH</InlineMath> is positive definite) or LU decomposition.
              This is much faster and more numerically stable.
            </p>
            <p className="text-sm mt-2">
              <strong>Intuition:</strong> The solve implicitly applies <InlineMath>\varHInv</InlineMath> (the inverse Hessian) to transform the gradient into the
              natural coordinate system of the problem. Adding <InlineMath>\varLambdaDamp \varI</InlineMath> improves
              numerical stability when <InlineMath>\varH</InlineMath> has tiny <GlossaryTooltip termKey="eigenvalue" />s.
            </p>
            <p className="text-sm mt-2">
              <strong>Why this matters:</strong> If you rescale coordinates (e.g., <InlineMath>w_1 \to 1000 w_1</InlineMath>), both
              <InlineMath>\varGrad</InlineMath> and <InlineMath>\varH</InlineMath> transform in complementary ways,
              so <InlineMath>\varHInv\varGrad</InlineMath> stays invariant. The Newton step automatically
              adapts to different scales in different directions, eliminating the zig-zagging that plagues
              gradient descent. (Note: This coordinate invariance applies to pure Newton's method with <InlineMath>\varAlpha = 1</InlineMath>;
              line search may introduce some scale dependence in practice.)
            </p>
            <p className="text-sm mt-1 text-gray-600">
              (When <InlineMath>\varLambdaDamp = 0</InlineMath>, this is pure Newton's method: <InlineMath>\varP = -\varHInv\varGrad</InlineMath>)
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">When to Use</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>When you can afford <InlineMath>O(d^3)</InlineMath> computation per iteration<Citation citationKey="newton-computational-complexity" /></li>
              <li><GlossaryTooltip termKey="smooth" />, twice-differentiable objectives with <GlossaryTooltip termKey="lipschitz-continuous" /> <GlossaryTooltip termKey="hessian" /></li>
              <li>Near a strict local minimum where <GlossaryTooltip termKey="quadratic-convergence" /> applies<Citation citationKey="newton-quadratic-convergence" /></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Hessian Damping Parameter</h3>
            <p>
              The damping parameter <InlineMath>\varLambdaDamp</InlineMath> adds numerical stability
              by ensuring <InlineMath>H_d = \varH + \varLambdaDamp \cdot \varI</InlineMath> is <GlossaryTooltip termKey="positive-definite" />.
              Larger <InlineMath>\varLambdaDamp</InlineMath> provides more stability but moves the method closer to
              gradient descent. Experiment with this parameter to find the right balance for your problem.
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
            <p className="font-semibold text-blue-900 mb-3">💡 Why Newton Doesn't Zig-Zag (The Step Size Issue)</p>

            <p className="text-sm text-blue-800 mb-2">
              Let <InlineMath>k</InlineMath> denote iteration number, <InlineMath>\varW_k</InlineMath> be parameters at iteration <InlineMath>k</InlineMath>,
              and <InlineMath>\varAlpha</InlineMath> be the step size.
            </p>

            <p className="text-sm text-blue-800 mb-2">
              <strong>Gradient Descent (Fixed <InlineMath>\varAlpha</InlineMath>):</strong> <InlineMath>{String.raw`\varW_{k+1} = \varW_k - \varAlpha\varGrad`}</InlineMath>
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mb-3 text-blue-800">
              <li>One step size <InlineMath>\varAlpha</InlineMath> for all directions, forever</li>
              <li>On <InlineMath>f(w_0, w_1) = w_0^2 + 100w_1^2</InlineMath>: same <InlineMath>\varAlpha</InlineMath> for both directions despite 100× curvature difference</li>
              <li>Result: severe zig-zagging</li>
            </ul>

            <p className="text-sm text-blue-800 mb-2">
              <strong>GD with Line Search:</strong> Adaptive <InlineMath>\varAlpha</InlineMath> each iteration
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mb-3 text-blue-800">
              <li>Still one <InlineMath>\varAlpha</InlineMath> for all directions at each step, but adapts as we go</li>
              <li>Much better than fixed <InlineMath>\varAlpha</InlineMath> - prevents divergence, speeds convergence</li>
              <li>But still zig-zags on <GlossaryTooltip termKey="ill-conditioned" /> problems (just less severe)</li>
            </ul>

            <p className="text-sm text-blue-800 mb-2">
              <strong>{onNavigateToTab ? (
                <button
                  onClick={() => onNavigateToTab('diagonal-precond')}
                  className="font-semibold text-blue-800 hover:text-blue-900 underline cursor-pointer"
                >
                  Diagonal Preconditioning
                </button>
              ) : (
                <span>Diagonal Preconditioning</span>
              )}:</strong> Different <InlineMath>\varAlpha</InlineMath> per coordinate
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mb-3 text-blue-800">
              <li>Uses diagonal of <InlineMath>\varH</InlineMath> to scale each coordinate independently</li>
              <li>On <InlineMath>f(w_0, w_1) = w_0^2 + 100w_1^2</InlineMath>: uses 100× smaller step in <InlineMath>w_1</InlineMath> direction</li>
              <li>But misses rotation information from off-diagonal terms - can't fix all zig-zagging</li>
            </ul>

            <p className="text-sm text-blue-800 mb-2">
              <strong>Newton's Method:</strong> <InlineMath>{String.raw`\varW_{k+1} = \varW_k - \varHInv\varGrad`}</InlineMath>
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm text-blue-800">
              <li><InlineMath>\varHInv</InlineMath> provides direction-specific step sizes based on full curvature matrix</li>
              <li>Handles both scale <em>and</em> rotation - accounts for all correlations between parameters</li>
              <li>Result: no zig-zagging, straight to minimum</li>
            </ul>

            <p className="text-sm mt-3 italic text-blue-800">
              Fixed step: "One size for all directions, forever."
              Line search: "One size for all directions (per iteration)."
              Diagonal: "Custom size per coordinate (but ignores rotation)."
              Newton: "Custom fit for each direction (full curvature)."
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
            <p className="font-bold text-sm text-blue-900">Assumptions:</p>
            <ul className="text-sm list-disc ml-6 text-blue-800">
              <li>f is twice continuously differentiable</li>
              <li>Hessian damping ensures H_d is positive definite for numerical stability</li>
              <li>Line search used when far from minimum or in non-convex regions</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Line Search Details */}
      <CollapsibleSection
        title="Line Search Details"
        defaultExpanded={false}
        storageKey="newton-line-search-details"
        id="line-search-details"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Why Line Search for Newton's Method</h3>
            <p>
              Pure Newton (step size <InlineMath>\varAlpha = 1</InlineMath> always) assumes the quadratic
              approximation is perfect:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Far from minimum:</strong> quadratic approximation breaks down</li>
              <li><strong>Non-<GlossaryTooltip termKey="convex" /> regions:</strong> negative <GlossaryTooltip termKey="eigenvalue" />s → wrong direction</li>
              <li><strong>Line search provides damping:</strong> reduces to gradient descent if needed</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Current Method: Armijo Backtracking</h3>
            <ArmijoLineSearch
              color="blue"
              initialAlpha="1 (full Newton step)"
              typicalFEvals="1-3"
              c1Value={newtonC1}
              verdict={{
                title: "Essential for Newton's method!",
                description: "Without line search, Newton can diverge spectacularly. With it, you get both safety and speed. The cost is minimal since α = 1 is usually accepted near the solution."
              }}
              benefits={[
                'Safety: Prevents divergence from bad Hessian or far from minimum',
                'Fewer iterations: Good steps mean faster convergence',
                "Robustness: Works even when theory doesn't guarantee α = 1 is safe"
              ]}
              additionalNotes={
                <p className="text-sm">
                  <strong>Why it works:</strong> Near the minimum with <GlossaryTooltip termKey="positive-definite" /> Hessian,
                  <InlineMath>\varAlpha = 1</InlineMath> is usually accepted. Far away or in
                  problematic regions, backtracking provides safety.
                </p>
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Try This */}
      <CollapsibleSection
        title="Try This"
        defaultExpanded={false}
        storageKey="newton-try-this"
        id="try-this"
      >
        <div className="space-y-3">
          <p className="text-gray-800 mb-4">
            Run these experiments to see when Newton's method excels and when it struggles:
          </p>

          <ExperimentCardList
            experiments={experiments}
            experimentLoading={experimentLoading}
            onLoadExperiment={onLoadExperiment}
          />
        </div>
      </CollapsibleSection>

      {/* When Things Go Wrong */}
      <CollapsibleSection
        title="When Things Go Wrong"
        defaultExpanded={false}
        storageKey="newton-when-wrong"
        id="when-things-go-wrong"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">❌ "Newton always converges faster than gradient descent"</p>
                <p className="text-sm ml-6">
                  ✓ Only near a local minimum with <GlossaryTooltip termKey="positive-definite" /> <GlossaryTooltip termKey="hessian" /><br />
                  ✓ Can diverge or fail in non-convex regions without line search
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "The Hessian tells you the direction to the minimum"</p>
                <p className="text-sm ml-6">
                  ✓ <InlineMath>-\varHInv\varGrad</InlineMath> is the Newton direction, not just <InlineMath>\varH</InlineMath><br />
                  ✓ If <InlineMath>\varH</InlineMath> not <GlossaryTooltip termKey="positive-definite" />, may not be a descent direction
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Newton's method always finds the global minimum"</p>
                <p className="text-sm ml-6">
                  ✓ Only for <GlossaryTooltip termKey="convex" /> functions<br />
                  ✓ Non-convex: converges to local minimum or saddle point
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
            <ul className="space-y-2">
              <li>
                <strong><GlossaryTooltip termKey="strongly-convex" /> with <GlossaryTooltip termKey="lipschitz-continuous" /> <GlossaryTooltip termKey="hessian" />:</strong>{' '}
                <GlossaryTooltip termKey="quadratic-convergence" /> when starting close to <InlineMath>x^*</InlineMath>,
                <InlineMath>\varH</InlineMath> <GlossaryTooltip termKey="positive-definite" /> everywhere<Citation citationKey="newton-quadratic-convergence" />
              </li>
              <li>
                <strong><GlossaryTooltip termKey="convex" /> with Lipschitz continuous Hessian:</strong> Converges to global minimum
                (may require cubic regularization if <InlineMath>\varH</InlineMath> not positive definite during iteration)<Citation citationKey="newton-convex-convergence" />
              </li>
              <li>
                <strong>Non-convex:</strong> May converge to local minimum or saddle point,
                <InlineMath>\varH</InlineMath> can have negative <GlossaryTooltip termKey="eigenvalue" />s.
                Line search and damping provide robustness.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Instability / Huge steps</strong> → increase Hessian damping (<InlineMath>\varLambdaDamp</InlineMath>) to 0.1 or higher
              </li>
              <li>
                <strong>Slow convergence</strong> → may be far from minimum (quadratic approximation poor), or <InlineMath>\varLambdaDamp</InlineMath> too high (try lowering toward 0.01)
              </li>
              <li>
                <strong>Numerical issues</strong> → Hessian severely <GlossaryTooltip termKey="ill-conditioned" />, increase <InlineMath>\varLambdaDamp</InlineMath> further or switch to {onNavigateToTab ? (
                  <button
                    onClick={() => onNavigateToTab('lbfgs')}
                    className="font-semibold text-yellow-700 hover:text-yellow-900 underline cursor-pointer"
                  >
                    L-BFGS
                  </button>
                ) : (
                  <strong>L-BFGS</strong>
                )}
              </li>
              <li>
                <strong>High cost</strong> → d too large, switch to {onNavigateToTab ? (
                  <button
                    onClick={() => onNavigateToTab('lbfgs')}
                    className="font-semibold text-yellow-700 hover:text-yellow-900 underline cursor-pointer"
                  >
                    L-BFGS
                  </button>
                ) : (
                  <strong>L-BFGS</strong>
                )}
              </li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Mathematical Derivations */}
      <CollapsibleSection
        title="Mathematical Derivations"
        defaultExpanded={false}
        storageKey="newton-math-derivations"
        id="mathematical-derivations"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Taylor Expansion</h3>
            <p>
              Let <InlineMath>\varF</InlineMath> be the objective function, <InlineMath>\varW</InlineMath> be the current parameters,
              <InlineMath>\varP</InlineMath> be the step direction, <InlineMath>\varGrad</InlineMath> be the gradient at <InlineMath>\varW</InlineMath>,
              and <InlineMath>\varH</InlineMath> be the Hessian at <InlineMath>\varW</InlineMath>.
            </p>
            <p className="mt-2">Approximate <InlineMath>\varF</InlineMath> locally as quadratic:</p>
            <BlockMath>
              {String.raw`\varF(\varW+\varP) = \varF(\varW) + \varGrad^T \varP + \frac{1}{2}\varP^T \varH \varP + O(\|\varP\|^3)`}
            </BlockMath>
            <p className="text-sm mt-2">
              This is a second-order approximation using the Hessian matrix. The <InlineMath>O(\|\varP\|^3)</InlineMath> term
              captures higher-order terms that become negligible near <InlineMath>\varW</InlineMath>.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Deriving Newton Direction</h3>
            <p>Minimize the quadratic approximation over <InlineMath>\varP</InlineMath>:</p>
            <BlockMath>
              {String.raw`\nabla_{\varP} \left[ \varF(\varW) + \varGrad^T \varP + \frac{1}{2}\varP^T \varH \varP \right] = \varGrad + \varH\varP = 0`}
            </BlockMath>
            <p>Therefore:</p>
            <BlockMath>{String.raw`\varH\varP = -\varGrad`}</BlockMath>
            <p>Newton direction (solving for <InlineMath>\varP</InlineMath>):</p>
            <BlockMath>{String.raw`\varP = -\varHInv\varGrad`}</BlockMath>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                At minimum of quadratic function, this gives <strong>exact solution in one step</strong>
              </li>
              <li>
                Near a minimum, <InlineMath>\varF</InlineMath> behaves like quadratic → <strong>fast convergence</strong>
              </li>
              <li>
                Uses curvature information to <strong>scale gradient properly</strong> in each direction
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
            <p>
              <strong><GlossaryTooltip termKey="quadratic-convergence" />:</strong> Let <InlineMath>{String.raw`e_k = \|\varWK - \varWStar\|`}</InlineMath>
              be the error at iteration <InlineMath>k</InlineMath> (distance from optimal parameters <InlineMath>\varWStar</InlineMath>), and
              <InlineMath>C</InlineMath> be a constant depending on the Lipschitz constant of the Hessian.
            </p>
            <BlockMath>
              {String.raw`\|e_{k+1}\| \leq C\|e_k\|^2`}
            </BlockMath>
            <p className="text-sm mt-2">
              Error <strong>squared</strong> at each iteration (very fast near solution). The number of correct digits
              roughly doubles at each step.<Citation citationKey="newton-quadratic-convergence" />
            </p>
            <p className="text-sm mt-2">
              <strong>Requires:</strong>{' '}
              Twice differentiable function, <GlossaryTooltip termKey="lipschitz-continuous" /> <GlossaryTooltip termKey="hessian" /> near <InlineMath>x^*</InlineMath>,
              second-order sufficient conditions at <InlineMath>\varWStar</InlineMath> (i.e., <InlineMath>\nabla f(x^*) = 0</InlineMath> and <InlineMath>\varH(x^*)</InlineMath> positive definite),
              starting close enough to <InlineMath>\varWStar</InlineMath>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Proof Sketch</h3>
            <ol className="list-decimal ml-6 space-y-1 text-sm">
              <li>Taylor expand <InlineMath>\varF(\varWK)</InlineMath> and <InlineMath>\varF(\varWStar)</InlineMath> around <InlineMath>\varWK</InlineMath></li>
              <li>Use Newton update rule to relate <InlineMath>{String.raw`\varW_{k+1}`}</InlineMath> and <InlineMath>\varWK</InlineMath></li>
              <li>Bound error using Hessian Lipschitz constant</li>
              <li>Show error term is quadratic in current error</li>
            </ol>
            <p className="text-xs text-gray-600 mt-2">
              Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues.
              <Citation citationKey="newton-quadratic-convergence" />
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">With Hessian Damping</h3>
            <p>The damped Hessian adds a diagonal regularization term:</p>
            <BlockMath>
              {String.raw`H_{\text{damped}} = \varH + \varLambdaDamp \cdot \varI`}
            </BlockMath>
            <p className="mt-2">The Newton direction becomes:</p>
            <BlockMath>
              {String.raw`\varP = -(\varH + \varLambdaDamp \cdot \varI)^{-1} \varGrad`}
            </BlockMath>
            <p className="text-sm mt-2">
              <strong>This interpolates between two extremes:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li>
                <InlineMath>\varLambdaDamp = 0</InlineMath>: Pure Newton's method
              </li>
              <li>
                <InlineMath>\varLambdaDamp \to \infty</InlineMath>: Approaches gradient descent <InlineMath>{String.raw`(\varP \approx -\varGrad / \varLambdaDamp)`}</InlineMath>
              </li>
            </ul>
            <p className="text-sm mt-2 text-gray-600">
              Damping improves numerical stability by ensuring <InlineMath>{String.raw`H_{\text{damped}}`}</InlineMath> is
              <GlossaryTooltip termKey="positive-definite" />, even when <InlineMath>\varH</InlineMath> has small or negative <GlossaryTooltip termKey="eigenvalue" />s.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Advanced Topics */}
      <CollapsibleSection
        title="Advanced Topics"
        defaultExpanded={false}
        storageKey="newton-advanced"
        id="advanced-topics"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
            <p className="mb-2">
              Let <InlineMath>d</InlineMath> be the number of parameters (dimension of <InlineMath>\varW</InlineMath>).
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Computing Hessian <InlineMath>\varH</InlineMath>:</strong> O(d²) operations and memory</li>
              <li><strong>Solving <InlineMath>\varH\varP = -\varGrad</InlineMath>:</strong> O(d³) with direct methods (Cholesky, LU)</li>
              <li><strong>Total per iteration:</strong> O(d³) time, O(d²) space</li>
              <li><strong>For d=1000:</strong> ~1 billion operations per iteration</li>
            </ul>
            <p className="text-sm mt-2 italic">
              This is why Newton's method becomes impractical for large-scale problems,
              motivating quasi-Newton methods like {onNavigateToTab ? (
                <button
                  onClick={() => onNavigateToTab('lbfgs')}
                  className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  L-BFGS
                </button>
              ) : (
                <strong>L-BFGS</strong>
              )}.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Condition Number and Convergence</h3>
            <p>
              The <GlossaryTooltip termKey="hessian" /> <InlineMath>\varH</InlineMath> has d{' '}
              <GlossaryTooltip termKey="eigenvalue" />s which reveal the local curvature.
              Let <InlineMath>{String.raw`\lambda_{\text{max}}`}</InlineMath> and <InlineMath>{String.raw`\lambda_{\text{min}}`}</InlineMath> be
              the largest and smallest eigenvalues.
            </p>
            <p className="mt-2">
              <GlossaryTooltip termKey="condition-number" />: <InlineMath>{String.raw`Q = \lambda_{\text{max}}/\lambda_{\text{min}}`}</InlineMath>
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Large <InlineMath>Q</InlineMath> → elongated level sets (<GlossaryTooltip termKey="ill-conditioned" />)</li>
              <li>Newton handles ill-conditioning <strong>better than gradient descent</strong> because <InlineMath>\varHInv</InlineMath> automatically provides direction-specific step sizes</li>
              <li>GD's single <InlineMath>\varAlpha</InlineMath> (even with line search) can't adapt to different curvatures in different directions → zig-zags</li>
              <li>But numerical stability suffers with very large <InlineMath>Q</InlineMath></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Modified Newton Methods</h3>

            <div className="mt-2">
              <p className="font-semibold">Levenberg-Marquardt:</p>
              <p className="text-sm mb-1">
                Let <InlineMath>\lambda</InlineMath> be an <strong>adaptive</strong> damping parameter that changes each iteration.
              </p>
              <BlockMath>{String.raw`\varP = -(\varH + \lambda \varI)^{-1}\varGrad`}</BlockMath>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Adds regularization to make <InlineMath>\varH</InlineMath> <GlossaryTooltip termKey="positive-definite" /></li>
                <li><InlineMath>\lambda=0</InlineMath>: pure Newton; <InlineMath>\lambda\to\infty</InlineMath>: gradient descent</li>
                <li><strong>Key difference from our fixed <InlineMath>\varLambdaDamp</InlineMath>:</strong> L-M adjusts <InlineMath>\lambda</InlineMath> dynamically based on step quality</li>
                <li><strong>How to choose <InlineMath>\lambda</InlineMath>:</strong> After computing step, evaluate <InlineMath>f(\varW + \varP)</InlineMath>:
                  <ul className="list-disc ml-6 mt-1">
                    <li>If function decreases well: accept step, reduce <InlineMath>\lambda</InlineMath> (e.g., <InlineMath>\lambda := \lambda/10</InlineMath>) to move toward Newton</li>
                    <li>If function increases or decreases poorly: reject step, increase <InlineMath>\lambda</InlineMath> (e.g., <InlineMath>\lambda := 10\lambda</InlineMath>) to move toward gradient descent, retry</li>
                  </ul>
                </li>
                <li>Interpolates between methods based on local function behavior (trust region style)</li>
              </ul>
            </div>

            <div className="mt-3">
              <p className="font-semibold">Eigenvalue Modification:</p>
              <p className="text-sm">Replace negative eigenvalues with small positive values</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Inexact Newton</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Solve <InlineMath>\varH\varP = -\varGrad</InlineMath> <strong>approximately</strong> using iterative methods (e.g., Conjugate Gradient)</li>
              <li>Reduces computational cost from O(d³) to O(d²) or better by avoiding direct Hessian factorization</li>
              <li>Still achieves <GlossaryTooltip termKey="superlinear-convergence" /> with appropriate forcing sequences (loose tolerances)</li>
            </ul>
            <Citation citationKey="inexact-newton-superlinear-convergence" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Trust Region Methods</h3>
            <p>
              Alternative to line search. Let <InlineMath>\Delta</InlineMath> be the trust region radius (scalar).
            </p>
            <BlockMath>
              {String.raw`\min_{\varP} \; f(\varW) + \varGrad^T \varP + \frac{1}{2}\varP^T \varH \varP \quad \text{s.t.} \; \|\varP\| \leq \Delta`}
            </BlockMath>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Constrain step to trust region of radius <InlineMath>\Delta</InlineMath></li>
              <li>Adjust <InlineMath>\Delta</InlineMath> based on agreement between model and actual function</li>
              <li>More robust in non-<GlossaryTooltip termKey="convex" /> settings</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Quasi-Newton Preview</h3>
            <p>Key insight: Newton requires exact Hessian (expensive)</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Quasi-Newton approximates <InlineMath>\varH</InlineMath> or <InlineMath>\varHInv</InlineMath> from gradients</li>
              <li>Builds up curvature information over iterations</li>
              <li>Next algorithm: {onNavigateToTab ? (
                <button
                  onClick={() => onNavigateToTab('lbfgs')}
                  className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  L-BFGS
                </button>
              ) : (
                <strong>L-BFGS</strong>
              )} (Limited-memory BFGS)</li>
              <li>O(<InlineMath>\varM</InlineMath>d) cost instead of O(d³), where <InlineMath>\varM</InlineMath> ≈ 5-20 is memory size</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <References usedIn="NewtonTab" />

    </>
  );
};
