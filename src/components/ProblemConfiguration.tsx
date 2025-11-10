import React, { useState } from 'react';
import { InlineMath } from './Math';
import { DataPoint } from '../shared-utils';
import { resolveProblem, getDefaultParameters, getProblemKeyInsights, problemRegistryV2, requiresDataset } from '../problems';
import { getProblemDefaults } from '../utils/problemDefaults';
import { ProblemExplainer } from './ProblemExplainer';
import { SeparatingHyperplaneVariant } from '../types/experiments';
import { getProblemParameters } from '../problems';
import { ParameterControls } from './ParameterControls';

interface ProblemConfigurationProps {
  currentProblem: string;
  onProblemChange: (
    newProblem: string,
    defaults: ReturnType<typeof getProblemDefaults>,
    bounds: { w0: [number, number]; w1: [number, number] }
  ) => void;

  customPoints: DataPoint[];
  onCustomPointsChange: (points: DataPoint[]) => void;
  addPointMode: 0 | 1 | 2;
  onAddPointModeChange: (mode: 0 | 1 | 2) => void;

  // Unified parameter support - ALL parameters go through this
  problemParameters: Record<string, number | string>;
  onProblemParameterChange: (key: string, value: number | string) => void;

  // Data canvas (for logistic regression)
  dataCanvasRef?: React.RefObject<HTMLCanvasElement>;
  onCanvasClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;

  // For toast notifications
  onShowToast: (content: React.ReactNode, type: 'success' | 'error' | 'info') => void;
}

export const ProblemConfiguration: React.FC<ProblemConfigurationProps> = ({
  currentProblem,
  onProblemChange,
  problemParameters,
  onProblemParameterChange,
  customPoints,
  onCustomPointsChange,
  addPointMode,
  onAddPointModeChange,
  dataCanvasRef,
  onCanvasClick,
  onShowToast,
}) => {
  // Extract parameters from unified object with defaults
  const lambda = (problemParameters.lambda as number) ?? 0.0001;
  const bias = (problemParameters.bias as number) ?? 0;
  const separatingHyperplaneVariant = (problemParameters.variant as SeparatingHyperplaneVariant) ?? 'soft-margin';
  const [showProblemExplainer, setShowProblemExplainer] = useState(false);

  // Handle problem selection change
  const handleProblemChange = (newProblem: string) => {
    let problemName = 'Logistic Regression';
    let bounds = { w0: [-3, 3] as [number, number], w1: [-3, 3] as [number, number] };

    // Get problem metadata from registry
    const entry = problemRegistryV2[newProblem];
    if (!requiresDataset(newProblem)) {
      const problem = resolveProblem(newProblem, getDefaultParameters(newProblem));
      problemName = problem.name;
      if (problem.domain) {
        bounds = {
          w0: problem.domain.w0,
          w1: problem.domain.w1,
        };
      }
    } else {
      problemName = entry?.displayName || 'Dataset Problem';
    }

    // Reset variant for problems that support variants (handled by getDefaultParameters)
    // No need to explicitly set variant here - it will be set via the useEffect in UnifiedVisualizer

    // Initialize default parameters for the new problem
    const defaultParams = getDefaultParameters(newProblem);
    Object.entries(defaultParams).forEach(([key, value]) => {
      onProblemParameterChange(key, value);
    });

    const defaults = getProblemDefaults(newProblem);

    onProblemChange(newProblem, defaults, bounds);
    onShowToast(<div>Switched to: <span className="font-semibold">{problemName}</span></div>, 'info');
  };

  // Get contextual tips based on current parameters
  const getContextualTip = (): string | null => {
    if (!requiresDataset(currentProblem)) return null;

    // Tips for lambda (regularization)
    if (lambda > 0.001) {
      return 'Strong regularization - decision boundary will be simpler. Try comparing with lower λ!';
    } else if (lambda < 0.00001) {
      return 'Minimal regularization - model can fit complex patterns. Watch for overfitting!';
    }

    // Tips for data density
    if (customPoints.length > 20) {
      return 'Dense dataset - algorithms have more information. See how convergence changes!';
    } else if (customPoints.length > 0 && customPoints.length <= 5) {
      return 'Sparse additions - interesting to see how a few points can shift the decision boundary!';
    }

    return null;
  };

  const contextualTip = getContextualTip();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6" data-scroll-target="problem">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Problem Configuration</h2>

      {/* Integrated header: Dropdown + Formulation */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-3">
          <label className="text-sm font-medium text-gray-700">Problem:</label>
          <select
            value={currentProblem}
            onChange={(e) => handleProblemChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium"
          >
            <option value="logistic-regression">Logistic Regression</option>
            <option value="quadratic">Quadratic Bowl</option>
            <option value="rosenbrock">Rosenbrock Function</option>
            <option value="non-convex-saddle">Saddle Point</option>
            <option value="himmelblau">Himmelblau's Function</option>
            <option value="three-hump-camel">Three-Hump Camel</option>
            <option value="separating-hyperplane">Separating Hyperplane</option>
          </select>
          <button
            onClick={() => setShowProblemExplainer(true)}
            className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            Learn About Problems
          </button>
        </div>

        {/* Mathematical Formulation */}
        {requiresDataset(currentProblem) ? (
          <div className={`space-y-2 text-gray-800 text-sm p-3 rounded ${
            problemRegistryV2[currentProblem]?.ui?.backgroundColor || 'bg-blue-50'
          }`}>
            {/* Show formula from registry */}
            {(() => {
              const entry = problemRegistryV2[currentProblem];
              const problem = entry?.requiresDataset
                ? resolveProblem(
                    currentProblem,
                    problemParameters,
                    customPoints.length > 0 ? customPoints : [{ x1: 0, x2: 0, y: 1 }]
                  )
                : null;

              if (problem?.objectiveFormula) {
                return (
                  <div>
                    <p className="text-base font-semibold mb-2">Objective:</p>
                    {problem.objectiveFormula}
                  </div>
                );
              }
              return null;
            })()}
            <div>
              <strong>Goal:</strong> Find <InlineMath>w^*</InlineMath> that minimizes <InlineMath>f(w)</InlineMath>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-800 text-sm bg-blue-50 p-3 rounded">
            <div>
              <strong>Objective:</strong>{' '}
              {(() => {
                const problem = resolveProblem(currentProblem, problemParameters);
                return problem.objectiveFormula;
              })()}
            </div>
            <div>
              <strong>Description:</strong>{' '}
              {(() => {
                const problem = resolveProblem(currentProblem, problemParameters);
                return problem.description;
              })()}
            </div>
            <div>
              <strong>Goal:</strong> Find <InlineMath>w^*</InlineMath> that minimizes <InlineMath>f(w)</InlineMath>
            </div>
          </div>
        )}
      </div>

      {/* Parameters section - for dataset-based problems */}
      {requiresDataset(currentProblem) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

          {/* Variant selector - use registry metadata */}
          {(() => {
            const entry = problemRegistryV2[currentProblem];
            if (entry?.variants && entry.variants.length > 0) {
              return (
                <div className="mb-4 flex gap-4 items-center">
                  <div className="w-64">
                    <label className="block font-medium text-gray-700 mb-2">Variant:</label>
                    <select
                      value={separatingHyperplaneVariant}
                      onChange={(e) =>
                        onProblemParameterChange('variant', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                    >
                      {entry.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-900">
                      Different objective functions lead to different separating hyperplanes.
                      Try switching variants to see how the optimization behavior changes!
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex gap-6">
            {/* JUSTIFIED SPECIAL CASE: Data canvas rendering
                Dataset problems (logistic regression, separating hyperplane) need interactive point editing UI.
                This is acknowledged in the migration plan as a UI-only special case.
                See: docs/plans/2025-11-10-dataset-problems-registry-migration.md */}
            {/* Data Space Canvas */}
            <div className="flex-1">
              <canvas
                ref={dataCanvasRef}
                style={{ width: '500px', height: '400px', cursor: addPointMode ? 'crosshair' : 'default' }}
                className="border border-gray-300 rounded"
                onClick={onCanvasClick}
              />
              <p className="text-xs text-gray-500 mt-2">
                {addPointMode > 0
                  ? `Click to add ${addPointMode === 1 ? 'Class 0 (red)' : 'Class 1 (blue)'} points`
                  : 'Data space - shows decision boundary from current weights (green line appears when algorithm runs)'}
              </p>
            </div>

            {/* Controls Sidebar */}
            <div className="w-64 space-y-4">
              {/* Lambda slider - use registry metadata */}
              {(() => {
                const entry = problemRegistryV2[currentProblem];
                const lambdaParam = entry?.parameters.find(p => p.key === 'lambda');
                if (lambdaParam && lambdaParam.type === 'range') {
                  return (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        {lambdaParam.label || 'Regularization'} (<InlineMath>\lambda</InlineMath>)
                      </h4>
                      <input
                        type="range"
                        min={lambdaParam.min}
                        max={lambdaParam.max}
                        step={lambdaParam.step}
                        value={lambda}
                        onChange={(e) => onProblemParameterChange('lambda', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{lambdaParam.min}</span>
                        <span className="font-semibold">{lambda.toFixed(4)}</span>
                        <span>{lambdaParam.max}</span>
                      </div>
                      {lambdaParam.description && (
                        <p className="text-xs text-gray-500 mt-1">{lambdaParam.description}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Bias slider - use registry metadata */}
              {(() => {
                const entry = problemRegistryV2[currentProblem];
                const biasParam = entry?.parameters.find(p => p.key === 'bias');
                if (biasParam && biasParam.type === 'range') {
                  return (
                    <div className="mt-3">
                      <h4 className="font-medium text-gray-700 mb-2">
                        {biasParam.label || 'Bias'} (<InlineMath>b</InlineMath>)
                      </h4>
                      <input
                        type="range"
                        min={biasParam.min}
                        max={biasParam.max}
                        step={biasParam.step}
                        value={bias}
                        onChange={(e) => onProblemParameterChange('bias', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{biasParam.min}</span>
                        <span className="font-semibold">{bias.toFixed(1)}</span>
                        <span>{biasParam.max}</span>
                      </div>
                      {biasParam.description && (
                        <p className="text-xs text-gray-500 mt-1">{biasParam.description}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Dataset Editing</h4>
                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() => onAddPointModeChange(addPointMode === 1 ? 0 : 1)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      addPointMode === 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {addPointMode === 1 ? '✓' : '+'} Class 0
                  </button>
                  <button
                    onClick={() => onAddPointModeChange(addPointMode === 2 ? 0 : 2)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      addPointMode === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {addPointMode === 2 ? '✓' : '+'} Class 1
                  </button>
                  {customPoints.length > 0 && (
                    <button
                      onClick={() => onCustomPointsChange([])}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                    >
                      Clear ({customPoints.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Contextual Tips */}
              {contextualTip && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-900">
                    <strong>💡 Explore:</strong> {contextualTip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parameters section - auto-generated from registry */}
      {!requiresDataset(currentProblem) && (
        <ParameterControls
          parameters={getProblemParameters(currentProblem)}
          values={problemParameters}
          onChange={onProblemParameterChange}
        />
      )}

      {/* Key Insights from registry */}
      {getProblemKeyInsights(currentProblem) && (
        <>{getProblemKeyInsights(currentProblem)}</>
      )}

      {/* Problem Explainer Modal */}
      {showProblemExplainer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowProblemExplainer(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Problem Types</h2>
              <button
                onClick={() => setShowProblemExplainer(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <ProblemExplainer />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
