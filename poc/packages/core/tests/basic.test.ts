// Basic CalcMD Tests

import { calcmd } from '../src';

describe('CalcMD Basic Tests', () => {
  test('Simple arithmetic', () => {
    const markdown = `
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |
    `.trim();

    const result = calcmd(markdown);
    
    expect(result.rows[0].cells[3].computed).toBe(4.5);
    expect(result.rows[1].cells[3].computed).toBe(4);
  });

  test('SUM aggregation', () => {
    const markdown = `
| Item | Amount |
|------|--------|
| A | 100 |
| B | 200 |
| Total | =sum(Amount) |
    `.trim();

    const result = calcmd(markdown);
    
    expect(result.rows[2].cells[1].computed).toBe(300);
  });

  test('Label reference', () => {
    const markdown = `
| Item | Value |
|------|-------|
| Base | 100 |
| @rate | 1.5 |
| Result | =Base*@rate |
    `.trim();

    const result = calcmd(markdown);
    
    expect(result.rows[2].cells[1].computed).toBe(150);
  });

  test('Complex calculation', () => {
    const markdown = `
| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop | 2 | 1000 | 2000 | 200.00 | 2200.00 |
    `.trim();

    const result = calcmd(markdown);
    
    expect(result.rows[0].cells[3].computed).toBe(2000);
    expect(result.rows[0].cells[4].computed).toBe(200);
    expect(result.rows[0].cells[5].computed).toBe(2200);
  });
});
