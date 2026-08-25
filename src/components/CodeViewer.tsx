import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (val: string) => void;
  title?: string;
  maxHeight?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'java',
  readOnly = true,
  onChange,
  title,
  maxHeight = '500px'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-stone-700/60 bg-stone-900 overflow-hidden shadow-lg flex flex-col font-mono text-xs md:text-sm">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-800/90 border-b border-stone-700/60 text-stone-300">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs font-semibold ml-2 text-stone-200">{title}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs text-stone-400 hover:text-stone-100 transition-colors px-2 py-1 rounded bg-stone-700/40 hover:bg-stone-700"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {readOnly ? (
        <div 
          className="p-4 overflow-auto text-stone-200 leading-relaxed scrollbar-thin scrollbar-thumb-stone-700"
          style={{ maxHeight }}
        >
          <pre className="m-0 font-mono">
            <code>
              {code.split('\n').map((line, idx) => {
                // Simple highlight for Java annotations and keywords
                let formattedLine: React.ReactNode = line;
                
                const isAnnotation = /@([A-Za-z0-9_]+)/.test(line);
                const isComment = /^\s*(\/\/|\/\*|\*)/.test(line);
                const isImport = /^\s*(import|package)\s+/.test(line);

                let lineClass = 'text-stone-300';
                if (isComment) lineClass = 'text-stone-500 italic';
                else if (isImport) lineClass = 'text-sky-400/90';
                else if (isAnnotation) lineClass = 'text-amber-300 font-medium';

                return (
                  <div key={idx} className="table-row hover:bg-stone-800/40 px-2 py-0.5 rounded">
                    <span className="table-cell select-none text-stone-600 text-right pr-4 text-xs">
                      {idx + 1}
                    </span>
                    <span className={`table-cell font-mono ${lineClass}`}>
                      {line}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      ) : (
        <textarea
          value={code}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-full p-4 bg-stone-900 text-stone-100 font-mono outline-none resize-y min-h-[300px] border-none focus:ring-0 leading-relaxed"
          style={{ maxHeight }}
          spellCheck={false}
        />
      )}
    </div>
  );
};
