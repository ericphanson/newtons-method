import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo, useEffect, useRef, useContext } from 'react';
import { KATEX_MACROS } from '../variables';
import { PseudocodeContext } from './PseudocodeContext';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

/**
 * Render LaTeX math expression using KaTeX with interactive variable support.
 *
 * Features:
 * - Uses KaTeX macros (e.g., \varH, \varM) to mark variables
 * - Adds hover event listeners for cross-highlighting
 * - Displays type tooltips on hover
 * - Connects to global PseudocodeContext for synchronized highlighting
 *
 * @param children LaTeX string to render (can use \varX macros)
 * @param block Whether to render in display mode (block) or inline mode
 * @param className Optional CSS classes
 */
export function Math({ children, block = false, className = '' }: MathProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { hoveredVar, setHoveredVar } = useContext(PseudocodeContext);

  // Render LaTeX to HTML string
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: true, // Required for \htmlData and other HTML extension commands
        macros: KATEX_MACROS, // Use our auto-generated variable macros
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return children;
    }
  }, [children, block]);

  // Add event listeners to interactive elements after render
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all elements with data-var-id (created by \htmlData macro)
    const elements = containerRef.current.querySelectorAll('[data-var-id]');

    const listeners: Array<{
      element: Element;
      enterHandler: () => void;
      leaveHandler: () => void;
    }> = [];

    elements.forEach((el) => {
      const id = el.getAttribute('data-var-id');
      const type = el.getAttribute('data-var-type');

      if (!id) return;

      // Add hover styling
      el.classList.add('cursor-pointer', 'transition-colors', 'duration-150', 'rounded', 'px-0.5');

      // Create event handlers
      const enterHandler = () => setHoveredVar(id);
      const leaveHandler = () => setHoveredVar(null);

      // Add event listeners
      el.addEventListener('mouseenter', enterHandler);
      el.addEventListener('mouseleave', leaveHandler);

      // Store for cleanup
      listeners.push({ element: el, enterHandler, leaveHandler });

      // Optional: Add native tooltip (HTML title attribute)
      // Note: We could also render custom React tooltips if needed
      if (type) {
        el.setAttribute('title', type);
      }
    });

    // Cleanup function to remove event listeners
    return () => {
      listeners.forEach(({ element, enterHandler, leaveHandler }) => {
        element.removeEventListener('mouseenter', enterHandler);
        element.removeEventListener('mouseleave', leaveHandler);
      });
    };
  }, [html, setHoveredVar]); // Re-run when HTML changes

  // Apply highlighting based on global hover state
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('[data-var-id]');

    elements.forEach((el) => {
      const id = el.getAttribute('data-var-id');
      const isHighlighted = hoveredVar === id;

      if (isHighlighted) {
        el.classList.add('bg-yellow-200', 'ring-2', 'ring-yellow-400');
      } else {
        el.classList.remove('bg-yellow-200', 'ring-2', 'ring-yellow-400');
        // Add subtle hover effect when not highlighted
        el.classList.add('hover:bg-yellow-50');
      }
    });
  }, [hoveredVar]);

  const classes = block ? `katex-display ${className}` : `katex-inline ${className}`;

  if (block) {
    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={classes}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      ref={containerRef as React.RefObject<HTMLSpanElement>}
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Convenience component for inline math.
 *
 * Usage:
 *   <InlineMath>\varH^{{-1}}\varGrad</InlineMath>
 */
export function InlineMath({ children, className }: { children: string; className?: string }) {
  return <Math block={false} className={className}>{children}</Math>;
}

/**
 * Convenience component for block (display) math.
 *
 * Usage:
 *   <BlockMath>\varH^{{-1}}\varGrad</BlockMath>
 */
export function BlockMath({ children, className }: { children: string; className?: string }) {
  return <Math block={true} className={className}>{children}</Math>;
}
