// src/utils/iterationSummaryUtils.ts

import { AlgorithmSummary, ConvergenceCriterion } from '../algorithms/types';
import { getTerminationMessage } from '../algorithms/terminationUtils';
import { norm, sub } from '../shared-utils';

interface ComputeIterationSummaryParams {
  currentIndex: number;
  totalIterations: number;
  gradNorm: number;
  loss: number;
  location: number[];
  gtol: number;
  ftol?: number;
  xtol?: number;
  stepSize?: number;
  functionChange?: number;
  eigenvalues?: number[];
  isSecondOrder?: boolean;
  maxIter: number;
  // Optional: for computing stepSize and functionChange
  previousLoss?: number;
  previousLocation?: number[];
}

/**
 * Computes the convergence summary for a specific iteration.
 * This allows showing convergence status at any point in the iteration history,
 * not just the final iteration.
 */
export function computeIterationSummary(
  params: ComputeIterationSummaryParams
): AlgorithmSummary {
  const {
    currentIndex,
    totalIterations,
    gradNorm,
    loss,
    location,
    gtol,
    ftol,
    xtol,
    eigenvalues,
    isSecondOrder = false,
    maxIter,
    previousLoss,
    previousLocation
  } = params;

  let { stepSize, functionChange } = params;

  // Compute stepSize if not provided but previousLocation is available
  if (stepSize === undefined && previousLocation && currentIndex > 0) {
    const absoluteStepSize = norm(sub(location, previousLocation));
    stepSize = absoluteStepSize / Math.max(norm(location), 1.0);
  }

  // Compute functionChange if not provided but previousLoss is available
  if (functionChange === undefined && previousLoss !== undefined && currentIndex > 0) {
    const absoluteFuncChange = Math.abs(loss - previousLoss);
    functionChange = absoluteFuncChange / Math.max(Math.abs(loss), Math.abs(previousLoss), 1.0);
  }

  // Check for divergence
  const diverged = !isFinite(loss) || !isFinite(gradNorm);

  // Check if this is the last iteration
  const isLastIteration = currentIndex === totalIterations - 1;

  // Check various convergence criteria
  const gradientConverged = gradNorm < gtol;
  const ftolConverged = ftol !== undefined && functionChange !== undefined && functionChange < ftol;
  const xtolConverged = xtol !== undefined && stepSize !== undefined && stepSize < xtol;

  // Determine if converged and which criterion triggered
  const converged = gradientConverged || ftolConverged || xtolConverged;
  // Only consider it stalled if converged via ftol/xtol but NOT via gradient
  const stalled = !gradientConverged && (ftolConverged || xtolConverged);

  // Determine convergence criterion
  // Priority order: diverged > gradient > ftol > xtol > maxiter
  let convergenceCriterion: ConvergenceCriterion;
  let terminationMessage: string;

  if (diverged) {
    convergenceCriterion = 'diverged';
    terminationMessage = getTerminationMessage(convergenceCriterion, {
      gradNorm,
      gtol,
      stepSize,
      xtol,
      funcChange: functionChange,
      ftol,
      iters: currentIndex + 1,
      maxIter,
      eigenvalues,
      isSecondOrder
    });
  } else if (gradientConverged) {
    convergenceCriterion = 'gradient';
    terminationMessage = getTerminationMessage(convergenceCriterion, {
      gradNorm,
      gtol,
      stepSize,
      xtol,
      funcChange: functionChange,
      ftol,
      iters: currentIndex + 1,
      maxIter,
      eigenvalues,
      isSecondOrder
    });
  } else if (ftolConverged) {
    convergenceCriterion = 'ftol';
    terminationMessage = getTerminationMessage(convergenceCriterion, {
      gradNorm,
      gtol,
      stepSize,
      xtol,
      funcChange: functionChange,
      ftol,
      iters: currentIndex + 1,
      maxIter,
      eigenvalues,
      isSecondOrder
    });
  } else if (xtolConverged) {
    convergenceCriterion = 'xtol';
    terminationMessage = getTerminationMessage(convergenceCriterion, {
      gradNorm,
      gtol,
      stepSize,
      xtol,
      funcChange: functionChange,
      ftol,
      iters: currentIndex + 1,
      maxIter,
      eigenvalues,
      isSecondOrder
    });
  } else if (isLastIteration) {
    // Only show "maxiter" if we're actually at the last iteration
    convergenceCriterion = 'maxiter';
    terminationMessage = getTerminationMessage(convergenceCriterion, {
      gradNorm,
      gtol,
      stepSize,
      xtol,
      funcChange: functionChange,
      ftol,
      iters: currentIndex + 1,
      maxIter,
      eigenvalues,
      isSecondOrder
    });
  } else {
    // For intermediate iterations that haven't converged yet, show "in progress"
    convergenceCriterion = 'gradient'; // Use gradient as placeholder for type safety
    terminationMessage = `In progress: gradient norm ${gradNorm.toExponential(2)} (target: < ${gtol.toExponential(2)})`;
  }

  return {
    converged,
    diverged,
    stalled,
    finalLocation: location,
    finalLoss: loss,
    finalGradNorm: gradNorm,
    finalStepSize: stepSize,
    finalFunctionChange: functionChange,
    iterationCount: currentIndex + 1,
    convergenceCriterion,
    terminationMessage
  };
}
