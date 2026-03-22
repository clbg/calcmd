// Complete test suite ported from packages/core/tests/basic.test.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loader from '@assemblyscript/loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import TypeScript version
import { calcmd as calcmdTS } from '../../core/dist/index.js';

let wasmModule;
let calcmdWASM;

async function setup() {
  const wasmPath = path.join(__dirname, '../build/release.wasm');
  wasmModule = await loader.instantiate(
    fs.promises.readFile(wasmPath),
    {
      env: {
        abort: (msg, file, line, col) => {
          const msgStr = msg ? wasmModule.exports.__getString(msg) : 'unknown';
          const fileStr = file ? wasmModule.exports.__getString(file) : 'unknown';
          console.error(`WASM abort: ${msgStr} at ${fileStr}:${line}:${col}`);
        }
      }
    }
  );
  
  calcmdWASM = (markdown) => {
    const { __newString, __getString } = wasmModule.exports;
    const inputPtr = __newString(markdown);
    const resultPtr = wasmModule.exports.calcmd(inputPtr);
    const result = __getString(resultPtr);
    return JSON.parse(result);
  };
}

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toBeDefined() {
      if (value === undefined || value === null) {
        throw new Error(`Expected value to be defined, got ${value}`);
      }
    },
    toContain(substring) {
      if (typeof value !== 'string' || !value.includes(substring)) {
        throw new Error(`Expected "${value}" to contain "${substring}"`);
      }
    }
  };
}

async function runAllTests() {
  await setup();
  
  console.log('\n=== CalcMD WASM - Complete Core Test Suite ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Basic calculations
  console.log('Basic calculations:');
  
  if (runTest('Column formula (simple arithmetic)', () => {
    const md = `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[3].computed).toBe(4.5);
    expect(result.rows[1].cells[3].computed).toBe(4);
  })) passed++; else failed++;
  
  if (runTest('SUM aggregation', () => {
    const md = `| Item | Amount |
|------|--------|
| A | 100 |
| B | 200 |
| Total | =sum(Amount) |`;
    const result = calcmdWASM(md);
    expect(result.rows[2].cells[1].computed).toBe(300);
  })) passed++; else failed++;
  
  if (runTest('Multi-step column formulas', () => {
    const md = `| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop | 2 | 1000 | 2000 | 200.00 | 2200.00 |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[3].computed).toBe(2000);
    expect(result.rows[0].cells[4].computed).toBe(200);
    expect(result.rows[0].cells[5].computed).toBe(2200);
  })) passed++; else failed++;
  
  // Cell formula overrides
  console.log('\nCell formula overrides column formula (§2.3C):');
  
  if (runTest('Cell formula takes precedence over column formula', () => {
    const md = `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| A | 10 | 5 | |
| B | 3 | 20 | |
| Sum | | | =sum(Total) |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[3].computed).toBe(50);
    expect(result.rows[1].cells[3].computed).toBe(60);
    expect(result.rows[2].cells[3].computed).toBe(110);
  })) passed++; else failed++;
  
  // Cell labels
  console.log('\nCell labels — @label: value syntax (§3.5):');
  
  if (runTest('@label: value on any cell', () => {
    const md = `| Line | Description | Amount |
|------|-------------|--------|
| 1 | Gross Income | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[2].label).toBe('wages');
    expect(result.rows[0].cells[2].value).toBe(85000);
    expect(result.rows[2].cells[2].computed).toBe(85000 - 13850);
  })) passed++; else failed++;
  
  if (runTest('Bare @label shorthand', () => {
    const md = `| Item | Value |
|------|-------|
| @rate | 1.5 |
| Result | =@rate * 100 |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[0].label).toBe('rate');
    expect(result.rows[0].cells[0].value).toBe('@rate');
    expect(result.rows[1].cells[1].error).toBeDefined();
  })) passed++; else failed++;
  
  if (runTest('Bare @label with numeric value', () => {
    const md = `| Item | Value |
|------|-------|
| Rate | @rate: 1.5 |
| Result | =@rate * 100 |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[1].label).toBe('rate');
    expect(result.rows[0].cells[1].value).toBe(1.5);
    expect(result.rows[1].cells[1].computed).toBe(150);
  })) passed++; else failed++;
  
  if (runTest('Multiple labels in same row', () => {
    const md = `| Q1 | Q2 | Total=Q1+Q2 |
|----|----|----|
| @r1: 5000 | @r2: 6000 | |
| @c1: 3000 | @c2: 3500 | |
| | | =(@r1+@r2) - (@c1+@c2) |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[0].label).toBe('r1');
    expect(result.rows[0].cells[1].label).toBe('r2');
    expect(result.rows[2].cells[2].computed).toBe((5000 + 6000) - (3000 + 3500));
  })) passed++; else failed++;
  
  if (runTest('Duplicate label error', () => {
    const md = `| Item | Value |
|------|-------|
| @dup: A | 10 |
| @dup: B | 20 |`;
    const result = calcmdWASM(md);
    const hasDupError = result.errors.some(e => e.message.includes('Duplicate label'));
    if (!hasDupError) throw new Error('Expected duplicate label error');
  })) passed++; else failed++;
  
  // Column aliases
  console.log('\nColumn aliases — #alias (§2.5):');
  
  if (runTest('Alias in formula', () => {
    const md = `| Adjusted Gross Income #agi | Tax Rate #rate | Tax=agi*rate |
|-----------------------------|----------------|--------------|
| 85000 | 0.22 | |`;
    const result = calcmdWASM(md);
    expect(result.columns[0].name).toBe('Adjusted Gross Income');
    expect(result.columns[0].alias).toBe('agi');
    expect(result.rows[0].cells[2].computed).toBe(85000 * 0.22);
  })) passed++; else failed++;
  
  if (runTest('Alias in cell label reference', () => {
    const md = `| Line | Description | Adjusted Gross Income #agi |
|------|-------------|----------------------------|
| 1 | Gross | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |`;
    const result = calcmdWASM(md);
    expect(result.rows[2].cells[2].computed).toBe(85000 - 13850);
  })) passed++; else failed++;
  
  // Dependency graph
  console.log('\nDependency graph & topological sort (§5.1-5.3):');
  
  if (runTest('Cross-column dependencies evaluated in correct order', () => {
    const md = `| Qty | Price | Subtotal=Qty*Price | Tax=Subtotal*0.1 | Total=Subtotal+Tax |
|-----|-------|--------------------|------------------|--------------------|
| 10 | 100 | | | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[2].computed).toBe(1000);
    expect(result.rows[0].cells[3].computed).toBe(100);
    expect(result.rows[0].cells[4].computed).toBe(1100);
  })) passed++; else failed++;
  
  if (runTest('Circular reference detected', () => {
    const md = `| A=B+1 | B=A+1 |
|-------|-------|
| | |`;
    const result = calcmdWASM(md);
    const hasCircular = result.errors.some(e => e.message.includes('Circular dependency'));
    if (!hasCircular) throw new Error('Expected circular dependency error');
  })) passed++; else failed++;
  
  if (runTest('Cell override with label cross-row reference', () => {
    const md = `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Widget | 10 | 5 | |
| Gadget | 3 | 20 | @gd: |
| Half | | | =@gd / 2 |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[3].computed).toBe(50);
    expect(result.rows[1].cells[3].computed).toBe(60);
    expect(result.rows[1].cells[3].label).toBe('gd');
    expect(result.rows[2].cells[3].computed).toBe(30);
  })) passed++; else failed++;
  
  // Strict type checking
  console.log('\nStrict type checking (S-01, S-02):');
  
  if (runTest('Number + String → ERROR', () => {
    const md = `| A | B | C=A+B |
|---|---|-------|
| 5 | text | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[2].error).toBeDefined();
    expect(result.rows[0].cells[2].error).toContain('Cannot add');
  })) passed++; else failed++;
  
  if (runTest('Mixed type comparison → ERROR', () => {
    const md = `| A | B | C=if(A>B,1,0) |
|---|---|----------------|
| 5 | text | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[2].error).toBeDefined();
    expect(result.rows[0].cells[2].error).toContain('Cannot compare');
  })) passed++; else failed++;
  
  // New functions
  console.log('\nNew functions: floor, ceil (F-04, F-05):');
  
  if (runTest('floor()', () => {
    const md = `| Value | Result=floor(Value) |
|-------|---------------------|
| 3.7 | |
| -2.3 | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[1].computed).toBe(3);
    expect(result.rows[1].cells[1].computed).toBe(-3);
  })) passed++; else failed++;
  
  if (runTest('ceil()', () => {
    const md = `| Value | Result=ceil(Value) |
|-------|---------------------|
| 3.2 | |
| -2.7 | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[1].computed).toBe(4);
    expect(result.rows[1].cells[1].computed).toBe(-2);
  })) passed++; else failed++;
  
  if (runTest('round() with 1 arg defaults to 0 decimals', () => {
    const md = `| Value | Result=round(Value) |
|-------|---------------------|
| 3.7 | |`;
    const result = calcmdWASM(md);
    expect(result.rows[0].cells[1].computed).toBe(4);
  })) passed++; else failed++;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passed + failed} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
