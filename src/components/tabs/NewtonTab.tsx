import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationPlayback } from '../IterationPlayback';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { getProblem } from '../../problems';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import type { ProblemFunctions, AlgorithmSummary } from '../../algorithms/types';
import type { NewtonIteration } from '../../algorithms/newton';
import type { ExperimentPreset } from '../../types/experiments';

type LogisticMinimum = [number, number] | [number, number, number] | null;

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
  summary: AlgorithmSummary | null;
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  biasSlice: number;
  logisticGlobalMin: LogisticMinimum;
  paramCanvasRef: React.RefObject<HTMLCanvasElement>;
  lineSearchCanvasRef: React.RefObject<HTMLCanvasElement>;
  hessianCanvasRef: React.RefObject<HTMLCanvasElement>;
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
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
  hessianCanvasRef,
  experimentLoading,
  onLoadExperiment,
}) => {
  const experiments = React.useMemo(
    () => getExperimentsForAlgorithm('newton'),
    []
  );

  return (
  <>
    {/* 1. Configuration Section */}
    <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
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
    <div className="flex gap-4 mb-6">
      {/* Left: Parameter Space Visualization */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-4">
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

        <canvas ref={paramCanvasRef} style={{width: '100%', height: '500px'}} className="border border-gray-300 rounded" />

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
        <div className="w-80 bg-white rounded-lg shadow-md p-4">
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
            summary={summary}
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
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">The Core Idea</h3>
          <p>
            Gradient descent uses first derivatives. Newton's method uses second derivatives
            (the <strong>Hessian matrix</strong>) to see the curvature and take smarter steps
            toward the minimum. We add Hessian damping (Levenberg-Marquardt regularization) for
            numerical stability.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">The Algorithm</h3>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
            <li>Compute Hessian <InlineMath>H(w)</InlineMath> (matrix of all second derivatives)</li>
            <li>Add damping: <InlineMath>{'H_d = H + \\lambda_{\\text{damp}} \\cdot I'}</InlineMath> where <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath> = Hessian damping parameter</li>
            <li>Solve <InlineMath>H_d p = -\nabla f</InlineMath> for search direction <InlineMath>p</InlineMath></li>
            <li>Line search for step size <InlineMath>\alpha</InlineMath></li>
            <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">Key Formula</h3>
          <p>Newton direction (with damping):</p>
          <BlockMath>{'p = -(H + \\lambda_{\\text{damp}} I)^{-1}\\nabla f'}</BlockMath>
          <p className="text-sm mt-2">
            <strong>Intuition:</strong> <InlineMath>{`H^{-1}`}</InlineMath> transforms the gradient into the
            natural coordinate system of the problem. Adding <InlineMath>{`\\lambda_{\\text{damp}} I`}</InlineMath> improves
            numerical stability when <InlineMath>H</InlineMath> has tiny eigenvalues.
          </p>
          <p className="text-sm mt-2">
            <strong>Why this matters:</strong> If you rescale coordinates (e.g., x→1000x), both
            <InlineMath>\nabla f</InlineMath> and <InlineMath>H</InlineMath> transform in complementary ways,
            so <InlineMath>{'H^{-1}\\nabla f'}</InlineMath> stays invariant. The Newton step automatically
            adapts to different scales in different directions, eliminating the zig-zagging that plagues
            gradient descent.
          </p>
          <p className="text-sm mt-1 text-gray-600">
            (When λ_damp = 0, this is pure Newton's method: <InlineMath>{'p = -H^{-1}\\nabla f'}</InlineMath>)
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">When to Use</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Small-medium problems (n &lt; 1000 parameters)</li>
            <li>Smooth, twice-differentiable objectives</li>
            <li>Near a local minimum (quadratic convergence)</li>
            <li>When you can afford O(n³) computation per iteration</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">Hessian Damping Parameter</h3>
          <p className="mb-2">The default 0.01 works for most problems. Adjust when:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Lower to ~0 to see pure Newton's method behavior (may be unstable)</li>
            <li>Increase to 0.1+ for very ill-conditioned problems</li>
          </ul>
        </div>

        <div className="bg-purple-100 rounded p-4 mb-4">
          <h3 className="text-lg font-bold text-purple-900 mb-2">
            🎯 Why Newton Doesn't Zig-Zag (The Step Size Issue)
          </h3>

          <p className="mb-2">
            <strong>Gradient Descent (Fixed <InlineMath>\alpha</InlineMath>):</strong> <InlineMath>{'w_{k+1} = w_k - \\alpha\\nabla f'}</InlineMath>
          </p>
          <ul className="list-disc ml-6 space-y-1 text-sm mb-3">
            <li>One step size <InlineMath>\alpha</InlineMath> for all directions, forever</li>
            <li>On x² + 100y²: same <InlineMath>\alpha</InlineMath> for both directions despite 100× curvature difference</li>
            <li>Result: severe zig-zagging</li>
          </ul>

          <p className="mb-2">
            <strong>GD with Line Search:</strong> Adaptive <InlineMath>\alpha</InlineMath> each iteration
          </p>
          <ul className="list-disc ml-6 space-y-1 text-sm mb-3">
            <li>Still one <InlineMath>\alpha</InlineMath> for all directions at each step, but adapts as we go</li>
            <li>Much better than fixed <InlineMath>\alpha</InlineMath> - prevents divergence, speeds convergence</li>
            <li>But still zig-zags on ill-conditioned problems (just less severe)</li>
          </ul>

          <p className="mb-2">
            <strong>Newton's Method:</strong> <InlineMath>{`w_{k+1} = w_k - H^{-1}\\nabla f`}</InlineMath>
          </p>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li><InlineMath>{`H^{-1}`}</InlineMath> provides direction-specific step sizes based on curvature</li>
            <li>On x² + 100y²: automatically uses 100× smaller step in y-direction</li>
            <li>Result: no zig-zagging, straight to minimum</li>
          </ul>

          <p className="text-sm mt-3 italic text-purple-800">
            Line search: "One size fits all (per iteration)."
            Newton: "Custom fit for each direction."
          </p>
        </div>

        <div className="bg-amber-100 rounded p-4 mb-4">
          <h3 className="text-lg font-bold text-amber-900 mb-2">
            🤔 What About Per-Coordinate Step Sizes?
          </h3>

          <p className="mb-3">
            Natural question: If different directions need different step sizes,
            what if we use just the <strong>diagonal</strong> of the Hessian - one step size per coordinate?
          </p>

          <p className="mb-2"><strong>This is called diagonal preconditioning:</strong></p>
          <BlockMath>{'w_{new} = w_{old} - D \\cdot \\nabla f, \\quad \\text{where } D = \\text{diag}(1/H_{00}, 1/H_{11}, ...)'}</BlockMath>

          <p className="mb-3 mt-3">
            <strong>Good news:</strong> We've implemented this! See the <strong>Diagonal Preconditioning</strong> tab
            to try it directly.
          </p>

          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="font-semibold text-green-900 mb-1">✓ Works perfectly on axis-aligned problems</p>
              <p className="text-sm text-gray-700">
                When H is diagonal (e.g., <InlineMath>f(x,y) = x^2 + 100y^2</InlineMath>), diagonal
                preconditioning gives <InlineMath>{`D = H^{-1}`}</InlineMath> exactly! Converges like full Newton's method.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="font-semibold text-red-900 mb-1">✗ Struggles when problem is rotated</p>
              <p className="text-sm text-gray-700 mb-2">
                Example: <InlineMath>f(x,y) = (x+y)^2 + 100(x-y)^2</InlineMath> has a diagonal valley.
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm text-gray-700">
                <li>The Hessian has large off-diagonal terms that capture coordinate coupling</li>
                <li>Diagonal approximation misses this rotation information</li>
                <li>Result: zig-zagging, slow convergence</li>
              </ul>
            </div>
          </div>

          <p className="mb-2 mt-3"><strong>Full Newton's matrix <InlineMath>{`H^{-1}`}</InlineMath> handles both:</strong></p>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>SCALE: Different step sizes per direction (like diagonal preconditioning)</li>
            <li>ROTATE: Align with problem geometry via off-diagonal terms</li>
            <li>This is why we need n² values (full matrix) not just n values (diagonal)</li>
          </ul>

          <p className="text-sm mt-3 italic text-amber-800">
            Try the Diagonal Preconditioning tab to see exactly when per-coordinate step sizes work!
          </p>
        </div>

        <div className="bg-blue-100 rounded p-3">
          <p className="font-bold text-sm">Assumptions:</p>
          <ul className="text-sm list-disc ml-6">
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
      defaultExpanded={true}
      storageKey="newton-line-search-details"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">Why Line Search for Newton's Method</h3>
          <p>Pure Newton (<InlineMath>\alpha = 1</InlineMath> always) assumes the quadratic
             approximation is perfect:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li><strong>Far from minimum:</strong> quadratic approximation breaks down</li>
            <li><strong>Non-convex regions:</strong> negative eigenvalues → wrong direction</li>
            <li><strong>Line search provides damping:</strong> reduces to gradient descent if needed</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">Current Method: Armijo Backtracking</h3>
          <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
          <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
          <p className="text-sm mt-2">
            Where <InlineMath>c_1 = </InlineMath>{newtonC1.toFixed(4)} controls how much decrease we require.
          </p>

          <div className="mt-3">
            <p className="font-semibold">Backtracking Algorithm:</p>
            <ol className="list-decimal ml-6 space-y-1 text-sm">
              <li>Start with <InlineMath>\alpha = 1</InlineMath> (full Newton step)</li>
              <li>Check if Armijo condition satisfied</li>
              <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
              <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
            </ol>
          </div>

          <p className="text-sm mt-3">
            <strong>Why it works:</strong> Near the minimum with positive definite Hessian,
            <InlineMath>\alpha = 1</InlineMath> is usually accepted. Far away or in
            problematic regions, backtracking provides safety.
          </p>
        </div>
      </div>
    </CollapsibleSection>

    {/* Try This */}
    <CollapsibleSection
      title="Try This"
      defaultExpanded={true}
      storageKey="newton-try-this"
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
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

          <div className="space-y-3">
            <div>
              <p className="font-semibold">❌ "Newton always converges faster than gradient descent"</p>
              <p className="text-sm ml-6">
                ✓ Only near a local minimum with positive definite Hessian<br/>
                ✓ Can diverge or fail in non-convex regions without line search
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "The Hessian tells you the direction to the minimum"</p>
              <p className="text-sm ml-6">
                ✓ <InlineMath>{'-H^{-1}\\nabla f'}</InlineMath> is the Newton direction, not just <InlineMath>H</InlineMath><br/>
                ✓ If H not positive definite, may not be a descent direction
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "Newton's method always finds the global minimum"</p>
              <p className="text-sm ml-6">
                ✓ Only for convex functions<br/>
                ✓ Non-convex: converges to local minimum or saddle point
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
          <ul className="space-y-2">
            <li>
              <strong>Strongly convex:</strong> Quadratic convergence guaranteed,
              H positive definite everywhere
            </li>
            <li>
              <strong>Convex:</strong> H positive semidefinite, converges to global minimum
            </li>
            <li>
              <strong>Non-convex:</strong> May converge to local minimum or saddle point,
              H can have negative eigenvalues
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Instability / Huge steps</strong> → increase Hessian damping (λ_damp) to 0.1 or higher
            </li>
            <li>
              <strong>Slow convergence</strong> → may be far from minimum (quadratic approximation poor), or λ_damp too high (try lowering toward 0.01)
            </li>
            <li>
              <strong>Numerical issues</strong> → Hessian severely ill-conditioned, increase λ_damp further or switch to L-BFGS
            </li>
            <li>
              <strong>High cost</strong> → n too large, switch to L-BFGS
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
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Taylor Expansion</h3>
          <p>Approximate f locally as quadratic:</p>
          <BlockMath>
            {'f(w+p) = f(w) + \\nabla f(w)^T p + \\frac{1}{2}p^T H(w) p + O(\\|p\\|^3)'}
          </BlockMath>
          <p className="text-sm mt-2">
            This is a second-order approximation using the Hessian matrix.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Deriving Newton Direction</h3>
          <p>Minimize the quadratic approximation over p:</p>
          <BlockMath>
            {'\\nabla_p \\left[ f(w) + \\nabla f^T p + \\frac{1}{2}p^T H p \\right] = \\nabla f + Hp = 0'}
          </BlockMath>
          <p>Therefore:</p>
          <BlockMath>Hp = -\nabla f</BlockMath>
          <p>Newton direction:</p>
          <BlockMath>{'p = -H^{-1}\\nabla f'}</BlockMath>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Why It Works</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              At minimum of quadratic function, this gives <strong>exact solution in one step</strong>
            </li>
            <li>
              Near a minimum, f behaves like quadratic → <strong>fast convergence</strong>
            </li>
            <li>
              Uses curvature information to <strong>scale gradient properly</strong> in each direction
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
          <p><strong>Quadratic convergence:</strong></p>
          <BlockMath>
            {`\\|e_{k+1}\\| \\leq C\\|e_k\\|^2`}
          </BlockMath>
          <p className="text-sm mt-2">
            where <InlineMath>{`e_k = w_k - w^*`}</InlineMath> is the error.
            Error <strong>squared</strong> at each iteration (very fast near solution).
          </p>
          <p className="text-sm mt-2">
            <strong>Requires:</strong> strong convexity, Lipschitz continuous Hessian,
            starting close enough to <InlineMath>{`w^*`}</InlineMath>
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Proof Sketch</h3>
          <ol className="list-decimal ml-6 space-y-1 text-sm">
            <li>Taylor expand f(<InlineMath>w_k</InlineMath>) and f(<InlineMath>w^*</InlineMath>) around <InlineMath>w_k</InlineMath></li>
            <li>Use Newton update rule to relate <InlineMath>{String.raw`w_{k+1}`}</InlineMath> and <InlineMath>w_k</InlineMath></li>
            <li>Bound error using Hessian Lipschitz constant</li>
            <li>Show error term is quadratic in current error</li>
          </ol>
          <p className="text-xs text-gray-600 mt-2">
            Full proof requires Lipschitz continuity of the Hessian and bounds on eigenvalues.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">With Hessian Damping</h3>
          <p>The damped Hessian adds a diagonal regularization term:</p>
          <BlockMath>
            {'H_{\\text{damped}} = H + \\lambda_{\\text{damp}} \\cdot I'}
          </BlockMath>
          <p className="mt-2">The Newton direction becomes:</p>
          <BlockMath>
            {'p = -(H + \\lambda_{\\text{damp}} \\cdot I)^{-1} \\nabla f'}
          </BlockMath>
          <p className="text-sm mt-2">
            <strong>This interpolates between two extremes:</strong>
          </p>
          <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
            <li>
              <InlineMath>{`\\lambda_{\\text{damp}} = 0`}</InlineMath>: Pure Newton's method
            </li>
            <li>
              <InlineMath>{`\\lambda_{\\text{damp}} \\to \\infty`}</InlineMath>: Approaches gradient descent <InlineMath>{`(p \\approx -\\nabla f / \\lambda_{\\text{damp}})`}</InlineMath>
            </li>
          </ul>
          <p className="text-sm mt-2 text-gray-600">
            Damping improves numerical stability by ensuring <InlineMath>{`H_{\\text{damped}}`}</InlineMath> is
            positive definite, even when H has small or negative eigenvalues.
          </p>
        </div>
      </div>
    </CollapsibleSection>

    {/* Advanced Topics */}
    <CollapsibleSection
      title="Advanced Topics"
      defaultExpanded={false}
      storageKey="newton-advanced"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Computing Hessian H:</strong> O(n²) operations and memory</li>
            <li><strong>Solving Hp = -∇f:</strong> O(n³) with direct methods (Cholesky, LU)</li>
            <li><strong>Total per iteration:</strong> O(n³) time, O(n²) space</li>
            <li><strong>For n=1000:</strong> ~1 billion operations per iteration</li>
          </ul>
          <p className="text-sm mt-2 italic">
            This is why Newton's method becomes impractical for large-scale problems,
            motivating quasi-Newton methods like L-BFGS.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Condition Number and Convergence</h3>
          <p>Condition number: <InlineMath>{'\\kappa = \\lambda_{max}/\\lambda_{min}'}</InlineMath></p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Large <InlineMath>\kappa</InlineMath> → elongated level sets (ill-conditioned)</li>
            <li>Newton handles ill-conditioning <strong>better than gradient descent</strong> because <InlineMath>{`H^{-1}`}</InlineMath> automatically provides direction-specific step sizes</li>
            <li>GD's single <InlineMath>\alpha</InlineMath> (even with line search) can't adapt to different curvatures in different directions → zig-zags</li>
            <li>But numerical stability suffers with very large <InlineMath>\kappa</InlineMath></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Modified Newton Methods</h3>

          <div className="mt-2">
            <p className="font-semibold">Levenberg-Marquardt:</p>
            <BlockMath>{'p = -(H + \\lambda I)^{-1}\\nabla f'}</BlockMath>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Adds regularization to make H positive definite</li>
              <li><InlineMath>\lambda=0</InlineMath>: pure Newton; <InlineMath>\lambda\to\infty</InlineMath>: gradient descent</li>
              <li>Interpolates between methods based on trust</li>
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
            <li>Solve Hp = -∇f <strong>approximately</strong> using iterative methods</li>
            <li>Use Conjugate Gradient (CG) for large problems</li>
            <li>Reduces O(n³) to O(n²) or better</li>
            <li>Still achieves superlinear convergence with loose tolerances</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Trust Region Methods</h3>
          <p>Alternative to line search:</p>
          <BlockMath>
            {'\\min_p \\; f(w) + \\nabla f^T p + \\frac{1}{2}p^T H p \\quad \\text{s.t.} \\; \\|p\\| \\leq \\Delta'}
          </BlockMath>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>Constrain step to trust region of radius Δ</li>
            <li>Adjust Δ based on agreement between model and actual function</li>
            <li>More robust in non-convex settings</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Quasi-Newton Preview</h3>
          <p>Key insight: Newton requires exact Hessian (expensive)</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Quasi-Newton approximates H or H⁻¹ from gradients</li>
            <li>Builds up curvature information over iterations</li>
            <li>Next algorithm: <strong>L-BFGS</strong> (Limited-memory BFGS)</li>
            <li>O(mn) cost instead of O(n³), where m ≈ 5-20</li>
          </ul>
        </div>
      </div>
    </CollapsibleSection>

  </>
  );
};
