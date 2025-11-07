#!/usr/bin/env tsx
/**
 * CLI script for basin computation benchmarking
 * Computes basin synchronously without RAF delays to diagnose performance
 */

import { getProblem } from '../src/problems/index';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { computeBasinPoint, initializeBasinData } from '../src/utils/basinComputation';
import { clusterConvergenceLocations } from '../src/utils/basinClustering';
import { generateCrescents } from '../src/shared-utils';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    problem: 'rosenbrock',
    algorithm: 'newton' as 'newton' | 'lbfgs' | 'gd-fixed' | 'gd-linesearch',
    resolution: 20,
    useUIBounds: false  // Flag to reproduce UI's buggy bounds
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
    } else if (args[i] === '--use-ui-bounds') {
      options.useUIBounds = true;
    }
  }

  return options;
}

// Get default bounds for a problem
// NOTE: The UI uses trajectory bounds (newtonParamBounds) which is CORRECT UX - it makes the basin
// picker match the visualization space so users can understand the relationship between initial
// points and trajectory. This CLI defaults to FIXED domain bounds for consistency with other problems.
// Use --use-ui-bounds flag to match UI's trajectory-based bounds.
function getBoundsForProblem(problemName: string, useUIBounds: boolean = false) {
  // CORRECT domain bounds for each problem
  const domainBounds: Record<string, { minW0: number; maxW0: number; minW1: number; maxW1: number }> = {
    'rosenbrock': { minW0: -2, maxW0: 2, minW1: -1, maxW1: 3 },
    'quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'ill-conditioned-quadratic': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'non-convex-saddle': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 },
    'himmelblau': { minW0: -6, maxW0: 6, minW1: -6, maxW1: 6 },
    'three-hump-camel': { minW0: -5, maxW0: 5, minW1: -5, maxW1: 5 },
    'logistic-regression': { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 }
  };

  // UI trajectory bounds (from a Newton run with biasSlice=19.83)
  // These match the visualization space - CORRECT UX, not a bug
  const uiTrajectoryBounds: Record<string, { minW0: number; maxW0: number; minW1: number; maxW1: number }> = {
    'logistic-regression': {
      minW0: -1.858879030489752,
      maxW0: 6.516912396940847,
      minW1: -25.264024095832582,
      maxW1: 3.387638554166598
    }
  };

  if (useUIBounds && uiTrajectoryBounds[problemName]) {
    console.log('ℹ️  Using UI trajectory bounds (matches visualization space)');
    return uiTrajectoryBounds[problemName];
  }

  return domainBounds[problemName] || { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 };
}

// Get default algorithm parameters
function getAlgorithmParams(algorithm: string) {
  switch (algorithm) {
    case 'newton':
      return {
        maxIter: 50,  // MATCH UI EXACTLY
        c1: 0.0001,
        lambda: 0,
        hessianDamping: 0.01,
        lineSearch: 'armijo',
        tolerance: 1e-4,
        biasSlice: 19.83  // MATCH UI EXACTLY
      };
    case 'lbfgs':
      return {
        maxIter: 50,
        m: 5,
        c1: 0.0001,
        lambda: 0,
        tolerance: 1e-4,
        biasSlice: 0
      };
    case 'gd-fixed':
      return {
        maxIter: 50,
        alpha: 0.01,
        lambda: 0,
        tolerance: 1e-4,
        biasSlice: 0
      };
    case 'gd-linesearch':
      return {
        maxIter: 50,
        c1: 0.0001,
        lambda: 0,
        tolerance: 1e-4,
        biasSlice: 0
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
  let problemFuncs: { objective: (w: number[]) => number; gradient: (w: number[]) => number[]; hessian?: (w: number[]) => number[][]; dimensionality?: number };
  if (options.problem === 'logistic-regression') {
    const data = generateCrescents();  // MATCH UI EXACTLY - uses default params (n=70, noise=0.25, seed=42)
    // Use same lambda as UI default (0.0001) for problem functions
    problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);
  } else {
    const problem = getProblem(options.problem);
    if (!problem) {
      console.error(`❌ Error: Problem '${options.problem}' not found`);
      console.log('Available problems: rosenbrock, quadratic, ill-conditioned-quadratic, non-convex-saddle, logistic-regression');
      process.exit(1);
    }
    problemFuncs = problemToProblemFunctions(problem);
  }

  const bounds = getBoundsForProblem(options.problem, options.useUIBounds);
  console.log('Bounds:', bounds);
  const algorithmParams = getAlgorithmParams(options.algorithm);
  console.log('Algorithm params:', algorithmParams);

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

      // Debug first few points
      if (pointIndex < 5) {
        console.log(`  Point ${pointIndex}: converged=${result.converged}, diverged=${result.diverged}, loc=[${result.convergenceLoc[0].toFixed(6)}, ${result.convergenceLoc[1].toFixed(6)}], iters=${result.iterations}`);
      }

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

  // Clustering diagnostics
  console.log('\n🎯 CLUSTERING DIAGNOSTICS');
  console.log('========================================');

  // Collect all convergence locations (exclude stalled points)
  const convergenceLocations: Array<{ loc: [number, number]; count: number }> = [];
  basinData.grid.forEach((row) => {
    row.forEach((point) => {
      if (point.converged && !point.stalled) {
        // Check if we already have this location
        const existing = convergenceLocations.find(
          c => Math.abs(c.loc[0] - point.convergenceLoc[0]) < 1e-10 &&
               Math.abs(c.loc[1] - point.convergenceLoc[1]) < 1e-10
        );
        if (existing) {
          existing.count++;
        } else {
          convergenceLocations.push({ loc: point.convergenceLoc, count: 1 });
        }
      }
    });
  });

  console.log(`\nUnique convergence locations (exact): ${convergenceLocations.length}`);
  convergenceLocations.sort((a, b) => b.count - a.count);
  convergenceLocations.forEach((c, idx) => {
    console.log(`  Location ${idx + 1}: [${c.loc[0].toFixed(6)}, ${c.loc[1].toFixed(6)}] (${c.count} points)`);
  });

  // Run clustering algorithm
  const clusterIds = clusterConvergenceLocations(basinData);
  const numClusters = Math.max(...clusterIds) + 1;

  console.log(`\nClusters detected (threshold=1.0): ${numClusters}`);

  // Show which locations are in which cluster (exclude stalled points)
  const clusterMap = new Map<number, Array<{ loc: [number, number]; count: number }>>();
  basinData.grid.forEach((row, i) => {
    row.forEach((point, j) => {
      if (point.converged && !point.stalled) {
        const idx = i * basinData.resolution + j;
        const clusterId = clusterIds[idx];
        if (clusterId >= 0) {
          if (!clusterMap.has(clusterId)) {
            clusterMap.set(clusterId, []);
          }
          const cluster = clusterMap.get(clusterId)!;
          const existing = cluster.find(
            c => Math.abs(c.loc[0] - point.convergenceLoc[0]) < 1e-10 &&
                 Math.abs(c.loc[1] - point.convergenceLoc[1]) < 1e-10
          );
          if (existing) {
            existing.count++;
          } else {
            cluster.push({ loc: point.convergenceLoc, count: 1 });
          }
        }
      }
    });
  });

  for (let c = 0; c < numClusters; c++) {
    const cluster = clusterMap.get(c) || [];
    const totalPoints = cluster.reduce((sum, loc) => sum + loc.count, 0);
    console.log(`\n  Cluster ${c + 1} (${totalPoints} points):`);
    cluster.forEach(loc => {
      console.log(`    [${loc.loc[0].toFixed(6)}, ${loc.loc[1].toFixed(6)}] (${loc.count} points)`);
    });

    // Calculate pairwise distances within cluster
    if (cluster.length > 1) {
      console.log(`    Pairwise distances within cluster:`);
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          const dist = Math.sqrt(
            Math.pow(cluster[i].loc[0] - cluster[j].loc[0], 2) +
            Math.pow(cluster[i].loc[1] - cluster[j].loc[1], 2)
          );
          console.log(`      Distance between location ${i+1} and ${j+1}: ${dist.toFixed(6)}`);
        }
      }
    }
  }

  console.log('\n✅ Benchmark complete!');
}

main();
