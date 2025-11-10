import { ProblemDefinition } from '../types/experiments';
import { InlineMath } from '../components/Math';

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
