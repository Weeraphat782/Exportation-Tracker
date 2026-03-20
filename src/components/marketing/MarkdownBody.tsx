import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
    p: ({ children }) => (
        <p className="mb-4 text-neutral-600 leading-relaxed last:mb-0">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
        <ul className="my-4 list-disc space-y-2 pl-6 text-neutral-600">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="my-4 list-decimal space-y-2 pl-6 text-neutral-600">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    h1: ({ children }) => (
        <h1 className="mt-8 mb-3 text-2xl font-bold text-neutral-900">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="mt-6 mb-2 text-xl font-semibold text-neutral-900">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-4 mb-2 text-lg font-semibold text-neutral-900">{children}</h3>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            className="font-medium underline"
            style={{ color: "var(--color-primary-ref)" }}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    ),
    hr: () => <hr className="my-8 border-neutral-200" />,
    blockquote: ({ children }) => (
        <blockquote className="my-4 border-l-4 border-neutral-300 pl-4 text-neutral-600 italic">
            {children}
        </blockquote>
    ),
};

/**
 * Renders CMS Markdown (e.g. **bold**, lists) on marketing pages.
 */
export function MarkdownBody({
    children,
    className = "",
}: {
    children: string;
    className?: string;
}) {
    return (
        <div className={`max-w-none ${className}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {children}
            </ReactMarkdown>
        </div>
    );
}
