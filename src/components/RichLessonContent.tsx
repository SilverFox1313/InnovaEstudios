import React from 'react';
import { BookOpen, Info, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface RichLessonContentProps {
  content: string;
}

export default function RichLessonContent({ content }: RichLessonContentProps) {
  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="font-medium">Este capítulo no tiene apuntes o texto detallado todavía.</p>
      </div>
    );
  }

  // Split into blocks by double newlines or code fences
  const blocks = content.split(/\n\s*\n/);

  return (
    <article className="space-y-5 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm sm:text-base selection:bg-indigo-100 dark:selection:bg-indigo-900">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // 1. Image markdown: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const altText = imgMatch[1];
          const imgUrl = imgMatch[2];
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
              <img
                src={imgUrl}
                alt={altText || 'Imagen del capítulo'}
                loading="lazy"
                className="w-full max-h-[520px] object-contain bg-slate-900/5 dark:bg-black/20 mx-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {altText && (
                <figcaption className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{altText}</span>
                </figcaption>
              )}
            </figure>
          );
        }

        // 2. Direct standalone image URL: http(s)://...(.png|.jpg|.jpeg|.webp|.gif|.svg)
        if (/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm">
              <img
                src={trimmed}
                alt="Imagen de referencia"
                loading="lazy"
                className="w-full max-h-[520px] object-contain bg-slate-900/5 dark:bg-black/20 mx-auto"
              />
            </figure>
          );
        }

        // 3. Code fence block: ```lang ... ```
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim();
          const hasLang = firstLine && !firstLine.includes(' ') && lines.length > 1;
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={idx} className="my-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{hasLang ? firstLine : 'código'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80"></span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // 4. Headings: #, ##, ###
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2.5">
              {trimmed.substring(2)}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-6 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-indigo-600 rounded-full inline-block"></span>
              <span>{trimmed.substring(3)}</span>
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">
              {trimmed.substring(4)}
            </h3>
          );
        }

        // 5. Blockquote / Callout card: >
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
          return (
            <div key={idx} className="my-4 p-4 sm:p-5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-indigo-600 text-slate-800 dark:text-slate-200 shadow-xs flex gap-3.5">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium text-slate-800 dark:text-slate-200">
                {renderInlineFormatting(quoteLines)}
              </div>
            </div>
          );
        }

        // 6. Bullet list: - or *
        if (trimmed.split('\n').every(line => /^\s*[-*]\s+/.test(line))) {
          const items = trimmed.split('\n').map(l => l.replace(/^\s*[-*]\s+/, ''));
          return (
            <ul key={idx} className="my-4 space-y-2.5 pl-2 sm:pl-4">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-2.5"></span>
                  <span className="leading-relaxed">{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // 7. Standard Paragraph with inline formatting
        return (
          <p key={idx} className="leading-relaxed text-slate-800 dark:text-slate-200 text-sm sm:text-base whitespace-pre-line">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </article>
  );
}

/**
 * Parses bold (**text**), inline code (`code`), and italics (*text*)
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Regex to split tokens for **bold**, `code`, *italic*
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] sm:text-xs border border-slate-200 dark:border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={i} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
