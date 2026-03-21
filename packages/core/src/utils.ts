// CalcMD Utilities
//
// format() — align markdown table columns (CJK-aware)
// fill()   — rewrite formula cells with their computed values

import type { ParsedTable, CellValue } from './types';

// --- format ---

/** Visual width of a string — CJK characters count as 2 */
function strWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    w +=
      cp >= 0x1100 &&
      (cp <= 0x115f ||
        cp === 0x2329 ||
        cp === 0x232a ||
        (cp >= 0x2e80 && cp <= 0x303e) ||
        (cp >= 0x3040 && cp <= 0xa4cf) ||
        (cp >= 0xa960 && cp <= 0xa97f) ||
        (cp >= 0xac00 && cp <= 0xd7a3) ||
        (cp >= 0xf900 && cp <= 0xfaff) ||
        (cp >= 0xfe10 && cp <= 0xfe19) ||
        (cp >= 0xfe30 && cp <= 0xfe6f) ||
        (cp >= 0xff00 && cp <= 0xff60) ||
        (cp >= 0xffe0 && cp <= 0xffe6) ||
        (cp >= 0x1b000 && cp <= 0x1b0ff) ||
        (cp >= 0x1f004 && cp <= 0x1f0cf) ||
        (cp >= 0x1f200 && cp <= 0x1f251) ||
        (cp >= 0x20000 && cp <= 0x2fffd) ||
        (cp >= 0x30000 && cp <= 0x3fffd))
        ? 2
        : 1;
  }
  return w;
}

function padToWidth(s: string, width: number): string {
  const fill = width - strWidth(s);
  return fill > 0 ? s + ' '.repeat(fill) : s;
}

function splitRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const stripped = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return stripped.split('|').map((c) => c.trim());
}

function isSepCell(cell: string): boolean {
  return /^:?-+:?$/.test(cell);
}

function formatSepCell(cell: string, width: number): string {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  const dashes = '-'.repeat(Math.max(1, width - (left ? 1 : 0) - (right ? 1 : 0)));
  return `${left ? ':' : ''}${dashes}${right ? ':' : ''}`;
}

function formatTableBlock(block: string[]): string[] {
  const parsed = block.map(splitRow);
  const colCount = Math.max(...parsed.map((r) => r.length));
  const widths = Array.from({ length: colCount }, (_, ci) =>
    Math.max(3, ...parsed.map((r) => strWidth(r[ci] ?? ''))),
  );
  return parsed.map((cells) => {
    const isSep = cells.every((c) => isSepCell(c) || c === '');
    const padded = Array.from({ length: colCount }, (_, ci) => {
      const cell = cells[ci] ?? '';
      if (isSep) return padToWidth(formatSepCell(cell || '---', widths[ci]), widths[ci]);
      return padToWidth(cell, widths[ci]);
    });
    return `| ${padded.join(' | ')} |`;
  });
}

/**
 * Auto-align all markdown table columns in a string.
 * CJK characters are counted as width 2.
 * Non-table lines are passed through unchanged.
 */
export function format(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
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

// --- fill ---

/**
 * Format a cell value for display or fill output.
 * Numbers are rounded to 15 significant digits (matching Excel's display behaviour)
 * to avoid surfacing IEEE 754 floating-point noise like 13.000000000000002.
 */
export function formatValue(v: CellValue): string {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return parseFloat(v.toPrecision(15)).toString();
  return String(v);
}

/**
 * Rewrite formula cells in the markdown source with their computed values.
 * Cells with a cell-level formula (aggregations) are wrapped in bold: **value=formula**
 * Cells with only a column-level formula use plain: value=formula
 *
 * Requires a ParsedTable from calcmd() — the markdown and table must be in sync.
 */
export function fill(markdown: string, table: ParsedTable): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let rowIdx = 0;
  let inTable = false;
  let headerDone = false;
  let sepDone = false;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
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
      result.push(line);
      headerDone = true;
      continue;
    }

    if (!sepDone) {
      result.push(line);
      sepDone = true;
      continue;
    }

    const dataRow = table.rows[rowIdx];
    if (!dataRow) {
      result.push(line);
      rowIdx++;
      continue;
    }

    const rawCells = line.trim().slice(1, -1).split('|');
    const rewritten = rawCells.map((rawCell, colIdx) => {
      const cell = dataRow.cells[colIdx];
      const col = table.columns[colIdx];
      if (!cell || !col) return rawCell;

      const formula = cell.effectiveFormula;
      if (!formula || cell.error || cell.computed === undefined) return rawCell;

      const val = formatValue(cell.computed);
      const isCellFormula = !!cell.formula;
      const filled = isCellFormula ? `**${val}=${formula}**` : `${val}=${formula}`;
      const leading = rawCell.match(/^(\s*)/)?.[1] ?? ' ';
      const trailing = rawCell.match(/(\s*)$/)?.[1] ?? ' ';
      return `${leading}${filled}${trailing}`;
    });

    result.push(`|${rewritten.join('|')}|`);
    rowIdx++;
  }

  return result.join('\n');
}
