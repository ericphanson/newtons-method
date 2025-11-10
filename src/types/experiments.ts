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
  objectiveFormula: React.ReactNode;  // JSX with math rendering
  objective: (w: number[]) => number;
  gradient: (w: number[]) => number[];
  hessian?: (w: number[]) => number[][]; // For Newton
  domain: {
    w0: [number, number];
    w1: [number, number];
  };
  description: React.ReactNode;
  globalMinimum?: [number, number];  // Analytical global minimum (if exists)
  criticalPoint?: [number, number];  // For saddle points or local min/max
}

// Parameter metadata for auto-generating UI controls
export interface ParameterMetadata {
  key: string;                    // Parameter identifier (e.g., 'rotationAngle')
  label: string;                  // Display label (e.g., 'Rotation Angle')
  type: 'range' | 'select';       // UI control type
  min?: number;                   // For range inputs
  max?: number;                   // For range inputs
  step?: number;                  // For range inputs
  default: number | string;       // Default value
  unit?: string;                  // Display unit (e.g., '°', '')
  scale?: 'linear' | 'log10';     // Value scaling for slider
  options?: Array<{value: string | number; label: string}>; // For select inputs
  description?: string;           // Tooltip/help text
}

// Problem state with parameters
export interface ProblemState {
  type: ProblemType;
  parameters: Record<string, number | string>;
}

// Registry entry with factory support
export interface ProblemRegistryEntry {
  // Static instance (for non-parametrized problems)
  defaultInstance?: ProblemDefinition;

  // Factory function (for parametrized problems)
  factory?: (parameters: Record<string, number | string>) => ProblemDefinition;

  // Parameter definitions (empty for non-parametrized)
  parameters: ParameterMetadata[];

  // Problem metadata
  displayName: string;
  category?: 'convex' | 'non-convex' | 'classification';
}
