import React from 'react';
import { InlineMath } from './Math';
import { BasinPicker } from './BasinPicker';
import { ProblemFunctions } from '../algorithms/types';

interface AlgorithmConfigurationProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'diagonal-precond' | 'newton' | 'lbfgs';

  // Shared parameters
  maxIter: number;
  onMaxIterChange: (val: number) => void;
  initialW0: number;
  onInitialW0Change: (val: number) => void;
  initialW1: number;
  onInitialW1Change: (val: number) => void;

  // Algorithm-specific parameters
  gdFixedAlpha?: number;
  onGdFixedAlphaChange?: (val: number) => void;
  gdFixedTolerance?: number;
  onGdFixedToleranceChange?: (val: number) => void;

  gdLSC1?: number;
  onGdLSC1Change?: (val: number) => void;
  gdLSTolerance?: number;
  onGdLSToleranceChange?: (val: number) => void;

  newtonC1?: number;
  onNewtonC1Change?: (val: number) => void;
  newtonLineSearch?: 'armijo' | 'none';
  onNewtonLineSearchChange?: (val: 'armijo' | 'none') => void;
  newtonHessianDamping?: number;
  onNewtonHessianDampingChange?: (val: number) => void;
  newtonTolerance?: number;
  onNewtonToleranceChange?: (val: number) => void;
  newtonFtol?: number;
  onNewtonFtolChange?: (val: number) => void;
  newtonXtol?: number;
  onNewtonXtolChange?: (val: number) => void;

  lbfgsC1?: number;
  onLbfgsC1Change?: (val: number) => void;
  lbfgsM?: number;
  onLbfgsMChange?: (val: number) => void;
  lbfgsHessianDamping?: number;
  onLbfgsHessianDampingChange?: (val: number) => void;
  lbfgsTolerance?: number;
  onLbfgsToleranceChange?: (val: number) => void;

  diagPrecondLineSearch?: 'armijo' | 'none';
  onDiagPrecondLineSearchChange?: (val: 'armijo' | 'none') => void;
  diagPrecondC1?: number;
  onDiagPrecondC1Change?: (val: number) => void;
  diagPrecondHessianDamping?: number;
  onDiagPrecondHessianDampingChange?: (val: number) => void;
  diagPrecondTolerance?: number;
  onDiagPrecondToleranceChange?: (val: number) => void;
  diagPrecondFtol?: number;
  onDiagPrecondFtolChange?: (val: number) => void;
  diagPrecondXtol?: number;
  onDiagPrecondXtolChange?: (val: number) => void;

  // For basin picker
  problemFuncs: ProblemFunctions;
  problem: Record<string, unknown>;
  currentProblem?: string; // Name of current problem (e.g., 'logistic-regression', 'separating-hyperplane')
  bounds: { minW0: number; maxW0: number; minW1: number; maxW1: number };
}

export const AlgorithmConfiguration: React.FC<AlgorithmConfigurationProps> = (props) => {
  const { algorithm } = props;

  return (
    <div className="grid grid-cols-2 gap-6">
        {/* Algorithm-specific parameters */}
        {algorithm === 'gd-fixed' && (
          <>
            {/* Step Size */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Step Size <InlineMath>\alpha</InlineMath>:
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="1"
                  step="0.001"
                  value={props.gdFixedAlpha}
                  onChange={(e) => props.onGdFixedAlphaChange?.(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">{props.gdFixedAlpha?.toFixed(3)}</div>
              </div>
              <p className="text-xs text-gray-500">
                Learning rate (constant for all iterations)
              </p>
            </div>

            {/* Gradient Tolerance (gtol) */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Gradient Tolerance (gtol):</label>
                <input
                  type="range"
                  min="-12"
                  max="-2"
                  step="0.1"
                  value={Math.log10(props.gdFixedTolerance ?? 1e-6)}
                  onChange={(e) => {
                    const val = Math.pow(10, parseFloat(e.target.value));
                    props.onGdFixedToleranceChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">{props.gdFixedTolerance?.toExponential(1)}</div>
              </div>
              <p className="text-xs text-gray-500">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {/* Armijo c1 - only shown when line search is enabled (not for Newton, it has its own) */}
        {(algorithm === 'gd-linesearch' || algorithm === 'lbfgs') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Armijo c<sub>1</sub>:
              </label>
              <input
                type="range"
                min="-5"
                max="-1"
                step="0.1"
                value={Math.log10(
                  algorithm === 'gd-linesearch'
                    ? (props.gdLSC1 ?? 1e-4)
                    : (props.lbfgsC1 ?? 1e-4)
                )}
                onChange={(e) => {
                  const val = Math.pow(10, parseFloat(e.target.value));
                  if (algorithm === 'gd-linesearch') props.onGdLSC1Change?.(val);
                  else props.onLbfgsC1Change?.(val);
                }}
                className="flex-1"
              />
              <div className="text-sm text-gray-600 w-16 text-right">
                {algorithm === 'gd-linesearch'
                  ? props.gdLSC1?.toExponential(1)
                  : props.lbfgsC1?.toExponential(1)}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Line search parameter (smaller = stricter decrease requirement)
            </p>
          </div>
        )}

        {/* Gradient Tolerance (gtol) - shown for gd-linesearch and lbfgs (Newton has its own below) */}
        {(algorithm === 'gd-linesearch' || algorithm === 'lbfgs') && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Gradient Tolerance (gtol):</label>
              <input
                type="range"
                min="-12"
                max="-2"
                step="0.1"
                value={Math.log10(
                  algorithm === 'gd-linesearch'
                    ? (props.gdLSTolerance ?? 1e-6)
                    : (props.lbfgsTolerance ?? 1e-6)
                )}
                onChange={(e) => {
                  const val = Math.pow(10, parseFloat(e.target.value));
                  if (algorithm === 'gd-linesearch') props.onGdLSToleranceChange?.(val);
                  else props.onLbfgsToleranceChange?.(val);
                }}
                className="flex-1"
              />
              <div className="text-sm text-gray-600 w-16 text-right">
                {algorithm === 'gd-linesearch'
                  ? (props.gdLSTolerance ?? 1e-6)?.toExponential(1)
                  : (props.lbfgsTolerance ?? 1e-6)?.toExponential(1)}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Convergence threshold for gradient norm
            </p>
          </div>
        )}

        {algorithm === 'newton' && (
          <div className="col-span-2 space-y-4">
            {/* Line Search and c1 in same row */}
            <div className="flex gap-4">
              {/* Line Search */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Line Search:</label>
                  <select
                    value={props.newtonLineSearch ?? 'armijo'}
                    onChange={(e) => props.onNewtonLineSearchChange?.(e.target.value as 'armijo' | 'none')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="armijo">Armijo</option>
                    <option value="none">None (full step)</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Armijo backtracking vs full Newton step (α=1)
                </p>
              </div>

              {/* Armijo c1 */}
              {(props.newtonLineSearch === 'armijo') && (
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Armijo c<sub>1</sub>:
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="-1"
                    step="0.1"
                    value={Math.log10(props.newtonC1 ?? 1e-4)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onNewtonC1Change?.(val);
                    }}

                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {props.newtonC1?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Line search parameter
                </p>
              </div>)}
            </div>

            {/* Three tolerances in one row */}
            <div className="flex gap-4">
              {/* Gradient Tolerance (gtol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">gtol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-2"
                    step="0.1"
                    value={Math.log10(props.newtonTolerance ?? 1e-6)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onNewtonToleranceChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.newtonTolerance ?? 1e-6)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Gradient tolerance
                </p>
              </div>

              {/* Function Tolerance (ftol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">ftol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-4"
                    step="0.1"
                    value={Math.log10(props.newtonFtol ?? 2.22e-9)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onNewtonFtolChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.newtonFtol ?? 2.22e-9)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Function tolerance
                </p>
              </div>

              {/* Step Tolerance (xtol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">xtol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-4"
                    step="0.1"
                    value={Math.log10(props.newtonXtol ?? 1e-5)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onNewtonXtolChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.newtonXtol ?? 1e-5)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Avg absolute step/dim (scipy-style)
                </p>
              </div>
            </div>

            {/* Hessian Damping */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Hessian Damping <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>:
                </label>
                <input
                  type="range"
                  min={-11}
                  max={Math.log10(1)}
                  step="0.01"
                  value={props.newtonHessianDamping === 0 ? -11 : Math.log10(props.newtonHessianDamping ?? 0)}
                  onChange={(e) => {
                    const sliderVal = parseFloat(e.target.value);
                    const val = sliderVal <= -10.99 ? 0 : Math.pow(10, sliderVal);
                    props.onNewtonHessianDampingChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {props.newtonHessianDamping === 0 ? '0' : props.newtonHessianDamping?.toExponential(1)}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Regularization for numerical stability (0 to 1.0, logarithmic scale)
              </p>
            </div>
          </div>
        )}

        {algorithm === 'lbfgs' && (
          <>
            {/* Memory M */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Memory M:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={props.lbfgsM}
                  onChange={(e) => props.onLbfgsMChange?.(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">{props.lbfgsM}</div>
              </div>
              <p className="text-xs text-gray-500">
                Number of (s, y) pairs to store for curvature approximation
              </p>
            </div>

            {/* Hessian Damping */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Hessian Damping <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>:
                </label>
                <input
                  type="range"
                  min={-11}
                  max={Math.log10(1)}
                  step="0.01"
                  value={props.lbfgsHessianDamping === 0 ? -11 : Math.log10(props.lbfgsHessianDamping ?? 0)}
                  onChange={(e) => {
                    const sliderVal = parseFloat(e.target.value);
                    const val = sliderVal <= -10.99 ? 0 : Math.pow(10, sliderVal);
                    props.onLbfgsHessianDampingChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {props.lbfgsHessianDamping === 0 ? '0' : props.lbfgsHessianDamping?.toExponential(1)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Regularization for numerical stability (0 to 1.0, logarithmic scale)
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Tip:</span> Use 0 for pure L-BFGS (default), 0.01 for stability, 0.1+ for very ill-conditioned problems
                </p>
              </div>
            </div>
          </>
        )}

        {algorithm === 'diagonal-precond' && (
          <div className="col-span-2 space-y-4">
              {/* Line Search and c1 in same row */}
            <div className="flex gap-4">
              {/* Line Search */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Line Search:</label>
                  <select
                    value={props.diagPrecondLineSearch ?? 'armijo'}
                    onChange={(e) => props.onDiagPrecondLineSearchChange?.(e.target.value as 'armijo' | 'none')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="armijo">Armijo</option>
                    <option value="none">None (full step)</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Armijo backtracking vs full step (α=1)
                </p>
              </div>

              {/* Armijo c1 */}
              {(props.diagPrecondLineSearch === 'armijo') && (
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Armijo c<sub>1</sub>:
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="-1"
                    step="0.1"
                    value={Math.log10(props.diagPrecondC1 ?? 1e-4)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onDiagPrecondC1Change?.(val);
                    }}

                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {props.diagPrecondC1?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Line search parameter
                </p>
              </div>)}
            </div>

            <div>
            </div>

            {/* Three tolerances in one row */}
            <div className="flex gap-4">
              {/* Gradient Tolerance (gtol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">gtol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-2"
                    step="0.1"
                    value={Math.log10(props.diagPrecondTolerance ?? 1e-6)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onDiagPrecondToleranceChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.diagPrecondTolerance ?? 1e-6)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Gradient tolerance
                </p>
              </div>

              {/* Function Tolerance (ftol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">ftol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-4"
                    step="0.1"
                    value={Math.log10(props.diagPrecondFtol ?? 2.22e-9)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onDiagPrecondFtolChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.diagPrecondFtol ?? 2.22e-9)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Function tolerance
                </p>
              </div>

              {/* Step Tolerance (xtol) */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">xtol:</label>
                  <input
                    type="range"
                    min="-12"
                    max="-4"
                    step="0.1"
                    value={Math.log10(props.diagPrecondXtol ?? 1e-5)}
                    onChange={(e) => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      props.onDiagPrecondXtolChange?.(val);
                    }}
                    className="flex-1"
                  />
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {(props.diagPrecondXtol ?? 1e-5)?.toExponential(1)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Avg absolute step/dim (scipy-style)
                </p>
              </div>
            </div>


            {/* Hessian Damping */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Hessian Damping <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>:
                </label>
                <input
                  type="range"
                  min={-11}
                  max={Math.log10(1)}
                  step="0.01"
                  value={props.diagPrecondHessianDamping === 0 ? -11 : Math.log10(props.diagPrecondHessianDamping ?? 0)}
                  onChange={(e) => {
                    const sliderVal = parseFloat(e.target.value);
                    const val = sliderVal <= -10.99 ? 0 : Math.pow(10, sliderVal);
                    props.onDiagPrecondHessianDampingChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {props.diagPrecondHessianDamping === 0 ? '0' : props.diagPrecondHessianDamping?.toExponential(1)}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Regularization for numerical stability (0 to 1.0, logarithmic scale)
              </p>
            </div>
          </div>
        )}

        {/* Max Iterations (all algorithms) */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Max Iterations:</label>
            <input
              type="range"
              min="1"
              max="400"
              step="1"
              value={props.maxIter}
              onChange={(e) => props.onMaxIterChange(Number(e.target.value))}
              className="flex-1"
            />
            <div className="text-sm text-gray-600 w-16 text-right">{props.maxIter}</div>
          </div>
          <p className="text-xs text-gray-500">Maximum iterations before stopping</p>
        </div>

        {/* Basin Picker (replaces sliders) */}
        <div className="col-span-2" data-scroll-target="basin-of-convergence">
          <BasinPicker
            problem={props.problem}
            currentProblem={props.currentProblem}
            algorithm={algorithm}
            algorithmParams={{
              maxIter: props.maxIter,
              // GD Fixed step size
              alpha: props.gdFixedAlpha,
              // Line search c1 parameter (algorithm-specific)
              c1: algorithm === 'gd-linesearch'
                ? props.gdLSC1
                : algorithm === 'newton'
                ? props.newtonC1
                : algorithm === 'lbfgs'
                ? props.lbfgsC1
                : algorithm === 'diagonal-precond'
                ? props.diagPrecondC1
                : undefined,
              // Diagonal preconditioner specific
              diagPrecondLineSearch: algorithm === 'diagonal-precond' ? props.diagPrecondLineSearch : undefined,
              // L-BFGS memory parameter
              m: props.lbfgsM,
              // Hessian damping (algorithm-specific)
              hessianDamping: algorithm === 'newton'
                ? props.newtonHessianDamping
                : algorithm === 'lbfgs'
                ? props.lbfgsHessianDamping
                : algorithm === 'diagonal-precond'
                ? props.diagPrecondHessianDamping
                : undefined,
              // Newton line search method
              newtonLineSearch: props.newtonLineSearch,
              // Tolerance (algorithm-specific)
              tolerance: algorithm === 'gd-fixed'
                ? props.gdFixedTolerance
                : algorithm === 'gd-linesearch'
                ? props.gdLSTolerance
                : algorithm === 'newton'
                ? props.newtonTolerance
                : algorithm === 'diagonal-precond'
                ? props.diagPrecondTolerance
                : props.lbfgsTolerance,
              termination: {
                gtol:
                  algorithm === 'newton'
                    ? props.newtonTolerance
                    : algorithm === 'diagonal-precond'
                    ? props.diagPrecondTolerance
                    : undefined,
                ftol:
                  algorithm === 'newton'
                    ? props.newtonFtol
                    : algorithm === 'diagonal-precond'
                    ? props.diagPrecondFtol
                    : undefined,
                xtol:
                  algorithm === 'newton'
                    ? props.newtonXtol
                    : algorithm === 'diagonal-precond'
                    ? props.diagPrecondXtol
                    : undefined
              }
            }}
            problemFuncs={props.problemFuncs}
            initialPoint={[props.initialW0, props.initialW1]}
            onInitialPointChange={(point) => {
              props.onInitialW0Change(point[0]);
              props.onInitialW1Change(point[1]);
            }}
            bounds={props.bounds}
          />
        </div>
      </div>
  );
};
