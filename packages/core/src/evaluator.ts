// Formula Evaluator — spec v0.1.4 aligned
//
// Responsibility: take a ParsedTable (from Parser, no computed values yet) and
// fill in cell.computed for every cell that has an effectiveFormula.
//
// Pipeline (4 phases):
//   Phase 1 — expand:   assign effectiveFormula per cell (cell formula beats column formula)
//   Phase 2+3 — graph:  build a dependency DAG + topological sort
//   Phase 4 — compute:  walk the topo order, evaluate each cell's AST
//
// Example — given this table after parsing:
//   columns: [Qty, Price, Total(formula='Qty*Price')]
//   rows:    [{ cells: [{value:3}, {value:1.5}, {value:4.5}] }]
//
// After evaluate():
//   rows:    [{ cells: [{value:3}, {value:1.5}, {value:4.5, computed:4.5}] }]

import {
  Expression,
  EvaluationContext,
  CellValue,
  Column,
  ParsedTable,
  ValidationError,
  DependencyGraph,
  CellNode,
} from './types';
import { FormulaParser } from './formula-parser';

export class Evaluator {
  private parser = new FormulaParser();
  private errors: ValidationError[] = [];

  // Main entry point.
  // Input:  ParsedTable from Parser (cell.computed is undefined everywhere)
  // Output: same ParsedTable with cell.computed filled in and errors appended
  evaluate(table: ParsedTable): ParsedTable {
    this.errors = [];
    this.expand(table);
    const graph = this.buildDependencyGraph(table);
    this.computeInOrder(table, graph);
    return {
      ...table,
      dependencies: graph,
      errors: [...table.errors, ...this.errors],
    };
  }

  // Phase 1: for every cell, decide which formula is active.
  // Cell's own formula wins over the column-level formula (spec §2.3C).
  //
  // Example:
  //   column formula: 'Qty*Price'
  //   row 0 cell: { formula: undefined }  → effectiveFormula = 'Qty*Price'  (column wins)
  //   row 2 cell: { formula: 'sum(Total)' } → effectiveFormula = 'sum(Total)' (cell wins)
  private expand(table: ParsedTable): void {
    table.rows.forEach((row) => {
      table.columns.forEach((col, colIdx) => {
        const cell = row.cells[colIdx];
        if (cell.formula) {
          cell.effectiveFormula = cell.formula;
        } else if (col.formula) {
          cell.effectiveFormula = col.formula;
        }
      });
    });
  }

  // Stable cell identifier used as graph node key.
  // Example: row 0, col 2  →  "R0.C2"
  private cellId(row: number, col: number): string {
    return `R${row}.C${col}`;
  }

  // Phase 2+3: build a directed acyclic graph (DAG) of cell dependencies,
  // then topologically sort it so we evaluate dependencies before dependents.
  //
  // Example — formula 'Qty*Price' in cell R0.C2:
  //   nodes: { 'R0.C2': { id:'R0.C2', row:0, col:2, formula:'Qty*Price' } }
  //   edges: { 'R0.C2': Set { 'R0.C0', 'R0.C1' } }   (depends on Qty and Price)
  //   order: ['R0.C0', 'R0.C1', 'R0.C2']              (dependencies first)
  private buildDependencyGraph(table: ParsedTable): DependencyGraph {
    const nodes = new Map<string, CellNode>();
    const edges = new Map<string, Set<string>>();

    const colLower = new Map<string, number>();
    table.columns.forEach((col, idx) => {
      colLower.set(col.name.toLowerCase(), idx);
      if (col.alias) colLower.set(col.alias.toLowerCase(), idx);
      const normalized = col.name.replace(/\s+/g, '_').toLowerCase();
      if (!colLower.has(normalized)) colLower.set(normalized, idx);
    });

    const resolveCol = (name: string): number | undefined => colLower.get(name.toLowerCase());

    table.rows.forEach((row, rowIdx) => {
      table.columns.forEach((col, colIdx) => {
        const cell = row.cells[colIdx];
        if (!cell.effectiveFormula) return;

        const id = this.cellId(rowIdx, colIdx);
        nodes.set(id, { id, row: rowIdx, col: colIdx, formula: cell.effectiveFormula });
        if (!edges.has(id)) edges.set(id, new Set());

        try {
          const ast = this.parser.parse(cell.effectiveFormula);
          this.collectDeps(ast, rowIdx, colIdx, table, resolveCol, id, edges);
        } catch {
          // Parse errors are surfaced later during evaluation
        }
      });
    });

    const order = this.topoSort(nodes, edges);
    return { nodes, edges, order };
  }

  // Walk an Expression AST and record which other cells this cell depends on.
  //
  // Example — AST for 'Qty*Price' in row 1, col 2:
  //   ColumnRef('Qty')   → adds edge R1.C2 → R1.C0
  //   ColumnRef('Price') → adds edge R1.C2 → R1.C1
  //
  // Aggregation special case — 'sum(Amount)' in row 3 (the totals row):
  //   depends on Amount in ALL other rows → adds edges R3.C1 → R0.C1, R1.C1, R2.C1
  private collectDeps(
    expr: Expression,
    rowIdx: number,
    colIdx: number,
    table: ParsedTable,
    resolveCol: (name: string) => number | undefined,
    fromId: string,
    edges: Map<string, Set<string>>,
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
        const loc = table.labels.get(expr.label);
        if (loc !== undefined) {
          edges.get(fromId)!.add(this.cellId(loc.row, loc.col));
        }
        break;
      }
      case 'function': {
        const lowerName = expr.name.toLowerCase();
        const aggFns = ['sum', 'avg', 'average', 'count', 'min', 'max'];
        if (
          aggFns.includes(lowerName) &&
          expr.args.length === 1 &&
          expr.args[0].type === 'column'
        ) {
          const ci = resolveCol(expr.args[0].name);
          if (ci !== undefined) {
            table.rows.forEach((_, ri) => {
              if (ri !== rowIdx) edges.get(fromId)!.add(this.cellId(ri, ci));
            });
          }
        } else {
          expr.args.forEach((a) =>
            this.collectDeps(a, rowIdx, colIdx, table, resolveCol, fromId, edges),
          );
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

  // Topological sort via DFS. Also detects cycles.
  //
  // Example — edges: { A→B, B→C }
  //   visit(A) → recurse into B → recurse into C → push C, push B, push A
  //   order: ['C', 'B', 'A']  (dependencies come first)
  //
  // Cycle example — edges: { A→B, B→A }
  //   visit(A) → recurse into B → B sees A already in stack → cycle detected
  //   both A and B are excluded from order and marked as errors
  private topoSort(nodes: Map<string, CellNode>, edges: Map<string, Set<string>>): string[] {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const order: string[] = [];
    const cycleNodes = new Set<string>();

    const visit = (id: string, path: string[]): boolean => {
      if (inStack.has(id)) {
        const cycleStart = path.indexOf(id);
        const cycle = path.slice(cycleStart);
        cycle.forEach((n) => cycleNodes.add(n));
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
      if (!visited.has(id)) visit(id, []);
    }

    return order.filter((id) => !cycleNodes.has(id));
  }

  // Phase 4: evaluate each cell in topological order (dependencies first).
  // Cells excluded from order (cycles) are marked with error = 'Circular dependency'.
  private computeInOrder(table: ParsedTable, graph: DependencyGraph): void {
    const ctx = this.makeBaseContext(table);

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
          labels: table.labels,
        };
        cell.computed = this.evaluateExpression(ast, evalCtx);
      } catch (error) {
        cell.error = error instanceof Error ? error.message : String(error);
        this.addError('runtime', node.row, col.name, cell.error);
      }
    }

    // Any node not in order was part of a cycle
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

  // Build lookup maps used during expression evaluation.
  // columns: 'Total' → Column object (also maps underscore-normalized names)
  // aliases: 'agi'   → 'Adjusted Gross Income'
  private makeBaseContext(table: ParsedTable) {
    const columns = new Map<string, Column>();
    const aliases = new Map<string, string>();

    table.columns.forEach((col) => {
      columns.set(col.name, col);
      if (col.alias) aliases.set(col.alias.toLowerCase(), col.name);
      const normalized = col.name.replace(/\s+/g, '_');
      if (normalized !== col.name) columns.set(normalized, col);
    });

    return { columns, aliases };
  }

  // Recursively evaluate an Expression node given the current row context.
  //
  // { type: 'literal', value: 42 }          → 42
  // { type: 'column',  name: 'Qty' }        → value of Qty in current row
  // { type: 'binary',  operator: '+', ... } → left + right
  private evaluateExpression(expr: Expression, ctx: EvaluationContext): CellValue {
    switch (expr.type) {
      case 'literal':
        return expr.value;
      case 'column':
        return this.evaluateColumnRef(expr.name, ctx);
      case 'label':
        return this.evaluateLabelRef(expr.label, undefined, ctx);
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

  // Resolve a column name (or alias) to its Column + index in the table.
  // Lookup order: alias → exact name → underscore-normalized name
  //
  // 'agi'                    → resolves via alias → { column: <AGI col>, index: 0 }
  // 'Adjusted_Gross_Income'  → resolves via normalization → same result
  private resolveColumnIndex(
    name: string,
    ctx: EvaluationContext,
  ): { column: Column; index: number } {
    const lowerName = name.toLowerCase();
    const aliasTarget = ctx.aliases.get(lowerName);
    const tableColumns = ctx.table.columns;

    const findByName = (searchName: string): { column: Column; index: number } | null => {
      const lower = searchName.toLowerCase();
      for (let i = 0; i < tableColumns.length; i++) {
        const col = tableColumns[i];
        if (
          col.name.toLowerCase() === lower ||
          col.name.replace(/\s+/g, '_').toLowerCase() === lower ||
          (col.alias && col.alias.toLowerCase() === lower)
        ) {
          return { column: col, index: i };
        }
      }
      return null;
    };

    if (aliasTarget) {
      const result = findByName(aliasTarget);
      if (result) return result;
    }

    const result = findByName(name);
    if (result) return result;

    throw new Error(`Column '${name}' not found`);
  }

  // Read the value of a column in the current row.
  // Prefers cell.computed (already evaluated) over cell.value (raw parsed value).
  private evaluateColumnRef(name: string, ctx: EvaluationContext): CellValue {
    const { index } = this.resolveColumnIndex(name, ctx);
    const cell = ctx.currentRow.cells[index];
    return cell.computed !== undefined ? cell.computed : cell.value;
  }

  // Read a value from a labeled row.
  //
  // @wages.Amount  → value of Amount column in the row labeled 'wages'
  // @wages         → last numeric value in the row labeled 'wages'
  private evaluateLabelRef(
    label: string,
    _columnName: string | undefined,
    ctx: EvaluationContext,
  ): CellValue {
    const loc = ctx.labels.get(label);
    if (loc === undefined) throw new Error(`Label '@${label}' not found`);

    const row = ctx.table.rows[loc.row];
    const cell = row.cells[loc.col];
    return cell.computed !== undefined ? cell.computed : cell.value;
  }

  // Evaluate binary operators with strict type checking (spec S-01, S-02).
  //
  // number + number → number     ✓
  // string + string → string     ✓  (concatenation)
  // number + string → ERROR      ✗  no implicit coercion
  // number > string → ERROR      ✗  comparison requires same type
  private evaluateBinary(expr: any, ctx: EvaluationContext): CellValue {
    const left = this.evaluateExpression(expr.left, ctx);
    const right = this.evaluateExpression(expr.right, ctx);

    if (left === null || right === null) {
      if (expr.operator === '==') return left === right;
      if (expr.operator === '!=') return left !== right;
      return null;
    }

    switch (expr.operator) {
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
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '>':
      case '<':
      case '>=':
      case '<=':
        if (typeof left !== typeof right) {
          throw new Error(`Cannot compare ${typeof left} with ${typeof right}`);
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return expr.operator === '>'
            ? left > right
            : expr.operator === '<'
              ? left < right
              : expr.operator === '>='
                ? left >= right
                : left <= right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return expr.operator === '>'
            ? left > right
            : expr.operator === '<'
              ? left < right
              : expr.operator === '>='
                ? left >= right
                : left <= right;
        }
        throw new Error(`Cannot compare ${typeof left} values with '${expr.operator}'`);
      case 'and':
        return Boolean(left) && Boolean(right);
      case 'or':
        return Boolean(left) || Boolean(right);
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

  // Dispatch to the appropriate built-in function implementation.
  // Throws for any unknown function name (whitelist-only, spec security requirement).
  private evaluateFunction(name: string, args: Expression[], ctx: EvaluationContext): CellValue {
    switch (name.toLowerCase()) {
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
      case 'floor':
        return this.funcFloor(args, ctx);
      case 'ceil':
        return this.funcCeil(args, ctx);
      case 'if':
        return this.funcIf(args, ctx);
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  // Get all values for a column, excluding the current row.
  // Aggregation functions (sum, avg, etc.) call this so a totals row
  // doesn't include itself in the calculation.
  //
  // Example — sum(Amount) in row 3 with rows [100, 200, 300, <totals>]:
  //   returns [100, 200, 300]  (row 3 excluded)
  private getColumnValues(columnName: string, ctx: EvaluationContext): CellValue[] {
    const { index } = this.resolveColumnIndex(columnName, ctx);
    return ctx.table.rows
      .filter((_, i) => i !== ctx.rowIndex)
      .map((row) => {
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
    const nums = values.filter((v) => typeof v === 'number') as number[];
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  private funcCount(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('COUNT requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('COUNT argument must be a column name');
    return this.getColumnValues(args[0].name, ctx).filter((v) => v !== null).length;
  }

  private funcMin(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MIN requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('MIN argument must be a column name');
    const nums = this.getColumnValues(args[0].name, ctx).filter(
      (v) => typeof v === 'number',
    ) as number[];
    if (nums.length === 0) throw new Error('No numeric values in column');
    return Math.min(...nums);
  }

  private funcMax(args: Expression[], ctx: EvaluationContext): number {
    if (args.length !== 1) throw new Error('MAX requires exactly 1 argument');
    if (args[0].type !== 'column') throw new Error('MAX argument must be a column name');
    const nums = this.getColumnValues(args[0].name, ctx).filter(
      (v) => typeof v === 'number',
    ) as number[];
    if (nums.length === 0) throw new Error('No numeric values in column');
    return Math.max(...nums);
  }

  // round(value, decimals?)
  // round(3.456, 2) → 3.46
  // round(3.7)      → 4   (defaults to 0 decimal places)
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

  // if(condition, trueValue, falseValue)
  // if(Score >= 90, 'A', 'B')  → 'A' when Score is 95, 'B' when Score is 80
  private funcIf(args: Expression[], ctx: EvaluationContext): CellValue {
    if (args.length !== 3) throw new Error('IF requires exactly 3 arguments');
    const condition = this.evaluateExpression(args[0], ctx);
    return condition
      ? this.evaluateExpression(args[1], ctx)
      : this.evaluateExpression(args[2], ctx);
  }

  private addError(
    type: ValidationError['type'],
    row: number | undefined,
    column: string | undefined,
    message: string,
  ) {
    this.errors.push({ type, row, column, message });
  }
}
