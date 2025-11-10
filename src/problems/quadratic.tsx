import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { CollapsibleSection } from '../components/CollapsibleSection';

// Rotated ellipse: demonstrates coordinate system dependence
// f(w) = 0.5 * w^T * R * diag(κ, 1) * R^T * w, where R is rotation by θ
// Factory function that creates a parametrized rotated quadratic
export function createRotatedQuadratic(thetaDegrees: number = 0, kappa: number = 5): ProblemDefinition {
  const theta = (thetaDegrees * Math.PI) / 180; // Convert to radians

  // Rotation matrix: R = [[cos(θ), -sin(θ)], [sin(θ), cos(θ)]]
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  // Hessian: H = R * diag(κ, 1) * R^T
  const h00 = kappa * c * c + s * s;
  const h01 = (kappa - 1) * c * s;
  const h11 = kappa * s * s + c * c;

  const isAxisAligned = thetaDegrees === 0;

  return {
    name: 'Rotated Quadratic',
    objectiveFormula: isAxisAligned ? (
      <InlineMath>{String.raw`f(w) = \frac{1}{2}(\kappa w_0^2 + w_1^2)`}</InlineMath>
    ) : (
      <InlineMath>{String.raw`f(w) = \frac{1}{2}w^T R(\theta) \begin{bmatrix} \kappa & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T w`}</InlineMath>
    ),
    description: (
      <>
        {isAxisAligned ? 'Axis-aligned quadratic' : 'Rotated quadratic'} (<InlineMath>\theta</InlineMath>={thetaDegrees.toFixed(1)}°, <InlineMath>\kappa</InlineMath>={kappa}){kappa <= 2 ? ' (well-conditioned)' : kappa >= 50 ? ' (ill-conditioned)' : ''}
      </>
    ),

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return 0.5 * (w0 * w0 * h00 + 2 * w0 * w1 * h01 + w1 * w1 * h11);
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      return [
        h00 * w0 + h01 * w1,
        h01 * w0 + h11 * w1
      ];
    },

    hessian: (): number[][] => {
      return [[h00, h01], [h01, h11]];
    },

    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },

    globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
  };
}

// Educational content for rotated quadratic problem
export const quadraticExplainer = (
  <CollapsibleSection
    title="Rotated Quadratic (Two Sources of Difficulty)"
    defaultExpanded={false}
    storageKey="problem-explainer-quadratic"
  >
    <div className="space-y-3 text-gray-800">
      <p>
        <strong>Type:</strong> Strongly Convex
      </p>

      <p>
        <strong>Parameters:</strong> <InlineMath>\theta</InlineMath> (rotation angle, 0° to 90°), <InlineMath>\kappa</InlineMath> (<GlossaryTooltip termKey="condition-number" />, 1 to 500)
      </p>

      <div>
        <p className="font-semibold">Objective Function:</p>
        <BlockMath>
          {String.raw`f(w) = \frac{1}{2}w^T R(\theta) \begin{bmatrix} \kappa & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T w`}
        </BlockMath>
        <p className="text-sm mt-1">
          where <InlineMath>R(\theta)</InlineMath> is a 2D rotation matrix
        </p>
      </div>

      <div>
        <p className="font-semibold">Hessian:</p>
        <BlockMath>
          {String.raw`H = R(\theta) \begin{bmatrix} \kappa & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T`}
        </BlockMath>
        <p className="text-sm mt-1">
          Eigenvalues: <InlineMath>\kappa</InlineMath> and 1 (independent of rotation)
        </p>
      </div>

      <p>
        <strong>What it does:</strong> Creates a quadratic bowl with two independent sources of difficulty for optimization.
      </p>

      <p>
        <strong>Why it's interesting:</strong> This problem separates two distinct challenges:
      </p>
      <ul className="text-sm list-disc ml-5 space-y-1">
        <li><strong>Intrinsic difficulty (<InlineMath>\kappa</InlineMath>):</strong> Elongation of the bowl. High <InlineMath>\kappa</InlineMath> makes the problem <GlossaryTooltip termKey="ill-conditioned" />, causing all first-order methods to slow down.</li>
        <li><strong>Extrinsic difficulty (<InlineMath>\theta</InlineMath>):</strong> Misalignment with coordinate axes. Rotation affects gradient descent but not second-order methods.</li>
      </ul>

      <div className="bg-blue-50 rounded p-3 mt-2">
        <p className="text-sm font-semibold mb-1">Understanding κ (Condition Number):</p>
        <ul className="text-sm list-disc ml-5 space-y-1">
          <li><strong>κ=1:</strong> Perfectly conditioned circle. All methods converge efficiently regardless of θ.</li>
          <li><strong>κ=5-10:</strong> Mildly elongated. Good for demonstrating rotation effects without extreme conditioning.</li>
          <li><strong>κ=100:</strong> Moderately <GlossaryTooltip termKey="ill-conditioned" />. Gradient descent shows clear slowdown and zig-zagging.</li>
          <li><strong>κ=500:</strong> Extremely elongated. Gradient descent becomes nearly unusable.</li>
        </ul>
      </div>

      <div className="bg-green-50 rounded p-3 mt-2">
        <p className="text-sm font-semibold mb-1">Understanding θ (Rotation Angle):</p>
        <ul className="text-sm list-disc ml-5 space-y-1">
          <li><strong>θ=0°:</strong> Axis-aligned quadratic. Gradient descent moves efficiently along coordinate axes. <em>Pure conditioning test.</em></li>
          <li><strong>θ=45°:</strong> Maximum misalignment. Gradient steps zigzag badly between steep and shallow directions. <em>Pure rotation challenge.</em></li>
          <li><strong>Newton & L-BFGS:</strong> Performance unchanged by θ! Second-order methods are rotation invariant.</li>
        </ul>
      </div>

      <div className="bg-purple-50 rounded p-3 mt-2">
        <p className="text-sm font-semibold mb-1">Algorithm Performance on High κ Problems:</p>
        <ul className="text-sm list-disc ml-5 space-y-1">
          <li><strong>GD (fixed or line search):</strong> Iterations scale with κ. Heavy zig-zagging perpendicular to contours.</li>
          <li><strong>Newton:</strong> ~5 iterations regardless of κ. Uses H⁻¹ to perfectly scale each direction.</li>
          <li><strong>L-BFGS:</strong> Learns curvature from gradient history, adapts quickly to conditioning.</li>
          <li><strong>Diagonal Preconditioner:</strong> Perfect for θ=0° (axis-aligned), struggles when θ≠0° (off-diagonal Hessian terms).</li>
        </ul>
      </div>

      <div className="bg-amber-50 rounded p-3 mt-2">
        <p className="text-sm font-semibold mb-1">Perfect for demonstrating:</p>
        <ul className="text-sm list-disc ml-5">
          <li>The difference between intrinsic difficulty (κ) and coordinate system effects (θ)</li>
          <li>Why per-coordinate step sizes (diagonal preconditioning) aren't enough for rotated problems</li>
          <li>Rotation invariance: second-order methods handle any θ equally well</li>
          <li>How condition number affects convergence speed for all algorithms</li>
        </ul>
      </div>
    </div>
  </CollapsibleSection>
);
