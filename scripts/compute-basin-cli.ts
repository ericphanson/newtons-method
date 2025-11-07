#!/usr/bin/env tsx
/**
 * CLI script for basin computation benchmarking
 * Computes basin synchronously without RAF delays to diagnose performance
 */

import { getProblem } from '../src/problems/index';
import { problemToProblemFunctions } from '../src/utils/problemAdapter';
import { computeBasinPoint, initializeBasinData } from '../src/utils/basinComputation';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    problem: 'rosenbrock',
    algorithm: 'newton' as 'newton' | 'lbfgs' | 'gd-fixed' | 'gd-linesearch',
    resolution: 20
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--problem' && i + 1 < args.length) {
      options.problem = args[i + 1];
      i++;
    } else if (args[i] === '--algorithm' && i + 1 < args.length) {
      options.algorithm = args[i + 1] as typeof options.algorithm;
      i++;
    } else if (args[i] === '--resolution' && i + 1 < args.length) {
      options.resolution = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return options;
}

// Get default bounds for a problem
function getBoundsForProblem(problemName: string) {
  const boundsMap: Record<string, { minW0: number; maxW0: number; minW1: number; maxW1: number }> = {
    'rosenbrock': { minW0: -2, maxW0: 2, minW1: -1, maxW1: 3 },
    'quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'ill-conditioned-quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'non-convex-saddle': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 }
  };

  return boundsMap[problemName] || { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 };
}

// Get default algorithm parameters
function getAlgorithmParams(algorithm: string) {
  switch (algorithm) {
    case 'newton':
      return {
        maxIter: 50,
        c1: 0.0001,
        lambda: 0,
        hessianDamping: 0.01,
        lineSearch: 'armijo'
      };
    case 'lbfgs':
      return {
        maxIter: 50,
        m: 5,
        c1: 0.0001,
        lambda: 0
      };
    case 'gd-fixed':
      return {
        maxIter: 50,
        alpha: 0.01,
        lambda: 0
      };
    case 'gd-linesearch':
      return {
        maxIter: 50,
        c1: 0.0001,
        lambda: 0
      };
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

function main() {
  const options = parseArgs();

  console.log('🏃 Running basin computation benchmark');
  console.log('========================================');
  console.log(`Problem: ${options.problem}`);
  console.log(`Algorithm: ${options.algorithm}`);
  console.log(`Resolution: ${options.resolution}x${options.resolution}`);
  console.log('========================================\n');

  // Setup problem
  const problem = getProblem(options.problem);
  if (!problem) {
    console.error(`❌ Error: Problem '${options.problem}' not found`);
    console.log('Available problems: rosenbrock, quadratic, ill-conditioned-quadratic, non-convex-saddle');
    process.exit(1);
  }

  const problemFuncs = problemToProblemFunctions(problem);
  const bounds = getBoundsForProblem(options.problem);
  const algorithmParams = getAlgorithmParams(options.algorithm);

  // Initialize basin data
  const basinData = initializeBasinData(options.resolution, bounds);
  const totalPoints = options.resolution * options.resolution;

  // Timing variables
  const pointTimings: number[] = [];
  let convergedCount = 0;
  let divergedCount = 0;

  // Start computation
  const overallStart = performance.now();

  for (let i = 0; i < options.resolution; i++) {
    for (let j = 0; j < options.resolution; j++) {
      const pointIndex = i * options.resolution + j;

      // Compute starting point in parameter space
      const w0 = bounds.minW0 + (j / (options.resolution - 1)) * (bounds.maxW0 - bounds.minW0);
      const w1 = bounds.minW1 + (i / (options.resolution - 1)) * (bounds.maxW1 - bounds.minW1);
      const initialPoint: [number, number] = [w0, w1];

      // Time individual point computation (sample every 10th point)
      const shouldProfile = pointIndex % 10 === 0;
      const pointStart = shouldProfile ? performance.now() : 0;

      // Run algorithm from this starting point
      const result = computeBasinPoint(
        initialPoint,
        problemFuncs,
        options.algorithm,
        algorithmParams
      );

      if (shouldProfile) {
        const pointTime = performance.now() - pointStart;
        pointTimings.push(pointTime);

        // Show first few samples
        if (pointTimings.length <= 5) {
          console.log(`  Point ${pointIndex}/${totalPoints}: ${pointTime.toFixed(2)}ms`);
        }
      }

      // Store result
      basinData.grid[i][j] = result;

      // Count convergence/divergence
      if (result.converged) convergedCount++;
      if (result.diverged) divergedCount++;

      // Progress indicator every 25%
      if ((pointIndex + 1) % Math.floor(totalPoints / 4) === 0 || pointIndex + 1 === totalPoints) {
        const progress = ((pointIndex + 1) / totalPoints * 100).toFixed(0);
        console.log(`  Progress: ${progress}% (${pointIndex + 1}/${totalPoints} points)`);
      }
    }
  }

  const overallTime = performance.now() - overallStart;

  // Calculate statistics
  const avgPointTime = pointTimings.reduce((sum, t) => sum + t, 0) / pointTimings.length;
  const estimatedTotalComputeTime = avgPointTime * totalPoints;
  const pointsPerSecond = 1000 / avgPointTime;

  // Estimate browser overhead (RAF typically adds ~16ms per frame batch)
  // Assuming 10ms frame budget, we process ~10ms worth of points per frame
  const framesNeeded = Math.ceil(estimatedTotalComputeTime / 10);
  const rafOverhead = framesNeeded * 16; // ~16ms per RAF call
  const estimatedBrowserTime = estimatedTotalComputeTime + rafOverhead;

  // Output results
  console.log('\n⏱️  TIMING RESULTS');
  console.log('========================================');
  console.log(`Total time: ${overallTime.toFixed(2)}ms (${(overallTime / 1000).toFixed(2)}s)`);
  console.log(`Sampled points: ${pointTimings.length}/${totalPoints}`);
  console.log(`Average time per point: ${avgPointTime.toFixed(3)}ms`);
  console.log(`Points per second: ${pointsPerSecond.toFixed(1)}`);
  console.log(`Estimated pure compute time: ${estimatedTotalComputeTime.toFixed(2)}ms`);

  console.log('\n📊 SUMMARY STATISTICS');
  console.log('========================================');
  console.log(`Grid resolution: ${options.resolution}x${options.resolution} = ${totalPoints} points`);
  console.log(`Converged: ${convergedCount} (${(100 * convergedCount / totalPoints).toFixed(1)}%)`);
  console.log(`Diverged: ${divergedCount} (${(100 * divergedCount / totalPoints).toFixed(1)}%)`);

  console.log('\n📊 BROWSER ESTIMATES (with RAF)');
  console.log('========================================');
  console.log(`Estimated frames needed: ${framesNeeded}`);
  console.log(`Estimated RAF overhead: ${rafOverhead.toFixed(2)}ms`);
  console.log(`Expected browser time: ${estimatedBrowserTime.toFixed(2)}ms (${(estimatedBrowserTime / 1000).toFixed(2)}s)`);
  console.log(`RAF overhead percentage: ${(rafOverhead / estimatedBrowserTime * 100).toFixed(1)}%`);

  console.log('\n📊 SCALING ESTIMATES');
  console.log('========================================');
  const resolutions = [50, 100, 200];
  for (const res of resolutions) {
    const points = res * res;
    const time = avgPointTime * points;
    const frames = Math.ceil(time / 10);
    const withRAF = time + (frames * 16);
    console.log(`  ${res}x${res} (${points} pts): ${(time / 1000).toFixed(1)}s compute, ${(withRAF / 1000).toFixed(1)}s browser`);
  }

  console.log('\n✅ Benchmark complete!');
}

main();
