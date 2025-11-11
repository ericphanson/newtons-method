// src/stories/newton-convexity.ts
import { Story } from './types';

export const newtonConvexity: Story = {
  id: 'newton-convexity',
  title: 'Newton\'s Method: Reading the Hessian',
  description: 'Explore how eigenvalues reveal when Newton excels on strongly convex problems and fails catastrophically on non-convex landscapes.',
  steps: [
    {
      experimentId: 'newton-success-quadratic',
      narrative: 'After seeing Newton triumph in the step-size story, let\'s peek under the hood. What makes Newton so powerful? The secret is in the Hessian matrix - the full curvature information at each point.',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-success-quadratic',
      narrative: 'Check the Hessian eigenvalues in the metrics: λ₁=5.0, λ₂=1.0 - both positive! This positive definiteness guarantees every Newton direction points downhill. Strong convexity equals guaranteed descent.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-compare-ill-conditioned',
      narrative: 'Now we elongate the ellipse 100×, creating harsh ill-conditioning. The valley becomes extremely narrow. Will strong convexity survive this stress test?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-compare-ill-conditioned',
      narrative: 'Eigenvalues: λ₁≈100, λ₂≈1 - still both positive! The condition number κ(H)=100 slows convergence to ~5 iterations, but strong convexity preserves the guarantee. Newton still walks straight down the valley.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-perceptron-singular',
      narrative: 'Now a piecewise linear loss: the perceptron without regularization. The loss has zero curvature everywhere - no second-order information exists. What happens when H = 0?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-perceptron-singular',
      narrative: 'The Hessian is exactly [[0, 0], [0, 0]] - a singular matrix! Eigenvalues are both zero. Newton cannot invert this, so it falls back to gradient descent. When there\'s no curvature information, Newton offers no advantage.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Now for the ultimate test: f(w)=w₀²-w₁². This is a hyperbolic paraboloid - curved upward in one direction, downward in the other. At the origin, the gradient is zero, but is it a minimum?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Look at the eigenvalues: λ₁=2.0, λ₂=-2.0. One positive, one NEGATIVE! This indefinite Hessian is the signature of a saddle point, not a minimum.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Newton converges to the saddle in 2 iterations - gradient is zero, so Newton thinks it succeeded! But the negative eigenvalue proves this is NOT a minimum. Newton finds critical points (∇f=0) but can\'t tell minima from saddles without checking eigenvalue signs. Quasi-Newton methods handle this better by only approximating positive curvature...',
      scrollTo: 'canvas'
    }
  ]
};
