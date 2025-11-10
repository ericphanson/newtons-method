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
import type { ProblemFunctions, AlgorithmSummary } from '../../algorithms/types';
import type { GDLineSearchIteration } from '../../algorithms/gradient-descent-linesearch';
import type { ExperimentPreset } from '../../types/experiments';

type LogisticMinimum = [number, number] | [number, number, number] | null;

interface GdLineSearchTabProps {
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;
  gdLSC1: number;
  onGdLSC1Change: (val: number) => void;
  gdLSTolerance: number;
  onGdLSToleranceChange: (val: number) => void;
  iterations: GDLineSearchIteration[];
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

export const GdLineSearchTab: React.FC<GdLineSearchTabProps> = ({
  maxIter,
  onMaxIterChange,
  initialW0,
  onInitialW0Change,
  initialW1,
  onInitialW1Change,
  gdLSC1,
  onGdLSC1Change,
  gdLSTolerance,
  onGdLSToleranceChange,
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
    () => getExperimentsForAlgorithm('gd-linesearch'),
    []
  );

  return (
  <>
    {/* 1. Configuration Section */}
    <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
      <AlgorithmConfiguration
        algorithm="gd-linesearch"
        maxIter={maxIter}
        onMaxIterChange={onMaxIterChange}
        initialW0={initialW0}
        onInitialW0Change={onInitialW0Change}
        initialW1={initialW1}
        onInitialW1Change={onInitialW1Change}
        gdLSC1={gdLSC1}
        onGdLSC1Change={onGdLSC1Change}
        gdLSTolerance={gdLSTolerance}
        onGdLSToleranceChange={onGdLSToleranceChange}
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
            algorithm="gd-linesearch"
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
            tolerance={gdLSTolerance}
            ftol={1e-9}
            xtol={1e-9}
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
      storageKey="gd-ls-quick-start"
      id="quick-start"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">The Core Idea</h3>
          <p>
            Instead of using a fixed step size <InlineMath>\alpha</InlineMath>, automatically
            search for a good step size at each iteration. This makes the algorithm{' '}
            <strong>robust and efficient</strong> across different problems.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">The Algorithm</h3>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
            <li>Set search direction <InlineMath>p = -\nabla f(w)</InlineMath></li>
            <li>
              <strong>Line search:</strong> find step size <InlineMath>\alpha</InlineMath> that
              decreases loss sufficiently
            </li>
            <li>Update <InlineMath>w \leftarrow w + \alpha p</InlineMath></li>
            <li>Repeat until convergence</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">Key Advantage</h3>
          <p>
            <strong>No manual tuning</strong> of step size needed. The line search
            automatically adapts to:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Problem scaling and curvature</li>
            <li>Changes in landscape across iterations</li>
            <li>Different regions of parameter space</li>
          </ul>
          <p className="text-sm mt-3 text-gray-700">
            <strong>Note:</strong> Line search adapts <InlineMath>\alpha</InlineMath> iteration-by-iteration,
            which prevents divergence and speeds up convergence. However, it's still <strong>one step size
            for all directions</strong> at each iteration. On ill-conditioned problems, this causes
            zig-zagging (just less severe than fixed <InlineMath>\alpha</InlineMath>).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">When to Use</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>When you want robust optimization without tuning</li>
            <li>Problems with varying curvature</li>
            <li>When step size selection is difficult</li>
            <li>Production systems where reliability matters</li>
          </ul>
        </div>

        <div className="bg-teal-100 rounded p-3">
          <p className="font-bold text-sm">Tradeoff:</p>
          <p className="text-sm">
            Each iteration costs more (multiple gradient evaluations for line search),
            but fewer total iterations needed. Usually worth it for reliable convergence.
          </p>
        </div>
      </div>
    </CollapsibleSection>

    {/* Line Search Details */}
    <CollapsibleSection
      title="Line Search Details"
      defaultExpanded={false}
      storageKey="gd-ls-line-search-details"
      id="line-search-details"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">Why Line Search for Gradient Descent</h3>
          <p>
            Fixed step size <InlineMath>\alpha</InlineMath> fails when landscape has
            varying curvature:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>
              <strong>Steep regions:</strong> need small <InlineMath>\alpha</InlineMath> to
              avoid overshooting
            </li>
            <li>
              <strong>Flat regions:</strong> can use large <InlineMath>\alpha</InlineMath> for
              faster progress
            </li>
            <li>
              <strong>Curvature changes:</strong> optimal <InlineMath>\alpha</InlineMath> varies
              across iterations
            </li>
          </ul>
          <p className="text-sm mt-2">
            <strong>Line search adapts automatically,</strong> making gradient descent both
            robust and efficient.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-2">Current Method: Armijo Backtracking</h3>
          <p>The <strong>Armijo condition</strong> ensures sufficient decrease:</p>
          <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
          <p className="text-sm mt-2">
            Where <InlineMath>c_1 = </InlineMath>{gdLSC1.toFixed(4)} controls how much
            decrease we require.
          </p>

          <div className="mt-3">
            <p className="font-semibold">Backtracking Algorithm:</p>
            <ol className="list-decimal ml-6 space-y-1 text-sm">
              <li>
                Start with <InlineMath>\alpha = 1</InlineMath> (or previous iteration's value)
              </li>
              <li>Check if Armijo condition satisfied</li>
              <li>If yes → accept <InlineMath>\alpha</InlineMath></li>
              <li>If no → reduce <InlineMath>\alpha \leftarrow 0.5\alpha</InlineMath> and repeat</li>
            </ol>
          </div>

          <div className="mt-3 bg-teal-50 rounded p-3">
            <p className="font-semibold text-sm mb-2">Understanding <InlineMath>c_1</InlineMath>:</p>
            <ul className="text-sm list-disc ml-6">
              <li>
                <strong><InlineMath>c_1</InlineMath> too small</strong> (e.g., 0.00001): accepts poor steps, wastes iterations
              </li>
              <li>
                <strong><InlineMath>c_1</InlineMath> good</strong> (e.g., 0.0001): balances quality and efficiency
              </li>
              <li>
                <strong><InlineMath>c_1</InlineMath> too large</strong> (e.g., 0.5): too conservative, tiny steps
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-100 rounded p-3">
          <p className="font-bold text-sm mb-2">Other Line Search Methods</p>
          <p className="text-sm">
            <strong>Wolfe conditions:</strong> Add curvature condition for better theoretical properties<br/>
            <strong>Goldstein conditions:</strong> Alternative sufficient decrease criterion<br/>
            <strong>Exact line search:</strong> Minimize along line (expensive, rarely used)
          </p>
          <p className="text-xs mt-2 italic">
            Armijo backtracking is simple, fast, and works well in practice.
          </p>
        </div>
      </div>
    </CollapsibleSection>

    {/* Try This */}
    <CollapsibleSection
      title="Try This"
      defaultExpanded={false}
      storageKey="gd-ls-try-this"
      id="try-this"
    >
      <div className="space-y-3">
        <p className="text-gray-800 mb-4">
          See how line search automatically adapts to different situations:
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
      storageKey="gd-ls-when-wrong"
      id="when-things-go-wrong"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

          <div className="space-y-3">
            <div>
              <p className="font-semibold">❌ "Line search is always better than fixed step"</p>
              <p className="text-sm ml-6">
                ✓ Costs more per iteration (multiple gradient evaluations)<br/>
                ✓ For very cheap gradients, fixed step may be faster overall<br/>
                ✓ Tradeoff: fewer iterations vs cost per iteration
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "Line search guarantees fast convergence"</p>
              <p className="text-sm ml-6">
                ✓ Still subject to problem conditioning<br/>
                ✓ Gradient descent is fundamentally first-order (doesn't use curvature)<br/>
                ✓ Newton or L-BFGS will be faster for well-conditioned problems
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "Any line search condition works"</p>
              <p className="text-sm ml-6">
                ✓ Armijo alone doesn't prevent arbitrarily small steps<br/>
                ✓ Wolfe conditions (Armijo + curvature) have better theory<br/>
                ✓ In practice, Armijo backtracking works well for most problems
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
          <p className="mb-2">Same as fixed step gradient descent:</p>
          <ul className="space-y-2">
            <li>
              <strong>Strongly convex:</strong> Linear convergence, line search improves constant
            </li>
            <li>
              <strong>Convex:</strong> Converges to global minimum
            </li>
            <li>
              <strong>Non-convex:</strong> May converge to local minima, line search helps stability
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Too many backtracking steps</strong> → <InlineMath>c_1</InlineMath> too large, decrease it
            </li>
            <li>
              <strong>Slow progress</strong> → <InlineMath>c_1</InlineMath> too small, increase it (or use better algorithm)
            </li>
            <li>
              <strong>Still diverging</strong> → gradient computation bug, check implementation
            </li>
            <li>
              <strong>Expensive per iteration</strong> → gradient evaluation is costly,
              consider limited memory methods
            </li>
          </ul>
        </div>
      </div>
    </CollapsibleSection>

    {/* Mathematical Derivations */}
    <CollapsibleSection
      title="Mathematical Derivations"
      defaultExpanded={false}
      storageKey="gd-ls-math-derivations"
      id="mathematical-derivations"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Armijo Condition Proof</h3>
          <p>The Armijo condition ensures sufficient decrease:</p>
          <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
          <p className="text-sm mt-2">
            For descent direction <InlineMath>p = -\nabla f</InlineMath>, we have{' '}
            <InlineMath>{`\\nabla f^T p < 0`}</InlineMath>, so the right side decreases
            with <InlineMath>\alpha</InlineMath>.
          </p>
          <p className="text-sm mt-2">
            <strong>Guarantees:</strong> Backtracking terminates in finite steps (by Taylor expansion).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Descent Lemma</h3>
          <p>For L-<GlossaryTooltip termKey="smooth" /> functions:</p>
          <BlockMath>
            {`f(w + \\alpha p) \\leq f(w) + \\alpha \\nabla f^T p + \\frac{L\\alpha^2}{2}\\|p\\|^2`}
          </BlockMath>
          <p className="text-sm mt-2">
            This bounds how much f can increase along direction p, guaranteeing
            backtracking finds acceptable step.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Backtracking Terminates</h3>
          <p>By Taylor expansion around <InlineMath>w</InlineMath>:</p>
          <BlockMath>
            f(w + \alpha p) = f(w) + \alpha \nabla f^T p + O(\alpha^2)
          </BlockMath>
          <p className="text-sm mt-2">
            For small enough <InlineMath>\alpha</InlineMath>, the{' '}
            <InlineMath>O(\alpha^2)</InlineMath> term is negligible, so:
          </p>
          <BlockMath>
            {`f(w + \\alpha p) \\approx f(w) + \\alpha \\nabla f^T p < f(w) + c_1 \\alpha \\nabla f^T p`}
          </BlockMath>
          <p className="text-sm mt-2">
            Since <InlineMath>{`c_1 < 1`}</InlineMath> and{' '}
            <InlineMath>{`\\nabla f^T p < 0`}</InlineMath>, Armijo condition satisfied.
          </p>
        </div>
      </div>
    </CollapsibleSection>

    {/* Advanced Topics */}
    <CollapsibleSection
      title="Advanced Topics"
      defaultExpanded={false}
      storageKey="gd-ls-advanced"
      id="advanced-topics"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Wolfe Conditions</h3>
          <p>Stronger than Armijo, adds curvature condition:</p>
          <div className="mt-2">
            <p className="font-semibold text-sm">1. Sufficient decrease (Armijo):</p>
            <BlockMath>f(w + \alpha p) \leq f(w) + c_1 \alpha \nabla f^T p</BlockMath>
          </div>
          <div className="mt-2">
            <p className="font-semibold text-sm">2. Curvature condition:</p>
            <BlockMath>\nabla f(w + \alpha p)^T p \geq c_2 \nabla f^T p</BlockMath>
          </div>
          <p className="text-sm mt-2">
            Typical: <InlineMath>c_1 = 0.0001</InlineMath>, <InlineMath>c_2 = 0.9</InlineMath>.
            Ensures step isn't too small.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Strong Wolfe Conditions</h3>
          <p>Replace curvature condition with:</p>
          <BlockMath>|\nabla f(w + \alpha p)^T p| \leq c_2 |\nabla f^T p|</BlockMath>
          <p className="text-sm mt-2">
            Prevents steps where curvature increases too much.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Goldstein Conditions</h3>
          <p>Alternative to Armijo with upper and lower bounds:</p>
          <BlockMath>
            {'f(w) + (1-c)\\alpha \\nabla f^T p \\leq f(w + \\alpha p) \\leq f(w) + c\\alpha \\nabla f^T p'}
          </BlockMath>
          <p className="text-sm mt-2">
            Less commonly used than Wolfe conditions.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Line Search Method Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-purple-100">
                <tr>
                  <th className="border p-2">Method</th>
                  <th className="border p-2">Cost</th>
                  <th className="border p-2">Theory</th>
                  <th className="border p-2">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2"><strong>Armijo</strong></td>
                  <td className="border p-2">Low</td>
                  <td className="border p-2">Good</td>
                  <td className="border p-2">General purpose</td>
                </tr>
                <tr>
                  <td className="border p-2"><strong>Wolfe</strong></td>
                  <td className="border p-2">Medium</td>
                  <td className="border p-2">Better</td>
                  <td className="border p-2">Quasi-Newton methods</td>
                </tr>
                <tr>
                  <td className="border p-2"><strong>Strong Wolfe</strong></td>
                  <td className="border p-2">Medium</td>
                  <td className="border p-2">Best</td>
                  <td className="border p-2">BFGS, L-BFGS</td>
                </tr>
                <tr>
                  <td className="border p-2"><strong>Exact</strong></td>
                  <td className="border p-2">Very high</td>
                  <td className="border p-2">Optimal</td>
                  <td className="border p-2">Rarely practical</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Cost Analysis</h3>
          <p className="mb-2"><strong>Per iteration cost:</strong></p>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>Fixed step: 1 gradient evaluation</li>
            <li>Armijo backtracking: 1-10 gradient evaluations (average ~2-3)</li>
            <li>Wolfe conditions: 2-15 gradient evaluations</li>
          </ul>
          <p className="text-sm mt-2">
            <strong>Total cost:</strong> Line search usually wins by reducing total iterations.
          </p>
        </div>
      </div>
    </CollapsibleSection>

  </>
  );
};
