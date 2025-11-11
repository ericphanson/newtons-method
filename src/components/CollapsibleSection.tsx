import React, { useState, useEffect } from 'react';

interface CollapsibleSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultExpanded?: boolean;
  expanded?: boolean;  // Controlled mode: external control of expansion state
  onExpandedChange?: (expanded: boolean) => void;  // Callback for controlled mode
  storageKey?: string;  // For localStorage persistence
  id?: string;  // For hash navigation
  children: React.ReactNode;
}

/**
 * Collapsible content section with optional localStorage persistence
 *
 * Displays a title with expand/collapse toggle. Content can be shown or hidden.
 * If storageKey is provided, remembers user's preference across sessions.
 *
 * Can be used in controlled mode by providing `expanded` and `onExpandedChange` props.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  storageKey,
  id,
  children,
  className,
  ...rest
}) => {
  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  // Use controlled value if provided, otherwise use internal state
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  useEffect(() => {
    // Only persist to localStorage in uncontrolled mode
    if (!isControlled && storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(internalExpanded));
    }
  }, [internalExpanded, storageKey, isControlled]);

  const toggleExpanded = () => {
    const newValue = !isExpanded;

    if (isControlled) {
      // Controlled mode: notify parent
      onExpandedChange?.(newValue);
    } else {
      // Uncontrolled mode: update internal state
      setInternalExpanded(newValue);
    }
  };

  return (
    <div id={id} data-scroll-target={id} className={`mb-4${className ? ` ${className}` : ''}`} {...rest}>
      <button
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={storageKey ? `${storageKey}-content` : undefined}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="text-gray-600 text-xl" aria-hidden="true">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div
          id={storageKey ? `${storageKey}-content` : undefined}
          role="region"
          aria-labelledby={storageKey ? `${storageKey}-button` : undefined}
          className="mt-2 px-4 py-3 bg-white rounded-lg border border-gray-200"
        >
          {children}
        </div>
      )}
    </div>
  );
};
