#!/usr/bin/env node
/**
 * CalcMD core tests — all 19 cases from the original Jest suite.
 * Loads WASM directly via the bundler-target bg.js + WebAssembly.instantiate.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load and instantiate the WASM module, then wire it into the bg.js bindings
const wasmPath = join(__dirname, '../pkg/calcmd_wasm_bg.wasm');
const bgPath = join(__dirname, '../pkg/calcmd_wasm_bg.js');

const wasmBuffer = await readFile(wasmPath);
const bgModule = await import(bgPath);

// Instantiate WASM with the imports that bg.js needs
const wasmInstance = await WebAssembly.instantiate(wasmBuffer, {
  './calcmd_wasm_bg.js': bgModule,
});
bgModule.__wbg_set_wasm(wasmInstance.instance.exports);
wasmInstance.instance.exports.__wbindgen_start?.();

// Now we can call calcmd from bg.js
function calcmdRaw(markdown) {
  const json = bgModule.calcmd(markdown);
  return JSON.parse(json);
}

// Normalize: add top-level rows/columns aliases, convert edges to Map
function calcmd(markdown) {
  const raw = calcmdRaw(markdown);
  const edgesMap = new Map();
  for (const [k, v] of Object.entries(raw.dependencies.edges)) {
    edgesMap.set(k, new Set(v));
  }
  return {
    ...raw,
    rows: raw.table.rows,
    columns: raw.table.columns,
    dependencies: { ...raw.dependencies, edges: edgesMap },
  };
}

// --- Minimal test harness ---
let passed = 0, failed = 0;

function expect(val) {
  return {
    toBe(expected) {
      if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
    },
    toBeDefined() {
      if (val === undefined || val === null) throw new Error(`Expected defined, got ${val}`);
    },
    toContain(sub) {
      if (typeof val !== 'string' || !val.includes(sub))
        throw new Error(`Expected "${val}" to contain "${sub}"`);
    },
    toBe_approx(expected, eps = 1e-9) {
      if (Math.abs(val - expected) > eps) throw new Error(`Expected ~${expected}, got ${val}`);
    },
  };
}

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); failed++; }
}

function describe(label, fn) {
  console.log(`\n${label}`);
  fn();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Basic calculations', () => {
  test('Column formula (simple arithmetic)', () => {
    const r = calcmd(`| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |`);
    expect(r.rows[0].cells[3].computed).toBe(4.5);
    expect(r.rows[1].cells[3].computed).toBe(4);
  });

  test('SUM aggregation', () => {
    const r = calcmd(`| Item | Amount |
|------|--------|
| A | 100 |
| B | 200 |
| Total | =sum(Amount) |`);
    expect(r.rows[2].cells[1].computed).toBe(300);
  });

  test('Multi-step column formulas', () => {
    const r = calcmd(`| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop | 2 | 1000 | 2000 | 200.00 | 2200.00 |`);
    expect(r.rows[0].cells[3].computed).toBe(2000);
    expect(r.rows[0].cells[4].computed).toBe(200);
    expect(r.rows[0].cells[5].computed).toBe(2200);
  });
});

describe('Cell formula overrides column formula (§2.3C)', () => {
  test('Cell formula takes precedence over column formula', () => {
    const r = calcmd(`| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| A | 10 | 5 | |
| B | 3 | 20 | |
| Sum | | | =sum(Total) |`);
    expect(r.rows[0].cells[3].computed).toBe(50);
    expect(r.rows[1].cells[3].computed).toBe(60);
    expect(r.rows[2].cells[3].computed).toBe(110);
  });
});

describe('Cell labels — @label: value syntax (§3.5)', () => {
  test('@label: value on any cell', () => {
    const r = calcmd(`| Line | Description | Amount |
|------|-------------|--------|
| 1 | Gross Income | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |`);
    expect(r.rows[0].cells[2].label).toBe('wages');
    expect(r.rows[0].cells[2].value).toBe(85000);
    expect(r.rows[2].cells[2].computed).toBe(85000 - 13850);
  });

  test('Bare @label shorthand', () => {
    const r = calcmd(`| Item | Value |
|------|-------|
| @rate | 1.5 |
| Result | =@rate * 100 |`);
    expect(r.rows[0].cells[0].label).toBe('rate');
    expect(r.rows[0].cells[0].value).toBe('@rate');
    expect(r.rows[1].cells[1].error).toBeDefined();
  });

  test('Bare @label with numeric value', () => {
    const r = calcmd(`| Item | Value |
|------|-------|
| Rate | @rate: 1.5 |
| Result | =@rate * 100 |`);
    expect(r.rows[0].cells[1].label).toBe('rate');
    expect(r.rows[0].cells[1].value).toBe(1.5);
    expect(r.rows[1].cells[1].computed).toBe(150);
  });

  test('Multiple labels in same row', () => {
    const r = calcmd(`| Q1 | Q2 | Total=Q1+Q2 |
|----|----|----|
| @r1: 5000 | @r2: 6000 | |
| @c1: 3000 | @c2: 3500 | |
| | | =(@r1+@r2) - (@c1+@c2) |`);
    expect(r.rows[0].cells[0].label).toBe('r1');
    expect(r.rows[0].cells[1].label).toBe('r2');
    expect(r.rows[2].cells[2].computed).toBe((5000 + 6000) - (3000 + 3500));
  });

  test('Duplicate label error', () => {
    const r = calcmd(`| Item | Value |
|------|-------|
| @dup: A | 10 |
| @dup: B | 20 |`);
    if (!r.errors.some(e => e.message.includes('Duplicate label')))
      throw new Error('Expected duplicate label error');
  });
});

describe('Column aliases — #alias (§2.5)', () => {
  test('Alias in formula', () => {
    const r = calcmd(`| Adjusted Gross Income #agi | Tax Rate #rate | Tax=agi*rate |
|-----------------------------|----------------|--------------|
| 85000 | 0.22 | |`);
    expect(r.columns[0].name).toBe('Adjusted Gross Income');
    expect(r.columns[0].alias).toBe('agi');
    expect(r.rows[0].cells[2].computed).toBe(85000 * 0.22);
  });

  test('Alias in cell label reference', () => {
    const r = calcmd(`| Line | Description | Adjusted Gross Income #agi |
|------|-------------|----------------------------|
| 1 | Gross | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |`);
    expect(r.rows[2].cells[2].computed).toBe(85000 - 13850);
  });
});

describe('Dependency graph & topological sort (§5.1-5.3)', () => {
  test('Cross-column dependencies evaluated in correct order', () => {
    const r = calcmd(`| Qty | Price | Subtotal=Qty*Price | Tax=Subtotal*0.1 | Total=Subtotal+Tax |
|-----|-------|--------------------|------------------|--------------------|
| 10 | 100 | | | |`);
    expect(r.rows[0].cells[2].computed).toBe(1000);
    expect(r.rows[0].cells[3].computed).toBe(100);
    expect(r.rows[0].cells[4].computed).toBe(1100);
  });

  test('Circular reference detected', () => {
    const r = calcmd(`| A=B+1 | B=A+1 |
|-------|-------|
| | |`);
    if (!r.errors.some(e => e.message.includes('Circular dependency')))
      throw new Error('Expected circular dependency error');
  });

  test('Cell override with label cross-row reference', () => {
    const r = calcmd(`| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Widget | 10 | 5 | |
| Gadget | 3 | 20 | @gd: |
| Half | | | =@gd / 2 |`);
    expect(r.rows[0].cells[3].computed).toBe(50);
    expect(r.rows[1].cells[3].computed).toBe(60);
    expect(r.rows[1].cells[3].label).toBe('gd');
    expect(r.rows[2].cells[3].computed).toBe(30);
  });
});

describe('Strict type checking (S-01, S-02)', () => {
  test('Number + String → ERROR', () => {
    const r = calcmd(`| A | B | C=A+B |
|---|---|-------|
| 5 | text | |`);
    expect(r.rows[0].cells[2].error).toBeDefined();
    expect(r.rows[0].cells[2].error).toContain('Cannot add');
  });

  test('Mixed type comparison → ERROR', () => {
    const r = calcmd(`| A | B | C=if(A>B,1,0) |
|---|---|----------------|
| 5 | text | |`);
    expect(r.rows[0].cells[2].error).toBeDefined();
    expect(r.rows[0].cells[2].error).toContain('Cannot compare');
  });
});

describe('New functions: floor, ceil (F-04, F-05)', () => {
  test('floor()', () => {
    const r = calcmd(`| Value | Result=floor(Value) |
|-------|---------------------|
| 3.7 | |
| -2.3 | |`);
    expect(r.rows[0].cells[1].computed).toBe(3);
    expect(r.rows[1].cells[1].computed).toBe(-3);
  });

  test('ceil()', () => {
    const r = calcmd(`| Value | Result=ceil(Value) |
|-------|---------------------|
| 3.2 | |
| -2.7 | |`);
    expect(r.rows[0].cells[1].computed).toBe(4);
    expect(r.rows[1].cells[1].computed).toBe(-2);
  });

  test('round() with 1 arg defaults to 0 decimals', () => {
    const r = calcmd(`| Value | Result=round(Value) |
|-------|---------------------|
| 3.7 | |`);
    expect(r.rows[0].cells[1].computed).toBe(4);
  });
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
