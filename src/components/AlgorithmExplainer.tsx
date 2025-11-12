import { InlineMath, BlockMath } from './Math';
import { CollapsibleSection } from './CollapsibleSection';
import { GlossaryTooltip } from './GlossaryTooltip';
import { Citation } from './Citation';
import { References } from './References';

/**
 * Educational component explaining all available optimization algorithms
 * Displays mathematical formulations, convergence properties, and use cases
 */
export function AlgorithmExplainer() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900">Optimization Algorithms</h2>
      <p className="text-gray-700">
        The visualizer implements 4 different optimization algorithms. Each has different
        computational costs, convergence rates, and suitability for various problem types.
      </p>

      {/* Gradient Descent (Fixed Step) */}
      <CollapsibleSection
        title="Gradient Descent (Fixed Step)"
        defaultExpanded={true}
        storageKey="algorithm-explainer-gd-fixed"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong>{' '}
            <GlossaryTooltip termKey="first-order-method" /> (uses only gradient)
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - \alpha \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>\alpha</InlineMath> is the fixed step size (learning rate)
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Moves in the direction opposite to the gradient
            (steepest descent) by a fixed amount at each iteration.
          </p>

          <p>
            <strong>Convergence rate:</strong>
          </p>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>
              <strong><GlossaryTooltip termKey="strongly-convex" />:</strong> Linear convergence to global minimum
              (requires <GlossaryTooltip termKey="smooth" /> function and step size{' '}
              <InlineMath>0 &lt; \alpha &lt; 2/(L+\mu)</InlineMath>, where <InlineMath>\mu</InlineMath> is the strong convexity parameter).
              Requires <InlineMath>O(\log(1/\varepsilon))</InlineMath> iterations to reach <InlineMath>\varepsilon</InlineMath> accuracy
              <Citation citationKey="gd-strongly-convex-linear-convergence-nesterov-2018" />.
            </li>
            <li>
              <strong><GlossaryTooltip termKey="convex" /> (not strongly convex):</strong> Sublinear convergence
              (requires smooth function and step size <InlineMath>0 &lt; \alpha \leq 1/L</InlineMath>).
              Requires <InlineMath>O(1/\varepsilon)</InlineMath> iterations to reach <InlineMath>\varepsilon</InlineMath> accuracy
              <Citation citationKey="gd-convex-sublinear-convergence-nesterov-2018" />.
            </li>
          </ul>

          <p>
            <strong>Cost per iteration:</strong> One gradient evaluation - very cheap!
          </p>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Simple to implement and understand</li>
              <li>Minimal memory requirements (just current point and gradient)</li>
              <li>Cheap iterations (only gradient computation)</li>
              <li>Works well when step size is tuned properly</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Choosing good step size <InlineMath>\alpha</InlineMath> requires trial and error</li>
              <li>Too large <InlineMath>\alpha</InlineMath> → divergence; too small <InlineMath>\alpha</InlineMath> → slow convergence</li>
              <li>Struggles with ill-conditioned problems (zig-zagging)</li>
              <li>Doesn't adapt to local geometry</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Well-conditioned problems where you know a good step size</li>
              <li>Quick prototyping and learning</li>
              <li>Problems where gradient computation dominates cost</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Gradient Descent (Line Search) */}
      <CollapsibleSection
        title="Gradient Descent (Line Search)"
        defaultExpanded={false}
        storageKey="algorithm-explainer-gd-linesearch"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong>{' '}
            <GlossaryTooltip termKey="first-order-method" /> with adaptive step size
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - \alpha_k \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>\alpha_k</InlineMath> is chosen via backtracking line search
            </p>
          </div>

          <div>
            <p className="font-semibold">Backtracking Line Search (Armijo Rule):</p>
            <BlockMath>
              {String.raw`f(w_k - \alpha_k \nabla f(w_k)) \leq f(w_k) - c \alpha_k \|\nabla f(w_k)\|^2`}
            </BlockMath>
            <p className="text-sm mt-1">
              Start with <InlineMath>\alpha = 1</InlineMath>, multiply by <InlineMath>\beta = 0.5</InlineMath> until condition satisfied
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Same direction as fixed-step GD, but automatically
            finds a good step size at each iteration by testing progressively smaller values.
          </p>

          <p>
            <strong>Convergence rate:</strong> Same as fixed-step gradient descent (linear for{' '}
            <GlossaryTooltip termKey="strongly-convex" />{' '}
            <GlossaryTooltip termKey="smooth" />{' '}
            functions: <InlineMath>O(\log(1/\varepsilon))</InlineMath> iterations)
            <Citation citationKey="gd-linesearch-strongly-convex-linear-convergence-nesterov-2018" />, but with guaranteed descent
            at each step and no need for manual step size tuning.
          </p>

          <p>
            <strong>Cost per iteration:</strong> Multiple function/gradient evaluations
            (typically 3-10) to find step size.
          </p>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>No manual step size tuning required</li>
              <li>Guarantees descent at every iteration</li>
              <li>Adapts to local function behavior</li>
              <li>More robust than fixed step size</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>More function evaluations per iteration (higher cost)</li>
              <li>Still only first-order (doesn't use curvature info)</li>
              <li>Armijo line search finds <strong>a</strong> descent step, not <strong>the best</strong> step - can accept smaller steps than optimal, requiring more iterations overall</li>
              <li>Still struggles with ill-conditioning</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>When you want GD robustness without manual tuning</li>
              <li>Functions with varying curvature (like Rosenbrock)</li>
              <li>Non-convex problems where fixed step might diverge</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Diagonal Preconditioner */}
      <CollapsibleSection
        title="Diagonal Preconditioner"
        defaultExpanded={false}
        storageKey="algorithm-explainer-diagonal-precond"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> First-order method with per-coordinate step sizes
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - D_k \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>D_k</InlineMath> is a diagonal matrix with per-coordinate step sizes
            </p>
          </div>

          <div>
            <p className="font-semibold">Diagonal Preconditioner (using Hessian):</p>
            <BlockMath>
              {String.raw`D = \text{diag}(1/H_{00}, 1/H_{11}, ...)`}
            </BlockMath>
            <p className="text-sm mt-1">
              Extracts diagonal from Hessian <InlineMath>H</InlineMath> and inverts it
            </p>
          </div>

          <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
            <p className="font-semibold">Connection to Adam/RMSprop/AdaGrad:</p>
            <p className="text-sm mt-1">
              Modern adaptive optimizers use diagonal preconditioning! They estimate
              the diagonal from gradient history rather than computing the Hessian:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li>
                <strong>AdaGrad:</strong> <InlineMath>{String.raw`D = \text{diag}(1/\sqrt{\sum g_i^2})`}</InlineMath>
              </li>
              <li>
                <strong>RMSprop:</strong> <InlineMath>{String.raw`D = \text{diag}(1/\sqrt{\text{EMA}(g^2)})`}</InlineMath>
              </li>
              <li>
                <strong>Adam:</strong> RMSprop + momentum
              </li>
            </ul>
            <p className="text-sm mt-2">
              These methods work well because ML feature spaces usually have meaningful
              coordinate axes (pixels, word embeddings, etc.)
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Uses different step sizes for each coordinate
            based on local curvature. Our implementation uses the exact Hessian diagonal
            (pedagogical). In practice, Adam/RMSprop estimate this from gradient history
            without computing Hessians (scalable to millions of parameters).
          </p>

          <p>
            <strong>Convergence rate:</strong> In our experiments, solves axis-aligned quadratic problems in 1-2 iterations
            (becomes equivalent to Newton's method when Hessian is diagonal). Degrades to linear
            convergence on rotated problems where off-diagonal Hessian structure is ignored.
          </p>

          <p>
            <strong>Cost per iteration:</strong>
          </p>
          <ul className="text-sm list-disc ml-5">
            <li><strong>Our implementation:</strong> Gradient + Hessian (same as Newton), no matrix inversion</li>
            <li><strong>Adam/RMSprop:</strong> Just gradient + <InlineMath>O(d)</InlineMath> accumulator updates (very cheap!)</li>
          </ul>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Perfect on axis-aligned problems (1-2 iterations!)</li>
              <li>Adapts step size to each coordinate independently</li>
              <li>No matrix inversion needed (just divide by diagonal)</li>
              <li>Widely used in practice (Adam, RMSprop, AdaGrad)</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li><strong>Coordinate-dependent</strong> - performance varies with rotation</li>
              <li>Ignores off-diagonal Hessian structure</li>
              <li>Struggles on rotated problems (can be <InlineMath>20\times</InlineMath> slower!)</li>
              <li>Requires Hessian computation (expensive) - our pedagogical implementation</li>
              <li>Gradient-based variants (Adam/RMSprop) avoid Hessian but are approximate</li>
            </ul>
            <p className="text-sm mt-2">
              <strong>Why rotation hurts:</strong> Diagonal preconditioner uses <InlineMath>{String.raw`D = \text{diag}(1/H_{00}, 1/H_{11}, ...)`}</InlineMath>,
              which works perfectly when <InlineMath>H</InlineMath> is diagonal. But when rotated, <InlineMath>H</InlineMath> has off-diagonal terms that capture
              coordinate coupling. The optimal inverse <InlineMath>{String.raw`H^{-1}`}</InlineMath> also has off-diagonals, but <InlineMath>D</InlineMath> ignores them.
              This means <InlineMath>D</InlineMath> applies the <strong>wrong scaling</strong> for coupled coordinates.
              Example: At <InlineMath>{String.raw`\theta=45°`}</InlineMath>, diagonal can't correct for coupling between <InlineMath>w_0</InlineMath> and <InlineMath>w_1</InlineMath>, leading to inefficient zigzagging.
            </p>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Problems where coordinates are meaningful</li>
              <li>Axis-aligned or nearly axis-aligned problems</li>
              <li>Understanding why Adam/RMSprop work (and when they don't)</li>
              <li>Seeing the limitations of diagonal approximations</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded p-3 mt-2 border border-purple-200">
            <p className="text-sm font-semibold mb-1">The Rotation Invariance Story:</p>
            <p className="text-sm">
              This algorithm demonstrates the critical limitation of diagonal methods:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
              <li><strong><InlineMath>{String.raw`\theta=0°`}</InlineMath> (aligned):</strong> <InlineMath>H</InlineMath> is diagonal → <InlineMath>{String.raw`D=H^{-1}`}</InlineMath> exactly → 1-2 iterations!</li>
              <li><strong><InlineMath>{String.raw`\theta=45°`}</InlineMath> (rotated):</strong> <InlineMath>H</InlineMath> has off-diagonals → <InlineMath>D</InlineMath> misses them → 40+ iterations</li>
              <li><strong>Newton:</strong> Full <InlineMath>{String.raw`H^{-1}`}</InlineMath> works identically at any angle → 2 iterations always</li>
            </ul>
            <p className="text-sm mt-2 font-semibold">
              Only Newton's full matrix achieves rotation invariance!
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Newton's Method */}
      <CollapsibleSection
        title="Newton's Method"
        defaultExpanded={false}
        storageKey="algorithm-explainer-newton"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong>{' '}
            <GlossaryTooltip termKey="second-order-method" /> (uses Hessian matrix)
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - [H(w_k) + \lambda_{\text{damp}} \cdot I]^{-1} \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>H(w_k)</InlineMath> is the Hessian at <InlineMath>w_k</InlineMath> (matrix of second derivatives),
              <InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath> is a damping parameter for numerical stability,
              and the entire damped matrix is inverted
            </p>
          </div>

          <div>
            <p className="font-semibold">With Variable Step Size:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - \alpha_k (H + \lambda_{\text{damp}} \cdot I)^{-1}(w_k) \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>{String.raw`\alpha_k`}</InlineMath> is chosen via backtracking line search
              for robustness to non-convexity (different from Hessian damping)
            </p>
          </div>

          <div className="mt-3 bg-indigo-50 rounded p-3 border border-indigo-200">
            <p className="font-semibold">Hessian Damping (Levenberg-Marquardt):</p>
            <BlockMath>
              {String.raw`H_{\text{damped}} = H + \lambda_{\text{damp}} \cdot I`}
            </BlockMath>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>
                <strong>What it does:</strong> Adds regularization to the Hessian before inversion,
                making the linear system more numerically stable
              </li>
              <li>
                <strong>Why it helps:</strong> Prevents huge Newton steps when <InlineMath>H</InlineMath> has tiny eigenvalues.
                Example: Perceptron with <InlineMath>{String.raw`\lambda=0.0001`}</InlineMath> → Hessian eigenvalues <InlineMath>{String.raw`\approx 0.0001`}</InlineMath> → direction magnitude <InlineMath>{String.raw`\sim 10{,}000\times`}</InlineMath> gradient!
              </li>
              <li>
                <strong>Connection to Levenberg-Marquardt:</strong> Classical LM is for nonlinear least-squares
                and uses the Gauss-Newton Hessian approximation (<InlineMath>J^T J</InlineMath>) plus damping. Our implementation uses
                the same damping principle but with the full Hessian for general optimization (also called
                "damped Newton" or "regularized Newton"). Both interpolate between Newton's method (<InlineMath>\lambda\to 0</InlineMath>) and
                gradient descent (<InlineMath>\lambda\to\infty</InlineMath>). Note: This is different from trust region methods, which dynamically
                adjust <InlineMath>\lambda</InlineMath> based on a constraint radius.
              </li>
              <li>
                <strong>Trade-offs:</strong> Lower <InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath> = more faithful to the original problem but less stable;
                Higher <InlineMath>{String.raw`\lambda_{\text{damp}}`}</InlineMath> = more stable but adds implicit regularization to your optimization
              </li>
              <li>
                <strong>Spectrum of behavior:</strong> When <InlineMath>{String.raw`\lambda_{\text{damp}} = 0`}</InlineMath>, you get pure Newton's method;
                as <InlineMath>{String.raw`\lambda_{\text{damp}} \to \infty`}</InlineMath>, the method approaches gradient descent (<InlineMath>H</InlineMath> becomes dominated by <InlineMath>{String.raw`\lambda I`}</InlineMath>)
              </li>
            </ul>
          </div>

          <p>
            <strong>How it works:</strong> Uses a quadratic approximation of the function
            to find the step direction. The Hessian captures local curvature, allowing
            the algorithm to take optimal steps.
          </p>

          <p>
            <strong>Convergence rate:</strong>{' '}
            <GlossaryTooltip termKey="quadratic-convergence" /> near a local minimum
            (requires starting close enough to the solution, with{' '}
            <GlossaryTooltip termKey="positive-definite" /> Hessian, and Lipschitz continuous Hessian)
            <Citation citationKey="newton-quadratic-convergence" />.
            Once in the convergence region, doubles the digits of accuracy each iteration.
            Requires <InlineMath>O(\log\log(1/\varepsilon))</InlineMath> iterations.
            Can diverge if started far from the solution or at a saddle point.
          </p>

          <p>
            <strong>Cost per iteration:</strong> Gradient + Hessian computation + solving
            linear system (expensive for high dimensions).
          </p>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Quadratic convergence - extremely fast near solution</li>
              <li>Invariant to linear transformations (handles ill-conditioning)</li>
              <li>Converges in one step on strictly convex quadratic functions (with <InlineMath>{String.raw`\alpha=1`}</InlineMath>, <InlineMath>{String.raw`\lambda_{\text{damp}}=0`}</InlineMath>, where the Hessian is constant)</li>
              <li>Uses full curvature information</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Requires Hessian computation (expensive in high dimensions)</li>
              <li>Requires solving linear system (<InlineMath>O(d^3)</InlineMath> for dense matrices; can be <InlineMath>O(d)</InlineMath> to <InlineMath>O(d^2)</InlineMath> for sparse/structured problems)</li>
              <li>Can diverge on non-convex problems without line search</li>
              <li>Full Newton not suitable for very large-scale problems, but variants exist (truncated Newton, Newton-CG use iterative solvers)</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Small to medium dimension problems where Hessian computation is feasible</li>
              <li>When you need high accuracy quickly</li>
              <li>Ill-conditioned problems where GD struggles</li>
              <li>When Hessian is available or cheap to compute</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* L-BFGS */}
      <CollapsibleSection
        title="L-BFGS (Limited-memory BFGS)"
        defaultExpanded={false}
        storageKey="algorithm-explainer-lbfgs"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong>{' '}
            <GlossaryTooltip termKey="first-order-method" /> (approximates second-order behavior)
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - \alpha_k H_k^{-1} \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>{String.raw`H_k^{-1}`}</InlineMath> is implicitly approximated using the last <InlineMath>M</InlineMath> gradient differences
            </p>
          </div>

          <div>
            <p className="font-semibold">Key Idea:</p>
            <p className="text-sm">
              Store the last <InlineMath>M</InlineMath> pairs of <InlineMath>(s_k, y_k)</InlineMath> where:
            </p>
            <BlockMath>
              {String.raw`s_k = w_{k+1} - w_k, \quad y_k = \nabla f(w_{k+1}) - \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              Use two-loop recursion to compute <InlineMath>{String.raw`H_k^{-1} \nabla f(w_k)`}</InlineMath> without forming the matrix
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Builds an approximation of the inverse Hessian by
            observing how gradients change. Maintains only recent history (M steps) to save memory.
          </p>

          <p>
            <strong>Convergence rate:</strong> <GlossaryTooltip termKey="linear-convergence" /> on{' '}
            <GlossaryTooltip termKey="strongly-convex" />{' '}
            <GlossaryTooltip termKey="smooth" /> functions
            <Citation citationKey="lbfgs-linear-convergence-liu-nocedal-1989" />.
            The memory parameter <InlineMath>M</InlineMath> affects the convergence constant but not the convergence order.
            Note: Full BFGS can achieve <GlossaryTooltip termKey="superlinear-convergence" />, but L-BFGS is limited to linear convergence
            due to limited memory.
          </p>

          <p>
            <strong>Cost per iteration:</strong> One gradient + <InlineMath>O(Md)</InlineMath> operations for
            Hessian approximation (where <InlineMath>M</InlineMath> is the memory size).
          </p>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Linear convergence (proven) without computing Hessian</li>
              <li>Low memory: <InlineMath>O(Md)</InlineMath> vs <InlineMath>O(d^2)</InlineMath> for full Newton or full BFGS</li>
              <li>No manual tuning (works well with defaults)</li>
              <li>Excellent for large-scale optimization</li>
              <li>Industry standard for many ML problems</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>More complex implementation than GD</li>
              <li>Needs <InlineMath>M</InlineMath> gradient pairs in memory</li>
              <li>Can struggle if gradients are noisy</li>
              <li>Approximation quality depends on <InlineMath>M</InlineMath></li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Large-scale smooth optimization</li>
              <li>When you want Newton-like performance without Hessian cost</li>
              <li>Most machine learning training tasks</li>
              <li>Production optimization systems</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Comparison Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Quick Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Algorithm</th>
                <th className="text-left py-2">Conv. Rate</th>
                <th className="text-left py-2">Cost/Iter</th>
                <th className="text-left py-2">Best For</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium">GD Fixed</td>
                <td className="py-2">Linear</td>
                <td className="py-2">Low (1 gradient)</td>
                <td className="py-2">Simple, well-conditioned problems</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium">GD Line Search</td>
                <td className="py-2">Linear</td>
                <td className="py-2">Medium (3-10 evals)</td>
                <td className="py-2">Robust GD, varying curvature</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium">Diag. Precond</td>
                <td className="py-2">Quadratic*</td>
                <td className="py-2">High (grad + Hessian)</td>
                <td className="py-2">Axis-aligned problems, understanding Adam</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium">Newton</td>
                <td className="py-2">Quadratic</td>
                <td className="py-2">High (Hessian + solve)</td>
                <td className="py-2">Small-scale, high accuracy</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">L-BFGS</td>
                <td className="py-2">Linear*</td>
                <td className="py-2">Low-Med (1 grad + <InlineMath>O(Md)</InlineMath>)</td>
                <td className="py-2">Large-scale, production ML</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          *Diagonal: Quadratic convergence only on axis-aligned problems<br />
          *L-BFGS: Proven linear convergence (full BFGS can achieve superlinear, but L-BFGS cannot due to limited memory)
        </p>
      </div>

      {/* How to Use */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 className="font-semibold text-gray-900 mb-2">Exploring the Algorithms</h3>
        <p className="text-sm text-gray-700 mb-3">
          Click any algorithm tab above to see its controls and run it on the current problem.
          Use the experiment presets to see interesting behaviors, or tweak parameters yourself.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900">For learning:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Start with GD Fixed on Quadratic Bowl</li>
              <li>Add Line Search to see adaptive step sizes</li>
              <li>Try Diagonal Precond to see per-coordinate adaptation</li>
              <li>See Newton's rotation invariance on Rotated Quadratic</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">The rotation story:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Diagonal Precond tab: Run at <InlineMath>\theta=0°</InlineMath> then <InlineMath>\theta=45°</InlineMath></li>
              <li>Watch convergence degrade dramatically</li>
              <li>Compare with Newton tab: identical at all angles</li>
              <li>Understand why Adam works (meaningful axes)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* References */}
      <References usedIn="AlgorithmExplainer" defaultExpanded={false} storageKey="algorithm-explainer-references" />
    </div>
  );
}
