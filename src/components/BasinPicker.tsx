/**
 * BASIN TIMING DATA ACCESS
 *
 * After basin computation completes, timing data is available in the browser console:
 *
 *   window.basinTiming         // Latest timing data object
 *   window.getBasinTiming()    // Returns formatted JSON string (copy-pasteable)
 *
 * Example:
 *   > window.basinTiming
 *   {
 *     totalTime: 1234.56,
 *     computeTime: 1100.23,
 *     frameCount: 45,
 *     avgFrameTime: 24.45,
 *     rafOverhead: 134.33,
 *     rafOverheadPercent: 10.9,
 *     pointCount: 400,
 *     avgPerPoint: 2.75,
 *     estimatedTotalComputeTime: 1100.00,
 *     resolution: 20,
 *     algorithm: "newton",
 *     timestamp: "2025-11-07T..."
 *   }
 *
 *   > window.getBasinTiming()
 *   Returns pretty-printed JSON string ready to copy/paste
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BasinData } from '../types/basin';
import { ProblemFunctions } from '../algorithms/types';
// CACHE DISABLED FOR DEBUGGING
// import { BasinCacheKey } from '../types/basin';
// import { BasinCache } from '../utils/basinCache';
import { computeBasinIncremental, BasinTimingData } from '../utils/basinComputation';
import { encodeBasinColors } from '../utils/basinColorEncoding';
import { ColorbarLegend } from './ColorbarLegend';
import { clusterConvergenceLocations, assignHuesToClusters } from '../utils/basinClustering';

// Extend window interface to expose timing data and basin data for debugging
declare global {
  interface Window {
    basinTiming?: BasinTimingData;
    getBasinTiming?: () => string;
    basinData?: BasinData | null;
  }
}

interface BasinPickerProps {
  problem: any;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';
  algorithmParams: any;
  problemFuncs: ProblemFunctions;
  initialPoint: [number, number] | [number, number, number];
  onInitialPointChange: (point: [number, number] | [number, number, number]) => void;
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
}

// Global cache instance
// CACHE DISABLED FOR DEBUGGING
// const basinCache = new BasinCache(8);

export const BasinPicker: React.FC<BasinPickerProps> = ({
  problem,
  algorithm,
  algorithmParams,
  problemFuncs,
  initialPoint,
  onInitialPointChange,
  bounds
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskIdRef = useRef(0);
  const [basinData, setBasinData] = useState<BasinData | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Compute cluster hues
  const clusterHues = useMemo(() => {
    if (!basinData) return [];
    const clusterIds = clusterConvergenceLocations(basinData);
    const numClusters = Math.max(...clusterIds) + 1;
    return assignHuesToClusters(numClusters);
  }, [basinData]);

  // Compute iteration range for colorbar
  const iterationRange = useMemo(() => {
    if (!basinData) return { min: 0, max: 0 };
    let minIter = Infinity;
    let maxIter = -Infinity;

    for (const row of basinData.grid) {
      for (const point of row) {
        if (point.converged) {
          minIter = Math.min(minIter, point.iterations);
          maxIter = Math.max(maxIter, point.iterations);
        }
      }
    }

    // Handle case where no points converged
    if (!isFinite(minIter) || !isFinite(maxIter)) {
      return { min: 0, max: 0 };
    }

    return { min: minIter, max: maxIter };
  }, [basinData]);

  // Track page visibility to prevent computation when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // CACHE DISABLED FOR DEBUGGING
  // Build cache key
  // const cacheKey: BasinCacheKey = {
  //   problem: problem.name,
  //   algorithm,
  //   lambda: problem.lambda || 0,
  //   rotationAngle: problem.rotationAngle,
  //   variant: problem.variant
  // };

  // Compute basin when params change
  useEffect(() => {
    const computeBasin = async () => {
      // Don't compute if tab is not visible
      if (!isVisible) {
        console.log('Basin computation skipped - tab not visible');
        return;
      }

      // CACHE DISABLED FOR DEBUGGING
      // Check cache first
      // const cached = basinCache.get(cacheKey);
      // if (cached) {
      //   console.log('🎯 Basin data retrieved from cache');
      //   setBasinData(cached.data);
      //   setIsComputing(false);
      //   return;
      // }
      console.log('⚠️ Cache disabled - computing fresh basin data');

      // Start new computation - clear old basin to avoid showing stale data
      setBasinData(null);
      setIsComputing(true);
      setProgress(0);
      const taskId = ++taskIdRef.current;

      console.group('🚀 Basin Computation Started');
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Resolution: 20x20 = 400 points`);
      console.log(`Algorithm: ${algorithm}`);
      console.log(`Problem: ${problem.name}`);
      console.log(`Bounds:`, bounds);
      console.log(`Algorithm Params:`, algorithmParams);
      console.log(`Problem Functions dimensionality:`, problemFuncs.dimensionality);
      // Log a sample evaluation to see if problem functions work
      const testPoint = [0, 0, algorithmParams.biasSlice || 0];
      const grad = problemFuncs.gradient(testPoint);
      console.log(`Test evaluation at [0,0,${algorithmParams.biasSlice || 0}]:`, {
        loss: problemFuncs.objective(testPoint),
        gradNorm: Math.sqrt(grad.reduce((sum: number, g: number) => sum + g*g, 0))
      });
      console.groupEnd();

      const componentStart = performance.now();

      const result = await computeBasinIncremental(
        problemFuncs,
        algorithm,
        algorithmParams,
        bounds,
        20, // resolution
        taskIdRef,
        taskId,
        (completed, total) => {
          setProgress(Math.floor((completed / total) * 100));
        }
      );

      const componentEnd = performance.now();
      const totalTime = componentEnd - componentStart;

      if (result.data) {
        console.group('✅ Basin Computation Finished');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Total time (including RAF overhead): ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
        console.log(`Expected benchmark time: ~130ms`);
        console.log(`Actual vs expected: ${(totalTime / 130).toFixed(1)}x slower`);
        console.groupEnd();

        // Expose timing data on window for console access
        if (result.timing) {
          window.basinTiming = result.timing;
          window.getBasinTiming = () => JSON.stringify(result.timing, null, 2);

          console.log('💡 Timing data available: window.basinTiming or window.getBasinTiming()');
        }

        // Expose basin data for debugging
        window.basinData = result.data;

        // Log convergence statistics
        if (result.data) {
          let converged = 0, notConverged = 0, diverged = 0;
          result.data.grid.forEach(row => {
            row.forEach(point => {
              if (point.converged) converged++;
              else if (point.diverged) diverged++;
              else notConverged++;
            });
          });
          console.log(`📊 Convergence: ${converged} converged, ${notConverged} not converged, ${diverged} diverged (total: ${converged + notConverged + diverged})`);
        }

        // CACHE DISABLED FOR DEBUGGING
        // Store in cache
        // basinCache.set(cacheKey, {
        //   key: cacheKey,
        //   data: result.data,
        //   timestamp: Date.now()
        // });

        setBasinData(result.data);
        setIsComputing(false);
      }
    };

    computeBasin();
  }, [
    problem.name,
    algorithm,
    problem.lambda,
    problem.rotationAngle,
    problem.variant,
    bounds.minW0,
    bounds.maxW0,
    bounds.minW1,
    bounds.maxW1,
    isVisible,
    // Algorithm parameters that affect basin computation
    algorithmParams.maxIter,
    algorithmParams.alpha,
    algorithmParams.c1,
    algorithmParams.m,
    algorithmParams.hessianDamping,
    algorithmParams.lineSearch,
    algorithmParams.tolerance,
    algorithmParams.lambda,
    algorithmParams.biasSlice
  ]);

  // Render basin when data changes
  useEffect(() => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 320;
    const logicalHeight = 290;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    ctx.scale(dpr, dpr);

    // Margins for axes (in logical pixels)
    const margins = { left: 70, right: 15, top: 15, bottom: 40 };
    const plotWidth = logicalWidth - margins.left - margins.right;
    const plotHeight = logicalHeight - margins.top - margins.bottom;

    // Encode colors
    const colors = encodeBasinColors(basinData);

    // Clear canvas
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Draw basin in the plot area
    const cellWidth = plotWidth / basinData.resolution;
    const cellHeight = plotHeight / basinData.resolution;

    for (let i = 0; i < basinData.resolution; i++) {
      for (let j = 0; j < basinData.resolution; j++) {
        const color = colors[i][j];
        const x = margins.left + j * cellWidth;
        const y = margins.top + i * cellHeight;

        ctx.fillStyle = `hsl(${color.hue}, 70%, ${color.lightness}%)`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }

    // Draw axes with ticks and labels
    const { minW0, maxW0, minW1, maxW1 } = basinData.bounds;

    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';

    // X-axis (bottom)
    ctx.beginPath();
    ctx.moveTo(margins.left, logicalHeight - margins.bottom);
    ctx.lineTo(logicalWidth - margins.right, logicalHeight - margins.bottom);
    ctx.stroke();

    // Y-axis (left)
    ctx.beginPath();
    ctx.moveTo(margins.left, margins.top);
    ctx.lineTo(margins.left, logicalHeight - margins.bottom);
    ctx.stroke();

    // Generate tick positions (5 ticks per axis)
    const numTicks = 5;

    // X-axis ticks and labels
    for (let i = 0; i < numTicks; i++) {
      const fraction = i / (numTicks - 1);
      const xPos = margins.left + fraction * plotWidth;
      const value = minW0 + fraction * (maxW0 - minW0);

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(xPos, logicalHeight - margins.bottom);
      ctx.lineTo(xPos, logicalHeight - margins.bottom + 5);
      ctx.stroke();

      // Label
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(value.toFixed(1), xPos, logicalHeight - margins.bottom + 8);
    }

    // Y-axis ticks and labels
    for (let i = 0; i < numTicks; i++) {
      const fraction = i / (numTicks - 1);
      const yPos = logicalHeight - margins.bottom - fraction * plotHeight;
      const value = minW1 + fraction * (maxW1 - minW1);

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(margins.left - 5, yPos);
      ctx.lineTo(margins.left, yPos);
      ctx.stroke();

      // Label
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toFixed(1), margins.left - 8, yPos);
    }

    // Axis labels
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#1f2937';

    // X-axis label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('w₀', margins.left + plotWidth / 2, logicalHeight - 2);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(28, margins.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('w₁', 0, 0);
    ctx.restore();

    // Draw box around plot area
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(margins.left, margins.top, plotWidth, plotHeight);

    // Draw initial point marker (circle with outline)
    const [w0, w1] = initialPoint;
    const xPos =
      margins.left + ((w0 - minW0) / (maxW0 - minW0)) * plotWidth;
    const yPos =
      margins.top + ((maxW1 - w1) / (maxW1 - minW1)) * plotHeight;

    // Outer circle (white with black outline)
    ctx.beginPath();
    ctx.arc(xPos, yPos, 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(xPos, yPos, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }, [basinData, initialPoint]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Account for margins (in logical pixels)
    const logicalWidth = 320;
    const logicalHeight = 290;
    const margins = { left: 70, right: 15, top: 15, bottom: 40 };
    const plotWidth = logicalWidth - margins.left - margins.right;
    const plotHeight = logicalHeight - margins.top - margins.bottom;

    // Convert to plot coordinates
    const plotX = canvasX - margins.left;
    const plotY = canvasY - margins.top;

    // Only process clicks within the plot area
    if (plotX < 0 || plotX > plotWidth || plotY < 0 || plotY > plotHeight) {
      return;
    }

    const { minW0, maxW0, minW1, maxW1 } = basinData.bounds;

    const w0 = minW0 + (plotX / plotWidth) * (maxW0 - minW0);
    const w1 = maxW1 - (plotY / plotHeight) * (maxW1 - minW1);

    // Handle 3D problems
    if (problemFuncs.dimensionality === 3) {
      onInitialPointChange([w0, w1, algorithmParams.biasSlice || 0]);
    } else {
      onInitialPointChange([w0, w1]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Click to change initial point
      </label>

      <div className="text-xs text-gray-600 mb-1">
        Current: w₀ = {initialPoint[0].toFixed(3)}, w₁ = {initialPoint[1].toFixed(3)}
        {problemFuncs.dimensionality === 3 && `, bias = ${(algorithmParams.biasSlice || 0).toFixed(3)}`}
      </div>

      {problemFuncs.dimensionality === 3 && (
        <div className="text-xs text-gray-500 italic mb-1">
          Viewing slice at bias = {(algorithmParams.biasSlice || 0).toFixed(2)}
        </div>
      )}

      {/* Horizontal layout: canvas with built-in axes and colorbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onClick={handleCanvasClick}
        />

        {/* Colorbar legend to the right */}
        {basinData && (
          <ColorbarLegend
            hues={clusterHues}
            isMultiModal={clusterHues.length > 1}
            iterationRange={iterationRange}
          />
        )}
      </div>

      {isComputing && (
        <div className="text-xs text-gray-500 mt-1">
          Computing basin... {progress}%
        </div>
      )}
    </div>
  );
};
