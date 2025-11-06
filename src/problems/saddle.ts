import { ProblemDefinition } from '../types/experiments';

// Non-convex function with saddle point at origin
// f(w) = w0^2 - w1^2 (hyperbolic paraboloid)
// Has saddle point at (0, 0) with one positive and one negative eigenvalue
export const saddleProblem: ProblemDefinition = {
  name: 'Saddle Point Function',
  description: 'Non-convex hyperbolic paraboloid f(w) = w₀² - w₁² with saddle at origin',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return w0 * w0 - w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    return [2 * w0, -2 * w1];
  },

  hessian: (_w: number[]): number[][] => {
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
