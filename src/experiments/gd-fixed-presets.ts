import { ExperimentPreset } from '../types/experiments';

export const gdFixedExperiments: ExperimentPreset[] = [
  {
    id: 'gd-fixed-success',
    name: 'Success: Good Step Size (α=0.1)',
    description: 'Well-chosen α leads to smooth convergence',
    problem: 'quadratic',
    hyperparameters: {
      alpha: 0.1,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Steady decrease in loss, smooth trajectory toward minimum',
    ui: {
      tone: 'green',
    },
  },
  {
    id: 'gd-fixed-diverge',
    name: 'Failure: Step Size Too Large (α=2.5)',
    description: 'α=2.5 exceeds stability limit and causes divergence',
    problem: 'quadratic',
    hyperparameters: {
      alpha: 2.5,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Loss spikes, trajectory bounces around valley and diverges',
    ui: {
      tone: 'red',
    },
  },
  {
    id: 'gd-fixed-too-small',
    name: 'Failure: Step Size Too Small (α=0.001)',
    description: 'α=0.001 leads to extremely slow convergence',
    problem: 'quadratic',
    hyperparameters: {
      alpha: 0.001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Tiny progress per step, would take thousands of iterations',
    ui: {
      tone: 'orange',
    },
  },
  {
    id: 'gd-fixed-ill-conditioned',
    name: 'Struggle: Ill-Conditioned Problem',
    description: 'Elongated ellipse causes zig-zagging',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      alpha: 0.01,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Zig-zag pattern perpendicular to contours, slow convergence',
    ui: {
      tone: 'purple',
    },
  },
];
