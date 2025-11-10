import { InlineMath, BlockMath } from '../components/Math';
import { CollapsibleSection } from '../components/CollapsibleSection';

/**
 * Educational content for Separating Hyperplane problem
 * Note: ProblemDefinition is handled separately for dataset-based problems
 */
export const separatingHyperplaneExplainer = (
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
        All three variants balance two goals: (1) <strong>correctly classify the data</strong>, and
        (2) <strong>find a simple, robust boundary</strong>. The term <InlineMath>{String.raw`\frac{1}{2}\|w\|^2`}</InlineMath> keeps
        weights small (maximizes margin), while different loss terms handle classification errors differently.
      </p>
      <p className="text-sm">
        <strong>Key insight:</strong> The product <InlineMath>y_i z_i</InlineMath> tells us if point <InlineMath>i</InlineMath> is
        correctly classified. If <InlineMath>{'y_i z_i > 0'}</InlineMath>, the point is on the correct side.
        If <InlineMath>{'y_i z_i < 0'}</InlineMath>, it's misclassified.
      </p>

      <h4 className="font-semibold text-lg mt-4">Three Variants</h4>

      <div className="ml-4 space-y-4">
        <div>
          <h5 className="font-semibold text-base text-blue-700">1. Soft-Margin SVM</h5>
          <div className="mt-1">
            <p className="font-semibold text-sm">Objective:</p>
            <BlockMath>
              {String.raw`\min \frac{1}{2}\|w\|^2 + \lambda \sum_i \max(0, 1 - y_i z_i)`}
            </BlockMath>
          </div>
          <p className="mt-2 text-sm">
            <strong>What it does:</strong> Uses <em>hinge loss</em> <InlineMath>{String.raw`\max(0, 1 - y_i z_i)`}</InlineMath> to
            allow some misclassifications with adjustable penalty <InlineMath>\lambda</InlineMath>.
          </p>
          <p className="mt-1 text-sm">
            <strong>How the loss works:</strong> If <InlineMath>{'y_i z_i \\geq 1'}</InlineMath> (point is far on correct side),
            loss is 0. If <InlineMath>{'y_i z_i < 1'}</InlineMath> (point violates margin or is misclassified),
            loss increases linearly. This creates a "soft" margin that tolerates some errors.
          </p>
          <p className="mt-1 text-sm">
            <strong>Why it's practical:</strong> Most robust choice for real-world data. Balances margin maximization with allowing errors
            in overlapping data.
          </p>
        </div>

        <div>
          <h5 className="font-semibold text-base text-blue-700">2. Perceptron Criterion</h5>
          <div className="mt-1">
            <p className="font-semibold text-sm">Objective:</p>
            <BlockMath>
              {String.raw`\min \sum_i \max(0, -y_i z_i) + \frac{\lambda}{2}\|w\|^2`}
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
            <strong>The regularization term:</strong> Adjustable regularization <InlineMath>\lambda</InlineMath> prevents weights from becoming too large
            or collapsing to zero. Without it, the algorithm might produce unstable solutions.
          </p>
          <p className="mt-1 text-sm">
            <strong>Result:</strong> Finds any separating hyperplane but doesn't maximize margin. Often finds solutions
            closer to the data than SVM variants (less robust to new data).
          </p>
          <div className="bg-yellow-50 rounded p-3 border border-yellow-200 mt-3">
            <h5 className="font-semibold text-sm mb-2 text-yellow-900">⚠️ Newton's Method Warning</h5>
            <p className="text-sm">
              <strong>Not recommended with Newton:</strong> Perceptron's piecewise linear loss has zero curvature
              (second derivative = 0 almost everywhere). The Hessian contains only the regularization term: H = λI.
            </p>
            <p className="text-sm mt-2">
              <strong>Why it fails:</strong> Newton's step becomes d = -H⁻¹∇f = -(1/λ)I·∇f = -(1/λ)∇f.
              This is just <strong>gradient descent with step size 1/λ!</strong> With λ=0.0001 (default),
              Newton takes gradient steps with α=10,000, causing wild oscillations. Newton loses its
              second-order advantage completely - it degenerates into poorly-tuned gradient descent.
            </p>
            <p className="text-sm mt-2">
              <strong>Solutions:</strong> Use line search to shrink bad steps, or add Hessian damping.
              Better yet, use Squared-Hinge SVM (smooth loss with proper Hessian), or stick with
              plain gradient descent for perceptron (second-order methods can't exploit curvature in
              piecewise linear problems).
            </p>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-base text-blue-700">3. Squared-Hinge Loss</h5>
          <div className="mt-1">
            <p className="font-semibold text-sm">Objective:</p>
            <BlockMath>
              {String.raw`\min \frac{1}{2}\|w\|^2 + \lambda \sum_i [\max(0, 1 - y_i z_i)]^2`}
            </BlockMath>
          </div>
          <p className="mt-2 text-sm">
            <strong>What it does:</strong> Similar to soft-margin SVM, but squares the hinge loss with adjustable penalty <InlineMath>\lambda</InlineMath>.
          </p>
          <p className="mt-1 text-sm">
            <strong>How the loss works:</strong> Same as hinge loss, but <em>quadratic</em> instead of linear.
            If <InlineMath>{'y_i z_i \\geq 1'}</InlineMath>, loss is 0. If <InlineMath>{'y_i z_i < 1'}</InlineMath>,
            loss is <InlineMath>{String.raw`(1 - y_i z_i)^2`}</InlineMath>. Large violations get much heavier penalty.
          </p>
          <p className="mt-1 text-sm">
            <strong>Advantage:</strong> The loss function is <em>differentiable everywhere</em> (C¹ smooth),
            unlike soft-margin SVM which has a "kink" at <InlineMath>{'y_i z_i = 1'}</InlineMath>.
            Note: While the first derivative is continuous, the second derivative has a discontinuity
            at the margin boundary, so it's not twice continuously differentiable (C²). For true
            quadratic convergence with Newton's method, infinitely smooth losses are ideal, but
            squared-hinge is a practical compromise that enables gradient-based optimization.
          </p>
          <p className="mt-1 text-sm">
            <strong>Trade-off:</strong> More sensitive to outliers (quadratic penalty), but smoother optimization landscape.
          </p>
        </div>
      </div>

      <h4 className="font-semibold text-lg mt-4">Key Insights</h4>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Soft-Margin</strong> is the most practical choice - handles real-world data with noise while maximizing margin
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
            <strong>Adjust λ</strong> (regularization slider) to see how it affects the decision boundary.
            Higher λ emphasizes correct classification over margin size; lower λ maximizes margin.
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
);
