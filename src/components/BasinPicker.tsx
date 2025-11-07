import React, { useRef, useEffect, useState } from 'react';
import { BasinData, BasinCacheKey, ColorEncoding } from '../types/basin';
import { ProblemFunctions } from '../algorithms/types';
import { BasinCache } from '../utils/basinCache';
import { computeBasinIncremental } from '../utils/basinComputation';
import { encodeBasinColors } from '../utils/basinColorEncoding';

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
      // Check cache first
      const cached = basinCache.get(cacheKey);
      if (cached) {
        setBasinData(cached.data);
        setIsComputing(false);
        return;
      }

      // Start new computation
      setIsComputing(true);
      setProgress(0);
      const taskId = ++taskIdRef.current;

      const result = await computeBasinIncremental(
        problemFuncs,
        algorithm,
        algorithmParams,
        bounds,
        50, // resolution
        taskIdRef,
        taskId,
        (completed, total) => {
          setProgress(Math.floor((completed / total) * 100));
        }
      );

      if (result) {
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
    bounds.maxW1
  ]);

  // TODO: Add rendering logic
  // TODO: Add click handling

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
      />

      {isComputing && (
        <div className="text-xs text-gray-500 mt-1">
          Computing basin... {progress}%
        </div>
      )}
    </div>
  );
};
