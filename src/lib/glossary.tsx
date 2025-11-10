import React from 'react';

/**
 * Global glossary registry for mathematical and optimization terms
 *
 * This centralized registry ensures consistent definitions across the entire
 * educational interface. Each term has a short display name and a detailed
 * definition shown in tooltips.
 */

export interface GlossaryEntry {
  term: string;
  definition: React.ReactNode;
}

export const glossary: Record<string, GlossaryEntry> = {
  'smooth': {
    term: 'smooth',
    definition: (
      <>
        <strong>Smooth function:</strong> Has Lipschitz continuous gradient, meaning
        ||∇f(x) - ∇f(y)|| ≤ L||x - y|| for some constant L. Equivalently: continuously
        differentiable with bounded gradient variation. All test problems in this tool are smooth.
      </>
    ),
  },

  'strongly-convex': {
    term: 'strongly convex',
    definition: (
      <>
        <strong>Strongly convex function:</strong> Has a positive lower bound μ &gt; 0 on the
        Hessian eigenvalues: ∇²f(x) ⪰ μI everywhere. This is stronger than regular convexity
        (∇²f(x) ⪰ 0) and guarantees a unique global minimum. The strong convexity parameter μ
        controls convergence speed.
      </>
    ),
  },

  'strong-convexity': {
    term: 'strong convexity',
    definition: (
      <>
        <strong>Strongly convex function:</strong> Has a positive lower bound μ &gt; 0 on the
        Hessian eigenvalues: ∇²f(x) ⪰ μI everywhere. This is stronger than regular convexity
        (∇²f(x) ⪰ 0) and guarantees a unique global minimum. The strong convexity parameter μ
        controls convergence speed.
      </>
    ),
  },

  'convex': {
    term: 'convex',
    definition: (
      <>
        <strong>Convex function:</strong> Has non-negative Hessian eigenvalues: ∇²f(x) ⪰ 0
        everywhere. Weaker than strong convexity; may have slower convergence rates. Any local
        minimum is also a global minimum.
      </>
    ),
  },
} as const;

export type GlossaryTermKey = keyof typeof glossary;

/**
 * Get a glossary entry by key
 * Throws an error if the term is not found to catch typos during development
 */
export function getGlossaryEntry(key: GlossaryTermKey): GlossaryEntry {
  const entry = glossary[key];
  if (!entry) {
    throw new Error(`Glossary term "${key}" not found. Available terms: ${Object.keys(glossary).join(', ')}`);
  }
  return entry;
}
