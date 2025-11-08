import {
  LineSearchTrial,
  dot,
  norm,
  scale,
  add,
  sub
} from '../shared-utils';
import { armijoLineSearch } from '../line-search/armijo';
import { ProblemFunctions, AlgorithmOptions, AlgorithmResult, AlgorithmSummary, ConvergenceCriterion } from './types';
import { getTerminationMessage } from './terminationUtils';

export interface NewtonIteration {
  iter: number;
  w: number[];
  loss: number;
  grad: number[];
  gradNorm: number;
  hessian: number[][];
  eigenvalues: number[];
  conditionNumber: number;
  direction: number[];
  alpha: number;
  wNew: number[];
  newLoss: number;
  lineSearchTrials: LineSearchTrial[];
  lineSearchCurve: {
    alphaRange: number[];
    lossValues: number[];
    armijoValues: number[];
  };
}

const invertMatrix = (A: number[][]): number[][] | null => {
  const n = A.length;
  const augmented: number[][] = A.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }

    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  for (let i = n - 1; i >= 0; i--) {
    for (let k = i - 1; k >= 0; k--) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
    const divisor = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= divisor;
    }
  }

  return augmented.map(row => row.slice(n));
};

const computeEigenvalues = (A: number[][]): number[] => {
  const n = A.length;
  const eigenvalues: number[] = [];
  const AMat = A.map(row => [...row]);

  for (let eig = 0; eig < n; eig++) {
    let v = Array(n).fill(1);
    let lambda = 0;

    for (let iter = 0; iter < 50; iter++) {
      const Av = v.map((_, i) => AMat[i].reduce((sum, val, j) => sum + val * v[j], 0));
      lambda = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0));
      v = Av.map(val => val / lambda);
    }

    eigenvalues.push(lambda);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        AMat[i][j] -= lambda * v[i] * v[j];
      }
    }
  }

  return eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
};

/**
 * Newton's Method with Armijo line search
 *
 * Second-order optimization using exact Hessian information.
 * At each iteration, solves H * direction = -grad to get Newton direction,
 * then performs line search to ensure sufficient decrease.
 *
 * @param problem Problem definition with objective, gradient, hessian, and dimensionality
 * @param options Algorithm options including maxIter, c1, and optional initial point
 * @returns Array of iteration objects with Hessian, eigenvalues, and line search details
 */
export const runNewton = (
  problem: ProblemFunctions,
  options: AlgorithmOptions & { c1?: number; lambda?: number; hessianDamping?: number; lineSearch?: 'armijo' | 'none' }
): AlgorithmResult<NewtonIteration> => {
  if (!problem.hessian) {
    throw new Error('Newton method requires Hessian function');
  }

  const { maxIter, c1 = 0.0001, lambda = 0, hessianDamping = 0.01, initialPoint, lineSearch = 'armijo', termination } = options;

  if (!termination) {
    throw new Error('Termination thresholds must be provided for Newton method');
  }
  // Extract termination thresholds (backward compatible with tolerance parameter)
  const gtol = termination.gtol;
  const ftol = termination.ftol;
  const xtol = termination.xtol;

  if (gtol === undefined || ftol === undefined || xtol === undefined) {
    throw new Error('All termination thresholds (gtol, ftol, xtol) must be defined for Newton method');
  }
  const iterations: NewtonIteration[] = [];
  let previousLoss: number | null = null;
  let previousW: number[] | null = null;
  let terminationReason: ConvergenceCriterion | null = null;

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
    const hessian = problem.hessian(w);
    const gradNorm = norm(grad);
    const eigenvalues = computeEigenvalues(hessian);
    const conditionNumber = Math.abs(eigenvalues[0]) / Math.abs(eigenvalues[eigenvalues.length - 1]);

    // Early divergence detection
    if (!isFinite(loss) || !isFinite(gradNorm)) {
      terminationReason = 'diverged';
      // Still store the iteration data before breaking
      iterations.push({
        iter,
        w: [...w],
        loss,
        grad: [...grad],
        gradNorm,
        hessian: hessian.map(row => [...row]),
        eigenvalues: [...eigenvalues],
        conditionNumber,
        direction: [0, 0],
        alpha: 0,
        wNew: [...w],
        newLoss: loss,
        lineSearchTrials: [],
        lineSearchCurve: { alphaRange: [], lossValues: [], armijoValues: [] }
      });
      break;
    }

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

    // Apply Hessian damping: H_damped = H + λ_damp * I
    const dampedHessian = hessian.map((row, i) =>
      row.map((val, j) => i === j ? val + hessianDamping : val)
    );

    // Solve Hessian * direction = -grad (Newton direction)
    const HInv = invertMatrix(dampedHessian);
    let direction: number[];

    if (HInv === null) {
      // If Hessian is singular, fall back to gradient descent
      direction = scale(grad, -1);
    } else {
      direction = HInv.map(row => -dot(row, grad));
    }

    // Perform line search to find good step size
    let acceptedAlpha: number;
    let lineSearchResult: { alpha: number; trials: LineSearchTrial[]; curve: { alphaRange: number[]; lossValues: number[]; armijoValues: number[] } };

    if (lineSearch === 'none') {
      // Take full Newton step without line search
      acceptedAlpha = 1.0;
      const fullStepLoss = problem.objective(add(w, direction));
      lineSearchResult = {
        alpha: 1.0,
        trials: [{ trial: 0, alpha: 1.0, loss: fullStepLoss, armijoRHS: loss, satisfied: true }],
        curve: { alphaRange: [1.0], lossValues: [fullStepLoss], armijoValues: [] }
      };
    } else {
      // Use Armijo line search
      lineSearchResult = armijoLineSearch(
        w,
        direction,
        grad,
        loss,
        (wTest) => ({ loss: problem.objective(wTest), grad: problem.gradient(wTest) }),
        c1
      );
      acceptedAlpha = lineSearchResult.alpha;
    }

    const wNew = add(w, scale(direction, acceptedAlpha));
    const newLoss = problem.objective(wNew);

    // Check step size stalling (scipy-style: average absolute step per dimension)
    if (xtol > 0) {
      const step = sub(wNew, w);
      const stepSize = norm(step);
      const dimension = w.length;
      // Use RMS step size per dimension (similar to scipy's L1/dimension but with L2 norm)
      const avgStepSize = stepSize / Math.sqrt(dimension);
      if (avgStepSize < xtol && terminationReason === null) {
        terminationReason = 'xtol';
      }
    }

    iterations.push({
      iter,
      w: [...w],
      loss,
      grad: [...grad],
      gradNorm,
      hessian: hessian.map(row => [...row]),
      eigenvalues: [...eigenvalues],
      conditionNumber,
      direction,
      alpha: acceptedAlpha,
      wNew: [...wNew],
      newLoss,
      lineSearchTrials: lineSearchResult.trials,
      lineSearchCurve: lineSearchResult.curve
    });

    // Update for next iteration
    previousLoss = loss;  // Store BEFORE-step loss for next iteration's comparison
    previousW = [...w];
    w = wNew;

    // Early stopping if any termination criterion met
    if (terminationReason !== null) {
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

  // Compute final step size and function change (absolute and relative)
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

  return { iterations, summary };
};
