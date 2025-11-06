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
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Step Size <InlineMath>\alpha</InlineMath>:
                </label>
              </div>
              <input
                type="range"
                min="0.001"
                max="1"
                step="0.001"
                value={props.gdFixedAlpha}
                onChange={(e) => props.onGdFixedAlphaChange?.(parseFloat(e.target.value))}
                className="w-full mb-2"
              />
              <div className="text-sm text-gray-600">{props.gdFixedAlpha?.toFixed(3)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Learning rate (constant for all iterations)
              </p>
            </div>

            {/* Tolerance */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Tolerance:</label>
              </div>
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
                className="w-full mb-2"
              />
              <div className="text-sm text-gray-600">{props.gdFixedTolerance?.toExponential(1)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {(algorithm === 'gd-linesearch' || algorithm === 'newton' || algorithm === 'lbfgs') && (
          <>
            {/* Armijo c1 */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Armijo c<sub>1</sub>:
                </label>
              </div>
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
                className="w-full mb-2"
              />
              <div className="text-sm text-gray-600">
                {algorithm === 'gd-linesearch'
                  ? props.gdLSC1?.toExponential(1)
                  : algorithm === 'newton'
                  ? props.newtonC1?.toExponential(1)
                  : props.lbfgsC1?.toExponential(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Line search parameter (smaller = stricter decrease requirement)
              </p>
            </div>

            {/* Tolerance */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Tolerance:</label>
              </div>
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
                className="w-full mb-2"
              />
              <div className="text-sm text-gray-600">
                {algorithm === 'gd-linesearch'
                  ? (props.gdLSTolerance ?? 1e-6)?.toExponential(1)
                  : algorithm === 'newton'
                  ? (props.newtonTolerance ?? 1e-6)?.toExponential(1)
                  : (props.lbfgsTolerance ?? 1e-6)?.toExponential(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Convergence threshold for gradient norm
              </p>
            </div>
          </>
        )}

        {algorithm === 'lbfgs' && (
          <>
            {/* Memory M */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Memory M:</label>
              </div>
              <input
                type="number"
                value={props.lbfgsM}
                onChange={(e) => props.onLbfgsMChange?.(Number(e.target.value))}
                min="1"
                max="20"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of (s, y) pairs to store for curvature approximation
              </p>
            </div>
          </>
        )}

        {/* Max Iterations (all algorithms) */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Max Iterations:</label>
          </div>
          <input
            type="number"
            value={props.maxIter}
            onChange={(e) => props.onMaxIterChange(Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum iterations before stopping</p>
        </div>

        {/* Initial Point (all algorithms) */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Initial Point:</label>
          </div>
          <div className="flex gap-2 items-baseline mb-2">
            <span className="text-sm text-gray-600">
              <InlineMath>w_0</InlineMath>:
            </span>
            <input
              type="number"
              value={props.initialW0}
              onChange={(e) => props.onInitialW0Change(Number(e.target.value))}
              step="0.1"
              className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
            />
            <span className="text-sm text-gray-600">
              <InlineMath>w_1</InlineMath>:
            </span>
            <input
              type="number"
              value={props.initialW1}
              onChange={(e) => props.onInitialW1Change(Number(e.target.value))}
              step="0.1"
              className="px-2 py-1 border border-gray-300 rounded w-20 text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">Starting position in parameter space</p>
        </div>
      </div>
    </div>
  );
};
