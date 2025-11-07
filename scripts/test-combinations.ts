#!/usr/bin/env tsx
/**
 * CLI script to test algorithm/problem combinations
 *
 * Usage:
 *   npm run test-combo -- --problem rosenbrock --algorithm lbfgs --alpha 0.001 --maxIter 100
 *   npm run test-combo -- --all  # Test all combinations
 */

import { getProblem } from '../src/problems';
import { problemToProblemFunctions, logisticRegressionToProblemFunctions, separatingHyperplaneToProblemFunctions } from '../src/utils/problemAdapter';
import { runGradientDescent } from '../src/algorithms/gradient-descent';
import { runGradientDescentLineSearch } from '../src/algorithms/gradient-descent-linesearch';
import { runNewton } from '../src/algorithms/newton';
import { runLBFGS } from '../src/algorithms/lbfgs';
import { getProblemDefaults } from '../src/utils/problemDefaults';
import { generateCrescents } from '../src/shared-utils';
import type { SeparatingHyperplaneVariant } from '../src/types/experiments';

interface TestConfig {
  problem: string;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
  initialPoint?: [number, number] | [number, number, number];
  maxIter?: number;
  // Algorithm-specific params
  alpha?: number;  // For GD fixed
  c1?: number;     // For line search algorithms
  m?: number;      // For L-BFGS
  hessianDamping?: number; // For Newton and L-BFGS
  lineSearch?: 'armijo' | 'none'; // For Newton
  // Problem-specific params
  variant?: SeparatingHyperplaneVariant;  // For separating-hyperplane
  lambda?: number; // For logistic-regression
}

interface TestResult {
  config: TestConfig;
  iterations: number;
  finalLoss: number;
  finalGradNorm: number;
  converged: boolean;
  diverged: boolean;
  error?: string;
}

function runTest(config: TestConfig): TestResult {
  const {
    problem: problemName,
    algorithm,
    initialPoint,
    maxIter = 100,
    alpha = 0.1,
    c1 = 0.0001,
    m = 5,
    hessianDamping = 0.01,
    lineSearch = 'armijo',
    variant = 'soft-margin',
    lambda = 0.001
  } = config;

  try {
    // Handle dataset-based problems (logistic-regression, separating-hyperplane)
    let problemFuncs: { objective: (w: number[]) => number; gradient: (w: number[]) => number[]; hessian?: (w: number[]) => number[][]; dimensionality?: number };
    let defaultInitialPoint: [number, number] | [number, number, number];

    if (problemName === 'logistic-regression') {
      // Generate dataset for logistic regression
      const data = generateCrescents(50, 0.5, 0.3);
      problemFuncs = logisticRegressionToProblemFunctions(data, lambda);
      defaultInitialPoint = [0, 0, 0];
    } else if (problemName === 'separating-hyperplane') {
      // Generate dataset for separating hyperplane
      const data = generateCrescents(50, 0.5, 0.3);
      problemFuncs = separatingHyperplaneToProblemFunctions(data, variant, lambda);
      defaultInitialPoint = [0, 0, 0];
    } else {
      // Get problem from registry
      const problem = getProblem(problemName);
      if (!problem) {
        return {
          config,
          iterations: 0,
          finalLoss: NaN,
          finalGradNorm: NaN,
          converged: false,
          diverged: false,
          error: `Problem '${problemName}' not found`
        };
      }
      problemFuncs = problemToProblemFunctions(problem);
      defaultInitialPoint = [-1, 1];
    }

    const finalInitialPoint = initialPoint || defaultInitialPoint;

    // Run algorithm
    let algorithmResult: { iterations: Array<{ w: number[]; wNew: number[]; newLoss: number; gradNorm: number }> };
    switch (algorithm) {
      case 'gd-fixed':
        algorithmResult = runGradientDescent(problemFuncs, {
          maxIter,
          alpha,
          lambda: 0,
          initialPoint: finalInitialPoint
        });
        break;
      case 'gd-linesearch':
        algorithmResult = runGradientDescentLineSearch(problemFuncs, {
          maxIter,
          c1,
          lambda: 0,
          initialPoint: finalInitialPoint
        });
        break;
      case 'newton':
        algorithmResult = runNewton(problemFuncs, {
          maxIter,
          c1,
          lambda: 0,
          hessianDamping,
          lineSearch,
          initialPoint: finalInitialPoint
        });
        break;
      case 'lbfgs':
        algorithmResult = runLBFGS(problemFuncs, {
          maxIter,
          m,
          c1,
          lambda: 0,
          initialPoint: finalInitialPoint
        });
        break;
      default:
        return {
          config,
          iterations: 0,
          finalLoss: NaN,
          finalGradNorm: NaN,
          converged: false,
          diverged: false,
          error: `Unknown algorithm: ${algorithm}`
        };
    }

    const iterations = algorithmResult.iterations;

    if (iterations.length === 0) {
      return {
        config,
        iterations: 0,
        finalLoss: NaN,
        finalGradNorm: NaN,
        converged: false,
        diverged: true,
        error: 'No iterations produced'
      };
    }

    const lastIter = iterations[iterations.length - 1];
    const finalLoss = lastIter.newLoss;
    const finalGradNorm = lastIter.gradNorm;

    // Check for divergence (NaN/Infinity)
    const diverged = !isFinite(finalLoss) || !isFinite(finalGradNorm);

    // Check for convergence (gradient small enough)
    const converged = finalGradNorm < 1e-5 && !diverged;

    const result: TestResult = {
      config,
      iterations: iterations.length,
      finalLoss,
      finalGradNorm,
      converged,
      diverged
    };

    // Store iterations for reporting
    (result as Record<string, unknown>).lastIter = lastIter;
    (result as Record<string, unknown>).allIterations = iterations;

    return result;
  } catch (error) {
    return {
      config,
      iterations: 0,
      finalLoss: NaN,
      finalGradNorm: NaN,
      converged: false,
      diverged: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function printResult(result: TestResult) {
  const { config, iterations, finalLoss, finalGradNorm, converged, diverged, error } = result;

  console.log('\n' + '='.repeat(70));
  console.log(`Problem: ${config.problem} | Algorithm: ${config.algorithm}`);
  console.log(`Initial: [${config.initialPoint?.join(', ')}] | MaxIter: ${config.maxIter}`);
  if (config.alpha !== undefined) console.log(`  alpha: ${config.alpha}`);
  if (config.c1 !== undefined) console.log(`  c1: ${config.c1}`);
  if (config.m !== undefined) console.log(`  m: ${config.m}`);
  if (config.hessianDamping !== undefined) console.log(`  hessianDamping: ${config.hessianDamping}`);
  if (config.lineSearch !== undefined) console.log(`  lineSearch: ${config.lineSearch}`);
  console.log('-'.repeat(70));

  if (error) {
    console.log(`❌ ERROR: ${error}`);
  } else if (diverged) {
    console.log(`❌ DIVERGED after ${iterations} iterations`);
    console.log(`   Final loss: ${finalLoss.toExponential(2)}`);
    console.log(`   Final grad norm: ${finalGradNorm.toExponential(2)}`);
  } else if (converged) {
    console.log(`✅ CONVERGED in ${iterations} iterations`);
    console.log(`   Final loss: ${finalLoss.toExponential(6)}`);
    console.log(`   Final grad norm: ${finalGradNorm.toExponential(2)}`);
    const lastIterStored = (result as Record<string, unknown>).lastIter as { wNew: number[] } | undefined;
    if (lastIterStored && lastIterStored.wNew) {
      console.log(`   Final position: [${lastIterStored.wNew.map((x: number) => x.toFixed(6)).join(', ')}]`);
    }

    // Show iteration path for debugging
    const allIters = (result as Record<string, unknown>).allIterations as Array<{ w: number[]; wNew: number[]; newLoss: number; gradNorm: number }> | undefined;
    if (allIters) {
      if (allIters.length <= 5) {
        console.log(`   Iteration path:`);
        allIters.forEach((it, idx: number) => {
          console.log(`     ${idx}: w_before=[${it.w.map((x: number) => x.toFixed(4)).join(', ')}] → w_after=[${it.wNew.map((x: number) => x.toFixed(4)).join(', ')}] loss=${it.newLoss.toExponential(2)} grad@w=${it.gradNorm.toExponential(2)}`);
        });
      } else {
        // For long paths, just show first iteration
        const first = allIters[0];
        console.log(`   First iteration: w_before=[${first.w.map((x: number) => x.toFixed(4)).join(', ')}] → w_after=[${first.wNew.map((x: number) => x.toFixed(4)).join(', ')}]`);
      }
    }
  } else {
    console.log(`⚠️  DID NOT CONVERGE (reached maxIter=${config.maxIter})`);
    console.log(`   Iterations: ${iterations}`);
    console.log(`   Final loss: ${finalLoss.toExponential(6)}`);
    console.log(`   Final grad norm: ${finalGradNorm.toExponential(2)}`);
  }
}

// Parse command line arguments
function parseArgs(): { configs: TestConfig[], runAll: boolean } {
  const args = process.argv.slice(2);

  if (args.includes('--all')) {
    return { configs: [], runAll: true };
  }

  const config: TestConfig = {
    problem: 'quadratic',
    algorithm: 'gd-fixed'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--problem':
        config.problem = next;
        i++;
        break;
      case '--algorithm':
      case '--alg':
        config.algorithm = next as TestConfig['algorithm'];
        i++;
        break;
      case '--initial': {
        const initialValues = next.split(',').map(Number);
        // Support both 2D and 3D initial points
        if (initialValues.length === 2) {
          config.initialPoint = [initialValues[0], initialValues[1]];
        } else if (initialValues.length === 3) {
          config.initialPoint = [initialValues[0], initialValues[1], initialValues[2]];
        } else {
          throw new Error(`Invalid initial point: expected 2 or 3 values, got ${initialValues.length}`);
        }
        i++;
        break;
      }
      case '--maxIter':
        config.maxIter = parseInt(next);
        i++;
        break;
      case '--alpha':
        config.alpha = parseFloat(next);
        i++;
        break;
      case '--c1':
        config.c1 = parseFloat(next);
        i++;
        break;
      case '--m':
        config.m = parseInt(next);
        i++;
        break;
      case '--variant':
        config.variant = next as SeparatingHyperplaneVariant;
        i++;
        break;
      case '--lambda':
        config.lambda = parseFloat(next);
        i++;
        break;
      case '--hessianDamping':
        config.hessianDamping = parseFloat(next);
        i++;
        break;
      case '--lineSearch':
        config.lineSearch = next as 'armijo' | 'none';
        i++;
        break;
    }
  }

  return { configs: [config], runAll: false };
}

// Test all combinations
function testAllCombinations(): TestResult[] {
  const problems = [
    'quadratic',
    'ill-conditioned-quadratic',
    'rosenbrock',
    'non-convex-saddle',
    'logistic-regression',
    'separating-hyperplane'
  ];
  const algorithms: TestConfig['algorithm'][] = ['gd-fixed', 'gd-linesearch', 'newton', 'lbfgs'];
  const separatingHyperplaneVariants: SeparatingHyperplaneVariant[] = ['soft-margin', 'perceptron', 'squared-hinge'];

  const configs: TestConfig[] = [];

  for (const problem of problems) {
    for (const algorithm of algorithms) {
      // Get problem-specific defaults
      const defaults = getProblemDefaults(problem);

      // For separating hyperplane, test all variants
      if (problem === 'separating-hyperplane') {
        for (const variant of separatingHyperplaneVariants) {
          const config: TestConfig = {
            problem,
            algorithm,
            initialPoint: defaults.initialPoint as [number, number, number],
            maxIter: defaults.maxIter,
            variant
          };

          // Algorithm-specific parameters
          if (algorithm === 'gd-fixed') {
            config.alpha = defaults.gdFixedAlpha;
          } else {
            config.c1 = defaults.c1;
            if (algorithm === 'lbfgs') {
              config.m = defaults.lbfgsM;
            }
          }

          configs.push(config);
        }
      } else {
        // Default configs using problem-specific values
        const config: TestConfig = {
          problem,
          algorithm,
          initialPoint: defaults.initialPoint,
          maxIter: defaults.maxIter
        };

        // Algorithm-specific parameters
        if (algorithm === 'gd-fixed') {
          config.alpha = defaults.gdFixedAlpha;
        } else {
          config.c1 = defaults.c1;
          if (algorithm === 'lbfgs') {
            config.m = defaults.lbfgsM;
          }
        }

        // Problem-specific parameters
        if (problem === 'logistic-regression') {
          config.lambda = 0.001;
        }

        configs.push(config);
      }
    }
  }

  return configs.map(runTest);
}

// Main
function main() {
  const { configs, runAll } = parseArgs();

  if (runAll) {
    console.log('Running all problem/algorithm combinations...\n');
    const results = testAllCombinations();

    results.forEach(printResult);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    const converged = results.filter(r => r.converged).length;
    const diverged = results.filter(r => r.diverged).length;
    const incomplete = results.filter(r => !r.converged && !r.diverged && !r.error).length;
    const errors = results.filter(r => r.error).length;

    console.log(`Total tests: ${results.length}`);
    console.log(`✅ Converged: ${converged}`);
    console.log(`⚠️  Incomplete: ${incomplete}`);
    console.log(`❌ Diverged: ${diverged}`);
    if (errors > 0) console.log(`❌ Errors: ${errors}`);
  } else {
    configs.forEach(config => {
      const result = runTest(config);
      printResult(result);
    });
  }
}

main();
