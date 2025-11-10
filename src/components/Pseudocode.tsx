import React, { createContext, useContext, useState, ReactNode } from 'react';

// Context to track which variable is currently hovered
interface PseudocodeContextType {
  hoveredVar: string | null;
  setHoveredVar: (id: string | null) => void;
}

const PseudocodeContext = createContext<PseudocodeContextType>({
  hoveredVar: null,
  setHoveredVar: () => {},
});

// Component for a variable reference in pseudocode
interface VarProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const Var: React.FC<VarProps> = ({ id, children, className = '' }) => {
  const { hoveredVar, setHoveredVar } = useContext(PseudocodeContext);
  const isHighlighted = hoveredVar === id;

  return (
    <span
      className={`pseudocode-var inline-block transition-all duration-150 rounded px-0.5 ${
        isHighlighted ? 'bg-yellow-200 ring-2 ring-yellow-400' : 'hover:bg-yellow-50'
      } ${className}`}
      onMouseEnter={() => setHoveredVar(id)}
      onMouseLeave={() => setHoveredVar(null)}
      data-var-id={id}
    >
      {children}
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
  const [hoveredVar, setHoveredVar] = useState<string | null>(null);

  const colorClasses = {
    blue: 'text-blue-800 border-blue-200',
    green: 'text-green-800 border-green-200',
    teal: 'text-teal-800 border-teal-200',
    amber: 'text-amber-800 border-amber-200',
    purple: 'text-purple-800 border-purple-200',
    indigo: 'text-indigo-800 border-indigo-200',
  };

  return (
    <PseudocodeContext.Provider value={{ hoveredVar, setHoveredVar }}>
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
    </PseudocodeContext.Provider>
  );
};
