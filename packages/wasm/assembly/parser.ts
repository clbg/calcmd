// CalcMD Parser: Markdown → AST (WASM version)

import {
  Table,
  Column,
  Row,
  Cell,
  ParsedTable,
  ValidationError,
  LabelLocation,
  DependencyGraph,
  CellValue,
  CellValueType,
  NullValue,
} from './types';
import { parseValue, isValidIdentifier } from './utils';

export class Parser {
  private errors: ValidationError[] = [];

  parse(markdown: string): ParsedTable {
    this.errors = [];

    const lines = markdown.trim().split('\n');
    if (lines.length < 2) {
      this.addError('parse', -1, '', 'Table must have at least header and separator rows');
      return this.emptyTable();
    }

    const headerLine = lines[0];
    const columns = this.parseHeader(headerLine);

    // Build alias map
    const aliases = new Map<string, string>();
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col.alias !== null) {
        const aliasLower = col.alias!.toLowerCase();
        if (aliases.has(aliasLower)) {
          this.addError('parse', -1, col.name, 'Duplicate column alias #' + col.alias!);
        } else {
          aliases.set(aliasLower, col.name);
        }
      }
    }

    // Skip separator line, parse data rows
    const rows: Row[] = [];
    for (let i = 2; i < lines.length; i++) {
      const rowLine = lines[i].trim();
      if (rowLine.length === 0) continue;
      const row = this.parseRow(rowLine, columns.length);
      if (row !== null) rows.push(row);
    }

    const table = new ParsedTable();
    table.columns = columns;
    table.rows = rows;
    table.aliases = aliases;

    // Identify cell labels
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      for (let c = 0; c < row.cells.length; c++) {
        const cell = row.cells[c];
        if (cell.value.getType() === CellValueType.STRING) {
          // string
          const labelMatch = this.extractLabel(cell.value.toString());
          if (labelMatch !== null) {
            cell.label = labelMatch.label;
            cell.value = parseValue(labelMatch.value);

            if (table.labels.has(labelMatch.label)) {
              this.addError(
                'parse',
                rowIndex,
                columns[c].name,
                'Duplicate label @' + labelMatch.label,
              );
            } else {
              table.labels.set(labelMatch.label, new LabelLocation(rowIndex, c));
            }
          }
        }
      }
    }

    table.errors = this.errors;
    return table;
  }

  private extractLabel(raw: string): LabelMatch | null {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('@')) return null;

    // @label: value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 1) {
      const label = trimmed.substring(1, colonIdx).trim();
      if (isValidIdentifier(label)) {
        const value = trimmed.substring(colonIdx + 1).trim();
        return new LabelMatch(label, value);
      }
    }

    // Bare @label
    const bare = trimmed.substring(1).trim();
    if (isValidIdentifier(bare)) {
      return new LabelMatch(bare, trimmed);
    }

    return null;
  }

  private parseHeader(line: string): Column[] {
    const cells = this.splitRow(line);
    const columns: Column[] = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const trimmed = cell.trim();

      // Split on first '=' for column formula
      let namePart = trimmed;
      let formula: string | null = null;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex > 0) {
        namePart = trimmed.substring(0, equalsIndex).trim();
        formula = trimmed.substring(equalsIndex + 1).trim();
      }

      // Extract #alias from name part
      let alias: string | null = null;
      const hashIndex = namePart.indexOf(' #');
      if (hashIndex > 0) {
        const potentialAlias = namePart.substring(hashIndex + 2).trim();
        if (isValidIdentifier(potentialAlias)) {
          alias = potentialAlias;
          namePart = namePart.substring(0, hashIndex).trim();
        }
      }

      const col = new Column(namePart);
      if (alias !== null) col.alias = alias;
      if (formula !== null) col.formula = formula;
      columns.push(col);
    }

    return columns;
  }

  private parseRow(line: string, expectedColumns: i32): Row | null {
    const cellStrings = this.splitRow(line);

    if (cellStrings.length !== expectedColumns) {
      this.addError(
        'parse',
        -1,
        '',
        'Row has ' +
          cellStrings.length.toString() +
          ' columns, expected ' +
          expectedColumns.toString(),
      );
      return null;
    }

    const row = new Row();
    for (let i = 0; i < cellStrings.length; i++) {
      row.cells.push(this.parseCell(cellStrings[i]));
    }
    return row;
  }

  private parseCell(cellStr: string): Cell {
    let trimmed = cellStr.trim();
    let bold = false;

    // Detect and remove bold formatting
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      bold = true;
      trimmed = trimmed.substring(2, trimmed.length - 2);
    } else if (trimmed.startsWith('__') && trimmed.endsWith('__') && trimmed.length > 4) {
      bold = true;
      trimmed = trimmed.substring(2, trimmed.length - 2);
    }

    // Remove italic formatting (only if not a formula)
    if (trimmed.indexOf('=') < 0) {
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
        trimmed = trimmed.substring(1, trimmed.length - 1);
      } else if (trimmed.startsWith('_') && trimmed.endsWith('_') && trimmed.length > 2) {
        trimmed = trimmed.substring(1, trimmed.length - 1);
      }
    }
    trimmed = trimmed.trim();

    if (trimmed.length === 0) {
      const cell = new Cell(new NullValue());
      cell.bold = bold;
      return cell;
    }

    // Formula with display value: "3000=Qty*Price"
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex > 0) {
      const displayValue = trimmed.substring(0, equalsIndex).trim();
      const formula = trimmed.substring(equalsIndex + 1).trim();
      const cell = new Cell(parseValue(displayValue));
      cell.formula = formula;
      cell.bold = bold;
      return cell;
    }

    // Formula only: "=Qty*Price"
    if (trimmed.startsWith('=')) {
      const cell = new Cell(new NullValue());
      cell.formula = trimmed.substring(1).trim();
      cell.bold = bold;
      return cell;
    }

    const cell = new Cell(parseValue(trimmed));
    cell.bold = bold;
    return cell;
  }

  private splitRow(line: string): string[] {
    const parts = line.split('|');
    const result: string[] = [];

    // Skip first and last (empty due to leading/trailing |)
    for (let i = 1; i < parts.length - 1; i++) {
      result.push(parts[i].trim());
    }

    return result;
  }

  private addError(type: string, row: i32, column: string, message: string): void {
    const error = new ValidationError(type, message);
    error.row = row;
    error.column = column;
    this.errors.push(error);
  }

  private emptyTable(): ParsedTable {
    const table = new ParsedTable();
    table.errors = this.errors;
    return table;
  }
}

class LabelMatch {
  label: string;
  value: string;

  constructor(label: string, value: string) {
    this.label = label;
    this.value = value;
  }
}
