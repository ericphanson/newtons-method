import React from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { citations, getReference, formatReference, getCitationNumber } from '../utils/citations';

interface ReferencesProps {
  usedIn?: string; // Filter by component name (e.g., "GdFixedTab")
  defaultExpanded?: boolean;
  storageKey?: string;
}

export const References: React.FC<ReferencesProps> = ({
  usedIn,
  defaultExpanded = false,
  storageKey = 'references-section',
}) => {
  // Get all citations, optionally filtered by component
  const relevantCitations = React.useMemo(() => {
    const entries = Object.entries(citations.citations);

    if (usedIn) {
      return entries.filter(([, citation]) =>
        citation.usedIn?.includes(usedIn)
      );
    }

    return entries;
  }, [usedIn]);

  if (relevantCitations.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="References"
      defaultExpanded={defaultExpanded}
      storageKey={storageKey}
      id="references"
    >
      <ol className="space-y-4 text-sm text-gray-800">
        {relevantCitations.map(([citationKey, citation]) => {
          const reference = getReference(citation.reference);
          if (!reference) return null;

          const citationNumber = getCitationNumber(citationKey);
          const formattedRef = formatReference(reference);

          return (
            <li
              key={citationKey}
              id={`ref-${citationKey}`}
              className="pl-2"
            >
              <div className="flex gap-3">
                <span className="font-semibold text-blue-600 flex-shrink-0">
                  [{citationNumber}]
                </span>
                <div className="flex-1">
                  <div className="mb-1">{formattedRef}</div>

                  {citation.pages && (
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold">Pages:</span> {citation.pages}
                      {citation.theorem && ` (${citation.theorem})`}
                    </div>
                  )}

                  {citation.claim && (
                    <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 mb-1">
                      <span className="font-semibold">Claim:</span> {citation.claim}
                    </div>
                  )}

                  {citation.quote && (
                    <div className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-3 mb-1">
                      "{citation.quote}"
                    </div>
                  )}

                  {citation.notes && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Notes:</span> {citation.notes}
                    </div>
                  )}

                  {citation.needsReview && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
                      ⚠️ Pending review
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </CollapsibleSection>
  );
};
