#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';

const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

// Check Hessian eigenvalues at the "converged" locations
const testPoints = [
  [2.2912, -10.7601, 19.5150],
  [2.3679, -11.1214, 20.1524],
  [2.3367, -10.9747, 19.8937]
];

console.log('Checking convexity at "converged" locations...\n');

testPoints.forEach((point, idx) => {
  const loss = problemFuncs.objective(point);
  const grad = problemFuncs.gradient(point);
  const hess = problemFuncs.hessian!(point);
  
  // Compute eigenvalues
  const gradNorm = Math.sqrt(grad.reduce((sum: number, g: number) => sum + g*g, 0));
  
  console.log(`Location ${idx + 1}: [${point.map(x => x.toFixed(4)).join(', ')}]`);
  console.log(`  Loss: ${loss.toFixed(10)}`);
  console.log(`  GradNorm: ${gradNorm.toExponential(4)}`);
  console.log(`  Hessian diagonal: [${hess[0][0].toFixed(6)}, ${hess[1][1].toFixed(6)}, ${hess[2][2].toFixed(6)}]`);
  console.log(`  Hessian determinant sign: ${Math.sign(hess[0][0] * hess[1][1] * hess[2][2])}`);
  console.log('');
});

// Find TRUE global minimum by running from [0,0,0] with high iterations
console.log('\n=== Finding TRUE global minimum ===');
const { runNewton } = await import('../src/algorithms/newton');

const trueMin = runNewton(problemFuncs, {
  initialPoint: [0, 0, 0],
  maxIter: 1000,
  c1: 0.0001,
  hessianDamping: 0.01,
  lineSearch: 'armijo',
  tolerance: 1e-10
});

console.log(`TRUE minimum: [${trueMin.summary.finalLocation.map(x => x.toFixed(6)).join(', ')}]`);
console.log(`Loss: ${trueMin.summary.finalLoss?.toFixed(10)}`);
console.log(`GradNorm: ${trueMin.summary.finalGradNorm?.toExponential(4)}`);
console.log(`Iterations: ${trueMin.summary.iterationCount}`);
