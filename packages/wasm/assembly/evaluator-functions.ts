// Built-in functions for CalcMD evaluator

import { CellValue, NumberValue, Expression } from './types';
import { EvaluationContext } from './evaluator-context';

export class Functions {
  // Get column values for aggregation
  static getColumnValues(
    columnIndex: i32,
    ctx: EvaluationContext,
    isColumnFormula: bool,
  ): CellValue[] {
    const values: CellValue[] = [];

    if (isColumnFormula) {
      // Column formula: aggregate all rows
      for (let i = 0; i < ctx.table.rows.length; i++) {
        const row = ctx.table.rows[i];
        const cell = row.cells[columnIndex];
        values.push(cell.computed !== null ? cell.computed! : cell.value);
      }
    } else {
      // Cell formula: aggregate from row 0 to row before current
      for (let i = 0; i < ctx.rowIndex; i++) {
        const row = ctx.table.rows[i];
        const cell = row.cells[columnIndex];
        values.push(cell.computed !== null ? cell.computed! : cell.value);
      }
    }

    return values;
  }

  static sum(values: CellValue[]): f64 {
    let total: f64 = 0;
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val.getType() === 0) {
        // number
        total += val.toNumber();
      }
    }
    return total;
  }

  static avg(values: CellValue[]): f64 {
    const nums: f64[] = [];
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val.getType() === 0) {
        // number
        nums.push(val.toNumber());
      }
    }
    if (nums.length === 0) return 0;

    let total: f64 = 0;
    for (let i = 0; i < nums.length; i++) {
      total += nums[i];
    }
    return total / nums.length;
  }

  static count(values: CellValue[]): f64 {
    let count: f64 = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i].getType() !== 3) {
        // not null
        count += 1;
      }
    }
    return count;
  }

  static min(values: CellValue[]): f64 {
    let minVal: f64 = Infinity;
    let found = false;

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val.getType() === 0) {
        // number
        const num = val.toNumber();
        if (num < minVal) {
          minVal = num;
          found = true;
        }
      }
    }

    if (!found) throw new Error('No numeric values in column');
    return minVal;
  }

  static max(values: CellValue[]): f64 {
    let maxVal: f64 = -Infinity;
    let found = false;

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val.getType() === 0) {
        // number
        const num = val.toNumber();
        if (num > maxVal) {
          maxVal = num;
          found = true;
        }
      }
    }

    if (!found) throw new Error('No numeric values in column');
    return maxVal;
  }

  static round(value: f64, decimals: f64): f64 {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  static abs(value: f64): f64 {
    return Math.abs(value);
  }

  static floor(value: f64): f64 {
    return Math.floor(value);
  }

  static ceil(value: f64): f64 {
    return Math.ceil(value);
  }
}
