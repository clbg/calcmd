// Evaluator Context - helper structures for evaluation

import { Row, Column, Table, LabelLocation } from './types';

export class EvaluationContext {
  currentRow: Row;
  rowIndex: i32;
  colIndex: i32;
  table: Table;
  columns: Map<string, Column>;
  columnIndices: Map<string, i32>;
  aliases: Map<string, string>;
  labels: Map<string, LabelLocation>;

  constructor(
    currentRow: Row,
    rowIndex: i32,
    colIndex: i32,
    table: Table,
    columns: Map<string, Column>,
    columnIndices: Map<string, i32>,
    aliases: Map<string, string>,
    labels: Map<string, LabelLocation>,
  ) {
    this.currentRow = currentRow;
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.table = table;
    this.columns = columns;
    this.columnIndices = columnIndices;
    this.aliases = aliases;
    this.labels = labels;
  }
}
