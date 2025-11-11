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
import type { ProblemFunctions } from '../../algorithms/types';
import type { GDLineSearchIteration } from '../../algorithms/gradient-descent-linesearch';
import type { ExperimentPreset } from '../../types/experiments';
import { computeIterationSummary } from '../../utils/iterationSummaryUtils';

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
    () => getExperimentsForAlgorithm('gd-linesearch'),
    []
  );

  return (
    <>
      {/* 1. Configuration Section */}
      <CollapsibleSection title="Algorithm Configuration" defaultExpanded={false} data-scroll-target="configuration">
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
              summary={computeIterationSummary({
                currentIndex: currentIter,
                totalIterations: iterations.length,
                gradNorm: iterations[currentIter].gradNorm,
                loss: iterations[currentIter].newLoss,
                location: iterations[currentIter].wNew,
                gtol: gdLSTolerance,
                maxIter
              })}
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
              Instead of using a fixed step size <InlineMath>\varAlpha</InlineMath>, automatically
              search for a good step size at each iteration. This makes the algorithm{' '}
              <strong>robust and efficient</strong> across different problems.
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
                display: <InlineMath>\varF</InlineMath>,
                description: "objective function to minimize"
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
              <>Initialize <InlineMath>\varW \leftarrow \varWZero</InlineMath> <Complexity>O(1)</Complexity></>,
              <><strong>repeat</strong> until convergence:</>,
              <>
                <span className="ml-4">Compute gradient <InlineMath>{String.raw`\varGrad = \nabla f(\varW)`}</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
              </>,
              <>
                <span className="ml-4">Set search direction <InlineMath>{String.raw`\varP \leftarrow -\varGrad`}</InlineMath> <Complexity>O(d)</Complexity></span>
              </>,
              <>
                <span className="ml-4"><strong>Line search:</strong> find step size <InlineMath>\varAlpha</InlineMath> that decreases loss sufficiently <Complexity explanation="Backtracking">≈1-4 f evals</Complexity></span>
              </>,
              <>
                <span className="ml-4"><InlineMath>{String.raw`\varW \leftarrow \varW + \varAlpha \varP`}</InlineMath> <Complexity>O(d)</Complexity></span>
              </>,
              <><strong>return</strong> <InlineMath>\varW</InlineMath></>
            ]}
          />

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
              <strong>Note:</strong> Line search adapts <InlineMath>\varAlpha</InlineMath> iteration-by-iteration,
              which prevents divergence and speeds up convergence. However, it's still <strong>one step size
                for all directions</strong> at each iteration. On <GlossaryTooltip termKey="ill-conditioned" /> problems, this causes
              zig-zagging (just less severe than fixed <InlineMath>\varAlpha</InlineMath>).
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

          <div className="bg-gray-100 rounded p-3">
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
              Fixed step size <InlineMath>\varAlpha</InlineMath> (where <InlineMath>\varAlpha</InlineMath> is the step size controlling how far we move along the gradient) fails when landscape has
              varying curvature:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>
                <strong>Steep regions:</strong> need small <InlineMath>\varAlpha</InlineMath> to
                avoid overshooting
              </li>
              <li>
                <strong>Flat regions:</strong> can use large <InlineMath>\varAlpha</InlineMath> for
                faster progress
              </li>
              <li>
                <strong>Curvature changes:</strong> optimal <InlineMath>\varAlpha</InlineMath> varies
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
            <ArmijoLineSearch
              color="teal"
              initialAlpha="1 (or previous iteration's value)"
              typicalFEvals="2-5"
              c1Value={gdLSC1}
              verdict={{
                title: "Generally excellent tradeoff!",
                description: "The extra f-evals per iteration are usually offset by needing 2-10× fewer iterations. Plus, you avoid the nightmare of manual α tuning for each problem."
              }}
              benefits={[
                'Fewer total iterations: Good steps converge faster',
                'Robustness: Works across problems without tuning α',
                'Automatic adaptation: Large steps when safe, small steps when needed'
              ]}
              additionalNotes={
                <div className="bg-teal-50 rounded p-3">
                  <p className="font-semibold text-sm mb-2">Understanding <InlineMath>{String.raw`c_1`}</InlineMath> (Armijo parameter):</p>
                  <ul className="text-sm list-disc ml-6">
                    <li>
                      <strong><InlineMath>{String.raw`c_1`}</InlineMath> too small</strong> (e.g., 0.00001): accepts poor steps, wastes iterations
                    </li>
                    <li>
                      <strong><InlineMath>{String.raw`c_1`}</InlineMath> good</strong> (e.g., 0.0001): balances quality and efficiency
                    </li>
                    <li>
                      <strong><InlineMath>{String.raw`c_1`}</InlineMath> too large</strong> (e.g., 0.5): too conservative, tiny steps
                    </li>
                  </ul>
                </div>
              }
            />
          </div>

          <div className="bg-blue-100 rounded p-3 mt-3">
            <p className="font-bold text-sm mb-2">Other Line Search Methods</p>
            <p className="text-sm">
              <strong>Wolfe conditions:</strong> Add curvature condition for better theoretical properties<br />
              <strong>Goldstein conditions:</strong> Alternative sufficient decrease criterion<br />
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
                  ✓ Costs more per iteration (multiple gradient evaluations)<br />
                  ✓ For very cheap gradients, fixed step may be faster overall<br />
                  ✓ Tradeoff: fewer iterations vs cost per iteration
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Line search guarantees fast convergence"</p>
                <p className="text-sm ml-6">
                  ✓ Still subject to problem conditioning<br />
                  ✓ Gradient descent is fundamentally first-order (doesn't use curvature)<br />
                  ✓ Newton or L-BFGS will be faster for well-conditioned problems
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Any line search condition works"</p>
                <p className="text-sm ml-6">
                  ✓ Armijo alone doesn't prevent arbitrarily small steps<br />
                  ✓ Wolfe conditions (Armijo + curvature) have better theory<br />
                  ✓ In practice, Armijo backtracking works well for most problems
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
            <p className="mb-2">Same convergence guarantees as fixed step gradient descent:</p>
            <ul className="space-y-2">
              <li>
                <strong><GlossaryTooltip termKey="strongly-convex" />:</strong> Linear convergence, line search improves the convergence constant
              </li>
              <li>
                <strong><GlossaryTooltip termKey="convex" />:</strong> Converges to global minimum
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
                <strong>Too many backtracking steps</strong> → <InlineMath>{String.raw`c_1`}</InlineMath> too large, decrease it
              </li>
              <li>
                <strong>Slow progress</strong> → <InlineMath>{String.raw`c_1`}</InlineMath> too small, increase it (or use better algorithm)
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
            <p>
              Let <InlineMath>\varW</InlineMath> be the current parameters, <InlineMath>\varP</InlineMath> the search direction,
              and <InlineMath>\varAlpha</InlineMath> the step size. The Armijo condition ensures sufficient decrease in
              the objective function <InlineMath>\varF</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW + \varAlpha \varP) \leq f(\varW) + c_1 \varAlpha \varGrad^T \varP`}</BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`c_1 \in (0, 1)`}</InlineMath> is the Armijo parameter (typically 0.0001).
            </p>
            <p className="text-sm mt-2">
              For descent direction <InlineMath>{String.raw`\varP = -\varGrad`}</InlineMath>, we have{' '}
              <InlineMath>{String.raw`\varGrad^T \varP = -\|\varGrad\|^2 < 0`}</InlineMath>, so the right side decreases
              linearly with <InlineMath>\varAlpha</InlineMath>.
            </p>
            <p className="text-sm mt-2">
              <strong>Guarantees:</strong> Backtracking terminates in finite steps (by Taylor expansion, shown below).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Descent Lemma</h3>
            <p>
              For <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> functions (where <InlineMath>L</InlineMath> is the <GlossaryTooltip termKey="lipschitz-continuous" /> constant of the gradient):
            </p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) \leq f(\varW) + \varAlpha \varGrad^T \varP + \frac{L\varAlpha^2}{2}\|\varP\|^2`}
            </BlockMath>
            <p className="text-sm mt-2">
              This bounds how much <InlineMath>\varF</InlineMath> can increase along direction <InlineMath>\varP</InlineMath>, guaranteeing
              backtracking finds an acceptable step.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Backtracking Terminates</h3>
            <p>By Taylor expansion around <InlineMath>\varW</InlineMath>:</p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) = f(\varW) + \varAlpha \varGrad^T \varP + O(\varAlpha^2)`}
            </BlockMath>
            <p className="text-sm mt-2">
              For small enough <InlineMath>\varAlpha</InlineMath>, the{' '}
              <InlineMath>{String.raw`O(\varAlpha^2)`}</InlineMath> term is negligible, so:
            </p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) \approx f(\varW) + \varAlpha \varGrad^T \varP < f(\varW) + c_1 \varAlpha \varGrad^T \varP`}
            </BlockMath>
            <p className="text-sm mt-2">
              Since <InlineMath>{String.raw`c_1 < 1`}</InlineMath> and{' '}
              <InlineMath>{String.raw`\varGrad^T \varP < 0`}</InlineMath> (descent direction), the Armijo condition is satisfied.
              This proves backtracking will always find an acceptable step size.
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
            <p>Stronger than Armijo, adds a curvature condition to ensure steps aren't too small:</p>
            <div className="mt-2">
              <p className="font-semibold text-sm">1. Sufficient decrease (Armijo):</p>
              <BlockMath>{String.raw`f(\varW + \varAlpha \varP) \leq f(\varW) + c_1 \varAlpha \varGrad^T \varP`}</BlockMath>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-sm">2. Curvature condition:</p>
              <BlockMath>{String.raw`\nabla f(\varW + \varAlpha \varP)^T \varP \geq c_2 \varGrad^T \varP`}</BlockMath>
            </div>
            <p className="text-sm mt-2">
              Typical values: <InlineMath>{String.raw`c_1 = 0.0001`}</InlineMath>, <InlineMath>{String.raw`c_2 = 0.9`}</InlineMath>.
              The curvature condition prevents accepting steps where the gradient hasn't decreased enough.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Strong Wolfe Conditions</h3>
            <p>Replace curvature condition with an absolute value constraint:</p>
            <BlockMath>{String.raw`\left|\nabla f(\varW + \varAlpha \varP)^T \varP\right| \leq c_2 \left|\varGrad^T \varP\right|`}</BlockMath>
            <p className="text-sm mt-2">
              Prevents steps where curvature increases too much. Used in quasi-Newton methods like L-BFGS.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Goldstein Conditions</h3>
            <p>Alternative to Armijo with upper and lower bounds on the decrease:</p>
            <BlockMath>
              {String.raw`f(\varW) + (1-c)\varAlpha \varGrad^T \varP \leq f(\varW + \varAlpha \varP) \leq f(\varW) + c\varAlpha \varGrad^T \varP`}
            </BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`c \in (0, 1/2)`}</InlineMath>. Less commonly used than Wolfe conditions.
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
