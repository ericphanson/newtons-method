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
      experimentId: 'newton-perceptron-damping-fix',
      narrative: 'Now a piecewise linear loss: the perceptron. The loss itself has zero curvature (H=0), so the ONLY curvature comes from L2 regularization: H = λI where λ=0.0001. What happens when the Hessian is this uninformative?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-perceptron-damping-fix',
      narrative: 'Eigenvalues are exactly λ = 0.0001. Technically positive definite (convex!), but H⁻¹ = (1/λ)I amplifies the gradient by 10,000×! Even with line search to rescue the huge steps, Newton gains no advantage over gradient descent here.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Now for the ultimate test: f(w)=w₀²-w₁². This is a hyperbolic paraboloid - curved upward in one direction, downward in the other. At the origin, the gradient is zero, but is it a minimum?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Look at the eigenvalues: λ₁=2.0, λ₂=-2.0. One positive, one NEGATIVE! This indefinite Hessian is the signature of a saddle point, not a minimum. The gradient is zero, but we\'re not at the bottom.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'newton-failure-saddle',
      narrative: 'Watch Newton diverge! The negative eigenvalue λ₂=-2 means H⁻¹ flips that direction - the Newton step ascends instead of descending. Without positive definiteness, Newton has no safety net. Quasi-Newton methods solve this by approximating only positive curvature...',
      scrollTo: 'canvas'
    }
  ]
};
