import { ExperimentPreset } from '../types/experiments';

export const gdLinesearchExperiments: ExperimentPreset[] = [
  {
    id: 'gd-ls-success',
    name: 'Success: Automatic Adaptation',
    description: 'Line search automatically finds good step sizes',
    algorithm: 'gd-linesearch',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Step size adapts to landscape, converges robustly',
    ui: {
      tone: 'teal',
    },
  },
  {
    id: 'gd-ls-c1-too-small',
    name: 'Failure: c₁ Too Small (1e-5)',
    description: 'c₁ = 0.00001 accepts poor steps, slow convergence',
    algorithm: 'gd-linesearch',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.00001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Accepts steps with minimal decrease, wastes iterations',
    ui: {
      tone: 'orange',
    },
  },
  {
    id: 'gd-ls-c1-too-large',
    name: 'Failure: c₁ Too Large (0.5)',
    description: 'c₁ = 0.5 is too conservative, rejects good steps',
    algorithm: 'gd-linesearch',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.5,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Too conservative, tiny steps, slow progress',
    ui: {
      tone: 'red',
    },
  },
  {
    id: 'gd-ls-varying-curvature',
    name: 'Advantage: Varying Curvature',
    description: 'Line search handles landscape changes that break fixed step',
    algorithm: 'gd-linesearch',
    problem: 'rosenbrock',
    problemParameters: { rosenbrockB: 100 },
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [-1.5, 2],
    expectation: 'Observe: Adapts to narrow valley, fixed step would fail here',
    ui: {
      tone: 'purple',
    },
  },
  {
    id: 'gd-linesearch-ill-conditioned',
    name: 'Line Search on Ill-Conditioned Quadratic',
    description: 'Armijo line search adapts step size per iteration but convergence still slow on κ=100',
    algorithm: 'gd-linesearch',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      maxIter: 100,
    },
    initialPoint: [2, 2],
    expectation: 'Line search reduces zig-zag compared to fixed step, but convergence still slow due to condition number',
    ui: {
      tone: 'orange',
    },
  },
];
