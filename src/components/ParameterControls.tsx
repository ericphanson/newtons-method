import React from 'react';
import { InlineMath } from './Math';
import { ParameterMetadata } from '../types/experiments';

interface ParameterControlsProps {
  parameters: ParameterMetadata[];
  values: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  parameters,
  values,
  onChange,
}) => {
  if (parameters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

      {parameters.map((param) => {
        const value = values[param.key] ?? param.default;

        return (
          <div key={param.key} className="mb-4">
            <div className="flex gap-4">
              <div className="w-64">
                <h4 className="font-medium text-gray-700 mb-2">
                  {param.label} {param.unit && `(${param.unit})`}
                </h4>

                {param.type === 'range' && (
                  <>
                    <input
                      type="range"
                      min={param.scale === 'log10' ? Math.log10(param.min!) : param.min}
                      max={param.scale === 'log10' ? Math.log10(param.max!) : param.max}
                      step={param.step}
                      value={param.scale === 'log10' ? Math.log10(value as number) : value}
                      onChange={(e) => {
                        const rawValue = parseFloat(e.target.value);
                        const actualValue = param.scale === 'log10'
                          ? Math.pow(10, rawValue)
                          : rawValue;
                        onChange(param.key, actualValue);
                      }}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">
                      {param.key === 'rotationAngle' && <InlineMath>\theta</InlineMath>}
                      {param.key === 'conditionNumber' && <InlineMath>\kappa</InlineMath>}
                      {param.key === 'rosenbrockB' && <InlineMath>b</InlineMath>}
                      {' = '}
                      {typeof value === 'number'
                        ? (param.scale === 'log10' ? value.toFixed(0) : value)
                        : value}
                      {param.unit}
                    </span>
                  </>
                )}

                {param.type === 'select' && (
                  <select
                    value={value}
                    onChange={(e) => onChange(param.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  >
                    {param.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {param.description && (
                <div className="flex-1 p-3 bg-blue-100 rounded-lg self-center">
                  <p className="text-xs text-blue-900">{param.description}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
