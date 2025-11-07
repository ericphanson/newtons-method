/**
 * Problem-specific default hyperparameters
 *
 * These defaults provide reasonable starting values that converge on most problems.
 * Users can still adjust to explore different behaviors (including divergence for learning).
 */

export interface ProblemDefaults {
  gdFixedAlpha: number;
  maxIter: number;
  initialPoint: [number, number] | [number, number, number];
  // Line search algorithms (GD-LS, Newton, L-BFGS) work well with same defaults
  c1: number;
  lbfgsM: number;
}

const DEFAULT_CONFIG: ProblemDefaults = {
  gdFixedAlpha: 0.1,
  maxIter: 50,
  initialPoint: [-1, 1],
  c1: 0.0001,
  lbfgsM: 5
};

/**
 * Get problem-specific defaults
 *
 * Key insights:
 * - Rosenbrock: steep gradients (coefficients 200, 400) need tiny steps
 *   Starting point [-0.5, 1.5] chosen to show interesting paths (Newton: ~18 iters, L-BFGS: ~36 iters)
 * - Ill-conditioned: elongated ellipse needs small steps to avoid oscillation
 *   Harder starting point [-2, 2] shows the conditioning challenges
 * - Quadratic: so well-conditioned that 2nd-order methods converge in ~2 iterations even from far away!
 *   This demonstrates their efficiency on convex problems
 * - Saddle: unbounded below, goes to -∞ (educational, not solvable)
 */
export function getProblemDefaults(problem: string): ProblemDefaults {
  switch (problem) {
    case 'rosenbrock':
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.001,  // Very small due to steep gradients
        maxIter: 50,          // Standard default
        initialPoint: [-0.5, 1.5]  // Harder starting point: all algos take >3 iterations
      };

    case 'ill-conditioned-quadratic':
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.01,    // Small to avoid oscillation
        maxIter: 50,          // Standard default
        initialPoint: [-2, 2]  // Challenging point for ill-conditioned problem
      };

    case 'non-convex-saddle':
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.1,
        maxIter: 50,          // Standard default
        initialPoint: [-1.5, 1.5]  // Symmetrical starting point
      };

    case 'himmelblau':
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.1,     // Standard works well
        maxIter: 50,
        initialPoint: [0, 0]   // Central point - could converge to any of 4 minima!
      };

    case 'three-hump-camel':
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.1,     // Standard works well
        maxIter: 50,
        initialPoint: [1, 0.5] // Starts in local minimum basin to show basin structure
      };

    case 'separating-hyperplane':
      return {
        gdFixedAlpha: 0.1,
        maxIter: 50,
        initialPoint: [0.2, 0.2, 0],  // 3D: [w0, w1, bias] - non-zero to ensure perceptron moves
        c1: 1e-4,
        lbfgsM: 10,
      };

    case 'quadratic':
    default:
      return {
        ...DEFAULT_CONFIG,
        gdFixedAlpha: 0.1,     // Standard works great on quadratic
        maxIter: 50,
        initialPoint: [-3, 3]  // Corners of domain for longer paths
      };
  }
}

/**
 * Get descriptive note about problem characteristics
 */
export function getProblemNote(problem: string): string {
  switch (problem) {
    case 'rosenbrock':
      return 'Steep gradients - GD needs very small α (try 0.001)';
    case 'ill-conditioned-quadratic':
      return 'Elongated valley - GD needs small α to avoid zigzagging';
    case 'non-convex-saddle':
      return 'Unbounded below - gradient methods diverge to -∞';
    case 'himmelblau':
      return 'Four equivalent global minima - basin visualization shows which starting points lead to each';
    case 'three-hump-camel':
      return 'One global + two local minima - larger basin for deeper minimum';
    case 'separating-hyperplane':
      return 'Finds optimal separating hyperplane. Try different variants to see how objective functions affect the solution.';
    case 'quadratic':
      return 'Well-conditioned - standard parameters work well';
    default:
      return '';
  }
}
