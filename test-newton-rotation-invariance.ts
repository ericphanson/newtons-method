#!/usr/bin/env tsx
/**
 * Verify Newton's method is truly rotation-invariant
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runNewton } from './src/algorithms/newton';
import { runLBFGS } from './src/algorithms/lbfgs';

function testNewtonRotation(thetaDegrees: number) {
  const problem = createRotatedQuadratic(thetaDegrees);
  const problemFuncs = problemToProblemFunctions(problem);

  const initialPoint: [number, number] = [2, 2];

  const iterations = runNewton(problemFuncs, {
    maxIter: 20,
    c1: 0.0001,
    lambda: 0,
    hessianDamping: 0,
    lineSearch: 'armijo',
    initialPoint
  });

  const lastIter = iterations[iterations.length - 1];
  return {
    theta: thetaDegrees,
    iterations: iterations.length,
    finalLoss: lastIter.newLoss,
    finalGradNorm: lastIter.gradNorm,
    converged: lastIter.gradNorm < 1e-5
  };
}

function testLBFGSRotation(thetaDegrees: number) {
  const problem = createRotatedQuadratic(thetaDegrees);
  const problemFuncs = problemToProblemFunctions(problem);

  const initialPoint: [number, number] = [2, 2];

  const iterations = runLBFGS(problemFuncs, {
    maxIter: 20,
    m: 5,
    c1: 0.0001,
    lambda: 0,
    initialPoint
  });

  const lastIter = iterations[iterations.length - 1];
  return {
    theta: thetaDegrees,
    iterations: iterations.length,
    finalLoss: lastIter.newLoss,
    finalGradNorm: lastIter.gradNorm,
    converged: lastIter.gradNorm < 1e-5
  };
}

console.log('Testing rotation invariance for second-order methods');
console.log('Initial point: [2, 2], Problem: Rotated ellipse (κ=5)');
console.log('='.repeat(80));

// Test multiple angles
const angles = [0, 15, 30, 45, 60, 75, 90];

console.log('\n🔹 NEWTON\'S METHOD');
console.log('-'.repeat(80));
const newtonResults = angles.map(testNewtonRotation);
newtonResults.forEach(r => {
  console.log(`θ=${r.theta.toString().padStart(2)}°: ${r.iterations} iters, loss=${r.finalLoss.toExponential(2)}, grad_norm=${r.finalGradNorm.toExponential(2)}`);
});

console.log('\n🔹 L-BFGS');
console.log('-'.repeat(80));
const lbfgsResults = angles.map(testLBFGSRotation);
lbfgsResults.forEach(r => {
  console.log(`θ=${r.theta.toString().padStart(2)}°: ${r.iterations} iters, loss=${r.finalLoss.toExponential(2)}, grad_norm=${r.finalGradNorm.toExponential(2)}`);
});

console.log('\n' + '='.repeat(80));
console.log('📊 ANALYSIS');
console.log('='.repeat(80));

const newtonIterCounts = newtonResults.map(r => r.iterations);
const lbfgsIterCounts = lbfgsResults.map(r => r.iterations);

const newtonMin = Math.min(...newtonIterCounts);
const newtonMax = Math.max(...newtonIterCounts);
const lbfgsMin = Math.min(...lbfgsIterCounts);
const lbfgsMax = Math.max(...lbfgsIterCounts);

console.log(`\nNewton: ${newtonMin}-${newtonMax} iterations across all angles`);
console.log(`L-BFGS: ${lbfgsMin}-${lbfgsMax} iterations across all angles`);

if (newtonMax === newtonMin) {
  console.log(`\n✅ Newton's method is PERFECTLY rotation-invariant (constant ${newtonMin} iters)`);
} else {
  console.log(`\n⚠️  Newton varies by ${newtonMax - newtonMin} iterations (${((newtonMax - newtonMin) / newtonMin * 100).toFixed(1)}% variation)`);
}

if (lbfgsMax === lbfgsMin) {
  console.log(`✅ L-BFGS is PERFECTLY rotation-invariant (constant ${lbfgsMin} iters)`);
} else {
  console.log(`⚠️  L-BFGS varies by ${lbfgsMax - lbfgsMin} iterations (${((lbfgsMax - lbfgsMin) / lbfgsMin * 100).toFixed(1)}% variation)`);
}
