import { ExperimentPreset } from '../types/experiments';

export const lbfgsExperiments: ExperimentPreset[] = [
  {
    id: 'lbfgs-success-quadratic',
    name: 'Success: Strongly Convex Problem',
    description: 'Fast Newton-like convergence without computing Hessian',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      m: 10,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Fast convergence similar to Newton, memory pairs build curvature info',
  },
  {
    id: 'lbfgs-memory-comparison',
    name: 'Memory Matters: M=3 vs M=10',
    description: 'Compare different memory sizes on same problem',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 3,
      maxIter: 50,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'With M=3: less accurate approximation, more iterations. Try M=10 for comparison.',
  },
  {
    id: 'lbfgs-rosenbrock',
    name: 'Challenge: Rosenbrock Valley',
    description: 'Non-convex problem tests quasi-Newton approximation',
    problem: 'rosenbrock',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 10,
      maxIter: 50,
    },
    initialPoint: [-1, 1],
    expectation: 'Observe: Superlinear convergence once near valley, memory adapts to local curvature',
  },
];
