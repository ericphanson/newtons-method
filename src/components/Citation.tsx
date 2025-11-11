import React, { useState } from 'react';
import { getFullCitation, getCitationNumber, formatAuthors } from '../utils/citations';

interface CitationProps {
  citationKey: string;
}

export const Citation: React.FC<CitationProps> = ({ citationKey }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const fullCitation = getFullCitation(citationKey);

  if (!fullCitation) {
    console.warn(`Citation not found: ${citationKey}`);
    return <sup className="text-red-500">[?]</sup>;
  }

  const { citation, reference } = fullCitation;
  const citationNumber = getCitationNumber(citationKey);
  const authorsShort = formatAuthors(reference.authors);

  // Build compact tooltip content
  const tooltipContent = (
    <div className="text-left text-xs">
      {authorsShort} ({reference.year}), <span className="italic">{reference.title}</span>
      {citation.pages && <>, pp. {citation.pages}</>}
      {citation.theorem && <>, {citation.theorem}</>}
    </div>
  );

  return (
    <sup className="relative inline-block">
      <a
        href={`#ref-${citationKey}`}
        className="text-blue-600 hover:text-blue-800 no-underline"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Citation: ${authorsShort} (${reference.year})`}
      >
        [{citationNumber}]
      </a>
      {showTooltip && (
        <div
          className="absolute z-50 bg-gray-900 text-white text-sm rounded-lg shadow-lg px-3 py-2 pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            minWidth: '200px',
            maxWidth: '400px',
          }}
        >
          {tooltipContent}
          <div
            className="absolute bg-gray-900"
            style={{
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1f2937',
            }}
          />
        </div>
      )}
    </sup>
  );
};
