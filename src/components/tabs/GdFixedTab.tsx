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
import { Citation } from '../Citation';
import { References } from '../References';
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
        defaultExpanded={true}
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
        title="How It Works"
        defaultExpanded={false}
        storageKey="gd-fixed-how-it-works"
        id="how-it-works"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">The Update Rule</h3>
            <p className="mb-2">
              Let <InlineMath>{String.raw`k`}</InlineMath> be the iteration index. At each step, gradient descent updates the parameters:
            </p>
            <BlockMath>{String.raw`\varW_{k+1} = \varW_k - \varAlpha \nabla f(\varW_k)`}</BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`\varAlpha > 0`}</InlineMath> is the <strong>step size</strong> (also called learning rate).
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
            <p className="font-semibold text-blue-900 mb-2">💡 Intuition: Following the Slope Downhill</p>
            <p className="text-sm text-blue-800">
              The gradient <InlineMath>{String.raw`\nabla f(\varW_k)`}</InlineMath> points in the direction of steepest increase.
              By subtracting <InlineMath>{String.raw`\varAlpha \nabla f(\varW_k)`}</InlineMath>, we take a step in the
              direction of steepest <strong>decrease</strong>. It's like walking downhill on a mountain: at each location,
              you look around to find the steepest downward slope and step in that direction.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Why This Decreases the Loss</h3>
            <p className="mb-2">
              By Taylor expansion around <InlineMath>{String.raw`\varW_k`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \approx f(\varW_k) + \nabla f(\varW_k)^T (\varW_{k+1} - \varW_k)`}</BlockMath>
            <p className="text-sm mt-2">
              Substituting the update rule <InlineMath>{String.raw`\varW_{k+1} - \varW_k = -\varAlpha \nabla f(\varW_k)`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \approx f(\varW_k) - \varAlpha \|\nabla f(\varW_k)\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              Since <InlineMath>{String.raw`\|\nabla f(\varW_k)\|^2 \geq 0`}</InlineMath>, the loss decreases
              (for small enough <InlineMath>{String.raw`\varAlpha`}</InlineMath>). The amount of decrease is proportional
              to both the step size <InlineMath>{String.raw`\varAlpha`}</InlineMath> and the squared gradient norm.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Step-by-Step Walkthrough</h3>
            <ol className="list-decimal ml-6 space-y-2 text-sm">
              <li>
                <strong>Initialize:</strong> Start at some initial point <InlineMath>{String.raw`\varWZero`}</InlineMath> in parameter space
              </li>
              <li>
                <strong>Compute gradient:</strong> Evaluate <InlineMath>{String.raw`\nabla f(\varW_k)`}</InlineMath> at the current location.
                This tells you which direction is uphill.
              </li>
              <li>
                <strong>Take a step downhill:</strong> Move in the direction <InlineMath>{String.raw`-\nabla f(\varW_k)`}</InlineMath> (negative gradient)
                by an amount controlled by <InlineMath>{String.raw`\varAlpha`}</InlineMath>
              </li>
              <li>
                <strong>Check convergence:</strong> If the gradient is near zero (you're at a flat spot), stop. Otherwise, repeat from step 2.
              </li>
            </ol>
          </div>

          <div className="bg-indigo-100 rounded p-4 mt-4">
            <p className="font-bold text-indigo-900 mb-2">Key Takeaways</p>
            <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
              <li>Gradient descent is a <strong>local</strong> method: it only uses information at the current point</li>
              <li>The gradient tells you the direction, but not how far to go (that's the step size problem)</li>
              <li>Each step is guaranteed to decrease the loss (for <InlineMath>L</InlineMath>-smooth functions with small enough <InlineMath>{String.raw`\varAlpha`}</InlineMath>)</li>
              <li>Convergence to a global minimum requires <GlossaryTooltip termKey="convex" /> functions</li>
            </ul>
          </div>
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
                  ✓ Requires <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> function + step size 0 &lt; <InlineMath>{String.raw`\varAlpha`}</InlineMath> &lt; 2/L for convergence<br />
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
                (for <InlineMath>\mu</InlineMath>-strongly convex, <InlineMath>L</InlineMath>-smooth functions with 0 &lt; <InlineMath>{String.raw`\varAlpha`}</InlineMath> &lt; 2/(L+μ))<Citation citationKey="gd-strongly-convex-linear-convergence-nesterov-2018" />
              </li>
              <li>
                <strong>Convex:</strong> Converges to global minimum (possibly slowly)<Citation citationKey="gd-convex-sublinear-convergence-nesterov-2018" />
              </li>
              <li>
                <strong>Non-convex:</strong> May get stuck in local minima or saddle points
              </li>
            </ul>
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
          <p className="text-sm italic">
            For intuitive explanations, see the <strong>"How It Works"</strong> section above. This section provides rigorous mathematical proofs and convergence guarantees.
          </p>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Descent Lemma</h3>
            <p className="text-sm mb-2">
              <strong>Theorem:</strong> For <InlineMath>L</InlineMath>-smooth functions (where the gradient is <InlineMath>L</InlineMath>-Lipschitz continuous),
              the gradient descent update satisfies:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \leq f(\varW_k) - \varAlpha \|\nabla f(\varW_k)\|^2 + \frac{L\varAlpha^2}{2}\|\nabla f(\varW_k)\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              <strong>Proof sketch:</strong> By <InlineMath>L</InlineMath>-smoothness, we have the quadratic upper bound:<Citation citationKey="gd-descent-lemma-quadratic-upper-bound-nesterov-2018" />
            </p>
            <BlockMath>{String.raw`f(\varW') \leq f(\varW) + \nabla f(\varW)^T(\varW' - \varW) + \frac{L}{2}\|\varW' - \varW\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              Substituting <InlineMath>{String.raw`\varW' = \varW_k - \varAlpha \nabla f(\varW_k)`}</InlineMath> and <InlineMath>{String.raw`\varW = \varW_k`}</InlineMath>:
            </p>
            <BlockMath>{String.raw`f(\varW_{k+1}) \leq f(\varW_k) - \varAlpha \|\nabla f(\varW_k)\|^2 + \frac{L\varAlpha^2}{2}\|\nabla f(\varW_k)\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              Rearranging: <InlineMath>{String.raw`f(\varW_{k+1}) \leq f(\varW_k) - \varAlpha(1 - \frac{L\varAlpha}{2})\|\nabla f(\varW_k)\|^2`}</InlineMath>.
              For descent, we need <InlineMath>{String.raw`1 - \frac{L\varAlpha}{2} > 0`}</InlineMath>, which gives <InlineMath>{String.raw`\varAlpha < \frac{2}{L}`}</InlineMath>.<Citation citationKey="gd-smooth-descent-condition-nesterov-2018" />
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
            <p className="font-semibold text-blue-900 mb-2">💡 Understanding L-Smoothness</p>
            <p className="text-sm text-blue-800 mb-2">
              A function is <InlineMath>L</InlineMath>-smooth if its gradient is <InlineMath>L</InlineMath>-Lipschitz continuous:
            </p>
            <BlockMath>{String.raw`\|\nabla f(\varW) - \nabla f(\varW')\| \leq L\|\varW - \varW'\|`}</BlockMath>
            <p className="text-sm text-blue-800 mt-2">
              Intuitively, <InlineMath>L</InlineMath> bounds how quickly the gradient can change. Smaller <InlineMath>L</InlineMath> means
              the function is "nicer" (less curved), allowing larger step sizes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Optimal Step Size</h3>
            <p className="text-sm mb-2">
              From the descent lemma, the decrease is:
            </p>
            <BlockMath>{String.raw`f(\varW_k) - f(\varW_{k+1}) \geq \varAlpha\left(1 - \frac{L\varAlpha}{2}\right)\|\nabla f(\varW_k)\|^2`}</BlockMath>
            <p className="text-sm mt-2">
              To maximize the per-step decrease, take the derivative with respect to <InlineMath>{String.raw`\varAlpha`}</InlineMath> and set to zero:
            </p>
            <BlockMath>{String.raw`\frac{d}{d\varAlpha}\left[\varAlpha\left(1 - \frac{L\varAlpha}{2}\right)\right] = 1 - L\varAlpha = 0 \quad \Rightarrow \quad \varAlpha^* = \frac{1}{L}`}</BlockMath>
            <p className="text-sm mt-2">
              <strong>Optimal fixed step size:</strong> <InlineMath>{String.raw`\varAlpha = \frac{1}{L}`}</InlineMath> maximizes guaranteed decrease per step.<Citation citationKey="gd-convex-sublinear-convergence-nesterov-2018" />
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Guarantees</h3>
            <p className="text-sm mb-3">
              Let <InlineMath>{String.raw`\varW^*`}</InlineMath> denote a global minimizer of <InlineMath>{String.raw`f`}</InlineMath> and
              <InlineMath>{String.raw`f^* = f(\varW^*)`}</InlineMath> the optimal function value.
              For <InlineMath>\mu</InlineMath>-strongly convex functions, the minimizer exists and is unique.
              For convex functions, a minimizer exists (possibly non-unique).
            </p>

            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">1. Strongly Convex Functions</p>
              <p className="text-sm mb-2">
                For <InlineMath>\mu</InlineMath>-strongly convex, <InlineMath>L</InlineMath>-smooth functions (which have a unique global minimizer) with optimal step size <InlineMath>{String.raw`\varAlpha = \frac{2}{L+\mu}`}</InlineMath>:
              </p>
              <BlockMath>{String.raw`\|\varW_k - \varW^*\|^2 \leq \left(\frac{L-\mu}{L+\mu}\right)^k \|\varWZero - \varW^*\|^2`}</BlockMath>
              <p className="text-sm mt-2">
                <strong>Linear convergence:</strong> Error decreases by constant factor <InlineMath>{String.raw`\rho = \frac{L-\mu}{L+\mu} < 1`}</InlineMath> each iteration.
                The condition number <InlineMath>{String.raw`Q = L/\mu`}</InlineMath> determines the rate: <InlineMath>{String.raw`\rho = \frac{Q-1}{Q+1}`}</InlineMath>.
                Smaller <InlineMath>Q</InlineMath> (well-conditioned) → faster convergence.<Citation citationKey="gd-strongly-convex-linear-convergence-nesterov-2018" />
              </p>
            </div>

            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">2. Convex Functions</p>
              <p className="text-sm mb-2">
                For convex, <InlineMath>L</InlineMath>-smooth functions with <InlineMath>{String.raw`\varAlpha = \frac{1}{L}`}</InlineMath>:
              </p>
              <BlockMath>{String.raw`f(\varW_k) - f(\varW^*) \leq \frac{L\|\varWZero - \varW^*\|^2}{2(k+1)}`}</BlockMath>
              <p className="text-sm mt-2">
                <strong>Sublinear convergence:</strong> Function value gap decreases as <InlineMath>{String.raw`O(1/k)`}</InlineMath>.
                Slower than strongly convex case, but still guarantees progress.<Citation citationKey="gd-convex-sublinear-convergence-nesterov-2018" />
              </p>
            </div>

            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">3. Non-Convex Functions</p>
              <p className="text-sm mb-2">
                For <InlineMath>L</InlineMath>-smooth (possibly non-convex) functions with a global minimizer <InlineMath>{String.raw`f^*`}</InlineMath> and step size <InlineMath>{String.raw`\varAlpha = \frac{1}{L}`}</InlineMath>:
              </p>
              <BlockMath>{String.raw`\min_{0 \leq j \leq k-1} \|\nabla f(\varW_j)\|^2 \leq \frac{2L(f(\varWZero) - f^*)}{k}`}</BlockMath>
              <p className="text-sm mt-2">
                <strong>Convergence to stationary points:</strong> Gradient norm decreases as <InlineMath>{String.raw`O(1/k)`}</InlineMath>.
                No guarantee of global minimum (may get stuck in local minima or saddle points).
              </p>
              <p className="text-sm mt-2 italic">
                <strong>Proof:</strong> This follows from the descent lemma by telescoping. Summing the descent inequality from <InlineMath>{String.raw`k=0`}</InlineMath> to <InlineMath>{String.raw`K-1`}</InlineMath> gives
                <InlineMath>{String.raw`\sum_{k=0}^{K-1} \frac{1}{2L}\|\nabla f(\varW_k)\|^2 \leq f(\varWZero) - f(\varW_K) \leq f(\varWZero) - f^*`}</InlineMath>.
                By the pigeonhole principle, the minimum gradient norm satisfies the bound above.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">The Role of Condition Number</h3>
            <p className="text-sm mb-2">
              For strongly convex problems, the condition number <InlineMath>{String.raw`Q = L/\mu`}</InlineMath> determines convergence speed:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li><InlineMath>{String.raw`Q = 1`}</InlineMath> (perfectly conditioned): Convergence in one step on quadratics</li>
              <li><InlineMath>{String.raw`Q \ll 1`}</InlineMath> (well-conditioned): Fast linear convergence</li>
              <li><InlineMath>{String.raw`Q \gg 1`}</InlineMath> (ill-conditioned): Slow convergence, requires many iterations</li>
            </ul>
            <p className="text-sm mt-3">
              The convergence factor <InlineMath>{String.raw`\frac{Q-1}{Q+1} \approx 1 - \frac{2}{Q}`}</InlineMath> for large <InlineMath>Q</InlineMath>,
              meaning error decreases by roughly <InlineMath>{String.raw`\frac{2}{Q}`}</InlineMath> per iteration.
              Poor conditioning (<InlineMath>{String.raw`Q = 1000`}</InlineMath>) requires ~500 iterations to reduce error by factor of <InlineMath>e</InlineMath>.
            </p>
          </div>

          <div className="bg-indigo-100 rounded p-4 mt-4">
            <p className="font-bold text-indigo-900 mb-2">Summary</p>
            <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
              <li><InlineMath>L</InlineMath>-smoothness enables step size <InlineMath>{String.raw`\varAlpha < \frac{2}{L}`}</InlineMath> with guaranteed descent</li>
              <li>Optimal fixed step size: <InlineMath>{String.raw`\varAlpha = \frac{1}{L}`}</InlineMath> (or <InlineMath>{String.raw`\frac{2}{L+\mu}`}</InlineMath> for strongly convex)</li>
              <li>Strongly convex → linear convergence at rate <InlineMath>{String.raw`\frac{Q-1}{Q+1}`}</InlineMath></li>
              <li>Convex → sublinear <InlineMath>{String.raw`O(1/k)`}</InlineMath> convergence in function value</li>
              <li>Non-convex → gradient norm converges, but no global minimum guarantee</li>
            </ul>
          </div>

        </div>
      </CollapsibleSection>

      <References usedIn="GdFixedTab" />

    </>
  );
};
