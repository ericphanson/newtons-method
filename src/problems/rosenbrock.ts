import { ProblemDefinition } from '../types/experiments';

// Rosenbrock function: f(w) = (1-w0)^2 + 100(w1-w0^2)^2
// Non-convex, banana-shaped valley, classic optimization test
export const rosenbrockProblem: ProblemDefinition = {
  name: 'Rosenbrock Function',
  description: 'Non-convex banana-shaped valley, global minimum at (1,1)',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    return Math.pow(1 - w0, 2) + 100 * Math.pow(w1 - w0 * w0, 2);
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    const dw0 = -2 * (1 - w0) - 400 * w0 * (w1 - w0 * w0);
    const dw1 = 200 * (w1 - w0 * w0);
    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0, w1] = w;
    const h00 = 2 + 1200 * w0 * w0 - 400 * w1;
    const h01 = -400 * w0;
    const h10 = -400 * w0;
    const h11 = 200;
    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-2, 2],
    w1: [-1, 3],
  },
};
