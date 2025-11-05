import { InlineMath, BlockMath } from './Math';
import { CollapsibleSection } from './CollapsibleSection';

/**
 * Educational component explaining all available optimization problems
 * Displays mathematical formulations, properties, and recommended use cases
 */
export function ProblemExplainer() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900">Problem Types</h2>
      <p className="text-gray-700">
        The visualizer supports 5 different optimization problems. Each demonstrates
        different algorithmic behaviors and challenges.
      </p>

      {/* Logistic Regression */}
      <CollapsibleSection
        title="Logistic Regression (2D Classification)"
        defaultExpanded={true}
        storageKey="problem-explainer-logreg"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Convex (with L2 regularization)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{n}\sum_{i=1}^n \log(1 + e^{-y_i(w^T x_i)}) + \frac{\lambda}{2}\|w\|^2`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Finds a linear decision boundary to separate
            two classes (red and blue crescents).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Real-world machine learning problem.
            Shows how optimization enables learning from data.
          </p>

          <p>
            <strong>Challenge:</strong> Non-quadratic, but convex. Guaranteed global minimum
            but requires many iterations with gradient descent.
          </p>

          <div className="bg-blue-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Try this:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Fixed Step with <InlineMath>\alpha=0.1</InlineMath> (smooth convergence)</li>
              <li>Newton's Method (quadratic convergence near minimum)</li>
              <li>L-BFGS (efficient for classification)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quadratic Bowl */}
      <CollapsibleSection
        title="Quadratic Bowl (Strongly Convex)"
        defaultExpanded={false}
        storageKey="problem-explainer-quadratic"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Strongly Convex
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}(w_0^2 + w_1^2)`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian (constant):</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Simplest possible convex function - a perfect bowl
            centered at origin.
          </p>

          <p>
            <strong>Why it's interesting:</strong> Ideal conditions for demonstrating convergence.
            Newton's method finds minimum in exactly 1 step!
          </p>

          <p>
            <strong>Challenge:</strong> None - this is the "easy mode" that shows what
            success looks like.
          </p>

          <div className="bg-green-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Perfect for demonstrating:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Newton's quadratic convergence (1-2 iterations)</li>
              <li>L-BFGS superlinear convergence</li>
              <li>GD with optimal step size (smooth spiral)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Ill-Conditioned Quadratic */}
      <CollapsibleSection
        title="Ill-Conditioned Quadratic (High κ)"
        defaultExpanded={false}
        storageKey="problem-explainer-illcond"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Strongly Convex (but ill-conditioned)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}(100w_0^2 + w_1^2)`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian:</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 100 & 0 \\ 0 & 1 \end{bmatrix}`}
            </BlockMath>
            <p className="text-sm mt-1">
              Condition number: <InlineMath>\kappa = 100</InlineMath>
            </p>
          </div>

          <p>
            <strong>What it does:</strong> Creates an elongated ellipse (100:1 aspect ratio).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Shows what goes wrong with poor scaling.
            Gradient descent zig-zags perpendicular to contours.
          </p>

          <p>
            <strong>Challenge:</strong> Gradient descent is very slow. Newton's method handles
            ill-conditioning gracefully.
          </p>

          <div className="bg-purple-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Compare algorithms:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Fixed: 100+ iterations, zig-zagging</li>
              <li>Newton: ~5 iterations, ignores ill-conditioning</li>
              <li>L-BFGS: Learns curvature, adapts quickly</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Rosenbrock */}
      <CollapsibleSection
        title="Rosenbrock Function (Banana Valley)"
        defaultExpanded={false}
        storageKey="problem-explainer-rosenbrock"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Non-Convex
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = (1-w_0)^2 + 100(w_1-w_0^2)^2`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Creates a narrow curved valley (banana shape).
            Global minimum at (1, 1).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Classic non-convex test function. The valley
            is easy to find but hard to follow. Curvature changes dramatically.
          </p>

          <p>
            <strong>Challenge:</strong> Non-convexity means Newton's Hessian can have negative
            eigenvalues. Fixed step size that works in flat regions overshoots in the valley.
          </p>

          <div className="bg-orange-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">What to observe:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Line Search adapts to varying curvature</li>
              <li>Newton needs damping (line search) to stay stable</li>
              <li>L-BFGS builds curvature approximation over time</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Saddle Point */}
      <CollapsibleSection
        title="Saddle Point (Hyperbolic Paraboloid)"
        defaultExpanded={false}
        storageKey="problem-explainer-saddle"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Non-Convex (indefinite)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = w_0^2 - w_1^2`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian:</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} 2 & 0 \\ 0 & -2 \end{bmatrix}`}
            </BlockMath>
            <p className="text-sm mt-1">
              Eigenvalues: λ₁ = 2 (positive), λ₂ = -2 (negative)
            </p>
          </div>

          <p>
            <strong>What it does:</strong> Creates a saddle point at origin - minimum in w₀
            direction, maximum in w₁ direction.
          </p>

          <p>
            <strong>Why it's interesting:</strong> Pure failure mode for Newton's method!
            Negative eigenvalue means Hessian suggests going uphill.
          </p>

          <p>
            <strong>Challenge:</strong> Newton's direction is not a descent direction.
            Line search is essential to prevent divergence.
          </p>

          <div className="bg-red-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Demonstrates failure modes:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Newton without line search: diverges upward</li>
              <li>Newton with line search: damping saves it</li>
              <li>All algorithms: Can't find minimum (saddle isn't a minimum!)</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* How to Use */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">How to Choose a Problem</h3>
        <p className="text-sm text-gray-700 mb-3">
          Use the problem selector (dropdown) that appears above visualizations when you
          load an experiment. Or click experiment buttons that automatically switch problems.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900">For learning basics:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Start with Logistic Regression</li>
              <li>Try Quadratic Bowl for "ideal" behavior</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">For understanding failures:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Ill-Conditioned for scaling issues</li>
              <li>Rosenbrock for varying curvature</li>
              <li>Saddle Point for Newton failures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
