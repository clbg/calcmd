import React from 'react';
import { ParsedTable, CellValue } from '@calcmd/core';

export interface PreviewProps {
  table: ParsedTable;
  selectedCell: {row: number; col: number} | null;
  onCellClick: (row: number, col: number) => void;
}

const Preview: React.FC<PreviewProps> = ({ table, selectedCell, onCellClick }) => {
  const formatValue = (value: CellValue): string => {
    if (value === null) return '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  const getCellClass = (rowIndex: number, colIndex: number): string => {
    const classes = ['preview-cell'];
    
    const cell = table.rows[rowIndex].cells[colIndex];
    const column = table.columns[colIndex];
    
    // Has formula
    if (cell.formula || column.formula) {
      classes.push('has-formula');
      // Aggregation formula
      if (/sum|avg|min|max|count/i.test(cell.formula ?? '')) {
        classes.push('has-agg');
      }
    }
    
    // Has error
    if (cell.error) {
      classes.push('has-error');
    }
    
    // Selected
    if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
      classes.push('selected');
    }
    
    // Row with labeled cell
    if (table.rows[rowIndex].cells.some(c => c.label)) {
      classes.push('label-row');
    }
    
    return classes.join(' ');
  };

  const getCellTitle = (rowIndex: number, colIndex: number): string => {
    const cell = table.rows[rowIndex].cells[colIndex];
    const column = table.columns[colIndex];
    
    const parts: string[] = [];
    
    if (column.formula) {
      parts.push(`Column formula: ${column.formula}`);
    }
    if (cell.formula) {
      parts.push(`Cell formula: ${cell.formula}`);
    }
    if (cell.computed !== undefined) {
      parts.push(`Computed: ${cell.computed}`);
    }
    if (cell.error) {
      parts.push(`Error: ${cell.error}`);
    }
    
    return parts.join('\n');
  };

  return (
    <div className="preview-container">
      <table className="preview-table">
        <thead>
          <tr>
            {table.columns.map((col, i) => (
              <th key={i} className="preview-header">
                <div className="header-content">
                  <span className="header-name">{col.name}</span>
                  {col.formula && (
                    <span className="header-formula">= {col.formula}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={getCellClass(rowIndex, colIndex)}
                  title={getCellTitle(rowIndex, colIndex)}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                >
                  <div className="cell-content">
                    {cell.error ? (
                      <span className="cell-error">#ERROR</span>
                    ) : (
                      <>
                        <span className="cell-value">
                          {formatValue(cell.computed !== undefined ? cell.computed : cell.value)}
                        </span>
                        {cell.formula && (
                          <span className="cell-formula-indicator">ƒ</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Preview;
