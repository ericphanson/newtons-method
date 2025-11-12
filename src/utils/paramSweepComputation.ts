import { ProblemFunctions } from '../algorithms/types';
import { runNewton } from '../algorithms/newton';
import { runLBFGS } from '../algorithms/lbfgs';
import { runGradientDescent } from '../algorithms/gradient-descent';
import { runGradientDescentLineSearch } from '../algorithms/gradient-descent-linesearch';
import { runDiagonalPreconditioner } from '../algorithms/diagonal-preconditioner';

export interface ParamSweepPoint {
  paramValue: number;
  iterations: number;
  finalLoss: number;
  finalGradNorm: number;
  converged: boolean;
  diverged: boolean;
  stalled: boolean;
  avgLineSearchTrials?: number; // For line search methods
}

export interface ParamSweepData {
  paramName: string;
  points: ParamSweepPoint[];
}

export interface ParamSweepTimingData {
  totalTime: number;
  pointCount: number;
  avgPerPoint: number;
  timestamp: string;
}

export interface ParamSweepResult {
  data: ParamSweepData | null;
  timing: ParamSweepTimingData | null;
}

const FRAME_BUDGET_MS = 10;

/**
 * Compute average line search trials from iterations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeAvgLineSearchTrials(iterations: any[]): number | undefined {
  if (!iterations || iterations.length === 0) return undefined;

  // Check if iterations have lineSearchTrials (GD-LineSearch, Newton, L-BFGS)
  if ('lineSearchTrials' in iterations[0] && iterations[0].lineSearchTrials) {
    const totalTrials = iterations.reduce((sum, iter) =>
      sum + (iter.lineSearchTrials?.length || 0), 0);
    return totalTrials / iterations.length;
  }

  return undefined;
}

/**
 * Run algorithm with specific parameter value
 */
function runAlgorithmWithParam(
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs',
  problemFuncs: ProblemFunctions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseParams: any,
  paramName: string,
  paramValue: number
): ParamSweepPoint {
  try {
    // Create params with overridden value
    const params = { ...baseParams, [paramName]: paramValue };

    // Extract fields we need to rename to match API
    const { diagPrecondLineSearch, newtonLineSearch, ...restParams } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    switch (algorithm) {
      case 'gd-fixed':
        result = runGradientDescent(problemFuncs, restParams);
        break;
      case 'gd-linesearch':
        result = runGradientDescentLineSearch(problemFuncs, restParams);
        break;
      case 'diagonal-precond':
        result = runDiagonalPreconditioner(problemFuncs, {
          ...restParams,
          lineSearch: diagPrecondLineSearch
        });
        break;
      case 'newton':
        result = runNewton(problemFuncs, {
          ...restParams,
          lineSearch: newtonLineSearch
        });
        break;
      case 'lbfgs':
        result = runLBFGS(problemFuncs, restParams);
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    return {
      paramValue,
      iterations: result.summary.iterationCount,
      finalLoss: result.summary.finalLoss,
      finalGradNorm: result.summary.finalGradNorm,
      converged: result.summary.converged,
      diverged: result.summary.diverged,
      stalled: result.summary.stalled,
      avgLineSearchTrials: computeAvgLineSearchTrials(result.iterations)
    };
  } catch (error) {
    console.warn('Algorithm failed with param', paramName, '=', paramValue, error);
    return {
      paramValue,
      iterations: 0,
      finalLoss: Infinity,
      finalGradNorm: Infinity,
      converged: false,
      diverged: true,
      stalled: false
    };
  }
}

/**
 * Compute parameter sweep incrementally with time-budgeted RAF loop
 * Returns null if cancelled (taskId changed)
 */
export async function computeParamSweepIncremental(
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs',
  problemFuncs: ProblemFunctions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseParams: any,
  paramName: string,
  paramValues: number[],
  taskIdRef: { current: number },
  currentTaskId: number,
  onProgress?: (completed: number, total: number) => void
): Promise<ParamSweepResult> {
  const points: ParamSweepPoint[] = [];
  let pointIndex = 0;
  const totalPoints = paramValues.length;

  console.group('🕐 Parameter Sweep Computation');
  console.log(`Parameter: ${paramName}`);
  console.log(`Values: ${paramValues.length} points`);
  console.log(`Algorithm: ${algorithm}`);
  const overallStart = performance.now();

  while (pointIndex < totalPoints) {
    // Yield to browser every 2 points (sweeps are typically 10 points, so this is ~5 yields)
    if (pointIndex % 2 === 0 && pointIndex > 0) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    // Check cancellation
    if (taskIdRef.current !== currentTaskId) {
      console.log('Parameter sweep computation cancelled');
      console.groupEnd();
      return { data: null, timing: null };
    }

    const frameStart = performance.now();

    // Compute as many points as we can in our time budget
    while (pointIndex < totalPoints) {
      const paramValue = paramValues[pointIndex];

      const pointStart = performance.now();
      const result = runAlgorithmWithParam(
        algorithm,
        problemFuncs,
        baseParams,
        paramName,
        paramValue
      );
      const pointTime = performance.now() - pointStart;

      points.push(result);
      pointIndex++;

      // Report progress (aligned with yield frequency)
      if (onProgress && pointIndex % 2 === 0) {
        onProgress(pointIndex, totalPoints);
      }

      // Check time budget
      const elapsed = performance.now() - frameStart;
      if (elapsed > FRAME_BUDGET_MS && pointIndex < totalPoints) {
        // Over budget, yield on next iteration
        break;
      }

      // Log first few points for debugging
      if (pointIndex <= 3) {
        console.log(`Point ${pointIndex}: ${paramName}=${paramValue.toExponential(2)} -> ${result.iterations} iters (${pointTime.toFixed(1)}ms)`);
      }
    }
  }

  const overallEnd = performance.now();
  const totalTime = overallEnd - overallStart;

  console.log(`✅ Parameter sweep completed in ${totalTime.toFixed(1)}ms`);
  console.groupEnd();

  const timing: ParamSweepTimingData = {
    totalTime,
    pointCount: totalPoints,
    avgPerPoint: totalTime / totalPoints,
    timestamp: new Date().toISOString()
  };

  return {
    data: {
      paramName,
      points
    },
    timing
  };
}
