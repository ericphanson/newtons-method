import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary } from './types';
import { armijoLineSearch } from '../line-search/armijo';
import { norm, scale, add } from '../shared-utils';

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
  lineSearchTrials?: any[];  // If using line search
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
  }
): AlgorithmResult<DiagonalPrecondIteration> => {
  const {
    maxIter,
    initialPoint,
    tolerance = 1e-6,
    useLineSearch = false,
    c1 = 0.0001,
    lambda = 0,
    epsilon = 1e-8
  } = options;

  // Note: lambda accepted for API consistency but unused
  void lambda;

  if (!problem.hessian) {
    throw new Error('Diagonal preconditioner requires Hessian computation');
  }

  const iterations: DiagonalPrecondIteration[] = [];
  let w = initialPoint || (problem.dimensionality === 3 ? [0.1, 0.1, 0.0] : [0.1, 0.1]);

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = norm(grad);

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
    let lineSearchTrials: any[] | undefined;

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

    w = wNew;

    // Check convergence
    if (gradNorm < tolerance) {
      break;
    }

    // Check for divergence
    if (!isFinite(newLoss) || !isFinite(gradNorm)) {
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

  let convergenceCriterion: 'gradient' | 'maxiter' | 'diverged';
  if (diverged) {
    convergenceCriterion = 'diverged';
  } else if (converged) {
    convergenceCriterion = 'gradient';
  } else {
    convergenceCriterion = 'maxiter';
  }

  const summary: AlgorithmSummary = {
    converged,
    diverged,
    finalLocation,
    finalLoss,
    finalGradNorm,
    iterationCount: iterations.length,
    convergenceCriterion
  };

  return { iterations, summary };
};
