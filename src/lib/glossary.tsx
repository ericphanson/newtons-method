import React from 'react';

/**
 * Global glossary registry for mathematical and optimization terms
 *
 * This centralized registry ensures consistent definitions across the entire
 * educational interface. Each term has a short display name and a detailed
 * definition shown in tooltips.
 *
 * ============================================================================
 * STYLE GUIDE: When to Add Terms to the Glossary
 * ============================================================================
 *
 * ADD terms that are:
 * ✓ Technical mathematical terms requiring precise definition
 *   (e.g., "smooth", "convex", "Lipschitz continuous")
 * ✓ Used in multiple locations across different components
 * ✓ Terms where common understanding differs from mathematical meaning
 *   (e.g., "smooth" in everyday language vs. mathematical smoothness)
 * ✓ Foundational concepts students learning optimization should understand
 * ✓ Terms that affect algorithm behavior
 *   (e.g., "ill-conditioned", "eigenvalue", "strong convexity")
 *
 * DO NOT add terms that are:
 * ✗ Common programming terms ("iteration", "parameter", "function")
 * ✗ Terms explained in the immediately surrounding text
 * ✗ One-off specialized terms used only once
 * ✗ Terms where the tooltip would just repeat the visible text
 *
 * ============================================================================
 * STYLE GUIDE: When to Use Tooltips (via <GlossaryTooltip />)
 * ============================================================================
 *
 * USE tooltips for:
 * ✓ First occurrence in a section - Define it once, readers can reference later
 * ✓ Key explanatory text - Where understanding the term is critical
 * ✓ Mathematical claims - Where precise definitions matter
 *   (e.g., "strongly convex smooth functions" in convergence rate claims)
 *
 * USE PLAIN TEXT (no tooltip) for:
 * ✗ Repeated uses in close proximity - If term appears 3 times in one paragraph,
 *   only tooltip the first occurrence
 * ✗ Headings and titles - Keep visual hierarchy clean
 * ✗ After explicit definition - If you just explained it in the previous sentence
 * ✗ Casual references - When the precise definition isn't critical to that point
 *
 * EXAMPLE PATTERN:
 * ```tsx
 * // Section heading - NO tooltip (keeps it clean)
 * <h3>Convergence for Strongly Convex Functions</h3>
 *
 * // First explanatory use - YES tooltip
 * <p>
 *   Newton's method achieves quadratic convergence on{' '}
 *   <GlossaryTooltip termKey="strongly-convex" /> functions.
 * </p>
 *
 * // Near repeat - NO tooltip (just explained above)
 * <p>
 *   The strong convexity parameter μ controls the convergence rate.
 * </p>
 *
 * // Later, different context - YES tooltip (different section, key claim)
 * <p>
 *   For <GlossaryTooltip termKey="strongly-convex" /> problems,
 *   gradient descent requires O(log(1/ε)) iterations.
 * </p>
 * ```
 *
 * BALANCING PRINCIPLES:
 * 1. Help without overwhelming - Too many tooltips create visual noise
 * 2. Define once per context - First use in a collapsible section or page
 * 3. Critical > casual - Tooltip mathematical claims, not casual mentions
 * 4. Let users explore - Having the term in the glossary means users can
 *    look it up elsewhere even if not every use has a tooltip
 *
 * ============================================================================
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
        <strong>Strongly convex function:</strong> For twice-differentiable functions, has a
        positive lower bound μ &gt; 0 on the Hessian eigenvalues: ∇²f(x) ⪰ μI everywhere.
        This is stronger than regular convexity (∇²f(x) ⪰ 0) and guarantees a unique global
        minimum. The strong convexity parameter μ controls convergence speed.
      </>
    ),
  },

  'strong-convexity': {
    term: 'strong convexity',
    definition: (
      <>
        <strong>Strongly convex function:</strong> For twice-differentiable functions, has a
        positive lower bound μ &gt; 0 on the Hessian eigenvalues: ∇²f(x) ⪰ μI everywhere.
        This is stronger than regular convexity (∇²f(x) ⪰ 0) and guarantees a unique global
        minimum. The strong convexity parameter μ controls convergence speed.
      </>
    ),
  },

  'convex': {
    term: 'convex',
    definition: (
      <>
        <strong>Convex function:</strong> For twice-differentiable functions, has non-negative
        Hessian eigenvalues: ∇²f(x) ⪰ 0 everywhere. Weaker than strong convexity; may have
        slower convergence rates. Any local minimum is also a global minimum.
      </>
    ),
  },

  'hessian': {
    term: 'Hessian',
    definition: (
      <>
        <strong>Hessian matrix:</strong> The matrix of second partial derivatives ∇²f(x).
        For f: ℝⁿ → ℝ, the Hessian H[i,j] = ∂²f/∂xᵢ∂xⱼ. Encodes local curvature
        information. Positive definite Hessian indicates a local minimum; indefinite
        Hessian indicates a saddle point.
      </>
    ),
  },

  'eigenvalue': {
    term: 'eigenvalue',
    definition: (
      <>
        <strong>Eigenvalue:</strong> A scalar λ such that Hv = λv for some non-zero vector v
        (the eigenvector). For symmetric matrices like the Hessian, eigenvalues are real and
        indicate principal curvatures. Positive eigenvalues mean the function curves upward
        in that direction; negative eigenvalues mean it curves downward.
      </>
    ),
  },

  'quadratic-convergence': {
    term: 'quadratic convergence',
    definition: (
      <>
        <strong>Quadratic convergence:</strong> The error is squared at each iteration:
        ||eₖ₊₁|| ≤ C||eₖ||². This means the number of correct digits roughly doubles
        each iteration near the solution. Much faster than linear convergence.
        Newton's method achieves this under appropriate conditions.
      </>
    ),
  },

  'linear-convergence': {
    term: 'linear convergence',
    definition: (
      <>
        <strong>Linear convergence:</strong> The error decreases by a constant factor each
        iteration: ||eₖ₊₁|| ≤ ρ||eₖ|| for some 0 &lt; ρ &lt; 1. Requires O(log(1/ε))
        iterations to reach ε accuracy. Gradient descent achieves this on strongly convex
        smooth functions.
      </>
    ),
  },

  'superlinear-convergence': {
    term: 'superlinear convergence',
    definition: (
      <>
        <strong>Superlinear convergence:</strong> Faster than linear but not quite quadratic:
        ||eₖ₊₁||/||eₖ|| → 0 as k → ∞. L-BFGS with sufficient memory achieves this on
        strongly convex functions. Better than gradient descent, though not as fast as
        Newton's method.
      </>
    ),
  },

  'ill-conditioned': {
    term: 'ill-conditioned',
    definition: (
      <>
        <strong>Ill-conditioned problem:</strong> Has a large condition number (κ ≫ 1),
        meaning the Hessian has very different curvatures in different directions. This
        causes gradient descent to zig-zag slowly, while Newton's method adapts to the
        varying curvatures and converges much faster.
      </>
    ),
  },

  'condition-number': {
    term: 'condition number',
    definition: (
      <>
        <strong>Condition number:</strong> For positive definite Hessian, the ratio of largest
        to smallest eigenvalue: κ = λₘₐₓ/λₘᵢₙ. Equivalently, κ = L/μ where L is the Lipschitz
        constant and μ is the strong convexity parameter. Measures how "stretched" the problem
        is. κ ≈ 1 means well-conditioned (easy); κ ≫ 1 means ill-conditioned (difficult for
        gradient descent).
      </>
    ),
  },

  'positive-definite': {
    term: 'positive definite',
    definition: (
      <>
        <strong>Positive definite matrix:</strong> A symmetric matrix H where all eigenvalues
        are positive (λᵢ &gt; 0). Equivalently, xᵀHx &gt; 0 for all non-zero x. At a
        critical point, a positive definite Hessian guarantees a local minimum.
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
