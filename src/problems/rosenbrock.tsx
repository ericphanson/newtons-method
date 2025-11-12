import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';
import { CollapsibleSection } from '../components/CollapsibleSection';

// Rosenbrock function: f(w) = (1-w0)^2 + b(w1-w0^2)^2
// Non-convex, banana-shaped valley, classic optimization test
// Factory function that creates a parametrized Rosenbrock problem
export function createRosenbrockProblem(b: number = 100): ProblemDefinition {
  return {
    name: 'Rosenbrock Function',
    objectiveFormula: <InlineMath>{String.raw`f(w) = (1-w_0)^2 + b(w_1-w_0^2)^2`}</InlineMath>,
    description: (
      <>
        Non-convex banana valley (<InlineMath>b</InlineMath>={b.toFixed(3).replace(/\.?0+$/, '')}), global minimum at <InlineMath>(1,1)</InlineMath>
      </>
    ),

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return Math.pow(1 - w0, 2) + b * Math.pow(w1 - w0 * w0, 2);
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      const dw0 = -2 * (1 - w0) - 4 * b * w0 * (w1 - w0 * w0);
      const dw1 = 2 * b * (w1 - w0 * w0);
      return [dw0, dw1];
    },

    hessian: (w: number[]): number[][] => {
      const [w0, w1] = w;
      const h00 = 2 + 12 * b * w0 * w0 - 4 * b * w1;
      const h01 = -4 * b * w0;
      const h10 = -4 * b * w0;
      const h11 = 2 * b;
      return [[h00, h01], [h10, h11]];
    },

    domain: {
      w0: [-2, 2],
      w1: [-1, 3],
    },

    globalMinimum: [1, 1],  // Analytical solution: f(1,1) = 0, ∇f(1,1) = 0
  };
}

// Default instance with b=100 for backward compatibility
export const rosenbrockProblem: ProblemDefinition = createRosenbrockProblem(100);

// Educational content for Rosenbrock function
export const rosenbrockExplainer = (
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
        Global minimum at <InlineMath>(1, 1)</InlineMath>.
      </p>

      <p>
        <strong>Why it's interesting:</strong> Classic non-convex test function demonstrating curved ill-conditioning.
        The valley is easy to find but requires many iterations to navigate. Curvature changes dramatically along the path.
      </p>

      <p>
        <strong>Adjusting <InlineMath>b</InlineMath> (valley steepness):</strong>
      </p>
      <ul className="text-sm list-disc ml-5 space-y-1">
        <li><strong><InlineMath>b=10</InlineMath>:</strong> Gentle valley walls. Gradient descent makes steady progress with fewer oscillations.</li>
        <li><strong><InlineMath>b=100</InlineMath>:</strong> Moderately steep valley. First-order methods struggle but progress.</li>
        <li><strong><InlineMath>b=1000</InlineMath>:</strong> Extremely steep valley. First-order methods nearly trapped; second-order essential.</li>
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
          <li>Higher <InlineMath>b</InlineMath> values: sharper turns, more challenging navigation</li>
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
);
