import React, { useMemo, useState } from 'react';
import { ParsedTable, formatValue } from '@calcmd/core';

export interface PreviewProps {
  table: ParsedTable;
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

type CellRole = 'selected' | 'input' | 'dependent' | null;

function buildReverseDeps(table: ParsedTable): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();
  for (const [from, deps] of table.dependencies.edges) {
    for (const to of deps) {
      if (!reverse.has(to)) reverse.set(to, new Set());
      reverse.get(to)!.add(from);
    }
  }
  return reverse;
}

function cellId(row: number, col: number): string {
  return `R${row}.C${col}`;
}

const ROLE_STYLES: Record<NonNullable<CellRole>, React.CSSProperties> = {
  selected: {
    outline: '2px solid var(--accent)',
    outlineOffset: '-2px',
    background: 'rgba(88,166,255,0.12)',
  },
  input: {
    outline: '2px solid #3fb950',
    outlineOffset: '-2px',
    background: 'rgba(63,185,80,0.10)',
  },
  dependent: {
    outline: '2px solid rgba(210,153,34,0.9)',
    outlineOffset: '-2px',
    background: 'rgba(210,153,34,0.10)',
  },
};

const HEADER_ROLE_STYLES: Record<NonNullable<CellRole>, React.CSSProperties> = {
  selected: { borderBottom: '3px solid var(--accent)', background: 'rgba(88,166,255,0.12)' },
  input: { borderBottom: '3px solid #3fb950', background: 'rgba(63,185,80,0.10)' },
  dependent: {
    borderBottom: '3px solid rgba(210,153,34,0.9)',
    background: 'rgba(210,153,34,0.10)',
  },
};

const Preview: React.FC<PreviewProps> = ({ table, selectedCell, onCellClick }) => {
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const reverseDeps = useMemo(() => buildReverseDeps(table), [table]);

  // Cell-level role map (driven by selectedCell from parent)
  const cellRoleMap = useMemo((): Map<string, CellRole> => {
    const map = new Map<string, CellRole>();
    if (!selectedCell) return map;

    const id = cellId(selectedCell.row, selectedCell.col);
    map.set(id, 'selected');

    const deps = table.dependencies.edges.get(id);
    if (deps) for (const dep of deps) map.set(dep, 'input');

    const rdeps = reverseDeps.get(id);
    if (rdeps)
      for (const dep of rdeps) {
        if (!map.has(dep)) map.set(dep, 'dependent');
      }

    return map;
  }, [selectedCell, table, reverseDeps]);

  // Column-level role map (driven by selectedCol, internal state)
  const colRoleMap = useMemo((): Map<number, CellRole> => {
    const map = new Map<number, CellRole>();
    if (selectedCol === null) return map;

    map.set(selectedCol, 'selected');

    // Collect all cell ids in this column, find their deps/rdeps, map back to columns
    const rowCount = table.rows.length;
    const inputCols = new Set<number>();
    const dependentCols = new Set<number>();

    for (let r = 0; r < rowCount; r++) {
      const id = cellId(r, selectedCol);
      const deps = table.dependencies.edges.get(id);
      if (deps)
        for (const dep of deps) {
          const match = dep.match(/^R\d+\.C(\d+)$/);
          if (match) inputCols.add(Number(match[1]));
        }
      const rdeps = reverseDeps.get(id);
      if (rdeps)
        for (const dep of rdeps) {
          const match = dep.match(/^R\d+\.C(\d+)$/);
          if (match) dependentCols.add(Number(match[1]));
        }
    }

    for (const c of inputCols) if (c !== selectedCol) map.set(c, 'input');
    for (const c of dependentCols) if (!map.has(c)) map.set(c, 'dependent');

    return map;
  }, [selectedCol, table, reverseDeps]);

  const handleColClick = (colIndex: number) => {
    setSelectedCol((prev) => (prev === colIndex ? null : colIndex));
    // clear cell selection when clicking a column header
    onCellClick(-1, -1);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCol(null);
    onCellClick(row, col);
  };

  const getCellClass = (rowIndex: number, colIndex: number): string => {
    const classes = ['preview-cell'];
    const cell = table.rows[rowIndex].cells[colIndex];
    const column = table.columns[colIndex];
    if (cell.formula || column.formula) {
      classes.push('has-formula');
      if (/sum|avg|min|max|count/i.test(cell.formula ?? '')) classes.push('has-agg');
    }
    if (cell.error) classes.push('has-error');
    if (table.rows[rowIndex].cells.some((c) => c.label)) classes.push('label-row');
    return classes.join(' ');
  };

  const getCellTitle = (rowIndex: number, colIndex: number): string => {
    const cell = table.rows[rowIndex].cells[colIndex];
    const column = table.columns[colIndex];
    const parts: string[] = [];
    if (column.formula) parts.push(`Column formula: ${column.formula}`);
    if (cell.formula) parts.push(`Cell formula: ${cell.formula}`);
    if (cell.computed !== undefined) parts.push(`Computed: ${cell.computed}`);
    if (cell.error) parts.push(`Error: ${cell.error}`);
    return parts.join('\n');
  };

  return (
    <div className="preview-container">
      <table className="preview-table">
        <thead>
          <tr>
            {table.columns.map((col, i) => {
              // header role: column-mode takes priority, fall back to cell-mode aggregate
              const role = selectedCol !== null ? (colRoleMap.get(i) ?? null) : null;
              return (
                <th
                  key={i}
                  className="preview-header"
                  style={{ cursor: 'pointer', ...(role ? HEADER_ROLE_STYLES[role] : {}) }}
                  onClick={() => handleColClick(i)}
                  title={col.formula ? `Column formula: ${col.formula}` : undefined}
                >
                  <div className="header-content">
                    <span className="header-name">{col.name}</span>
                    {col.formula && <span className="header-formula">= {col.formula}</span>}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, colIndex) => {
                // cell role: cell-mode from parent only (column mode doesn't highlight cells)
                const role =
                  selectedCol !== null
                    ? null
                    : (cellRoleMap.get(cellId(rowIndex, colIndex)) ?? null);
                return (
                  <td
                    key={colIndex}
                    className={getCellClass(rowIndex, colIndex)}
                    title={getCellTitle(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    style={role ? ROLE_STYLES[role] : undefined}
                  >
                    <div className="cell-content">
                      {cell.error ? (
                        <span className="cell-error">#ERROR</span>
                      ) : (
                        <>
                          <span className="cell-value">
                            {formatValue(cell.computed !== undefined ? cell.computed : cell.value)}
                          </span>
                          {cell.formula && <span className="cell-formula-indicator">ƒ</span>}
                        </>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Preview;
