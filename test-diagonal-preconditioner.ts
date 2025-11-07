#!/usr/bin/env tsx
/**
 * Implement and test a diagonal preconditioner
 *
 * Diagonal preconditioner: Use different step size for each coordinate
 * w_new = w - D * ∇f, where D = diag(α₀, α₁)
 *
 * For quadratic with Hessian H, optimal D = diag(1/H₀₀, 1/H₁₁)
 * This works ONLY when H is diagonal (problem aligned with axes)
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { ProblemFunctions } from './src/types/experiments';

interface DiagonalPrecondResult {
  w: number[];
  wNew: number[];
  oldLoss: number;
  newLoss: number;
  gradNorm: number;
  stepNorm: number;
}

/**
 * Run GD with diagonal preconditioner
 * Uses the Hessian diagonal to set per-coordinate step sizes
 */
function runDiagonalPreconditioner(
  problem: ProblemFunctions,
  config: {
    maxIter: number;
    initialPoint: [number, number];
  }
): DiagonalPrecondResult[] {
  const { maxIter, initialPoint } = config;
  const iterations: DiagonalPrecondResult[] = [];

  let w = [...initialPoint];

  for (let iter = 0; iter < maxIter; iter++) {
    const loss = problem.objective(w);
    const grad = problem.gradient(w);
    const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));

    // Check convergence
    if (gradNorm < 1e-6) {
      break;
    }

    // Get Hessian and extract diagonal
    const H = problem.hessian(w);
    const d0 = H[0][0];
    const d1 = H[1][1];

    // Diagonal preconditioner: D = diag(1/H₀₀, 1/H₁₁)
    // Step: Δw = -D * grad
    const step = [
      -grad[0] / d0,
      -grad[1] / d1
    ];

    const wNew = [
      w[0] + step[0],
      w[1] + step[1]
    ];

    const newLoss = problem.objective(wNew);
    const stepNorm = Math.sqrt(step[0] * step[0] + step[1] * step[1]);

    iterations.push({
      w: [...w],
      wNew: [...wNew],
      oldLoss: loss,
      newLoss,
      gradNorm,
      stepNorm
    });

    w = wNew;

    // Check for divergence
    if (!isFinite(newLoss) || !isFinite(gradNorm)) {
      break;
    }
  }

  return iterations;
}

function testDiagonalPrecond(theta: number) {
  const problem = createRotatedQuadratic(theta);
  const problemFuncs = problemToProblemFunctions(problem);

  const iterations = runDiagonalPreconditioner(problemFuncs, {
    maxIter: 200,
    initialPoint: [2, 2]
  });

  const lastIter = iterations[iterations.length - 1];
  return {
    theta,
    iters: iterations.length,
    converged: lastIter.gradNorm < 1e-5,
    finalLoss: lastIter.newLoss,
    finalGradNorm: lastIter.gradNorm
  };
}

console.log('Testing Diagonal Preconditioner');
console.log('Preconditioner: D = diag(1/H₀₀, 1/H₁₁) - uses Hessian diagonal');
console.log('Problem: Rotated ellipse (κ=5), Initial: [2, 2]');
console.log('='.repeat(80));

const angles = [0, 15, 30, 45, 60, 75, 90];
const results = angles.map(testDiagonalPrecond);

console.log('\n📊 Diagonal Preconditioner Results:');
console.log('-'.repeat(80));
results.forEach(r => {
  const status = r.converged ? '✅' : '❌';
  console.log(`θ=${r.theta.toString().padStart(2)}°: ${r.iters.toString().padStart(3)} iters ${status}`);
});

const iterCounts = results.map(r => r.iters);
const min = Math.min(...iterCounts);
const max = Math.max(...iterCounts);
const avg = iterCounts.reduce((a, b) => a + b, 0) / iterCounts.length;

console.log(`\nRange: ${min}-${max} iterations (avg: ${avg.toFixed(1)})`);

// Find best and worst angles
const best = results.reduce((a, b) => a.iters < b.iters ? a : b);
const worst = results.reduce((a, b) => a.iters > b.iters ? a : b);

console.log(`Best: θ=${best.theta}° (${best.iters} iters)`);
console.log(`Worst: θ=${worst.theta}° (${worst.iters} iters)`);
console.log(`Variation: ${((max - min) / min * 100).toFixed(1)}%`);

console.log('\n' + '='.repeat(80));
console.log('💡 ANALYSIS');
console.log('='.repeat(80));

console.log('\nDiagonal preconditioner uses D = diag(1/H₀₀, 1/H₁₁):');
console.log('  • At θ=0°: H is diagonal! D perfectly inverts H → converges in ~2 steps');
console.log('  • At θ=45°: H has off-diagonal terms! D only uses diagonal → still struggles');
console.log('\nThis is why adaptive optimizers like Adam use diagonal preconditioning:');
console.log('  ✅ Better than scalar step size (helps with different scales)');
console.log('  ❌ Still coordinate-dependent (fails when problem is rotated)');
console.log('  💡 Newton uses FULL H⁻¹ to capture off-diagonal structure');
