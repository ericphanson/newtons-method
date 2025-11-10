import React from 'react';
import { getGlossaryEntry, type GlossaryTermKey } from '../lib/glossary';

interface GlossaryTooltipProps {
  /**
   * Key of the term in the glossary registry
   * This ensures consistent definitions across the app
   */
  termKey: GlossaryTermKey;
}

/**
 * Inline glossary tooltip component with centralized definitions
 *
 * Displays a term with an underline decoration. On hover, shows a tooltip
 * with the term's mathematical definition from the global glossary registry.
 * This ensures consistent terminology across the entire educational interface.
 *
 * Example:
 * ```tsx
 * <GlossaryTooltip termKey="smooth" />
 * <GlossaryTooltip termKey="strongly-convex" />
 * ```
 *
 * All available terms are defined in src/lib/glossary.tsx
 */
export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ termKey }) => {
  const { term, definition } = getGlossaryEntry(termKey);
  return (
    <span className="relative group inline-block">
      <span className="underline decoration-dotted decoration-gray-400 cursor-help">
        {term}
      </span>
      <span
        role="tooltip"
        className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                   bg-gray-800 text-white text-xs rounded-lg p-3 w-72 z-10
                   shadow-lg border border-gray-700
                   after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2
                   after:border-4 after:border-transparent after:border-t-gray-800"
      >
        {definition}
      </span>
    </span>
  );
};
