#!/usr/bin/env tsx
/**
 * Test GD performance on rotated quadratics at 0° vs 45°
 * to verify which angle causes more misalignment for GD
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runGradientDescent } from './src/algorithms/gradient-descent';
import { runGradientDescentLineSearch } from './src/algorithms/gradient-descent-linesearch';

function testRotation(thetaDegrees: number, algorithm: 'gd-fixed' | 'gd-linesearch') {
  const problem = createRotatedQuadratic(thetaDegrees);
  const problemFuncs = problemToProblemFunctions(problem);

  const initialPoint: [number, number] = [2, 2];
  const maxIter = 200;

  let iterations: Array<{ wNew: number[]; newLoss: number; gradNorm: number }>;

  if (algorithm === 'gd-fixed') {
    // Use a reasonable fixed step size
    iterations = runGradientDescent(problemFuncs, {
      maxIter,
      alpha: 0.1,
      lambda: 0,
      initialPoint
    });
  } else {
    iterations = runGradientDescentLineSearch(problemFuncs, {
      maxIter,
      c1: 0.0001,
      lambda: 0,
      initialPoint
    });
  }

  const lastIter = iterations[iterations.length - 1];
  const converged = lastIter.gradNorm < 1e-5;

  return {
    theta: thetaDegrees,
    algorithm,
    iterations: iterations.length,
    finalLoss: lastIter.newLoss,
    finalGradNorm: lastIter.gradNorm,
    converged,
    finalPoint: lastIter.wNew
  };
}

console.log('Testing GD performance on rotated ellipses (κ=5)');
console.log('Initial point: [2, 2]');
console.log('=' .repeat(80));

// Test GD-fixed at both angles
console.log('\n🔹 GRADIENT DESCENT (fixed step size α=0.1)');
console.log('-'.repeat(80));

const gd0 = testRotation(0, 'gd-fixed');
console.log(`\nθ = 0° (aligned with axes):`);
console.log(`  Iterations: ${gd0.iterations}`);
console.log(`  Final loss: ${gd0.finalLoss.toExponential(6)}`);
console.log(`  Final grad norm: ${gd0.finalGradNorm.toExponential(2)}`);
console.log(`  Converged: ${gd0.converged ? '✅' : '❌'}`);
console.log(`  Final point: [${gd0.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

const gd45 = testRotation(45, 'gd-fixed');
console.log(`\nθ = 45° (rotated 45 degrees):`);
console.log(`  Iterations: ${gd45.iterations}`);
console.log(`  Final loss: ${gd45.finalLoss.toExponential(6)}`);
console.log(`  Final grad norm: ${gd45.finalGradNorm.toExponential(2)}`);
console.log(`  Converged: ${gd45.converged ? '✅' : '❌'}`);
console.log(`  Final point: [${gd45.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

// Test GD-with-line-search at both angles
console.log('\n\n🔹 GRADIENT DESCENT WITH LINE SEARCH (Armijo)');
console.log('-'.repeat(80));

const gdls0 = testRotation(0, 'gd-linesearch');
console.log(`\nθ = 0° (aligned with axes):`);
console.log(`  Iterations: ${gdls0.iterations}`);
console.log(`  Final loss: ${gdls0.finalLoss.toExponential(6)}`);
console.log(`  Final grad norm: ${gdls0.finalGradNorm.toExponential(2)}`);
console.log(`  Converged: ${gdls0.converged ? '✅' : '❌'}`);
console.log(`  Final point: [${gdls0.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

const gdls45 = testRotation(45, 'gd-linesearch');
console.log(`\nθ = 45° (rotated 45 degrees):`);
console.log(`  Iterations: ${gdls45.iterations}`);
console.log(`  Final loss: ${gdls45.finalLoss.toExponential(6)}`);
console.log(`  Final grad norm: ${gdls45.finalGradNorm.toExponential(2)}`);
console.log(`  Converged: ${gdls45.converged ? '✅' : '❌'}`);
console.log(`  Final point: [${gdls45.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

// Summary comparison
console.log('\n\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));

console.log('\nGD-fixed:');
console.log(`  θ=0°: ${gd0.iterations} iterations`);
console.log(`  θ=45°: ${gd45.iterations} iterations`);
console.log(`  Difference: ${Math.abs(gd0.iterations - gd45.iterations)} iterations`);
console.log(`  Worse angle: θ=${gd0.iterations > gd45.iterations ? '0°' : '45°'} (${Math.max(gd0.iterations, gd45.iterations)} iters)`);

console.log('\nGD-with-line-search:');
console.log(`  θ=0°: ${gdls0.iterations} iterations`);
console.log(`  θ=45°: ${gdls45.iterations} iterations`);
console.log(`  Difference: ${Math.abs(gdls0.iterations - gdls45.iterations)} iterations`);
console.log(`  Worse angle: θ=${gdls0.iterations > gdls45.iterations ? '0°' : '45°'} (${Math.max(gdls0.iterations, gdls45.iterations)} iters)`);

console.log('\n💡 Interpretation:');
if (gd0.iterations > gd45.iterations && gdls0.iterations > gdls45.iterations) {
  console.log('  ✅ θ=0° is WORSE (maximum misalignment) - user is correct!');
  console.log('  When ellipse is aligned with axes, GD must follow a curved path.');
  console.log('  At 45°, the gradient points more directly toward the minimum.');
} else if (gd45.iterations > gd0.iterations && gdls45.iterations > gdls0.iterations) {
  console.log('  ✅ θ=45° is WORSE (maximum misalignment) - original claim is correct!');
  console.log('  When ellipse is rotated 45°, GD zigzags badly.');
  console.log('  At 0°, GD can follow the axes efficiently.');
} else {
  console.log('  🤔 Results are mixed or inconclusive. Different algorithms behave differently.');
}
