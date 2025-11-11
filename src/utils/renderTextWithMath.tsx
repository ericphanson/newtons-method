import React from 'react';
import { InlineMath } from '../components/Math';

/**
 * Renders text with inline math expressions using $...$ syntax.
 *
 * Example: "Let $f \in S^{1,1}_{\mu,L}$ be a function"
 * becomes: Let <InlineMath>f \in S^{1,1}_{\mu,L}</InlineMath> be a function
 *
 * @param text - The text containing math expressions with $...$ delimiters
 * @returns Array of React elements (text and InlineMath components)
 */
export function renderTextWithMath(text: string): React.ReactNode {
  // Split by $...$ pattern while keeping the delimiters
  const parts = text.split(/(\$[^$]+\$)/);

  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      // Extract math content (remove $ delimiters)
      const mathContent = part.slice(1, -1);
      return <InlineMath key={i}>{mathContent}</InlineMath>;
    }
    // Regular text
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
