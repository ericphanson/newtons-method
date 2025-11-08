import { ExperimentPreset } from '../types/experiments';

export const newtonExperiments: ExperimentPreset[] = [
  {
    id: 'newton-success-quadratic',
    name: 'Success: Strongly Convex Quadratic',
    description: 'Watch quadratic convergence in 1-2 iterations on a simple bowl',
    problem: 'quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.1,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: 1-2 iterations to convergence, all eigenvalues positive, α=1 accepted',
    ui: {
      tone: 'blue',
    },
  },
  {
    id: 'newton-failure-saddle',
    name: 'Failure: Non-Convex Saddle Point',
    description: 'Start near a saddle to see Hessian with negative eigenvalue',
    problem: 'non-convex-saddle',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [0.5, 0.5],
    expectation: 'Observe: Hessian has one negative eigenvalue, Newton direction may be ascent',
    ui: {
      tone: 'red',
    },
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
    ui: {
      tone: 'green',
    },
  },
  {
    id: 'newton-compare-ill-conditioned',
    name: 'Compare: Newton vs GD on Ill-Conditioned',
    description: 'Elongated ellipse where GD zig-zags but Newton excels',
    problem: 'ill-conditioned-quadratic',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [0.3, 2.5],
    expectation: 'Observe: Newton converges in ~5 iterations (GD would take 100+)',
    ui: {
      tone: 'purple',
      details:
        'Why Newton wins: Even with line search, GD uses one α per iteration. Newton uses H⁻¹ to scale each direction, so it walks straight down the valley.',
    },
  },
  {
    id: 'newton-rotated-quadratic',
    name: 'Demo: Why a Vector of αs Isn\'t Enough',
    description: 'Rotated ellipse - valley runs diagonally, no per-coordinate step sizes can align with it',
    problem: 'quadratic',
    rotationAngle: 45,
    hyperparameters: {
      c1: 0.0001,
      lambda: 0,
      maxIter: 50,
    },
    initialPoint: [2, 2],
    expectation: 'Observe: Newton\'s H⁻¹ automatically rotates the step to point down the valley',
    ui: {
      tone: 'amber',
    },
  },
  {
    id: 'newton-perceptron-failure',
    name: 'Failure: Perceptron with No Safeguards',
    description: 'Perceptron with no line search or damping - full Newton step explodes loss',
    problem: 'separating-hyperplane',
    separatingHyperplaneVariant: 'perceptron',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.0001,
      maxIter: 50,
      hessianDamping: 0,
      lineSearch: 'none',
    },
    initialPoint: [0.5, 0.5, 0.0],
    expectation: 'Newton direction is 10,000x gradient magnitude, oscillates wildly, never converges',
    ui: {
      tone: 'orange',
      relatedActions: [
        {
          label: 'Workaround: Line search',
          targetId: 'newton-perceptron-damping-fix',
          tone: 'amber',
        },
        {
          label: 'Workaround: Hessian damping',
          targetId: 'newton-perceptron-hessian-damping',
          tone: 'amber',
        },
      ],
      footnote: '⚠️ Both workarounds just hide the issue. Use GD or L-BFGS instead.',
    },
  },
  {
    id: 'newton-perceptron-damping-fix',
    name: 'Workaround: Line Search',
    description: 'Line search shrinks huge Newton steps but just obscures the underlying problem',
    problem: 'separating-hyperplane',
    separatingHyperplaneVariant: 'perceptron',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.0001,
      maxIter: 50,
      hessianDamping: 0,
      lineSearch: 'armijo',
    },
    initialPoint: [0.5, 0.5, 0.0],
    expectation: 'Line search prevents explosion but Newton still struggles - takes many iterations with tiny steps',
    ui: {
      tone: 'amber',
      hidden: true,
    },
  },
  {
    id: 'newton-perceptron-hessian-damping',
    name: 'Workaround: Hessian Damping',
    description: 'Hessian damping prevents huge steps but still fundamentally unsuited for perceptron',
    problem: 'separating-hyperplane',
    separatingHyperplaneVariant: 'perceptron',
    hyperparameters: {
      c1: 0.0001,
      lambda: 0.0001,
      maxIter: 50,
      hessianDamping: 1.0,
      lineSearch: 'none',
    },
    initialPoint: [0.5, 0.5, 0.0],
    expectation: 'Damping masks symptoms but Newton remains inefficient - better to use GD or L-BFGS',
    ui: {
      tone: 'amber',
      hidden: true,
    },
  },
];
