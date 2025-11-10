// src/stories/step-size-evolution.ts
import { Story } from './types';

export const stepSizeEvolution: Story = {
  id: 'step-size-evolution',
  title: 'Step Size Evolution: From Fixed to Adaptive',
  description: 'See how optimizers evolved from fixed step sizes to curvature-aware methods through progressively harder problems.',
  steps: [
    {
      experimentId: 'gd-fixed-ill-conditioned',
      narrative: 'Fixed step size struggles on ill-conditioned problems - notice the severe zig-zagging.'
    },
    {
      experimentId: 'gd-linesearch-ill-conditioned',
      narrative: 'Line search adapts step size per iteration, reducing zig-zag but still slow.'
    },
    {
      experimentId: 'diag-precond-aligned-success',
      narrative: 'Diagonal preconditioning: per-coordinate step sizes work perfectly when aligned with axes!'
    },
    {
      experimentId: 'diag-precond-rotated-failure',
      narrative: 'But diagonal fails on rotated problems - we need off-diagonal Hessian information.'
    },
    {
      experimentId: 'newton-rotated-quadratic',
      narrative: 'Full Newton uses complete H⁻¹ to handle rotation - converges in just a few steps.'
    }
  ]
};

/**
 * NOTE: The experiment ID 'gd-linesearch-ill-conditioned' may not exist yet.
 * If Task 14 verification finds it missing, you'll need to create it.
 * See Task 14 for the complete experiment definition to add.
 */
