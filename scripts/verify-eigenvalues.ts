#!/usr/bin/env tsx
/**
 * Comprehensive eigenvalue verification test
 * Tests all edge cases to ensure robustness
 */

import { runNewton } from '../src/algorithms/newton';
import type { ProblemFunctions } from '../src/algorithms/types';

// Test matrices with known eigenvalues
const testCases = [
  {
    name: "2×2 Identity",
    matrix: [[1, 0], [0, 1]],
    expected: [1, 1]
  },
  {
    name: "2×2 Diagonal",
    matrix: [[5, 0], [0, 2]],
    expected: [5, 2]
  },
  {
    name: "2×2 Symmetric",
    matrix: [[4, 1], [1, 2]],
    expected: [4.41421356, 1.58578644]
  },
  {
    name: "2×2 Indefinite (saddle)",
    matrix: [[2, 0], [0, -1]],
    expected: [2, -1]
  },
  {
    name: "2×2 Nearly singular",
    matrix: [[1e-10, 0], [0, 1]],
    expected: [1, 1e-10]
  },
  {
    name: "3×3 Identity",
    matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    expected: [1, 1, 1]
  },
  {
    name: "3×3 Diagonal",
    matrix: [[5, 0, 0], [0, 3, 0], [0, 0, 1]],
    expected: [5, 3, 1]
  },
  {
    name: "3×3 Symmetric",
    matrix: [[2, 0.5, 0.3], [0.5, 2, 0.2], [0.3, 0.2, 1]],
    expected: [2.57937790, 1.50788791, 0.91273419]
  },
  {
    name: "3×3 Indefinite",
    matrix: [[1000, 1, 1], [1, 10, 1], [1, 1, 0.01]],
    expected: [1000.00201213, 10.09790829, -0.08992042]
  },
  {
    name: "3×3 All same diagonal",
    matrix: [[2, 0.1, 0.2], [0.1, 2, 0.1], [0.2, 0.1, 2]],
    // Should not produce NaN
  }
];

// Create a dummy problem to access computeEigenvalues through Newton's method
function testEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;

  // Create a simple quadratic problem with the given Hessian
  const problem: ProblemFunctions = {
    objective: (w: number[]) => 0.5 * w.reduce((sum, wi, i) =>
      sum + w.reduce((s, wj, j) => s + wi * matrix[i][j] * wj, 0), 0),
    gradient: (w: number[]) => matrix.map((row) =>
      row.reduce((sum, val, j) => sum + val * w[j], 0)),
    hessian: () => matrix,
    dimensionality: n
  };

  // Run one iteration of Newton to capture the eigenvalues
  const result = runNewton(problem, {
    maxIter: 1,
    initialPoint: Array(n).fill(0.1),
    termination: { gtol: 1e-10, ftol: 1e-10, xtol: 1e-10 }
  });

  // Return eigenvalues from first iteration
  if (result.iterations.length > 0) {
    return result.iterations[0].eigenvalues;
  }

  throw new Error('No iterations captured');
}

console.log('='.repeat(80));
console.log('COMPREHENSIVE EIGENVALUE VERIFICATION TEST');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`Testing: ${test.name}`);
  console.log(`  Matrix: ${JSON.stringify(test.matrix)}`);

  try {
    const computed = testEigenvalues(test.matrix);

    // Check for NaN or Infinity
    if (computed.some(e => !isFinite(e))) {
      console.log(`  ❌ FAIL: Contains NaN or Infinity: ${computed}`);
      failed++;
      continue;
    }

    console.log(`  Computed: [${computed.map(e => e.toFixed(8)).join(', ')}]`);

    if (test.expected) {
      console.log(`  Expected: [${test.expected.map(e => e.toFixed(8)).join(', ')}]`);

      // Sort both by absolute value for comparison
      const sortedComputed = [...computed].sort((a, b) => Math.abs(b) - Math.abs(a));
      const sortedExpected = [...test.expected].sort((a, b) => Math.abs(b) - Math.abs(a));

      // Check if they match
      const maxError = sortedComputed.reduce((max, val, i) =>
        Math.max(max, Math.abs(val - sortedExpected[i])), 0);

      if (maxError < 1e-6) {
        console.log(`  ✅ PASS (max error: ${maxError.toExponential(2)})`);
        passed++;
      } else {
        console.log(`  ❌ FAIL (max error: ${maxError.toExponential(2)})`);
        failed++;
      }
    } else {
      console.log(`  ✅ PASS (no NaN/Inf)`);
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log();
}

console.log('='.repeat(80));
console.log('RESULTS');
console.log('='.repeat(80));
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log();

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED - Eigenvalue computation is robust!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Issues need to be addressed');
  process.exit(1);
}
