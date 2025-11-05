export type ProblemType =
  | 'logistic-regression'
  | 'quadratic'
  | 'ill-conditioned-quadratic'
  | 'rosenbrock'
  | 'non-convex-saddle';

export interface DataPoint {
  x: number;
  y: number;
  label: number;
}

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  problem: ProblemType;
  dataset?: DataPoint[];
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number; // for L-BFGS
    maxIter?: number;
  };
  initialPoint?: [number, number];
  expectation: string; // What to observe
}

export interface ProblemDefinition {
  name: string;
  objective: (w: number[]) => number;
  gradient: (w: number[]) => number[];
  hessian?: (w: number[]) => number[][]; // For Newton
  domain: {
    w0: [number, number];
    w1: [number, number];
  };
  description: string;
}
