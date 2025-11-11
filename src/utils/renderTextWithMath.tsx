import React from 'react';
import { InlineMath } from '../components/Math';

/**
 * Renders text with inline math expressions using $...$ syntax.
 *
 * Example: "Let $f \in \mathscr{F}_L^{1,1}(\mathbb{R}^n)$ be a smooth convex function"
 * becomes: Let <InlineMath>f \in \mathscr{F}_L^{1,1}(\mathbb{R}^n)</InlineMath> be a smooth convex function
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
