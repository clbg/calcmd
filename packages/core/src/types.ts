// CalcMD shared TypeScript types
// Rust/WASM serializes to plain JSON; the JS wrapper normalizes to this shape.

export type CellValue = number | string | boolean | null;

export interface Cell {
  value: CellValue;
  label?: string;
  formula?: string;
  effectiveFormula?: string;
  computed?: CellValue;
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
  /** edges: Map<cellId, Set<depId>> — normalized from Rust's plain object output */
  edges: Map<string, Set<string>>;
  order: string[];
}

export interface ValidationError {
  /** Serialized as "type" in JSON from Rust */
  type: string;
  row?: number;
  column?: string;
  message: string;
}

export interface ParsedTable {
  table: Table;
  dependencies: DependencyGraph;
  errors: ValidationError[];
  /** Convenience alias for table.rows */
  rows: Row[];
  /** Convenience alias for table.columns */
  columns: Column[];
}
