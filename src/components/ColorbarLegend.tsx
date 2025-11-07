import React, { useRef, useEffect } from 'react';

interface ColorbarLegendProps {
  hues: number[];            // Hues for each cluster
  isMultiModal: boolean;     // Multiple clusters?
}

export const ColorbarLegend: React.FC<ColorbarLegendProps> = ({ hues, isMultiModal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isMultiModal) {
      // Draw discrete swatches
      hues.forEach((hue, idx) => {
        const y = idx * 30;
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.fillRect(0, y, 20, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Min ${idx + 1}`, 25, y + 15);
      });
    } else {
      // Draw gradient
      const hue = hues[0] || 210;
      const height = 100;

      for (let i = 0; i < height; i++) {
        const lightness = 80 - (i / height) * 50;
        ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
        ctx.fillRect(0, i, 20, 1);
      }

      ctx.fillStyle = '#000';
      ctx.font = '11px sans-serif';
      ctx.fillText('Fast', 25, 10);
      ctx.fillText('Slow', 25, height - 5);
    }
  }, [hues, isMultiModal]);

  return (
    <div className="mt-2">
      <canvas
        ref={canvasRef}
        width={80}
        height={isMultiModal ? hues.length * 30 : 100}
        className="border border-gray-200"
      />
    </div>
  );
};
