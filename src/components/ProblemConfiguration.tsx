import React, { useState } from 'react';
import { InlineMath } from './Math';
import { DataPoint } from '../shared-utils';
import { getProblem } from '../problems';
import { getProblemDefaults } from '../utils/problemDefaults';
import { ProblemExplainer } from './ProblemExplainer';
import { SeparatingHyperplaneVariant } from '../types/experiments';

interface ProblemConfigurationProps {
  currentProblem: string;
  onProblemChange: (
    newProblem: string,
    defaults: ReturnType<typeof getProblemDefaults>,
    bounds: { w0: [number, number]; w1: [number, number] }
  ) => void;

  // Logistic regression parameters
  lambda: number;
  onLambdaChange: (lambda: number) => void;
  customPoints: DataPoint[];
  onCustomPointsChange: (points: DataPoint[]) => void;
  addPointMode: 0 | 1 | 2;
  onAddPointModeChange: (mode: 0 | 1 | 2) => void;

  // Rotated quadratic parameters
  rotationAngle: number;
  onRotationAngleChange: (theta: number) => void;

  // Ill-conditioned quadratic parameters
  conditionNumber: number;
  onConditionNumberChange: (kappa: number) => void;

  // Rosenbrock parameters
  rosenbrockB: number;
  onRosenbrockBChange: (b: number) => void;

  // Separating hyperplane parameters
  separatingHyperplaneVariant?: SeparatingHyperplaneVariant;
  onSeparatingHyperplaneVariantChange?: (variant: SeparatingHyperplaneVariant) => void;

  // Data canvas (for logistic regression)
  dataCanvasRef?: React.RefObject<HTMLCanvasElement>;
  onCanvasClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;

  // For toast notifications
  onShowToast: (content: React.ReactNode, type: 'success' | 'error' | 'info') => void;
}

export const ProblemConfiguration: React.FC<ProblemConfigurationProps> = ({
  currentProblem,
  onProblemChange,
  lambda,
  onLambdaChange,
  rotationAngle,
  onRotationAngleChange,
  conditionNumber,
  onConditionNumberChange,
  rosenbrockB,
  onRosenbrockBChange,
  separatingHyperplaneVariant,
  onSeparatingHyperplaneVariantChange,
  customPoints,
  onCustomPointsChange,
  addPointMode,
  onAddPointModeChange,
  dataCanvasRef,
  onCanvasClick,
  onShowToast,
}) => {
  const [showProblemExplainer, setShowProblemExplainer] = useState(false);

  // Handle problem selection change
  const handleProblemChange = (newProblem: string) => {
    let problemName = 'Logistic Regression';
    let bounds = { w0: [-3, 3] as [number, number], w1: [-3, 3] as [number, number] };

    if (newProblem !== 'logistic-regression') {
      const problem = getProblem(newProblem);
      if (problem) {
        problemName = problem.name;
        if (problem.domain) {
          bounds = {
            w0: problem.domain.w0,
            w1: problem.domain.w1,
          };
        }
      }
    }

    // Reset separating hyperplane variant
    if (newProblem === 'separating-hyperplane') {
      onSeparatingHyperplaneVariantChange?.('soft-margin');
    }

    const defaults = newProblem !== 'logistic-regression' ? getProblemDefaults(newProblem) : getProblemDefaults('logistic-regression');

    onProblemChange(newProblem, defaults, bounds);
    onShowToast(<div>Switched to: <span className="font-semibold">{problemName}</span></div>, 'info');
  };

  // Get contextual tips based on current parameters
  const getContextualTip = (): string | null => {
    if (currentProblem !== 'logistic-regression' && currentProblem !== 'separating-hyperplane') return null;

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
            <option value="ill-conditioned-quadratic">Ill-Conditioned Quadratic</option>
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
        {currentProblem === 'logistic-regression' ? (
          <div className="space-y-2 text-gray-800 text-sm bg-purple-50 p-3 rounded">
            <div>
              <strong>Model:</strong>{' '}
              <InlineMath>P(y=1|x) = \sigma(w_0 \cdot x_1 + w_1 \cdot x_2 + w_2)</InlineMath>
            </div>
            <div>
              <strong>Loss:</strong>{' '}
              <InlineMath>{String.raw`f(w) = -\frac{1}{N} \sum [y \log(\sigma(w^T x)) + (1-y) \log(1-\sigma(w^T x))] + \frac{\lambda}{2}(w_0^2 + w_1^2)`}</InlineMath>
            </div>
            <div>
              <strong>Goal:</strong> Find <InlineMath>w^*</InlineMath> that minimizes <InlineMath>f(w)</InlineMath>
            </div>
          </div>
        ) : currentProblem === 'separating-hyperplane' ? (
          <div className="space-y-2 text-gray-800 text-sm bg-green-50 p-3 rounded">
            <div className="mb-2 pb-2 border-b border-green-200">
              <strong>Variables:</strong>{' '}
              <InlineMath>w = [w_0, w_1, w_2]</InlineMath> (weights + bias),{' '}
              <InlineMath>x = [x_1, x_2]</InlineMath> (data point),{' '}
              <InlineMath>{'y \\in \\{-1, +1\\}'}</InlineMath> (class label),{' '}
              <InlineMath>z = w_0 x_1 + w_1 x_2 + w_2</InlineMath> (decision value)
            </div>
            {separatingHyperplaneVariant === 'soft-margin' && (
              <div>
                <strong>Soft-Margin:</strong> min <InlineMath>{String.raw`\frac{1}{2}\|w\|^2 + \lambda \sum \max(0, 1-y_i z_i)`}</InlineMath>
                <br />
                <small>Hinge loss allows misclassifications with adjustable penalty λ</small>
              </div>
            )}
            {separatingHyperplaneVariant === 'perceptron' && (
              <div>
                <strong>Perceptron:</strong> min <InlineMath>{String.raw`\sum \max(0, -y_i z_i) + \frac{\lambda}{2} \|w\|^2`}</InlineMath>
                <br />
                <small>Penalizes only misclassified points with adjustable regularization λ</small>
              </div>
            )}
            {separatingHyperplaneVariant === 'squared-hinge' && (
              <div>
                <strong>Squared-Hinge:</strong> min <InlineMath>{String.raw`\frac{1}{2}\|w\|^2 + \lambda \sum [\max(0, 1-y_i z_i)]^2`}</InlineMath>
                <br />
                <small>Smooth variant with adjustable quadratic penalty λ, twice differentiable</small>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-gray-800 text-sm bg-blue-50 p-3 rounded">
            <div>
              <strong>Objective:</strong>{' '}
              {currentProblem === 'quadratic' && (
                <InlineMath>{String.raw`f(w) = \frac{1}{2}w^T R(\theta) \begin{bmatrix} 5 & 0 \\ 0 & 1 \end{bmatrix} R(\theta)^T w`}</InlineMath>
              )}
              {currentProblem === 'ill-conditioned-quadratic' && (
                <InlineMath>{String.raw`f(w) = \frac{1}{2}(\kappa w_0^2 + w_1^2)`}</InlineMath>
              )}
              {currentProblem === 'rosenbrock' && (
                <InlineMath>{String.raw`f(w) = (1-w_0)^2 + b(w_1-w_0^2)^2`}</InlineMath>
              )}
              {currentProblem === 'non-convex-saddle' && (
                <InlineMath>{String.raw`f(w) = w_0^2 - w_1^2`}</InlineMath>
              )}
              {currentProblem === 'himmelblau' && (
                <InlineMath>{String.raw`f(w) = (w_0^2 + w_1 - 11)^2 + (w_0 + w_1^2 - 7)^2`}</InlineMath>
              )}
              {currentProblem === 'three-hump-camel' && (
                <InlineMath>{String.raw`f(w) = 2w_0^2 - 1.05w_0^4 + \frac{w_0^6}{6} + w_0 w_1 + w_1^2`}</InlineMath>
              )}
            </div>
            <div>
              <strong>Description:</strong> {getProblem(currentProblem)?.description || 'Optimization problem'}
            </div>
            <div>
              <strong>Goal:</strong> Find <InlineMath>w^*</InlineMath> that minimizes <InlineMath>f(w)</InlineMath>
            </div>
          </div>
        )}
      </div>

      {/* Parameters section - for dataset-based problems */}
      {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>

          {/* Variant selector for separating hyperplane */}
          {currentProblem === 'separating-hyperplane' && (
            <div className="mb-4 flex gap-4 items-center">
              <div className="w-64">
                <label className="block font-medium text-gray-700 mb-2">Variant:</label>
                <select
                  value={separatingHyperplaneVariant}
                  onChange={(e) =>
                    onSeparatingHyperplaneVariantChange?.(e.target.value as SeparatingHyperplaneVariant)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                >
                  <option value="soft-margin">Soft-Margin SVM</option>
                  <option value="perceptron">Perceptron</option>
                  <option value="squared-hinge">Squared-Hinge</option>
                </select>
              </div>
              <div className="flex-1 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-900">
                  Different objective functions lead to different separating hyperplanes.
                  Try switching variants to see how the optimization behavior changes!
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-6">
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
              {(currentProblem === 'logistic-regression' || currentProblem === 'separating-hyperplane') && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Regularization (<InlineMath>\lambda</InlineMath>)
                  </h4>
                  <input
                    type="range"
                    min="-6"
                    max="-2"
                    step="0.1"
                    value={Math.log10(lambda)}
                    onChange={(e) => onLambdaChange(Math.pow(10, parseFloat(e.target.value)))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">
                    <InlineMath>\lambda</InlineMath> = {lambda.toExponential(1)}
                  </span>
                </div>
              )}

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

      {/* Parameters for rotated ellipse */}
      {currentProblem === 'quadratic' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>
          <div className="flex gap-4">
            <div className="w-64">
              <h4 className="font-medium text-gray-700 mb-2">
                Rotation Angle (<InlineMath>\theta</InlineMath>)
              </h4>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={rotationAngle}
                onChange={(e) => onRotationAngleChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">
                <InlineMath>\theta</InlineMath> = {rotationAngle}°
              </span>
            </div>
            <div className="flex-1 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-900 font-semibold mb-1">
                💡 Key Insight: Rotation Invariance
              </p>
              <p className="text-xs text-blue-900">
                <strong><InlineMath>\theta=0°</InlineMath>:</strong> Ellipse aligned with axes. Gradient descent follows axes efficiently.<br/>
                <strong><InlineMath>\theta=45°</InlineMath>:</strong> Maximum misalignment! GD zigzags badly, while Newton/L-BFGS are unaffected.<br/>
                <strong>Second-order methods are rotation-invariant</strong> — they adapt to any coordinate system.
                First-order methods depend on your choice of coordinates!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parameters for ill-conditioned quadratic */}
      {currentProblem === 'ill-conditioned-quadratic' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>
          <div className="flex gap-4">
            <div className="w-64">
              <h4 className="font-medium text-gray-700 mb-2">
                Condition Number (<InlineMath>\kappa</InlineMath>)
              </h4>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={Math.log10(conditionNumber)}
                onChange={(e) => onConditionNumberChange(Math.pow(10, parseFloat(e.target.value)))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">
                <InlineMath>\kappa</InlineMath> = {conditionNumber.toFixed(conditionNumber < 10 ? 1 : 0)}
              </span>
            </div>
            <div className="flex-1 p-3 bg-blue-100 rounded-lg self-center">
              <p className="text-xs text-blue-900">
                Higher <InlineMath>\kappa</InlineMath> creates more elongated ellipses, making optimization harder.
                <InlineMath>\kappa=1</InlineMath> is perfectly round (well-conditioned), <InlineMath>\kappa=1000</InlineMath> is very elongated (ill-conditioned).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parameters for Rosenbrock */}
      {currentProblem === 'rosenbrock' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Parameters</h3>
          <div className="flex gap-4">
            <div className="w-64">
              <h4 className="font-medium text-gray-700 mb-2">
                Valley Steepness (<InlineMath>b</InlineMath>)
              </h4>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={Math.log10(rosenbrockB)}
                onChange={(e) => onRosenbrockBChange(Math.pow(10, parseFloat(e.target.value)))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">
                <InlineMath>b</InlineMath> = {rosenbrockB.toFixed(rosenbrockB < 100 ? 0 : 0)}
              </span>
            </div>
            <div className="flex-1 p-3 bg-blue-100 rounded-lg self-center">
              <p className="text-xs text-blue-900">
                Higher <InlineMath>b</InlineMath> creates steeper, narrower valleys.
                <InlineMath>b=10</InlineMath> is gentle (GD can navigate), <InlineMath>b=1000</InlineMath> is extreme (first-order methods struggle).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info for Saddle Point */}
      {currentProblem === 'non-convex-saddle' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Key Insights</h3>
          <div className="p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-900 font-semibold mb-1">
              💡 Saddle Points: Where Gradient Descent Can Get Stuck
            </p>
            <p className="text-xs text-blue-900">
              <strong>At origin (0,0):</strong> Gradient is zero, but it's NOT a minimum! It's a saddle point—a minimum in <InlineMath>w_0</InlineMath> direction, maximum in <InlineMath>w_1</InlineMath> direction.<br/>
              <strong>First-order methods:</strong> Can get stuck at saddle points since <InlineMath>\nabla f=0</InlineMath>. They need careful initialization or momentum to escape.<br/>
              <strong>Second-order methods:</strong> Use curvature information (Hessian) to detect saddle points. Negative eigenvalues reveal "escape directions" away from the saddle.
            </p>
          </div>
        </div>
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
