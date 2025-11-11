import { ExperimentPreset } from '../types/experiments';

export const lbfgsExperiments: ExperimentPreset[] = [
  {
    id: 'lbfgs-success-quadratic',
    name: 'Success: Strongly Convex Problem',
    description: 'Fast Newton-like convergence without computing Hessian',
    algorithm: 'lbfgs',
    problem: 'quadratic',
    problemParameters: { kappa: 5, rotationAngle: 0 },
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      m: 10,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Fast convergence similar to Newton, memory pairs build curvature info',
    ui: {
      tone: 'amber',
    },
  },
  {
    id: 'lbfgs-memory-comparison',
    name: 'Memory Matters: M=3 vs M=10',
    description: 'Compare different memory sizes on same problem',
    algorithm: 'lbfgs',
    problem: 'quadratic',
    problemParameters: { kappa: 100, rotationAngle: 0 },
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 3,
      maxIter: 50,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'With M=3: less accurate approximation, more iterations. Try M=10 for comparison.',
    ui: {
      tone: 'blue',
    },
  },
  {
    id: 'lbfgs-rosenbrock',
    name: 'Challenge: Rosenbrock Valley',
    description: 'Non-convex problem tests quasi-Newton approximation',
    algorithm: 'lbfgs',
    problem: 'rosenbrock',
    problemParameters: { rosenbrockB: 100 },
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 10,
      maxIter: 50,
    },
    initialPoint: [-1, 1],
    expectation: 'Observe: Superlinear convergence once near valley, memory adapts to local curvature',
    ui: {
      tone: 'purple',
    },
  },
  {
    id: 'lbfgs-quadratic-rotated',
    name: 'Rotated Ellipse: Building Curvature Memory',
    description: 'Watch L-BFGS incrementally learn the rotated problem structure',
    algorithm: 'lbfgs',
    problem: 'quadratic',
    problemParameters: { kappa: 5, rotationAngle: 45 },
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 5,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Early iterations use steepest descent, then memory builds up and approximation improves',
    ui: {
      tone: 'purple',
    },
  },
  {
    id: 'lbfgs-himmelblau-success',
    name: 'Success: Himmelblau Basin of Convergence',
    description: 'L-BFGS finds 4 correct minima, converges from all initial points',
    algorithm: 'lbfgs',
    problem: 'himmelblau',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      m: 10,
      maxIter: 50,
    },
    initialPoint: [2.611, 0],
    expectation: 'Observe: 4 clean basins of convergence, no saddle points, converges everywhere. By approximating only positive curvature, L-BFGS avoids Newton\'s failure modes.',
    ui: {
      tone: 'green',
      openPanels: ['configuration'],
    },
  },
];
