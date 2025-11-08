import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary, ConvergenceCriterion } from './types';
import { armijoLineSearch } from '../line-search/armijo';
import { norm, scale, add, sub } from '../shared-utils';
import { getTerminationMessage } from './terminationUtils';

export interface DiagonalPrecondIteration {
  iter: number;
  w: number[];
  wNew: number[];
  loss: number;
  newLoss: number;
  grad: number[];
  gradNorm: number;
  direction: number[];
  stepNorm: number;
  hessianDiagonal: number[];
  preconditioner: number[];
  alpha?: number;  // If using line search
  lineSearchTrials?: Array<{ alpha: number; loss: number }>;  // If using line search
}

/**
 * Diagonal Preconditioner with Hessian Diagonal
 *
 * Uses per-coordinate step sizes based on Hessian diagonal: D = diag(1/H₀₀, 1/H₁₁, ...)
 *
 * Update rule: w_new = w - D * ∇f(w)
 *
 * Properties:
 * - Perfect on axis-aligned problems (D = H⁻¹ exactly)
 * - Coordinate-dependent (fails on rotated problems)
 * - No matrix inversion needed (just diagonal)
 *
 * @param problem Problem definition with objective, gradient, and Hessian
 * @param options Algorithm options including maxIter, useLineSearch, and optional initial point
 * @returns Algorithm result with iterations and summary
 */
export const runDiagonalPreconditioner = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & {
    useLineSearch?: boolean;
    c1?: number;
    lambda?: number;
    epsilon?: number;
    termination?: {
      gtol?: number;
      ftol?: number;
      xtol?: number;
    };
  }
): AlgorithmResult<DiagonalPrecondIteration> => {
  const {
    maxIter,
    initialPoint,
    tolerance = 1e-6,
    useLineSearch = false,
    c1 = 0.0001,
    lambda = 0,
    epsilon = 1e-8,
    termination
  } = options;

  // Extract termination thresholds (backward compatible with tolerance parameter)
  const gtol = termination?.gtol ?? tolerance;
  const ftol = termination?.ftol ?? 1e-9;
  const xtol = termination?.xtol ?? 1e-9;

  // Note: lambda accepted for API consistency but unused
  void lambda;

  if (!problem.hessian) {
    throw new Error('Diagonal preconditioner requires Hessian computation');
  }

  const iterations: DiagonalPrecondIteration[] = [];
  let previousLoss: number | null = null;
  let previousW: number[] | null = null;
  let terminationReason: ConvergenceCriterion | null = null;
  let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

    // Check gradient norm convergence
    if (gradNorm < gtol) {
      terminationReason = 'gradient';
      // Will store iteration at end of loop
    }

    // Check function value stalling (scipy-style: relative tolerance)
    if (previousLoss !== null && ftol > 0) {
      const funcChange = Math.abs(loss - previousLoss);
      const relativeFuncChange = funcChange / Math.max(Math.abs(loss), 1e-8);
      if (relativeFuncChange < ftol && terminationReason === null) {
        terminationReason = 'ftol';
      }
    }

    // Compute Hessian and extract diagonal
    const H = problem.hessian(w);
    const hessianDiagonal = problem.dimensionality === 3
      ? [H[0][0], H[1][1], H[2][2]]
      : [H[0][0], H[1][1]];

    // Build diagonal preconditioner D = diag(1/(H_ii + ε))
    // Add epsilon for numerical stability
    const preconditioner = hessianDiagonal.map(d => 1 / (d + epsilon));

    // Compute preconditioned direction: p = -D * grad
    const direction = grad.map((g, i) => -preconditioner[i] * g);
    const stepNorm = norm(direction);

    let wNew: number[];
    let newLoss: number;
    let alpha: number | undefined;
    let lineSearchTrials: Array<{ alpha: number; loss: number }> | undefined;

    if (useLineSearch) {
      // Use line search for robustness
      const lineSearchResult = armijoLineSearch(
        w,
        direction,
        grad,
        loss,
        (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
        c1
      );
      alpha = lineSearchResult.alpha;
      wNew = add(w, scale(direction, alpha));
      newLoss = problem.objective(wNew);
      lineSearchTrials = lineSearchResult.trials;
    } else {
      // Take full step (optimal for quadratics)
      alpha = 1.0;
      wNew = add(w, direction);
      newLoss = problem.objective(wNew);
    }

    // Check step size stalling (scipy-style: average absolute step per dimension)
    if (xtol > 0) {
      const step = sub(wNew, w);
      const stepSize = norm(step);
      const dimension = w.length;
      // Use RMS step size per dimension
      const avgStepSize = stepSize / Math.sqrt(dimension);
      if (avgStepSize < xtol && terminationReason === null) {
        terminationReason = 'xtol';
      }
    }

    iterations.push({
      iter,
      w: [...w],
      wNew: [...wNew],
      loss,
      newLoss,
      grad: [...grad],
      gradNorm,
      direction,
      stepNorm,
      hessianDiagonal,
      preconditioner,
      alpha,
      lineSearchTrials
    });

    // Update for next iteration
    previousLoss = loss;
    previousW = [...w];
    w = wNew;

    // Early stopping if any termination criterion met
    if (terminationReason !== null) {
      break;
    }

    // Check for divergence
    if (!isFinite(newLoss) || !isFinite(gradNorm)) {
      terminationReason = 'diverged';
      break;
    }
  }

  // If loop completed without early termination
  if (terminationReason === null) {
    terminationReason = 'maxiter';
  }

  // Compute convergence summary
  const lastIter = iterations[iterations.length - 1];
  const finalGradNorm = lastIter ? lastIter.gradNorm : Infinity;
  const finalLoss = lastIter ? lastIter.newLoss : Infinity;
  const finalLocation = lastIter ? lastIter.wNew : w;

  // Compute final step size and function change
  const absoluteStepSize = previousW ? norm(sub(finalLocation, previousW)) : undefined;
  const absoluteFuncChange = previousLoss !== null ? Math.abs(finalLoss - previousLoss) : undefined;

  // Compute relative values (for scipy-style tolerance checking)
  const finalStepSize = absoluteStepSize !== undefined
    ? absoluteStepSize / Math.max(norm(finalLocation), 1.0)
    : undefined;
  const finalFunctionChange = absoluteFuncChange !== undefined
    ? absoluteFuncChange / Math.max(Math.abs(finalLoss), 1e-8)
    : undefined;

  // Determine convergence flags
  const converged = ['gradient', 'ftol', 'xtol'].includes(terminationReason);
  const diverged = terminationReason === 'diverged';
  const stalled = ['ftol', 'xtol'].includes(terminationReason);

  // Generate human-readable termination message
  const terminationMessage = getTerminationMessage(terminationReason, {
    gradNorm: finalGradNorm,
    gtol,
    stepSize: finalStepSize,
    xtol,
    funcChange: finalFunctionChange,
    ftol,
    iters: iterations.length,
    maxIter
  });

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    stalled,
    finalLocation,
    finalLoss,
    finalGradNorm,
    finalStepSize,
    finalFunctionChange,
    iterationCount: iterations.length,
    convergenceCriterion: terminationReason,
    terminationMessage
  };

  console.log(iterations.length, summary.terminationMessage);

  return { iterations, summary };
};
