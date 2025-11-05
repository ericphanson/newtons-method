import { useRef, useEffect } from 'react';
import { setupCanvas } from '../shared-utils';

interface ComparisonCanvasProps {
  leftIterations: any[];
  leftCurrentIter: number;
  leftColor: string;
  rightIterations: any[];
  rightCurrentIter: number;
  rightColor: string;
  width?: number;
  height?: number;
  title: string;
}

/**
 * Canvas component for visualizing comparison of two optimization trajectories
 * Renders both trajectories on a shared coordinate space with adaptive bounds
 */
export function ComparisonCanvas({
  leftIterations,
  leftCurrentIter,
  leftColor,
  rightIterations,
  rightCurrentIter,
  rightColor,
  width = 600,
  height = 400,
  title,
}: ComparisonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, width: w, height: h } = setupCanvas(canvas);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Compute bounds for both trajectories combined
    const allW0: number[] = [];
    const allW1: number[] = [];

    for (let i = 0; i <= leftCurrentIter && i < leftIterations.length; i++) {
      const [w0, w1] = leftIterations[i].wNew;
      allW0.push(w0);
      allW1.push(w1);
    }

    for (let i = 0; i <= rightCurrentIter && i < rightIterations.length; i++) {
      const [w0, w1] = rightIterations[i].wNew;
      allW0.push(w0);
      allW1.push(w1);
    }

    if (allW0.length === 0 || allW1.length === 0) return;

    const minW0 = Math.min(...allW0);
    const maxW0 = Math.max(...allW0);
    const minW1 = Math.min(...allW1);
    const maxW1 = Math.max(...allW1);

    // Add padding to bounds
    const w0Range = maxW0 - minW0;
    const w1Range = maxW1 - minW1;
    const padding = 0.1;
    const paddedMinW0 = minW0 - w0Range * padding;
    const paddedMaxW0 = maxW0 + w0Range * padding;
    const paddedMinW1 = minW1 - w1Range * padding;
    const paddedMaxW1 = maxW1 + w1Range * padding;
    const paddedW0Range = paddedMaxW0 - paddedMinW0;
    const paddedW1Range = paddedMaxW1 - paddedMinW1;

    // Coordinate mapping functions
    const toCanvasX = (w0: number) => ((w0 - paddedMinW0) / paddedW0Range) * w;
    const toCanvasY = (w1: number) => ((paddedMaxW1 - w1) / paddedW1Range) * h;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridLines = 10;
    for (let i = 0; i <= gridLines; i++) {
      // Vertical lines
      const x = (i / gridLines) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      // Horizontal lines
      const y = (i / gridLines) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw axes if they're in view
    const originX = toCanvasX(0);
    const originY = toCanvasY(0);

    if (originX >= 0 && originX <= w) {
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, h);
      ctx.stroke();
    }

    if (originY >= 0 && originY <= h) {
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(w, originY);
      ctx.stroke();
    }

    // Draw left algorithm trajectory
    if (leftIterations.length > 0 && leftCurrentIter >= 0) {
      ctx.strokeStyle = leftColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= leftCurrentIter && i < leftIterations.length; i++) {
        const [w0, w1] = leftIterations[i].wNew;
        const x = toCanvasX(w0);
        const y = toCanvasY(w1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw left current position as larger dot
      if (leftCurrentIter < leftIterations.length) {
        const [w0, w1] = leftIterations[leftCurrentIter].wNew;
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.arc(toCanvasX(w0), toCanvasY(w1), 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw right algorithm trajectory
    if (rightIterations.length > 0 && rightCurrentIter >= 0) {
      ctx.strokeStyle = rightColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= rightCurrentIter && i < rightIterations.length; i++) {
        const [w0, w1] = rightIterations[i].wNew;
        const x = toCanvasX(w0);
        const y = toCanvasY(w1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw right current position as larger dot
      if (rightCurrentIter < rightIterations.length) {
        const [w0, w1] = rightIterations[rightCurrentIter].wNew;
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.arc(toCanvasX(w0), toCanvasY(w1), 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`w₀: [${paddedMinW0.toFixed(1)}, ${paddedMaxW0.toFixed(1)}]`, w / 2, h - 5);

    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`w₁: [${paddedMinW1.toFixed(1)}, ${paddedMaxW1.toFixed(1)}]`, 0, 0);
    ctx.restore();

  }, [leftIterations, leftCurrentIter, rightIterations, rightCurrentIter, leftColor, rightColor, width, height]);

  return (
    <div>
      <h4 className="text-center font-semibold mb-2">{title}</h4>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="border border-gray-300"
      />
    </div>
  );
}
