import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

// Note: We intentionally avoid rehype-raw to not allow arbitrary HTML injection.
// If in the future we need to allow a safe subset of HTML, we should add rehype-sanitize with a strict schema.

function normalizeMarkdown(raw: string): string {
  let text = raw ?? "";
  // Normalize newlines
  text = text.replace(/\r\n/g, "\n");

  // Remove stray opening fences like ```the that commonly come from LLM glitches
  text = text.replace(/```(?=\S)/g, "");

  // Only fix unmatched triple backticks if they would create invalid markdown
  // Don't convert them to single backticks as that interferes with legitimate inline code
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    // Remove the last unmatched ``` instead of converting to single backticks
    const lastFenceIndex = text.lastIndexOf('```');
    if (lastFenceIndex !== -1) {
      text = text.substring(0, lastFenceIndex) + text.substring(lastFenceIndex + 3);
    }
  }

  // Convert list items that are incorrectly indented with four or more spaces
  // (which Markdown interprets as code blocks) back into proper list syntax.
  // Example: "    * item" => "* item"
  text = text.replace(/^( {4,})([*\-+]|\d+\.)\s+/gm, (_m, _spaces, marker) => `${marker} `);

  return text.trim();
}

function tryParseJson(str: string): any | null {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch {
    return null;
  }
}

function JsonViewer({ value }: { value: any }) {
  const [expanded, setExpanded] = useState(true);
  const pretty = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const displayCode = expanded ? pretty : pretty.split("\n").slice(0, 8).join("\n") + (pretty.split("\n").length > 8 ? "\n…" : "");
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">JSON</span>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
          onClick={() => setExpanded((s) => !s)}
        >
          {expanded ? "Recolher" : "Expandir"}
        </button>
      </div>
      <CodeBlock code={displayCode} language="json" showLineNumbers={true} />
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const cleaned = useMemo(() => normalizeMarkdown(content), [content]);

  // If the whole content is a valid JSON, render a JSON viewer instead of markdown
  const asJson = useMemo(() => {
    // quick heuristics to avoid expensive parse on long generic texts
    const trimmed = cleaned.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      return tryParseJson(trimmed);
    }
    return null;
  }, [cleaned]);

  if (asJson !== null) {
    return <JsonViewer value={asJson} />;
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs and text blocks
          p: ({ node, children, ...props }) => (
            <p className="whitespace-pre-wrap break-words" {...props}>{children}</p>
          ),
          // Headings
          h1: ({ node, children, ...props }) => (
            <h1 className="text-xl font-semibold mt-4" {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-lg font-semibold mt-3" {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-base font-semibold mt-2" {...props}>{children}</h3>
          ),
          // Lists
          ul: ({ node, children, ...props }) => (
            <ul className="list-disc ml-6 space-y-1" {...props}>{children}</ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="list-decimal ml-6 space-y-1" {...props}>{children}</ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="break-words" {...props}>{children}</li>
          ),
          // Blockquotes
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="border-l-2 pl-3 italic text-muted-foreground" {...props}>{children}</blockquote>
          ),
          // Code handling
          code: (props: any) => {
            const { inline, className, children, ...rest } = props as any;
            const txt = String(children ?? "");
            
            // Se for inline code OU não houver quebras de linha e não houver linguagem definida, renderiza inline simples
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : undefined;

            const isInlineLike = inline || (!txt.includes("\n") && !lang);
            if (isInlineLike) {
              return (
                <code className="bg-muted/40 px-1 py-0.5 text-[0.9em] font-mono rounded-sm" {...rest}>
                  {txt}
                </code>
              );
            }

            // Caso contrário, trata como bloco de código
            return (
              <div className="my-4">
                <CodeBlock code={txt} language={lang} showLineNumbers={true} />
              </div>
            );
          },
          // Tables
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm" {...props}>{children}</table>
            </div>
          ),
          thead: ({ node, children, ...props }) => (
            <thead className="bg-muted/50" {...props}>{children}</thead>
          ),
          th: ({ node, children, ...props }) => (
            <th className="px-3 py-2 text-left font-medium" {...props}>{children}</th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="px-3 py-2 align-top" {...props}>{children}</td>
          ),
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-border" {...props} />
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;