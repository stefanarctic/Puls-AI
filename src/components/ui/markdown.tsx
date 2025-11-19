'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';
import rehypeRaw from 'rehype-raw';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: Element[]) => Promise<void>;
    };
  }
}

type MarkdownProps = {
  children: string;
  className?: string;
};

export function Markdown({ children, className }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const typeset = async () => {
      if (cancelled || typeof window === 'undefined') return;

      if (!window.MathJax?.typesetPromise) {
        setTimeout(typeset, 150);
        return;
      }

      const target = containerRef.current ? [containerRef.current] : undefined;

      try {
        await window.MathJax.typesetPromise!(target);
      } catch (error) {
        console.warn('MathJax typeset error:', error);
      }
    };

    void typeset();

    return () => {
      cancelled = true;
    };
  }, [children]);

  return (
    <div ref={containerRef} className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeMathjax,
            {
              tex: {
                inlineMath: [
                  ['\\(', '\\)'],
                  ['$', '$'],
                ],
                displayMath: [
                  ['\\[', '\\]'],
                  ['$$', '$$'],
                ],
              },
            },
          ],
        ]}
        components={{
          code(props) {
            const { children: codeChildren, className: codeClassName } = props as any;
            return (
              <pre className={codeClassName}>
                <code>{codeChildren}</code>
              </pre>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;



