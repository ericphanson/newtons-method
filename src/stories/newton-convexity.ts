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
      narrative: 'Eigenvalues: λ₁≈100, λ₂≈1 - still both positive! The condition number Q(H)=100 slows convergence to ~5 iterations, but strong convexity preserves the guarantee. Newton still walks straight down the valley.',
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
      experimentId: 'newton-himmelblau-failure',
      narrative: 'Now the ultimate challenge: Himmelblau\'s function has 4 global minima (all at f=0), but also saddle points. Can Newton distinguish true minima from saddles in this complex multimodal landscape?',
      scrollTo: 'problem'
    },
    {
      experimentId: 'newton-himmelblau-failure',
      narrative: 'Without eigenvalue checking, Newton converges to 8 "attractors" instead of 4 - half are saddle points! The basin of convergence plot shows regions where Newton fails to converge. This is Newton\'s Achilles heel: it finds critical points (∇f=0) but can\'t tell minima from saddles.',
      scrollTo: 'basin-of-convergence'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'L-BFGS solves this beautifully: 4 clean basins, convergence everywhere, no saddles. By approximating only positive curvature (sTy > 0 check), quasi-Newton methods filter out the indefinite Hessian regions that mislead pure Newton. More conservative curvature approximation is sometimes better than exact!',
      scrollTo: 'basin-of-convergence'
    }
  ]
};
