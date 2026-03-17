// CalcMD Core Types

export type CellValue = number | string | boolean | null;

export interface Cell {
  value: CellValue;
  formula?: string;  // Raw formula string (e.g., "=Qty*Price")
  computed?: CellValue;  // Computed result
  error?: string;
}

export interface Column {
  name: string;
  formula?: string;  // Column-level formula (e.g., "Qty*Price")
  cells: Cell[];
}

export interface Row {
  label?: string;  // Optional @label for row reference
  cells: Cell[];
}

export interface Table {
  columns: Column[];
  rows: Row[];
  labels: Map<string, number>;  // @label → row index
}

export interface ParsedTable extends Table {
  dependencies: DependencyGraph;
  errors: ValidationError[];
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;  // column name → node
  edges: Map<string, Set<string>>;     // from → to
}

export interface DependencyNode {
  column: string;
  formula?: string;
  dependsOn: string[];  // List of column names this depends on
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
  columns: Map<string, Column>;
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
  column?: string;  // Optional: @label.Column
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
