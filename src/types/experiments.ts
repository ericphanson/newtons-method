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

export type ExperimentTone =
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'teal'
  | 'blue'
  | 'amber'
  | 'gray';

export interface ExperimentUiConfig {
  tone?: ExperimentTone;
  group?: string;
  details?: string;
  footnote?: string;
  hidden?: boolean;
  relatedActions?: Array<{
    label: string;
    targetId: string;
    tone?: ExperimentTone;
  }>;
}

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';
  problem: ProblemType;
  dataset?: DataPoint[];
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant; // For separating-hyperplane problem
  rotationAngle?: number; // For rotated quadratic problems
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
  ui?: ExperimentUiConfig;
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
