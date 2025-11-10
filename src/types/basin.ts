/**
 * Types for basin of convergence visualization
 */

export interface BasinPoint {
  convergenceLoc: [number, number];  // Where it converged - 2D: (w0, w1)
  iterations: number;                // Iteration count
  converged: boolean;                // Met convergence criteria (gradient, ftol, xtol)
  diverged: boolean;                 // Hit NaN/Infinity
  stalled: boolean;                  // Converged due to stalling (ftol or xtol)
}

export interface BasinData {
  resolution: number;                // Grid resolution (e.g., 50)
  bounds: {
    minW0: number;
    maxW0: number;
    minW1: number;
    maxW1: number;
  };
  grid: BasinPoint[][];              // [resolution][resolution]
}

export interface BasinCacheKey {
  problem: string;                   // "rosenbrock"
  algorithm: string;                 // "newton"
  lambda: number;                    // Problem regularization
  rotationAngle?: number;            // For rotated problems
  variant?: string;                  // For separating-hyperplane
}

// WARNING: Basin cache currently only supports rotationAngle parameter.
// If conditionNumber or rosenbrockB are used, cached results may be incorrect.
// TODO: Replace rotationAngle with generic problemParameters when basin cache is re-enabled.

export interface BasinCacheEntry {
  key: BasinCacheKey;
  data: BasinData;
  timestamp: number;                 // For LRU eviction
}

export interface ColorEncoding {
  hue: number;                       // 0-360, which basin
  lightness: number;                 // 0-100, convergence speed
}
