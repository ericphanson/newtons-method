import { norm, scale, add } from '../shared-utils';
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary, ConvergenceCriterion } from './types';
import { getTerminationMessage } from './terminationUtils';

export interface GradientDescentIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
}

// Backward compatibility alias
export type GDIteration = GradientDescentIteration;

/**
 * Gradient Descent with fixed step size
 *
 * Simple first-order optimization: w_new = w_old - alpha * grad
 *
 * @param problem Problem definition with objective, gradient, and dimensionality
 * @param options Algorithm options including maxIter, alpha, and optional initial point
 * @returns Array of iteration objects tracking the optimization trajectory
 */
export const runGradientDescent = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { alpha: number; lambda?: number }
): AlgorithmResult<GradientDescentIteration> => {
  const { maxIter, alpha, lambda = 0, initialPoint, tolerance = 1e-6 } = options;
  const iterations: GradientDescentIteration[] = [];

  // Note: lambda is accepted for API consistency but unused here since
  // regularization is already baked into ProblemFunctions
  void lambda;

  // Initialize weights based on dimensionality
  let w = initialPoint || (problem.dimensionality === 3
    ? [0.1, 0.1, 0.0]
    : [0.1, 0.1]);

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Steepest descent direction
    const direction = scale(grad, -1);

    // Fixed step size update
    const wNew = add(w, scale(direction, alpha));
    const newLoss = problem.objective(wNew);

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      direction,
      alpha,
      wNew: [...wNew],
      newLoss
    });

    w = wNew;

    // Early stopping if converged
    if (gradNorm < tolerance) {
      break;
    }
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  const converged = finalGradNorm < tolerance;
  const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

  let convergenceCriterion: ConvergenceCriterion;
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const terminationMessage = getTerminationMessage(convergenceCriterion, {
    gradNorm: finalGradNorm,
    gtol: tolerance,
    iters: iterations.length,
    maxIter
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled: false, // GD with fixed step doesn't have stalling detection yet
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion,
    terminationMessage
  };

  return { iterations, summary };
};
