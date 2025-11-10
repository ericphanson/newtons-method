import React from 'react';
import { InlineMath } from './Math';
import { Pseudocode, Var } from './Pseudocode';

interface ArmijoLineSearchProps {
  /** Color theme to match the algorithm */
  color: 'blue' | 'green' | 'teal' | 'amber' | 'purple' | 'indigo';

  /** Description of initial alpha (e.g., "1 (full Newton step)") */
  initialAlpha: string;

  /** Typical number of f-evaluations per iteration (e.g., "1-3") */
  typicalFEvals: string;

  /** The c1 parameter value */
  c1Value: number;

  /** Custom verdict text for cost/benefit analysis */
  verdict: {
    title: string;
    description: string;
  };

  /** Optional custom benefits list */
  benefits?: string[];

  /** Optional additional notes to display */
  additionalNotes?: React.ReactNode;
}

export const ArmijoLineSearch: React.FC<ArmijoLineSearchProps> = ({
  color,
  initialAlpha,
  typicalFEvals,
  c1Value,
  verdict,
  benefits,
  additionalNotes,
}) => {
  const defaultBenefits = [
    'Safety: Prevents bad steps and divergence',
    'Fewer iterations: Good steps mean faster convergence',
    'Robustness: Works across problems without manual tuning',
  ];

  const finalBenefits = benefits || defaultBenefits;

  return (
    <div className="space-y-3">
      {/* Armijo Condition */}
      <div>
        <p className="font-semibold text-sm mb-2">Armijo Condition (Sufficient Decrease):</p>
        <div className="bg-gray-50 rounded p-2">
          <InlineMath>{'f(w + \\alpha p) \\leq f(w) + c_1 \\alpha \\nabla f(w)^T p'}</InlineMath>
        </div>
        <p className="text-sm mt-2">
          Where <InlineMath>c_1 = </InlineMath>{c1Value.toFixed(4)} controls how much decrease we require.
        </p>
      </div>

      {/* Backtracking Algorithm */}
      <div>
        <Pseudocode
          color={color}
          inputs={[
            {
              id: 'p',
              display: <InlineMath>p</InlineMath>,
              description: 'search direction',
            },
            {
              id: 'w',
              display: <InlineMath>w</InlineMath>,
              description: 'current parameters',
            },
            {
              id: 'f_w',
              display: <InlineMath>f(w)</InlineMath>,
              description: 'current loss',
            },
            {
              id: 'grad',
              display: <InlineMath>\nabla f(w)</InlineMath>,
              description: 'current gradient',
            },
          ]}
          outputs={[
            {
              id: 'alpha',
              display: <InlineMath>\alpha</InlineMath>,
              description: 'step size that satisfies Armijo condition',
            },
          ]}
          steps={[
            <>
              Initialize <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> ← {initialAlpha}
            </>,
            <><strong>repeat</strong> until Armijo condition satisfied:</>,
            <>
              <span className="ml-4">
                Evaluate <Var id="f_trial"><InlineMath>{'f(w + \\alpha p)'}</InlineMath></Var>
              </span>
            </>,
            <>
              <span className="ml-4">
                <strong>if</strong> <Var id="f_trial"><InlineMath>{'f(w + \\alpha p)'}</InlineMath></Var> ≤{' '}
                <Var id="f_w"><InlineMath>f(w)</InlineMath></Var> + <InlineMath>{'c_1'}</InlineMath>
                <Var id="alpha"><InlineMath>\alpha</InlineMath></Var>{' '}
                <Var id="grad"><InlineMath>\nabla f(w)</InlineMath></Var>
                <sup>T</sup>
                <Var id="p"><InlineMath>p</InlineMath></Var>:
              </span>
            </>,
            <>
              <span className="ml-8">
                <strong>break</strong> (accept <Var id="alpha"><InlineMath>\alpha</InlineMath></Var>)
              </span>
            </>,
            <>
              <span className="ml-4">
                <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> ← 0.5 ·{' '}
                <Var id="alpha"><InlineMath>\alpha</InlineMath></Var> (reduce step size)
              </span>
            </>,
            <>
              <strong>return</strong> <Var id="alpha"><InlineMath>\alpha</InlineMath></Var>
            </>,
          ]}
        />
      </div>

      {/* Additional notes if provided */}
      {additionalNotes && <div className="text-sm">{additionalNotes}</div>}

      {/* Cost/Benefit Analysis */}
      <div className="bg-green-50 rounded p-3">
        <p className="font-bold text-sm mb-2">Cost/Benefit Analysis: Is Line Search Worth It?</p>
        <div className="text-sm space-y-2">
          <div>
            <p className="font-semibold">Cost per iteration:</p>
            <ul className="list-disc ml-6">
              <li>
                <strong>Additional <InlineMath>f</InlineMath> evaluations:</strong> Typically {typicalFEvals} per
                iteration (backtracking)
              </li>
              <li>
                <strong>Gradient evaluations:</strong> No extra cost! Already computed for the direction
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Benefits:</p>
            <ul className="list-disc ml-6">
              {finalBenefits.map((benefit, idx) => (
                <li key={idx}>{benefit}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded p-2 mt-2">
            <p className="font-semibold">
              Verdict: <span className="text-green-700">{verdict.title}</span>
            </p>
            <p className="text-xs mt-1">{verdict.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
