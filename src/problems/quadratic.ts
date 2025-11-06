import { ProblemDefinition } from '../types/experiments';

// Simple quadratic bowl: f(w) = 0.5 * (w0^2 + w1^2)
// Strongly convex, ideal for demonstrating convergence
export const quadraticProblem: ProblemDefinition = {
  name: 'Quadratic Bowl',
  description: 'Strongly convex quadratic f(w) = 0.5(w₀² + w₁²)',

  objective: (w: number[]): number => {
    return 0.5 * (w[0] * w[0] + w[1] * w[1]);
  },

  gradient: (w: number[]): number[] => {
    return [w[0], w[1]];
  },

  hessian: (_w: number[]): number[][] => {
    // Constant Hessian = [[1, 0], [0, 1]] (identity)
    return [[1, 0], [0, 1]];
  },

  domain: {
    w0: [-3, 3],
    w1: [-3, 3],
  },

  globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
};

// Ill-conditioned quadratic: elongated ellipse
// f(w) = 0.5 * (κ*w0^2 + w1^2)
// Factory function that creates a parametrized ill-conditioned quadratic
export function createIllConditionedQuadratic(conditionNumber: number = 100): ProblemDefinition {
  return {
    name: 'Ill-Conditioned Quadratic',
    description: `Elongated ellipse with condition number κ=${conditionNumber}`,

    objective: (w: number[]): number => {
      return 0.5 * (conditionNumber * w[0] * w[0] + w[1] * w[1]);
    },

    gradient: (w: number[]): number[] => {
      return [conditionNumber * w[0], w[1]];
    },

    hessian: (_w: number[]): number[][] => {
      return [[conditionNumber, 0], [0, 1]];
    },

    domain: {
      w0: [-0.5, 0.5],
      w1: [-3, 3],
    },

    globalMinimum: [0, 0],  // Analytical solution: ∇f = 0 at origin
  };
}

// Default instance with κ=100 for backward compatibility
export const illConditionedQuadratic: ProblemDefinition = createIllConditionedQuadratic(100);
