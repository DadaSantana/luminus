import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useT } from "@/lib/i18n";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(t('failedToCopy'), err);
    }
  };

  const lines = code.split('\n');
  const maxLineNumberWidth = String(lines.length).length;

  return (
    <div className="relative group">
      {/* Header com linguagem e botão copiar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700 rounded-t-md">
        <span className="text-xs text-zinc-400 font-mono">
          {language || t('text')}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          title={t('copyCode')}
        >
          {copied ? (
            <>
              <Check size={12} />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy size={12} />
              {t('copy')}
            </>
          )}
        </button>
      </div>

      {/* Área do código */}
      <div className="bg-zinc-900 text-zinc-100 overflow-x-auto rounded-b-md">
        <pre className="p-0 m-0">
          <code className="block">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span 
                    className="select-none text-zinc-500 text-xs leading-relaxed px-3 py-0.5 border-r border-zinc-700 bg-zinc-800/50"
                    style={{ minWidth: `${maxLineNumberWidth + 1}ch` }}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="flex-1 text-xs leading-relaxed px-3 py-0.5 whitespace-pre">
                  {line || ' '}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default CodeBlock;