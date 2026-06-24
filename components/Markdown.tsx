"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 학습 글 본문 렌더. react-markdown이 기본적으로 raw HTML을 막아 XSS 안전.
// @tailwindcss/typography 의존성 없이 요소별 클래스만 가볍게 지정.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-6 text-2xl font-bold tracking-tight" {...p} />,
          h2: (p) => <h2 className="mt-6 text-xl font-bold tracking-tight" {...p} />,
          h3: (p) => <h3 className="mt-4 text-lg font-semibold" {...p} />,
          p: (p) => <p className="text-[var(--foreground)]" {...p} />,
          ul: (p) => <ul className="list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-1 pl-6" {...p} />,
          a: (p) => <a className="text-[var(--accent)] underline" {...p} />,
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          img: (p) => <img className="my-2 max-w-full rounded-lg border border-[var(--border)]" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-4 border-[var(--border)] pl-4 text-[var(--muted)]" {...p} />
          ),
          code: ({ className, children, ...rest }) => {
            const inline = !className;
            return inline ? (
              <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[0.85em]" {...rest}>
                {children}
              </code>
            ) : (
              <code className={`font-mono text-sm ${className ?? ""}`} {...rest}>
                {children}
              </code>
            );
          },
          pre: (p) => (
            <pre className="overflow-x-auto rounded-lg bg-[var(--card)] p-4 text-sm" {...p} />
          ),
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-[var(--border)] px-3 py-1.5 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-[var(--border)] px-3 py-1.5" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
