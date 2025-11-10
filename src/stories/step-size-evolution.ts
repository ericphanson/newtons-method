// src/stories/step-size-evolution.ts
import { Story } from './types';

export const stepSizeEvolution: Story = {
  id: 'step-size-evolution',
  title: 'Step Size Evolution: From Fixed to Adaptive',
  description: 'See how optimizers evolved from fixed step sizes to curvature-aware methods through progressively harder problems.',
  steps: [
    {
      experimentId: 'gd-fixed-ill-conditioned',
      narrative: 'Our first challenge: an ill-conditioned quadratic where one direction is 100× steeper than the other. This elongated ellipse reveals a fundamental limitation of fixed step sizes.',
      scrollTo: 'problem'
    },
    {
      experimentId: 'gd-fixed-ill-conditioned',
      narrative: 'Fixed gradient descent struggles badly - the step size that prevents overshooting in the steep direction is too small for the flat direction. Notice the severe zig-zagging as the optimizer bounces between walls of the valley.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'gd-linesearch-ill-conditioned',
      narrative: 'Line search improves this by adapting the global step size each iteration through Armijo backtracking. Watch how oscillations reduce and the path stabilizes - but convergence is still slow because all dimensions share one step size.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'diag-precond-aligned-success',
      narrative: 'Diagonal preconditioning solves this by giving each coordinate its own step size, estimated from the diagonal of the Hessian. Since our problem axes align with coordinate axes, this captures the per-dimension curvature perfectly!',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'Now we rotate the same ellipse 45°. The valley no longer aligns with our coordinate axes - it runs diagonally. This seemingly simple change will expose a fundamental limitation of diagonal methods.',
      scrollTo: 'configuration'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'Diagonal preconditioning fails! When rotated, the Hessian has large off-diagonal entries that capture how dimensions interact. Diagonal methods ignore this coupling, treating each dimension independently, so we\'re back to zig-zagging.',
      scrollTo: 'canvas'
    },
    {
      experimentId: 'newton-rotated-quadratic',
      narrative: 'Newton\'s method uses the full inverse Hessian H⁻¹, capturing all pairwise dimension interactions. This transforms the rotated ellipse into a perfect sphere locally, enabling the optimizer to step directly to the optimum in one iteration!',
      scrollTo: 'canvas'
    }
  ]
};
