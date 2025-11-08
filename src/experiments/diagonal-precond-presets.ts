import { ExperimentPreset } from '../types/experiments';

export const diagonalPrecondExperiments: ExperimentPreset[] = [
  {
    id: 'diag-precond-aligned-success',
    name: 'Success: Aligned with Axes',
    description: 'Ellipse aligned with axes - diagonal preconditioner is perfect!',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Converges in 1-2 iterations! D=diag(1/H₀₀, 1/H₁₁) perfectly inverts diagonal Hessian',
    ui: {
      tone: 'green',
    },
  },
  {
    id: 'diag-precond-rotated-failure',
    name: 'Failure: Rotated Problem',
    description: 'Ellipse rotated 45° - diagonal preconditioner struggles!',
    problem: 'quadratic',
    rotationAngle: 45,
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Takes 40+ iterations! Hessian has off-diagonal terms that D cannot capture',
    ui: {
      tone: 'red',
    },
  },
  {
    id: 'diag-precond-circular',
    name: 'Demo: No Rotation Dependence on Circular Bowl',
    description: 'Circular problem (κ=1) has no preferred direction',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Even diagonal precond works well on circular problem - all methods converge similarly',
    ui: {
      tone: 'gray',
    },
  },
];
