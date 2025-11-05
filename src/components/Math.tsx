import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

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

// Convenience components
export function InlineMath({ children, className }: { children: string; className?: string }) {
  return <Math block={false} className={className}>{children}</Math>;
}

export function BlockMath({ children, className }: { children: string; className?: string }) {
  return <Math block={true} className={className}>{children}</Math>;
}
