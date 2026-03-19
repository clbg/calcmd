import React, { useCallback } from 'react';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
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

function fillComputedValues(markdown: string): string {
  // TODO: evaluate formulas and fill in computed values
  return markdown;
}

function copyToClipboard(text: string): void {
  // TODO: copy to clipboard with feedback
  navigator.clipboard.writeText(text).catch(() => {});
}

// --- Toolbar button ---

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      background: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--muted)',
      padding: '0.25rem 0.6rem',
      borderRadius: 5,
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontFamily: 'inherit',
      transition: 'color 0.15s, border-color 0.15s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
    }}
  >
    {children}
  </button>
);

// --- Editor ---

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  const handleFormat = useCallback(() => {
    onChange(formatMarkdown(value));
  }, [value, onChange]);

  const handleFill = useCallback(() => {
    onChange(fillComputedValues(value));
  }, [value, onChange]);

  const handleCopy = useCallback(() => {
    copyToClipboard(value);
  }, [value]);

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <ToolbarButton onClick={handleFormat} title="Auto-align markdown table columns">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2h14v1.5H1zm0 4h10v1.5H1zm0 4h14v1.5H1zm0 4h10v1.5H1z" />
          </svg>
          Format
        </ToolbarButton>

        <ToolbarButton onClick={handleFill} title="Evaluate formulas and fill computed values">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5L9.5 1H3zm6 .5L13.5 5H10a1 1 0 0 1-1-1V1.5zM5 8.5h1.5V7H8v1.5h1.5V10H8v1.5H6.5V10H5V8.5z" />
          </svg>
          Fill Values
        </ToolbarButton>

        <ToolbarButton onClick={handleCopy} title="Copy markdown to clipboard">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1H8v1H2V5h1V4H2z" />
          </svg>
          Copy
        </ToolbarButton>
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
