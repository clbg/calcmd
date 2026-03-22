// CalcMD WASM Types
// Ported from @calcmd/core/src/types.ts to AssemblyScript

// AssemblyScript doesn't support union types, so we use classes with inheritance

// --- Cell Value Type Constants ---
export namespace CellValueType {
  export const NUMBER: u8 = 0;
  export const STRING: u8 = 1;
  export const BOOLEAN: u8 = 2;
  export const NULL: u8 = 3;
  export const ERROR: u8 = 4;
}

// --- Cell Value Types ---

// Base class for all cell values
export abstract class CellValue {
  abstract getType(): u8;
  abstract toString(): string;
  abstract toNumber(): f64;
  abstract toBoolean(): bool;
}

export class NumberValue extends CellValue {
  value: f64;

  constructor(value: f64) {
    super();
    this.value = value;
  }

  getType(): u8 {
    return CellValueType.NUMBER;
  }
  toString(): string {
    return this.value.toString();
  }
  toNumber(): f64 {
    return this.value;
  }
  toBoolean(): bool {
    return this.value !== 0;
  }
}

export class StringValue extends CellValue {
  value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  getType(): u8 {
    return CellValueType.STRING;
  }
  toString(): string {
    return this.value;
  }
  toNumber(): f64 {
    return parseFloat(this.value);
  }
  toBoolean(): bool {
    return this.value.length > 0;
  }
}

export class BooleanValue extends CellValue {
  value: bool;

  constructor(value: bool) {
    super();
    this.value = value;
  }

  getType(): u8 {
    return CellValueType.BOOLEAN;
  }
  toString(): string {
    return this.value ? 'true' : 'false';
  }
  toNumber(): f64 {
    return this.value ? 1.0 : 0.0;
  }
  toBoolean(): bool {
    return this.value;
  }
}

export class NullValue extends CellValue {
  getType(): u8 {
    return CellValueType.NULL;
  }
  toString(): string {
    return '';
  }
  toNumber(): f64 {
    return 0.0;
  }
  toBoolean(): bool {
    return false;
  }
}

export class ErrorValue extends CellValue {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  getType(): u8 {
    return CellValueType.ERROR;
  }
  toString(): string {
    return this.message;
  }
  toNumber(): f64 {
    return 0.0;
  }
  toBoolean(): bool {
    return false;
  }
}

// --- Table Structure ---

export class Cell {
  value: CellValue;
  label: string | null = null;
  formula: string | null = null;
  effectiveFormula: string | null = null;
  computed: CellValue | null = null;
  error: string | null = null;
  bold: bool = false;
  isColumnFormula: bool = false;

  constructor(value: CellValue) {
    this.value = value;
  }
}

export class Column {
  name: string;
  alias: string | null = null;
  formula: string | null = null;
  cells: Cell[] = [];

  constructor(name: string) {
    this.name = name;
  }
}

export class Row {
  cells: Cell[] = [];

  constructor() {}
}

export class LabelLocation {
  row: i32;
  col: i32;

  constructor(row: i32, col: i32) {
    this.row = row;
    this.col = col;
  }
}

export class Table {
  columns: Column[] = [];
  rows: Row[] = [];
  labels: Map<string, LabelLocation> = new Map();
  aliases: Map<string, string> = new Map();

  constructor() {}
}

export class ValidationError {
  type: string; // 'parse' | 'validation' | 'runtime'
  row: i32 = -1;
  column: string = '';
  message: string;

  constructor(type: string, message: string) {
    this.type = type;
    this.message = message;
  }
}

export class CellNode {
  id: string;
  row: i32;
  col: i32;
  formula: string | null = null;

  constructor(id: string, row: i32, col: i32) {
    this.id = id;
    this.row = row;
    this.col = col;
  }
}

export class DependencyGraph {
  nodes: Map<string, CellNode> = new Map();
  edges: Map<string, Set<string>> = new Map();
  order: string[] = [];

  constructor() {}
}

export class ParsedTable extends Table {
  dependencies: DependencyGraph = new DependencyGraph();
  errors: ValidationError[] = [];

  constructor() {
    super();
  }
}

// --- Expression AST ---

// Expression type constants
export namespace ExprType {
  export const LITERAL: u8 = 0;
  export const COLUMN_REF: u8 = 1;
  export const LABEL_REF: u8 = 2;
  export const BINARY: u8 = 3;
  export const UNARY: u8 = 4;
  export const FUNCTION_CALL: u8 = 5;
  export const PAREN: u8 = 6;
}

export abstract class Expression {
  abstract getType(): u8;
}

export class LiteralExpression extends Expression {
  value: CellValue;

  constructor(value: CellValue) {
    super();
    this.value = value;
  }

  getType(): u8 {
    return ExprType.LITERAL;
  }
}

export class ColumnRefExpression extends Expression {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  getType(): u8 {
    return ExprType.COLUMN_REF;
  }
}

export class LabelRefExpression extends Expression {
  label: string;

  constructor(label: string) {
    super();
    this.label = label;
  }

  getType(): u8 {
    return ExprType.LABEL_REF;
  }
}

export class BinaryExpression extends Expression {
  operator: string;
  left: Expression;
  right: Expression;

  constructor(operator: string, left: Expression, right: Expression) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  getType(): u8 {
    return ExprType.BINARY;
  }
}

export class UnaryExpression extends Expression {
  operator: string;
  operand: Expression;

  constructor(operator: string, operand: Expression) {
    super();
    this.operator = operator;
    this.operand = operand;
  }

  getType(): u8 {
    return ExprType.UNARY;
  }
}

export class FunctionCallExpression extends Expression {
  name: string;
  args: Expression[];

  constructor(name: string, args: Expression[]) {
    super();
    this.name = name;
    this.args = args;
  }

  getType(): u8 {
    return ExprType.FUNCTION_CALL;
  }
}

export class ParenExpression extends Expression {
  expression: Expression;

  constructor(expression: Expression) {
    super();
    this.expression = expression;
  }

  getType(): u8 {
    return ExprType.PAREN;
  }
}
