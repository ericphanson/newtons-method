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

      {/* Rotated Ellipse */}
      <CollapsibleSection
        title="Rotated Ellipse (Rotation Invariance)"
        defaultExpanded={false}
        storageKey="problem-explainer-quadratic"
      >
        <div className="space-y-3 text-gray-800">
          <p>
            <strong>Type:</strong> Strongly Convex
          </p>

          <p>
            <strong>Parameter:</strong> <InlineMath>\theta</InlineMath> (rotation angle, 0° to 90°)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}w^T R(\theta) \begin{bmatrix} 5 & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T w`}
            </BlockMath>
            <p className="text-sm mt-1">
              where <InlineMath>R(\theta)</InlineMath> is a 2D rotation matrix
            </p>
          </div>

          <div>
            <p className="font-semibold">Hessian (depends on θ):</p>
            <BlockMath>
              {String.raw`H = R(\theta) \begin{bmatrix} 5 & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T`}
            </BlockMath>
            <p className="text-sm mt-1">
              Condition number: <InlineMath>\kappa = 5</InlineMath> (moderate, eigenvalues 5 and 1)
            </p>
          </div>

          <p>
            <strong>What it does:</strong> An elliptical bowl (5:1 aspect ratio) rotated by angle θ.
            The same problem in different coordinate systems.
          </p>

          <p>
            <strong>Why it's interesting:</strong> <strong>This is the ONLY problem that demonstrates coordinate system dependence.</strong>
            Shows how rotation affects gradient descent but not Newton/L-BFGS.
          </p>

          <p>
            <strong>Key pedagogical insight - Rotation Invariance:</strong>
          </p>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li><strong>θ=0°:</strong> Axis-aligned ellipse. Gradient descent is efficient along axes.</li>
            <li><strong>θ=45°:</strong> Maximum misalignment. Gradient descent zigzags badly between steep/shallow directions.</li>
            <li><strong>Newton & L-BFGS:</strong> Performance unchanged by rotation! They adapt to the coordinate system.</li>
          </ul>

          <div className="bg-green-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Perfect for demonstrating:</p>
            <ul className="text-sm list-disc ml-5">
              <li>Rotation invariance of second-order methods</li>
              <li>How coordinate systems affect gradient descent</li>
              <li>Why Newton/L-BFGS handle arbitrary orientations</li>
              <li>The difference between intrinsic (κ) and extrinsic (rotation) difficulty</li>
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

          <p>
            <strong>Parameter:</strong> <InlineMath>\kappa</InlineMath> (condition number, 1 to 1000, default 100)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = \frac{1}{2}(\kappa w_0^2 + w_1^2)`}
            </BlockMath>
          </div>

          <div>
            <p className="font-semibold">Hessian:</p>
            <BlockMath>
              {String.raw`H = \begin{bmatrix} \kappa & 0 \\ 0 & 1 \end{bmatrix}`}
            </BlockMath>
            <p className="text-sm mt-1">
              Condition number: <InlineMath>\kappa</InlineMath> (controlled by parameter)
            </p>
          </div>

          <p>
            <strong>What it does:</strong> Creates an axis-aligned elongated ellipse with κ:1 aspect ratio.
          </p>

          <p>
            <strong>Why it's interesting:</strong> Shows what goes wrong with poor scaling in axis-aligned problems.
            Gradient descent zig-zags perpendicular to contours.
          </p>

          <p>
            <strong>Adjusting κ:</strong>
          </p>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li><strong>κ=1:</strong> Perfectly conditioned (circular). All methods converge efficiently.</li>
            <li><strong>κ=100:</strong> Moderately ill-conditioned. Gradient descent shows clear slowdown.</li>
            <li><strong>κ=1000:</strong> Extremely ill-conditioned. Gradient descent becomes nearly unusable.</li>
          </ul>

          <p>
            <strong>Challenge:</strong> Gradient descent slows dramatically as κ increases. Newton's method handles
            ill-conditioning gracefully by using curvature information.
          </p>

          <div className="bg-purple-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">Compare algorithms:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Fixed: Iterations scale with κ, heavy zig-zagging</li>
              <li>Newton: ~5 iterations regardless of κ</li>
              <li>L-BFGS: Learns curvature, adapts quickly</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded p-3 mt-3">
            <p className="text-sm font-semibold mb-1">Note: Axis-aligned conditioning</p>
            <p className="text-sm">
              This problem is axis-aligned (steep in w₀, shallow in w₁). Compare with Rotated Ellipse
              to see the difference between intrinsic conditioning (κ) and coordinate system effects (rotation).
            </p>
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

          <p>
            <strong>Parameter:</strong> <InlineMath>b</InlineMath> (valley steepness, 10 to 1000, default 100)
          </p>

          <div>
            <p className="font-semibold">Objective Function:</p>
            <BlockMath>
              {String.raw`f(w) = (1-w_0)^2 + b(w_1-w_0^2)^2`}
            </BlockMath>
          </div>

          <p>
            <strong>What it does:</strong> Creates a narrow curved valley (banana shape).
            Global minimum at (1, 1).
          </p>

          <p>
            <strong>Why it's interesting:</strong> Classic non-convex test function demonstrating curved ill-conditioning.
            The valley is easy to find but hard to follow. Curvature changes dramatically along the path.
          </p>

          <p>
            <strong>Adjusting b (valley steepness):</strong>
          </p>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li><strong>b=10:</strong> Gentle valley walls. Gradient descent can navigate reasonably well.</li>
            <li><strong>b=100:</strong> Moderately steep valley. First-order methods struggle but progress.</li>
            <li><strong>b=1000:</strong> Extremely steep valley. First-order methods nearly trapped; second-order essential.</li>
          </ul>

          <p>
            <strong>Challenge:</strong> Non-convexity means Newton's Hessian can have negative
            eigenvalues. Fixed step size that works in flat regions overshoots in the valley.
            Unlike axis-aligned problems, the difficulty here is from curved geometry.
          </p>

          <div className="bg-orange-50 rounded p-3">
            <p className="text-sm font-semibold mb-1">What to observe:</p>
            <ul className="text-sm list-disc ml-5">
              <li>GD Line Search adapts to varying curvature</li>
              <li>Newton needs damping (line search) to stay stable</li>
              <li>L-BFGS builds curvature approximation over time</li>
              <li>Higher b values: sharper turns, more challenging navigation</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded p-3 mt-3">
            <p className="text-sm font-semibold mb-1">Note: Curved conditioning</p>
            <p className="text-sm">
              This problem demonstrates curved ill-conditioning (non-linear valley). Compare with
              Ill-Conditioned Quadratic (axis-aligned) and Rotated Ellipse (rotation effects) to
              understand different sources of optimization difficulty.
            </p>
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
              <li>Try Rotated Ellipse for rotation invariance</li>
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
