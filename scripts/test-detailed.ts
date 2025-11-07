#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { runNewton } from '../src/algorithms/newton';

const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

// Test one specific point
const result = runNewton(problemFuncs, {
  initialPoint: [0.158, 0.158, 19.83],
  maxIter: 50,
  c1: 0.0001,
  hessianDamping: 0.01,
  lineSearch: 'armijo',
  tolerance: 1e-4
});

console.log('Full result.summary:', JSON.stringify(result.summary, null, 2));
console.log('\nNumber of iterations:', result.iterations.length);
console.log('Last iteration:', result.iterations[result.iterations.length - 1]);
