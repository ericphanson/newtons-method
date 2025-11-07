import React, { useRef, useEffect } from 'react';

interface ColorbarLegendProps {
  hues: number[];            // Hues for each cluster
  isMultiModal: boolean;     // Multiple clusters?
  iterationRange?: { min: number; max: number };  // Iteration range for colorbar labels
}

export const ColorbarLegend: React.FC<ColorbarLegendProps> = ({ hues, isMultiModal, iterationRange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 100;
    const logicalHeight = isMultiModal ? hues.length * 30 : 115;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    if (isMultiModal) {
      // Draw discrete swatches
      hues.forEach((hue, idx) => {
        const y = idx * 30;
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.fillRect(10, y + 5, 20, 20);

        // Draw border around swatch
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, y + 5, 20, 20);

        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Min ${idx + 1}`, 35, y + 17);
      });
    } else {
      // Draw "iterations" label at top
      const labelHeight = 15;
      const gradientLeft = 10;
      const gradientWidth = 20;

      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('iterations', gradientLeft + gradientWidth / 2, 2);

      // Draw gradient below the label
      const hue = hues[0] || 210;
      const gradientHeight = 100;
      const gradientTop = labelHeight;

      for (let i = 0; i < gradientHeight; i++) {
        const lightness = 80 - (i / gradientHeight) * 50;
        ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
        ctx.fillRect(gradientLeft, gradientTop + i, gradientWidth, 1);
      }

      // Draw border around gradient
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(gradientLeft, gradientTop, gradientWidth, gradientHeight);

      // Draw labels with iteration counts
      ctx.fillStyle = '#000';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';

      if (iterationRange && iterationRange.max > 0) {
        // Show actual iteration counts
        ctx.textBaseline = 'top';
        ctx.fillText(`${iterationRange.min}`, gradientLeft + gradientWidth + 5, gradientTop);

        // Show middle value
        const midIter = Math.round((iterationRange.min + iterationRange.max) / 2);
        ctx.textBaseline = 'middle';
        ctx.fillText(`${midIter}`, gradientLeft + gradientWidth + 5, gradientTop + gradientHeight / 2);

        // Show max value
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${iterationRange.max}`, gradientLeft + gradientWidth + 5, gradientTop + gradientHeight);
      } else {
        // Fallback to Fast/Slow if no data
        ctx.textBaseline = 'top';
        ctx.fillText('Fast', gradientLeft + gradientWidth + 5, gradientTop);
        ctx.textBaseline = 'bottom';
        ctx.fillText('Slow', gradientLeft + gradientWidth + 5, gradientTop + gradientHeight);
      }
    }
  }, [hues, isMultiModal, iterationRange]);

  return (
    <div>
      <canvas
        ref={canvasRef}
      />
    </div>
  );
};
