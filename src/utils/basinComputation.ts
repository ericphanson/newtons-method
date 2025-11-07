import { ProblemFunctions } from '../algorithms/types';
import { BasinData, BasinPoint } from '../types/basin';
import { runNewton } from '../algorithms/newton';
import { runLBFGS } from '../algorithms/lbfgs';
import { runGradientDescent } from '../algorithms/gradient-descent';
import { runGradientDescentLineSearch } from '../algorithms/gradient-descent-linesearch';
import { runDiagonalPreconditioner } from '../algorithms/diagonal-preconditioner';

/**
 * Compute basin point by running algorithm from a starting point
 */
export function computeBasinPoint(
  initialPoint: [number, number] | [number, number, number],
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  algorithmParams: any
): BasinPoint {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    switch (algorithm) {
      case 'gd-fixed':
        result = runGradientDescent(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'gd-linesearch':
        result = runGradientDescentLineSearch(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'diagonal-precond':
        result = runDiagonalPreconditioner(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'newton':
        result = runNewton(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      case 'lbfgs':
        result = runLBFGS(problemFuncs, {
          ...algorithmParams,
          initialPoint
        });
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    return {
      // Store full dimensionality (2D or 3D) - don't slice off bias for 3D problems
      convergenceLoc: result.summary.finalLocation.length === 2
        ? (result.summary.finalLocation.slice(0, 2) as [number, number])
        : (result.summary.finalLocation.slice(0, 3) as [number, number, number]),
      iterations: result.summary.iterationCount,
      converged: result.summary.converged,
      diverged: result.summary.diverged,
      stalled: result.summary.stalled
    };
  } catch (error) {
    // Algorithm threw error (singular Hessian, numerical issues)
    console.warn('Algorithm failed at point', initialPoint, error);
    return {
      convergenceLoc: [NaN, NaN],
      iterations: 0,
      converged: false,
      diverged: true,
      stalled: false
    };
  }
}

/**
 * Initialize empty basin data structure
 */
export function initializeBasinData(
  resolution: number,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number }
): BasinData {
  const grid: BasinPoint[][] = Array(resolution)
    .fill(null)
    .map(() =>
      Array(resolution)
        .fill(null)
        .map(() => ({
          convergenceLoc: [0, 0] as [number, number],
          iterations: 0,
          converged: false,
          diverged: false,
          stalled: false
        }))
    );

  return { resolution, bounds, grid };
}

const FRAME_BUDGET_MS = 10;

export interface BasinTimingData {
  totalTime: number;
  computeTime: number;
  frameCount: number;
  avgFrameTime: number;
  rafOverhead: number;
  rafOverheadPercent: number;
  pointCount: number;
  avgPerPoint: number;
  estimatedTotalComputeTime: number;
  resolution: number;
  algorithm: string;
  timestamp: string;
}

export interface BasinComputationResult {
  data: BasinData | null;
  timing: BasinTimingData | null;
}

/**
 * Compute basin incrementally with time-budgeted RAF loop
 * Returns null if cancelled (taskId changed)
 */
export async function computeBasinIncremental(
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  algorithmParams: any,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number },
  resolution: number,
  taskIdRef: { current: number },
  currentTaskId: number,
  onProgress?: (completed: number, total: number) => void
): Promise<BasinComputationResult> {
  const basinData = initializeBasinData(resolution, bounds);
  let pointIndex = 0;
  const totalPoints = resolution * resolution;

  // Timing instrumentation
  console.group('🕐 Basin Computation Timing');
  console.log(`Resolution: ${resolution}x${resolution} = ${totalPoints} points`);
  console.log(`Algorithm: ${algorithm}`);
  const overallStart = performance.now();
  let totalPointComputeTime = 0;
  let frameCount = 0;
  let totalFrameTime = 0;

  while (pointIndex < totalPoints) {
    // Yield to browser
    if (pointIndex % 20 === 0) {  // Only update every 20 points
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

    // Check cancellation
    if (taskIdRef.current !== currentTaskId) {
      console.log('Basin computation cancelled');
      console.groupEnd();
      return { data: null, timing: null };
    }

    const frameStart = performance.now();
    frameCount++;

    // Compute as many points as we can in our time budget
    while (pointIndex < totalPoints) {
      const i = Math.floor(pointIndex / resolution);
      const j = pointIndex % resolution;

      // Compute starting point in parameter space
      const w0 = bounds.minW0 + (j / (resolution - 1)) * (bounds.maxW0 - bounds.minW0);
      const w1 = bounds.minW1 + (i / (resolution - 1)) * (bounds.maxW1 - bounds.minW1);

      // Handle 3D problems (logistic regression, separating hyperplane)
      const initialPoint: [number, number] | [number, number, number] =
        problemFuncs.dimensionality === 3
          ? [w0, w1, algorithmParams.biasSlice || 0]
          : [w0, w1];

      // Time individual point computation (sample every 10th point)
      const shouldProfile = pointIndex % 10 === 0;
      const pointStart = shouldProfile ? performance.now() : 0;

      // Run algorithm from this starting point
      const result = computeBasinPoint(
        initialPoint,
        problemFuncs,
        algorithm,
        algorithmParams
      );

      if (shouldProfile) {
        const pointTime = performance.now() - pointStart;
        totalPointComputeTime += pointTime;
        if (pointIndex < 50) {
          console.log(`  Point ${pointIndex}/${totalPoints}: ${pointTime.toFixed(2)}ms`);
        }
      }

      basinData.grid[i][j] = result;
      pointIndex++;

      // Check time budget
      if (performance.now() - frameStart > FRAME_BUDGET_MS) {
        break; // Yield to browser
      }
    }

    const frameTime = performance.now() - frameStart;
    totalFrameTime += frameTime;

    // Report progress
    if (onProgress && pointIndex % 20 === 0) {  // Only update every 20 points
      onProgress(pointIndex, totalPoints);
    }
  }

  const overallTime = performance.now() - overallStart;
  const avgPerPoint = totalPointComputeTime / (totalPoints / 10);
  const estimatedTotalComputeTime = avgPerPoint * totalPoints;
  const avgFrameTime = totalFrameTime / frameCount;
  const rafOverhead = overallTime - totalFrameTime;
  const rafOverheadPercent = (rafOverhead / overallTime) * 100;

  // Final timing summary
  console.log('');
  console.log('📊 TIMING SUMMARY:');
  console.log(`  Total time: ${overallTime.toFixed(2)}ms (${(overallTime / 1000).toFixed(2)}s)`);
  console.log(`  Average per point (sampled): ${avgPerPoint.toFixed(2)}ms`);
  console.log(`  Estimated total compute time: ${estimatedTotalComputeTime.toFixed(2)}ms`);
  console.log(`  Frame count: ${frameCount}`);
  console.log(`  Average frame time: ${avgFrameTime.toFixed(2)}ms`);
  console.log(`  RAF overhead: ${rafOverhead.toFixed(2)}ms (${rafOverheadPercent.toFixed(1)}%)`);
  console.groupEnd();

  // Create timing data object
  const timingData: BasinTimingData = {
    totalTime: overallTime,
    computeTime: totalFrameTime,
    frameCount,
    avgFrameTime,
    rafOverhead,
    rafOverheadPercent,
    pointCount: totalPoints,
    avgPerPoint,
    estimatedTotalComputeTime,
    resolution,
    algorithm,
    timestamp: new Date().toISOString()
  };

  return {
    data: basinData,
    timing: timingData
  };
}
