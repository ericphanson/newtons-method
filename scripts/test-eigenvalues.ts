#!/usr/bin/env tsx
/**
 * Test eigenvalue computation - exports function for Python comparison
 * This script provides a CLI to test the eigenvalue computation from newton.ts
 */

// We'll need to export the computeEigenvalues function from newton.ts first
// For now, this script will test and display results for Python comparison

interface TestCase {
  name: string;
  matrix: number[][];
}

const testCases: TestCase[] = [
  {
    name: "2x2 Identity",
    matrix: [[1, 0], [0, 1]]
  },
  {
    name: "2x2 Diagonal",
    matrix: [[4, 0], [0, 2]]
  },
  {
    name: "2x2 Symmetric (Rosenbrock Hessian at origin)",
    matrix: [[2, 0], [0, 200]]
  },
  {
    name: "2x2 With off-diagonal",
    matrix: [[4, 1], [1, 2]]
  },
  {
    name: "2x2 Three-Hump Camel at (0,0)",
    matrix: [[4, 1], [1, 2]]
  },
  {
    name: "2x2 Nearly singular",
    matrix: [[1e-8, 0], [0, 1]]
  },
  {
    name: "2x2 Indefinite (saddle point)",
    matrix: [[2, 0], [0, -1]]
  },
  {
    name: "3x3 Identity",
    matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  {
    name: "3x3 Diagonal",
    matrix: [[5, 0, 0], [0, 3, 0], [0, 0, 1]]
  },
  {
    name: "3x3 Logistic Regression Hessian",
    matrix: [[2, 0.5, 0.3], [0.5, 2, 0.2], [0.3, 0.2, 1]]
  },
  {
    name: "3x3 Ill-conditioned",
    matrix: [[1000, 1, 1], [1, 10, 1], [1, 1, 0.01]]
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const outputFormat = args.includes('--json') ? 'json' : 'text';
const matrixArg = args.find(arg => arg.startsWith('--matrix='));

if (matrixArg) {
  // Single matrix test mode for Python integration
  const matrixJson = matrixArg.replace('--matrix=', '');
  const matrix = JSON.parse(matrixJson);

  // Import and call the actual function
  import('../src/algorithms/newton.ts').then(() => {
    // We need to extract computeEigenvalues - it's not exported
    // So we'll print the matrix and let Python handle the comparison
    console.log(JSON.stringify({
      matrix,
      note: "computeEigenvalues is not exported from newton.ts - needs to be exported first"
    }));
  }).catch(err => {
    console.error('Error importing newton.ts:', err.message);
    process.exit(1);
  });
} else {
  // Display test cases for manual comparison
  console.log('='.repeat(80));
  console.log('EIGENVALUE TEST MATRICES');
  console.log('To compare with numpy, copy these matrices to Python');
  console.log('='.repeat(80));
  console.log();

  if (outputFormat === 'json') {
    console.log(JSON.stringify(testCases, null, 2));
  } else {
    testCases.forEach((tc, i) => {
      console.log(`${i + 1}. ${tc.name}`);
      console.log('   Matrix:', JSON.stringify(tc.matrix));
      console.log();
    });

    console.log('='.repeat(80));
    console.log('NEXT STEPS:');
    console.log('1. Export computeEigenvalues from src/algorithms/newton.ts');
    console.log('2. Create Python test script to compare with numpy.linalg.eig');
    console.log('3. Run comparison tests');
    console.log('='.repeat(80));
  }
}
