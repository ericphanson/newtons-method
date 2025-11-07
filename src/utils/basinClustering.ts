import { BasinData } from '../types/basin';

const CLUSTER_THRESHOLD = 0.1;

/**
 * Simple distance-based clustering of convergence locations
 * Returns array of cluster IDs for each grid point (row-major order)
 * -1 means no cluster (diverged/didn't converge)
 */
export function clusterConvergenceLocations(basinData: BasinData): number[] {
  // Extract all convergence locations
  const locations: Array<{ loc: [number, number]; index: number }> = [];

  basinData.grid.forEach((row, i) => {
    row.forEach((point, j) => {
      if (point.converged) {
        locations.push({
          loc: point.convergenceLoc,
          index: i * basinData.resolution + j
        });
      }
    });
  });

  // Build clusters
  const clusters: Array<[number, number]> = [];
  const pointToCluster = new Map<number, number>();

  locations.forEach(({ loc, index }) => {
    // Check if this point is close to any existing cluster center
    let assignedCluster = -1;

    for (let c = 0; c < clusters.length; c++) {
      const center = clusters[c];
      const dist = Math.sqrt(
        Math.pow(loc[0] - center[0], 2) + Math.pow(loc[1] - center[1], 2)
      );

      if (dist < CLUSTER_THRESHOLD) {
        assignedCluster = c;
        break;
      }
    }

    // Create new cluster if no match
    if (assignedCluster === -1) {
      assignedCluster = clusters.length;
      clusters.push(loc);
    }

    pointToCluster.set(index, assignedCluster);
  });

  // Build result array
  const result: number[] = [];
  for (let i = 0; i < basinData.resolution; i++) {
    for (let j = 0; j < basinData.resolution; j++) {
      const index = i * basinData.resolution + j;
      const point = basinData.grid[i][j];

      if (!point.converged) {
        result.push(-1);
      } else {
        result.push(pointToCluster.get(index) || 0);
      }
    }
  }

  return result;
}

/**
 * Assign hues to clusters
 * Single cluster: all one hue (blue)
 * Multiple clusters: spread across spectrum
 */
export function assignHuesToClusters(numClusters: number): number[] {
  if (numClusters === 0) return [];
  if (numClusters === 1) return [210]; // Blue

  // Spread across spectrum
  const hues: number[] = [];
  for (let i = 0; i < numClusters; i++) {
    hues.push((i * 360) / numClusters);
  }
  return hues;
}
