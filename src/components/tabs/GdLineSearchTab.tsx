import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { AlgorithmConfiguration } from '../AlgorithmConfiguration';
import { IterationMetrics } from '../IterationMetrics';
import { InlineMath, BlockMath } from '../Math';
import { GlossaryTooltip } from '../GlossaryTooltip';
import { Citation } from '../Citation';
import { References } from '../References';
import { resolveProblem, requiresDataset } from '../../problems/registry';
import { getExperimentsForAlgorithm } from '../../experiments';
import { ExperimentCardList } from '../ExperimentCardList';
import { Pseudocode, Complexity } from '../Pseudocode';
import { ArmijoLineSearch } from '../ArmijoLineSearch';
import { ParamSweep } from '../ParamSweep';
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

  // Memoize param sweep config to prevent re-computation on currentIter changes
  const paramSweepConfig = React.useMemo(
    () => ({
      baseParams: {
        maxIter,
        tolerance: gdLSTolerance,
        initialPoint: [initialW0, initialW1] as [number, number]
      },
      paramValues: Array.from({ length: 10 }, (_, i) =>
        Math.pow(10, -5 + (i / 9) * 5)  // Range from 10^-5 to 10^0 (1)
      )
    }),
    [maxIter, gdLSTolerance, initialW0, initialW1]
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

      {/* c₁ Parameter Sweep */}
      {iterations.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            How c₁ Affects Convergence
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Running the algorithm 10 times with different c₁ values on your current problem
            from initial point [{initialW0.toFixed(2)}, {initialW1.toFixed(2)}].
          </p>
          <ParamSweep
            algorithm="gd-linesearch"
            problemFuncs={problemFuncs}
            baseParams={paramSweepConfig.baseParams}
            paramName="c1"
            paramDisplayName="c₁"
            paramValues={paramSweepConfig.paramValues}
            paramFormatter={(v) => v.toExponential(1)}
            showLineSearchTrials={true}
          />
        </div>
      )}

      {/* Quick Start */}
      <CollapsibleSection
        title="Quick Start"
        defaultExpanded={true}
        storageKey="gd-ls-quick-start"
        id="quick-start"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-teal-800 mb-2">What Is It?</h3>
            <p>
              Gradient descent with <strong>automatic step size selection</strong>. Instead of
              picking a fixed <InlineMath>\varAlpha</InlineMath>, the algorithm searches for
              a good step size at each iteration.
            </p>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <p className="font-semibold text-amber-900 mb-2">
              🎯 Key Advantage: No Manual Tuning
            </p>
            <p className="text-sm text-amber-800">
              Line search automatically adapts to problem scaling, curvature changes,
              and different regions of parameter space. You get robust convergence
              without tweaking <InlineMath>\varAlpha</InlineMath>.
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
                <span className="ml-4">Compute gradient <InlineMath>\varGrad = \nabla f(\varW)</InlineMath> <Complexity explanation="Problem-dependent">1 ∇f eval</Complexity></span>
              </>,
              <>
                <span className="ml-4">Set direction <InlineMath>\varP \leftarrow -\varGrad</InlineMath> <Complexity>O(d)</Complexity></span>
              </>,
              <>
                <span className="ml-4"><strong>Line search:</strong> find <InlineMath>\varAlpha</InlineMath> that decreases loss sufficiently <Complexity explanation="Backtracking">2-5 f evals</Complexity></span>
              </>,
              <>
                <span className="ml-4">Update <InlineMath>\varW \leftarrow \varW + \varAlpha \varP</InlineMath> <Complexity>O(d)</Complexity></span>
              </>,
              <><strong>return</strong> <InlineMath>\varW</InlineMath></>
            ]}
          />

          <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
            <p className="font-semibold mb-1">What to Try</p>
            <p>
              See the <strong>"Try This"</strong> section below for experiments showing
              how line search adapts. For details on how it works, see{' '}
              <strong>"How Line Search Works"</strong>.
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

      {/* How Line Search Works */}
      <CollapsibleSection
        title="How Line Search Works"
        defaultExpanded={false}
        storageKey="gd-ls-how-line-search-works"
        id="how-line-search-works"
      >
        <div className="space-y-4 text-gray-800">
          <div>
            <h3 className="text-lg font-bold text-teal-800 mb-2">The Problem: Fixed Step Size Fails</h3>
            <p className="mb-2">
              With fixed <InlineMath>\varAlpha</InlineMath>, gradient descent struggles on problems
              with varying curvature. See the GD-Fixed tab for details on these issues.
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Steep regions:</strong> Large <InlineMath>\varAlpha</InlineMath> overshoots, causes divergence</li>
              <li><strong>Flat regions:</strong> Small <InlineMath>\varAlpha</InlineMath> wastes iterations, slow progress</li>
              <li><strong>Varying curvature:</strong> No single <InlineMath>\varAlpha</InlineMath> works well everywhere</li>
            </ul>
            <p className="text-sm mt-2">
              <strong>Solution:</strong> Search for a good <InlineMath>\varAlpha</InlineMath> at each iteration,
              adapting to local properties.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-teal-800 mb-2">Armijo Backtracking Algorithm</h3>
            <ArmijoLineSearch
              color="teal"
              initialAlpha="1 (or previous iteration's value)"
              typicalFEvals="2-5"
              c1Value={gdLSC1}
              verdict={{
                title: "Excellent tradeoff",
                description: "The extra f-evals per iteration are offset by fewer total iterations. Plus, you avoid manual α tuning for each problem."
              }}
              benefits={[
                'Fewer total iterations: Good steps enable faster convergence',
                'Robustness: Works across problems without knowing L or tuning α',
                'Automatic adaptation: Large steps when safe, small steps near minima'
              ]}
              additionalNotes={null}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-teal-800 mb-2">The Armijo Parameter c₁</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="font-semibold text-blue-900 mb-2">
                Theory: Any c₁ ∈ (0,1) Works
              </p>
              <p className="text-sm text-blue-800 mb-2">
                The Armijo backtracking algorithm terminates in finite steps for <strong>any</strong> choice
                of <InlineMath>{String.raw`c_1 \in (0,1)`}</InlineMath>.<Citation citationKey="armijo-backtracking-termination-nocedal-wright-2006" /> The convergence
                rate guarantees (O(1/k) for convex, linear for strongly convex) hold for any c₁ in this range.
              </p>
              <p className="text-sm text-blue-800 mb-2">
                The choice of c₁ affects the <strong>constant</strong> in the convergence bound but not the asymptotic
                rate. Smaller c₁ is less strict, accepting steps more easily during backtracking. Larger c₁ is more demanding,
                requiring greater actual decrease.
              </p>
              <p className="text-sm text-blue-800 mt-3">
                <strong>Practice:</strong> The value c₁ = 10⁻⁴ is widely used based on empirical experience,
                not theoretical optimization.<Citation citationKey="armijo-backtracking-termination-nocedal-wright-2006" /> See
                the <strong>"How c₁ Affects Convergence"</strong> visualization above to explore how different c₁ values
                perform on the current problem.
              </p>
            </div>
          </div>

          <div className="bg-indigo-100 rounded p-4 mt-4">
            <p className="font-bold text-indigo-900 mb-2">Key Takeaways</p>
            <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
              <li>Line search makes gradient descent robust across problems with different scales and curvature</li>
              <li>Armijo backtracking is simple: start with α=1, shrink until sufficient decrease is achieved</li>
              <li>Cost: 2-5 f-evals per iteration, but fewer total iterations make up for it</li>
              <li>No need to know L or manually tune step size</li>
              <li>Still limited by gradient descent's first-order nature (zig-zagging on ill-conditioned problems)</li>
            </ul>
          </div>
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
                  ✓ Costs more per iteration (multiple function evaluations)<br />
                  ✓ For very cheap functions, fixed step may be faster overall<br />
                  ✓ Tradeoff: fewer iterations vs cost per iteration
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Line search guarantees fast convergence"</p>
                <p className="text-sm ml-6">
                  ✓ Still subject to problem conditioning<br />
                  ✓ Gradient descent is fundamentally <GlossaryTooltip termKey="first-order-method" /> (doesn't use curvature)<br />
                  ✓ Newton or L-BFGS will be faster on well-conditioned problems
                </p>
              </div>

              <div>
                <p className="font-semibold">❌ "Armijo line search prevents all failures"</p>
                <p className="text-sm ml-6">
                  ✓ Armijo doesn't prevent arbitrarily small steps theoretically<br />
                  ✓ Wolfe conditions (Armijo + curvature) have better guarantees<br />
                  ✓ In practice, Armijo backtracking works well for gradient descent
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-800 mb-2">Convergence Guarantees</h3>
            <p className="text-sm mb-2">
              Line search achieves the same convergence <em>rates</em> as fixed step size
              (see Mathematical Derivations), but with automatically optimized constants:
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <strong><GlossaryTooltip termKey="strongly-convex" />:</strong> <GlossaryTooltip termKey="linear-convergence" />
              </li>
              <li>
                <strong><GlossaryTooltip termKey="convex" />:</strong> <GlossaryTooltip termKey="sublinear-convergence" /> (O(1/k))
              </li>
              <li>
                <strong>Non-convex:</strong> Gradient norm convergence, no global minimum guarantee
              </li>
            </ul>
            <p className="text-xs mt-2 text-gray-600 italic">
              See GD-Fixed tab for detailed convergence theory with fixed step sizes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Troubleshooting</h3>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              <li>
                <strong>Many backtracking steps:</strong> Problem may be poorly scaled or
                gradient computation may be incorrect
              </li>
              <li>
                <strong>Slow progress:</strong> Problem is ill-conditioned. Consider
                preconditioning or second-order methods (Newton, L-BFGS)
              </li>
              <li>
                <strong>Expensive iterations:</strong> Function evaluations are costly.
                Consider methods that reuse gradient information (L-BFGS)
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

          <p className="text-sm italic text-gray-600">
            <strong>Note:</strong> For the fundamental descent lemma and fixed step size convergence
            theory, see the <strong>GD-Fixed tab</strong>. This section focuses on how line search
            affects convergence analysis.
          </p>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">The Armijo Condition</h3>
            <p className="text-sm mb-2">
              The Armijo condition ensures <strong>sufficient decrease</strong> at each step:<Citation citationKey="armijo-backtracking-termination-nocedal-wright-2006" />
            </p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) \leq f(\varW) + c_1 \varAlpha \varGrad^T \varP`}
            </BlockMath>
            <p className="text-sm mt-2">
              where <InlineMath>{String.raw`c_1 \in (0,1)`}</InlineMath>.
              For descent direction <InlineMath>\varP = -\varGrad</InlineMath>, we have
              <InlineMath>{String.raw`\varGrad^T \varP = -\|\varGrad\|^2 < 0`}</InlineMath>.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Why Backtracking Terminates</h3>
            <p className="text-sm mb-2">
              For <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> functions,
              backtracking with geometric step reduction <InlineMath>{String.raw`\varAlpha \leftarrow \rho\varAlpha`}</InlineMath> (where
              <InlineMath>{String.raw`\rho \in (0,1)`}</InlineMath>) terminates in finite steps:<Citation citationKey="armijo-backtracking-termination-nocedal-wright-2006" />
            </p>
            <p className="text-sm mb-2">
              <strong>Proof sketch:</strong> By Taylor expansion:
            </p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) = f(\varW) + \varAlpha \varGrad^T \varP + O(\varAlpha^2)`}
            </BlockMath>
            <p className="text-sm mt-2">
              For sufficiently small <InlineMath>\varAlpha</InlineMath>, the quadratic term is negligible:
            </p>
            <BlockMath>
              {String.raw`f(\varW + \varAlpha \varP) \approx f(\varW) + \varAlpha \varGrad^T \varP < f(\varW) + c_1 \varAlpha \varGrad^T \varP`}
            </BlockMath>
            <p className="text-sm mt-2">
              Since <InlineMath>{String.raw`c_1 < 1`}</InlineMath> and <InlineMath>{String.raw`\varGrad^T \varP < 0`}</InlineMath> (descent direction),
              the Armijo condition is eventually satisfied. This guarantees finite termination.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-indigo-800 mb-2">Convergence with Line Search</h3>

            <p className="text-sm mb-3">
              Let <InlineMath>\varW^*</InlineMath> denote a global minimizer of
              <InlineMath>f</InlineMath> and <InlineMath>{String.raw`f^* = f(\varW^*)`}</InlineMath>
              the optimal function value. The existence and uniqueness of <InlineMath>\varW^*</InlineMath>
              depends on the function class (as in GD-Fixed).
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
              <p className="font-semibold text-blue-900 mb-2">💡 Key Insight</p>
              <p className="text-sm text-blue-800">
                Line search achieves the same convergence <em>rates</em> as optimal fixed
                step sizes, but <strong>automatically</strong> adapts to achieve near-optimal
                constants without knowing <InlineMath>L</InlineMath> or <InlineMath>\mu</InlineMath>.
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-sm mb-2">Strongly Convex Functions</p>
              <p className="text-sm mb-2">
                For <InlineMath>\mu</InlineMath>-<GlossaryTooltip termKey="strongly-convex" />, <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> functions
                with Armijo line search, gradient descent achieves <GlossaryTooltip termKey="linear-convergence" />:<Citation citationKey="gd-linesearch-strongly-convex-linear-convergence-nesterov-2018" />
              </p>
              <BlockMath>
                {String.raw`\|\varW_k - \varW^*\| \leq C\left(1 - \frac{2\mu}{L+3\mu}\right)^k`}
              </BlockMath>
              <p className="text-sm mt-2">
                The convergence rate depends on the condition number <InlineMath>{String.raw`Q = L/\mu`}</InlineMath>.
                Line search automatically achieves near-optimal step sizes without knowing <InlineMath>L</InlineMath> or <InlineMath>\mu</InlineMath>.
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-sm mb-2">Convex Functions</p>
              <p className="text-sm mb-2">
                For <GlossaryTooltip termKey="convex" />, <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> functions
                with Armijo line search:<Citation citationKey="gd-linesearch-convex-sublinear-convergence-nesterov-2018" />
              </p>
              <BlockMath>
                {String.raw`f(\varW_k) - f^* \leq O\left(\frac{L\|\varWZero - \varW^*\|^2}{k}\right)`}
              </BlockMath>
              <p className="text-sm mt-2">
                <strong><GlossaryTooltip termKey="sublinear-convergence" />:</strong> Same <InlineMath>O(1/k)</InlineMath> rate
                as optimal fixed step size (<InlineMath>{String.raw`\varAlpha = 1/L`}</InlineMath>), but line search
                achieves this automatically without knowing <InlineMath>L</InlineMath>.
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-sm mb-2">Non-Convex Functions</p>
              <p className="text-sm mb-2">
                For <InlineMath>L</InlineMath>-<GlossaryTooltip termKey="smooth" /> (possibly non-convex) functions,
                line search guarantees gradient norm convergence but not global minimum.
                See GD-Fixed tab for detailed non-convex convergence analysis.
              </p>
            </div>
          </div>

          <div className="bg-indigo-100 rounded p-4 mt-4">
            <p className="font-bold text-indigo-900 mb-2">Summary</p>
            <ul className="text-sm list-disc ml-6 space-y-1 text-indigo-900">
              <li>Armijo condition ensures sufficient decrease; backtracking terminates in finite steps</li>
              <li>Line search achieves same <em>rates</em> as optimal fixed step sizes</li>
              <li>Strongly convex → linear convergence, rate depends on Q = L/μ</li>
              <li>Convex → sublinear O(1/k) convergence</li>
              <li>Key advantage: automatic adaptation without knowing L or μ</li>
            </ul>
          </div>

        </div>
      </CollapsibleSection>

      <References usedIn="GdLineSearchTab" />

    </>
  );
};
