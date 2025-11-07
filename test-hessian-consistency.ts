#!/usr/bin/env tsx

/**
 * Test Hessian consistency with gradient using numerical differentiation.
 *
 * For a gradient ∇f(w), the Hessian should satisfy:
 * H[i,j] ≈ (∇f(w + ε·e_j)[i] - ∇f(w - ε·e_j)[i]) / (2ε)
 */

import { DataPoint } from './src/shared-utils';
import { squaredHingeGradient, squaredHingeHessian } from './src/utils/separatingHyperplane';

// Test data
const testData: DataPoint[] = [
  { x1: 1.0, x2: 2.0, y: 1 },
  { x1: -1.0, x2: -2.0, y: 0 },
  { x1: 2.0, x2: 1.5, y: 1 },
  { x1: -1.5, x2: -1.0, y: 0 },
  { x1: 0.5, x2: 1.0, y: 1 },
];

const lambda = 0.1;
const epsilon = 1e-7;

function numericalHessian(
  gradient: (w: number[], data: DataPoint[], lambda: number) => number[],
  w: number[],
  data: DataPoint[],
  lambda: number
): number[][] {
  const n = w.length;
  const H: number[][] = [];

  for (let i = 0; i < n; i++) {
    H[i] = [];
    for (let j = 0; j < n; j++) {
      const w_plus = [...w];
      const w_minus = [...w];

      w_plus[j] += epsilon;
      w_minus[j] -= epsilon;

      const grad_plus = gradient(w_plus, data, lambda);
      const grad_minus = gradient(w_minus, data, lambda);

      H[i][j] = (grad_plus[i] - grad_minus[i]) / (2 * epsilon);
    }
  }

  return H;
}

function testHessian(name: string) {
  console.log(`\n=== Testing ${name} ===`);

  const w = [0.5, -0.3, 0.2];

  const analyticHessian = squaredHingeHessian(w, testData, lambda);
  const numericHessian = numericalHessian(squaredHingeGradient, w, testData, lambda);

  console.log('Analytic Hessian:');
  for (const row of analyticHessian) {
    console.log('  [' + row.map(x => x.toFixed(6)).join(', ') + ']');
  }

  console.log('\nNumeric Hessian:');
  for (const row of numericHessian) {
    console.log('  [' + row.map(x => x.toFixed(6)).join(', ') + ']');
  }

  // Compute errors
  console.log('\nRelative Errors:');
  let maxError = 0;
  for (let i = 0; i < w.length; i++) {
    const errors: number[] = [];
    for (let j = 0; j < w.length; j++) {
      const absError = Math.abs(analyticHessian[i][j] - numericHessian[i][j]);
      const scale = Math.max(
        Math.abs(analyticHessian[i][j]),
        Math.abs(numericHessian[i][j]),
        1e-10
      );
      const relError = absError / scale;
      errors.push(relError);
      maxError = Math.max(maxError, relError);
    }
    console.log('  [' + errors.map(x => x.toExponential(2)).join(', ') + ']');
  }

  const threshold = 1e-4;
  if (maxError < threshold) {
    console.log(`\n✅ PASS: max relative error = ${maxError.toExponential(2)} < ${threshold}`);
    return true;
  } else {
    console.log(`\n❌ FAIL: max relative error = ${maxError.toExponential(2)} >= ${threshold}`);
    return false;
  }
}

// Run test
console.log('Testing Hessian consistency with n =', testData.length, 'data points');
console.log('Lambda =', lambda);

const passed = testHessian('Squared-Hinge SVM Hessian');

console.log('\n=== NOTE ===');
console.log('Soft-margin and perceptron Hessians are not tested because:');
console.log('  - Soft-margin: Hinge loss is not twice differentiable');
console.log('  - Perceptron: Loss is piecewise linear');
console.log('Only squared-hinge has a well-defined Hessian everywhere.');

if (!passed) {
  process.exit(1);
}
