// src/utils/contourDrawing.ts

import { contours } from 'd3-contour';
import { range } from 'd3-array';

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

/**
 * Draw filled contour bands on canvas (like a topographic map)
 */
export function drawHeatmap(options: ContourOptions): void {
  const {
    ctx,
    values,
    bounds,
    canvasWidth,
    canvasHeight,
    numLevels = 15,
    margins = { left: 60, right: 70, top: 20, bottom: 60 }
  } = options;

  // Flatten 2D array and check for valid values
  const flatValues = values.flat();
  if (flatValues.some(v => !isFinite(v))) {
    console.warn('Filled contours drawing skipped: NaN/Infinity values detected in loss grid');
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

  // Create contour generator with same thresholds as line contours
  const contourGenerator = contours()
    .size([resolution, resolution])
    .smooth(true)
    .thresholds(range(numLevels).map(i => {
      const t = (i + 1) / (numLevels + 1);
      const exponential = Math.pow(t, 2.5);
      return minValue + exponential * valueRange;
    }));

  // Generate contours
  const contourData = contourGenerator(flatValues);

  // Helper function to get color for a contour level (light blue to medium-dark blue)
  const getContourColor = (idx: number) => {
    const normalized = idx / Math.max(1, numLevels - 1);
    // Light blue (low values) to medium-dark blue (high values) - not too dark
    const r = Math.floor(173 - normalized * 103); // 173 -> 70
    const g = Math.floor(216 - normalized * 106); // 216 -> 110
    const b = Math.floor(230 - normalized * 20);   // 230 -> 210
    return { r, g, b };
  };

  // First, fill entire plot area with the lowest color (ensures no white at minimum)
  const lowestColor = getContourColor(0);
  ctx.fillStyle = `rgba(${lowestColor.r},${lowestColor.g},${lowestColor.b},0.5)`;
  ctx.fillRect(margins.left, margins.top, plotWidth, plotHeight);

  // Draw filled contour bands between levels
  for (let idx = 0; idx < contourData.length; idx++) {
    const contour = contourData[idx];
    const color = getContourColor(idx + 1); // Use next color up for the fill
    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.5)`;

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
          ctx.closePath();
          ctx.fill();
        });
      });
    }
  }
}

/**
 * Draw contour lines on a canvas using d3-contour
 */
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

    // Light blue (low) to medium-dark blue (high) gradient
    const r = Math.floor(173 - normalized * 103); // 173 -> 70 (not too dark)
    const g = Math.floor(216 - normalized * 106); // 216 -> 110 (not too dark)
    const b = Math.floor(230 - normalized * 20);   // 230 -> 210 (stays blue)

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
 * Draw a colorbar showing the mapping from colors to loss values
 */
interface ColorbarOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  minValue: number;
  maxValue: number;
  numLevels: number;
  margins?: { left: number; right: number; top: number; bottom: number };
}

export function drawColorbar(options: ColorbarOptions): void {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    minValue,
    maxValue,
    numLevels,
    margins = { left: 60, right: 70, top: 20, bottom: 60 }
  } = options;

  // Colorbar dimensions and position (outside plot area, to the right)
  const barWidth = 20;
  const barHeight = canvasHeight - margins.top - margins.bottom;
  const barX = canvasWidth - margins.right + 10; // Start 10px after the plot area
  const barY = margins.top;

  // Helper function to get color (light blue to medium-dark blue gradient)
  const getContourColor = (idx: number) => {
    const normalized = idx / Math.max(1, numLevels - 1);
    // Light blue (low values) to medium-dark blue (high values) - not too dark
    const r = Math.floor(173 - normalized * 103); // 173 -> 70
    const g = Math.floor(216 - normalized * 106); // 216 -> 110
    const b = Math.floor(230 - normalized * 20);   // 230 -> 210
    return { r, g, b };
  };

  // Draw gradient bar from bottom (low values) to top (high values)
  const segments = 100;
  for (let i = 0; i < segments; i++) {
    const normalizedPos = i / segments; // 0 at bottom, 1 at top
    const colorIdx = normalizedPos * (numLevels - 1);
    const color = getContourColor(colorIdx);

    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    const segmentHeight = barHeight / segments;
    const y = barY + barHeight - (i + 1) * segmentHeight; // Draw from bottom up
    ctx.fillRect(barX, y, barWidth, segmentHeight + 1);
  }

  // Draw border around colorbar
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Draw ticks and labels
  ctx.fillStyle = '#374151';
  ctx.strokeStyle = '#374151';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const numTicks = 5;
  const valueRange = maxValue - minValue;

  for (let i = 0; i < numTicks; i++) {
    const t = i / (numTicks - 1);
    const exponential = Math.pow(t, 2.5); // Same exponential scaling as contours
    const value = minValue + exponential * valueRange;

    // Tick position (from bottom to top)
    const tickY = barY + barHeight - t * barHeight;

    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(barX + barWidth, tickY);
    ctx.lineTo(barX + barWidth + 4, tickY);
    ctx.stroke();

    // Format and draw label
    let label: string;
    if (Math.abs(value) < 0.01 && value !== 0) {
      label = value.toExponential(1);
    } else if (Math.abs(value) >= 1000) {
      label = value.toExponential(1);
    } else {
      label = value.toFixed(2);
    }

    ctx.fillText(label, barX + barWidth + 8, tickY);
  }

  // Draw "Loss" label
  ctx.save();
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Loss', barX + barWidth / 2, barY - 5);
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

/**
 * Draw axes with ticks and labels for data space (x₁, x₂)
 */
interface DataSpaceAxisOptions {
  ctx: CanvasRenderingContext2D;
  bounds: { minX1: number; maxX1: number; minX2: number; maxX2: number };
  canvasWidth: number;
  canvasHeight: number;
  margins?: { left: number; right: number; top: number; bottom: number };
  fontSize?: number;
  tickLength?: number;
}

export function drawDataSpaceAxes(options: DataSpaceAxisOptions): void {
  const {
    ctx,
    bounds,
    canvasWidth,
    canvasHeight,
    margins = { left: 60, right: 20, top: 20, bottom: 60 },
    fontSize = 12,
    tickLength = 6
  } = options;

  const { minX1, maxX1, minX2, maxX2 } = bounds;
  const x1Range = maxX1 - minX1;
  const x2Range = maxX2 - minX2;

  const plotWidth = canvasWidth - margins.left - margins.right;
  const plotHeight = canvasHeight - margins.top - margins.bottom;

  // Helper functions to convert from data space to plot space
  const toPlotX = (x1: number) => margins.left + ((x1 - minX1) / x1Range) * plotWidth;
  const toPlotY = (x2: number) => margins.top + ((maxX2 - x2) / x2Range) * plotHeight;

  ctx.save();
  ctx.strokeStyle = '#374151';
  ctx.fillStyle = '#374151';
  ctx.lineWidth = 1.5;
  ctx.font = `${fontSize}px sans-serif`;

  // Draw bottom axis (x1)
  const x1Ticks = calculateNiceTicks(minX1, maxX1, 6);
  ctx.beginPath();
  ctx.moveTo(margins.left, canvasHeight - margins.bottom);
  ctx.lineTo(canvasWidth - margins.right, canvasHeight - margins.bottom);
  ctx.stroke();

  // Draw x1 ticks and labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  x1Ticks.forEach(tick => {
    const x = toPlotX(tick);
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(x, canvasHeight - margins.bottom);
    ctx.lineTo(x, canvasHeight - margins.bottom + tickLength);
    ctx.stroke();
    // Label
    const label = tick === 0 ? '0.00' : (Math.abs(tick) < 0.01 ? tick.toExponential(1) : tick.toFixed(2));
    ctx.fillText(label, x, canvasHeight - margins.bottom + tickLength + 4);
  });

  // Draw x1 axis label
  ctx.font = `${fontSize + 2}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('x₁', canvasWidth / 2, canvasHeight - margins.bottom + tickLength + 4 + fontSize + 2);

  // Draw left axis (x2)
  ctx.font = `${fontSize}px sans-serif`;
  const x2Ticks = calculateNiceTicks(minX2, maxX2, 6);
  ctx.beginPath();
  ctx.moveTo(margins.left, margins.top);
  ctx.lineTo(margins.left, canvasHeight - margins.bottom);
  ctx.stroke();

  // Draw x2 ticks and labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  x2Ticks.forEach(tick => {
    const y = toPlotY(tick);
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(margins.left - tickLength, y);
    ctx.lineTo(margins.left, y);
    ctx.stroke();
    // Label
    const label = tick === 0 ? '0.00' : (Math.abs(tick) < 0.01 ? tick.toExponential(1) : tick.toFixed(2));
    ctx.fillText(label, margins.left - tickLength - 4, y);
  });

  // Draw x2 axis label
  ctx.font = `${fontSize + 2}px sans-serif`;
  ctx.save();
  ctx.translate(14, canvasHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('x₂', 0, 0);
  ctx.restore();

  ctx.restore();
}
