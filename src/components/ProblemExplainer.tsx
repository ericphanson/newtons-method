import React from 'react';
import { problemRegistryV2, PROBLEM_ORDER } from '../problems/registry';

/**
 * Educational component explaining all available optimization problems
 * Now renders content from the problem registry
 */
export function ProblemExplainer() {
  // Get all problems that have explainer content, using canonical ordering from registry
  const problemsWithExplainers = PROBLEM_ORDER
    .map((key) => ({ key, entry: problemRegistryV2[key] }))
    .filter(({ entry }) => entry?.explainerContent);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900">Problem Types</h2>
      <p className="text-gray-700">
        The visualizer supports 8 different optimization problems. Each demonstrates
        different algorithmic behaviors and challenges.
      </p>

      {/* Render all problem explainers from registry */}
      {problemsWithExplainers.map(({ key, entry }) => (
        <React.Fragment key={key}>
          {entry.explainerContent}
        </React.Fragment>
      ))}

      {/* How to Use section - kept as-is */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">How to Choose a Problem</h3>
        <p className="text-sm text-gray-700 mb-3">
          Use the problem selector (dropdown) that appears above visualizations when you
          load an experiment. Or click experiment buttons that automatically switch problems.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900">For learning basics:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Start with Logistic Regression</li>
              <li>Compare with Separating Hyperplane variants</li>
              <li>Try Rotated Ellipse for rotation invariance</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">For understanding failures:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Ill-Conditioned for scaling issues</li>
              <li>Rosenbrock for varying curvature</li>
              <li>Saddle Point for Newton failures</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">For exploring basins:</p>
            <ul className="text-gray-700 list-disc ml-5">
              <li>Himmelblau for symmetric basin boundaries</li>
              <li>Three-Hump Camel for asymmetric basins</li>
              <li>Use basin visualization to see convergence patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
