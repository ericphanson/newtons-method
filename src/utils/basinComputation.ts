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
