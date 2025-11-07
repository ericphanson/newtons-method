#!/usr/bin/env tsx

/**
 * Understand why bias gradient is zero at this particular point
 */

import { DataPoint } from './src/shared-utils';

const testData: DataPoint[] = [
  { x1: 1.0, x2: 2.0, y: 1 },
  { x1: -1.0, x2: -2.0, y: 0 },
];

const lambda = 0.1;
const w = [0.5, -0.3, 0.2];

function computeLoss(w: number[]): number {
  const [w0, w1, w2] = w;
  let loss = 0.5 * (w0 * w0 + w1 * w1);

  for (const point of testData) {
    const y = point.y === 0 ? -1 : 1;
    const z = w0 * point.x1 + w1 * point.x2 + w2;
    const hingeLoss = Math.max(0, 1 - y * z);
    loss += lambda * hingeLoss;
  }

  return loss;
}

console.log('Testing why bias gradient is zero');
console.log('w =', w);

const base_loss = computeLoss(w);
console.log('\nBase loss:', base_loss);

// Try different bias values
const biases = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];
console.log('\nBias sweep:');
for (const bias of biases) {
  const w_test = [w[0], w[1], bias];
  const loss = computeLoss(w_test);
  console.log(`  bias=${bias.toFixed(1)}: loss=${loss.toFixed(4)}`);
}

// Check the contributions
console.log('\nBreakdown at w2=0.2:');
const [w0, w1, w2] = w;
let reg = 0.5 * (w0 * w0 + w1 * w1);
console.log(`Regularization: ${reg.toFixed(4)}`);

for (const point of testData) {
  const y = point.y === 0 ? -1 : 1;
  const z = w0 * point.x1 + w1 * point.x2 + w2;
  const margin = 1 - y * z;
  const hingeLoss = Math.max(0, margin);

  console.log(
    `Point (${point.x1}, ${point.x2}), y=${y}: z=${z.toFixed(3)}, margin=${margin.toFixed(
      3
    )}, hinge=${hingeLoss.toFixed(3)}, λ·hinge=${(lambda * hingeLoss).toFixed(4)}`
  );
}

// The key insight: check what happens with small changes in bias
console.log('\nSmall bias perturbations:');
const delta_biases = [-0.01, -0.001, 0, 0.001, 0.01];
for (const db of delta_biases) {
  const w_test = [w[0], w[1], w[2] + db];
  const loss = computeLoss(w_test);
  console.log(`  Δbias=${db.toFixed(4)}: loss=${loss.toFixed(6)}, Δloss=${(loss - base_loss).toFixed(6)}`);
}

// Ah! Let me check the individual contributions
console.log('\nIndividual point contributions to bias gradient:');
for (const point of testData) {
  const y = point.y === 0 ? -1 : 1;
  const z = w[0] * point.x1 + w[1] * point.x2 + w[2];
  const margin = 1 - y * z;

  if (margin > 0) {
    const contrib = -lambda * y;
    console.log(`Point (${point.x1}, ${point.x2}), y=${y}: contributes ${contrib.toFixed(4)}`);
  }
}

console.log('\nSum of contributions: -0.1 + 0.1 = 0');
console.log('This is a COINCIDENCE of the symmetric data!');
