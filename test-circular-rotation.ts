#!/usr/bin/env tsx
/**
 * Test: Does rotation matter for a CIRCULAR bowl?
 * A circle has no preferred direction - should perform identically at all angles
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runGradientDescent } from './src/algorithms/gradient-descent';
import { ProblemDefinition } from './src/types/experiments';

// Create a CIRCULAR problem (κ=1, no ill-conditioning)
function createCircularQuadratic(thetaDegrees: number = 0): ProblemDefinition {
  const theta = (thetaDegrees * Math.PI) / 180;
  const kappa = 1; // NO CONDITIONING - perfect circle

  const c = Math.cos(theta);
  const s = Math.sin(theta);

  // For κ=1: H = R * diag(1, 1) * R^T = I (identity)
  // So rotation does nothing to a circle!
  const h00 = kappa * c * c + s * s;  // = 1
  const h01 = (kappa - 1) * c * s;     // = 0
  const h11 = kappa * s * s + c * c;   // = 1

  return {
    name: 'Circular Bowl',
    description: `Circular bowl (θ=${thetaDegrees}°, κ=1), NO preferred direction`,

    objective: (w: number[]): number => {
      const [w0, w1] = w;
      return 0.5 * (w0 * w0 * h00 + 2 * w0 * w1 * h01 + w1 * w1 * h11);
    },

    gradient: (w: number[]): number[] => {
      const [w0, w1] = w;
      return [
        h00 * w0 + h01 * w1,
        h01 * w0 + h11 * w1
      ];
    },

    hessian: (_w: number[]): number[][] => {
      return [[h00, h01], [h01, h11]];
    },

    domain: {
      w0: [-3, 3],
      w1: [-3, 3],
    },

    globalMinimum: [0, 0],
  };
}

console.log('Testing GD on CIRCULAR bowl (no ill-conditioning)');
console.log('Expected: All rotations should perform identically');
console.log('='.repeat(80));

const angles = [0, 15, 30, 45, 60, 75, 90];
const results = angles.map(theta => {
  const problem = createCircularQuadratic(theta);
  const problemFuncs = problemToProblemFunctions(problem);

  const iterations = runGradientDescent(problemFuncs, {
    maxIter: 200,
    alpha: 0.1,
    lambda: 0,
    initialPoint: [2, 2]
  });

  const lastIter = iterations[iterations.length - 1];
  return {
    theta,
    iterations: iterations.length,
    finalLoss: lastIter.newLoss,
    gradNorm: lastIter.gradNorm
  };
});

console.log('\nGD on circular bowl (κ=1):');
results.forEach(r => {
  console.log(`  θ=${r.theta.toString().padStart(2)}°: ${r.iterations} iters`);
});

const iterCounts = results.map(r => r.iterations);
const min = Math.min(...iterCounts);
const max = Math.max(...iterCounts);

console.log(`\nRange: ${min}-${max} iterations`);
if (max === min) {
  console.log('✅ IDENTICAL performance - rotation makes no difference for circles!');
} else {
  console.log(`⚠️  Varies by ${max - min} iterations (numerical error or starting point effects)`);
}

console.log('\n' + '='.repeat(80));
console.log('💡 INSIGHT: A circular bowl has NO preferred coordinate system.');
console.log('Rotating a circle changes nothing - it looks the same from any angle.');
console.log('GD performs identically regardless of rotation angle.');
console.log('\nTo demonstrate coordinate dependence, we NEED an ellipse (κ>1).');
