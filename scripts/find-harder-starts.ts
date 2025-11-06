#!/usr/bin/env tsx
/**
 * Find starting points that produce interesting iteration counts
 * Tests random points within problem domains
 */

import { getProblem } from '../src/problems';
import { problemToProblemFunctions } from '../src/utils/problemAdapter';
import { runGradientDescentLineSearch } from '../src/algorithms/gradient-descent-linesearch';
import { runNewton } from '../src/algorithms/newton';
import { runLBFGS } from '../src/algorithms/lbfgs';

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function testStartingPoint(
  problem: string,
  algorithm: 'newton' | 'lbfgs' | 'gd-linesearch',
  start: [number, number]
): number {
  const prob = getProblem(problem);
  if (!prob) return 0;

  const problemFuncs = problemToProblemFunctions(prob);
  const options = {
    maxIter: 300,
    c1: 0.0001,
    lambda: 0,
    initialPoint: start
  };

  let iterations;
  try {
    if (algorithm === 'newton') {
      iterations = runNewton(problemFuncs, options);
    } else if (algorithm === 'lbfgs') {
      iterations = runLBFGS(problemFuncs, { ...options, m: 5 });
    } else {
      iterations = runGradientDescentLineSearch(problemFuncs, options);
    }
    return iterations.length;
  } catch {
    return 0;
  }
}

interface TestCase {
  problem: string;
  algorithm: 'newton' | 'lbfgs' | 'gd-linesearch';
}

const testCases: TestCase[] = [
  { problem: 'quadratic', algorithm: 'newton' },
  { problem: 'quadratic', algorithm: 'lbfgs' },
  { problem: 'quadratic', algorithm: 'gd-linesearch' },
  { problem: 'ill-conditioned-quadratic', algorithm: 'newton' },
  { problem: 'non-convex-saddle', algorithm: 'newton' },
];

console.log('Finding harder starting points for fast-converging cases...\n');

for (const testCase of testCases) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Problem: ${testCase.problem} | Algorithm: ${testCase.algorithm}`);
  console.log('='.repeat(70));

  const prob = getProblem(testCase.problem);
  if (!prob || !prob.domain) {
    console.log('Skipping: no domain info');
    continue;
  }

  const [w0Min, w0Max] = prob.domain.w0;
  const [w1Min, w1Max] = prob.domain.w1;

  let maxIters = 0;
  let bestStart: [number, number] = [0, 0];

  // Test 20 random starting points
  for (let i = 0; i < 20; i++) {
    const start: [number, number] = [
      randomInRange(w0Min, w0Max),
      randomInRange(w1Min, w1Max)
    ];

    const iters = testStartingPoint(testCase.problem, testCase.algorithm, start);

    if (iters > maxIters) {
      maxIters = iters;
      bestStart = start;
    }

    if (i < 5 || iters > 2) {
      console.log(`  Try ${i + 1}: [${start[0].toFixed(2)}, ${start[1].toFixed(2)}] → ${iters} iterations`);
    }
  }

  console.log(`\n  🎯 Best found: [${bestStart[0].toFixed(3)}, ${bestStart[1].toFixed(3)}] → ${maxIters} iterations`);

  if (maxIters <= 2) {
    console.log('  ⚠️  Could not find starting point with >2 iterations');
  }
}

console.log('\n' + '='.repeat(70));
console.log('Summary: Second-order methods are extremely efficient on these problems!');
console.log('Even random starting points converge in ~2 iterations.');
console.log('='.repeat(70));
