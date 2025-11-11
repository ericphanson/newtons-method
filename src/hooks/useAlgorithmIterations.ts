import { useState, useEffect, DependencyList } from 'react';
import type { AlgorithmSummary } from '../algorithms/types';

// Result type returned by algorithm runner functions
// NOTE: This is a NEW type we're defining here, not imported from anywhere
export interface AlgorithmRunResult<TIteration> {
  iterations: TIteration[];
  summary: AlgorithmSummary;
}

/**
 * Custom hook for managing algorithm iterations
 *
 * @param algorithmName - Name for debugging (appears in console.error)
 * @param runAlgorithm - Function that executes the algorithm and returns iterations + summary
 * @param dependencies - Array of values that trigger algorithm re-run when changed
 * @returns Object containing iterations array and summary
 *
 * TIteration must have w and wNew fields because visualization code needs these for drawing trajectories
 *
 * NOTE: Display state (which iteration to show) is managed by the parent component using
 * a universal iteration proportion (0.0 to 1.0) that works across all algorithms.
 */
export function useAlgorithmIterations<TIteration extends { w: number[]; wNew: number[] }>(
  algorithmName: string,
  runAlgorithm: () => AlgorithmRunResult<TIteration>,
  dependencies: DependencyList
) {
  const [iterations, setIterations] = useState<TIteration[]>([]);
  const [summary, setSummary] = useState<AlgorithmSummary | null>(null);

  useEffect(() => {
    try {
      const result = runAlgorithm();
      setIterations(result.iterations);
      setSummary(result.summary);
    } catch (error) {
      console.error(`${algorithmName} error:`, error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      setIterations([]);
      setSummary(null);
    }
    // We disable exhaustive-deps because we deliberately spread the dependencies array parameter.
    // This is safe because the caller provides the full dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return {
    iterations,
    summary
  };
}
