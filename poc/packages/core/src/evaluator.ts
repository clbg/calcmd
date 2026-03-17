// Formula Evaluator

import { 
  Expression, 
  EvaluationContext, 
  CellValue, 
  Table, 
  Column,
  ParsedTable,
  ValidationError 
} from './types';
import { FormulaParser } from './formula-parser';

export class Evaluator {
  private parser = new FormulaParser();
  private errors: ValidationError[] = [];

  evaluate(table: ParsedTable): ParsedTable {
    this.errors = [];

    // Step 1: Evaluate column formulas for each row
    table.rows.forEach((row, rowIndex) => {
      table.columns.forEach((column, colIndex) => {
        const cell = row.cells[colIndex];
        
        // Column-level formula
        if (column.formula) {
          try {
            const ast = this.parser.parse(column.formula);
            const context: EvaluationContext = {
              currentRow: row,
              rowIndex,
              table,
              columns: new Map(table.columns.map(c => [c.name, c])),
              labels: table.labels
            };
            cell.computed = this.evaluateExpression(ast, context);
          } catch (error) {
            cell.error = error instanceof Error ? error.message : String(error);
            this.addError('runtime', rowIndex, column.name, cell.error);
          }
        }
        
        // Cell-level formula
        else if (cell.formula) {
          try {
            const ast = this.parser.parse(cell.formula);
            const context: EvaluationContext = {
              currentRow: row,
              rowIndex,
              table,
              columns: new Map(table.columns.map(c => [c.name, c])),
              labels: table.labels
            };
            cell.computed = this.evaluateExpression(ast, context);
          } catch (error) {
            cell.error = error instanceof Error ? error.message : String(error);
            this.addError('runtime', rowIndex, column.name, cell.error);
          }
        }
      });
    });

    return {
      ...table,
      errors: [...table.errors, ...this.errors]
    };
  }

  private evaluateExpression(expr: Expression, ctx: EvaluationContext): CellValue {
    switch (expr.type) {
      case 'literal':
        return expr.value;

      case 'column':
        return this.evaluateColumnRef(expr.name, ctx);

      case 'label':
        return this.evaluateLabelRef(expr.label, expr.column, ctx);

      case 'binary':
        return this.evaluateBinary(expr, ctx);

      case 'unary':
        return this.evaluateUnary(expr, ctx);

      case 'function':
        return this.evaluateFunction(expr.name, expr.args, ctx);

      case 'paren':
        return this.evaluateExpression(expr.expression, ctx);

      default:
        throw new Error(`Unknown expression type: ${(expr as any).type}`);
    }
  }

  private evaluateColumnRef(name: string, ctx: EvaluationContext): CellValue {
    let column = ctx.columns.get(name);
    if (!column) {
      // Try case-insensitive match
      const lowerName = name.toLowerCase();
      for (const [colName, col] of ctx.columns) {
        if (colName.toLowerCase() === lowerName) {
          column = col;
          break;
        }
      }
      
      if (!column) {
        throw new Error(`Column '${name}' not found`);
      }
    }

    const colIndex = Array.from(ctx.columns.values()).indexOf(column);
    const cell = ctx.currentRow.cells[colIndex];
    
    return cell.computed !== undefined ? cell.computed : cell.value;
  }

  private evaluateLabelRef(label: string, columnName: string | undefined, ctx: EvaluationContext): CellValue {
    const rowIndex = ctx.labels.get(label);
    if (rowIndex === undefined) {
      throw new Error(`Label '@${label}' not found`);
    }

    const row = ctx.table.rows[rowIndex];
    
    // If specific column requested: @label.Column
    if (columnName) {
      const column = ctx.columns.get(columnName);
      if (!column) {
        throw new Error(`Column '${columnName}' not found in label reference`);
      }
      const colIndex = Array.from(ctx.columns.values()).indexOf(column);
      const cell = row.cells[colIndex];
      return cell.computed !== undefined ? cell.computed : cell.value;
    }
    
    // Otherwise, return the last numeric column value
    for (let i = row.cells.length - 1; i >= 0; i--) {
      const cell = row.cells[i];
      const value = cell.computed !== undefined ? cell.computed : cell.value;
      if (typeof value === 'number') {
        return value;
      }
    }
    
    throw new Error(`No numeric value found in row '@${label}'`);
  }

  private evaluateBinary(expr: any, ctx: EvaluationContext): CellValue {
    const left = this.evaluateExpression(expr.left, ctx);
    const right = this.evaluateExpression(expr.right, ctx);

    // Null handling
    if (left === null || right === null) {
      if (expr.operator === '==') return left === right;
      if (expr.operator === '!=') return left !== right;
      return null;
    }

    switch (expr.operator) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new Error(`Cannot add ${typeof left} and ${typeof right}`);

      case '-':
        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }
        throw new Error(`Cannot subtract ${typeof left} and ${typeof right}`);

      case '*':
        if (typeof left === 'number' && typeof right === 'number') {
          return left * right;
        }
        throw new Error(`Cannot multiply ${typeof left} and ${typeof right}`);

      case '/':
        if (typeof left === 'number' && typeof right === 'number') {
          if (right === 0) throw new Error('Division by zero');
          return left / right;
        }
        throw new Error(`Cannot divide ${typeof left} by ${typeof right}`);

      case '%':
        if (typeof left === 'number' && typeof right === 'number') {
          return left % right;
        }
        throw new Error(`Cannot modulo ${typeof left} by ${typeof right}`);

      case '==': return left === right;
      case '!=': return left !== right;
      case '>': return (left as any) > (right as any);
      case '<': return (left as any) < (right as any);
      case '>=': return (left as any) >= (right as any);
      case '<=': return (left as any) <= (right as any);

      case 'and': return Boolean(left) && Boolean(right);
      case 'or': return Boolean(left) || Boolean(right);

      default:
        throw new Error(`Unknown operator: ${expr.operator}`);
    }
  }

  private evaluateUnary(expr: any, ctx: EvaluationContext): CellValue {
    const operand = this.evaluateExpression(expr.operand, ctx);

    switch (expr.operator) {
      case '-':
        if (typeof operand === 'number') return -operand;
        throw new Error(`Cannot negate ${typeof operand}`);

      case 'not':
        return !operand;

      default:
        throw new Error(`Unknown unary operator: ${expr.operator}`);
    }
  }

  private evaluateFunction(name: string, args: Expression[], ctx: EvaluationContext): CellValue {
    const lowerName = name.toLowerCase();

    switch (lowerName) {
      case 'sum':
        return this.funcSum(args, ctx);
      
      case 'avg':
      case 'average':
        return this.funcAvg(args, ctx);
      
      case 'count':
        return this.funcCount(args, ctx);
      
      case 'min':
        return this.funcMin(args, ctx);
      
      case 'max':
        return this.funcMax(args, ctx);
      
      case 'round':
        return this.funcRound(args, ctx);
      
      case 'abs':
        return this.funcAbs(args, ctx);
      
      case 'if':
        return this.funcIf(args, ctx);

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private funcSum(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('SUM requires exactly 1 argument');
    
    const colExpr = args[0];
    if (colExpr.type !== 'column') throw new Error('SUM argument must be a column name');
    
    const values = this.getColumnValues(colExpr.name, ctx);
    return values.reduce((acc: number, val) => acc + (typeof val === 'number' ? val : 0), 0);
  }

  private funcAvg(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('AVG requires exactly 1 argument');
    
    const colExpr = args[0];
    if (colExpr.type !== 'column') throw new Error('AVG argument must be a column name');
    
    const values = this.getColumnValues(colExpr.name, ctx);
    const numbers = values.filter(v => typeof v === 'number') as number[];
    if (numbers.length === 0) return 0;
    return numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
  }

  private funcCount(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('COUNT requires exactly 1 argument');
    
    const colExpr = args[0];
    if (colExpr.type !== 'column') throw new Error('COUNT argument must be a column name');
    
    const values = this.getColumnValues(colExpr.name, ctx);
    return values.filter(v => v !== null).length;
  }

  private funcMin(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MIN requires exactly 1 argument');
    
    const colExpr = args[0];
    if (colExpr.type !== 'column') throw new Error('MIN argument must be a column name');
    
    const values = this.getColumnValues(colExpr.name, ctx);
    const numbers = values.filter(v => typeof v === 'number') as number[];
    if (numbers.length === 0) throw new Error('No numeric values in column');
    return Math.min(...numbers);
  }

  private funcMax(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MAX requires exactly 1 argument');
    
    const colExpr = args[0];
    if (colExpr.type !== 'column') throw new Error('MAX argument must be a column name');
    
    const values = this.getColumnValues(colExpr.name, ctx);
    const numbers = values.filter(v => typeof v === 'number') as number[];
    if (numbers.length === 0) throw new Error('No numeric values in column');
    return Math.max(...numbers);
  }

  private funcRound(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 2) throw new Error('ROUND requires exactly 2 arguments');
    
    const value = this.evaluateExpression(args[0], ctx);
    const decimals = this.evaluateExpression(args[1], ctx);
    
    if (typeof value !== 'number') throw new Error('ROUND first argument must be a number');
    if (typeof decimals !== 'number') throw new Error('ROUND second argument must be a number');
    
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  private funcAbs(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('ABS requires exactly 1 argument');
    
    const value = this.evaluateExpression(args[0], ctx);
    if (typeof value !== 'number') throw new Error('ABS argument must be a number');
    
    return Math.abs(value);
  }

  private funcIf(args: Expression[], ctx: EvaluationContext): CellValue {
    if (args.length !== 3) throw new Error('IF requires exactly 3 arguments');
    
    const condition = this.evaluateExpression(args[0], ctx);
    
    if (condition) {
      return this.evaluateExpression(args[1], ctx);
    } else {
      return this.evaluateExpression(args[2], ctx);
    }
  }

  private getColumnValues(columnName: string, ctx: EvaluationContext): CellValue[] {
    const column = ctx.columns.get(columnName);
    if (!column) {
      throw new Error(`Column '${columnName}' not found`);
    }

    const colIndex = Array.from(ctx.columns.values()).indexOf(column);
    
    // Exclude current row (to avoid self-reference in aggregations)
    return ctx.table.rows
      .filter((_, index) => index !== ctx.rowIndex)
      .map(row => {
        const cell = row.cells[colIndex];
        return cell.computed !== undefined ? cell.computed : cell.value;
      });
  }

  private addError(type: ValidationError['type'], row: number, column: string, message: string) {
    this.errors.push({ type, row, column, message });
  }
}
