// Formula Evaluator — spec v0.1.4 aligned
// Cell formula overrides column formula, cell-granularity DAG,
// topological sort, cycle detection, strict type checking.

import {
  Expression,
  EvaluationContext,
  CellValue,
  Column,
  ParsedTable,
  ValidationError,
  DependencyGraph,
  CellNode
} from './types';
import { FormulaParser } from './formula-parser';

export class Evaluator {
  private parser = new FormulaParser();
  private errors: ValidationError[] = [];

  evaluate(table: ParsedTable): ParsedTable {
    this.errors = [];

    // Phase 1: Expand — assign effectiveFormula per cell
    this.expand(table);

    // Phase 2+3: Build dependency graph + topological sort
    const graph = this.buildDependencyGraph(table);

    // Phase 4: Evaluate in topological order
    this.computeInOrder(table, graph);

    return {
      ...table,
      dependencies: graph,
      errors: [...table.errors, ...this.errors]
    };
  }

  // --- Phase 1: Expand column formulas into cells ---
  private expand(table: ParsedTable): void {
    table.rows.forEach(row => {
      table.columns.forEach((col, colIdx) => {
        const cell = row.cells[colIdx];
        // Cell formula overrides column formula (spec §2.3C)
        if (cell.formula) {
          cell.effectiveFormula = cell.formula;
        } else if (col.formula) {
          cell.effectiveFormula = col.formula;
        }
      });
    });
  }

  // --- Phase 2+3: Dependency graph + topological sort ---
  private cellId(row: number, col: number): string {
    return `R${row}.C${col}`;
  }

  private buildDependencyGraph(table: ParsedTable): DependencyGraph {
    const nodes = new Map<string, CellNode>();
    const edges = new Map<string, Set<string>>();

    const colNameToIdx = new Map<string, number>();
    const colLower = new Map<string, number>();
    table.columns.forEach((col, idx) => {
      colNameToIdx.set(col.name, idx);
      colLower.set(col.name.toLowerCase(), idx);
      if (col.alias) {
        colLower.set(col.alias.toLowerCase(), idx);
      }
    });
    // Also map underscore-normalized names
    table.columns.forEach((col, idx) => {
      const normalized = col.name.replace(/\s+/g, '_').toLowerCase();
      if (!colLower.has(normalized)) colLower.set(normalized, idx);
    });

    const resolveCol = (name: string): number | undefined => {
      const lower = name.toLowerCase();
      // Check direct name / normalized / alias
      const idx = colLower.get(lower);
      if (idx !== undefined) return idx;
      return undefined;
    };

    // Collect dependencies for each cell with a formula
    table.rows.forEach((row, rowIdx) => {
      table.columns.forEach((col, colIdx) => {
        const cell = row.cells[colIdx];
        if (!cell.effectiveFormula) return;

        const id = this.cellId(rowIdx, colIdx);
        nodes.set(id, { id, row: rowIdx, col: colIdx, formula: cell.effectiveFormula });
        if (!edges.has(id)) edges.set(id, new Set());

        // Parse formula to find dependencies
        try {
          const ast = this.parser.parse(cell.effectiveFormula);
          this.collectDeps(ast, rowIdx, colIdx, table, resolveCol, id, edges);
        } catch {
          // Parse errors handled later during evaluation
        }
      });
    });

    // Topological sort with cycle detection
    const order = this.topoSort(nodes, edges);

    return { nodes, edges, order };
  }

  private collectDeps(
    expr: Expression, rowIdx: number, colIdx: number,
    table: ParsedTable, resolveCol: (name: string) => number | undefined,
    fromId: string, edges: Map<string, Set<string>>
  ): void {
    switch (expr.type) {
      case 'column': {
        const ci = resolveCol(expr.name);
        if (ci !== undefined) {
          const depId = this.cellId(rowIdx, ci);
          if (depId !== fromId) edges.get(fromId)!.add(depId);
        }
        break;
      }
      case 'label': {
        if (expr.column) {
          const ri = table.labels.get(expr.label);
          const ci = resolveCol(expr.column);
          if (ri !== undefined && ci !== undefined) {
            edges.get(fromId)!.add(this.cellId(ri, ci));
          }
        }
        break;
      }
      case 'function': {
        const lowerName = expr.name.toLowerCase();
        const aggFns = ['sum', 'avg', 'average', 'count', 'min', 'max'];
        if (aggFns.includes(lowerName) && expr.args.length === 1 && expr.args[0].type === 'column') {
          // Aggregation: depends on all rows in that column except current
          const ci = resolveCol(expr.args[0].name);
          if (ci !== undefined) {
            table.rows.forEach((_, ri) => {
              if (ri !== rowIdx) {
                edges.get(fromId)!.add(this.cellId(ri, ci));
              }
            });
          }
        } else {
          expr.args.forEach(a => this.collectDeps(a, rowIdx, colIdx, table, resolveCol, fromId, edges));
        }
        break;
      }
      case 'binary':
        this.collectDeps(expr.left, rowIdx, colIdx, table, resolveCol, fromId, edges);
        this.collectDeps(expr.right, rowIdx, colIdx, table, resolveCol, fromId, edges);
        break;
      case 'unary':
        this.collectDeps(expr.operand, rowIdx, colIdx, table, resolveCol, fromId, edges);
        break;
      case 'paren':
        this.collectDeps(expr.expression, rowIdx, colIdx, table, resolveCol, fromId, edges);
        break;
    }
  }

  private topoSort(
    nodes: Map<string, CellNode>,
    edges: Map<string, Set<string>>
  ): string[] {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const order: string[] = [];
    const cycleNodes = new Set<string>();

    const visit = (id: string, path: string[]): boolean => {
      if (inStack.has(id)) {
        // Cycle detected — mark all nodes in the cycle
        const cycleStart = path.indexOf(id);
        const cycle = path.slice(cycleStart);
        cycle.forEach(n => cycleNodes.add(n));
        cycleNodes.add(id);
        const cyclePath = [...cycle, id].join(' → ');
        this.addError('runtime', undefined, undefined, `Circular dependency: ${cyclePath}`);
        return false;
      }
      if (visited.has(id)) return true;

      visited.add(id);
      inStack.add(id);

      const deps = edges.get(id);
      if (deps) {
        for (const dep of deps) {
          // Only visit deps that are formula nodes
          if (nodes.has(dep) || edges.has(dep)) {
            visit(dep, [...path, id]);
          }
        }
      }

      inStack.delete(id);
      order.push(id);
      return true;
    };

    for (const id of nodes.keys()) {
      if (!visited.has(id)) {
        visit(id, []);
      }
    }

    // Mark cycle cells with errors — done in computeInOrder
    // Filter out cycle nodes from order
    return order.filter(id => !cycleNodes.has(id));
  }

  // --- Phase 4: Compute in topological order ---
  private computeInOrder(table: ParsedTable, graph: DependencyGraph): void {
    const ctx = this.makeBaseContext(table);

    // First evaluate cells in topological order
    for (const id of graph.order) {
      const node = graph.nodes.get(id);
      if (!node || !node.formula) continue;

      const row = table.rows[node.row];
      const col = table.columns[node.col];
      const cell = row.cells[node.col];

      try {
        const ast = this.parser.parse(node.formula);
        const evalCtx: EvaluationContext = {
          currentRow: row,
          rowIndex: node.row,
          table,
          columns: ctx.columns,
          aliases: ctx.aliases,
          labels: table.labels
        };
        cell.computed = this.evaluateExpression(ast, evalCtx);
      } catch (error) {
        cell.error = error instanceof Error ? error.message : String(error);
        this.addError('runtime', node.row, col.name, cell.error);
      }
    }

    // Mark cells in cycles as errors
    for (const [id, node] of graph.nodes) {
      if (!graph.order.includes(id)) {
        const cell = table.rows[node.row]?.cells[node.col];
        if (cell && !cell.error) {
          cell.error = 'Circular dependency';
          this.addError('runtime', node.row, table.columns[node.col]?.name, 'Circular dependency');
        }
      }
    }
  }

  private makeBaseContext(table: ParsedTable) {
    const columns = new Map<string, Column>();
    const aliases = new Map<string, string>();

    table.columns.forEach(col => {
      columns.set(col.name, col);
      if (col.alias) {
        aliases.set(col.alias.toLowerCase(), col.name);
      }
      // Also map underscore-normalized name
      const normalized = col.name.replace(/\s+/g, '_');
      if (normalized !== col.name) {
        columns.set(normalized, col);
      }
    });

    return { columns, aliases };
  }

  // --- Expression evaluation ---
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

  private resolveColumnIndex(name: string, ctx: EvaluationContext): { column: Column; index: number } {
    const lowerName = name.toLowerCase();

    // Check alias first
    const aliasTarget = ctx.aliases.get(lowerName);

    // Build a reliable index: use the table's column array order
    const tableColumns = ctx.table.columns;

    const findByName = (searchName: string): { column: Column; index: number } | null => {
      const lower = searchName.toLowerCase();
      for (let i = 0; i < tableColumns.length; i++) {
        const col = tableColumns[i];
        if (col.name.toLowerCase() === lower ||
            col.name.replace(/\s+/g, '_').toLowerCase() === lower ||
            (col.alias && col.alias.toLowerCase() === lower)) {
          return { column: col, index: i };
        }
      }
      return null;
    };

    // If alias resolved, find by the target column name
    if (aliasTarget) {
      const result = findByName(aliasTarget);
      if (result) return result;
    }

    // Direct name / underscore-normalized / alias match
    const result = findByName(name);
    if (result) return result;

    throw new Error(`Column '${name}' not found`);
  }

  private evaluateColumnRef(name: string, ctx: EvaluationContext): CellValue {
    const { index } = this.resolveColumnIndex(name, ctx);
    const cell = ctx.currentRow.cells[index];
    return cell.computed !== undefined ? cell.computed : cell.value;
  }

  private evaluateLabelRef(label: string, columnName: string | undefined, ctx: EvaluationContext): CellValue {
    const rowIndex = ctx.labels.get(label);
    if (rowIndex === undefined) {
      throw new Error(`Label '@${label}' not found`);
    }

    const row = ctx.table.rows[rowIndex];

    if (columnName) {
      const { index } = this.resolveColumnIndex(columnName, ctx);
      const cell = row.cells[index];
      return cell.computed !== undefined ? cell.computed : cell.value;
    }

    // Bare @label — last numeric value (implementation-defined)
    for (let i = row.cells.length - 1; i >= 0; i--) {
      const cell = row.cells[i];
      const value = cell.computed !== undefined ? cell.computed : cell.value;
      if (typeof value === 'number') return value;
    }

    throw new Error(`No numeric value found in row '@${label}'`);
  }

  // --- Binary operators with strict type checking (S-01, S-02) ---
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
      // S-01: strict + operator
      case '+':
        if (typeof left === 'number' && typeof right === 'number') return left + right;
        if (typeof left === 'string' && typeof right === 'string') return left + right;
        throw new Error(`Cannot add ${typeof left} and ${typeof right}`);

      case '-':
        if (typeof left === 'number' && typeof right === 'number') return left - right;
        throw new Error(`Cannot subtract ${typeof left} and ${typeof right}`);

      case '*':
        if (typeof left === 'number' && typeof right === 'number') return left * right;
        throw new Error(`Cannot multiply ${typeof left} and ${typeof right}`);

      case '/':
        if (typeof left === 'number' && typeof right === 'number') {
          if (right === 0) throw new Error('Division by zero');
          return left / right;
        }
        throw new Error(`Cannot divide ${typeof left} by ${typeof right}`);

      case '%':
        if (typeof left === 'number' && typeof right === 'number') return left % right;
        throw new Error(`Cannot modulo ${typeof left} by ${typeof right}`);

      // Equality: cross-type returns false/true, no error
      case '==': return left === right;
      case '!=': return left !== right;

      // S-02: strict comparison — same type only
      case '>':
      case '<':
      case '>=':
      case '<=':
        if (typeof left !== typeof right) {
          throw new Error(`Cannot compare ${typeof left} with ${typeof right}`);
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return expr.operator === '>' ? left > right :
                 expr.operator === '<' ? left < right :
                 expr.operator === '>=' ? left >= right : left <= right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return expr.operator === '>' ? left > right :
                 expr.operator === '<' ? left < right :
                 expr.operator === '>=' ? left >= right : left <= right;
        }
        throw new Error(`Cannot compare ${typeof left} values with '${expr.operator}'`);

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

  // --- Functions ---
  private evaluateFunction(name: string, args: Expression[], ctx: EvaluationContext): CellValue {
    const lowerName = name.toLowerCase();
    switch (lowerName) {
      case 'sum': return this.funcSum(args, ctx);
      case 'avg': case 'average': return this.funcAvg(args, ctx);
      case 'count': return this.funcCount(args, ctx);
      case 'min': return this.funcMin(args, ctx);
      case 'max': return this.funcMax(args, ctx);
      case 'round': return this.funcRound(args, ctx);
      case 'abs': return this.funcAbs(args, ctx);
      case 'floor': return this.funcFloor(args, ctx);
      case 'ceil': return this.funcCeil(args, ctx);
      case 'if': return this.funcIf(args, ctx);
      default: throw new Error(`Unknown function: ${name}`);
    }
  }

  private getColumnValues(columnName: string, ctx: EvaluationContext): CellValue[] {
    const { index } = this.resolveColumnIndex(columnName, ctx);
    return ctx.table.rows
      .filter((_, i) => i !== ctx.rowIndex)
      .map(row => {
        const cell = row.cells[index];
        return cell.computed !== undefined ? cell.computed : cell.value;
      });
  }

  private funcSum(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('SUM requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('SUM argument must be a column name');
    const values = this.getColumnValues(args[0].name, ctx);
    return values.reduce((acc: number, val) => acc + (typeof val === 'number' ? val : 0), 0);
  }

  private funcAvg(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('AVG requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('AVG argument must be a column name');
    const values = this.getColumnValues(args[0].name, ctx);
    const nums = values.filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  private funcCount(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('COUNT requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('COUNT argument must be a column name');
    return this.getColumnValues(args[0].name, ctx).filter(v => v !== null).length;
  }

  private funcMin(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MIN requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('MIN argument must be a column name');
    const nums = this.getColumnValues(args[0].name, ctx).filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) throw new Error('No numeric values in column');
    return Math.min(...nums);
  }

  private funcMax(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MAX requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('MAX argument must be a column name');
    const nums = this.getColumnValues(args[0].name, ctx).filter(v => typeof v === 'number') as number[];
    if (nums.length === 0) throw new Error('No numeric values in column');
    return Math.max(...nums);
  }

  private funcRound(args: Expression[], ctx: EvaluationContext): number {
    if (args.length < 1 || args.length > 2) throw new Error('ROUND requires 1 or 2 arguments');
    const value = this.evaluateExpression(args[0], ctx);
    if (typeof value !== 'number') throw new Error('ROUND first argument must be a number');
    const decimals = args.length === 2 ? this.evaluateExpression(args[1], ctx) : 0;
    if (typeof decimals !== 'number') throw new Error('ROUND second argument must be a number');
    const m = Math.pow(10, decimals);
    return Math.round(value * m) / m;
  }

  private funcAbs(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('ABS requires exactly 1 argument');
    const value = this.evaluateExpression(args[0], ctx);
    if (typeof value !== 'number') throw new Error('ABS argument must be a number');
    return Math.abs(value);
  }

  private funcFloor(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('FLOOR requires exactly 1 argument');
    const value = this.evaluateExpression(args[0], ctx);
    if (typeof value !== 'number') throw new Error('FLOOR argument must be a number');
    return Math.floor(value);
  }

  private funcCeil(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('CEIL requires exactly 1 argument');
    const value = this.evaluateExpression(args[0], ctx);
    if (typeof value !== 'number') throw new Error('CEIL argument must be a number');
    return Math.ceil(value);
  }

  private funcIf(args: Expression[], ctx: EvaluationContext): CellValue {
    if (args.length !== 3) throw new Error('IF requires exactly 3 arguments');
    const condition = this.evaluateExpression(args[0], ctx);
    return condition
      ? this.evaluateExpression(args[1], ctx)
      : this.evaluateExpression(args[2], ctx);
  }

  private getCell(row: number, col: number, table: ParsedTable) {
    return table.rows[row]?.cells[col];
  }

  private addError(type: ValidationError['type'], row: number | undefined, column: string | undefined, message: string) {
    this.errors.push({ type, row, column, message });
  }
}
