import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

/**
 * Render LaTeX math expression using KaTeX
 * @param children LaTeX string to render
 * @param block Whether to render in display mode (block) or inline mode
 * @param className Optional CSS classes
 */
export function Math({ children, block = false, className = '' }: MathProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return children;
    }
  }, [children, block]);

  const Component = block ? 'div' : 'span';
  const classes = block ? `katex-display ${className}` : `katex-inline ${className}`;

  return (
    <Component
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Convenience component for inline math
 */
export function InlineMath({ children, className }: { children: string; className?: string }) {
  return <Math block={false} className={className}>{children}</Math>;
}

/**
 * Convenience component for block (display) math
 */
export function BlockMath({ children, className }: { children: string; className?: string }) {
  return <Math block={true} className={className}>{children}</Math>;
}
