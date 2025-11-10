import { useState, useEffect } from 'react';
import type { AlgorithmSummary } from '../algorithms/types';

// Options for controlling hook behavior
export interface UseAlgorithmIterationsOptions {
  jumpToEnd?: boolean;
}

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
 * @param options - Control flags (e.g., jumpToEnd)
 *
 * TIteration must have w and wNew fields because visualization code needs these for drawing trajectories
 */
export function useAlgorithmIterations<TIteration extends { w: number[]; wNew: number[] }>(
  algorithmName: string,
  runAlgorithm: () => AlgorithmRunResult<TIteration>,
  dependencies: any[],
  options?: UseAlgorithmIterationsOptions
) {
  const [iterations, setIterations] = useState<TIteration[]>([]);
  const [currentIter, setCurrentIter] = useState(0);
  const [summary, setSummary] = useState<AlgorithmSummary | null>(null);

  useEffect(() => {
    try {
      // Preserve current position as percentage (unless jumpToEnd is set)
      // Example: If at iteration 10/50 (20%), and algorithm now produces 30 iterations,
      // we want to be at iteration 6 (20% of 30)
      const oldPercentage = iterations.length > 0 && !options?.jumpToEnd
        ? currentIter / Math.max(1, iterations.length - 1)
        : 0;

      const result = runAlgorithm();
      setIterations(result.iterations);
      setSummary(result.summary);

      // Restore position at same percentage or jump to end
      const newIter = result.iterations.length > 0
        ? (options?.jumpToEnd
            ? result.iterations.length - 1
            : Math.min(result.iterations.length - 1, Math.round(oldPercentage * Math.max(0, result.iterations.length - 1))))
        : 0;
      setCurrentIter(newIter);
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
  }, [...dependencies, options?.jumpToEnd]);

  const resetIter = () => setCurrentIter(0);

  return {
    iterations,
    currentIter,
    setCurrentIter,
    summary,
    resetIter
  };
}
