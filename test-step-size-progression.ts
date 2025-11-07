#!/usr/bin/env tsx
/**
 * Demonstrate the progression from scalar step sizes to Newton's matrix step size
 *
 * Progression:
 * 1. GD-fixed: Single α - needs tuning
 * 2. GD-linesearch: Adaptive α - but still zigzags
 * 3. [Conceptual] Per-coordinate αs - coordinate dependent!
 * 4. Newton: H⁻¹ - rotation invariant step size matrix
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runGradientDescent } from './src/algorithms/gradient-descent';
import { runGradientDescentLineSearch } from './src/algorithms/gradient-descent-linesearch';
import { runNewton } from './src/algorithms/newton';

function testAtAngle(theta: number) {
  const problem = createRotatedQuadratic(theta);
  const problemFuncs = problemToProblemFunctions(problem);
  const initialPoint: [number, number] = [2, 2];

  // GD with different fixed step sizes
  const gdFixed01 = runGradientDescent(problemFuncs, {
    maxIter: 200,
    alpha: 0.01,
    lambda: 0,
    initialPoint
  });

  const gdFixed05 = runGradientDescent(problemFuncs, {
    maxIter: 200,
    alpha: 0.05,
    lambda: 0,
    initialPoint
  });

  const gdFixed1 = runGradientDescent(problemFuncs, {
    maxIter: 200,
    alpha: 0.1,
    lambda: 0,
    initialPoint
  });

  // GD with line search
  const gdLineSearch = runGradientDescentLineSearch(problemFuncs, {
    maxIter: 200,
    c1: 0.0001,
    lambda: 0,
    initialPoint
  });

  // Newton
  const newton = runNewton(problemFuncs, {
    maxIter: 20,
    c1: 0.0001,
    lambda: 0,
    hessianDamping: 0,
    lineSearch: 'armijo',
    initialPoint
  });

  return {
    theta,
    gdFixed01: {
      iters: gdFixed01.length,
      converged: gdFixed01[gdFixed01.length - 1].gradNorm < 1e-5,
      finalLoss: gdFixed01[gdFixed01.length - 1].newLoss
    },
    gdFixed05: {
      iters: gdFixed05.length,
      converged: gdFixed05[gdFixed05.length - 1].gradNorm < 1e-5,
      finalLoss: gdFixed05[gdFixed05.length - 1].newLoss
    },
    gdFixed1: {
      iters: gdFixed1.length,
      converged: gdFixed1[gdFixed1.length - 1].gradNorm < 1e-5,
      finalLoss: gdFixed1[gdFixed1.length - 1].newLoss
    },
    gdLineSearch: {
      iters: gdLineSearch.length,
      converged: gdLineSearch[gdLineSearch.length - 1].gradNorm < 1e-5,
      finalLoss: gdLineSearch[gdLineSearch.length - 1].newLoss
    },
    newton: {
      iters: newton.length,
      converged: newton[newton.length - 1].gradNorm < 1e-5,
      finalLoss: newton[newton.length - 1].newLoss
    }
  };
}

console.log('Progression: From Scalar Step Sizes to Matrix Step Sizes');
console.log('Problem: Rotated ellipse (κ=5), Initial: [2, 2]');
console.log('='.repeat(80));

const results0 = testAtAngle(0);
const results45 = testAtAngle(45);

console.log('\n📊 Results at θ=0° (ellipse aligned with axes)');
console.log('-'.repeat(80));
console.log(`GD (α=0.01): ${results0.gdFixed01.iters} iters ${results0.gdFixed01.converged ? '✅' : '❌'}`);
console.log(`GD (α=0.05): ${results0.gdFixed05.iters} iters ${results0.gdFixed05.converged ? '✅' : '❌'}`);
console.log(`GD (α=0.10): ${results0.gdFixed1.iters} iters ${results0.gdFixed1.converged ? '✅' : '❌'}`);
console.log(`GD + Line Search: ${results0.gdLineSearch.iters} iters ${results0.gdLineSearch.converged ? '✅' : '❌'}`);
console.log(`Newton: ${results0.newton.iters} iters ${results0.newton.converged ? '✅' : '❌'}`);

console.log('\n📊 Results at θ=45° (ellipse rotated 45°)');
console.log('-'.repeat(80));
console.log(`GD (α=0.01): ${results45.gdFixed01.iters} iters ${results45.gdFixed01.converged ? '✅' : '❌'}`);
console.log(`GD (α=0.05): ${results45.gdFixed05.iters} iters ${results45.gdFixed05.converged ? '✅' : '❌'}`);
console.log(`GD (α=0.10): ${results45.gdFixed1.iters} iters ${results45.gdFixed1.converged ? '✅' : '❌'}`);
console.log(`GD + Line Search: ${results45.gdLineSearch.iters} iters ${results45.gdLineSearch.converged ? '✅' : '❌'}`);
console.log(`Newton: ${results45.newton.iters} iters ${results45.newton.converged ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(80));
console.log('💡 KEY INSIGHTS');
console.log('='.repeat(80));

console.log('\n1️⃣  GD-fixed: Step size needs careful tuning');
console.log('   - Different α values perform very differently');
console.log('   - Optimal α changes with problem orientation');

console.log('\n2️⃣  GD + Line Search: Helps, but still coordinate-dependent');
console.log(`   - θ=0°: ${results0.gdLineSearch.iters} iters`);
console.log(`   - θ=45°: ${results45.gdLineSearch.iters} iters`);
console.log('   - Performance varies with rotation angle');
console.log('   - Still zigzags because it only adapts scalar α');

console.log('\n3️⃣  [Conceptual] Per-coordinate step sizes (diagonal matrix):');
console.log('   - At θ=0°: Could use small α₀ (steep direction), large α₁ (flat direction)');
console.log('   - At θ=45°: Valley is DIAGONAL - no per-coordinate α helps!');
console.log('   - Problem: Diagonal matrices are coordinate-dependent');

console.log('\n4️⃣  Newton: Rotation-invariant step size MATRIX');
console.log(`   - θ=0°: ${results0.newton.iters} iters`);
console.log(`   - θ=45°: ${results45.newton.iters} iters`);
console.log('   - H⁻¹ is a FULL matrix (not diagonal) that adapts to problem geometry');
console.log('   - Works identically regardless of coordinate system choice');

console.log('\n📈 Bottom line:');
console.log('   Scalar α → Diagonal matrix → Full matrix H⁻¹');
console.log('   Each step adds sophistication and removes coordinate dependence');
