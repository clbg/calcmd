// CalcMD Tests — aligned with spec v0.1.4

import { calcmd } from '../src';

describe('Basic calculations', () => {
  test('Column formula (simple arithmetic)', () => {
    const md = `
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[3].computed).toBe(4.5);
    expect(result.rows[1].cells[3].computed).toBe(4);
  });

  test('SUM aggregation', () => {
    const md = `
| Item | Amount |
|------|--------|
| A | 100 |
| B | 200 |
| Total | =sum(Amount) |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[2].cells[1].computed).toBe(300);
  });

  test('Multi-step column formulas', () => {
    const md = `
| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop | 2 | 1000 | 2000 | 200.00 | 2200.00 |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[3].computed).toBe(2000);
    expect(result.rows[0].cells[4].computed).toBe(200);
    expect(result.rows[0].cells[5].computed).toBe(2200);
  });
});

describe('Cell formula overrides column formula (§2.3C)', () => {
  test('Cell formula takes precedence over column formula', () => {
    const md = `
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| A | 10 | 5 | |
| B | 3 | 20 | |
| Sum | | | =sum(Total) |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[3].computed).toBe(50);  // column formula
    expect(result.rows[1].cells[3].computed).toBe(60);  // column formula
    expect(result.rows[2].cells[3].computed).toBe(110); // cell override
  });
});

describe('Cell labels — @label: value syntax (§3.5)', () => {
  test('@label: value on any cell', () => {
    const md = `
| Line | Description | Amount |
|------|-------------|--------|
| 1 | Gross Income | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[2].label).toBe('wages');
    expect(result.rows[0].cells[2].value).toBe(85000);
    expect(result.rows[2].cells[2].computed).toBe(85000 - 13850);
  });

  test('Bare @label shorthand', () => {
    const md = `
| Item | Value |
|------|-------|
| @rate | 1.5 |
| Result | =@rate * 100 |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[0].label).toBe('rate');
    expect(result.rows[0].cells[0].value).toBe('@rate'); // shorthand keeps string
    // @rate resolves to the labeled cell (Item column), which is the string '@rate'
    // so @rate * 100 should error (string * number)
    expect(result.rows[1].cells[1].error).toBeDefined();
  });

  test('Bare @label with numeric value', () => {
    const md = `
| Item | Value |
|------|-------|
| Rate | @rate: 1.5 |
| Result | =@rate * 100 |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[1].label).toBe('rate');
    expect(result.rows[0].cells[1].value).toBe(1.5);
    expect(result.rows[1].cells[1].computed).toBe(150);
  });

  test('Multiple labels in same row', () => {
    const md = `
| Q1 | Q2 | Total=Q1+Q2 |
|----|----|----|
| @r1: 5000 | @r2: 6000 | |
| @c1: 3000 | @c2: 3500 | |
| | | =(@r1+@r2) - (@c1+@c2) |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[0].label).toBe('r1');
    expect(result.rows[0].cells[1].label).toBe('r2');
    expect(result.rows[2].cells[2].computed).toBe((5000 + 6000) - (3000 + 3500));
  });

  test('Duplicate label error', () => {
    const md = `
| Item | Value |
|------|-------|
| @dup: A | 10 |
| @dup: B | 20 |
    `.trim();

    const result = calcmd(md);
    expect(result.errors.some(e => e.message.includes('Duplicate label'))).toBe(true);
  });
});

describe('Column aliases — #alias (§2.5)', () => {
  test('Alias in formula', () => {
    const md = `
| Adjusted Gross Income #agi | Tax Rate #rate | Tax=agi*rate |
|-----------------------------|----------------|--------------|
| 85000 | 0.22 | |
    `.trim();

    const result = calcmd(md);
    expect(result.columns[0].name).toBe('Adjusted Gross Income');
    expect(result.columns[0].alias).toBe('agi');
    expect(result.rows[0].cells[2].computed).toBe(85000 * 0.22);
  });

  test('Alias in cell label reference', () => {
    const md = `
| Line | Description | Adjusted Gross Income #agi |
|------|-------------|----------------------------|
| 1 | Gross | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[2].cells[2].computed).toBe(85000 - 13850);
  });
});

describe('Dependency graph & topological sort (§5.1-5.3)', () => {
  test('Cross-column dependencies evaluated in correct order', () => {
    const md = `
| Qty | Price | Subtotal=Qty*Price | Tax=Subtotal*0.1 | Total=Subtotal+Tax |
|-----|-------|--------------------|------------------|--------------------|
| 10 | 100 | | | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[2].computed).toBe(1000);
    expect(result.rows[0].cells[3].computed).toBe(100);
    expect(result.rows[0].cells[4].computed).toBe(1100);
  });

  test('Circular reference detected', () => {
    const md = `
| A=B+1 | B=A+1 |
|-------|-------|
| | |
    `.trim();

    const result = calcmd(md);
    expect(result.errors.some(e => e.message.includes('Circular dependency'))).toBe(true);
  });

  test('Cell override with label cross-row reference', () => {
    const md = `
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Widget | 10 | 5 | |
| Gadget | 3 | 20 | @gd: |
| Half | | | =@gd / 2 |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[3].computed).toBe(50);
    expect(result.rows[1].cells[3].computed).toBe(60);
    expect(result.rows[1].cells[3].label).toBe('gd');
    expect(result.rows[2].cells[3].computed).toBe(30);
  });
});

describe('Strict type checking (S-01, S-02)', () => {
  test('Number + String → ERROR', () => {
    const md = `
| A | B | C=A+B |
|---|---|-------|
| 5 | text | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[2].error).toBeDefined();
    expect(result.rows[0].cells[2].error).toContain('Cannot add');
  });

  test('Mixed type comparison → ERROR', () => {
    const md = `
| A | B | C=if(A>B,1,0) |
|---|---|----------------|
| 5 | text | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[2].error).toBeDefined();
    expect(result.rows[0].cells[2].error).toContain('Cannot compare');
  });
});

describe('New functions: floor, ceil (F-04, F-05)', () => {
  test('floor()', () => {
    const md = `
| Value | Result=floor(Value) |
|-------|---------------------|
| 3.7 | |
| -2.3 | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[1].computed).toBe(3);
    expect(result.rows[1].cells[1].computed).toBe(-3);
  });

  test('ceil()', () => {
    const md = `
| Value | Result=ceil(Value) |
|-------|---------------------|
| 3.2 | |
| -2.7 | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[1].computed).toBe(4);
    expect(result.rows[1].cells[1].computed).toBe(-2);
  });

  test('round() with 1 arg defaults to 0 decimals', () => {
    const md = `
| Value | Result=round(Value) |
|-------|---------------------|
| 3.7 | |
    `.trim();

    const result = calcmd(md);
    expect(result.rows[0].cells[1].computed).toBe(4);
  });
});
