// CalcMD WASM Utilities
// Helper functions for value parsing and formatting

import { CellValue, NumberValue, StringValue, BooleanValue, NullValue } from './types';

export const DISPLAY_PRECISION: i32 = 6;

// Value parsing (domain-specific, keep)
export function parseValue(str: string): CellValue {
  const trimmed = str.trim();

  if (trimmed.length === 0) {
    return new NullValue();
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'true') {
    return new BooleanValue(true);
  }
  if (lower === 'false') {
    return new BooleanValue(false);
  }

  // Try to parse as number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return new NumberValue(num);
  }

  // Remove quotes if present
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return new StringValue(trimmed.substring(1, trimmed.length - 1));
  }

  return new StringValue(trimmed);
}

// Value formatting (domain-specific, keep)
export function formatValue(v: CellValue): string {
  const type = v.getType();

  if (type === 3) {
    // null
    return '';
  }

  if (type === 2) {
    // boolean
    return v.toBoolean() ? 'true' : 'false';
  }

  if (type === 0) {
    // number
    const num = v.toNumber();
    return formatNumber(num, DISPLAY_PRECISION);
  }

  return v.toString();
}

function formatNumber(num: f64, precision: i32): string {
  // Simple number formatting
  if (num === 0) return '0';

  const absNum = Math.abs(num);

  // For very large or very small numbers, use exponential notation
  if (absNum >= 1e15 || (absNum < 1e-6 && absNum > 0)) {
    return num.toString();
  }

  // Round to precision decimal places
  const factor = Math.pow(10, precision);
  const rounded = Math.round(num * factor) / factor;

  return rounded.toString();
}

// Identifier validation (domain-specific, keep)
export function isValidIdentifier(s: string): bool {
  if (s.length === 0) return false;

  const first = s.charCodeAt(0);
  if (!isAlpha(first) && first !== 95) return false; // Must start with letter or _

  for (let i = 1; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (!isAlphaNumeric(code) && code !== 95) return false;
  }

  return true;
}

function isAlpha(code: i32): bool {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAlphaNumeric(code: i32): bool {
  return isAlpha(code) || (code >= 48 && code <= 57);
}

export function isDigit(code: i32): bool {
  return code >= 48 && code <= 57;
}

// Cell ID generation (domain-specific, keep)
export function cellId(row: i32, col: i32): string {
  return 'R' + row.toString() + '.C' + col.toString();
}
