import init, { calcmd as wasmCalcmd } from '../pkg/calcmd_wasm.js';

export interface CellValue {
  type: 'number' | 'string' | 'boolean' | 'null';
  value: number | string | boolean | null;
}

export interface Cell {
  value: number | string | boolean | null;
  label?: string;
  formula?: string;
  effectiveFormula?: string;
  computed?: number | string | boolean | null;
  error?: string;
  bold?: boolean;
  isColumnFormula?: boolean;
}

export interface Row {
  cells: Cell[];
}

export interface Column {
  name: string;
  alias?: string;
  formula?: string;
  cells: Cell[];
}

export interface LabelLocation {
  row: number;
  col: number;
}

export interface Table {
  columns: Column[];
  rows: Row[];
  labels: Record<string, LabelLocation>;
  aliases: Record<string, string>;
}

export interface CellNode {
  id: string;
  row: number;
  col: number;
  formula?: string;
}

export interface DependencyGraph {
  nodes: Record<string, CellNode>;
  edges: Record<string, string[]>;
  order: string[];
}

export interface ValidationError {
  error_type: string;
  row?: number;
  column?: string;
  message: string;
}

export interface ParsedTable {
  table: Table;
  dependencies: DependencyGraph;
  errors: ValidationError[];
}

let initialized = false;

/**
 * Initialize the WASM module. Must be called before using calcmd().
 * This is automatically called on first use, but you can call it explicitly
 * to control when the WASM module is loaded.
 *
 * @param wasmModule - Optional WASM module or buffer (for Node.js)
 */
export async function initialize(wasmModule?: WebAssembly.Module | BufferSource): Promise<void> {
  if (!initialized) {
    if (wasmModule) {
      await init(wasmModule);
    } else {
      await init();
    }
    initialized = true;
  }
}

/**
 * Parse and evaluate a CalcMD markdown table.
 *
 * @param markdown - The markdown table string with CalcMD formulas
 * @returns ParsedTable with computed values and any errors
 *
 * @example
 * ```typescript
 * const result = await calcmd(`
 * | Item | Qty | Price | Total=Qty*Price |
 * |------|-----|-------|-----------------|
 * | Apple | 3 | 1.5 | |
 * | Banana | 5 | 0.8 | |
 * `);
 *
 * console.log(result.table.rows[0].cells[3].computed); // 4.5
 * ```
 */
export async function calcmd(markdown: string): Promise<ParsedTable> {
  await initialize();
  const resultJson = wasmCalcmd(markdown);
  return JSON.parse(resultJson) as ParsedTable;
}

/**
 * Synchronous version of calcmd(). Only use this after calling initialize().
 * Throws an error if the WASM module is not initialized.
 *
 * @param markdown - The markdown table string with CalcMD formulas
 * @returns ParsedTable with computed values and any errors
 */
export function calcmdSync(markdown: string): ParsedTable {
  if (!initialized) {
    throw new Error('WASM module not initialized. Call initialize() or use calcmd() instead.');
  }
  const resultJson = wasmCalcmd(markdown);
  return JSON.parse(resultJson) as ParsedTable;
}

// Re-export types for convenience
export type {
  CellValue as Value,
  Cell as CellData,
  Row as RowData,
  Column as ColumnData,
  Table as TableData,
};
