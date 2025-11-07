#!/usr/bin/env tsx
import { generateCrescents } from '../src/shared-utils';
import { logisticRegressionToProblemFunctions } from '../src/utils/problemAdapter';
import { initializeBasinData, computeBasinPoint } from '../src/utils/basinComputation';
import { clusterConvergenceLocations } from '../src/utils/basinClustering';

const data = generateCrescents();
const problemFuncs = logisticRegressionToProblemFunctions(data, 0.0001);

// Use EXACT UI bounds from console
const uiBounds = {
  minW0: -1.858879030489752,
  maxW0: 6.516912396940847,
  minW1: -25.264024095832582,
  maxW1: 3.387638554166598
};

const correctBounds = {
  minW0: -3,
  maxW0: 3,
  minW1: -3,
  maxW1: 3
};

console.log('Testing with UI bounds vs correct bounds\n');

for (const [name, bounds] of [['UI Bounds', uiBounds], ['Correct Bounds', correctBounds]]) {
  console.log(`\n=== ${name} ===`);
  console.log(`Bounds: w0=[${bounds.minW0.toFixed(2)}, ${bounds.maxW0.toFixed(2)}], w1=[${bounds.minW1.toFixed(2)}, ${bounds.maxW1.toFixed(2)}]`);
  
  const basinData = initializeBasinData(20, bounds);
  const resolution = 20;
  let convergedCount = 0;
  
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
      
      basinData.grid[i][j] = result;
      if (result.converged) convergedCount++;
    }
  }
  
  const clusterIds = clusterConvergenceLocations(basinData);
  const numClusters = Math.max(...clusterIds) + 1;
  
  console.log(`Converged: ${convergedCount}/400`);
  console.log(`Clusters: ${numClusters}`);
}
