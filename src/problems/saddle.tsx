import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { CollapsibleSection } from '../components/CollapsibleSection';

// Non-convex function with saddle point at origin
// f(w) = w0^2 - w1^2 (hyperbolic paraboloid)
// Has saddle point at (0, 0) with one positive and one negative eigenvalue
export const saddleProblem: ProblemDefinition = {
  name: 'Saddle Point Function',
  objectiveFormula: <InlineMath>{String.raw`f(w) = w_0^2 - w_1^2`}</InlineMath>,
  description: (
    <>
      Non-convex hyperbolic paraboloid <InlineMath>{String.raw`f(w) = w_0^2 - w_1^2`}</InlineMath> with saddle at origin
    </>
  ),

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 - w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, -2 * w1];
  },

  hessian: (): number[][] => {
    // Constant Hessian = [[2, 0], [0, -2]]
    // Eigenvalues: λ1 = 2 (positive), λ2 = -2 (negative) → saddle point
    return [[2, 0], [0, -2]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },

  globalMinimum: undefined,  // No global minimum (unbounded below), but saddle at (0, 0)
  criticalPoint: [0, 0],      // Saddle point: ∇f(0,0) = 0, but indefinite Hessian
};

// Key insights box for saddle point (used in ProblemConfiguration)
export const saddleKeyInsights = (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h3 className="text-sm font-bold text-gray-800 mb-3">Key Insights</h3>
    <div className="p-3 bg-blue-100 rounded-lg">
      <p className="text-xs text-blue-900 font-semibold mb-1">
        Saddle Points: Where Gradient Descent Can Get Stuck
      </p>
      <p className="text-xs text-blue-900">
        <strong>At origin <InlineMath>(0,0)</InlineMath>:</strong> Gradient is zero, but it's NOT a minimum! It's a saddle point—a minimum in <InlineMath>w_0</InlineMath> direction, maximum in <InlineMath>w_1</InlineMath> direction.<br/>
        <strong>First-order methods:</strong> Can get stuck at saddle points since <InlineMath>\nabla f=0</InlineMath>. They need careful initialization or momentum to escape.<br/>
        <strong>Second-order methods:</strong> Use curvature information (Hessian) to detect saddle points. Negative eigenvalues reveal "escape directions" away from the saddle.
      </p>
    </div>
  </div>
);

// Educational content for Saddle Point function
export const saddleExplainer = (
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
          <GlossaryTooltip termKey="eigenvalue" />s: <InlineMath>\lambda_1 = 2</InlineMath> (positive), <InlineMath>\lambda_2 = -2</InlineMath> (negative)
        </p>
      </div>

      <p>
        <strong>What it does:</strong> Creates a saddle point at the origin <InlineMath>(0,0)</InlineMath> - minimum in <InlineMath>w_0</InlineMath>{' '}
        direction, maximum in <InlineMath>w_1</InlineMath> direction.
      </p>

      <p>
        <strong>Why it's interesting:</strong> Classic failure mode demonstrating the importance
        of second-order optimality conditions. At a saddle point, the gradient is zero (<InlineMath>\nabla f = 0</InlineMath>)
        but the <GlossaryTooltip termKey="hessian" /> has mixed <GlossaryTooltip termKey="eigenvalue" />s (one positive, one negative).
      </p>

      <p>
        <strong>Challenge:</strong> Newton's direction is NOT a descent direction here. The negative
        eigenvalue causes Newton to suggest moving uphill along that eigenvector.
      </p>

      <div className="bg-red-50 rounded p-3">
        <p className="text-sm font-semibold mb-1">Newton's Method Behavior:</p>
        <ul className="text-sm list-disc ml-5">
          <li><strong>WITHOUT line search:</strong> Diverges! Takes full step in wrong direction (moves uphill).</li>
          <li><strong>WITH line search (default):</strong> Line search rejects the bad step or shrinks it heavily. May stall near saddle point but won't diverge.</li>
          <li><strong>Key insight:</strong> Gradient norm alone is NOT sufficient for optimality. Need to check Hessian eigenvalues!</li>
          <li><strong>All algorithms:</strong> Can't find a minimum here because the saddle point isn't a minimum - it's a critical point where <InlineMath>\nabla f = 0</InlineMath>.</li>
        </ul>
      </div>
    </div>
  </CollapsibleSection>
);
