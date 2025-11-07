#!/usr/bin/env tsx

/**
 * Detailed test of Newton's method on perceptron.
 * Shows iteration-by-iteration behavior to diagnose instability.
 */

import { readFileSync } from 'fs';
import { DataPoint } from './src/shared-utils';
import {
  perceptronObjective,
  perceptronGradient,
  perceptronHessian,
} from './src/utils/separatingHyperplane';

// Load dataset
const dataPath = './python/datasets/crescent.json';
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
const dataPoints: DataPoint[] = data.points;

const lambda = 0.1;

console.log('='.repeat(70));
console.log('PERCEPTRON NEWTON METHOD - DETAILED ANALYSIS');
console.log('='.repeat(70));
console.log(`Dataset: ${dataPath.split('/').pop()}`);
console.log(`Points: ${dataPoints.length}`);
console.log(`Lambda: ${lambda}`);
console.log('');

// Test multiple starting points
const startingPoints = [
  [0.5, -0.3, 0.2],
  [1.0, 1.0, 1.0],
  [0.0, 0.0, 0.0],
  [0.1, 0.1, 0.1],
];

function solveLinearSystem(H: number[][], g: number[]): number[] | null {
  /**
   * Solve H * p = -g using Gaussian elimination with partial pivoting.
   * Returns null if system is singular or ill-conditioned.
   */
  const n = g.length;

  // Create augmented matrix [H | -g]
  const A: number[][] = H.map((row, i) => [...row, -g[i]]);

  // Forward elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    // Check for singular matrix
    if (Math.abs(A[maxRow][i]) < 1e-12) {
      return null;  // Singular
    }

    // Swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = A[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= A[i][j] * x[j];
    }
    x[i] /= A[i][i];
  }

  return x;
}

function testStartingPoint(initial: number[]) {
  console.log('\n' + '='.repeat(70));
  console.log(`Starting point: [${initial.map(x => x.toFixed(3)).join(', ')}]`);
  console.log('='.repeat(70));

  let w = [...initial];
  const maxIter = 20;
  const tol = 1e-6;

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = perceptronObjective(w, dataPoints, lambda);
    const grad = perceptronGradient(w, dataPoints, lambda);
    const hess = perceptronHessian(w, dataPoints, lambda);

    const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));

    console.log(`\nIteration ${iter}:`);
    console.log(`  w = [${w.map(x => x.toFixed(6)).join(', ')}]`);
    console.log(`  loss = ${loss.toExponential(6)}`);
    console.log(`  grad = [${grad.map(g => g.toFixed(6)).join(', ')}]`);
    console.log(`  grad_norm = ${gradNorm.toExponential(6)}`);

    // Check Hessian conditioning
    const hessValues = hess.flat();
    const hessNorm = Math.sqrt(hessValues.reduce((s, v) => s + v * v, 0));
    console.log(`  hessian_norm = ${hessNorm.toExponential(6)}`);

    // Show Hessian
    console.log(`  Hessian:`);
    for (const row of hess) {
      console.log(`    [${row.map(v => v.toFixed(6)).join(', ')}]`);
    }

    if (gradNorm < tol) {
      console.log(`\n✅ CONVERGED at iteration ${iter}`);
      return { converged: true, iter, loss, gradNorm, finalW: w };
    }

    // Solve H * p = -g
    const step = solveLinearSystem(hess, grad);

    if (!step) {
      console.log(`\n❌ FAILED: Hessian is singular or ill-conditioned`);
      return { converged: false, iter, loss, gradNorm, finalW: w, reason: 'singular_hessian' };
    }

    const stepNorm = Math.sqrt(step.reduce((s, v) => s + v * v, 0));
    console.log(`  step = [${step.map(s => s.toFixed(6)).join(', ')}]`);
    console.log(`  step_norm = ${stepNorm.toExponential(6)}`);

    // Check for huge steps
    if (stepNorm > 1000) {
      console.log(`  ⚠️  WARNING: Very large step!`);
    }

    // Update w
    w = w.map((wi, i) => wi + step[i]);
  }

  const finalLoss = perceptronObjective(w, dataPoints, lambda);
  const finalGrad = perceptronGradient(w, dataPoints, lambda);
  const finalGradNorm = Math.sqrt(finalGrad.reduce((sum, g) => sum + g * g, 0));

  console.log(`\n⚠️  DID NOT CONVERGE after ${maxIter} iterations`);
  return { converged: false, iter: maxIter, loss: finalLoss, gradNorm: finalGradNorm, finalW: w };
}

// Test each starting point
for (const initial of startingPoints) {
  const result = testStartingPoint(initial);
  console.log(`\nResult: ${JSON.stringify({ ...result, finalW: result.finalW?.map(x => x.toFixed(4)) }, null, 2)}`);
}

console.log('\n' + '='.repeat(70));
console.log('TEST COMPLETE');
console.log('='.repeat(70));
