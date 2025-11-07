#!/usr/bin/env tsx
/**
 * Test script to demonstrate clustering bug
 */

import { clusterConvergenceLocations } from '../src/utils/basinClustering';
import { BasinData } from '../src/types/basin';

// Create test basin data where points should be in same cluster
// but greedy algorithm splits them
const testData: BasinData = {
  resolution: 3,
  bounds: { minW0: 0, maxW0: 1, minW1: 0, maxW1: 1 },
  grid: [
    [
      // Point A: [0.0, 0.0]
      { convergenceLoc: [0.0, 0.0], iterations: 10, converged: true, diverged: false },
      // Point B: [0.05, 0.05] - distance from A = 0.07
      { convergenceLoc: [0.05, 0.05], iterations: 10, converged: true, diverged: false },
      // Point C: [0.09, 0.09] - distance from A = 0.127, distance from B = 0.056
      { convergenceLoc: [0.09, 0.09], iterations: 10, converged: true, diverged: false }
    ],
    [
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true },
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true },
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true }
    ],
    [
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true },
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true },
      { convergenceLoc: [0, 0], iterations: 0, converged: false, diverged: true }
    ]
  ]
};

console.log('Testing clustering algorithm with points that should be in same cluster:\n');
console.log('Point A: [0.00, 0.00]');
console.log('Point B: [0.05, 0.05] - distance from A = 0.071');
console.log('Point C: [0.09, 0.09] - distance from A = 0.127, distance from B = 0.057');
console.log('\nWith threshold = 0.1, all points should be in same cluster');
console.log('(A→B is 0.071 < 0.1, B→C is 0.057 < 0.1)\n');

const clusterIds = clusterConvergenceLocations(testData);
const numClusters = Math.max(...clusterIds.filter(id => id >= 0)) + 1;

console.log('Result:');
console.log(`Cluster IDs: [${clusterIds.slice(0, 3).join(', ')}]`);
console.log(`Number of clusters: ${numClusters}`);

if (numClusters === 1) {
  console.log('\n✅ PASS: All points in same cluster (correct)');
} else {
  console.log('\n❌ FAIL: Points split into multiple clusters (bug!)');
  console.log('Issue: Greedy algorithm compares against first point in cluster,');
  console.log('not cluster centroid. Point C is far from A but close to B.');
}
