// src/utils/contourDrawing.ts

/**
 * Draw contour lines on a canvas using marching squares algorithm
 */

interface ContourOptions {
  ctx: CanvasRenderingContext2D;
  values: number[][];  // 2D grid of loss values
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  canvasWidth: number;
  canvasHeight: number;
  numLevels?: number;
  minValue?: number;
  maxValue?: number;
}

export function drawContours(options: ContourOptions): void {
  const { ctx, values, bounds, canvasWidth, canvasHeight, numLevels = 15 } = options;

  const minValue = options.minValue ?? Math.min(...values.flat());
  const maxValue = options.maxValue ?? Math.max(...values.flat());
  const valueRange = maxValue - minValue;

  if (valueRange === 0) return; // Flat surface, no contours

  const resolution = values.length;
  const { minW0, maxW0, minW1, maxW1 } = bounds;
  const w0Range = maxW0 - minW0;
  const w1Range = maxW1 - minW1;

  const toCanvasX = (w0: number) => ((w0 - minW0) / w0Range) * canvasWidth;
  const toCanvasY = (w1: number) => ((maxW1 - w1) / w1Range) * canvasHeight;

  // Generate contour levels
  const levels: number[] = [];
  for (let i = 0; i < numLevels; i++) {
    levels.push(minValue + (i + 1) * valueRange / (numLevels + 1));
  }

  // Draw each contour level
  levels.forEach((level, idx) => {
    const normalized = idx / (numLevels - 1);

    // Color from blue (low) to red (high)
    let r, g, b;
    if (normalized < 0.5) {
      const t = normalized / 0.5;
      r = Math.floor(0 + t * 0);
      g = Math.floor(0 + t * 200);
      b = Math.floor(255 * (1 - t * 0.5));
    } else {
      const t = (normalized - 0.5) / 0.5;
      r = Math.floor(0 + t * 255);
      g = Math.floor(200 * (1 - t));
      b = Math.floor(127 * (1 - t));
    }

    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 1.5;

    // Find contour segments using marching squares
    const segments = marchingSquares(values, level, resolution);

    // Draw contour segments
    segments.forEach(segment => {
      ctx.beginPath();
      segment.forEach((point, i) => {
        const w0 = minW0 + point.x * w0Range / resolution;
        const w1 = minW1 + point.y * w1Range / resolution;
        const cx = toCanvasX(w0);
        const cy = toCanvasY(w1);

        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    });
  });
}

interface Point {
  x: number;
  y: number;
}

function marchingSquares(values: number[][], level: number, resolution: number): Point[][] {
  const segments: Point[][] = [];

  for (let i = 0; i < resolution - 1; i++) {
    for (let j = 0; j < resolution - 1; j++) {
      // Get values at four corners of cell
      const v00 = values[i][j];
      const v10 = values[i + 1][j];
      const v11 = values[i + 1][j + 1];
      const v01 = values[i][j + 1];

      // Determine case (which corners are above threshold)
      let caseIndex = 0;
      if (v00 > level) caseIndex |= 1;
      if (v10 > level) caseIndex |= 2;
      if (v11 > level) caseIndex |= 4;
      if (v01 > level) caseIndex |= 8;

      // Skip if all corners same side
      if (caseIndex === 0 || caseIndex === 15) continue;

      // Calculate edge intersections using linear interpolation
      const edges: Point[] = [];

      // Bottom edge (v00 to v10)
      if (caseIndex & 0x3 && (caseIndex & 0x3) !== 0x3) {
        const t = (level - v00) / (v10 - v00);
        edges.push({ x: i + t, y: j });
      }

      // Right edge (v10 to v11)
      if ((caseIndex >> 1) & 0x3 && ((caseIndex >> 1) & 0x3) !== 0x3) {
        const t = (level - v10) / (v11 - v10);
        edges.push({ x: i + 1, y: j + t });
      }

      // Top edge (v11 to v01)
      if ((caseIndex >> 2) & 0x3 && ((caseIndex >> 2) & 0x3) !== 0x3) {
        const t = (level - v01) / (v11 - v01);
        edges.push({ x: i + 1 - t, y: j + 1 });
      }

      // Left edge (v01 to v00)
      if (((caseIndex >> 3) | (caseIndex << 1)) & 0x3 && (((caseIndex >> 3) | (caseIndex << 1)) & 0x3) !== 0x3) {
        const t = (level - v00) / (v01 - v00);
        edges.push({ x: i, y: j + t });
      }

      // Add segment if we have edge intersections
      if (edges.length >= 2) {
        segments.push([edges[0], edges[1]]);
      }
    }
  }

  return segments;
}
