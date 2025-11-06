// src/utils/surfaceMeshGenerator.ts

/**
 * Generate mesh data for 3D surface plot of objective function
 *
 * @param objectiveFn - Function that takes [w0, w1] and returns loss value
 * @param bounds - Domain bounds {w0: [min, max], w1: [min, max]}
 * @param resolution - Grid resolution (default: 50x50)
 * @returns Mesh data with positions and color values
 */
export interface SurfaceMeshData {
  positions: Float32Array; // Vertex positions [x, y, z, x, y, z, ...]
  colors: Float32Array;    // Vertex colors [r, g, b, r, g, b, ...]
  indices: Uint16Array;    // Triangle indices
  minZ: number;            // Minimum z (loss) value
  maxZ: number;            // Maximum z (loss) value
}

export function generateSurfaceMesh(
  objectiveFn: (w: number[]) => number,
  bounds: { w0: [number, number]; w1: [number, number] },
  resolution?: number // Make optional
): SurfaceMeshData {
  // Auto-adjust resolution based on bounds if not specified
  if (resolution === undefined) {
    const w0Range = bounds.w0[1] - bounds.w0[0];
    const w1Range = bounds.w1[1] - bounds.w1[0];
    const avgRange = (w0Range + w1Range) / 2;

    // Lower resolution for larger domains
    if (avgRange > 10) {
      resolution = 30;
    } else if (avgRange > 5) {
      resolution = 40;
    } else {
      resolution = 50;
    }
  }

  const [w0Min, w0Max] = bounds.w0;
  const [w1Min, w1Max] = bounds.w1;

  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const zValues: number[] = [];

  // Generate grid vertices
  for (let i = 0; i <= resolution; i++) {
    const w1 = w1Min + (i / resolution) * (w1Max - w1Min);

    for (let j = 0; j <= resolution; j++) {
      const w0 = w0Min + (j / resolution) * (w0Max - w0Min);

      // Evaluate objective function
      const z = objectiveFn([w0, w1]);
      zValues.push(z);

      // Add vertex position (x=w0, y=w1, z=-loss)
      // Negate z so lower loss appears "down" (descending into valley)
      vertices.push(w0, w1, -z);

      // Color will be set after we know min/max z
      colors.push(0, 0, 0);
    }
  }

  // Find min/max z for color mapping
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const zRange = maxZ - minZ || 1; // Avoid division by zero

  // Set colors based on z value (blue=low, red=high)
  for (let i = 0; i < zValues.length; i++) {
    const normalizedZ = (zValues[i] - minZ) / zRange;

    // Color map: blue (low) -> cyan -> green -> yellow -> red (high)
    let r = 0, g = 0, b = 1;

    if (normalizedZ < 0.25) {
      // Blue to cyan
      const t = normalizedZ / 0.25;
      r = 0;
      g = t;
      b = 1;
    } else if (normalizedZ < 0.5) {
      // Cyan to green
      const t = (normalizedZ - 0.25) / 0.25;
      r = 0;
      g = 1;
      b = 1 - t;
    } else if (normalizedZ < 0.75) {
      // Green to yellow
      const t = (normalizedZ - 0.5) / 0.25;
      r = t;
      g = 1;
      b = 0;
    } else {
      // Yellow to red
      const t = (normalizedZ - 0.75) / 0.25;
      r = 1;
      g = 1 - t;
      b = 0;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  // Generate triangle indices
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j;
      const b = a + 1;
      const c = a + (resolution + 1);
      const d = c + 1;

      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return {
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    minZ,
    maxZ,
  };
}
