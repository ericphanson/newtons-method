import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BasinData, BasinCacheKey } from '../types/basin';
import { ProblemFunctions } from '../algorithms/types';
import { BasinCache } from '../utils/basinCache';
import { computeBasinIncremental } from '../utils/basinComputation';
import { encodeBasinColors } from '../utils/basinColorEncoding';
import { ColorbarLegend } from './ColorbarLegend';
import { clusterConvergenceLocations, assignHuesToClusters } from '../utils/basinClustering';

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
const basinCache = new BasinCache(8);

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

  // Build cache key
  const cacheKey: BasinCacheKey = {
    problem: problem.name,
    algorithm,
    lambda: problem.lambda || 0,
    rotationAngle: problem.rotationAngle,
    variant: problem.variant
  };

  // Compute basin when params change
  useEffect(() => {
    const computeBasin = async () => {
      // Don't compute if tab is not visible
      if (!isVisible) {
        console.log('Basin computation skipped - tab not visible');
        return;
      }

      // Check cache first
      const cached = basinCache.get(cacheKey);
      if (cached) {
        console.log('🎯 Basin data retrieved from cache');
        setBasinData(cached.data);
        setIsComputing(false);
        return;
      }

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

      if (result) {
        console.group('✅ Basin Computation Finished');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Total time (including RAF overhead): ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
        console.log(`Expected benchmark time: ~130ms`);
        console.log(`Actual vs expected: ${(totalTime / 130).toFixed(1)}x slower`);
        console.groupEnd();

        // Store in cache
        basinCache.set(cacheKey, {
          key: cacheKey,
          data: result,
          timestamp: Date.now()
        });

        setBasinData(result);
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
    isVisible
  ]);

  // Render basin when data changes
  useEffect(() => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Encode colors
    const colors = encodeBasinColors(basinData);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw basin
    const cellWidth = canvas.width / basinData.resolution;
    const cellHeight = canvas.height / basinData.resolution;

    for (let i = 0; i < basinData.resolution; i++) {
      for (let j = 0; j < basinData.resolution; j++) {
        const color = colors[i][j];
        const x = j * cellWidth;
        const y = i * cellHeight;

        ctx.fillStyle = `hsl(${color.hue}, 70%, ${color.lightness}%)`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }

    // Draw crosshair
    const [w0, w1] = initialPoint;
    const xPos =
      ((w0 - basinData.bounds.minW0) / (basinData.bounds.maxW0 - basinData.bounds.minW0)) *
      canvas.width;
    const yPos =
      ((basinData.bounds.maxW1 - w1) / (basinData.bounds.maxW1 - basinData.bounds.minW1)) *
      canvas.height;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    const size = 15;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(xPos - size, yPos);
    ctx.lineTo(xPos + size, yPos);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(xPos, yPos - size);
    ctx.lineTo(xPos, yPos + size);
    ctx.stroke();

    // Center dot
    ctx.setLineDash([]);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(xPos, yPos, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, [basinData, initialPoint]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!basinData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const { minW0, maxW0, minW1, maxW1 } = basinData.bounds;

    const w0 = minW0 + (canvasX / canvas.width) * (maxW0 - minW0);
    const w1 = maxW1 - (canvasY / canvas.height) * (maxW1 - minW1);

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

      {problemFuncs.dimensionality === 3 && (
        <div className="text-xs text-gray-500 italic mb-1">
          Slice at bias = {(algorithmParams.biasSlice || 0).toFixed(2)}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="border border-gray-300 cursor-crosshair"
        style={{ width: 250, height: 250 }}
        onClick={handleCanvasClick}
      />

      {basinData && (
        <ColorbarLegend
          hues={clusterHues}
          isMultiModal={clusterHues.length > 1}
        />
      )}

      {isComputing && (
        <div className="text-xs text-gray-500 mt-1">
          Computing basin... {progress}%
        </div>
      )}
    </div>
  );
};
