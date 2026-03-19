// CalcMD Core - Main Entry Point

import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { ParsedTable } from './types';

export { Parser } from './parser';
export { FormulaParser } from './formula-parser';
export { Evaluator } from './evaluator';
export { format, fill } from './utils';

export type {
  Table,
  Column,
  Row,
  Cell,
  CellValue,
  ParsedTable,
  ValidationError,
  Expression,
  EvaluationContext,
  DependencyGraph,
  CellNode,
} from './types';

// Main API
export function calcmd(markdown: string): ParsedTable {
  const parser = new Parser();
  const table = parser.parse(markdown);

  const evaluator = new Evaluator();
  return evaluator.evaluate(table);
}
