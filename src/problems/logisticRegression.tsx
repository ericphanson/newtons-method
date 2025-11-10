import { InlineMath, BlockMath } from '../components/Math';
import { CollapsibleSection } from '../components/CollapsibleSection';

/**
 * Educational content for Logistic Regression problem
 * Note: ProblemDefinition is handled separately for dataset-based problems
 */
export const logisticRegressionExplainer = (
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
);
