import React from 'react';
import { InlineMath } from './Math';

interface AlgorithmConfigurationProps {
  algorithm: 'gd-fixed' | 'gd-linesearch' | 'newton' | 'lbfgs';

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
  newtonHessianDamping?: number;
  onNewtonHessianDampingChange?: (val: number) => void;
  newtonTolerance?: number;
  onNewtonToleranceChange?: (val: number) => void;

  lbfgsC1?: number;
  onLbfgsC1Change?: (val: number) => void;
  lbfgsM?: number;
  onLbfgsMChange?: (val: number) => void;
  lbfgsTolerance?: number;
  onLbfgsToleranceChange?: (val: number) => void;
}

export const AlgorithmConfiguration: React.FC<AlgorithmConfigurationProps> = (props) => {
  const { algorithm } = props;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Algorithm Configuration</h2>

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

            {/* Tolerance */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tolerance:</label>
                <input
                  type="range"
                  min="-10"
                  max="-1"
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

        {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') && (
          <>
            {/* Armijo c1 */}
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
                      : algorithm === 'newton'
                      ? (props.newtonC1 ?? 1e-4)
                      : (props.lbfgsC1 ?? 1e-4)
                  )}
                  onChange={(e) => {
                    const val = Math.pow(10, parseFloat(e.target.value));
                    if (algorithm === 'gd-linesearch') props.onGdLSC1Change?.(val);
                    else if (algorithm === 'newton') props.onNewtonC1Change?.(val);
                    else props.onLbfgsC1Change?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {algorithm === 'gd-linesearch'
                    ? props.gdLSC1?.toExponential(1)
                    : algorithm === 'newton'
                    ? props.newtonC1?.toExponential(1)
                    : props.lbfgsC1?.toExponential(1)}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Line search parameter (smaller = stricter decrease requirement)
              </p>
            </div>

            {/* Tolerance */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tolerance:</label>
                <input
                  type="range"
                  min="-10"
                  max="-1"
                  step="0.1"
                  value={Math.log10(
                    algorithm === 'gd-linesearch'
                      ? (props.gdLSTolerance ?? 1e-6)
                      : algorithm === 'newton'
                      ? (props.newtonTolerance ?? 1e-6)
                      : (props.lbfgsTolerance ?? 1e-6)
                  )}
                  onChange={(e) => {
                    const val = Math.pow(10, parseFloat(e.target.value));
                    if (algorithm === 'gd-linesearch') props.onGdLSToleranceChange?.(val);
                    else if (algorithm === 'newton') props.onNewtonToleranceChange?.(val);
                    else props.onLbfgsToleranceChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {algorithm === 'gd-linesearch'
                    ? (props.gdLSTolerance ?? 1e-6)?.toExponential(1)
                    : algorithm === 'newton'
                    ? (props.newtonTolerance ?? 1e-6)?.toExponential(1)
                    : (props.lbfgsTolerance ?? 1e-6)?.toExponential(1)}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {algorithm === 'newton' && (
          <>
            {/* Hessian Damping */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Hessian Damping <InlineMath>{'\\lambda_{\\text{damp}}'}</InlineMath>:
                </label>
                <input
                  type="range"
                  min={Math.log10(1e-10)}
                  max={Math.log10(1)}
                  step="0.01"
                  value={Math.log10(props.newtonHessianDamping ?? 0.01)}
                  onChange={(e) => {
                    const val = Math.pow(10, parseFloat(e.target.value));
                    props.onNewtonHessianDampingChange?.(val);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-16 text-right">
                  {props.newtonHessianDamping?.toExponential(1)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Regularization for numerical stability (~0 to 1.0, logarithmic scale)
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Tip:</span> Use ~0 for pure Newton, 0.01 for stability (default), 0.1+ for very ill-conditioned problems
                </p>
              </div>
            </div>
          </>
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
          </>
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

        {/* Initial Point (all algorithms) */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Initial Point:</label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-8">
                <InlineMath>w_0</InlineMath>:
              </span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={props.initialW0}
                onChange={(e) => props.onInitialW0Change(Number(e.target.value))}
                className="flex-1"
              />
              <div className="text-sm text-gray-600 w-12 text-right">{props.initialW0.toFixed(1)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-8">
                <InlineMath>w_1</InlineMath>:
              </span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={props.initialW1}
                onChange={(e) => props.onInitialW1Change(Number(e.target.value))}
                className="flex-1"
              />
              <div className="text-sm text-gray-600 w-12 text-right">{props.initialW1.toFixed(1)}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Starting position in parameter space</p>
        </div>
      </div>
    </div>
  );
};
