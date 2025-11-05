import { ExperimentPreset } from '../types/experiments';

export const gdLinesearchExperiments: ExperimentPreset[] = [
  {
    id: 'gd-ls-success',
    name: 'Success: Automatic Adaptation',
    description: 'Line search automatically finds good step sizes',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Step size adapts to landscape, converges robustly',
  },
  {
    id: 'gd-ls-c1-too-small',
    name: 'Failure: C1 Too Small',
    description: 'C1=0.00001 accepts poor steps, slow convergence',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.00001,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Accepts steps with minimal decrease, wastes iterations',
  },
  {
    id: 'gd-ls-c1-too-large',
    name: 'Failure: C1 Too Large',
    description: 'C1=0.5 is too conservative, rejects good steps',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.5,
      lambda: 0,
      maxIter: 100,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Too conservative, tiny steps, slow progress',
  },
  {
    id: 'gd-ls-varying-curvature',
    name: 'Advantage: Varying Curvature',
    description: 'Line search handles landscape changes that break fixed step',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 200,
    },
    initialPoint: [-1.5, 2],
    expectation: 'Observe: Adapts to narrow valley, fixed step would fail here',
  },
];
