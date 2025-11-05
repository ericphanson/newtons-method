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
};

// Ill-conditioned quadratic: elongated ellipse
// f(w) = 0.5 * (100*w0^2 + w1^2)
export const illConditionedQuadratic: ProblemDefinition = {
  name: 'Ill-Conditioned Quadratic',
  description: 'Elongated ellipse with condition number κ=100',

  objective: (w: number[]): number => {
    return 0.5 * (100 * w[0] * w[0] + w[1] * w[1]);
  },

  gradient: (w: number[]): number[] => {
    return [100 * w[0], w[1]];
  },

  hessian: (_w: number[]): number[][] => {
    return [[100, 0], [0, 1]];
  },

  domain: {
    w0: [-0.5, 0.5],
    w1: [-3, 3],
  },
};
