import React from 'react';
import { InlineMath } from '../components/Math';

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
        <strong>Smooth function:</strong> Has <InlineMath>L</InlineMath>-Lipschitz continuous gradient, meaning{' '}
        <InlineMath>{String.raw`\|\nabla f(x) - \nabla f(y)\| \leq L\|x - y\|`}</InlineMath> for some constant <InlineMath>L</InlineMath>. Equivalently: continuously
        differentiable with bounded gradient variation. All test problems in this tool are smooth.
      </>
    ),
  },

  'strongly-convex': {
    term: 'strongly convex',
    definition: (
      <>
        <strong>Strongly convex function:</strong> For twice-differentiable functions, has a
        positive lower bound <InlineMath>\mu</InlineMath> &gt; 0 on the Hessian eigenvalues: <InlineMath>{String.raw`\nabla^2 f(x) \succeq \mu I`}</InlineMath> everywhere.
        This is stronger than regular convexity (<InlineMath>{String.raw`\nabla^2 f(x) \succeq 0`}</InlineMath>) and guarantees a unique global
        minimum. The strong convexity parameter <InlineMath>\mu</InlineMath> controls convergence speed.
      </>
    ),
  },

  'strong-convexity': {
    term: 'strong convexity',
    definition: (
      <>
        <strong>Strongly convex function:</strong> For twice-differentiable functions, has a
        positive lower bound <InlineMath>\mu</InlineMath> &gt; 0 on the Hessian eigenvalues: <InlineMath>{String.raw`\nabla^2 f(x) \succeq \mu I`}</InlineMath> everywhere.
        This is stronger than regular convexity (<InlineMath>{String.raw`\nabla^2 f(x) \succeq 0`}</InlineMath>) and guarantees a unique global
        minimum. The strong convexity parameter <InlineMath>\mu</InlineMath> controls convergence speed.
      </>
    ),
  },

  'convex': {
    term: 'convex',
    definition: (
      <>
        <strong>Convex function:</strong> For twice-differentiable functions, has non-negative
        Hessian eigenvalues: <InlineMath>{String.raw`\nabla^2 f(x) \succeq 0`}</InlineMath> everywhere. Weaker than strong convexity; may have
        slower convergence rates. Any local minimum is also a global minimum.
      </>
    ),
  },

  'hessian': {
    term: 'Hessian',
    definition: (
      <>
        <strong>Hessian matrix:</strong> The matrix of second partial derivatives <InlineMath>{String.raw`\nabla^2 f(x)`}</InlineMath>.
        For <InlineMath>{String.raw`f: \mathbb{R}^n \to \mathbb{R}`}</InlineMath>, the Hessian <InlineMath>{String.raw`H_{ij} = \frac{\partial^2 f}{\partial x_i \partial x_j}`}</InlineMath>. Encodes local curvature
        information. Positive definite Hessian indicates a local minimum; indefinite
        Hessian indicates a saddle point.
      </>
    ),
  },

  'eigenvalue': {
    term: 'eigenvalue',
    definition: (
      <>
        <strong>Eigenvalue:</strong> A scalar <InlineMath>\lambda</InlineMath> such that <InlineMath>{String.raw`Hv = \lambda v`}</InlineMath> for some non-zero vector <InlineMath>v</InlineMath>{' '}
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
        <strong>Quadratic convergence:</strong> The error is squared at each iteration:{' '}
        <InlineMath>{String.raw`\|e_{k+1}\| \leq C\|e_k\|^2`}</InlineMath>. This means the number of correct digits roughly doubles
        each iteration near the solution. Much faster than linear convergence (where error decreases
        by a constant factor). Requires <InlineMath>{String.raw`O(\log\log(1/\varepsilon))`}</InlineMath> iterations to reach{' '}
        <InlineMath>\varepsilon</InlineMath> accuracy. Newton's method achieves this under appropriate conditions.
      </>
    ),
  },

  'linear-convergence': {
    term: 'linear convergence',
    definition: (
      <>
        <strong>Linear convergence:</strong> The error decreases by a constant factor each
        iteration: <InlineMath>{String.raw`\|e_{k+1}\| \leq \rho\|e_k\|`}</InlineMath> for some 0 &lt; <InlineMath>\rho</InlineMath> &lt; 1. Requires <InlineMath>{String.raw`O(\log(1/\varepsilon))`}</InlineMath>{' '}
        iterations to reach <InlineMath>\varepsilon</InlineMath> accuracy. Gradient descent achieves this on strongly convex
        smooth functions. <em>Note:</em> Called "linear" because log(error) decreases linearly, even though
        the error itself decreases exponentially (also called "geometric convergence").
      </>
    ),
  },

  'sublinear-convergence': {
    term: 'sublinear convergence',
    definition: (
      <>
        <strong>Sublinear convergence:</strong> The error (or function value gap) decreases as{' '}
        <InlineMath>{String.raw`O(1/k)`}</InlineMath> or slower. Requires <InlineMath>{String.raw`O(1/\varepsilon)`}</InlineMath> iterations to reach{' '}
        <InlineMath>\varepsilon</InlineMath> accuracy—much slower than linear convergence. Gradient descent
        achieves <InlineMath>{String.raw`O(1/k)`}</InlineMath> convergence on convex smooth functions (without strong convexity).
        <em>Note:</em> "Sublinear" means slower than linear convergence, despite "linear" actually being exponential decay.
      </>
    ),
  },

  'superlinear-convergence': {
    term: 'superlinear convergence',
    definition: (
      <>
        <strong>Superlinear convergence:</strong> Faster than linear but not quite quadratic:{' '}
        <InlineMath>{String.raw`\|e_{k+1}\|/\|e_k\| \to 0`}</InlineMath> as <InlineMath>{String.raw`k \to \infty`}</InlineMath>. L-BFGS with sufficient memory achieves this on
        strongly convex functions. Better than gradient descent, though not as fast as
        Newton's method.
      </>
    ),
  },

  'ill-conditioned': {
    term: 'ill-conditioned',
    definition: (
      <>
        <strong>Ill-conditioned problem:</strong> Has a large condition number (<InlineMath>{String.raw`Q \gg 1`}</InlineMath>),
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
        <strong>Condition number:</strong> Two related concepts: (1) <em>Problem condition number</em>{' '}
        <InlineMath>{String.raw`Q = L/\mu`}</InlineMath> for the optimization problem, where <InlineMath>L</InlineMath> is the Lipschitz
        constant and <InlineMath>\mu</InlineMath> is the strong convexity parameter. (2) <em>Matrix condition number</em>{' '}
        <InlineMath>{String.raw`\kappa(A) = \lambda_{\text{max}}/\lambda_{\text{min}}`}</InlineMath> for any matrix <InlineMath>A</InlineMath>.
        For optimization, <InlineMath>Q</InlineMath> bounds <InlineMath>{String.raw`\kappa(H(x))`}</InlineMath> where <InlineMath>H</InlineMath> is the Hessian; for quadratic functions they're equal.
        Measures how "stretched" the problem is. <InlineMath>{String.raw`Q \approx 1`}</InlineMath> means well-conditioned (easy); <InlineMath>{String.raw`Q \gg 1`}</InlineMath> means ill-conditioned (difficult for
        gradient descent).
      </>
    ),
  },

  'positive-definite': {
    term: 'positive definite',
    definition: (
      <>
        <strong>Positive definite matrix:</strong> A symmetric matrix <InlineMath>H</InlineMath> where all eigenvalues
        are positive (<InlineMath>{String.raw`\lambda_i > 0`}</InlineMath>). Equivalently, <InlineMath>{String.raw`x^T H x > 0`}</InlineMath> for all non-zero <InlineMath>x</InlineMath>. At a
        critical point, a positive definite Hessian guarantees a local minimum.
      </>
    ),
  },

  'lipschitz-continuous': {
    term: 'Lipschitz continuous',
    definition: (
      <>
        <strong><InlineMath>L</InlineMath>-Lipschitz continuous gradient:</strong> The gradient doesn't change too
        rapidly: <InlineMath>{String.raw`\|\nabla f(x) - \nabla f(y)\| \leq L\|x - y\|`}</InlineMath> for some constant <InlineMath>L</InlineMath> (the Lipschitz constant).
        This is the precise mathematical definition of "smooth" and enables convergence
        guarantees.
      </>
    ),
  },

  'first-order-method': {
    term: 'first-order method',
    definition: (
      <>
        <strong>First-order method:</strong> An optimization algorithm that only uses
        function values and gradients (first derivatives). Examples: gradient descent,
        L-BFGS. Cheaper per iteration than second-order methods, but may require more
        iterations. <em>Note:</em> "First-order" refers to using first derivatives (gradients),
        not to convergence speed.
      </>
    ),
  },

  'second-order-method': {
    term: 'second-order method',
    definition: (
      <>
        <strong>Second-order method:</strong> An optimization algorithm that uses the Hessian
        (second derivatives) in addition to gradients. Newton's method is the primary example.
        More expensive per iteration but typically achieves faster convergence. <em>Note:</em> "Second-order"
        refers to using second derivatives (Hessian), not to convergence speed.
      </>
    ),
  },

  'basin-of-convergence': {
    term: 'basin of convergence',
    definition: (
      <>
        <strong>Basin of convergence:</strong> The set of starting points from which an
        optimization algorithm converges to a particular local minimum. Different minima have
        different basin sizes. The basin picker tool visualizes these regions.
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
