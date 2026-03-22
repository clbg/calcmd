// Comprehensive test comparing WASM and TypeScript implementations
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
  // Load WASM module
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

function compareResults(name, markdown, tsResult, wasmResult) {
  console.log(`\n=== Test: ${name} ===`);
  
  let passed = true;
  const issues = [];
  
  // Compare basic structure
  if (tsResult.columns.length !== wasmResult.columns.length) {
    issues.push(`Column count mismatch: TS=${tsResult.columns.length}, WASM=${wasmResult.columns.length}`);
    passed = false;
  }
  
  if (tsResult.rows.length !== wasmResult.rows.length) {
    issues.push(`Row count mismatch: TS=${tsResult.rows.length}, WASM=${wasmResult.rows.length}`);
    passed = false;
  }
  
  // Compare columns
  for (let i = 0; i < Math.min(tsResult.columns.length, wasmResult.columns.length); i++) {
    const tsCol = tsResult.columns[i];
    const wasmCol = wasmResult.columns[i];
    
    if (tsCol.name !== wasmCol.name) {
      issues.push(`Column ${i} name mismatch: TS="${tsCol.name}", WASM="${wasmCol.name}"`);
      passed = false;
    }
    
    if (tsCol.formula !== wasmCol.formula) {
      issues.push(`Column ${i} formula mismatch: TS="${tsCol.formula}", WASM="${wasmCol.formula}"`);
      passed = false;
    }
  }
  
  // Compare cells
  for (let ri = 0; ri < Math.min(tsResult.rows.length, wasmResult.rows.length); ri++) {
    const tsRow = tsResult.rows[ri];
    const wasmRow = wasmResult.rows[ri];
    
    for (let ci = 0; ci < Math.min(tsRow.cells.length, wasmRow.cells.length); ci++) {
      const tsCell = tsRow.cells[ci];
      const wasmCell = wasmRow.cells[ci];
      
      // Compare values
      if (JSON.stringify(tsCell.value) !== JSON.stringify(wasmCell.value)) {
        issues.push(`Cell [${ri},${ci}] value mismatch: TS=${JSON.stringify(tsCell.value)}, WASM=${JSON.stringify(wasmCell.value)}`);
        passed = false;
      }
      
      // Compare computed values
      if (tsCell.computed !== null || wasmCell.computed !== null) {
        const tsCmp = tsCell.computed;
        const wasmCmp = wasmCell.computed;
        
        if (typeof tsCmp === 'number' && typeof wasmCmp === 'number') {
          // Allow small floating point differences
          if (Math.abs(tsCmp - wasmCmp) > 0.0001) {
            issues.push(`Cell [${ri},${ci}] computed mismatch: TS=${tsCmp}, WASM=${wasmCmp}`);
            passed = false;
          }
        } else if (tsCmp !== wasmCmp) {
          issues.push(`Cell [${ri},${ci}] computed mismatch: TS=${JSON.stringify(tsCmp)}, WASM=${JSON.stringify(wasmCmp)}`);
          passed = false;
        }
      }
      
      // Compare errors
      if (tsCell.error !== wasmCell.error) {
        issues.push(`Cell [${ri},${ci}] error mismatch: TS="${tsCell.error}", WASM="${wasmCell.error}"`);
        passed = false;
      }
      
      // Compare labels
      if (tsCell.label !== wasmCell.label) {
        issues.push(`Cell [${ri},${ci}] label mismatch: TS="${tsCell.label}", WASM="${wasmCell.label}"`);
        passed = false;
      }
    }
  }
  
  // Compare errors
  if (tsResult.errors.length !== wasmResult.errors.length) {
    issues.push(`Error count mismatch: TS=${tsResult.errors.length}, WASM=${wasmResult.errors.length}`);
    passed = false;
  }
  
  if (passed) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return passed;
}

async function runTests() {
  await setup();
  
  console.log('Starting comprehensive WASM vs TypeScript comparison tests...\n');
  
  const tests = [
    {
      name: 'Simple column formula',
      markdown: `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |`
    },
    {
      name: 'SUM aggregation',
      markdown: `| Item | Amount |
|------|--------|
| A | 100 |
| B | 200 |
| Total | =sum(Amount) |`
    },
    {
      name: 'Multi-step formulas',
      markdown: `| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop | 2 | 1000 | 2000 | 200.00 | 2200.00 |`
    },
    {
      name: 'Cell formula override',
      markdown: `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| A | 10 | 5 | |
| B | 3 | 20 | |
| Sum | | | =sum(Total) |`
    },
    {
      name: 'Cell labels',
      markdown: `| Line | Description | Amount |
|------|-------------|--------|
| 1 | Gross Income | @wages: 85000 |
| 2 | Deductions | @ded: 13850 |
| 3 | Taxable | =@wages - @ded |`
    },
    {
      name: 'Column aliases',
      markdown: `| Adjusted Gross Income #agi | Tax Rate #rate | Tax=agi*rate |
|-----------------------------|----------------|--------------|
| 85000 | 0.22 | |`
    },
    {
      name: 'floor() and ceil()',
      markdown: `| Value | Floor=floor(Value) | Ceil=ceil(Value) |
|-------|---------------------|-------------------|
| 3.7 | | |
| -2.3 | | |`
    },
    {
      name: 'Circular dependency',
      markdown: `| A=B+1 | B=A+1 |
|-------|-------|
| | |`
    },
    {
      name: 'Type error (number + string)',
      markdown: `| A | B | C=A+B |
|---|---|-------|
| 5 | text | |`
    },
    {
      name: 'AVG function',
      markdown: `| Value |
|-------|
| 10 |
| 20 |
| 30 |
| Avg | =avg(Value) |`
    },
    {
      name: 'MIN and MAX',
      markdown: `| Value |
|-------|
| 15 |
| 5 |
| 25 |
| Min | =min(Value) |
| Max | =max(Value) |`
    },
    {
      name: 'COUNT function',
      markdown: `| Item |
|------|
| A |
| B |
| C |
| Count | =count(Item) |`
    },
    {
      name: 'IF function',
      markdown: `| Score | Pass=if(Score>=60,"Yes","No") |
|-------|--------------------------------|
| 75 | |
| 45 | |`
    },
    {
      name: 'Comparison operators',
      markdown: `| A | B | Equal=A==B | Greater=A>B |
|---|---|------------|-------------|
| 5 | 5 | | |
| 10 | 5 | | |`
    },
    {
      name: 'Logical operators',
      markdown: `| A | B | And=A and B | Or=A or B | Not=not A |
|---|---|-------------|-----------|-----------|
| true | false | | | |
| false | false | | | |`
    },
    {
      name: 'ABS function',
      markdown: `| Value | Abs=abs(Value) |
|-------|----------------|
| -5 | |
| 10 | |`
    },
    {
      name: 'Modulo operator',
      markdown: `| A | B | Mod=A%B |
|---|---|---------|
| 10 | 3 | |
| 15 | 4 | |`
    },
    {
      name: 'Parentheses',
      markdown: `| A | B | C | Result=(A+B)*C |
|---|---|---|----------------|
| 2 | 3 | 4 | |`
    },
    {
      name: 'Negative numbers',
      markdown: `| A | B=A*-1 |
|---|--------|
| 5 | |
| -3 | |`
    },
    {
      name: 'Division',
      markdown: `| A | B | Div=A/B |
|---|---|---------|
| 10 | 2 | |
| 15 | 3 | |`
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const tsResult = calcmdTS(test.markdown);
      const wasmResult = calcmdWASM(test.markdown);
      
      if (compareResults(test.name, test.markdown, tsResult, wasmResult)) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`\n=== Test: ${test.name} ===`);
      console.log('❌ EXCEPTION:', error.message);
      console.log(error.stack);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${tests.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'='.repeat(60)}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
