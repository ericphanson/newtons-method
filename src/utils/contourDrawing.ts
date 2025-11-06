// src/utils/contourDrawing.ts

import { contours } from 'd3-contour';
import { range } from 'd3-array';

/**
 * Draw contour lines on a canvas using d3-contour
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

  // Flatten 2D array to 1D array (d3-contour expects 1D)
  const flatValues = values.flat();

  const minValue = options.minValue ?? Math.min(...flatValues);
  const maxValue = options.maxValue ?? Math.max(...flatValues);
  const valueRange = maxValue - minValue;

  if (valueRange === 0) return; // Flat surface, no contours

  const resolution = values.length;
  const { minW0, maxW0, minW1, maxW1 } = bounds;
  const w0Range = maxW0 - minW0;
  const w1Range = maxW1 - minW1;

  // Create contour generator
  const contourGenerator = contours()
    .size([resolution, resolution])
    .smooth(true)
    .thresholds(range(numLevels).map(i =>
      minValue + ((i + 1) / (numLevels + 1)) * valueRange
    ));

  // Generate contours
  const contourData = contourGenerator(flatValues);

  // Draw each contour level
  contourData.forEach((contour, idx) => {
    const normalized = idx / (numLevels - 1);

    // Color from blue (low) to red (high)
    let r, g, b;
    if (normalized < 0.5) {
      const t = normalized / 0.5;
      r = Math.floor(0 + t * 50);
      g = Math.floor(100 + t * 150);
      b = Math.floor(255 * (1 - t * 0.3));
    } else {
      const t = (normalized - 0.5) / 0.5;
      r = Math.floor(50 + t * 205);
      g = Math.floor(250 * (1 - t * 0.8));
      b = Math.floor(178 * (1 - t));
    }

    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw contour paths
    if (contour.coordinates && contour.coordinates.length > 0) {
      contour.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ctx.beginPath();
          ring.forEach((point, i) => {
            // Map from grid coordinates to canvas coordinates
            const gridX = point[0];
            const gridY = point[1];

            // Convert to parameter space
            const w0 = minW0 + (gridX / resolution) * w0Range;
            const w1 = minW1 + (gridY / resolution) * w1Range;

            // Convert to canvas coordinates
            const canvasX = ((w0 - minW0) / w0Range) * canvasWidth;
            const canvasY = ((maxW1 - w1) / w1Range) * canvasHeight;

            if (i === 0) {
              ctx.moveTo(canvasX, canvasY);
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          });
          ctx.stroke();
        });
      });
    }
  });
}
