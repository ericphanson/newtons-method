// src/stories/step-size-evolution.ts
import { Story } from './types';

export const stepSizeEvolution: Story = {
  id: 'step-size-evolution',
  title: 'Step Size Evolution: From Fixed to Adaptive',
  description: 'See how optimizers evolved from fixed step sizes to curvature-aware methods through progressively harder problems.',
  steps: [
    {
      experimentId: 'gd-fixed-ill-conditioned',
      narrative: 'Fixed step size struggles on ill-conditioned problems (where dimensions have vastly different curvatures). Watch the severe zig-zagging - the optimizer overshoots in steep directions while making tiny progress in flat ones.'
    },
    {
      experimentId: 'gd-linesearch-ill-conditioned',
      narrative: 'Line search adapts the global step size each iteration by searching along the gradient direction. Notice how this reduces oscillation and stabilizes the path, but convergence is still slow because all dimensions share one step size.'
    },
    {
      experimentId: 'diag-precond-aligned-success',
      narrative: 'Diagonal preconditioning gives each coordinate its own step size, estimated from the diagonal of the Hessian (per-dimension curvature). When the problem axes align with coordinate axes, this works beautifully - watch the optimizer take nearly optimal steps!'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'But rotate the same problem 45°, and diagonal preconditioning fails! The Hessian has large off-diagonal entries, capturing how dimensions interact. Diagonal methods ignore this coupling, so the optimizer still zig-zags despite per-coordinate adaptation.'
    },
    {
      experimentId: 'newton-rotated-quadratic',
      narrative: 'Newton\'s method uses the full inverse Hessian H⁻¹, capturing all pairwise dimension interactions. This transforms the problem into a perfect sphere, enabling it to handle arbitrary rotations. Watch it converge in just a few near-perfect steps!'
    }
  ]
};

/**
 * NOTE: The experiment ID 'gd-linesearch-ill-conditioned' may not exist yet.
 * If Task 14 verification finds it missing, you'll need to create it.
 * See Task 14 for the complete experiment definition to add.
 */
