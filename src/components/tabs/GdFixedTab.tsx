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
import type { ProblemFunctions } from '../../algorithms/types';
import type { GDIteration } from '../../algorithms/gradient-descent';
import type { ExperimentPreset } from '../../types/experiments';
import { computeIterationSummary } from '../../utils/iterationSummaryUtils';

interface GdFixedTabProps {
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;
  gdFixedAlpha: number;
  onGdFixedAlphaChange: (val: number) => void;
  gdFixedTolerance: number;
  onGdFixedToleranceChange: (val: number) => void;
  iterations: GDIteration[];
  currentIter: number;
  onIterChange: (val: number) => void;
  onResetIter: () => void;
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  problemParameters: Record<string, number | string>;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  paramCanvasRef: React.RefObject<HTMLCanvasElement>;
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
}

export const GdFixedTab: React.FC<GdFixedTabProps> = ({
  maxIter,
  onMaxIterChange,
  initialW0,
  onInitialW0Change,
  initialW1,
  onInitialW1Change,
  gdFixedAlpha,
  onGdFixedAlphaChange,
  gdFixedTolerance,
  onGdFixedToleranceChange,
  iterations,
  currentIter,
  onIterChange,
  problemFuncs,
  problem: problemDefinition,
  currentProblem,
  problemParameters,
  bounds,
  paramCanvasRef,
  experimentLoading,
  onLoadExperiment,
}) => {
  const experiments = React.useMemo(
    () => getExperimentsForAlgorithm('gd-fixed'),
    []
  );

  return (
    <>
      {/* 1. Configuration Section */}
      <CollapsibleSection title="Algorithm Configuration" defaultExpanded={false} id="configuration" data-scroll-target="configuration">
        <AlgorithmConfiguration
          algorithm="gd-fixed"
          maxIter={maxIter}
          onMaxIterChange={onMaxIterChange}
          initialW0={initialW0}
          onInitialW0Change={onInitialW0Change}
          initialW1={initialW1}
          onInitialW1Change={onInitialW1Change}
          gdFixedAlpha={gdFixedAlpha}
          onGdFixedAlphaChange={onGdFixedAlphaChange}
          gdFixedTolerance={gdFixedTolerance}
          onGdFixedToleranceChange={onGdFixedToleranceChange}
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

          <canvas
            ref={paramCanvasRef}
            style={{ width: '100%', height: '500px' }}
            className="border border-gray-300 rounded"
          />

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
              algorithm="gd-fixed"
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
              tolerance={gdFixedTolerance}
              ftol={1e-9}
              xtol={1e-9}
              summary={computeIterationSummary({
                currentIndex: currentIter,
                totalIterations: iterations.length,
                gradNorm: iterations[currentIter].gradNorm,
                loss: iterations[currentIter].newLoss,
                location: iterations[currentIter].wNew,
                gtol: gdFixedTolerance,
                maxIter
              })}
              onIterationChange={onIterChange}
            />
          </div>
        )}
      </div>

      <CollapsibleSection
        title="Quick Start"
        defaultExpanded={false}
        storageKey="gd-fixed-quick-start"
        id="quick-start"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-green-800 mb-2">The Core Idea</h3>
            <p>
              Follow the <strong>gradient downhill</strong>. Let <InlineMath>{String.raw`\varW \in \mathbb{R}^d`}</InlineMath> be
              the <InlineMath>{String.raw`d`}</InlineMath>-dimensional parameter vector.
              The gradient <InlineMath>{String.raw`\varGrad`}</InlineMath> points in the direction of steepest
              increase, so <InlineMath>{String.raw`-\varGrad`}</InlineMath> points toward steepest
              decrease.
            </p>
          </div>

          <Pseudocode
            color="green"
            inputs={[
              {
                id: "w_0",
                display: <InlineMath>{String.raw`\varWZero \in \mathbb{R}^d`}</InlineMath>,
                description: "initial parameter vector"
              },
              {
                id: "f",
                display: <InlineMath>{String.raw`f`}</InlineMath>,
                description: "objective function to minimize"
              },
              {
                id: "alpha",
                display: <InlineMath>{String.raw`\varAlpha`}</InlineMath>,
                description: "fixed step size"
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
              <>Initialize <InlineMath>{String.raw`\varW \leftarrow \varWZero`}</InlineMath></>,
              <><strong>repeat</strong> until convergence:</>,
              <>
                <span className="ml-4">Compute gradient <InlineMath>{String.raw`\varGrad`}</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
              </>,
              <>
                <span className="ml-4"><InlineMath>{String.raw`\varW \leftarrow \varW - \varAlpha \varGrad`}</InlineMath> <Complexity explanation="Vector subtraction and scalar multiplication">O(d)</Complexity></span>
              </>,
              <><strong>return</strong> <InlineMath>{String.raw`\varW`}</InlineMath></>
            ]}
          />

          <div>
            <h3 className="text-lg font-bold text-green-800 mb-2">Key Formula</h3>
            <p className="text-sm mb-2">
              Let <InlineMath>{String.raw`k`}</InlineMath> be the iteration index. At each iteration:
            </p>
            <BlockMath>{String.raw`\varW_{k+1} = \varW_k - \varAlpha \nabla f(\varW_k)`}</BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`\varAlpha > 0`}</InlineMath> is the <strong>step size</strong> (also called learning rate).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-green-800 mb-2">When to Use</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Simple baseline for any differentiable function</li>
              <li>Educational purposes (understanding optimization)</li>
              <li>When computational cost per iteration must be minimal</li>
              <li>Problems where you can tune <InlineMath>{String.raw`\varAlpha`}</InlineMath> effectively</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-400 rounded p-3">
            <p className="font-bold text-sm text-amber-900 mb-1">⚠️ Key Challenge: Step Size Selection</p>
            <p className="text-sm text-amber-800">
              Choosing <InlineMath>{String.raw`\varAlpha`}</InlineMath> is critical. Too large → divergence.
              Too small → slow convergence. This is why line search methods exist
              (see Gradient Descent with Line Search tab).
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Try This"
        defaultExpanded={false}
        storageKey="gd-fixed-try-this"
        id="try-this"
      >
        <div className="space-y-3">
          <p className="text-gray-800 mb-4">
            Experiment with different step sizes to see success and failure modes:
          </p>

          <ExperimentCardList
            experiments={experiments}
            experimentLoading={experimentLoading}
            onLoadExperiment={onLoadExperiment}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="When Things Go Wrong"
        defaultExpanded={false}
        storageKey="gd-fixed-when-wrong"
        id="when-things-go-wrong"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">❌ "The gradient points to the minimum"</p>
                <p className="text-sm ml-6">
                  ✓ The gradient points toward steepest <strong>increase</strong><br />
                  ✓ We follow <InlineMath>{String.raw`-\varGrad`}</InlineMath> (negative gradient) downhill<br />
                  ✓ This is the direction of steepest <strong>decrease</strong>, not necessarily toward the minimum
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Gradient descent always converges"</p>
                <p className="text-sm ml-6">
                  ✓ Requires <GlossaryTooltip termKey="smooth" /> function + step size 0 &lt; <InlineMath>{String.raw`\varAlpha`}</InlineMath> &lt; 2/L for convergence<br />
                  ✓ Even then, only converges to *stationary point* (may be local minimum, not global)<br />
                  ✓ Can diverge if <InlineMath>{String.raw`\varAlpha`}</InlineMath> too large<br />
                  ✓ Can get stuck in local minima on non-<GlossaryTooltip termKey="convex" /> functions
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Just pick <InlineMath>{String.raw`\varAlpha = 0.01`}</InlineMath> and it'll work"</p>
                <p className="text-sm ml-6">
                  ✓ Optimal <InlineMath>{String.raw`\varAlpha`}</InlineMath> depends on problem scaling and coordinate choice<br />
                  ✓ Fixed step size treats all coordinates equally: rescale one variable (meters→kilometers) and <InlineMath>{String.raw`\varAlpha`}</InlineMath> becomes 1000× too large/small for that direction<br />
                  ✓ Line search methods (next tab) solve this automatically
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
            <ul className="space-y-2">
              <li>
                <strong><GlossaryTooltip termKey="strongly-convex" />:</strong> Linear convergence to global minimum
                (requires <GlossaryTooltip termKey="smooth" /> function + 0 &lt; <InlineMath>{String.raw`\varAlpha`}</InlineMath> &lt; 2/L)
              </li>
              <li>
                <strong>Convex:</strong> Converges to global minimum (possibly slowly)
              </li>
              <li>
                <strong>Non-convex:</strong> May get stuck in local minima or saddle points
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Choosing Step Size <InlineMath>{String.raw`\varAlpha`}</InlineMath></h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Theoretical guideline:</strong> For <GlossaryTooltip termKey="smooth" /> functions
                with <GlossaryTooltip termKey="lipschitz-continuous" /> gradient:
              </p>
              <BlockMath>{String.raw`0 < \varAlpha < \frac{2}{L}`}</BlockMath>
              <p>
                where <InlineMath>{String.raw`L`}</InlineMath> is the Lipschitz constant of <InlineMath>{String.raw`\varGrad`}</InlineMath>.
              </p>
              <p className="mt-2">
                <strong>Better approach:</strong> Use line search (next tab) to avoid manual tuning.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Mathematical Derivations"
        defaultExpanded={false}
        storageKey="gd-fixed-math-derivations"
        id="mathematical-derivations"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Gradient Descent Update Rule</h3>
            <p>
              Let <InlineMath>{String.raw`k`}</InlineMath> be the iteration index. The basic update is:
            </p>
            <BlockMath>{String.raw`\varW_{k+1} = \varW_k - \varAlpha \nabla f(\varW_k)`}</BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`\varAlpha > 0`}</InlineMath> is the step size.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why This Works</h3>
            <p>
              By Taylor expansion around <InlineMath>{String.raw`\varW_k`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \approx f(\varW_k) + \nabla f(\varW_k)^T (\varW_{k+1} - \varW_k)`}</BlockMath>
            <p className="text-sm mt-2">
              Substituting the update rule <InlineMath>{String.raw`\varW_{k+1} - \varW_k = -\varAlpha \nabla f(\varW_k)`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \approx f(\varW_k) - \varAlpha \|\nabla f(\varW_k)\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              Since <InlineMath>{String.raw`\|\nabla f(\varW_k)\|^2 \geq 0`}</InlineMath>, the loss decreases
              (for small enough <InlineMath>{String.raw`\varAlpha`}</InlineMath>).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
            <p>
              <strong>For strongly convex functions:</strong>
            </p>
            <p className="text-sm mt-2">
              Let <InlineMath>{String.raw`\varW^*`}</InlineMath> denote the optimal parameters,
              <InlineMath>{String.raw`\mu > 0`}</InlineMath> the strong convexity parameter, and
              <InlineMath>{String.raw`L`}</InlineMath> the Lipschitz constant of <InlineMath>{String.raw`\varGrad`}</InlineMath>. Then:
            </p>
            <BlockMath>{String.raw`\|\varW_k - \varW^*\| \leq \left(1 - \frac{\mu}{L}\right)^k \|\varWZero - \varW^*\|`}</BlockMath>
            <p className="text-sm mt-2">
              <strong>Linear convergence:</strong> Error decreases by constant factor each iteration.
              The rate depends on the condition number <InlineMath>{String.raw`L/\mu`}</InlineMath>.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Step Size Selection</h3>
            <p><strong>Sufficient condition for decrease:</strong></p>
            <p className="text-sm mb-2">
              For <GlossaryTooltip termKey="smooth" /> functions with Lipschitz constant <InlineMath>{String.raw`L`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`\varAlpha < \frac{2}{L}`}</BlockMath>
            <p className="text-sm mt-2">
              The Lipschitz constant <InlineMath>{String.raw`L`}</InlineMath> satisfies:
            </p>
            <BlockMath>{String.raw`\|\nabla f(\varW) - \nabla f(\varW')\| \leq L\|\varW - \varW'\|`}</BlockMath>
            <p className="text-sm mt-2">
              for all <InlineMath>{String.raw`\varW, \varW' \in \mathbb{R}^d`}</InlineMath>.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Example: Logistic Regression</h3>
            <p className="text-sm mb-2">
              Let <InlineMath>{String.raw`N`}</InlineMath> be the number of training examples,
              <InlineMath>{String.raw`x_i \in \mathbb{R}^d`}</InlineMath> the features,
              <InlineMath>{String.raw`y_i \in \{0,1\}`}</InlineMath> the labels,
              <InlineMath>{String.raw`\sigma(z) = 1/(1+e^{-z})`}</InlineMath> the sigmoid function, and
              <InlineMath>{String.raw`\lambda \geq 0`}</InlineMath> the regularization parameter.
            </p>
            <p className="text-sm mt-1"><strong>Loss function:</strong></p>
            <BlockMath>{String.raw`f(\varW) = -\frac{1}{N} \sum_{i=1}^{N} \left[y_i \log(\sigma(\varW^T x_i)) + (1-y_i) \log(1-\sigma(\varW^T x_i))\right] + \frac{\lambda}{2}\|\varW\|^2`}</BlockMath>
            <p className="text-sm mt-2"><strong>Gradient:</strong></p>
            <BlockMath>{String.raw`\nabla f(\varW) = \frac{1}{N} \sum_{i=1}^{N} (\sigma(\varW^T x_i) - y_i) x_i + \lambda \varW`}</BlockMath>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Advanced Topics"
        defaultExpanded={false}
        storageKey="gd-fixed-advanced"
        id="advanced-topics"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Momentum Methods</h3>
            <p className="text-sm mb-2">
              Let <InlineMath>{String.raw`v_k \in \mathbb{R}^d`}</InlineMath> be the velocity vector
              and <InlineMath>{String.raw`\beta \in [0,1)`}</InlineMath> the momentum coefficient.
              Add momentum to accelerate convergence:
            </p>
            <BlockMath>{String.raw`v_{k+1} = \beta v_k - \varAlpha \nabla f(\varW_k)`}</BlockMath>
            <BlockMath>{String.raw`\varW_{k+1} = \varW_k + v_{k+1}`}</BlockMath>
            <p className="text-sm mt-2">
              Momentum accumulates velocity in consistent directions, damping oscillations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Nesterov Acceleration</h3>
            <p className="text-sm mb-2">
              "Look ahead" before computing gradient:
            </p>
            <BlockMath>{String.raw`\varW_{k+1} = \varW_k - \varAlpha \nabla f(\varW_k + \beta v_k) + \beta v_k`}</BlockMath>
            <p className="text-sm mt-2">
              Provably optimal convergence rate for{' '}
              <GlossaryTooltip termKey="smooth" />{' '}
              <GlossaryTooltip termKey="convex" /> functions.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Adaptive Methods Preview</h3>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>
                <strong>AdaGrad:</strong> Adapts step size per parameter based on
                historical gradients
              </li>
              <li>
                <strong>RMSprop:</strong> Uses moving average of squared gradients
              </li>
              <li>
                <strong>Adam:</strong> Combines momentum and adaptive step sizes
                (most popular in deep learning)
              </li>
            </ul>
            <p className="text-sm mt-2">
              These methods automatically tune step sizes, reducing manual tuning burden.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
            <p className="text-sm mb-2">
              Let <InlineMath>{String.raw`d`}</InlineMath> be the dimension of the parameter space.
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Per iteration:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath> for the parameter update,
                plus problem-dependent cost of computing <InlineMath>{String.raw`\varGrad`}</InlineMath>
              </li>
              <li><strong>Memory:</strong> <InlineMath>{String.raw`O(d)`}</InlineMath> to store parameters</li>
              <li><strong>Total cost:</strong> depends on number of iterations to converge</li>
            </ul>
            <p className="text-sm mt-2 italic">
              Simple and cheap per iteration, but may require many iterations.
            </p>
          </div>
        </div>
      </CollapsibleSection>

    </>
  );
};
