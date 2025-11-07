#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { initializeBasinData, computeBasinPoint } from '../src/utils/basinComputation';

const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

// Use UI's buggy bounds
const bounds = {
  minW0: -1.858879030489752,
  maxW0: 6.516912396940847,
  minW1: -25.264024095832582,
  maxW1: 3.387638554166598
};

console.log('Analyzing convergence locations with UI bounds...\n');

const basinData = initializeBasinData(20, bounds);
const resolution = 20;
const convergenceLocations: Array<{ start: number[], end: number[], iters: number }> = [];

for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const w0 = bounds.minW0 + (j / (resolution - 1)) * (bounds.maxW0 - bounds.minW0);
    const w1 = bounds.minW1 + (i / (resolution - 1)) * (bounds.maxW1 - bounds.minW1);
    
    const result = computeBasinPoint(
      [w0, w1, 19.83],
      problemFuncs,
      'newton',
      {
        maxIter: 50,
        c1: 0.0001,
        hessianDamping: 0.01,
        lineSearch: 'armijo',
        tolerance: 1e-4
      }
    );
    
    if (result.converged) {
      convergenceLocations.push({
        start: [w0, w1, 19.83],
        end: result.convergenceLoc,
        iters: result.iterations
      });
    }
  }
}

console.log(`Total converged: ${convergenceLocations.length}`);
console.log('\nFirst 10 convergence locations:');
convergenceLocations.slice(0, 10).forEach((loc, idx) => {
  console.log(`${idx + 1}. Start: [${loc.start[0].toFixed(3)}, ${loc.start[1].toFixed(3)}, ${loc.start[2].toFixed(2)}]`);
  console.log(`   End: [${loc.end[0].toFixed(6)}, ${loc.end[1].toFixed(6)}], iters: ${loc.iters}`);
});

// Analyze unique endpoints
const uniqueEndpoints: Array<{ loc: number[], count: number }> = [];
const EPSILON = 0.001;  // Tolerance for grouping

convergenceLocations.forEach(({ end }) => {
  const existing = uniqueEndpoints.find(u => 
    Math.abs(u.loc[0] - end[0]) < EPSILON && Math.abs(u.loc[1] - end[1]) < EPSILON
  );
  
  if (existing) {
    existing.count++;
  } else {
    uniqueEndpoints.push({ loc: [end[0], end[1]], count: 1 });
  }
});

console.log(`\n\n=== Unique Endpoints (epsilon=${EPSILON}) ===`);
uniqueEndpoints.sort((a, b) => b.count - a.count);
uniqueEndpoints.forEach((u, idx) => {
  console.log(`${idx + 1}. [${u.loc[0].toFixed(6)}, ${u.loc[1].toFixed(6)}] - ${u.count} points converged here`);
});

// Evaluate loss at these locations
console.log('\n=== Loss at convergence locations ===');
uniqueEndpoints.slice(0, 10).forEach((u, idx) => {
  const w = [u.loc[0], u.loc[1], 19.83];
  const loss = problemFuncs.objective(w);
  const grad = problemFuncs.gradient(w);
  const gradNorm = Math.sqrt(grad.reduce((sum: number, g: number) => sum + g*g, 0));
  console.log(`${idx + 1}. Loss: ${loss.toFixed(10)}, GradNorm: ${gradNorm.toExponential(3)}`);
});
