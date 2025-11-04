import React, { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  storageKey?: string;  // For localStorage persistence
  children: React.ReactNode;
}

/**
 * Collapsible content section with optional localStorage persistence
 *
 * Displays a title with expand/collapse toggle. Content can be shown or hidden.
 * If storageKey is provided, remembers user's preference across sessions.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  storageKey,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-4">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="text-gray-600 text-xl">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 px-4 py-3 bg-white rounded-lg border border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};
