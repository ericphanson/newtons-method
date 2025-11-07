import { BasinData } from '../types/basin';

// Clustering threshold for grouping convergence locations
// NOTE: With loose convergence tolerance (1e-4) and limited maxIter, points may converge to
// different "good enough" locations. The threshold should be larger to account for this.
// For tight convergence (tolerance=1e-10, maxIter=1000), use 0.01.
// For loose convergence (tolerance=1e-4, maxIter=50), use 1.0 or larger.
const CLUSTER_THRESHOLD = 1.0;  // Increased from 0.1 to handle loose convergence tolerance
const MAX_ITERATIONS = 10;

/**
 * Distance-based clustering using iterative centroid refinement
 * Similar to k-means but with automatic cluster discovery
 * Returns array of cluster IDs for each grid point (row-major order)
 * -1 means no cluster (diverged/didn't converge)
 * Handles both 2D and 3D convergence locations
 */
export function clusterConvergenceLocations(basinData: BasinData): number[] {
  // Extract all CONVERGED convergence locations (2D or 3D)
  const locations: Array<{ loc: number[]; index: number }> = [];

  basinData.grid.forEach((row, i) => {
    row.forEach((point, j) => {
      if (point.converged) {
        locations.push({
          loc: Array.from(point.convergenceLoc),
          index: i * basinData.resolution + j
        });
      }
    });
  });

  if (locations.length === 0) {
    return Array(basinData.resolution * basinData.resolution).fill(-1);
  }

  // Helper: compute Euclidean distance (works for 2D or 3D)
  const distance = (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
  };

  // Initial greedy clustering pass to find candidate clusters
  let clusterCentroids: Array<number[]> = [];
  let pointToCluster = new Map<number, number>();

  // First pass: greedy cluster assignment
  locations.forEach(({ loc, index }) => {
    let bestCluster = -1;
    let bestDist = Infinity;

    for (let c = 0; c < clusterCentroids.length; c++) {
      const centroid = clusterCentroids[c];
      const dist = distance(loc, centroid);

      if (dist < CLUSTER_THRESHOLD && dist < bestDist) {
        bestCluster = c;
        bestDist = dist;
      }
    }

    if (bestCluster === -1) {
      bestCluster = clusterCentroids.length;
      clusterCentroids.push([...loc]);
    }

    pointToCluster.set(index, bestCluster);
  });

  // Iteratively refine centroids until convergence
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Recompute centroids (works for 2D or 3D)
    const clusterSums: Array<number[]> = Array(clusterCentroids.length)
      .fill(null)
      .map(() => new Array(clusterCentroids[0].length).fill(0));
    const clusterCounts: number[] = Array(clusterCentroids.length).fill(0);

    locations.forEach(({ loc, index }) => {
      const clusterId = pointToCluster.get(index)!;
      loc.forEach((val, dim) => {
        clusterSums[clusterId][dim] += val;
      });
      clusterCounts[clusterId]++;
    });

    const newCentroids = clusterSums.map((sum, c) => {
      const count = clusterCounts[c];
      return count > 0
        ? sum.map(s => s / count)
        : clusterCentroids[c];
    });

    // Check for convergence
    let maxShift = 0;
    for (let c = 0; c < clusterCentroids.length; c++) {
      const shift = distance(newCentroids[c], clusterCentroids[c]);
      maxShift = Math.max(maxShift, shift);
    }

    clusterCentroids = newCentroids;

    // Reassign points to nearest cluster within threshold
    let changed = false;
    locations.forEach(({ loc, index }) => {
      let bestCluster = -1;
      let bestDist = Infinity;

      for (let c = 0; c < clusterCentroids.length; c++) {
        const centroid = clusterCentroids[c];
        const dist = distance(loc, centroid);

        // Only assign if within threshold AND closer than current best
        if (dist < CLUSTER_THRESHOLD && dist < bestDist) {
          bestCluster = c;
          bestDist = dist;
        }
      }

      // If no cluster within threshold, keep current assignment
      if (bestCluster === -1) {
        bestCluster = pointToCluster.get(index)!;
      }

      const oldCluster = pointToCluster.get(index)!;
      if (oldCluster !== bestCluster) {
        pointToCluster.set(index, bestCluster);
        changed = true;
      }
    });

    // Check if any clusters should be merged (centroids within threshold)
    const mergePairs: Array<[number, number]> = [];
    for (let i = 0; i < clusterCentroids.length; i++) {
      for (let j = i + 1; j < clusterCentroids.length; j++) {
        const dist = distance(clusterCentroids[i], clusterCentroids[j]);
        if (dist < CLUSTER_THRESHOLD) {
          mergePairs.push([i, j]);
        }
      }
    }

    // Merge clusters
    if (mergePairs.length > 0) {
      const clusterMapping = new Map<number, number>();
      for (let c = 0; c < clusterCentroids.length; c++) {
        clusterMapping.set(c, c);
      }

      // Apply merges (merge to lower index)
      for (const [i, j] of mergePairs) {
        const targetI = clusterMapping.get(i)!;
        const targetJ = clusterMapping.get(j)!;
        const mergeTarget = Math.min(targetI, targetJ);
        clusterMapping.set(i, mergeTarget);
        clusterMapping.set(j, mergeTarget);
      }

      // Remap all points
      locations.forEach(({ index }) => {
        const oldCluster = pointToCluster.get(index)!;
        const newCluster = clusterMapping.get(oldCluster)!;
        if (oldCluster !== newCluster) {
          pointToCluster.set(index, newCluster);
          changed = true;
        }
      });

      // Rebuild centroid list (skip merged clusters)
      const newCentroids: Array<number[]> = [];
      const newClusterMapping = new Map<number, number>();
      for (let c = 0; c < clusterCentroids.length; c++) {
        const mappedCluster = clusterMapping.get(c)!;
        if (mappedCluster === c) {
          newClusterMapping.set(c, newCentroids.length);
          newCentroids.push(clusterCentroids[c]);
        }
      }

      // Update point assignments with new indices
      locations.forEach(({ index }) => {
        const oldCluster = pointToCluster.get(index)!;
        const newCluster = newClusterMapping.get(oldCluster)!;
        pointToCluster.set(index, newCluster);
      });

      clusterCentroids = newCentroids;
    }

    // Converged if centroids didn't move much and no assignments changed
    if (maxShift < 1e-6 && !changed) {
      break;
    }
  }

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
