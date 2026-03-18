// CalcMD Core Types

export type CellValue = number | string | boolean | null;

export interface Cell {
  value: CellValue;
  formula?: string;        // Raw formula string (e.g., "Qty*Price")
  effectiveFormula?: string; // After expansion: cell formula or column formula
  computed?: CellValue;    // Computed result
  error?: string;
}

export interface Column {
  name: string;            // Display name (e.g., "Adjusted Gross Income")
  alias?: string;          // Optional #alias (e.g., "agi")
  formula?: string;        // Column-level formula template (e.g., "Qty*Price")
  cells: Cell[];
}

export interface Row {
  label?: string;          // Optional @label for row reference
  cells: Cell[];
}

export interface Table {
  columns: Column[];
  rows: Row[];
  labels: Map<string, number>;       // @label → row index
  aliases: Map<string, string>;      // alias → column display name
}

export interface ParsedTable extends Table {
  dependencies: DependencyGraph;
  errors: ValidationError[];
}

// Cell-granularity dependency graph
export interface DependencyGraph {
  nodes: Map<string, CellNode>;      // "R{row}.C{col}" → node
  edges: Map<string, Set<string>>;   // from → Set<to> (dependency edges)
  order: string[];                   // topological evaluation order
}

export interface CellNode {
  id: string;              // "R{row}.C{col}"
  row: number;
  col: number;
  formula?: string;        // effective formula for this cell
}

export interface ValidationError {
  type: 'parse' | 'validation' | 'runtime';
  row?: number;
  column?: string;
  message: string;
}

export interface EvaluationContext {
  currentRow: Row;
  rowIndex: number;
  table: Table;
  columns: Map<string, Column>;      // name → Column
  aliases: Map<string, string>;      // alias → column name
  labels: Map<string, number>;
}


// AST types for formula expressions
export type Expression =
  | LiteralExpression
  | ColumnRefExpression
  | LabelRefExpression
  | BinaryExpression
  | UnaryExpression
  | FunctionCallExpression
  | ParenExpression;

export interface LiteralExpression {
  type: 'literal';
  value: CellValue;
}

export interface ColumnRefExpression {
  type: 'column';
  name: string;
}

export interface LabelRefExpression {
  type: 'label';
  label: string;
  column?: string;
}

export interface BinaryExpression {
  type: 'binary';
  operator: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '>' | '<' | '>=' | '<=' | 'and' | 'or';
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'unary';
  operator: '-' | 'not';
  operand: Expression;
}

export interface FunctionCallExpression {
  type: 'function';
  name: string;
  args: Expression[];
}

export interface ParenExpression {
  type: 'paren';
  expression: Expression;
}
