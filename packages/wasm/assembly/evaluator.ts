// CalcMD Evaluator (WASM version)

import {
  ParsedTable,
  ValidationError,
  Expression,
  LiteralExpression,
  ColumnRefExpression,
  LabelRefExpression,
  BinaryExpression,
  UnaryExpression,
  FunctionCallExpression,
  ParenExpression,
  CellValue,
  CellValueType,
  NumberValue,
  StringValue,
  BooleanValue,
  NullValue,
  ErrorValue,
  Column,
} from './types';
import { FormulaParser } from './formula-parser';
import { EvaluationContext } from './evaluator-context';
import { DependencyGraphBuilder } from './dependency-graph';
import { Functions } from './evaluator-functions';
import { cellId, isError, makeError } from './utils';

export class Evaluator {
  private parser: FormulaParser = new FormulaParser();
  private errors: ValidationError[] = [];

  evaluate(table: ParsedTable): ParsedTable {
    this.errors = [];
    this.expand(table);
    const graph = DependencyGraphBuilder.build(table, this.parser);
    table.dependencies = graph;
    this.computeInOrder(table);

    // Append new errors to existing ones
    for (let i = 0; i < this.errors.length; i++) {
      table.errors.push(this.errors[i]);
    }

    return table;
  }

  private expand(table: ParsedTable): void {
    for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
      const row = table.rows[rowIdx];
      for (let colIdx = 0; colIdx < table.columns.length; colIdx++) {
        const col = table.columns[colIdx];
        const cell = row.cells[colIdx];

        if (cell.formula !== null) {
          cell.effectiveFormula = cell.formula;
          cell.isColumnFormula = false;
        } else if (col.formula !== null) {
          cell.effectiveFormula = col.formula;
          cell.isColumnFormula = true;
        }
      }
    }
  }

  private computeInOrder(table: ParsedTable): void {
    const ctx = this.makeBaseContext(table);
    const graph = table.dependencies;

    for (let i = 0; i < graph.order.length; i++) {
      const id = graph.order[i];
      const node = graph.nodes.get(id);
      if (node === null || node.formula === null) continue;

      const row = table.rows[node.row];
      const col = table.columns[node.col];
      const cell = row.cells[node.col];

      const ast = this.parser.parse(node.formula!);
      if (ast === null) {
        const errorMsg = 'Failed to parse formula';
        cell.error = errorMsg;
        this.addError('runtime', node.row, col.name, errorMsg);
      } else {
        const evalCtx = new EvaluationContext(
          row,
          node.row,
          node.col,
          table,
          ctx.columns,
          ctx.columnIndices,
          ctx.aliases,
          table.labels,
        );
        const result = this.evaluateExpression(ast, evalCtx);

        if (isError(result)) {
          const errorMsg = (result as ErrorValue).message;
          cell.error = errorMsg;
          cell.computed = null;
          this.addError('runtime', node.row, col.name, errorMsg);
        } else {
          cell.computed = result;
        }
      }
    }

    // Mark circular dependency errors
    const nodeKeys = graph.nodes.keys();
    for (let i = 0; i < nodeKeys.length; i++) {
      const id = nodeKeys[i];
      let found = false;
      for (let j = 0; j < graph.order.length; j++) {
        if (graph.order[j] === id) {
          found = true;
          break;
        }
      }

      if (!found) {
        const node = graph.nodes.get(id)!;
        const cell = table.rows[node.row].cells[node.col];
        if (cell.error === null) {
          cell.error = 'Circular dependency';
          this.addError('runtime', node.row, table.columns[node.col].name, 'Circular dependency');
        }
      }
    }
  }

  private makeBaseContext(table: ParsedTable): BaseContext {
    const columns = new Map<string, Column>();
    const columnIndices = new Map<string, i32>();
    const aliases = new Map<string, string>();

    for (let i = 0; i < table.columns.length; i++) {
      const col = table.columns[i];
      const lowerName = col.name.toLowerCase();

      columns.set(lowerName, col);
      columnIndices.set(lowerName, i);

      if (col.alias !== null) {
        const lowerAlias = col.alias!.toLowerCase();
        aliases.set(lowerAlias, col.name);
        columnIndices.set(lowerAlias, i);
      }

      // Normalized name (spaces to underscores)
      const normalized = col.name.split(' ').join('_').toLowerCase();
      if (!columns.has(normalized)) {
        columns.set(normalized, col);
        columnIndices.set(normalized, i);
      }
    }

    return new BaseContext(columns, columnIndices, aliases);
  }

  private evaluateExpression(expr: Expression, ctx: EvaluationContext): CellValue {
    if (expr instanceof LiteralExpression) {
      const lit = expr as LiteralExpression;
      return lit.value;
    }

    if (expr instanceof ColumnRefExpression) {
      const colRef = expr as ColumnRefExpression;
      return this.evaluateColumnRef(colRef.name, ctx);
    }

    if (expr instanceof LabelRefExpression) {
      const labelRef = expr as LabelRefExpression;
      return this.evaluateLabelRef(labelRef.label, ctx);
    }

    if (expr instanceof BinaryExpression) {
      const binExpr = expr as BinaryExpression;
      return this.evaluateBinary(binExpr, ctx);
    }

    if (expr instanceof UnaryExpression) {
      const unExpr = expr as UnaryExpression;
      return this.evaluateUnary(unExpr, ctx);
    }

    if (expr instanceof FunctionCallExpression) {
      const funcExpr = expr as FunctionCallExpression;
      return this.evaluateFunction(funcExpr.name, funcExpr.args, ctx);
    }

    if (expr instanceof ParenExpression) {
      const parenExpr = expr as ParenExpression;
      return this.evaluateExpression(parenExpr.expression, ctx);
    }

    // Unknown expression type - return error
    return makeError('Unknown expression type');
  }

  private evaluateColumnRef(name: string, ctx: EvaluationContext): CellValue {
    const lowerName = name.toLowerCase();

    if (ctx.columnIndices.has(lowerName)) {
      const index = ctx.columnIndices.get(lowerName);
      const cell = ctx.currentRow.cells[index];
      return cell.computed !== null ? cell.computed! : cell.value;
    }

    // Try alias
    if (ctx.aliases.has(lowerName)) {
      const aliasTarget = ctx.aliases.get(lowerName);
      const aliasLower = aliasTarget.toLowerCase();
      if (ctx.columnIndices.has(aliasLower)) {
        const aliasIndex = ctx.columnIndices.get(aliasLower);
        const cell = ctx.currentRow.cells[aliasIndex];
        return cell.computed !== null ? cell.computed! : cell.value;
      }
    }

    return makeError('Column ' + name + ' not found');
  }

  private evaluateLabelRef(label: string, ctx: EvaluationContext): CellValue {
    if (!ctx.labels.has(label)) {
      return makeError('Label @' + label + ' not found');
    }

    const loc = ctx.labels.get(label);
    const row = ctx.table.rows[loc.row];
    const cell = row.cells[loc.col];
    return cell.computed !== null ? cell.computed! : cell.value;
  }

  private evaluateBinary(expr: BinaryExpression, ctx: EvaluationContext): CellValue {
    const left = this.evaluateExpression(expr.left, ctx);
    const right = this.evaluateExpression(expr.right, ctx);
    const op = expr.operator;

    // Propagate errors
    if (isError(left)) return left;
    if (isError(right)) return right;

    if (left.getType() === CellValueType.NULL || right.getType() === CellValueType.NULL) {
      if (op === '==') return new BooleanValue(left.getType() === right.getType());
      if (op === '!=') return new BooleanValue(left.getType() !== right.getType());
      return new NullValue();
    }

    if (op === '+') {
      if (left.getType() === CellValueType.NUMBER && right.getType() === CellValueType.NUMBER) {
        return new NumberValue(left.toNumber() + right.toNumber());
      }
      if (left.getType() === CellValueType.STRING && right.getType() === CellValueType.STRING) {
        return new StringValue(left.toString() + right.toString());
      }
      return makeError(
        'Cannot add ' + this.typeName(left) + ' and ' + this.typeName(right),
      );
    }

    if (op === '-' || op === '*' || op === '/' || op === '%') {
      if (left.getType() !== CellValueType.NUMBER || right.getType() !== CellValueType.NUMBER) {
        return makeError('Cannot perform arithmetic on non-numbers');
      }
      const l = left.toNumber();
      const r = right.toNumber();

      if (op === '-') return new NumberValue(l - r);
      if (op === '*') return new NumberValue(l * r);
      if (op === '/') {
        if (r === 0) return makeError('Division by zero');
        return new NumberValue(l / r);
      }
      if (op === '%') return new NumberValue(l % r);
    }

    if (op === '==' || op === '!=') {
      const equal = this.valuesEqual(left, right);
      return new BooleanValue(op === '==' ? equal : !equal);
    }

    if (op === '>' || op === '<' || op === '>=' || op === '<=') {
      if (left.getType() !== right.getType()) {
        return makeError('Cannot compare different types');
      }
      if (left.getType() === CellValueType.NUMBER) {
        const l = left.toNumber();
        const r = right.toNumber();
        if (op === '>') return new BooleanValue(l > r);
        if (op === '<') return new BooleanValue(l < r);
        if (op === '>=') return new BooleanValue(l >= r);
        if (op === '<=') return new BooleanValue(l <= r);
      }
      if (left.getType() === CellValueType.STRING) {
        const l = left.toString();
        const r = right.toString();
        if (op === '>') return new BooleanValue(l > r);
        if (op === '<') return new BooleanValue(l < r);
        if (op === '>=') return new BooleanValue(l >= r);
        if (op === '<=') return new BooleanValue(l <= r);
      }
      return makeError('Cannot compare these types');
    }

    if (op === 'and') {
      return new BooleanValue(left.toBoolean() && right.toBoolean());
    }

    if (op === 'or') {
      return new BooleanValue(left.toBoolean() || right.toBoolean());
    }

    return makeError('Unknown operator: ' + op);
  }

  private evaluateUnary(expr: UnaryExpression, ctx: EvaluationContext): CellValue {
    const operand = this.evaluateExpression(expr.operand, ctx);
    const op = expr.operator;

    if (isError(operand)) return operand;

    if (op === '-') {
      if (operand.getType() !== CellValueType.NUMBER) {
        return makeError('Cannot negate non-number');
      }
      return new NumberValue(-operand.toNumber());
    }

    if (op === 'not') {
      return new BooleanValue(!operand.toBoolean());
    }

    return makeError('Unknown unary operator: ' + op);
  }

  private evaluateFunction(name: string, args: Expression[], ctx: EvaluationContext): CellValue {
    const lowerName = name.toLowerCase();

    // Aggregation functions
    if (
      lowerName === 'sum' ||
      lowerName === 'avg' ||
      lowerName === 'average' ||
      lowerName === 'count' ||
      lowerName === 'min' ||
      lowerName === 'max'
    ) {
      return this.evaluateAggregation(lowerName, args, ctx);
    }

    // round(value, decimals?)
    if (lowerName === 'round') {
      if (args.length < 1 || args.length > 2) {
        return makeError('ROUND requires 1 or 2 arguments');
      }
      const value = this.evaluateExpression(args[0], ctx);
      if (isError(value)) return value;
      if (value.getType() !== CellValueType.NUMBER)
        return makeError('ROUND first argument must be a number');

      const decimals =
        args.length === 2 ? this.evaluateExpression(args[1], ctx) : new NumberValue(0);
      if (isError(decimals)) return decimals;
      if (decimals.getType() !== CellValueType.NUMBER)
        return makeError('ROUND second argument must be a number');

      return new NumberValue(Functions.round(value.toNumber(), decimals.toNumber()));
    }

    // Single-argument math functions: abs, floor, ceil
    if (lowerName === 'abs') return this.evaluateSingleArgMath('ABS', args, ctx, Functions.abs);
    if (lowerName === 'floor') return this.evaluateSingleArgMath('FLOOR', args, ctx, Functions.floor);
    if (lowerName === 'ceil') return this.evaluateSingleArgMath('CEIL', args, ctx, Functions.ceil);

    // if(condition, trueVal, falseVal)
    if (lowerName === 'if') {
      if (args.length !== 3) return makeError('IF requires exactly 3 arguments');
      const condition = this.evaluateExpression(args[0], ctx);
      if (isError(condition)) return condition;
      return condition.toBoolean()
        ? this.evaluateExpression(args[1], ctx)
        : this.evaluateExpression(args[2], ctx);
    }

    return makeError('Unknown function: ' + name);
  }

  private evaluateSingleArgMath(
    funcName: string,
    args: Expression[],
    ctx: EvaluationContext,
    fn: (v: f64) => f64,
  ): CellValue {
    if (args.length !== 1) return makeError(funcName + ' requires exactly 1 argument');
    const value = this.evaluateExpression(args[0], ctx);
    if (isError(value)) return value;
    if (value.getType() !== CellValueType.NUMBER) return makeError(funcName + ' argument must be a number');
    return new NumberValue(fn(value.toNumber()));
  }

  private evaluateAggregation(
    funcName: string,
    args: Expression[],
    ctx: EvaluationContext,
  ): CellValue {
    if (args.length !== 1) {
      return makeError(funcName.toUpperCase() + ' requires exactly 1 argument');
    }

    if (!(args[0] instanceof ColumnRefExpression)) {
      return makeError(
        funcName.toUpperCase() + ' argument must be a column name',
      );
    }

    const colRef = args[0] as ColumnRefExpression;
    const columnName = colRef.name;
    const lowerName = columnName.toLowerCase();

    if (!ctx.columnIndices.has(lowerName)) {
      return makeError('Column ' + columnName + ' not found');
    }

    const index = ctx.columnIndices.get(lowerName);
    const cell = ctx.table.rows[ctx.rowIndex].cells[ctx.colIndex];
    const isColumnFormula = cell.isColumnFormula;
    const values = Functions.getColumnValues(index, ctx, isColumnFormula);

    if (funcName === 'sum') {
      return new NumberValue(Functions.sum(values));
    }
    if (funcName === 'avg' || funcName === 'average') {
      return new NumberValue(Functions.avg(values));
    }
    if (funcName === 'count') {
      return new NumberValue(Functions.count(values));
    }
    if (funcName === 'min') {
      return new NumberValue(Functions.min(values));
    }
    if (funcName === 'max') {
      return new NumberValue(Functions.max(values));
    }

    return makeError('Unknown aggregation function: ' + funcName);
  }

  private valuesEqual(left: CellValue, right: CellValue): bool {
    if (left.getType() !== right.getType()) return false;

    const type = left.getType();
    if (type === CellValueType.NUMBER) return left.toNumber() === right.toNumber();
    if (type === CellValueType.STRING) return left.toString() === right.toString();
    if (type === CellValueType.BOOLEAN) return left.toBoolean() === right.toBoolean();
    if (type === CellValueType.NULL) return true;

    return false;
  }

  private typeName(value: CellValue): string {
    const type = value.getType();
    if (type === CellValueType.NUMBER) return 'number';
    if (type === CellValueType.STRING) return 'string';
    if (type === CellValueType.BOOLEAN) return 'boolean';
    if (type === CellValueType.NULL) return 'null';
    if (type === CellValueType.ERROR) return 'error';
    return 'unknown';
  }

  private addError(type: string, row: i32, column: string, message: string): void {
    const error = new ValidationError(type, message);
    error.row = row;
    error.column = column;
    this.errors.push(error);
  }
}

class BaseContext {
  columns: Map<string, Column>;
  columnIndices: Map<string, i32>;
  aliases: Map<string, string>;

  constructor(
    columns: Map<string, Column>,
    columnIndices: Map<string, i32>,
    aliases: Map<string, string>,
  ) {
    this.columns = columns;
    this.columnIndices = columnIndices;
    this.aliases = aliases;
  }
}
