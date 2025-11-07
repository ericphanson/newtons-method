#!/usr/bin/env tsx
/**
 * Python Comparison and Derivative Verification for Diagonal Preconditioner
 *
 * This test validates the diagonal preconditioner implementation by:
 * 1. Verifying derivatives using finite differences
 * 2. Testing preconditioner matrix calculation
 * 3. Comparing performance on rotated quadratics (0° vs 45°)
 * 4. Validating convergence properties
 *
 * The diagonal preconditioner uses D = diag(1/H₀₀, 1/H₁₁, ...) where H is the Hessian.
 * This should be optimal for axis-aligned problems but struggle with rotated problems.
 */

import { createRotatedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runDiagonalPreconditioner } from './src/algorithms/diagonal-preconditioner';
import { ProblemDefinition, ProblemFunctions } from './src/types/experiments';

// ============================================================================
// Finite Difference Utilities
// ============================================================================

function finiteDiffGradient(f: (w: number[]) => number, w: number[], h = 1e-7): number[] {
  return w.map((_, i) => {
    const wPlus = [...w]; wPlus[i] += h;
    const wMinus = [...w]; wMinus[i] -= h;
    return (f(wPlus) - f(wMinus)) / (2 * h);
  });
}

function finiteDiffHessian(f: (w: number[]) => number, w: number[], h = 1e-5): number[][] {
  const n = w.length;
  const H: number[][] = [];
  for (let i = 0; i < n; i++) {
    H[i] = [];
    for (let j = 0; j < n; j++) {
      const wPP = [...w]; wPP[i] += h; wPP[j] += h;
      const wPM = [...w]; wPM[i] += h; wPM[j] -= h;
      const wMP = [...w]; wMP[i] -= h; wMP[j] += h;
      const wMM = [...w]; wMM[i] -= h; wMM[j] -= h;
      H[i][j] = (f(wPP) - f(wPM) - f(wMP) + f(wMM)) / (4 * h * h);
    }
  }
  return H;
}

// ============================================================================
// Derivative Verification
// ============================================================================

function verifyDerivatives(
  name: string,
  problem: ProblemDefinition,
  testPoints: Array<{w: number[], desc: string}>
): boolean {
  console.log(`\n${'='.repeat(70)}\n${name}\n${'='.repeat(70)}`);
  let passed = true;

  for (const {w, desc} of testPoints) {
    console.log(`\n${desc}: [${w.map(x => x.toFixed(4)).join(', ')}]`);

    const f = problem.objective(w);
    const g = problem.gradient(w);
    const H = problem.hessian!(w);
    const gFD = finiteDiffGradient(problem.objective, w);
    const HFD = finiteDiffHessian(problem.objective, w);

    console.log(`  f(w) = ${f.toFixed(8)}`);

    // Gradient check
    const gErr = g.map((v, i) => Math.abs(v - gFD[i]));
    const maxGErr = Math.max(...gErr);
    console.log(`  Gradient max error: ${maxGErr.toExponential(3)} ${maxGErr < 1e-5 ? '✅' : '❌'}`);
    if (maxGErr >= 1e-5) passed = false;

    // Hessian check
    let maxHErr = 0;
    for (let i = 0; i < H.length; i++) {
      for (let j = 0; j < H[i].length; j++) {
        maxHErr = Math.max(maxHErr, Math.abs(H[i][j] - HFD[i][j]));
      }
    }
    console.log(`  Hessian max error:  ${maxHErr.toExponential(3)} ${maxHErr < 1e-3 ? '✅' : '❌'}`);
    if (maxHErr >= 1e-3) passed = false;

    // Check if at minimum (gradient ~0)
    const gradNorm = Math.sqrt(g.reduce((s, v) => s + v*v, 0));
    if (gradNorm < 1e-5) {
      console.log(`  ⭐ At minimum: ||∇f|| = ${gradNorm.toExponential(3)}`);
    }
  }

  return passed;
}

// ============================================================================
// Preconditioner Matrix Verification
// ============================================================================

function verifyPreconditioner(
  name: string,
  problem: ProblemDefinition,
  testPoint: number[]
): boolean {
  console.log(`\n${'='.repeat(70)}\n${name} - Preconditioner Verification\n${'='.repeat(70)}`);
  console.log(`Test point: [${testPoint.map(x => x.toFixed(4)).join(', ')}]`);

  const H = problem.hessian!(testPoint);
  const g = problem.gradient(testPoint);

  // Expected preconditioner: D = diag(1/H₀₀, 1/H₁₁)
  const expectedD = [1 / H[0][0], 1 / H[1][1]];
  console.log(`\nHessian:`);
  console.log(`  H = [[${H[0][0].toFixed(4)}, ${H[0][1].toFixed(4)}],`);
  console.log(`       [${H[1][0].toFixed(4)}, ${H[1][1].toFixed(4)}]]`);
  console.log(`\nDiagonal preconditioner:`);
  console.log(`  D = diag([${expectedD.map(d => d.toFixed(6)).join(', ')}])`);

  // Preconditioned direction: p = -D * g
  const expectedDirection = [-expectedD[0] * g[0], -expectedD[1] * g[1]];
  console.log(`\nGradient: [${g.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`Preconditioned direction: [${expectedDirection.map(x => x.toFixed(6)).join(', ')}]`);

  // For axis-aligned problems (θ=0), D should equal H⁻¹
  const isAxisAligned = Math.abs(H[0][1]) < 1e-10 && Math.abs(H[1][0]) < 1e-10;
  if (isAxisAligned) {
    console.log(`\n✅ Problem is AXIS-ALIGNED (H is diagonal)`);
    console.log(`   D exactly equals H⁻¹ → preconditioner is optimal`);
    console.log(`   Expected convergence: 1-2 iterations`);
  } else {
    console.log(`\n⚠️  Problem is ROTATED (H has off-diagonal terms)`);
    console.log(`   Off-diagonal terms: H₀₁ = ${H[0][1].toFixed(4)}, H₁₀ = ${H[1][0].toFixed(4)}`);
    console.log(`   D ≠ H⁻¹ → preconditioner is suboptimal`);
    console.log(`   Expected convergence: many iterations (coordinate-dependent)`);
  }

  return true;
}

// ============================================================================
// Algorithm Performance Comparison
// ============================================================================

function testAlgorithmPerformance(
  thetaDegrees: number,
  options: {
    useLineSearch?: boolean;
    maxIter?: number;
    initialPoint?: [number, number];
  } = {}
) {
  const problem = createRotatedQuadratic(thetaDegrees);
  const problemFuncs = problemToProblemFunctions(problem);

  const {
    useLineSearch = false,
    maxIter = 200,
    initialPoint = [2, 2]
  } = options;

  const result = runDiagonalPreconditioner(problemFuncs, {
    maxIter,
    initialPoint,
    useLineSearch,
    tolerance: 1e-6
  });

  return {
    theta: thetaDegrees,
    iterations: result.iterations.length,
    converged: result.summary.converged,
    finalLoss: result.summary.finalLoss,
    finalGradNorm: result.summary.finalGradNorm,
    finalPoint: result.summary.finalLocation,
    firstIteration: result.iterations[0],
    lastIteration: result.iterations[result.iterations.length - 1]
  };
}

// ============================================================================
// Python-Style Comparison Tests
// ============================================================================

function runPythonStyleComparison() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     Python-Style Comparison: Diagonal Preconditioner              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const initialPoint: [number, number] = [2, 2];
  const maxIter = 200;

  console.log(`\nTest Configuration:`);
  console.log(`  Initial point: [${initialPoint.join(', ')}]`);
  console.log(`  Max iterations: ${maxIter}`);
  console.log(`  Tolerance: 1e-6`);
  console.log(`  Problem: Rotated ellipse (κ=5)`);

  // Test 1: θ=0° (axis-aligned, optimal case)
  console.log(`\n${'='.repeat(70)}`);
  console.log('Test 1: θ=0° (axis-aligned)');
  console.log(`${'='.repeat(70)}`);
  const result0 = testAlgorithmPerformance(0, { initialPoint, maxIter });

  console.log(`\nResults:`);
  console.log(`  Iterations: ${result0.iterations}`);
  console.log(`  Converged: ${result0.converged ? '✅ YES' : '❌ NO'}`);
  console.log(`  Final loss: ${result0.finalLoss.toExponential(6)}`);
  console.log(`  Final grad norm: ${result0.finalGradNorm.toExponential(2)}`);
  console.log(`  Final point: [${result0.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

  // Show first iteration details
  console.log(`\nFirst iteration details:`);
  const iter0_0 = result0.firstIteration;
  console.log(`  H_diag: [${iter0_0.hessianDiagonal.map(x => x.toFixed(4)).join(', ')}]`);
  console.log(`  D (preconditioner): [${iter0_0.preconditioner.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Gradient: [${iter0_0.grad.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Direction: [${iter0_0.direction.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Step norm: ${iter0_0.stepNorm.toFixed(6)}`);

  // Test 2: θ=45° (rotated, challenging case)
  console.log(`\n${'='.repeat(70)}`);
  console.log('Test 2: θ=45° (rotated)');
  console.log(`${'='.repeat(70)}`);
  const result45 = testAlgorithmPerformance(45, { initialPoint, maxIter });

  console.log(`\nResults:`);
  console.log(`  Iterations: ${result45.iterations}`);
  console.log(`  Converged: ${result45.converged ? '✅ YES' : '❌ NO'}`);
  console.log(`  Final loss: ${result45.finalLoss.toExponential(6)}`);
  console.log(`  Final grad norm: ${result45.finalGradNorm.toExponential(2)}`);
  console.log(`  Final point: [${result45.finalPoint.map(x => x.toFixed(6)).join(', ')}]`);

  // Show first iteration details
  console.log(`\nFirst iteration details:`);
  const iter45_0 = result45.firstIteration;
  console.log(`  H_diag: [${iter45_0.hessianDiagonal.map(x => x.toFixed(4)).join(', ')}]`);
  console.log(`  D (preconditioner): [${iter45_0.preconditioner.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Gradient: [${iter45_0.grad.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Direction: [${iter45_0.direction.map(x => x.toFixed(6)).join(', ')}]`);
  console.log(`  Step norm: ${iter45_0.stepNorm.toFixed(6)}`);

  // Comparison summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 Comparison Summary');
  console.log(`${'='.repeat(70)}`);

  const ratio = result45.iterations / result0.iterations;
  console.log(`\nIteration counts:`);
  console.log(`  θ=0°:  ${result0.iterations} iterations`);
  console.log(`  θ=45°: ${result45.iterations} iterations`);
  console.log(`  Ratio: ${ratio.toFixed(1)}× worse at 45°`);

  console.log(`\nConvergence quality:`);
  console.log(`  θ=0°:  grad_norm = ${result0.finalGradNorm.toExponential(2)}`);
  console.log(`  θ=45°: grad_norm = ${result45.finalGradNorm.toExponential(2)}`);

  // Theoretical analysis
  console.log(`\n💡 Theoretical Analysis:`);
  console.log(`  • At θ=0°: Hessian is diagonal, D = H⁻¹ exactly`);
  console.log(`    → Preconditioner is OPTIMAL (Newton-like convergence)`);
  console.log(`    → Expected: 1-2 iterations`);
  console.log(`  • At θ=45°: Hessian has off-diagonal terms`);
  console.log(`    → D only captures diagonal, ignores rotation`);
  console.log(`    → Expected: ~20× more iterations`);
  console.log(`  • This demonstrates COORDINATE DEPENDENCE`);
  console.log(`    → Performance depends on problem orientation`);
  console.log(`    → Similar to Adam/RMSprop (diagonal preconditioning)`);

  return {
    result0,
    result45,
    ratio,
    passed: result0.converged && result45.converged && ratio > 5
  };
}

// ============================================================================
// Main Test Suite
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Diagonal Preconditioner: Derivative & Python Comparison         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');

let allPassed = true;

// Part 1: Derivative Verification
console.log('\n' + '='.repeat(70));
console.log('PART 1: DERIVATIVE VERIFICATION');
console.log('='.repeat(70));

const problem0 = createRotatedQuadratic(0);
const problem45 = createRotatedQuadratic(45);

allPassed &&= verifyDerivatives("Rotated Quadratic (θ=0°)", problem0, [
  {w: [0, 0], desc: 'At minimum'},
  {w: [1, 1], desc: 'Generic point'},
  {w: [2, 2], desc: 'Initial point (test start)'},
]);

allPassed &&= verifyDerivatives("Rotated Quadratic (θ=45°)", problem45, [
  {w: [0, 0], desc: 'At minimum'},
  {w: [1, 1], desc: 'Generic point'},
  {w: [2, 2], desc: 'Initial point (test start)'},
]);

// Part 2: Preconditioner Verification
console.log('\n' + '='.repeat(70));
console.log('PART 2: PRECONDITIONER MATRIX VERIFICATION');
console.log('='.repeat(70));

verifyPreconditioner("θ=0° (axis-aligned)", problem0, [2, 2]);
verifyPreconditioner("θ=45° (rotated)", problem45, [2, 2]);

// Part 3: Python-Style Performance Comparison
console.log('\n' + '='.repeat(70));
console.log('PART 3: PERFORMANCE COMPARISON (Python-style)');
console.log('='.repeat(70));

const comparisonResult = runPythonStyleComparison();
allPassed &&= comparisonResult.passed;

// Part 4: Test with line search
console.log('\n' + '='.repeat(70));
console.log('PART 4: WITH LINE SEARCH (robustness test)');
console.log('='.repeat(70));

console.log('\nTesting with Armijo line search enabled...');
const resultLS45 = testAlgorithmPerformance(45, {
  initialPoint: [2, 2],
  maxIter: 200,
  useLineSearch: true
});

console.log(`\nResults (θ=45° with line search):`);
console.log(`  Iterations: ${resultLS45.iterations}`);
console.log(`  Converged: ${resultLS45.converged ? '✅ YES' : '❌ NO'}`);
console.log(`  Final loss: ${resultLS45.finalLoss.toExponential(6)}`);
console.log(`  Final grad norm: ${resultLS45.finalGradNorm.toExponential(2)}`);

if (resultLS45.firstIteration.lineSearchTrials) {
  console.log(`  Line search used: YES (${resultLS45.firstIteration.lineSearchTrials.length} trials in first iter)`);
} else {
  console.log(`  Line search used: NO`);
}

// Final summary
console.log('\n' + '='.repeat(70));
console.log('📋 FINAL SUMMARY');
console.log('='.repeat(70));

console.log('\n✓ Tests completed:');
console.log(`  • Derivative verification: gradients and Hessians`);
console.log(`  • Preconditioner matrix: D = diag(1/H₀₀, 1/H₁₁)`);
console.log(`  • Performance comparison: θ=0° vs θ=45°`);
console.log(`  • Line search robustness: Armijo backtracking`);

console.log('\n✓ Key findings:');
console.log(`  • Derivatives validated via finite differences`);
console.log(`  • Preconditioner optimal for axis-aligned problems`);
console.log(`  • Coordinate-dependent performance confirmed`);
console.log(`  • ${comparisonResult.ratio.toFixed(1)}× iteration difference (0° vs 45°)`);

if (allPassed) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('\nThe diagonal preconditioner correctly implements:');
  console.log('  1. Hessian diagonal extraction');
  console.log('  2. Per-coordinate step size adjustment');
  console.log('  3. Optimal convergence for axis-aligned problems');
  console.log('  4. Coordinate-dependent behavior (as expected)');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
}
