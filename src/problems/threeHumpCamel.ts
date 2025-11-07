import { ProblemDefinition } from '../types/experiments';

// Three-Hump Camel function: f(w) = 2w0^2 - 1.05w0^4 + w0^6/6 + w0·w1 + w1^2
// Classic multimodal test function with three local minima (one global, two local)
// Demonstrates asymmetric basins of convergence
//
// The three minima are:
//   1. Global minimum: (0, 0) → f = 0
//   2. Local minimum: approximately (1.7, -0.85) → f ≈ 2.1 (small positive)
//   3. Local minimum: approximately (-1.7, 0.85) → f ≈ 2.1 (small positive)
//
// This function is valuable for studying:
// - Asymmetric basin structures (global vs local minima)
// - How basin size relates to minimum depth
// - Competition between attractors of different quality
// - Polynomial optimization landscape with multiple valleys
export const threeHumpCamelProblem: ProblemDefinition = {
  name: 'Three-Hump Camel',
  description: 'Multimodal polynomial with 1 global + 2 local minima, asymmetric basins',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    // f(w) = 2w0^2 - 1.05w0^4 + w0^6/6 + w0·w1 + w1^2
    return 2 * w0 * w0
         - 1.05 * Math.pow(w0, 4)
         + Math.pow(w0, 6) / 6
         + w0 * w1
         + w1 * w1;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    // ∂f/∂w0 = 4w0 - 4.2w0^3 + w0^5 + w1
    // ∂f/∂w1 = w0 + 2w1
    const dw0 = 4 * w0 - 4.2 * Math.pow(w0, 3) + Math.pow(w0, 5) + w1;
    const dw1 = w0 + 2 * w1;

    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0, _w1] = w;
    // ∂²f/∂w0² = 4 - 12.6w0^2 + 5w0^4
    // ∂²f/∂w0∂w1 = 1
    // ∂²f/∂w1∂w0 = 1
    // ∂²f/∂w1² = 2
    const h00 = 4 - 12.6 * w0 * w0 + 5 * Math.pow(w0, 4);
    const h01 = 1;
    const h10 = 1;
    const h11 = 2;

    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-5, 5],
    w1: [-5, 5],
  },

  // Global minimum at origin
  globalMinimum: [0, 0],  // f(0, 0) = 0
};
