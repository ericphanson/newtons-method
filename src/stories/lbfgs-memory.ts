// src/stories/lbfgs-memory.ts
import { Story } from './types';

export const lbfgsMemory: Story = {
  id: 'lbfgs-memory',
  title: 'L-BFGS: Building a Positive Definite Hessian from Memory',
  description: 'See how L-BFGS selectively remembers only positive curvature pairs, building a robust approximation that stays positive definite even when the true Hessian isn\'t.',
  steps: [
    {
      experimentId: 'newton-himmelblau-failure',
      narrative: 'Recall Newton\'s failure on Himmelblau: it converges to saddle points because it trusts the full Hessian, including negative eigenvalues. How does L-BFGS avoid this trap?',
      scrollTo: 'basin-of-convergence'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'L-BFGS succeeds by never explicitly computing the Hessian. Instead, it approximates H⁻¹ by remembering a history of curvature observations - but with a crucial filter.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'lbfgs-rosenbrock',
      narrative: 'Let\'s examine L-BFGS\'s memory mechanism on Rosenbrock\'s valley - a classic curved non-convex problem. As iterations progress, L-BFGS stores (s, y) pairs: s is the step taken, y is how the gradient changed.',
      scrollTo: 'problem'
    },
    {
      experimentId: 'lbfgs-rosenbrock',
      narrative: 'Scroll to the Curvature Pair Memory table. Notice the "sᵀy > 0?" column - this is L-BFGS\'s gatekeeping criterion. Only pairs with positive curvature (sᵀy > 0) are accepted into memory. Why? Because negative curvature indicates non-convex regions where Newton-like steps would fail.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'lbfgs-rosenbrock',
      narrative: 'The table shows both accepted (✓) and rejected (✗) pairs in gray. Active memory only keeps the last M=5 accepted pairs (highlighted in amber). This selective memory ensures L-BFGS\'s approximation remains positive definite even in non-convex regions.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'lbfgs-rosenbrock',
      narrative: 'The Two-Loop Recursion shows how L-BFGS uses memory. It starts with a simple scaled identity H₀ = (1/γ)I, then each memory pair adds a rank-2 correction. The first loop modifies the gradient backward through memory, the second loop applies corrections forward.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'lbfgs-success-quadratic',
      narrative: 'Let\'s see the Hessian comparison on a simple convex quadratic where the true Hessian is known. This visualization is only possible in 2D - L-BFGS never actually builds this matrix in practice!',
      scrollTo: 'problem'
    },
    {
      experimentId: 'lbfgs-success-quadratic',
      narrative: 'The Approximate Hessian Comparison shows the true H versus L-BFGS\'s reconstructed approximation B. Notice the eigenvalues: L-BFGS\'s approximation has both positive (λ₁=1.09, λ₂=4.60) even though it\'s not perfect. The Frobenius error measures approximation quality.',
      scrollTo: 'approximate-hessian'
    },
    {
      experimentId: 'lbfgs-quadratic-rotated',
      narrative: 'On a rotated ellipse, L-BFGS needs more iterations to build up memory. Early iterations have no memory yet, so it starts with steepest descent (-∇f). As memory accumulates, the approximation improves.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'lbfgs-quadratic-rotated',
      narrative: 'By iteration 5, L-BFGS has built up 5 curvature pairs. The Hessian approximation now captures the rotation and curvature well. This is the power of L-BFGS: incrementally building second-order information from gradient observations alone.',
      scrollTo: 'approximate-hessian'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'Back to Himmelblau: L-BFGS\'s selective memory (only sᵀy > 0 pairs) means its approximate Hessian is always positive definite. This conservative approximation trades exactness for robustness - it won\'t perfectly match H in non-convex regions, but it won\'t be misled by negative curvature either.',
      scrollTo: 'basin-of-convergence'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'The result: clean convergence to all 4 true minima, no saddle point confusion. L-BFGS proves that sometimes approximating only the positive part of reality is smarter than trusting the full truth. Memory + selective filtering = robustness.',
      scrollTo: 'canvas'
    }
  ]
};
