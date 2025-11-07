import { InlineMath, BlockMath } from './Math';
import { CollapsibleSection } from './CollapsibleSection';

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
            <strong>Type:</strong> First-order method (uses only gradient)
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
            <strong>Convergence rate:</strong> Linear convergence for strongly convex functions.
            Requires O(1/ε) iterations to reach ε accuracy.
          </p>

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
              <li>Choosing good step size α requires trial and error</li>
              <li>Too large α → divergence; too small α → slow convergence</li>
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
            <strong>Type:</strong> First-order method with adaptive step size
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
              Start with α = 1, multiply by β = 0.5 until condition satisfied
            </p>
          </div>

          <p>
            <strong>How it works:</strong> Same direction as fixed-step GD, but automatically
            finds a good step size at each iteration by testing progressively smaller values.
          </p>

          <p>
            <strong>Convergence rate:</strong> Linear convergence (same as fixed step), but
            with guaranteed descent at each step.
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
              <li>Can be conservative with step sizes</li>
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

      {/* Newton's Method */}
      <CollapsibleSection
        title="Newton's Method"
        defaultExpanded={false}
        storageKey="algorithm-explainer-newton"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Second-order method (uses gradient and Hessian)
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - (H + \lambda_{\text{damp}} \cdot I)^{-1}(w_k) \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>H(w)</InlineMath> is the Hessian (matrix of second derivatives)
            </p>
            <p className="text-sm mt-1">
              (with <InlineMath>{String.raw`\lambda_{\text{damp}} = 0.01`}</InlineMath> by default for numerical stability)
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
                <strong>Why it helps:</strong> Prevents huge Newton steps when H has tiny eigenvalues.
                Example: Perceptron with λ=0.0001 → Hessian eigenvalues ≈ 0.0001 → direction magnitude ~10,000× gradient!
              </li>
              <li>
                <strong>Connection to Levenberg-Marquardt:</strong> This is the core technique from the
                Levenberg-Marquardt algorithm, which interpolates between Newton's method and gradient descent
              </li>
              <li>
                <strong>Trade-offs:</strong> Lower λ_damp = more faithful to the original problem but less stable;
                Higher λ_damp = more stable but adds implicit regularization to your optimization
              </li>
              <li>
                <strong>Spectrum of behavior:</strong> When λ_damp = 0, you get pure Newton's method;
                as λ_damp → ∞, the method approaches gradient descent (H becomes dominated by λI)
              </li>
            </ul>
          </div>

          <p>
            <strong>How it works:</strong> Uses a quadratic approximation of the function
            to find the step direction. The Hessian captures local curvature, allowing
            the algorithm to take optimal steps.
          </p>

          <p>
            <strong>Convergence rate:</strong> Quadratic convergence near the minimum!
            Once close, doubles the digits of accuracy each iteration.
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
              <li>For quadratic functions, finds optimum in 1 step!</li>
              <li>Uses full curvature information</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Requires Hessian computation (expensive in high dimensions)</li>
              <li>Requires solving linear system (O(n³) cost)</li>
              <li>Can diverge on non-convex problems without line search</li>
              <li>Not suitable for large-scale problems (memory + computation)</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Small to medium dimension problems (n &lt; 1000)</li>
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
            <strong>Type:</strong> Quasi-Newton method (approximates Hessian from gradients)
          </p>

          <div>
            <p className="font-semibold">Update Rule:</p>
            <BlockMath>
              {String.raw`w_{k+1} = w_k - \alpha_k H_k^{-1} \nabla f(w_k)`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>{String.raw`H_k^{-1}`}</InlineMath> is implicitly approximated using the last M gradient differences
            </p>
          </div>

          <div>
            <p className="font-semibold">Key Idea:</p>
            <p className="text-sm">
              Store the last M pairs of <InlineMath>(s_k, y_k)</InlineMath> where:
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
            <strong>Convergence rate:</strong> Superlinear convergence - faster than linear,
            slower than quadratic. Excellent practical performance.
          </p>

          <p>
            <strong>Cost per iteration:</strong> One gradient + O(Mn) operations for
            Hessian approximation. Typically M=5-20.
          </p>

          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Strengths:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Superlinear convergence without computing Hessian</li>
              <li>Low memory: O(Mn) vs O(n²) for full Newton</li>
              <li>No manual tuning (works well with defaults)</li>
              <li>Excellent for large-scale optimization</li>
              <li>Industry standard for many ML problems</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Weaknesses:</p>
            <ul className="text-sm list-disc ml-5">
              <li>More complex implementation than GD</li>
              <li>Needs M gradient pairs in memory</li>
              <li>Can struggle if gradients are noisy</li>
              <li>Approximation quality depends on M</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Best for:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Large-scale smooth optimization (n &gt; 1000)</li>
              <li>When you want Newton-like performance without Hessian cost</li>
              <li>Most machine learning training tasks</li>
              <li>Production optimization systems</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded p-3 mt-2">
            <p className="text-sm font-semibold mb-1">Memory parameter M:</p>
            <ul className="text-sm list-disc ml-5">
              <li><strong>M=3-5:</strong> minimal memory, acceptable for well-conditioned problems</li>
              <li><strong>M=5-10:</strong> good balance for most problems (recommended)</li>
              <li><strong>M=10-20:</strong> better approximation, higher cost</li>
              <li><strong>M&gt;50:</strong> rarely beneficial, diminishing returns</li>
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
                <td className="py-2 font-medium">Newton</td>
                <td className="py-2">Quadratic</td>
                <td className="py-2">High (Hessian + solve)</td>
                <td className="py-2">Small-scale, high accuracy</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">L-BFGS</td>
                <td className="py-2">Superlinear</td>
                <td className="py-2">Low-Med (1 grad + O(Mn))</td>
                <td className="py-2">Large-scale, production ML</td>
              </tr>
            </tbody>
          </table>
        </div>
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
              <li>Compare GD Fixed vs Line Search on Rosenbrock</li>
              <li>See Newton's quadratic convergence on Quadratic Bowl</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">For understanding tradeoffs:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Compare all algorithms on Ill-Conditioned Quadratic</li>
              <li>Watch Newton fail on Saddle Point (without line search)</li>
              <li>See L-BFGS adapt on all problem types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
