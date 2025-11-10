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
import type { GDIteration } from '../../algorithms/gradient-descent';
import type { ExperimentPreset } from '../../types/experiments';

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
  summary: AlgorithmSummary | null;
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem: string;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  biasSlice: number;
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
  onResetIter,
  summary,
  problemFuncs,
  problem: problemDefinition,
  currentProblem,
  bounds,
  biasSlice,
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
    <CollapsibleSection title="Algorithm Configuration" defaultExpanded={true}>
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

        <canvas
          ref={paramCanvasRef}
          style={{width: '100%', height: '500px'}}
          className="border border-gray-300 rounded"
        />

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
            summary={summary}
            onIterationChange={onIterChange}
          />
        </div>
      )}
    </div>

    <CollapsibleSection
      title="Quick Start"
      defaultExpanded={false}
      storageKey="gd-fixed-quick-start"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-green-800 mb-2">The Core Idea</h3>
          <p>
            Follow the <strong>gradient downhill</strong>. The gradient{' '}
            <InlineMath>\nabla f(w)</InlineMath> points in the direction of steepest
            increase, so <InlineMath>-\nabla f(w)</InlineMath> points toward steepest
            decrease.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-green-800 mb-2">The Algorithm</h3>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Compute gradient <InlineMath>\nabla f(w)</InlineMath></li>
            <li>Scale by step size <InlineMath>\alpha</InlineMath></li>
            <li>Update <InlineMath>w \leftarrow w - \alpha \nabla f(w)</InlineMath></li>
            <li>Repeat until convergence</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-bold text-green-800 mb-2">Key Formula</h3>
          <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k)'}</BlockMath>
          <p className="text-sm mt-2">
            where <InlineMath>\alpha</InlineMath> (alpha) is the <strong>learning rate</strong>
            or step size.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-green-800 mb-2">When to Use</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Simple baseline for any differentiable function</li>
            <li>Educational purposes (understanding optimization)</li>
            <li>When computational cost per iteration must be minimal</li>
            <li>Problems where you can tune <InlineMath>\alpha</InlineMath> effectively</li>
          </ul>
        </div>

        <div className="bg-green-100 rounded p-3">
          <p className="font-bold text-sm">Key Challenge:</p>
          <p className="text-sm">
            Choosing <InlineMath>\alpha</InlineMath> is critical. Too large → divergence.
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
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Common Misconceptions</h3>

          <div className="space-y-3">
            <div>
              <p className="font-semibold">❌ "The gradient points to the minimum"</p>
              <p className="text-sm ml-6">
                ✓ The gradient points toward steepest <strong>increase</strong><br/>
                ✓ We follow <InlineMath>-\nabla f</InlineMath> (negative gradient) downhill<br/>
                ✓ This is the direction of steepest <strong>decrease</strong>, not necessarily toward minimum
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "Gradient descent always converges"</p>
              <p className="text-sm ml-6">
                ✓ Only with proper step size <InlineMath>\alpha</InlineMath><br/>
                ✓ Can diverge if <InlineMath>\alpha</InlineMath> too large<br/>
                ✓ Can get stuck in local minima on non-convex functions
              </p>
            </div>

            <div>
              <p className="font-semibold">❌ "Just pick <InlineMath>\alpha=0.01</InlineMath> and it'll work"</p>
              <p className="text-sm ml-6">
                ✓ Optimal <InlineMath>\alpha</InlineMath> depends on problem scaling and coordinate choice<br/>
                ✓ Fixed step size treats all coordinates equally: rescale one variable (meters→kilometers) and <InlineMath>\alpha</InlineMath> becomes 1000× too large/small for that direction<br/>
                ✓ Line search methods (next tab) solve this automatically
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-orange-800 mb-2">Role of Convexity</h3>
          <ul className="space-y-2">
            <li>
              <strong>Strongly convex:</strong> Linear convergence to global minimum
              (guaranteed with proper <InlineMath>\alpha</InlineMath>)
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
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Choosing Step Size <InlineMath>\alpha</InlineMath></h3>
          <div className="space-y-2 text-sm">
            <p><strong>Rule of thumb:</strong></p>
            <BlockMath>{'0 < \\alpha < \\frac{2}{L}'}</BlockMath>
            <p>
              where L is the Lipschitz constant of <InlineMath>\nabla f</InlineMath> (smoothness).
            </p>
            <p className="mt-2">
              <strong>Practical approach:</strong> Try <InlineMath>\alpha = 0.1</InlineMath>,
              then adjust based on behavior (increase if too slow, decrease if diverging).
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
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Gradient Descent Update Rule</h3>
          <p>The basic update is simple:</p>
          <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k)'}</BlockMath>
          <p className="text-sm mt-2">
            Where <InlineMath>{`\\alpha > 0`}</InlineMath> is the step size (learning rate).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Why This Works</h3>
          <p>By Taylor expansion around <InlineMath>w_k</InlineMath>:</p>
          <BlockMath>{'f(w_{k+1}) \\approx f(w_k) + \\nabla f(w_k)^T (w_{k+1} - w_k)'}</BlockMath>
          <p className="text-sm mt-2">
            Substituting the update rule:
          </p>
          <BlockMath>{`f(w_{k+1}) \\approx f(w_k) - \\alpha \\|\\nabla f(w_k)\\|^2`}</BlockMath>
          <p className="text-sm mt-2">
            Since <InlineMath>\|\nabla f(w_k)\|^2 \geq 0</InlineMath>, the loss decreases
            (for small enough <InlineMath>\alpha</InlineMath>).
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence Rate</h3>
          <p><strong>For strongly convex functions:</strong></p>
          <BlockMath>{'\\|w_k - w^*\\| \\leq (1 - \\mu/L)^k \\|w_0 - w^*\\|'}</BlockMath>
          <p className="text-sm mt-2">
            Where <InlineMath>\mu</InlineMath> is strong convexity parameter and{' '}
            <InlineMath>L</InlineMath> is smoothness (Lipschitz constant of gradient).
          </p>
          <p className="text-sm mt-2">
            <strong>Linear convergence:</strong> Error decreases by constant factor each iteration.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">Step Size Selection</h3>
          <p><strong>Sufficient condition for decrease:</strong></p>
          <BlockMath>{'\\alpha < \\frac{2}{L}'}</BlockMath>
          <p className="text-sm mt-2">
            Where <InlineMath>L</InlineMath> satisfies:
          </p>
          <BlockMath>{'\\|\\nabla f(x) - \\nabla f(y)\\| \\leq L\\|x - y\\|'}</BlockMath>
          <p className="text-sm mt-2">
            (Lipschitz continuity of gradient)
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-800 mb-2">For Logistic Regression</h3>
          <p><strong>Loss function:</strong></p>
          <BlockMath>{`f(w) = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[y_i \\log(\\sigma(w^T x_i)) + (1-y_i) \\log(1-\\sigma(w^T x_i))\\right] + \\frac{\\lambda}{2}\\|w\\|^2`}</BlockMath>
          <p className="text-sm mt-2"><strong>Gradient:</strong></p>
          <BlockMath>{`\\nabla f(w) = \\frac{1}{N} \\sum_{i=1}^{N} (\\sigma(w^T x_i) - y_i) x_i + \\lambda w`}</BlockMath>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection
      title="Advanced Topics"
      defaultExpanded={false}
      storageKey="gd-fixed-advanced"
    >
      <div className="space-y-4 text-gray-800">
        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Momentum Methods</h3>
          <p>Add momentum to accelerate convergence:</p>
          <BlockMath>{'v_{k+1} = \\beta v_k - \\alpha \\nabla f(w_k)'}</BlockMath>
          <BlockMath>{'w_{k+1} = w_k + v_{k+1}'}</BlockMath>
          <p className="text-sm mt-2">
            Typical <InlineMath>\beta = 0.9</InlineMath>. Momentum accumulates
            velocity in consistent directions, damping oscillations.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Nesterov Acceleration</h3>
          <p>"Look ahead" before computing gradient:</p>
          <BlockMath>{'w_{k+1} = w_k - \\alpha \\nabla f(w_k + \\beta v_k) + \\beta v_k'}</BlockMath>
          <p className="text-sm mt-2">
            Provably optimal convergence rate for smooth convex functions.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Adaptive Methods Preview</h3>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>
              <strong>AdaGrad:</strong> Adapts learning rate per parameter based on
              historical gradients
            </li>
            <li>
              <strong>RMSprop:</strong> Uses moving average of squared gradients
            </li>
            <li>
              <strong>Adam:</strong> Combines momentum and adaptive learning rates
              (most popular in deep learning)
            </li>
          </ul>
          <p className="text-sm mt-2">
            These methods automatically tune step sizes, reducing manual tuning burden.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">Computational Complexity</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Per iteration:</strong> O(n) for gradient computation</li>
            <li><strong>Memory:</strong> O(n) to store parameters</li>
            <li><strong>Total cost:</strong> depends on # iterations to converge</li>
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
