import React, { createContext, useContext, useState, ReactNode } from 'react';

// Context to track which variable is currently hovered
interface PseudocodeContextType {
  hoveredVar: string | null;
  setHoveredVar: (id: string | null) => void;
}

export const PseudocodeContext = createContext<PseudocodeContextType>({
  hoveredVar: null,
  setHoveredVar: () => {},
});

// Component for a variable reference in pseudocode
interface VarProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Type annotation to show on hover (e.g., "vector ℝᵈ", "scalar", "d×d matrix") */
  type?: string;
}

export const Var: React.FC<VarProps> = ({ id, children, className = '', type }) => {
  const { hoveredVar, setHoveredVar } = useContext(PseudocodeContext);
  const isHighlighted = hoveredVar === id;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className={`pseudocode-var relative inline-block transition-all duration-150 rounded px-0.5 ${
        isHighlighted ? 'bg-yellow-200 ring-2 ring-yellow-400' : 'hover:bg-yellow-50'
      } ${className}`}
      onMouseEnter={() => {
        setHoveredVar(id);
        if (type) setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setHoveredVar(null);
        setShowTooltip(false);
      }}
      data-var-id={id}
    >
      {children}
      {type && showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
          {type}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></span>
        </span>
      )}
    </span>
  );
};

// Component for complexity annotations
interface ComplexityProps {
  children: ReactNode;
  /** Additional explanation to show on hover */
  explanation?: string;
}

export const Complexity: React.FC<ComplexityProps> = ({ children, explanation }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <span
      className={`relative inline-block ml-1 text-xs font-mono text-gray-500 ${explanation ? 'cursor-help' : ''}`}
      onMouseEnter={() => explanation && setShowExplanation(true)}
      onMouseLeave={() => setShowExplanation(false)}
    >
      [{children}]
      {explanation && showExplanation && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none w-max max-w-xs">
          {explanation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></span>
        </span>
      )}
    </span>
  );
};

// Interface for variable declarations
interface VariableDeclaration {
  id: string;
  display: ReactNode;
  description?: string;
}

interface PseudocodeProps {
  inputs?: VariableDeclaration[];
  outputs?: VariableDeclaration[];
  steps: ReactNode[];
  className?: string;
  color?: 'blue' | 'green' | 'teal' | 'amber' | 'purple' | 'indigo';
}

export const Pseudocode: React.FC<PseudocodeProps> = ({
  inputs = [],
  outputs = [],
  steps,
  className = '',
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'text-blue-800 border-blue-200',
    green: 'text-green-800 border-green-200',
    teal: 'text-teal-800 border-teal-200',
    amber: 'text-amber-800 border-amber-200',
    purple: 'text-purple-800 border-purple-200',
    indigo: 'text-indigo-800 border-indigo-200',
  };

  return (
    <div className={`pseudocode-container ${className}`}>
      <h3 className={`text-lg font-bold ${colorClasses[color].split(' ')[0]} mb-3`}>
        Algorithm
      </h3>

      <div className={`border-l-4 ${colorClasses[color].split(' ')[1]} pl-4 space-y-3`}>
        {/* Inputs section */}
        {inputs.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Input:</div>
            <div className="ml-4 space-y-0.5">
              {inputs.map((input, idx) => (
                <div key={idx} className="text-sm">
                  <Var id={input.id}>{input.display}</Var>
                  {input.description && (
                    <span className="text-gray-600"> — {input.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outputs section */}
        {outputs.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Output:</div>
            <div className="ml-4 space-y-0.5">
              {outputs.map((output, idx) => (
                <div key={idx} className="text-sm">
                  <Var id={output.id}>{output.display}</Var>
                  {output.description && (
                    <span className="text-gray-600"> — {output.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Algorithm steps */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-1">Steps:</div>
          <ol className="list-decimal ml-8 space-y-1.5">
            {steps.map((step, idx) => (
              <li key={idx} className="text-sm pl-1">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
