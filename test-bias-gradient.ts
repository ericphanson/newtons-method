#!/usr/bin/env tsx

/**
 * Investigate bias gradient issue in soft-margin SVM
 */

import { DataPoint } from './src/shared-utils';
import { softMarginObjective, softMarginGradient } from './src/utils/separatingHyperplane';

const testData: DataPoint[] = [
  { x1: 1.0, x2: 2.0, y: 1 },
  { x1: -1.0, x2: -2.0, y: 0 },
];

const lambda = 0.1;
const w = [0.5, -0.3, 0.2];

console.log('w =', w);
console.log('Data:');
testData.forEach((p, i) => {
  const y = p.y === 0 ? -1 : 1;
  const z = w[0] * p.x1 + w[1] * p.x2 + w[2];
  const margin = 1 - y * z;
  const hingeLoss = Math.max(0, margin);
  console.log(
    `  Point ${i}: (${p.x1}, ${p.x2}), y=${y}, z=${z.toFixed(3)}, margin=${margin.toFixed(
      3
    )}, hinge=${hingeLoss.toFixed(3)}`
  );
});

console.log('\nObjective:', softMarginObjective(w, testData, lambda));
console.log('Gradient:', softMarginGradient(w, testData, lambda));

// Manual gradient calculation
console.log('\n=== Manual Gradient Calculation ===');
const [w0, w1, w2] = w;

let grad0 = w0; // regularization
let grad1 = w1; // regularization
let grad2 = 0; // no regularization for bias

for (const point of testData) {
  const y = point.y === 0 ? -1 : 1;
  const z = w[0] * point.x1 + w[1] * point.x2 + w[2];
  const margin = 1 - y * z;

  console.log(`Point (${point.x1}, ${point.x2}), y=${y}:`);
  console.log(`  z = ${z.toFixed(4)}, margin = ${margin.toFixed(4)}`);

  if (margin > 0) {
    console.log(`  Violated! Contributing -λ·y·x to gradient`);
    console.log(`    -λ·y·x1 = -${lambda}·${y}·${point.x1} = ${-lambda * y * point.x1}`);
    console.log(`    -λ·y·x2 = -${lambda}·${y}·${point.x2} = ${-lambda * y * point.x2}`);
    console.log(`    -λ·y    = -${lambda}·${y}         = ${-lambda * y}`);

    grad0 -= lambda * y * point.x1;
    grad1 -= lambda * y * point.x2;
    grad2 -= lambda * y;
  } else {
    console.log(`  Not violated, no contribution`);
  }
}

console.log('\nManual gradient:', [grad0, grad1, grad2]);
console.log('Function gradient:', softMarginGradient(w, testData, lambda));

// Numerical gradient for bias only
const epsilon = 1e-7;
const w_plus = [...w];
const w_minus = [...w];
w_plus[2] += epsilon;
w_minus[2] -= epsilon;

const f_plus = softMarginObjective(w_plus, testData, lambda);
const f_minus = softMarginObjective(w_minus, testData, lambda);
const numeric_grad2 = (f_plus - f_minus) / (2 * epsilon);

console.log('\nNumerical gradient[2] (bias):', numeric_grad2);
console.log('Analytic gradient[2] (bias):', softMarginGradient(w, testData, lambda)[2]);
