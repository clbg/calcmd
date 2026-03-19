import shoppingList from './examples/shopping-list.md?raw';
import travelExpenseSplit from './examples/travel-expense-split.md?raw';
import salesReport from './examples/sales-report.md?raw';
import invoice from './examples/invoice.md?raw';
import wideTable from './examples/wide-table.md?raw';
import gradeCalculation from './examples/grade-calculation.md?raw';

export interface Example {
  name: string;
  markdown: string;
}

export const EXAMPLES: Example[] = [
  { name: 'Shopping List', markdown: shoppingList },
  { name: 'Travel Expense Split', markdown: travelExpenseSplit },
  { name: 'Sales Report', markdown: salesReport },
  { name: 'Invoice', markdown: invoice },
  { name: 'Wide Table', markdown: wideTable },
  { name: 'Grade Calculation', markdown: gradeCalculation },
];
