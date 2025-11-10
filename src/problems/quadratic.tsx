import { ProblemDefinition } from '../types/experiments';
import { InlineMath, BlockMath } from '../components/Math';

// Simple quadratic bowl: f(w) = w0^2 + w1^2
// Well-conditioned problem with circular level sets
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  objectiveFormula: <InlineMath>{String.raw`f(w) = w_0^2 + w_1^2`}</InlineMath>,
  description: (
    <>
      Simple quadratic bowl: <InlineMath>{String.raw`f(w) = w_0^2 + w_1^2`}</InlineMath> (well-conditioned)
    </>
  ),

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 2 * w1];
  },

  hessian: (): number[][] => {
    return [[2, 0], [0, 2]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },

  globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
};

// Rotated ellipse: demonstrates coordinate system dependence
// f(w) = 0.5 * w^T * R * diag(5, 1) * R^T * w, where R is rotation by θ
// Factory function that creates a parametrized rotated quadratic
export function createRotatedQuadratic(thetaDegrees: number = 0): ProblemDefinition {
  const theta = (thetaDegrees * Math.PI) / 180; // Convert to radians
  const kappa = 5; // Moderate condition number to show rotation effect

  // Rotation matrix: R = [[cos(θ), -sin(θ)], [sin(θ), cos(θ)]]
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  // Hessian: H = R * diag(κ, 1) * R^T
  const h00 = kappa * c * c + s * s;
  const h01 = (kappa - 1) * c * s;
  const h11 = kappa * s * s + c * c;

  return {
    name: 'Rotated Ellipse',
    objectiveFormula: <InlineMath>{String.raw`f(w) = \frac{1}{2}w^T R(\theta) \begin{bmatrix} 5 & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T w`}</InlineMath>,
    description: (
      <>
        Rotated ellipse (<InlineMath>\theta</InlineMath>={thetaDegrees.toFixed(1)}°, <InlineMath>{String.raw`\kappa=5`}</InlineMath>), shows coordinate system dependence
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

// Ill-conditioned quadratic: elongated ellipse
// f(w) = w0^2 + κ*w1^2
// Matches Python validation suite: f(w) = w0^2 + 100*w1^2
export const illConditionedQuadratic: ProblemDefinition = {
  name: 'Ill-Conditioned Quadratic',
  objectiveFormula: <InlineMath>{String.raw`f(w) = w_0^2 + 100w_1^2`}</InlineMath>,
  description: (
    <>
      Elongated ellipse: <InlineMath>{String.raw`f(w) = w_0^2 + 100w_1^2`}</InlineMath> (condition number <InlineMath>{String.raw`\kappa=100`}</InlineMath>)
    </>
  ),

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + 100 * w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 200 * w1];
  },

  hessian: (): number[][] => {
    return [[2, 0], [0, 200]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },

  globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
};

// Factory function that creates a parametrized ill-conditioned quadratic
export function createIllConditionedQuadratic(conditionNumber: number = 100): ProblemDefinition {
  return {
    name: 'Ill-Conditioned Quadratic',
    objectiveFormula: (
      <>
        <InlineMath>f(w) = w_0^2</InlineMath> + {conditionNumber.toFixed(3).replace(/\.?0+$/, '')}<InlineMath>w_1^2</InlineMath>
      </>
    ),
    description: (
      <>
        Elongated ellipse with condition number <InlineMath>\kappa</InlineMath>={conditionNumber.toFixed(3).replace(/\.?0+$/, '')}
      </>
    ),

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return w0 * w0 + conditionNumber * w1 * w1;
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      return [2 * w0, 2 * conditionNumber * w1];
    },

    hessian: (): number[][] => {
      return [[2, 0], [0, 2 * conditionNumber]];
    },

    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },

    globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
  };
}

// Educational content for rotated ellipse problem
export const quadraticExplainer = {
  title: 'Rotated Ellipse (Rotation Invariance)',
  defaultExpanded: false,
  storageKey: 'problem-explainer-quadratic',
  content: (
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
  ),
};
