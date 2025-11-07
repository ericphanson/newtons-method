#!/usr/bin/env tsx
/**
 * Validate analytical derivatives using finite differences
 * Tests gradients and Hessians for the new multimodal problems
 */

import { himmelblauProblem } from '../src/problems/himmelblau';
import { threeHumpCamelProblem } from '../src/problems/threeHumpCamel';
import { ProblemDefinition } from '../src/types/experiments';

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

function testProblem(name: string, problem: ProblemDefinition, testPoints: Array<{w: number[], desc: string}>) {
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

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║          Derivative Validation via Finite Differences             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');

let allPassed = true;

allPassed &&= testProblem("Himmelblau's Function", himmelblauProblem, [
  {w: [0, 0], desc: 'Origin'},
  {w: [1, 1], desc: 'Generic point'},
  {w: [3.0, 2.0], desc: 'Minimum 1 (3.0, 2.0)'},
  {w: [-2.805118, 3.131312], desc: 'Minimum 2'},
  {w: [-3.779310, -3.283186], desc: 'Minimum 3'},
  {w: [3.584428, -1.848126], desc: 'Minimum 4'},
]);

allPassed &&= testProblem('Three-Hump Camel', threeHumpCamelProblem, [
  {w: [0, 0], desc: 'Global minimum'},
  {w: [1, 1], desc: 'Generic point'},
  {w: [1.7, -0.85], desc: 'Near local min 1'},
  {w: [-1.7, 0.85], desc: 'Near local min 2'},
]);

console.log(`\n${'='.repeat(70)}`);
console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(70));
process.exit(allPassed ? 0 : 1);
