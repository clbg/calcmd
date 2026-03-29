import { calcmd as wasmCalcmd } from '../pkg/calcmd_wasm.js';
import type { ParsedTable, CellNode } from './types.js';

export type {
  ParsedTable,
  Cell,
  Column,
  Row,
  DependencyGraph,
  CellNode,
  ValidationError,
  LabelLocation,
  CellValue,
} from './types.js';
export { format, fill, formatValue, DISPLAY_PRECISION } from './utils.js';

/**
 * Parse and evaluate a CalcMD markdown table.
 * Returns a ParsedTable with computed values and any errors.
 *
 * In browser/bundler environments (Vite + vite-plugin-wasm), WASM is loaded
 * automatically. The returned object normalizes the Rust output:
 * - `result.rows` and `result.columns` alias `result.table.rows/columns`
 * - `result.dependencies.edges` is a Map<string, Set<string>>
 */
export function calcmd(markdown: string): ParsedTable {
  const raw = JSON.parse(wasmCalcmd(markdown)) as RawParsedTable;
  return normalize(raw);
}

// --- Internal normalization ---

interface RawParsedTable {
  table: {
    columns: ParsedTable['columns'];
    rows: ParsedTable['rows'];
    labels: ParsedTable['table']['labels'];
    aliases: ParsedTable['table']['aliases'];
  };
  dependencies: {
    nodes: Record<string, CellNode>;
    edges: Record<string, string[]>;
    order: string[];
  };
  errors: ParsedTable['errors'];
}

function normalize(raw: RawParsedTable): ParsedTable {
  const edgesMap = new Map<string, Set<string>>();
  for (const [key, deps] of Object.entries(raw.dependencies.edges)) {
    edgesMap.set(key, new Set(deps));
  }

  return {
    table: raw.table,
    dependencies: {
      nodes: raw.dependencies.nodes,
      edges: edgesMap,
      order: raw.dependencies.order,
    },
    rows: raw.table.rows,
    columns: raw.table.columns,
    errors: raw.errors,
  };
}
