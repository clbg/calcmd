// CalcMD Parser: Markdown → AST

import { Table, Column, Row, Cell, ParsedTable, ValidationError } from './types';

export class Parser {
  private errors: ValidationError[] = [];

  parse(markdown: string): ParsedTable {
    this.errors = [];
    
    const lines = markdown.trim().split('\n');
    if (lines.length < 2) {
      this.addError('parse', undefined, undefined, 'Table must have at least header and separator rows');
      return this.emptyTable();
    }

    // Parse header
    const headerLine = lines[0];
    const columns = this.parseHeader(headerLine);
    
    // Skip separator line (|---|---|)
    // Parse data rows
    const rows: Row[] = [];
    for (let i = 2; i < lines.length; i++) {
      const rowLine = lines[i].trim();
      if (!rowLine) continue;
      
      const row = this.parseRow(rowLine, columns.length);
      if (row) {
        rows.push(row);
      }
    }

    const table: Table = { columns, rows, labels: new Map() };
    
    // Identify row labels (@label)
    rows.forEach((row, index) => {
      if (row.cells[0]?.value && typeof row.cells[0].value === 'string') {
        const firstCell = row.cells[0].value.trim();
        if (firstCell.startsWith('@')) {
          const label = firstCell.slice(1); // Remove @
          row.label = label;
          table.labels.set(label, index);
        }
      }
    });

    return {
      ...table,
      dependencies: { nodes: new Map(), edges: new Map() },
      errors: this.errors
    };
  }

  private parseHeader(line: string): Column[] {
    const cells = this.splitRow(line);
    return cells.map(cell => {
      const trimmed = cell.trim();
      
      // Check for column formula: "Total=Qty*Price"
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex > 0) {
        const name = trimmed.slice(0, equalsIndex).trim();
        const formula = trimmed.slice(equalsIndex + 1).trim();
        return { name, formula, cells: [] };
      }
      
      return { name: trimmed, cells: [] };
    });
  }

  private parseRow(line: string, expectedColumns: number): Row | null {
    const cellStrings = this.splitRow(line);
    
    if (cellStrings.length !== expectedColumns) {
      this.addError('parse', undefined, undefined, 
        `Row has ${cellStrings.length} columns, expected ${expectedColumns}`);
      return null;
    }

    const cells: Cell[] = cellStrings.map(cellStr => this.parseCell(cellStr));
    return { cells };
  }

  private parseCell(cellStr: string): Cell {
    let trimmed = cellStr.trim();
    
    // Remove Markdown formatting (bold, italic)
    // **bold** or __bold__
    trimmed = trimmed.replace(/^\*\*(.*)\*\*$/, '$1');
    trimmed = trimmed.replace(/^__(.*)\__$/, '$1');
    // *italic* or _italic_ (only if not formula)
    if (!trimmed.includes('=')) {
      trimmed = trimmed.replace(/^\*(.*)\*$/, '$1');
      trimmed = trimmed.replace(/^_(.*)_$/, '$1');
    }
    trimmed = trimmed.trim();
    
    // Empty cell
    if (!trimmed) {
      return { value: null };
    }

    // Check for formula with display value: "3000=Qty*Price"
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex > 0) {
      const displayValue = trimmed.slice(0, equalsIndex).trim();
      const formula = trimmed.slice(equalsIndex + 1).trim();
      
      return {
        value: this.parseValue(displayValue),
        formula
      };
    }

    // Check for formula only: "=Qty*Price"
    if (trimmed.startsWith('=')) {
      return {
        value: null,
        formula: trimmed.slice(1).trim()
      };
    }

    // Plain value
    return { value: this.parseValue(trimmed) };
  }

  private parseValue(str: string): number | string | boolean | null {
    if (str === '') return null;
    
    // Boolean
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    
    // Number
    const num = Number(str);
    if (!isNaN(num)) return num;
    
    // String (remove quotes if present)
    if ((str.startsWith('"') && str.endsWith('"')) || 
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    
    return str;
  }

  private splitRow(line: string): string[] {
    // Simple pipe-split (doesn't handle escaped pipes yet)
    return line
      .split('|')
      .slice(1, -1)  // Remove first and last empty strings
      .map(cell => cell.trim());
  }

  private addError(
    type: ValidationError['type'],
    row: number | undefined,
    column: string | undefined,
    message: string
  ) {
    this.errors.push({ type, row, column, message });
  }

  private emptyTable(): ParsedTable {
    return {
      columns: [],
      rows: [],
      labels: new Map(),
      dependencies: { nodes: new Map(), edges: new Map() },
      errors: this.errors
    };
  }
}
