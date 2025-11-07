import { BasinData, ColorEncoding } from '../types/basin';
import { clusterConvergenceLocations, assignHuesToClusters } from './basinClustering';

/**
 * Encode basin data as colors (hue=basin, lightness=speed)
 */
export function encodeBasinColors(basinData: BasinData): ColorEncoding[][] {
  // Step 1: Cluster convergence locations
  const clusterIds = clusterConvergenceLocations(basinData);
  const maxClusterId = Math.max(...clusterIds);
  const numClusters = maxClusterId + 1;

  // Step 2: Assign hue to each cluster
  const clusterHues = assignHuesToClusters(numClusters);

  // Step 3: Find iteration range for lightness mapping
  const validPoints = basinData.grid.flat().filter(p => p.converged);

  if (validPoints.length === 0) {
    // All points diverged - return all dark
    return basinData.grid.map(row =>
      row.map(() => ({ hue: 0, lightness: 10 }))
    );
  }

  const minIter = Math.min(...validPoints.map(p => p.iterations));
  const maxIter = Math.max(...validPoints.map(p => p.iterations));

  // Step 4: Encode each grid point
  return basinData.grid.map((row, i) =>
    row.map((point, j) => {
      if (point.diverged) {
        return { hue: 0, lightness: 10 }; // Very dark
      }
      if (!point.converged) {
        return { hue: 0, lightness: 20 }; // Dark gray
      }

      const pointIndex = i * basinData.resolution + j;
      const clusterId = clusterIds[pointIndex];
      const hue = clusterId >= 0 ? clusterHues[clusterId] : 0;

      // Map iterations to lightness (log scale)
      let lightness = 55; // Default middle
      if (maxIter > minIter) {
        const t =
          (Math.log(point.iterations) - Math.log(minIter)) /
          (Math.log(maxIter) - Math.log(minIter));
        lightness = 80 - t * 50; // Range: 80% (fast) to 30% (slow)
      }

      return { hue, lightness };
    })
  );
}
