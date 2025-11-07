#!/usr/bin/env tsx
import { getProblem } from './src/problems';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runGradientDescent } from './src/algorithms/gradient-descent';

const problem = getProblem('quadratic');
if (!problem) throw new Error('Problem not found');

const problemFuncs = problemToProblemFunctions(problem);

const iterations = runGradientDescent(problemFuncs, {
  maxIter: 100,
  alpha: 0.1,
  lambda: 0,
  initialPoint: [1, 1],
  tolerance: 1e-6
});

console.log(`Total iterations: ${iterations.length}`);
console.log(`\nFirst iteration:`);
console.log(`  w: [${iterations[0].w}]`);
console.log(`  gradNorm: ${iterations[0].gradNorm.toExponential(6)}`);
console.log(`  wNew: [${iterations[0].wNew}]`);

if (iterations.length >= 68) {
  console.log(`\nIteration 67 (68th iteration, 0-indexed):`);
  console.log(`  w: [${iterations[67].w}]`);
  console.log(`  gradNorm: ${iterations[67].gradNorm.toExponential(6)}`);
  console.log(`  wNew: [${iterations[67].wNew}]`);
}

const lastIter = iterations[iterations.length - 1];
console.log(`\nLast iteration (${lastIter.iter}):`);
console.log(`  w: [${lastIter.w}]`);
console.log(`  gradNorm: ${lastIter.gradNorm.toExponential(6)}`);
console.log(`  wNew: [${lastIter.wNew}]`);

// Compute gradient at the final wNew
const finalGrad = problemFuncs.gradient(lastIter.wNew);
const finalGradNorm = Math.sqrt(finalGrad.reduce((sum, g) => sum + g*g, 0));
console.log(`\nGradient at final wNew: ${finalGradNorm.toExponential(6)}`);
console.log(`\nThis explains the bug: we report gradNorm at w, but the algorithm has moved to wNew!`);
