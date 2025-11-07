#!/usr/bin/env tsx
/**
 * Benchmark script for basin of convergence visualization
 * Tests performance at different grid resolutions
 */

import { getProblem } from '../src/problems';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { runNewton } from '../src/algorithms/newton';
import { runLBFGS } from '../src/algorithms/lbfgs';
import { runGradientDescent } from '../src/algorithms/gradient-descent';
import { generateCrescents } from '../src/shared-utils';

interface BenchmarkResult {
  resolution: number;
  totalPoints: number;
  algorithm: string;
  problem: string;
  timeMs: number;
  avgIterationsPerPoint: number;
  avgTimePerPoint: number;
  convergedCount: number;
  divergedCount: number;
}

function benchmarkBasin(
  problemName: string,
  algorithmName: 'newton' | 'lbfgs' | 'gd-fixed',
  resolution: number,
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number }
): BenchmarkResult {
  // Setup problem
  let problemFuncs: any;
  if (problemName === 'logistic-regression') {
    const data = generateCrescents(50, 0.5, 0.3);
    problemFuncs = logisticRegressionToProblemFunctions(data, 0.001);
  } else {
    const problem = getProblem(problemName);
    if (!problem) throw new Error(`Problem '${problemName}' not found`);
    problemFuncs = problemToProblemFunctions(problem);
  }

  // Generate grid of starting points
  const startTime = performance.now();
  let totalIterations = 0;
  let convergedCount = 0;
  let divergedCount = 0;

  const w0Range = bounds.maxW0 - bounds.minW0;
  const w1Range = bounds.maxW1 - bounds.minW1;

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const w0 = bounds.minW0 + (i / (resolution - 1)) * w0Range;
      const w1 = bounds.minW1 + (j / (resolution - 1)) * w1Range;
      const initialPoint: [number, number] = [w0, w1];

      try {
        let iterations: any[];

        switch (algorithmName) {
          case 'newton':
            iterations = runNewton(problemFuncs, {
              maxIter: 50,
              c1: 0.0001,
              lambda: 0,
              hessianDamping: 0.01,
              lineSearch: 'armijo',
              initialPoint
            });
            break;
          case 'lbfgs':
            iterations = runLBFGS(problemFuncs, {
              maxIter: 50,
              m: 5,
              c1: 0.0001,
              lambda: 0,
              initialPoint
            });
            break;
          case 'gd-fixed':
            iterations = runGradientDescent(problemFuncs, {
              maxIter: 50,
              alpha: 0.01,
              lambda: 0,
              initialPoint
            });
            break;
        }

        totalIterations += iterations.length;

        const lastIter = iterations[iterations.length - 1];
        const finalGradNorm = lastIter.gradNorm;
        const finalLoss = lastIter.newLoss;

        if (finalGradNorm < 1e-5 && isFinite(finalLoss)) {
          convergedCount++;
        } else if (!isFinite(finalLoss) || !isFinite(finalGradNorm)) {
          divergedCount++;
        }
      } catch {
        divergedCount++;
      }
    }
  }

  const endTime = performance.now();
  const timeMs = endTime - startTime;
  const totalPoints = resolution * resolution;

  return {
    resolution,
    totalPoints,
    algorithm: algorithmName,
    problem: problemName,
    timeMs,
    avgIterationsPerPoint: totalIterations / totalPoints,
    avgTimePerPoint: timeMs / totalPoints,
    convergedCount,
    divergedCount
  };
}

function printBenchmark(result: BenchmarkResult) {
  console.log('\n' + '='.repeat(70));
  console.log(`Problem: ${result.problem} | Algorithm: ${result.algorithm}`);
  console.log(`Grid: ${result.resolution}×${result.resolution} = ${result.totalPoints} points`);
  console.log('-'.repeat(70));
  console.log(`Total time: ${result.timeMs.toFixed(0)}ms (${(result.timeMs/1000).toFixed(2)}s)`);
  console.log(`Avg time per point: ${result.avgTimePerPoint.toFixed(2)}ms`);
  console.log(`Avg iterations per point: ${result.avgIterationsPerPoint.toFixed(1)}`);
  console.log(`Converged: ${result.convergedCount} (${(100*result.convergedCount/result.totalPoints).toFixed(1)}%)`);
  console.log(`Diverged: ${result.divergedCount} (${(100*result.divergedCount/result.totalPoints).toFixed(1)}%)`);
  console.log(`Est. time for 100×100: ${(result.avgTimePerPoint * 10000 / 1000).toFixed(1)}s`);
}

// Main
function main() {
  console.log('Basin of Convergence Benchmarking');
  console.log('='.repeat(70));

  const testCases: Array<{
    problem: string;
    algorithm: 'newton' | 'lbfgs' | 'gd-fixed';
    bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  }> = [
    {
      problem: 'rosenbrock',
      algorithm: 'newton',
      bounds: { minW0: -2, maxW0: 2, minW1: -1, maxW1: 3 }
    },
    {
      problem: 'rosenbrock',
      algorithm: 'lbfgs',
      bounds: { minW0: -2, maxW0: 2, minW1: -1, maxW1: 3 }
    },
    {
      problem: 'quadratic',
      algorithm: 'newton',
      bounds: { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 }
    },
    {
      problem: 'ill-conditioned-quadratic',
      algorithm: 'newton',
      bounds: { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 }
    }
  ];

  const resolutions = [10, 20, 30, 50];

  for (const testCase of testCases) {
    console.log('\n' + '█'.repeat(70));
    console.log(`Testing: ${testCase.problem} with ${testCase.algorithm}`);
    console.log('█'.repeat(70));

    for (const resolution of resolutions) {
      const result = benchmarkBasin(
        testCase.problem,
        testCase.algorithm,
        resolution,
        testCase.bounds
      );
      printBenchmark(result);
    }
  }
}

main();
