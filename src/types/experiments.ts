export type ProblemType =
  | 'logistic-regression'
  | 'quadratic'
  | 'ill-conditioned-quadratic'
  | 'rosenbrock'
  | 'non-convex-saddle'
  | 'separating-hyperplane'
  | 'himmelblau'
  | 'three-hump-camel';

export type SeparatingHyperplaneVariant =
  | 'soft-margin'
  | 'perceptron'
  | 'squared-hinge';

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
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant; // For separating-hyperplane problem
  hyperparameters: {
    alpha?: number;
    c1?: number;
    lambda?: number;
    m?: number; // for L-BFGS
    maxIter?: number;
    hessianDamping?: number; // for Newton's method and L-BFGS
    lineSearch?: 'armijo' | 'none'; // for Newton's method
  };
  initialPoint?: [number, number] | [number, number, number];
  expectation: string; // What to observe
  comparisonConfig?: {
    left: { algorithm: string; [key: string]: any };
    right: { algorithm: string; [key: string]: any };
  };
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
  globalMinimum?: [number, number];  // Analytical global minimum (if exists)
  criticalPoint?: [number, number];  // For saddle points or local min/max
}
