#!/usr/bin/env tsx
/**
 * Debug Newton's method on multimodal problems
 * Check for stalling/convergence issues
 */

import { himmelblauProblem } from '../src/problems/himmelblau';
import { threeHumpCamelProblem } from '../src/problems/threeHumpCamel';
import { problemToProblemFunctions } from '../src/utils/problemAdapter';
import { runNewton } from '../src/algorithms/newton';

function analyzeIterations(iterations: Array<{ w: number[]; wNew?: number[]; newLoss: number; gradNorm: number }>, problemName: string, initialPoint: number[]) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${problemName} from [${initialPoint.map(x => x.toFixed(2)).join(', ')}]`);
  console.log('='.repeat(70));

  const n = iterations.length;
  console.log(`Total iterations: ${n}`);

  if (n === 0) {
    console.log('⚠️  No iterations!');
    return;
  }

  // Show first few
  console.log('\nFirst 5 iterations:');
  for (let i = 0; i < Math.min(5, n); i++) {
    const it = iterations[i];
    console.log(`  ${i}: w=[${it.w.map((x: number) => x.toFixed(6)).join(', ')}] f=${it.newLoss.toFixed(8)} ||∇f||=${it.gradNorm.toFixed(8)}`);
  }

  // Show last 10
  console.log(`\nLast 10 iterations:`);
  for (let i = Math.max(0, n - 10); i < n; i++) {
    const it = iterations[i];
    const step = i > 0 ? Math.sqrt(it.w.reduce((sum: number, w: number, j: number) =>
      sum + Math.pow(w - iterations[i-1].w[j], 2), 0)) : 0;
    console.log(`  ${i}: w=[${it.w.map((x: number) => x.toFixed(6)).join(', ')}] f=${it.newLoss.toFixed(8)} ||∇f||=${it.gradNorm.toFixed(8)} step=${step.toExponential(3)}`);
  }

  // Check for stalling
  let stallingStart = -1;
  for (let i = n - 1; i > 0; i--) {
    const step = Math.sqrt(iterations[i].w.reduce((sum: number, w: number, j: number) =>
      sum + Math.pow(w - iterations[i-1].w[j], 2), 0));
    if (step > 1e-8) {
      stallingStart = i + 1;
      break;
    }
  }

  if (stallingStart > 0 && stallingStart < n - 5) {
    console.log(`\n⚠️  STALLING DETECTED at iteration ${stallingStart}`);
    console.log(`   ${n - stallingStart} iterations with steps < 1e-8`);
    const lastIt = iterations[n - 1];
    console.log(`   Final gradient norm: ${lastIt.gradNorm.toExponential(3)}`);
    console.log(`   Final loss: ${lastIt.newLoss.toFixed(8)}`);
  }

  // Check convergence
  const lastIt = iterations[n - 1];
  if (lastIt.gradNorm < 1e-6) {
    console.log(`\n✅ CONVERGED: ||∇f|| = ${lastIt.gradNorm.toExponential(3)} < 1e-6`);
  } else if (lastIt.gradNorm < 1e-4) {
    console.log(`\n⚠️  NEAR CONVERGED: ||∇f|| = ${lastIt.gradNorm.toExponential(3)} (tolerance is 1e-4)`);
  } else {
    console.log(`\n❌ NOT CONVERGED: ||∇f|| = ${lastIt.gradNorm.toExponential(3)} > 1e-4`);
  }
}

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║        Debugging Newton Method on Multimodal Problems             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');

// Test points for Himmelblau
const himmelblauTests = [
  [0, 0],
  [1, 1],
  [-1, -1],
  [2, 2],
  [0.5, 0.5],
];

const himmelblauFuncs = problemToProblemFunctions(himmelblauProblem);

for (const point of himmelblauTests) {
  const result = runNewton(himmelblauFuncs, {
    maxIter: 200,
    c1: 0.0001,
    lambda: 0,
    hessianDamping: 0.01,
    lineSearch: 'armijo',
    initialPoint: point,
    tolerance: 1e-4
  });
  analyzeIterations(result.iterations, "Himmelblau", point);
}

// Test points for Three-Hump Camel
const camelTests = [
  [0, 0],
  [1, 0.5],
  [-1, -0.5],
  [2, 0],
];

const camelFuncs = problemToProblemFunctions(threeHumpCamelProblem);

for (const point of camelTests) {
  const result = runNewton(camelFuncs, {
    maxIter: 200,
    c1: 0.0001,
    lambda: 0,
    hessianDamping: 0.01,
    lineSearch: 'armijo',
    initialPoint: point,
    tolerance: 1e-4
  });
  analyzeIterations(result.iterations, "Three-Hump Camel", point);
}
