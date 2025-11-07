#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { runNewton } from '../src/algorithms/newton';

const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

const bounds = {
  minW0: -1.858879030489752,
  maxW0: 6.516912396940847,
  minW1: -25.264024095832582,
  maxW1: 3.387638554166598
};

console.log('Checking FULL 3D convergence locations...\n');

const resolution = 20;
const full3DLocations: Array<{ loc: number[], loss: number, gradNorm: number }> = [];

for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const w0 = bounds.minW0 + (j / (resolution - 1)) * (bounds.maxW0 - bounds.minW0);
    const w1 = bounds.minW1 + (i / (resolution - 1)) * (bounds.maxW1 - bounds.minW1);
    
    const result = runNewton(problemFuncs, {
      initialPoint: [w0, w1, 19.83],
      maxIter: 50,
      c1: 0.0001,
      hessianDamping: 0.01,
      lineSearch: 'armijo',
      tolerance: 1e-4
    });
    
    if (result.summary.converged) {
      const finalLoc = result.summary.finalLocation;
      const loss = problemFuncs.objective(finalLoc);
      const grad = problemFuncs.gradient(finalLoc);
      const gradNorm = Math.sqrt(grad.reduce((sum: number, g: number) => sum + g*g, 0));
      
      full3DLocations.push({ loc: finalLoc, loss, gradNorm });
    }
  }
}

console.log(`Total converged: ${full3DLocations.length}\n`);

// Group by 3D location
const unique3D: Array<{ loc: number[], count: number, avgLoss: number, avgGradNorm: number }> = [];
const EPSILON = 0.01;

full3DLocations.forEach(({ loc, loss, gradNorm }) => {
  const existing = unique3D.find(u => 
    Math.abs(u.loc[0] - loc[0]) < EPSILON && 
    Math.abs(u.loc[1] - loc[1]) < EPSILON &&
    Math.abs(u.loc[2] - loc[2]) < EPSILON
  );
  
  if (existing) {
    existing.count++;
    existing.avgLoss = (existing.avgLoss * (existing.count - 1) + loss) / existing.count;
    existing.avgGradNorm = (existing.avgGradNorm * (existing.count - 1) + gradNorm) / existing.count;
  } else {
    unique3D.push({ loc: [...loc], count: 1, avgLoss: loss, avgGradNorm: gradNorm });
  }
});

console.log(`=== Unique 3D Convergence Locations (epsilon=${EPSILON}) ===`);
unique3D.sort((a, b) => b.count - a.count);
unique3D.forEach((u, idx) => {
  console.log(`${idx + 1}. [${u.loc[0].toFixed(4)}, ${u.loc[1].toFixed(4)}, ${u.loc[2].toFixed(4)}]`);
  console.log(`    Count: ${u.count}, Loss: ${u.avgLoss.toFixed(8)}, GradNorm: ${u.avgGradNorm.toExponential(3)}`);
});
