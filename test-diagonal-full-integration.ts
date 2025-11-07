#!/usr/bin/env tsx
/**
 * Comprehensive integration test for diagonal preconditioner
 *
 * Tests:
 * 1. Algorithm implementation correctness
 * 2. Rotation dependence (key pedagogical point)
 * 3. Comparison with other algorithms
 * 4. Experiment presets load correctly
 */

import { createRotatedQuadratic, illConditionedQuadratic } from './src/problems/quadratic';
import { problemToProblemFunctions } from './src/utils/problemAdapter';
import { runDiagonalPreconditioner } from './src/algorithms/diagonal-preconditioner';
import { runNewton } from './src/algorithms/newton';
import { runGradientDescentLineSearch } from './src/algorithms/gradient-descent-linesearch';
import { getExperimentsForAlgorithm } from './src/experiments';

console.log('='.repeat(70));
console.log('DIAGONAL PRECONDITIONER - COMPREHENSIVE INTEGRATION TEST');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

// Test 1: Rotation Dependence
console.log('\n📊 Test 1: Rotation Dependence');
console.log('-'.repeat(70));

const problem0 = createRotatedQuadratic(0);
const problemFuncs0 = problemToProblemFunctions(problem0);
const result0 = runDiagonalPreconditioner(problemFuncs0, {
  maxIter: 10,
  initialPoint: [2, 2]
});

const problem45 = createRotatedQuadratic(45);
const problemFuncs45 = problemToProblemFunctions(problem45);
const result45 = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2]
});

console.log(`θ=0° (aligned):  ${result0.iterations.length} iterations`);
console.log(`θ=45° (rotated): ${result45.iterations.length} iterations`);
console.log(`Ratio: ${(result45.iterations.length / result0.iterations.length).toFixed(1)}×`);

if (result0.iterations.length <= 2 && result45.iterations.length >= 35) {
  console.log('✅ PASS: Rotation dependence verified');
  passed++;
} else {
  console.log('❌ FAIL: Expected 1-2 iters at θ=0°, 35+ at θ=45°');
  failed++;
}

// Test 2: Convergence Quality
console.log('\n📊 Test 2: Convergence Quality');
console.log('-'.repeat(70));

console.log(`θ=0° final loss: ${result0.summary.finalLoss.toExponential(2)}`);
console.log(`θ=0° converged: ${result0.summary.converged}`);
console.log(`θ=45° final loss: ${result45.summary.finalLoss.toExponential(2)}`);
console.log(`θ=45° converged: ${result45.summary.converged}`);

if (result0.summary.converged && result45.summary.converged) {
  console.log('✅ PASS: Both configurations converged');
  passed++;
} else {
  console.log('❌ FAIL: Expected both to converge');
  failed++;
}

// Test 3: Comparison with Newton (Rotation Invariance)
console.log('\n📊 Test 3: Comparison with Newton');
console.log('-'.repeat(70));

const newton0 = runNewton(problemFuncs0, {
  maxIter: 20,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [2, 2]
});

const newton45 = runNewton(problemFuncs45, {
  maxIter: 20,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [2, 2]
});

console.log(`Newton at θ=0°: ${newton0.iterations.length} iterations`);
console.log(`Newton at θ=45°: ${newton45.iterations.length} iterations`);

if (newton0.iterations.length === newton45.iterations.length && newton0.iterations.length <= 5) {
  console.log('✅ PASS: Newton is rotation-invariant (both same iters)');
  passed++;
} else {
  console.log('❌ FAIL: Expected Newton to take same iterations at both angles');
  failed++;
}

// Test 4: Superior to GD on Aligned Problems
console.log('\n📊 Test 4: Performance vs GD on Aligned Problem');
console.log('-'.repeat(70));

const illCondProblem = problemToProblemFunctions(illConditionedQuadratic);
const diagIllCond = runDiagonalPreconditioner(illCondProblem, {
  maxIter: 10,
  initialPoint: [0.3, 2.5]
});

const gdIllCond = runGradientDescentLineSearch(illCondProblem, {
  maxIter: 100,
  c1: 0.0001,
  lambda: 0,
  initialPoint: [0.3, 2.5]
});

console.log(`Diagonal Precond: ${diagIllCond.iterations.length} iterations`);
console.log(`GD + Line Search: ${gdIllCond.iterations.length} iterations`);
console.log(`Speedup: ${(gdIllCond.iterations.length / diagIllCond.iterations.length).toFixed(1)}×`);

if (diagIllCond.iterations.length < 5 && gdIllCond.iterations.length > 20) {
  console.log('✅ PASS: Diagonal precond vastly outperforms GD on aligned problem');
  passed++;
} else {
  console.log('❌ FAIL: Expected diagonal precond to be much faster');
  failed++;
}

// Test 5: Experiment Presets
console.log('\n📊 Test 5: Experiment Presets');
console.log('-'.repeat(70));

const experiments = getExperimentsForAlgorithm('diagonal-precond');
console.log(`Found ${experiments.length} experiment presets`);

experiments.forEach(exp => {
  console.log(`  - ${exp.id}`);
});

if (experiments.length === 5) {
  console.log('✅ PASS: All 5 experiment presets loaded');
  passed++;
} else {
  console.log('❌ FAIL: Expected 5 experiment presets');
  failed++;
}

// Test 6: Line Search Option
console.log('\n📊 Test 6: Line Search Option');
console.log('-'.repeat(70));

const withLS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: true
});

const withoutLS = runDiagonalPreconditioner(problemFuncs45, {
  maxIter: 100,
  initialPoint: [2, 2],
  useLineSearch: false
});

console.log(`With line search: ${withLS.iterations.length} iterations`);
console.log(`Without line search: ${withoutLS.iterations.length} iterations`);
console.log(`Line search trials in iter 0: ${withLS.iterations[0].lineSearchTrials !== undefined}`);

if (withLS.iterations[0].alpha !== undefined && withLS.iterations[0].lineSearchTrials !== undefined) {
  console.log('✅ PASS: Line search option works correctly');
  passed++;
} else {
  console.log('❌ FAIL: Line search data not present');
  failed++;
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passed}/6`);
console.log(`❌ Failed: ${failed}/6`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
}
