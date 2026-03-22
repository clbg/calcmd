// Simple JSON serialization for ParsedTable

import { ParsedTable, CellValue, CellValueType } from './types';

export function serializeTable(table: ParsedTable): string {
  let json = '{';

  // Columns
  json += '"columns":[';
  for (let i = 0; i < table.columns.length; i++) {
    if (i > 0) json += ',';
    const col = table.columns[i];
    json += '{"name":"' + escapeString(col.name) + '"';
    if (col.alias !== null) {
      json += ',"alias":"' + escapeString(col.alias!) + '"';
    }
    if (col.formula !== null) {
      json += ',"formula":"' + escapeString(col.formula!) + '"';
    }
    json += '}';
  }
  json += '],';

  // Rows
  json += '"rows":[';
  for (let i = 0; i < table.rows.length; i++) {
    if (i > 0) json += ',';
    const row = table.rows[i];
    json += '{"cells":[';
    for (let j = 0; j < row.cells.length; j++) {
      if (j > 0) json += ',';
      const cell = row.cells[j];
      json += '{';
      json += '"value":' + serializeValue(cell.value);
      if (cell.label !== null) {
        json += ',"label":"' + escapeString(cell.label!) + '"';
      }
      if (cell.formula !== null) {
        json += ',"formula":"' + escapeString(cell.formula!) + '"';
      }
      if (cell.effectiveFormula !== null) {
        json += ',"effectiveFormula":"' + escapeString(cell.effectiveFormula!) + '"';
      }
      if (cell.computed !== null) {
        json += ',"computed":' + serializeValue(cell.computed!);
      }
      if (cell.error !== null) {
        json += ',"error":"' + escapeString(cell.error!) + '"';
      }
      if (cell.bold) {
        json += ',"bold":true';
      }
      if (cell.isColumnFormula) {
        json += ',"isColumnFormula":true';
      }
      json += '}';
    }
    json += ']}';
  }
  json += '],';

  // Errors
  json += '"errors":[';
  for (let i = 0; i < table.errors.length; i++) {
    if (i > 0) json += ',';
    const err = table.errors[i];
    json += '{"type":"' + escapeString(err.type) + '"';
    json += ',"message":"' + escapeString(err.message) + '"';
    if (err.row >= 0) {
      json += ',"row":' + err.row.toString();
    }
    if (err.column.length > 0) {
      json += ',"column":"' + escapeString(err.column) + '"';
    }
    json += '}';
  }
  json += ']';

  json += '}';
  return json;
}

function serializeValue(value: CellValue): string {
  const type = value.getType();

  if (type === CellValueType.NULL || type === CellValueType.ERROR) {
    return 'null';
  }

  if (type === CellValueType.BOOLEAN) {
    return value.toBoolean() ? 'true' : 'false';
  }

  if (type === CellValueType.NUMBER) {
    return value.toNumber().toString();
  }

  if (type === CellValueType.STRING) {
    return '"' + escapeString(value.toString()) + '"';
  }

  return 'null';
}

function escapeString(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    const code = s.charCodeAt(i);

    if (code === 34) {
      // "
      result += '\\"';
    } else if (code === 92) {
      // \
      result += '\\\\';
    } else if (code === 10) {
      // \n
      result += '\\n';
    } else if (code === 13) {
      // \r
      result += '\\r';
    } else if (code === 9) {
      // \t
      result += '\\t';
    } else {
      result += ch;
    }
  }
  return result;
}
