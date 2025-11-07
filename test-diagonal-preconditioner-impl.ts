#!/usr/bin/env tsx
import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runDiagonalPreconditioner } from './src/algorithms/diagonal-preconditioner';

console.log('Testing Diagonal Preconditioner Implementation\n');

// Test 1: θ=0° (should converge in 1-2 iterations)
console.log('Test 1: θ=0° (aligned with axes)');
const problem0 = createRotatedQuadratic(0);
const problemFuncs0 = problemToProblemFunctions(problem0);
const result0 = runDiagonalPreconditioner(problemFuncs0, {
  maxIter: 10,
  initialPoint: [2, 2]
});

console.log(`  Iterations: ${result0.iterations.length}`);
console.log(`  Converged: ${result0.summary.converged}`);
console.log(`  Final loss: ${result0.summary.finalLoss.toExponential(2)}`);
console.log(`  Final grad norm: ${result0.summary.finalGradNorm.toExponential(2)}`);
console.log(`  Expected: 1-2 iterations, converged\n`);

// Test 2: θ=45° (should take many iterations)
console.log('Test 2: θ=45° (rotated)');
const problem45 = createRotatedQuadratic(45);
const problemFuncs45 = problemToProblemFunctions(problem45);
const result45 = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2]
});

console.log(`  Iterations: ${result45.iterations.length}`);
console.log(`  Converged: ${result45.summary.converged}`);
console.log(`  Final loss: ${result45.summary.finalLoss.toExponential(2)}`);
console.log(`  Final grad norm: ${result45.summary.finalGradNorm.toExponential(2)}`);
console.log(`  Expected: 40+ iterations, converged\n`);

// Test 3: With line search
console.log('Test 3: With line search enabled');
const result45LS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: true
});

console.log(`  Iterations: ${result45LS.iterations.length}`);
console.log(`  Converged: ${result45LS.summary.converged}`);
console.log(`  Line search used: ${result45LS.iterations[0].lineSearchTrials !== undefined}\n`);

// Verify rotation dependence
const ratio = result45.iterations.length / result0.iterations.length;
console.log('Rotation Dependence:');
console.log(`  θ=0°: ${result0.iterations.length} iters`);
console.log(`  θ=45°: ${result45.iterations.length} iters`);
console.log(`  Ratio: ${ratio.toFixed(1)}× worse`);
console.log(`  Expected: ~20× difference\n`);

if (result0.summary.converged && result45.summary.converged && ratio > 15) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Tests failed!');
  process.exit(1);
}
