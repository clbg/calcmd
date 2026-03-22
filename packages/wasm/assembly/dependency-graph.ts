// Evaluator Part 1: Dependency graph and topological sort

import {
  ParsedTable,
  DependencyGraph,
  CellNode,
  ValidationError,
  Column,
  Expression,
  ColumnRefExpression,
  LabelRefExpression,
  BinaryExpression,
  UnaryExpression,
  FunctionCallExpression,
  ParenExpression,
} from './types';
import { FormulaParser } from './formula-parser';
import { cellId } from './utils';

export class DependencyGraphBuilder {
  static build(table: ParsedTable, parser: FormulaParser): DependencyGraph {
    const graph = new DependencyGraph();
    const errors: ValidationError[] = [];

    // Build column lookup map
    const colLower = new Map<string, i32>();
    for (let i = 0; i < table.columns.length; i++) {
      const col = table.columns[i];
      colLower.set(col.name.toLowerCase(), i);
      if (col.alias !== null) {
        colLower.set(col.alias!.toLowerCase(), i);
      }
      const normalized = col.name.replace(' ', '_').toLowerCase();
      if (!colLower.has(normalized)) {
        colLower.set(normalized, i);
      }
    }

    // Build nodes and edges
    for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
      const row = table.rows[rowIdx];
      for (let colIdx = 0; colIdx < table.columns.length; colIdx++) {
        const cell = row.cells[colIdx];
        if (cell.effectiveFormula === null) continue;

        const id = cellId(rowIdx, colIdx);
        const node = new CellNode(id, rowIdx, colIdx);
        node.formula = cell.effectiveFormula;
        graph.nodes.set(id, node);

        if (!graph.edges.has(id)) {
          graph.edges.set(id, new Set<string>());
        }

        // Parse formula and collect dependencies
        const ast = parser.parse(cell.effectiveFormula!);
        if (ast !== null) {
          this.collectDeps(ast, rowIdx, colIdx, table, colLower, id, graph.edges);
        }
        // Parse errors will be caught during evaluation
      }
    }

    // Topological sort
    graph.order = this.topoSort(graph.nodes, graph.edges, errors);

    // Add collected errors to table
    for (let i = 0; i < errors.length; i++) {
      table.errors.push(errors[i]);
    }

    return graph;
  }

  private static collectDeps(
    expr: Expression,
    rowIdx: i32,
    colIdx: i32,
    table: ParsedTable,
    colLower: Map<string, i32>,
    fromId: string,
    edges: Map<string, Set<string>>,
  ): void {
    // Column reference
    if (expr instanceof ColumnRefExpression) {
      const colRef = expr as ColumnRefExpression;
      if (colLower.has(colRef.name.toLowerCase())) {
        const ci = colLower.get(colRef.name.toLowerCase());
        const depId = cellId(rowIdx, ci);
        if (depId !== fromId) {
          edges.get(fromId)!.add(depId);
        }
      }
    }
    // Label reference
    else if (expr instanceof LabelRefExpression) {
      const labelRef = expr as LabelRefExpression;
      if (table.labels.has(labelRef.label)) {
        const loc = table.labels.get(labelRef.label);
        edges.get(fromId)!.add(cellId(loc.row, loc.col));
      }
    }
    // Function call
    else if (expr instanceof FunctionCallExpression) {
      const funcExpr = expr as FunctionCallExpression;
      const lowerName = funcExpr.name.toLowerCase();
      const aggFns = ['sum', 'avg', 'average', 'count', 'min', 'max'];
      let isAgg = false;
      for (let i = 0; i < aggFns.length; i++) {
        if (lowerName === aggFns[i]) {
          isAgg = true;
          break;
        }
      }

      if (isAgg && funcExpr.args.length === 1 && funcExpr.args[0] instanceof ColumnRefExpression) {
        const argColRef = funcExpr.args[0] as ColumnRefExpression;
        if (colLower.has(argColRef.name.toLowerCase())) {
          const ci = colLower.get(argColRef.name.toLowerCase());
          const cell = table.rows[rowIdx].cells[colIdx];
          const isColumnFormula = cell.isColumnFormula;

          if (isColumnFormula) {
            for (let ri = 0; ri < table.rows.length; ri++) {
              edges.get(fromId)!.add(cellId(ri, ci));
            }
          } else {
            for (let ri = 0; ri < rowIdx; ri++) {
              edges.get(fromId)!.add(cellId(ri, ci));
            }
          }
        }
      } else {
        for (let i = 0; i < funcExpr.args.length; i++) {
          this.collectDeps(funcExpr.args[i], rowIdx, colIdx, table, colLower, fromId, edges);
        }
      }
    }
    // Binary expression
    else if (expr instanceof BinaryExpression) {
      const binExpr = expr as BinaryExpression;
      this.collectDeps(binExpr.left, rowIdx, colIdx, table, colLower, fromId, edges);
      this.collectDeps(binExpr.right, rowIdx, colIdx, table, colLower, fromId, edges);
    }
    // Unary expression
    else if (expr instanceof UnaryExpression) {
      const unExpr = expr as UnaryExpression;
      this.collectDeps(unExpr.operand, rowIdx, colIdx, table, colLower, fromId, edges);
    }
    // Paren expression
    else if (expr instanceof ParenExpression) {
      const parenExpr = expr as ParenExpression;
      this.collectDeps(parenExpr.expression, rowIdx, colIdx, table, colLower, fromId, edges);
    }
  }

  private static topoSort(
    nodes: Map<string, CellNode>,
    edges: Map<string, Set<string>>,
    errors: ValidationError[],
  ): string[] {
    const sorter = new TopoSorter(nodes, edges, errors);
    return sorter.sort();
  }
}

// Helper class to avoid closures in topological sort
class TopoSorter {
  nodes: Map<string, CellNode>;
  edges: Map<string, Set<string>>;
  visited: Set<string>;
  inStack: Set<string>;
  order: string[];
  cycleNodes: Set<string>;
  errors: ValidationError[];

  constructor(
    nodes: Map<string, CellNode>,
    edges: Map<string, Set<string>>,
    errors: ValidationError[],
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.visited = new Set<string>();
    this.inStack = new Set<string>();
    this.order = [];
    this.cycleNodes = new Set<string>();
    this.errors = errors;
  }

  sort(): string[] {
    const nodeKeys = this.nodes.keys();
    for (let i = 0; i < nodeKeys.length; i++) {
      const id = nodeKeys[i];
      if (!this.visited.has(id)) {
        this.visit(id, []);
      }
    }

    // Filter out cycle nodes
    const result: string[] = [];
    for (let i = 0; i < this.order.length; i++) {
      if (!this.cycleNodes.has(this.order[i])) {
        result.push(this.order[i]);
      }
    }

    return result;
  }

  private visit(id: string, path: string[]): void {
    if (this.inStack.has(id)) {
      // Cycle detected - build cycle path message
      let cycleStart = -1;
      for (let i = 0; i < path.length; i++) {
        if (path[i] === id) {
          cycleStart = i;
          break;
        }
      }

      // Build cycle path string
      let cyclePath = '';
      if (cycleStart >= 0) {
        for (let i = cycleStart; i < path.length; i++) {
          this.cycleNodes.add(path[i]);
          if (cyclePath.length > 0) cyclePath += ' → ';
          cyclePath += path[i];
        }
      }
      this.cycleNodes.add(id);
      if (cyclePath.length > 0) cyclePath += ' → ';
      cyclePath += id;

      // Add error with cycle path
      const error = new ValidationError('runtime', 'Circular dependency: ' + cyclePath);
      this.errors.push(error);

      return;
    }

    if (this.visited.has(id)) return;

    this.visited.add(id);
    this.inStack.add(id);

    const deps = this.edges.get(id);
    if (deps !== null) {
      const depArray = deps.values();
      for (let i = 0; i < depArray.length; i++) {
        const dep = depArray[i];
        if (this.nodes.has(dep) || this.edges.has(dep)) {
          const newPath = path.slice(0);
          newPath.push(id);
          this.visit(dep, newPath);
        }
      }
    }

    this.inStack.delete(id);
    this.order.push(id);
  }
}
