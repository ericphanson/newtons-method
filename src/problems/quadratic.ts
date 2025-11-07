import { ProblemDefinition } from '../types/experiments';

// Simple quadratic bowl: f(w) = w0^2 + w1^2
// Well-conditioned problem with circular level sets
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  description: 'Simple quadratic bowl: f(w) = w0^2 + w1^2 (well-conditioned)',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 2 * w1];
  },

  hessian: (_w: number[]): number[][] => {
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
    description: `Rotated ellipse (θ=${thetaDegrees}°, κ=5), shows coordinate system dependence`,

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

    hessian: (_w: number[]): number[][] => {
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
  description: 'Elongated ellipse: f(w) = w0^2 + 100*w1^2 (condition number κ=100)',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 + 100 * w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, 200 * w1];
  },

  hessian: (_w: number[]): number[][] => {
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
    description: `Elongated ellipse with condition number κ=${conditionNumber}`,

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return w0 * w0 + conditionNumber * w1 * w1;
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      return [2 * w0, 2 * conditionNumber * w1];
    },

    hessian: (_w: number[]): number[][] => {
      return [[2, 0], [0, 2 * conditionNumber]];
    },

    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },

    globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
  };
}
