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
  margins?: { left: number; right: number; top: number; bottom: number };
}

export function drawContours(options: ContourOptions): void {
  const {
    ctx,
    values,
    bounds,
    canvasWidth,
    canvasHeight,
    numLevels = 15,
    margins = { left: 60, right: 20, top: 20, bottom: 60 }
  } = options;

  // Flatten 2D array to 1D array (d3-contour expects 1D)
  const flatValues = values.flat();

  // Check for NaN/Infinity values (algorithm divergence)
  if (flatValues.some(v => !isFinite(v))) {
    console.warn('Contour drawing skipped: NaN/Infinity values detected in loss grid');
    return;
  }

  const minValue = options.minValue ?? Math.min(...flatValues);
  const maxValue = options.maxValue ?? Math.max(...flatValues);
  const valueRange = maxValue - minValue;

  if (valueRange === 0) return; // Flat surface, no contours

  const resolution = values.length;
  const { minW0, maxW0, minW1, maxW1 } = bounds;
  const w0Range = maxW0 - minW0;
  const w1Range = maxW1 - minW1;

  // Calculate plot area dimensions
  const plotWidth = canvasWidth - margins.left - margins.right;
  const plotHeight = canvasHeight - margins.top - margins.bottom;

  // Create contour generator with exponential spacing for more detail near minimum
  // Using t^2.5 gives more contours near low values (minimum) and fewer at high values
  const contourGenerator = contours()
    .size([resolution, resolution])
    .smooth(true)
    .thresholds(range(numLevels).map(i => {
      const t = (i + 1) / (numLevels + 1); // Linear 0 to 1
      const exponential = Math.pow(t, 2.5); // Concentrate near 0
      return minValue + exponential * valueRange;
    }));

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

            // Convert to canvas coordinates (within plot area)
            const canvasX = margins.left + ((w0 - minW0) / w0Range) * plotWidth;
            const canvasY = margins.top + ((maxW1 - w1) / w1Range) * plotHeight;

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

/**
 * Draw a star marker (filled or hollow) at a specific point
 */
export function drawStarMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  filled: boolean,
  color: string = '#FFD700'
): void {
  const outerRadius = size;
  const innerRadius = size * 0.4;
  const numPoints = 5;

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();

  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw optimum markers (global minimum or critical points) on contour plot
 */
interface OptimumMarkerOptions {
  ctx: CanvasRenderingContext2D;
  globalMinimum?: [number, number];
  criticalPoint?: [number, number];
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  canvasWidth: number;
  canvasHeight: number;
  markerSize?: number;
  margins?: { left: number; right: number; top: number; bottom: number };
}

export function drawOptimumMarkers(options: OptimumMarkerOptions): void {
  const {
    ctx,
    globalMinimum,
    criticalPoint,
    bounds,
    canvasWidth,
    canvasHeight,
    markerSize = 12,
    margins = { left: 60, right: 20, top: 20, bottom: 60 }
  } = options;
  const { minW0, maxW0, minW1, maxW1 } = bounds;
  const w0Range = maxW0 - minW0;
  const w1Range = maxW1 - minW1;

  // Calculate plot area dimensions
  const plotWidth = canvasWidth - margins.left - margins.right;
  const plotHeight = canvasHeight - margins.top - margins.bottom;

  // Helper to convert parameter space to canvas coordinates (within plot area)
  const toCanvasX = (w0: number) => margins.left + ((w0 - minW0) / w0Range) * plotWidth;
  const toCanvasY = (w1: number) => margins.top + ((maxW1 - w1) / w1Range) * plotHeight;

  // Draw global minimum (filled star)
  if (globalMinimum) {
    const x = toCanvasX(globalMinimum[0]);
    const y = toCanvasY(globalMinimum[1]);
    drawStarMarker(ctx, x, y, markerSize, true, '#FFD700');
  }

  // Draw critical point (hollow star)
  if (criticalPoint) {
    const x = toCanvasX(criticalPoint[0]);
    const y = toCanvasY(criticalPoint[1]);
    drawStarMarker(ctx, x, y, markerSize, false, '#FFD700');
  }
}

/**
 * Calculate nice tick values for an axis
 */
function calculateNiceTicks(min: number, max: number, targetCount: number = 5): number[] {
  const range = max - min;
  const roughStep = range / (targetCount - 1);

  // Round to nice numbers (1, 2, 5) * 10^n
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) niceStep = 1 * magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  // Generate ticks
  const ticks: number[] = [];
  const firstTick = Math.ceil(min / niceStep) * niceStep;

  for (let tick = firstTick; tick <= max; tick += niceStep) {
    ticks.push(tick);
  }

  return ticks;
}

/**
 * Draw axes with ticks and labels for contour plot
 */
interface AxisOptions {
  ctx: CanvasRenderingContext2D;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
  canvasWidth: number;
  canvasHeight: number;
  margins?: { left: number; right: number; top: number; bottom: number };
  fontSize?: number;
  tickLength?: number;
}

export function drawAxes(options: AxisOptions): void {
  const {
    ctx,
    bounds,
    canvasWidth,
    canvasHeight,
    margins = { left: 60, right: 20, top: 20, bottom: 60 },
    fontSize = 12,
    tickLength = 6
  } = options;

  const { minW0, maxW0, minW1, maxW1 } = bounds;
  const w0Range = maxW0 - minW0;
  const w1Range = maxW1 - minW1;

  const plotWidth = canvasWidth - margins.left - margins.right;
  const plotHeight = canvasHeight - margins.top - margins.bottom;

  // Helper functions to convert from data space to plot space
  const toPlotX = (w0: number) => margins.left + ((w0 - minW0) / w0Range) * plotWidth;
  const toPlotY = (w1: number) => margins.top + ((maxW1 - w1) / w1Range) * plotHeight;

  ctx.save();
  ctx.strokeStyle = '#374151';
  ctx.fillStyle = '#374151';
  ctx.lineWidth = 1.5;
  ctx.font = `${fontSize}px sans-serif`;

  // Draw bottom axis (w0)
  const w0Ticks = calculateNiceTicks(minW0, maxW0, 6);
  ctx.beginPath();
  ctx.moveTo(margins.left, canvasHeight - margins.bottom);
  ctx.lineTo(canvasWidth - margins.right, canvasHeight - margins.bottom);
  ctx.stroke();

  // Draw w0 ticks and labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  w0Ticks.forEach(tick => {
    const x = toPlotX(tick);
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(x, canvasHeight - margins.bottom);
    ctx.lineTo(x, canvasHeight - margins.bottom + tickLength);
    ctx.stroke();
    // Label
    const label = Math.abs(tick) < 0.01 ? tick.toExponential(1) : tick.toFixed(2);
    ctx.fillText(label, x, canvasHeight - margins.bottom + tickLength + 4);
  });

  // Draw w0 axis label
  ctx.font = `${fontSize + 2}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('w₀', canvasWidth / 2, canvasHeight - margins.bottom + tickLength + 4 + fontSize + 2);

  // Draw left axis (w1)
  ctx.font = `${fontSize}px sans-serif`;
  const w1Ticks = calculateNiceTicks(minW1, maxW1, 6);
  ctx.beginPath();
  ctx.moveTo(margins.left, margins.top);
  ctx.lineTo(margins.left, canvasHeight - margins.bottom);
  ctx.stroke();

  // Draw w1 ticks and labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  w1Ticks.forEach(tick => {
    const y = toPlotY(tick);
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(margins.left - tickLength, y);
    ctx.lineTo(margins.left, y);
    ctx.stroke();
    // Label
    const label = Math.abs(tick) < 0.01 ? tick.toExponential(1) : tick.toFixed(2);
    ctx.fillText(label, margins.left - tickLength - 4, y);
  });

  // Draw w1 axis label
  ctx.font = `${fontSize + 2}px sans-serif`;
  ctx.save();
  ctx.translate(14, canvasHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('w₁', 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Get plot area bounds accounting for axes margins
 */
export function getPlotArea(
  canvasWidth: number,
  canvasHeight: number,
  margins: { left: number; right: number; top: number; bottom: number } =
    { left: 60, right: 20, top: 20, bottom: 60 }
): { x: number; y: number; width: number; height: number } {
  return {
    x: margins.left,
    y: margins.top,
    width: canvasWidth - margins.left - margins.right,
    height: canvasHeight - margins.top - margins.bottom
  };
}
