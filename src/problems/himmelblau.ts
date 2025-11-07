import { ProblemDefinition } from '../types/experiments';

// Himmelblau's function: f(w) = (w0^2 + w1 - 11)^2 + (w0 + w1^2 - 7)^2
// Classic multimodal test function with four global minima (all f = 0)
// Creates beautiful symmetric basins of convergence with fractal-like boundaries
//
// The four equivalent global minima are:
//   1. (3.0, 2.0)          → f = 0
//   2. (-2.805118, 3.131312) → f = 0
//   3. (-3.779310, -3.283186) → f = 0
//   4. (3.584428, -1.848126) → f = 0
//
// This function is valuable for studying basin boundaries in Newton's method:
// - All minima are equally deep (symmetric problem)
// - Basin boundaries form complex patterns
// - Demonstrates sensitivity to initial conditions
// - Named after David Mautner Himmelblau (1972)
export const himmelblauProblem: ProblemDefinition = {
  name: "Himmelblau's Function",
  description: 'Multimodal function with 4 equivalent minima, creates symmetric basin boundaries',

  objective: (w: number[]): number => {
    const [w0, w1] = w;
    const term1 = w0 * w0 + w1 - 11;
    const term2 = w0 + w1 * w1 - 7;
    return term1 * term1 + term2 * term2;
  },

  gradient: (w: number[]): number[] => {
    const [w0, w1] = w;
    // Compute intermediate terms
    const term1 = w0 * w0 + w1 - 11;  // (w0^2 + w1 - 11)
    const term2 = w0 + w1 * w1 - 7;   // (w0 + w1^2 - 7)

    // Apply chain rule:
    // ∂f/∂w0 = 2(w0^2 + w1 - 11) · 2w0 + 2(w0 + w1^2 - 7) · 1
    // ∂f/∂w1 = 2(w0^2 + w1 - 11) · 1 + 2(w0 + w1^2 - 7) · 2w1
    const dw0 = 4 * w0 * term1 + 2 * term2;
    const dw1 = 2 * term1 + 4 * w1 * term2;

    return [dw0, dw1];
  },

  hessian: (w: number[]): number[][] => {
    const [w0, w1] = w;
    const term1 = w0 * w0 + w1 - 11;
    const term2 = w0 + w1 * w1 - 7;

    // Second derivatives (using product rule on gradient):
    // ∂²f/∂w0² = 4 · 2w0 · 2w0 + 4(w0^2 + w1 - 11) + 0
    //          = 8w0^2 + 4(w0^2 + w1 - 11) + 2
    // ∂²f/∂w0∂w1 = 4 · 2w0 · 1 + 4 · 1 · 2w1
    //            = 4w0 + 4w1
    // ∂²f/∂w1² = 2 + 4 · 2w1 · 2w1 + 4(w0 + w1^2 - 7)
    //          = 2 + 8w1^2 + 4(w0 + w1^2 - 7)
    const h00 = 12 * w0 * w0 - 4 * term1 + 2;
    const h01 = 4 * w0 + 4 * w1;
    const h10 = h01;  // Hessian is symmetric
    const h11 = 12 * w1 * w1 + 4 * term2 + 2;

    return [[h00, h01], [h10, h11]];
  },

  domain: {
    w0: [-6, 6],
    w1: [-6, 6],
  },

  // Return one of the four global minima (they're all equivalent at f=0)
  globalMinimum: [3.0, 2.0],
};
