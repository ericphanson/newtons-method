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
        The visualizer supports 6 different optimization problems. Each demonstrates
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

      {/* Separating Hyperplane */}
      <CollapsibleSection
        title="Separating Hyperplane (Linear Classification)"
        defaultExpanded={false}
        storageKey="problem-explainer-separating-hyperplane"
      >
        <div className="space-y-3 text-gray-800">
          <h4 className="font-semibold text-lg">Overview</h4>
          <p>
            The <strong>separating hyperplane</strong> problem finds a linear decision boundary
            that separates two classes of data points. In 2D, this is a line; in higher dimensions,
            it's a hyperplane.
          </p>

          <div className="bg-blue-50 rounded p-3 border border-blue-200 mt-3">
            <h5 className="font-semibold text-sm mb-2">Notation (for beginners)</h5>
            <div className="space-y-1 text-sm">
              <p>
                <InlineMath>w = [w_0, w_1, w_2]</InlineMath> — The <strong>weights</strong> we're optimizing.
                <InlineMath>w_0</InlineMath> and <InlineMath>w_1</InlineMath> define the slope,
                <InlineMath>w_2</InlineMath> is the bias (intercept).
              </p>
              <p>
                <InlineMath>x = [x_1, x_2]</InlineMath> — A <strong>data point</strong> in 2D space (e.g., a red or blue dot).
              </p>
              <p>
                <InlineMath>{'y \\in \\{-1, +1\\}'}</InlineMath> — The <strong>class label</strong>.
                <InlineMath>y = -1</InlineMath> for class 0 (red), <InlineMath>y = +1</InlineMath> for class 1 (blue).
              </p>
              <p>
                <InlineMath>z = w_0 x_1 + w_1 x_2 + w_2</InlineMath> — The <strong>decision value</strong>.
                If <InlineMath>{'z > 0'}</InlineMath>, we predict class 1; if <InlineMath>{'z < 0'}</InlineMath>, we predict class 0.
              </p>
              <p className="pt-2 border-t border-blue-300 mt-2">
                <strong>Decision Boundary:</strong> <InlineMath>w_0 x_1 + w_1 x_2 + w_2 = 0</InlineMath>
                <br />
                <span className="text-xs">This is the line where <InlineMath>z = 0</InlineMath>. Points on one side are predicted as class 0, points on the other side as class 1.</span>
              </p>
            </div>
          </div>

          <h4 className="font-semibold text-lg mt-4">Why These Formulations Make Sense</h4>
          <p className="text-sm">
            All four variants balance two goals: (1) <strong>correctly classify the data</strong>, and
            (2) <strong>find a simple, robust boundary</strong>. The term <InlineMath>{String.raw`\frac{1}{2}\|w\|^2`}</InlineMath> keeps
            weights small (maximizes margin), while different loss terms handle classification errors differently.
          </p>
          <p className="text-sm">
            <strong>Key insight:</strong> The product <InlineMath>y_i z_i</InlineMath> tells us if point <InlineMath>i</InlineMath> is
            correctly classified. If <InlineMath>{'y_i z_i > 0'}</InlineMath>, the point is on the correct side.
            If <InlineMath>{'y_i z_i < 0'}</InlineMath>, it's misclassified.
          </p>

          <h4 className="font-semibold text-lg mt-4">Four Variants</h4>

          <div className="ml-4 space-y-4">
            <div>
              <h5 className="font-semibold text-base text-blue-700">1. Hard-Margin SVM (Default)</h5>
              <div className="mt-1">
                <p className="font-semibold text-sm">Objective:</p>
                <BlockMath>
                  {String.raw`\min \frac{1}{2}\|w\|^2 \quad \text{subject to } y_i z_i \geq 1 \text{ for all } i`}
                </BlockMath>
                <p className="text-xs text-gray-600 mt-1">
                  (In practice, we use a smooth penalty formulation instead of hard constraints)
                </p>
              </div>
              <p className="mt-2 text-sm">
                <strong>What it does:</strong> Finds the widest "margin" (gap) between the two classes.
                Minimizing <InlineMath>{String.raw`\|w\|^2`}</InlineMath> makes the margin wider.
              </p>
              <p className="mt-1 text-sm">
                <strong>The constraint:</strong> <InlineMath>{'y_i z_i \\geq 1'}</InlineMath> means every point must be
                not just on the correct side, but at least distance 1 from the boundary (scaled by <InlineMath>{String.raw`\|w\|`}</InlineMath>).
              </p>
              <p className="mt-1 text-sm">
                <strong>Failure mode:</strong> If data is not perfectly separable, gradients become very large
                as the algorithm tries to satisfy impossible constraints.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-base text-blue-700">2. Soft-Margin SVM</h5>
              <div className="mt-1">
                <p className="font-semibold text-sm">Objective:</p>
                <BlockMath>
                  {String.raw`\min \frac{1}{2}\|w\|^2 + C \sum_i \max(0, 1 - y_i z_i)`}
                </BlockMath>
              </div>
              <p className="mt-2 text-sm">
                <strong>What it does:</strong> Uses <em>hinge loss</em> <InlineMath>{String.raw`\max(0, 1 - y_i z_i)`}</InlineMath> to
                allow some misclassifications with penalty C=1.0.
              </p>
              <p className="mt-1 text-sm">
                <strong>How the loss works:</strong> If <InlineMath>{'y_i z_i \\geq 1'}</InlineMath> (point is far on correct side),
                loss is 0. If <InlineMath>{'y_i z_i < 1'}</InlineMath> (point violates margin or is misclassified),
                loss increases linearly. This creates a "soft" margin that tolerates some errors.
              </p>
              <p className="mt-1 text-sm">
                <strong>Why it's practical:</strong> More robust than hard-margin. Balances margin maximization with allowing errors
                in overlapping data.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-base text-blue-700">3. Perceptron Criterion</h5>
              <div className="mt-1">
                <p className="font-semibold text-sm">Objective:</p>
                <BlockMath>
                  {String.raw`\min \sum_i \max(0, -y_i z_i) + 0.01 \cdot \frac{1}{2}\|w\|^2`}
                </BlockMath>
              </div>
              <p className="mt-2 text-sm">
                <strong>What it does:</strong> Classic perceptron algorithm. Only penalizes misclassified points.
              </p>
              <p className="mt-1 text-sm">
                <strong>How the loss works:</strong> <InlineMath>{String.raw`\max(0, -y_i z_i)`}</InlineMath> is non-zero only when
                <InlineMath>{'y_i z_i < 0'}</InlineMath> (misclassified). Correctly classified points contribute zero loss,
                even if they're very close to the boundary. This is different from SVM which wants a margin.
              </p>
              <p className="mt-1 text-sm">
                <strong>The regularization term:</strong> Small regularization (0.01) prevents weights from becoming too large
                or collapsing to zero. Without it, the algorithm might produce unstable solutions.
              </p>
              <p className="mt-1 text-sm">
                <strong>Result:</strong> Finds any separating hyperplane but doesn't maximize margin. Often finds solutions
                closer to the data than SVM variants (less robust to new data).
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-base text-blue-700">4. Squared-Hinge Loss</h5>
              <div className="mt-1">
                <p className="font-semibold text-sm">Objective:</p>
                <BlockMath>
                  {String.raw`\min \frac{1}{2}\|w\|^2 + C \sum_i [\max(0, 1 - y_i z_i)]^2`}
                </BlockMath>
              </div>
              <p className="mt-2 text-sm">
                <strong>What it does:</strong> Similar to soft-margin SVM, but squares the hinge loss.
              </p>
              <p className="mt-1 text-sm">
                <strong>How the loss works:</strong> Same as hinge loss, but <em>quadratic</em> instead of linear.
                If <InlineMath>{'y_i z_i \\geq 1'}</InlineMath>, loss is 0. If <InlineMath>{'y_i z_i < 1'}</InlineMath>,
                loss is <InlineMath>{String.raw`(1 - y_i z_i)^2`}</InlineMath>. Large violations get much heavier penalty.
              </p>
              <p className="mt-1 text-sm">
                <strong>Advantage:</strong> The loss function is <em>twice differentiable everywhere</em> (smooth),
                which makes Newton's method work better. Soft-margin SVM has a "kink" at <InlineMath>{'y_i z_i = 1'}</InlineMath>
                where the second derivative doesn't exist.
              </p>
              <p className="mt-1 text-sm">
                <strong>Trade-off:</strong> More sensitive to outliers (quadratic penalty), but smoother optimization landscape.
              </p>
            </div>
          </div>

          <h4 className="font-semibold text-lg mt-4">Key Insights</h4>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Hard-Margin</strong> works beautifully on separable data but fails catastrophically
              on overlapping classes
            </li>
            <li>
              <strong>Soft-Margin</strong> is the practical choice - handles real-world data with noise
            </li>
            <li>
              <strong>Perceptron</strong> is simplest but doesn't maximize margin (less robust to new data)
            </li>
            <li>
              <strong>Squared-Hinge</strong> is smoothest - best for second-order optimization methods
            </li>
          </ul>

          <div className="bg-blue-50 rounded p-3 mt-4">
            <p className="text-sm font-semibold mb-2">Try This:</p>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li>
                Start with <strong>hard-margin</strong> on well-separated data (increase crescent separation).
                Then reduce separation to see it struggle.
              </li>
              <li>
                Compare <strong>soft-margin</strong> vs <strong>squared-hinge</strong> on overlapping data.
                Notice how squared-hinge gives smoother convergence with Newton's method.
              </li>
              <li>
                Use <strong>perceptron</strong> and compare to <strong>soft-margin</strong>. See how
                perceptron finds narrower margins (less robust).
              </li>
              <li>
                Try different algorithms: Newton's method works best with squared-hinge (smooth Hessian),
                gradient descent works with all variants.
              </li>
            </ul>
          </div>

          <h4 className="font-semibold text-lg mt-4">Comparison to Logistic Regression</h4>
          <p>
            While logistic regression uses a smooth log-loss that affects all points, SVM variants
            use margin-based losses that only penalize points near or on the wrong side of the boundary.
            This makes SVMs focus on the "support vectors" - the critical points near the decision boundary.
          </p>
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
              <li>Compare with Separating Hyperplane variants</li>
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
