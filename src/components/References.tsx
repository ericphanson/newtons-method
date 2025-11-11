import React from 'react';
import { citations, getReference, formatReference, getCitationNumber } from '../utils/citations';
import { renderTextWithMath } from '../utils/renderTextWithMath';

interface ReferencesProps {
  usedIn?: string; // Filter by component name (e.g., "GdFixedTab")
}

export const References: React.FC<ReferencesProps> = ({
  usedIn,
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

  // Group citations by reference
  const citationsByReference = React.useMemo(() => {
    const grouped = new Map<string, Array<[string, typeof citations.citations[string]]>>();

    relevantCitations.forEach(([citationKey, citation]) => {
      const refId = citation.reference;
      if (!grouped.has(refId)) {
        grouped.set(refId, []);
      }
      grouped.get(refId)!.push([citationKey, citation]);
    });

    return grouped;
  }, [relevantCitations]);

  if (relevantCitations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8" id="references">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">References</h2>
      <div className="space-y-6 text-sm text-gray-800">
        {Array.from(citationsByReference.entries()).map(([refId, citationEntries]) => {
          const reference = getReference(refId);
          if (!reference) return null;

          const formattedRef = formatReference(reference);

          return (
            <div key={refId} className="border-l-4 border-blue-200 pl-4">
              {/* Reference header */}
              <div className="font-semibold text-gray-900 mb-3">
                {formattedRef}
              </div>

              {/* Citations from this reference */}
              <div className="space-y-4">
                {citationEntries.map(([citationKey, citation]) => {
                  const citationNumber = getCitationNumber(citationKey);

                  return (
                    <div
                      key={citationKey}
                      id={`ref-${citationKey}`}
                      className="ml-2"
                    >
                      <div className="flex gap-3">
                        <span className="font-semibold text-blue-600 flex-shrink-0">
                          [{citationNumber}]
                        </span>
                        <div className="flex-1">
                          {citation.claim && (
                            <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 mb-1">
                              <span className="font-semibold">Our claim:</span> {renderTextWithMath(citation.claim)}
                            </div>
                          )}

                          {citation.quote && (
                            <div className="text-xs text-gray-600 mb-1">
                              <span className="font-semibold">Quote:</span>{' '}
                              <span className="italic border-l-2 border-gray-300 pl-3 block mt-1">
                                "{renderTextWithMath(citation.quote)}"
                              </span>
                              {/* Pages and theorem as attribution after the quote */}
                              {(citation.pages || citation.theorem) && (
                                <div className="text-xs text-gray-500 mt-1 ml-3">
                                  {citation.pages && `Pages ${citation.pages}`}
                                  {citation.theorem && ` (${citation.theorem})`}
                                </div>
                              )}
                            </div>
                          )}

                          {citation.readerNotes && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-semibold">Notes:</span> {renderTextWithMath(citation.readerNotes)}
                            </div>
                          )}

                          {citation.needsReview && (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
                              ⚠️ Pending review
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
