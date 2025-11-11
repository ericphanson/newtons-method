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
      narrative: 'L-BFGS succeeds! Clean convergence to all 4 true minima, no saddle point confusion. The secret: L-BFGS never explicitly computes the Hessian. Instead, it approximates H⁻¹ by remembering a history of curvature observations - with a crucial filter.',
      scrollTo: 'basin-of-convergence'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'As iterations progress, L-BFGS stores (s, y) pairs: s is the step taken, y is how the gradient changed. Scroll to the Curvature Pair Memory table to see this history.',
      scrollTo: 'lbfgs-memory'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'Notice the "sᵀy > 0?" column - this is L-BFGS\'s gatekeeping criterion. Only pairs with positive curvature (sᵀy > 0) are accepted. Why? Because negative curvature indicates saddle regions where Newton-like steps would fail. By filtering these out, L-BFGS\'s approximate Hessian B stays positive definite.',
      scrollTo: 'lbfgs-memory'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'The table shows both accepted (✓) and rejected (✗) pairs. Active memory only keeps the last M=10 accepted pairs (highlighted in amber). This selective memory ensures robustness in non-convex regions - it won\'t perfectly match the true Hessian, but it won\'t be misled by negative curvature either.',
      scrollTo: 'lbfgs-memory'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'So we understand WHY L-BFGS is robust: selective memory of positive curvature. But what is it actually approximating? The Approximate Hessian Comparison shows the true Hessian H of Himmelblau versus L-BFGS\'s reconstructed B. Watch how L-BFGS builds a positive definite approximation even when H has negative eigenvalues.',
      scrollTo: 'approximate-hessian'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'Notice the eigenvalues: the true Hessian H at this point may have negative eigenvalues (indicating saddle region), but L-BFGS\'s approximate B keeps all eigenvalues positive. This is the filtering in action - by rejecting negative curvature pairs, B stays positive definite and points downhill.',
      scrollTo: 'approximate-hessian'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'But HOW does L-BFGS compute B⁻¹∇f without ever forming the matrix B? The answer is the Two-Loop Recursion algorithm. It implicitly applies M rank-2 updates, building up the quasi-Newton direction from just the stored (s,y) vectors.',
      scrollTo: 'two-loop-recursion'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'Watch how L-BFGS navigates from the origin toward one of the four minima. Early steps are more exploratory, but as memory accumulates, the algorithm adapts to the local curvature and converges rapidly.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'The convergence metrics show superlinear convergence once near the minimum - nearly as fast as Newton\'s method, but without computing or inverting the Hessian. This is the power of quasi-Newton: second-order speed from first-order information.',
      scrollTo: 'metrics'
    },
    {
      experimentId: 'lbfgs-himmelblau-success',
      narrative: 'Return to the basin of convergence. L-BFGS achieves what Newton couldn\'t: robust convergence to true minima from all starting points. By remembering only positive curvature and using the two-loop recursion, L-BFGS combines Newton-like efficiency with gradient descent\'s stability.',
      scrollTo: 'basin-of-convergence'
    }
  ]
};
