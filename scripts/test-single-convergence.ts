#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { runNewton } from '../src/algorithms/newton';

// Match UI exactly
const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

// Test a specific starting point from the grid
// Grid position (0, 0) -> (-3, -3, 19.83)
const bounds = { minW0: -3, maxW0: 3, minW1: -3, maxW1: 3 };
const resolution = 20;

console.log('Testing convergence from specific grid positions...\n');

// Test several grid positions
for (const i of [0, 5, 10, 15, 19]) {
  for (const j of [0, 5, 10, 15, 19]) {
    const w0 = bounds.minW0 + (j / (resolution - 1)) * (bounds.maxW0 - bounds.minW0);
    const w1 = bounds.minW1 + (i / (resolution - 1)) * (bounds.maxW1 - bounds.minW1);
    const biasSlice = 19.83;

    const result = runNewton(problemFuncs, {
      initialPoint: [w0, w1, biasSlice],
      maxIter: 50,
      c1: 0.0001,
      hessianDamping: 0.01,
      lineSearch: 'armijo',
      tolerance: 1e-4
    });

    console.log(`Grid [${i},${j}] Start: [${w0.toFixed(3)}, ${w1.toFixed(3)}, ${biasSlice.toFixed(2)}]`);
    console.log(`  Converged: ${result.summary.converged}, Iters: ${result.summary.iterationCount}, FinalGradNorm: ${result.summary.finalGradientNorm?.toExponential(2)}`);
    
    if (result.summary.converged) {
      console.log(`  ✅ Final location: [${result.summary.finalLocation[0].toFixed(6)}, ${result.summary.finalLocation[1].toFixed(6)}]`);
    }
  }
}
