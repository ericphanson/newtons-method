import { ProblemFunctions } from '../algorithms/types';
import { BasinData, BasinPoint } from '../types/basin';
import { runNewton } from '../algorithms/newton';
import { runLBFGS } from '../algorithms/lbfgs';
import { runGradientDescent } from '../algorithms/gradient-descent';
import { runGradientDescentLineSearch } from '../algorithms/gradient-descent-linesearch';

/**
 * Compute basin point by running algorithm from a starting point
 */
export function computeBasinPoint(
  initialPoint: [number, number] | [number, number, number],
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs',
  algorithmParams: any
): BasinPoint {
  try {
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
      convergenceLoc: result.summary.finalLocation.slice(0, 2) as [number, number],
      iterations: result.summary.iterationCount,
      converged: result.summary.converged,
      diverged: result.summary.diverged
    };
  } catch (error) {
    // Algorithm threw error (singular Hessian, numerical issues)
    console.warn('Algorithm failed at point', initialPoint, error);
    return {
      convergenceLoc: [NaN, NaN],
      iterations: 0,
      converged: false,
      diverged: true
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
          diverged: false
        }))
    );

  return { resolution, bounds, grid };
}

const FRAME_BUDGET_MS = 10;

/**
 * Compute basin incrementally with time-budgeted RAF loop
 * Returns null if cancelled (taskId changed)
 */
export async function computeBasinIncremental(
  problemFuncs: ProblemFunctions,
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs',
  algorithmParams: any,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number },
  resolution: number,
  taskIdRef: { current: number },
  currentTaskId: number,
  onProgress?: (completed: number, total: number) => void
): Promise<BasinData | null> {
  const basinData = initializeBasinData(resolution, bounds);
  let pointIndex = 0;
  const totalPoints = resolution * resolution;

  while (pointIndex < totalPoints) {
    // Yield to browser
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Check cancellation
    if (taskIdRef.current !== currentTaskId) {
      console.log('Basin computation cancelled');
      return null;
    }

    const frameStart = performance.now();

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

      // Run algorithm from this starting point
      const result = computeBasinPoint(
        initialPoint,
        problemFuncs,
        algorithm,
        algorithmParams
      );

      basinData.grid[i][j] = result;
      pointIndex++;

      // Check time budget
      if (performance.now() - frameStart > FRAME_BUDGET_MS) {
        break; // Yield to browser
      }
    }

    // Report progress
    if (onProgress) {
      onProgress(pointIndex, totalPoints);
    }
  }

  return basinData;
}
