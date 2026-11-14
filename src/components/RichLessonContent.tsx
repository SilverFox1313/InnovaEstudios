import React from 'react';
import { BookOpen, Info, AlertTriangle, Lightbulb, Image as ImageIcon } from 'lucide-react';
import {
  DEFAULT_COURSE_IMAGE,
  extractGoogleDriveFileId,
  handleImageLoadError,
  normalizeImageUrl
} from '../utils/imageUrl';

interface RichLessonContentProps {
  content: string;
}

type BlockKind = 'code' | 'heading' | 'hr' | 'blockquote' | 'table' | 'ul' | 'ol' | 'paragraph';

function classifyLine(trimmedLine: string): BlockKind {
  if (/^#{1,3}\s+/.test(trimmedLine)) return 'heading';
  if (/^-{3,}$/.test(trimmedLine)) return 'hr';
  if (trimmedLine.startsWith('>')) return 'blockquote';
  if (trimmedLine.startsWith('|')) return 'table';
  if (/^[-*]\s+/.test(trimmedLine)) return 'ul';
  if (/^\d+\.\s+/.test(trimmedLine)) return 'ol';
  return 'paragraph';
}

/**
 * Splits Markdown content into logical blocks while keeping fenced code blocks (```...```)
 * intact even when they contain internal blank lines, and cleanly separating transitions
 * between paragraphs, headings, lists, tables, horizontal rules, and blockquotes.
 */
function splitMarkdownBlocks(content: string): string[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let currentKind: BlockKind | null = null;
  let inCodeFence = false;

  const flushCurrent = () => {
    if (current.length > 0) {
      const joined = current.join('\n').trim();
      if (joined) blocks.push(joined);
      current = [];
    }
    currentKind = null;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      if (!inCodeFence) {
        flushCurrent();
        inCodeFence = true;
        currentKind = 'code';
        current.push(line);
      } else {
        current.push(line);
        flushCurrent();
        inCodeFence = false;
      }
      continue;
    }

    if (inCodeFence) {
      current.push(line);
      continue;
    }

    if (trimmedLine === '') {
      flushCurrent();
      continue;
    }

    const lineKind = classifyLine(trimmedLine);

    if (lineKind === 'heading' || lineKind === 'hr') {
      flushCurrent();
      blocks.push(trimmedLine);
      continue;
    }

    if (currentKind && currentKind !== lineKind) {
      flushCurrent();
    }

    currentKind = lineKind;
    current.push(line);
  }

  flushCurrent();
  return blocks;
}

/**
 * Splits a Markdown table row into trimmed cells while preserving `|` inside inline code (`...`)
 * and unescaping explicit `\|` sequences so cells like `|` (*Pipe*) never break column layout.
 */
function parseTableRow(rowLine: string): string[] {
  const trimmed = rowLine.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  const cells: string[] = [];
  let current = '';
  let inInlineCode = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const next = trimmed[i + 1];

    if (ch === '\\' && next === '|') {
      current += '|';
      i++;
      continue;
    }

    if (ch === '`') {
      inInlineCode = !inInlineCode;
      current += ch;
      continue;
    }

    if (ch === '|' && !inInlineCode) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function getColumnAlignments(separatorLine: string): Array<'left' | 'center' | 'right'> {
  return parseTableRow(separatorLine).map((cell) => {
    const cleaned = cell.replace(/\s+/g, '');
    if (cleaned.startsWith(':') && cleaned.endsWith(':')) return 'center';
    if (cleaned.endsWith(':')) return 'right';
    return 'left';
  });
}

function isMarkdownTable(block: string): boolean {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  if (!lines[0].includes('|') || !lines[1].includes('|')) return false;
  const sepCells = parseTableRow(lines[1]);
  return sepCells.length >= 1 && sepCells.every((cell) => /^:?-{2,}:?$/.test(cell));
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

  const blocks = splitMarkdownBlocks(content);

  return (
    <article className="space-y-5 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm sm:text-base selection:bg-indigo-100 dark:selection:bg-indigo-900">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // 1. Image markdown: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const altText = imgMatch[1];
          const imgUrl = normalizeImageUrl(imgMatch[2], DEFAULT_COURSE_IMAGE);
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
              <img
                src={imgUrl}
                alt={altText || 'Imagen del capítulo'}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full max-h-[520px] object-contain bg-slate-900/5 dark:bg-black/20 mx-auto"
                onError={(e) => handleImageLoadError(e, DEFAULT_COURSE_IMAGE)}
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

        // 2. Direct standalone image URL (http(s) or /uploads/) or Google Drive image link
        if (
          /^(https?:\/\/|\/uploads\/).*\.(png|jpg|jpeg|webp|gif|svg|avif)(\?.*)?$/i.test(trimmed) ||
          Boolean(extractGoogleDriveFileId(trimmed))
        ) {
          const directUrl = normalizeImageUrl(trimmed, DEFAULT_COURSE_IMAGE);
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm">
              <img
                src={directUrl}
                alt="Imagen de referencia"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full max-h-[520px] object-contain bg-slate-900/5 dark:bg-black/20 mx-auto"
                onError={(e) => handleImageLoadError(e, DEFAULT_COURSE_IMAGE)}
              />
            </figure>
          );
        }

        // 3. Code fence block: ```lang ... ```
        if (trimmed.startsWith('```') && trimmed.endsWith('```') && trimmed.length >= 6) {
          const firstNewline = trimmed.indexOf('\n');
          const headerLine = firstNewline >= 0 ? trimmed.slice(3, firstNewline).trim() : '';
          const innerBody = firstNewline >= 0
            ? trimmed.slice(firstNewline + 1, -3).replace(/^\n+|\n+$/g, '')
            : trimmed.slice(3, -3).trim();

          const codeLines = innerBody.split('\n');

          return (
            <div key={idx} className="my-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{headerLine || 'terminal'}</span>
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Bash CLI</span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
                <code>
                  {codeLines.map((line, lIdx) => {
                    const isCommand = line.includes('usuario@linux:~$') || line.trim().startsWith('$ ');
                    const isComment = line.trim().startsWith('#');
                    const lineClass = isCommand
                      ? 'text-cyan-300 font-semibold block my-0.5'
                      : isComment
                        ? 'text-slate-500 italic block my-0.5'
                        : 'text-emerald-300/90 block my-0.5';

                    return (
                      <span key={lIdx} className={lineClass}>
                        {line}
                      </span>
                    );
                  })}
                </code>
              </pre>
            </div>
          );
        }

        // 4. Markdown Table: | col1 | col2 |
        if (isMarkdownTable(trimmed)) {
          const tableLines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
          const headers = parseTableRow(tableLines[0]);
          const alignments = getColumnAlignments(tableLines[1]);
          const bodyRows = tableLines.slice(2).map(parseTableRow);

          const alignClass = (colIndex: number) => {
            const align = alignments[colIndex] || 'left';
            if (align === 'center') return 'text-center';
            if (align === 'right') return 'text-right';
            return 'text-left';
          };

          return (
            <div key={idx} className="my-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-600/80 shadow-xs bg-white dark:bg-slate-800/90">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    {headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className={`px-4 py-3 font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap ${alignClass(hIdx)}`}
                      >
                        {renderInlineFormatting(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      {headers.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 text-slate-700 dark:text-slate-200 align-top leading-relaxed ${alignClass(cIdx)}`}
                        >
                          {renderInlineFormatting(row[cIdx] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 5. Headings: #, ##, ###
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2.5">
              {renderInlineFormatting(trimmed.substring(2))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-7 mb-3 flex items-center gap-2.5">
              <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block shrink-0"></span>
              <span>{renderInlineFormatting(trimmed.substring(3))}</span>
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">
              {renderInlineFormatting(trimmed.substring(4))}
            </h3>
          );
        }

        // 6. Horizontal rule: ---
        if (/^-{3,}$/.test(trimmed)) {
          return <hr key={idx} className="my-6 border-slate-200 dark:border-slate-700/80" />;
        }

        // 7. Blockquote / Callout card: >
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
          const isWarning = /⚠️|cuidado|advertencia|peligro|crítico/i.test(quoteLines);
          const isTip = /💡|tip\s*pro|atajo|consejo/i.test(quoteLines);

          const boxStyle = isWarning
            ? 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-500 text-amber-950 dark:text-amber-100'
            : isTip
              ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              : 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-600 text-slate-800 dark:text-slate-200';

          const IconComp = isWarning ? AlertTriangle : isTip ? Lightbulb : Info;
          const iconColor = isWarning
            ? 'text-amber-600 dark:text-amber-400'
            : isTip
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-indigo-600 dark:text-indigo-400';

          return (
            <div key={idx} className={`my-4 p-4 sm:p-5 rounded-2xl border-l-4 shadow-xs flex gap-3.5 ${boxStyle}`}>
              <IconComp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                {renderInlineFormatting(quoteLines)}
              </div>
            </div>
          );
        }

        // 8. Ordered list: 1. 2. 3.
        if (trimmed.split('\n').every(line => /^\s*\d+\.\s+/.test(line))) {
          const items = trimmed.split('\n').map(l => l.replace(/^\s*\d+\.\s+/, ''));
          return (
            <ol key={idx} className="my-4 space-y-3 pl-1 sm:pl-2">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/70 dark:border-indigo-700/60">
                    {itemIdx + 1}
                  </span>
                  <span className="leading-relaxed">{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // 9. Bullet list: - or *
        if (trimmed.split('\n').every(line => /^\s*[-*]\s+/.test(line))) {
          const items = trimmed.split('\n').map(l => l.replace(/^\s*[-*]\s+/, ''));
          return (
            <ul key={idx} className="my-4 space-y-2.5 pl-2 sm:pl-4">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2.5"></span>
                  <span className="leading-relaxed">{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // 10. Standard Paragraph with inline formatting
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
 * Parses inline code (`code`), bold (**text**), and italics (*text*) recursively
 * so bold/italic phrases containing inline code chips render without stray backticks.
 */
function renderInlineFormatting(text: string, depth: number = 0): React.ReactNode {
  if (!text || depth > 4) return text;

  const parts = text.split(/(`[^`]+`|\*\*(?:(?!\*\*).)+\*\*|\*(?:[^*\n]|`[^`]+`)+\*)/g);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] sm:text-xs border border-slate-200 dark:border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {renderInlineFormatting(part.slice(2, -2), depth + 1)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-slate-200">
          {renderInlineFormatting(part.slice(1, -1), depth + 1)}
        </em>
      );
    }
    return part;
  });
}
