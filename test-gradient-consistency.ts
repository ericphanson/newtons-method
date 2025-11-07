#!/usr/bin/env tsx

/**
 * Test gradient consistency with objective function using numerical differentiation.
 *
 * For a function f(w), the gradient should satisfy:
 * ∇f(w)[i] ≈ (f(w + ε·e_i) - f(w - ε·e_i)) / (2ε)
 *
 * This test verifies that gradients match objectives (with or without division by n).
 */

import { DataPoint } from './src/shared-utils';
import {
  softMarginObjective,
  softMarginGradient,
  perceptronObjective,
  perceptronGradient,
  squaredHingeObjective,
  squaredHingeGradient,
} from './src/utils/separatingHyperplane';

// Test data: small dataset for easy verification (asymmetric to test bias gradient)
const testData: DataPoint[] = [
  { x1: 1.0, x2: 2.0, y: 1 },
  { x1: -1.0, x2: -2.0, y: 0 },
  { x1: 2.0, x2: 1.5, y: 1 },
  { x1: -1.5, x2: -1.0, y: 0 },
  { x1: 0.5, x2: 1.0, y: 1 },
];

const lambda = 0.1;
const epsilon = 1e-7;

function numericalGradient(
  objective: (w: number[], data: DataPoint[], lambda: number) => number,
  w: number[],
  data: DataPoint[],
  lambda: number
): number[] {
  const grad: number[] = [];

  for (let i = 0; i < w.length; i++) {
    const w_plus = [...w];
    const w_minus = [...w];

    w_plus[i] += epsilon;
    w_minus[i] -= epsilon;

    const f_plus = objective(w_plus, data, lambda);
    const f_minus = objective(w_minus, data, lambda);

    grad[i] = (f_plus - f_minus) / (2 * epsilon);
  }

  return grad;
}

function testGradient(
  name: string,
  objective: (w: number[], data: DataPoint[], lambda: number) => number,
  gradient: (w: number[], data: DataPoint[], lambda: number) => number[]
) {
  console.log(`\n=== Testing ${name} ===`);

  const w = [0.5, -0.3, 0.2];

  const analyticGrad = gradient(w, testData, lambda);
  const numericGrad = numericalGradient(objective, w, testData, lambda);

  console.log('Analytic gradient:', analyticGrad.map(x => x.toFixed(6)));
  console.log('Numeric gradient: ', numericGrad.map(x => x.toFixed(6)));

  // Compute relative error for each component
  const errors: number[] = [];
  for (let i = 0; i < w.length; i++) {
    const absError = Math.abs(analyticGrad[i] - numericGrad[i]);
    const scale = Math.max(Math.abs(analyticGrad[i]), Math.abs(numericGrad[i]), 1e-10);
    const relError = absError / scale;
    errors.push(relError);
  }

  console.log('Relative errors:  ', errors.map(x => x.toExponential(2)));

  const maxError = Math.max(...errors);
  const threshold = 1e-4;

  if (maxError < threshold) {
    console.log(`✅ PASS: max relative error = ${maxError.toExponential(2)} < ${threshold}`);
  } else {
    console.log(`❌ FAIL: max relative error = ${maxError.toExponential(2)} >= ${threshold}`);
  }

  return maxError < threshold;
}

// Run tests
console.log('Testing gradient consistency with n =', testData.length, 'data points');
console.log('Lambda =', lambda);

const results = [
  testGradient('Soft-Margin SVM', softMarginObjective, softMarginGradient),
  testGradient('Perceptron', perceptronObjective, perceptronGradient),
  testGradient('Squared-Hinge SVM', squaredHingeObjective, squaredHingeGradient),
];

console.log('\n=== SUMMARY ===');
const passed = results.filter(x => x).length;
console.log(`${passed}/${results.length} tests passed`);

if (passed === results.length) {
  console.log('✅ All gradients are mathematically consistent with objectives');
} else {
  console.log('❌ Some gradients do NOT match their objectives');
  process.exit(1);
}
