#!/usr/bin/env tsx
/**
 * Analyze why Newton gets stuck on multimodal problems
 */

import { himmelblauProblem } from '../src/problems/himmelblau';
import { threeHumpCamelProblem } from '../src/problems/threeHumpCamel';

function eigenvalues2x2(H: number[][]): [number, number] {
  const a = H[0][0], b = H[0][1], c = H[1][0], d = H[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = Math.sqrt(trace * trace - 4 * det);
  return [(trace + disc) / 2, (trace - disc) / 2];
}

function analyzePoint(name: string, problem: { objective: (w: number[]) => number; gradient: (w: number[]) => number[]; hessian: (w: number[]) => number[][] }, w: number[]) {
  const f = problem.objective(w);
  const g = problem.gradient(w);
  const H = problem.hessian(w);
  const gradNorm = Math.sqrt(g.reduce((s: number, v: number) => s + v * v, 0));
  const [lambda1, lambda2] = eigenvalues2x2(H);

  console.log(`\n${name} at [${w.map(x => x.toFixed(6)).join(', ')}]:`);
  console.log(`  f = ${f.toFixed(8)}`);
  console.log(`  ||∇f|| = ${gradNorm.toExponential(6)}`);
  console.log(`  Hessian eigenvalues: λ₁=${lambda1.toFixed(4)}, λ₂=${lambda2.toFixed(4)}`);
  console.log(`  Condition number: ${(Math.abs(lambda1 / lambda2)).toFixed(2)}`);

  if (lambda1 < 0 || lambda2 < 0) {
    console.log(`  ⚠️  INDEFINITE Hessian (negative eigenvalue) - Newton direction may not be descent!`);
  } else if (Math.min(Math.abs(lambda1), Math.abs(lambda2)) < 1e-6) {
    console.log(`  ⚠️  SINGULAR Hessian (near-zero eigenvalue) - Newton step undefined!`);
  } else if (Math.abs(lambda1 / lambda2) > 1000) {
    console.log(`  ⚠️  ILL-CONDITIONED Hessian - Newton step may be unstable!`);
  }

  if (gradNorm < 1e-5) {
    if (lambda1 > 0 && lambda2 > 0) {
      console.log(`  ✅ LOCAL MINIMUM`);
    } else if (lambda1 < 0 && lambda2 < 0) {
      console.log(`  ❌ LOCAL MAXIMUM`);
    } else {
      console.log(`  ❌ SADDLE POINT (one pos, one neg eigenvalue)`);
    }
  }
}

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║          Analyzing Stuck Points on Multimodal Problems            ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');

console.log('\n' + '='.repeat(70));
console.log('HIMMELBLAU PROBLEM');
console.log('='.repeat(70));

// Points where Newton gets stuck on Himmelblau
analyzePoint('Origin (stuck)', himmelblauProblem, [0, 0]);
analyzePoint('Point (1,1) (stuck)', himmelblauProblem, [1, 1]);
analyzePoint('Known minimum (converges)', himmelblauProblem, [3, 2]);

console.log('\n' + '='.repeat(70));
console.log('THREE-HUMP CAMEL PROBLEM');
console.log('='.repeat(70));

// Points where Newton gets stuck on Three-Hump Camel
analyzePoint('Global minimum (0,0)', threeHumpCamelProblem, [0, 0]);
analyzePoint('Stuck point from [1, 0.5]', threeHumpCamelProblem, [1.074610, -0.532146]);
analyzePoint('Near local min', threeHumpCamelProblem, [1.7, -0.85]);

console.log('\n' + '='.repeat(70));
console.log('DIAGNOSIS');
console.log('='.repeat(70));
console.log(`
Newton's method stalls on these problems because:

1. **Himmelblau at origin & (1,1)**: The Hessian has NEGATIVE eigenvalues,
   making it indefinite. Newton computes a direction that's NOT a descent
   direction. The line search accepts tiny steps, leading to crawling.

2. **Three-Hump Camel from [1, 0.5]**: Newton finds a critical point where
   ∇f ≠ 0 but the Hessian may be near-singular or indefinite, causing the
   Newton step to become unreliable.

SOLUTION: The current implementation uses Hessian damping (adding λI to H)
which helps, but may not be enough. The line search prevents divergence but
allows crawling behavior. This is EXPECTED on multimodal problems - Newton's
method is designed for convex problems and struggles with saddles/indefinite
regions.

For basin visualization, this is actually GOOD - it shows which starting
points lead to convergence vs getting stuck!
`);
