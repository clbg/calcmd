// CalcMD Core Types
//
// This file is the single source of truth for all shared types and AST definitions.
// Every other file imports from here — do not scatter type definitions elsewhere.
//
// Data flow overview:
//   markdown string
//     → Parser       produces: Table (columns, rows, labels, aliases)
//     → Evaluator    produces: ParsedTable (adds dependencies + errors + cell.computed)

// --- Primitive value types ---

// The only value types a cell can hold. No objects, no arrays — keeps evaluation sandboxed.
export type CellValue = number | string | boolean | null;

// --- Table structure ---

// A single cell in the table.
//
// Example — cell "4.5=Qty*Price" parsed from markdown:
//   { value: 4.5, formula: 'Qty*Price', effectiveFormula: 'Qty*Price', computed: 4.5 }
//
// Example — plain cell "Apple":
//   { value: 'Apple' }
//
// Example — cell with a runtime error:
//   { value: null, formula: 'Qty/0', effectiveFormula: 'Qty/0', error: 'Division by zero' }
export interface Cell {
  value: CellValue;
  formula?: string; // Formula written directly in this cell, e.g. "sum(Total)"
  effectiveFormula?: string; // Resolved formula after expansion: cell formula ?? column formula
  computed?: CellValue; // Result after evaluation (undefined until Evaluator runs)
  error?: string; // Runtime error message, if evaluation failed
}

// A column in the table, parsed from the header row.
//
// Example — header "| Adjusted Gross Income #agi | Tax=agi*0.22 |":
//   { name: 'Adjusted Gross Income', alias: 'agi', cells: [] }
//   { name: 'Tax', formula: 'agi*0.22', cells: [] }
export interface Column {
  name: string; // Display name, e.g. "Adjusted Gross Income"
  alias?: string; // Short name from #alias syntax, e.g. "agi"
  formula?: string; // Column-level formula applied to every row, e.g. "Qty*Price"
  cells: Cell[];
}

// A data row in the table.
//
// Example — row "| @wages: Gross Income | 85000 |":
//   { label: 'wages', cells: [{ value: 'Gross Income' }, { value: 85000 }] }
export interface Row {
  label?: string; // Optional @label for cross-row references
  cells: Cell[];
}

// The full parsed table structure produced by the Parser.
//
// Example — after parsing a 3-column, 2-row table:
//   {
//     columns: [{ name: 'Item' }, { name: 'Qty' }, { name: 'Total', formula: 'Qty*Price' }],
//     rows:    [{ cells: [{value:'Apple'}, {value:3}, {value:4.5}] }],
//     labels:  Map { 'wages' → 0 },   // row index by label name
//     aliases: Map { 'agi' → 'Adjusted Gross Income' }
//   }
export interface Table {
  columns: Column[];
  rows: Row[];
  labels: Map<string, number>; // @label name → row index
  aliases: Map<string, string>; // alias → column display name
}

// Table after the Evaluator has run — adds dependency graph, computed values, and errors.
export interface ParsedTable extends Table {
  dependencies: DependencyGraph;
  errors: ValidationError[];
}

// --- Dependency graph ---

// Directed graph of cell-to-cell dependencies used for topological sort.
//
// Example — formula 'Qty*Price' in cell R0.C2:
//   nodes: Map { 'R0.C2' → { id:'R0.C2', row:0, col:2, formula:'Qty*Price' } }
//   edges: Map { 'R0.C2' → Set { 'R0.C0', 'R0.C1' } }
//   order: ['R0.C0', 'R0.C1', 'R0.C2']  ← dependencies evaluated first
export interface DependencyGraph {
  nodes: Map<string, CellNode>; // "R{row}.C{col}" → node
  edges: Map<string, Set<string>>; // from → Set<to>  (from depends on to)
  order: string[]; // topological evaluation order (dependencies first)
}

// A single node in the dependency graph, representing one formula cell.
export interface CellNode {
  id: string; // "R{row}.C{col}", e.g. "R0.C2"
  row: number;
  col: number;
  formula?: string; // effective formula for this cell
}

// An error collected during parsing or evaluation (never thrown — callers check result.errors).
//
// Example:
//   { type: 'runtime', row: 2, column: 'Total', message: 'Division by zero' }
export interface ValidationError {
  type: 'parse' | 'validation' | 'runtime';
  row?: number;
  column?: string;
  message: string;
}

// Context passed to the Evaluator when computing a single cell's formula.
// Provides everything needed to resolve column refs, label refs, and aggregations.
export interface EvaluationContext {
  currentRow: Row;
  rowIndex: number;
  table: Table;
  columns: Map<string, Column>; // name → Column (includes underscore-normalized names)
  aliases: Map<string, string>; // alias → column name
  labels: Map<string, number>; // @label → row index
}

// --- Expression AST ---
//
// The FormulaParser turns a formula string into a tree of Expression nodes.
// The Evaluator then recursively walks this tree to compute a CellValue.
//
// Example — "round(Qty * Price, 2)":
//   {
//     type: 'function', name: 'round',
//     args: [
//       { type: 'binary', operator: '*',
//         left:  { type: 'column',  name: 'Qty' },
//         right: { type: 'column',  name: 'Price' } },
//       { type: 'literal', value: 2 }
//     ]
//   }

export type Expression =
  | LiteralExpression
  | ColumnRefExpression
  | LabelRefExpression
  | BinaryExpression
  | UnaryExpression
  | FunctionCallExpression
  | ParenExpression;

// A constant value inline in the formula.
// Examples: 42, 3.14, "hello", true
export interface LiteralExpression {
  type: 'literal';
  value: CellValue;
}

// A reference to a column in the current row.
// Example: "Qty" → reads the Qty cell of the current row
export interface ColumnRefExpression {
  type: 'column';
  name: string;
}

// A reference to a labeled row, optionally scoped to a column.
// Example: "@wages"        → last numeric value in the 'wages' row
// Example: "@wages.Amount" → Amount cell in the 'wages' row
export interface LabelRefExpression {
  type: 'label';
  label: string;
  column?: string;
}

// A binary operation between two expressions.
// Example: "Qty * Price" → { operator: '*', left: Qty, right: Price }
export interface BinaryExpression {
  type: 'binary';
  operator: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '>' | '<' | '>=' | '<=' | 'and' | 'or';
  left: Expression;
  right: Expression;
}

// A unary operation on a single expression.
// Example: "-Total" → { operator: '-', operand: Total }
// Example: "not Flag" → { operator: 'not', operand: Flag }
export interface UnaryExpression {
  type: 'unary';
  operator: '-' | 'not';
  operand: Expression;
}

// A call to a built-in function (whitelist-only — no arbitrary code execution).
// Example: "sum(Amount)" → { name: 'sum', args: [{ type: 'column', name: 'Amount' }] }
// Example: "if(A > 0, A, 0)" → { name: 'if', args: [A>0, A, 0] }
export interface FunctionCallExpression {
  type: 'function';
  name: string;
  args: Expression[];
}

// A parenthesized expression — preserves grouping from the source formula.
// Example: "(Qty + 1) * Price" → the (Qty+1) part becomes a ParenExpression
export interface ParenExpression {
  type: 'paren';
  expression: Expression;
}
