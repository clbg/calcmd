import React, { useCallback, useState } from 'react';
import type { ParsedTable, CellValue } from '@calcmd/core';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  parsedTable?: ParsedTable;
  onShare?: () => Promise<boolean>;
}

// --- Placeholder implementations ---

function formatMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    // Collect a contiguous block of table rows
    if (lines[i].trim().startsWith('|')) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        block.push(lines[i]);
        i++;
      }
      result.push(...formatTableBlock(block));
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

/** Visual width of a string — CJK characters count as 2 */
function strWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    // CJK Unified, CJK Extension A/B, Fullwidth, Hangul, Hiragana, Katakana, etc.
    w +=
      cp >= 0x1100 &&
      (cp <= 0x115f || // Hangul Jamo
        cp === 0x2329 ||
        cp === 0x232a ||
        (cp >= 0x2e80 && cp <= 0x303e) || // CJK Radicals / Kangxi
        (cp >= 0x3040 && cp <= 0xa4cf) || // Hiragana … Yi
        (cp >= 0xa960 && cp <= 0xa97f) || // Hangul Jamo Extended-A
        (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul Syllables
        (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
        (cp >= 0xfe10 && cp <= 0xfe19) || // Vertical forms
        (cp >= 0xfe30 && cp <= 0xfe6f) || // CJK Compatibility Forms
        (cp >= 0xff00 && cp <= 0xff60) || // Fullwidth Forms
        (cp >= 0xffe0 && cp <= 0xffe6) ||
        (cp >= 0x1b000 && cp <= 0x1b0ff) ||
        (cp >= 0x1f004 && cp <= 0x1f0cf) ||
        (cp >= 0x1f200 && cp <= 0x1f251) ||
        (cp >= 0x20000 && cp <= 0x2fffd) || // CJK Extension B–F
        (cp >= 0x30000 && cp <= 0x3fffd))
        ? 2
        : 1;
  }
  return w;
}

/** Pad a string to a target visual width */
function padToWidth(s: string, width: number): string {
  const fill = width - strWidth(s);
  return fill > 0 ? s + ' '.repeat(fill) : s;
}

/** Split a table row into trimmed cell strings (strips leading/trailing pipes) */
function splitRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const stripped = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return stripped.split('|').map((c) => c.trim());
}

/** True if a cell is a separator cell like ---, :---, ---:, :---: */
function isSepCell(cell: string): boolean {
  return /^:?-+:?$/.test(cell);
}

/** Re-render a separator cell at a given width, preserving alignment markers */
function formatSepCell(cell: string, width: number): string {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  const dashes = '-'.repeat(Math.max(1, width - (left ? 1 : 0) - (right ? 1 : 0)));
  return `${left ? ':' : ''}${dashes}${right ? ':' : ''}`;
}

function formatTableBlock(block: string[]): string[] {
  const parsed = block.map(splitRow);

  // Compute column count (max across all rows)
  const colCount = Math.max(...parsed.map((r) => r.length));

  // Compute max visual width per column
  const widths = Array.from({ length: colCount }, (_, ci) =>
    Math.max(3, ...parsed.map((r) => strWidth(r[ci] ?? ''))),
  );

  return parsed.map((cells) => {
    const isSep = cells.every((c) => isSepCell(c) || c === '');
    const padded = Array.from({ length: colCount }, (_, ci) => {
      const cell = cells[ci] ?? '';
      if (isSep) {
        return padToWidth(formatSepCell(cell || '---', widths[ci]), widths[ci]);
      }
      return padToWidth(cell, widths[ci]);
    });
    return `| ${padded.join(' | ')} |`;
  });
}

function fillComputedValues(markdown: string, table: ParsedTable): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let rowIdx = 0; // tracks which data row we're on (skips header + separator)
  let inTable = false;
  let headerDone = false;
  let sepDone = false;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      // Reset table state when we leave a table block
      inTable = false;
      headerDone = false;
      sepDone = false;
      rowIdx = 0;
      result.push(line);
      continue;
    }

    if (!inTable) {
      inTable = true;
      headerDone = false;
      sepDone = false;
      rowIdx = 0;
    }

    if (!headerDone) {
      // Header row — pass through unchanged
      result.push(line);
      headerDone = true;
      continue;
    }

    if (!sepDone) {
      // Separator row — pass through unchanged
      result.push(line);
      sepDone = true;
      continue;
    }

    // Data row — rewrite cells that have computed values
    const dataRow = table.rows[rowIdx];
    if (!dataRow) {
      result.push(line);
      rowIdx++;
      continue;
    }

    const rawCells = line
      .trim()
      .slice(1, -1) // strip outer pipes
      .split('|');

    const rewritten = rawCells.map((rawCell, colIdx) => {
      const cell = dataRow.cells[colIdx];
      const col = table.columns[colIdx];
      if (!cell || !col) return rawCell;

      const formula = cell.effectiveFormula;
      if (!formula || cell.error || cell.computed === undefined) return rawCell;

      const val = formatValue(cell.computed);
      // Cell has its own formula (aggregation) → bold; column formula → plain
      const isCellFormula = !!cell.formula;
      const filled = isCellFormula ? `**${val}=${formula}**` : `${val}=${formula}`;
      // Preserve surrounding whitespace from original cell
      const leading = rawCell.match(/^(\s*)/)?.[1] ?? ' ';
      const trailing = rawCell.match(/(\s*)$/)?.[1] ?? ' ';
      return `${leading}${filled}${trailing}`;
    });

    result.push(`|${rewritten.join('|')}|`);
    rowIdx++;
  }

  return result.join('\n');
}

function formatValue(v: CellValue): string {
  if (v === null) return '';
  if (typeof v === 'number') {
    // Avoid floating point noise: cap at 10 significant digits
    return parseFloat(v.toPrecision(10)).toString();
  }
  return String(v);
}

// returns true on success, false on failure
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// --- Toolbar button ---

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, disabled, children }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      background: 'transparent',
      border: '1px solid var(--border)',
      color: disabled ? 'var(--border)' : 'var(--muted)',
      padding: '0.25rem 0.6rem',
      borderRadius: 5,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.75rem',
      fontFamily: 'inherit',
      transition: 'color 0.15s, border-color 0.15s',
      whiteSpace: 'nowrap',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
    }}
    onMouseLeave={(e) => {
      if (disabled) return;
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
    }}
  >
    {children}
  </button>
);

// --- Editor ---

const Editor: React.FC<EditorProps> = ({ value, onChange, parsedTable, onShare }) => {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'err'>('idle');
  const [shared, setShared] = useState<'idle' | 'ok' | 'err'>('idle');

  const handleFormat = useCallback(() => {
    onChange(formatMarkdown(value));
  }, [value, onChange]);

  const handleFill = useCallback(() => {
    if (!parsedTable) return;
    onChange(fillComputedValues(value, parsedTable));
  }, [value, onChange, parsedTable]);

  const handleCopy = useCallback(() => {
    copyToClipboard(value).then((ok) => {
      setCopied(ok ? 'ok' : 'err');
      setTimeout(() => setCopied('idle'), 1800);
    });
  }, [value]);

  const handleShare = useCallback(() => {
    if (!onShare) return;
    onShare().then((ok) => {
      setShared(ok ? 'ok' : 'err');
      setTimeout(() => setShared('idle'), 1800);
    });
  }, [onShare]);

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <ToolbarButton onClick={handleFormat} title="Auto-align markdown table columns">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2h14v1.5H1zm0 4h10v1.5H1zm0 4h14v1.5H1zm0 4h10v1.5H1z" />
            </svg>
            Format
          </ToolbarButton>

          <ToolbarButton
            onClick={handleFill}
            title="Evaluate formulas and fill computed values"
            disabled={!parsedTable}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5L9.5 1H3zm6 .5L13.5 5H10a1 1 0 0 1-1-1V1.5zM5 8.5h1.5V7H8v1.5h1.5V10H8v1.5H6.5V10H5V8.5z" />
            </svg>
            Fill Values
          </ToolbarButton>

          <ToolbarButton onClick={handleCopy} title="Copy markdown to clipboard">
            {copied === 'ok' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                </svg>
                Copied
              </>
            ) : copied === 'err' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 5v4.5h1.5V5h-1.5zm0 5.5V12h1.5v-1.5h-1.5z" />
                </svg>
                Failed
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1H8v1H2V5h1V4H2z" />
                </svg>
                Copy
              </>
            )}
          </ToolbarButton>
        </div>

        {onShare && (
          <button
            onClick={handleShare}
            title="Copy share link to clipboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: shared === 'ok' ? 'rgba(88,166,255,0.15)' : 'rgba(88,166,255,0.08)',
              border: `1px solid ${shared === 'err' ? 'var(--error)' : 'var(--accent)'}`,
              color: shared === 'err' ? 'var(--error)' : 'var(--accent)',
              padding: '0.25rem 0.75rem',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
              fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {shared === 'ok' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                </svg>
                Link Copied
              </>
            ) : shared === 'err' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 5v4.5h1.5V5h-1.5zm0 5.5V12h1.5v-1.5h-1.5z" />
                </svg>
                Failed
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z" />
                </svg>
                Share
              </>
            )}
          </button>
        )}
      </div>

      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};

export default Editor;
