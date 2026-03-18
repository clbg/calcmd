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

    const headerLine = lines[0];
    const columns = this.parseHeader(headerLine);

    // Build alias map
    const aliases = new Map<string, string>();
    for (const col of columns) {
      if (col.alias) {
        if (aliases.has(col.alias.toLowerCase())) {
          this.addError('parse', undefined, col.name, `Duplicate column alias '#${col.alias}'`);
        } else {
          aliases.set(col.alias.toLowerCase(), col.name);
        }
      }
    }

    // Skip separator line, parse data rows
    const rows: Row[] = [];
    for (let i = 2; i < lines.length; i++) {
      const rowLine = lines[i].trim();
      if (!rowLine) continue;
      const row = this.parseRow(rowLine, columns.length);
      if (row) rows.push(row);
    }

    const table: Table = { columns, rows, labels: new Map(), aliases };

    // Identify row labels: scan all cells for @label: value pattern
    rows.forEach((row, index) => {
      for (let c = 0; c < row.cells.length; c++) {
        const cell = row.cells[c];
        if (cell.value && typeof cell.value === 'string') {
          const labelMatch = this.extractLabel(cell.value);
          if (labelMatch) {
            if (row.label !== undefined) {
              this.addError('parse', index, columns[c]?.name,
                `Row ${index} has multiple labels: '@${row.label}' and '@${labelMatch.label}'`);
              break;
            }
            row.label = labelMatch.label;
            // Replace cell value with the actual value after label
            cell.value = this.parseValue(labelMatch.value);

            if (table.labels.has(labelMatch.label)) {
              this.addError('parse', index, columns[c]?.name,
                `Duplicate label '@${labelMatch.label}'`);
            } else {
              table.labels.set(labelMatch.label, index);
            }
          }
        }
      }
    });

    return {
      ...table,
      dependencies: { nodes: new Map(), edges: new Map(), order: [] },
      errors: this.errors
    };
  }

  /**
   * Extract @label from a cell value.
   * Patterns:
   *   "@label: value"  → label + value
   *   "@label"         → label + "@label" as value (shorthand)
   */
  private extractLabel(raw: string): { label: string; value: string } | null {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('@')) return null;

    // @label: value (colon + space)
    const colonIdx = trimmed.indexOf(': ');
    if (colonIdx > 1) {
      const label = trimmed.slice(1, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 2).trim();
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label)) {
        return { label, value };
      }
    }

    // Bare @label (no colon) — shorthand
    const bare = trimmed.slice(1).trim();
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(bare)) {
      return { label: bare, value: trimmed }; // cell value stays as "@label"
    }

    return null;
  }

  private parseHeader(line: string): Column[] {
    const cells = this.splitRow(line);
    return cells.map(cell => {
      const trimmed = cell.trim();

      // Step 1: split on first '=' for column formula
      let namePart = trimmed;
      let formula: string | undefined;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex > 0) {
        namePart = trimmed.slice(0, equalsIndex).trim();
        formula = trimmed.slice(equalsIndex + 1).trim();
      }

      // Step 2: extract #alias from name part
      let alias: string | undefined;
      const hashMatch = namePart.match(/\s+#([a-zA-Z_][a-zA-Z0-9_]*)$/);
      if (hashMatch) {
        alias = hashMatch[1];
        namePart = namePart.slice(0, hashMatch.index!).trim();
      }

      const col: Column = { name: namePart, cells: [] };
      if (alias) col.alias = alias;
      if (formula) col.formula = formula;
      return col;
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
    trimmed = trimmed.replace(/^\*\*(.*)\*\*$/, '$1');
    trimmed = trimmed.replace(/^__(.*)\__$/, '$1');
    if (!trimmed.includes('=')) {
      trimmed = trimmed.replace(/^\*(.*)\*$/, '$1');
      trimmed = trimmed.replace(/^_(.*)_$/, '$1');
    }
    trimmed = trimmed.trim();

    if (!trimmed) {
      return { value: null };
    }

    // Formula with display value: "3000=Qty*Price"
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex > 0) {
      const displayValue = trimmed.slice(0, equalsIndex).trim();
      const formula = trimmed.slice(equalsIndex + 1).trim();
      return { value: this.parseValue(displayValue), formula };
    }

    // Formula only: "=Qty*Price"
    if (trimmed.startsWith('=')) {
      return { value: null, formula: trimmed.slice(1).trim() };
    }

    return { value: this.parseValue(trimmed) };
  }

  private parseValue(str: string): number | string | boolean | null {
    if (str === '') return null;
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    const num = Number(str);
    if (!isNaN(num) && str.trim() !== '') return num;
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    return str;
  }

  private splitRow(line: string): string[] {
    return line.split('|').slice(1, -1).map(cell => cell.trim());
  }

  private addError(type: ValidationError['type'], row: number | undefined, column: string | undefined, message: string) {
    this.errors.push({ type, row, column, message });
  }

  private emptyTable(): ParsedTable {
    return {
      columns: [], rows: [], labels: new Map(), aliases: new Map(),
      dependencies: { nodes: new Map(), edges: new Map(), order: [] },
      errors: this.errors
    };
  }
}
