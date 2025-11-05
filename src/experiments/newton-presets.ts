import { ExperimentPreset } from '../types/experiments';

export const newtonExperiments: ExperimentPreset[] = [
  {
    id: 'newton-compare',
    name: 'Compare: Newton vs GD',
    description: 'Side-by-side: Newton method vs gradient descent',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 20,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Newton converges in ~5 iterations, GD would take 100+',
    comparisonConfig: {
      left: { algorithm: 'newton', c1: 0.0001 },
      right: { algorithm: 'gd-linesearch', c1: 0.0001 },
    },
  },
  {
    id: 'newton-success-quadratic',
    name: 'Success: Strongly Convex Quadratic',
    description: 'Watch quadratic convergence in 1-2 iterations on a simple bowl',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      maxIter: 10,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: 1-2 iterations to convergence, all eigenvalues positive, α=1 accepted',
  },
  {
    id: 'newton-failure-saddle',
    name: 'Failure: Saddle Point with Negative Eigenvalue',
    description: 'Start at saddle point to see Hessian with negative eigenvalue',
    problem: 'non-convex-saddle',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 20,
    },
    initialPoint: [0.5, 0.5],
    expectation: 'Observe: Hessian has one negative eigenvalue, Newton direction may be ascent',
  },
  {
    id: 'newton-fixed-linesearch',
    name: 'Fixed: Line Search Rescue',
    description: 'Same non-convex problem but line search prevents divergence',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [-1.5, 2],
    expectation: 'Observe: Backtracking reduces α, prevents divergence, acts like damped Newton',
  },
  {
    id: 'newton-compare-ill-conditioned',
    name: 'Compare: Newton vs GD on Ill-Conditioned',
    description: 'Elongated ellipse where GD zig-zags but Newton excels',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 20,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Newton converges in ~5 iterations (GD would take 100+)',
  },
];
