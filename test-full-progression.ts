#!/usr/bin/env tsx
/**
 * Complete progression: Scalar → Adaptive Scalar → Diagonal → Full Matrix
 *
 * 1. GD-fixed: Single α
 * 2. GD-linesearch: Adaptive α
 * 3. Diagonal preconditioner: Per-coordinate step sizes (like Adam)
 * 4. Newton: Full matrix H⁻¹
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runGradientDescent } from './src/algorithms/gradient-descent';
import { runGradientDescentLineSearch } from './src/algorithms/gradient-descent-linesearch';
import { runNewton } from './src/algorithms/newton';
import { ProblemFunctions } from './src/types/experiments';

// Diagonal preconditioner implementation (Stage 3)
function runDiagonalPreconditioner(
  problem: ProblemFunctions,
  config: { maxIter: number; initialPoint: [number, number] }
) {
  const { maxIter, initialPoint } = config;
  const iterations: Array<{ w: number[]; wNew: number[]; oldLoss: number; newLoss: number; gradNorm: number }> = [];
  let w = [...initialPoint];

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));

    if (gradNorm < 1e-6) break;

    const H = problem.hessian(w);
    const step = [-grad[0] / H[0][0], -grad[1] / H[1][1]];
    const wNew = [w[0] + step[0], w[1] + step[1]];
    const newLoss = problem.objective(wNew);

    iterations.push({
      w: [...w],
      wNew: [...wNew],
      oldLoss: loss,
      newLoss,
      gradNorm
    });

    w = wNew;
    if (!isFinite(newLoss)) break;
  }

  return iterations;
}

function testAllStages(theta: number) {
  const problem = createRotatedQuadratic(theta);
  const problemFuncs = problemToProblemFunctions(problem);
  const initialPoint: [number, number] = [2, 2];

  // Stage 1: GD-fixed
  const gdFixed = runGradientDescent(problemFuncs, {
    maxIter: 200,
    alpha: 0.1,
    lambda: 0,
    initialPoint
  });

  // Stage 2: GD-linesearch
  const gdLineSearch = runGradientDescentLineSearch(problemFuncs, {
    maxIter: 200,
    c1: 0.0001,
    lambda: 0,
    initialPoint
  });

  // Stage 3: Diagonal preconditioner
  const diagPrecond = runDiagonalPreconditioner(problemFuncs, {
    maxIter: 200,
    initialPoint
  });

  // Stage 4: Newton
  const newton = runNewton(problemFuncs, {
    maxIter: 20,
    c1: 0.0001,
    lambda: 0,
    hessianDamping: 0,
    lineSearch: 'armijo',
    initialPoint
  });

  const result = {
    theta,
    gdFixed: { iters: gdFixed.length, converged: gdFixed.length > 0 && gdFixed[gdFixed.length - 1].gradNorm < 1e-5 },
    gdLineSearch: { iters: gdLineSearch.length, converged: gdLineSearch.length > 0 && gdLineSearch[gdLineSearch.length - 1].gradNorm < 1e-5 },
    diagPrecond: { iters: diagPrecond.length, converged: diagPrecond.length > 0 && diagPrecond[diagPrecond.length - 1].gradNorm < 1e-5 },
    newton: newton && newton.length > 0 ? { iters: newton.length, converged: newton[newton.length - 1].gradNorm < 1e-5 } : { iters: 0, converged: false }
  };

  return result;
}

console.log('Complete Progression: From Scalars to Matrices');
console.log('Problem: Rotated ellipse (κ=5), Initial: [2, 2]');
console.log('='.repeat(80));

const results0 = testAllStages(0);
const results45 = testAllStages(45);

console.log('\n📊 θ = 0° (Ellipse aligned with coordinate axes)');
console.log('-'.repeat(80));
console.log(`Stage 1 - GD-fixed (α=0.1):           ${results0.gdFixed.iters.toString().padStart(3)} iters ${results0.gdFixed.converged ? '✅' : '❌'}`);
console.log(`Stage 2 - GD-linesearch:              ${results0.gdLineSearch.iters.toString().padStart(3)} iters ${results0.gdLineSearch.converged ? '✅' : '❌'}`);
console.log(`Stage 3 - Diagonal preconditioner:    ${results0.diagPrecond.iters.toString().padStart(3)} iters ${results0.diagPrecond.converged ? '✅' : '❌'}`);
console.log(`Stage 4 - Newton (full matrix H⁻¹):  ${results0.newton.iters.toString().padStart(3)} iters ${results0.newton.converged ? '✅' : '❌'}`);

console.log('\n📊 θ = 45° (Ellipse rotated 45 degrees)');
console.log('-'.repeat(80));
console.log(`Stage 1 - GD-fixed (α=0.1):           ${results45.gdFixed.iters.toString().padStart(3)} iters ${results45.gdFixed.converged ? '✅' : '❌'}`);
console.log(`Stage 2 - GD-linesearch:              ${results45.gdLineSearch.iters.toString().padStart(3)} iters ${results45.gdLineSearch.converged ? '✅' : '❌'}`);
console.log(`Stage 3 - Diagonal preconditioner:    ${results45.diagPrecond.iters.toString().padStart(3)} iters ${results45.diagPrecond.converged ? '✅' : '❌'}`);
console.log(`Stage 4 - Newton (full matrix H⁻¹):  ${results45.newton.iters.toString().padStart(3)} iters ${results45.newton.converged ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(80));
console.log('💡 KEY INSIGHTS');
console.log('='.repeat(80));

console.log('\n🔹 Stage 1: GD-fixed (scalar step size α)');
console.log(`   θ=0°: ${results0.gdFixed.iters} iters  |  θ=45°: ${results45.gdFixed.iters} iters`);
console.log('   ❌ Performance varies with rotation angle');
console.log('   ❌ Needs manual tuning of α for each problem');

console.log('\n🔹 Stage 2: GD-linesearch (adaptive scalar α)');
console.log(`   θ=0°: ${results0.gdLineSearch.iters} iters  |  θ=45°: ${results45.gdLineSearch.iters} iters`);
console.log('   ✅ Automatically adapts α');
console.log('   ❌ Still coordinate-dependent (different performance at different angles)');

console.log('\n🔹 Stage 3: Diagonal preconditioner (per-coordinate step sizes)');
console.log(`   θ=0°: ${results0.diagPrecond.iters} iters  |  θ=45°: ${results45.diagPrecond.iters} iters`);
console.log('   ✅ At θ=0°: Perfect! D=diag(1/H₀₀, 1/H₁₁) inverts diagonal Hessian');
console.log('   ❌ At θ=45°: Fails! Hessian has off-diagonal terms D cannot capture');
console.log('   💡 This is what Adam/RMSprop do - works well when axes are meaningful');

console.log('\n🔹 Stage 4: Newton (full matrix H⁻¹)');
console.log(`   θ=0°: ${results0.newton.iters} iters  |  θ=45°: ${results45.newton.iters} iters`);
console.log('   ✅ ROTATION-INVARIANT: identical performance at all angles');
console.log('   ✅ Full matrix captures off-diagonal structure');
console.log('   ✅ No coordinate system dependence');

console.log('\n📈 The Progression:');
console.log('   Scalar → Adaptive Scalar → Diagonal Matrix → Full Matrix');
console.log('   Each step removes coordinate system dependence');
console.log('   But only Newton (full H⁻¹) is completely rotation-invariant!');
