#!/usr/bin/env node

/**
 * Basic test for Rust WASM implementation
 */

import { calcmd, initialize } from '../dist/index.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize WASM module with Node.js
const wasmPath = join(__dirname, '../pkg/calcmd_wasm_bg.wasm');
const wasmBuffer = await readFile(wasmPath);
await initialize(wasmBuffer);

const tests = [
  {
    name: 'Simple arithmetic',
    input: `| A | B | C=A+B |
|---|---|-------|
| 1 | 2 |       |
| 3 | 4 |       |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      if (result.table.rows[0].cells[2].computed !== 3) {
        throw new Error(`Expected 3, got ${result.table.rows[0].cells[2].computed}`);
      }
      if (result.table.rows[1].cells[2].computed !== 7) {
        throw new Error(`Expected 7, got ${result.table.rows[1].cells[2].computed}`);
      }
    }
  },
  {
    name: 'Column formula with multiplication',
    input: `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      const total1 = result.table.rows[0].cells[3].computed;
      const total2 = result.table.rows[1].cells[3].computed;
      if (total1 !== 4.5) {
        throw new Error(`Expected 4.5, got ${total1}`);
      }
      if (total2 !== 4) {
        throw new Error(`Expected 4, got ${total2}`);
      }
    }
  },
  {
    name: 'Sum aggregation',
    input: `| Amount |
|--------|
| 10 |
| 20 |
| 30 |
| **60=sum(Amount)** |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      const sum = result.table.rows[3].cells[0].computed;
      if (sum !== 60) {
        throw new Error(`Expected 60, got ${sum}`);
      }
    }
  },
  {
    name: 'Multiple operations',
    input: `| A | B | Sum=A+B | Product=A*B | Avg=(A+B)/2 |
|---|---|---------|-------------|-------------|
| 2 | 3 |         |             |             |
| 4 | 5 |         |             |             |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      // Row 0
      if (result.table.rows[0].cells[2].computed !== 5) {
        throw new Error(`Row 0 Sum: Expected 5, got ${result.table.rows[0].cells[2].computed}`);
      }
      if (result.table.rows[0].cells[3].computed !== 6) {
        throw new Error(`Row 0 Product: Expected 6, got ${result.table.rows[0].cells[3].computed}`);
      }
      if (result.table.rows[0].cells[4].computed !== 2.5) {
        throw new Error(`Row 0 Avg: Expected 2.5, got ${result.table.rows[0].cells[4].computed}`);
      }
      // Row 1
      if (result.table.rows[1].cells[2].computed !== 9) {
        throw new Error(`Row 1 Sum: Expected 9, got ${result.table.rows[1].cells[2].computed}`);
      }
      if (result.table.rows[1].cells[3].computed !== 20) {
        throw new Error(`Row 1 Product: Expected 20, got ${result.table.rows[1].cells[3].computed}`);
      }
      if (result.table.rows[1].cells[4].computed !== 4.5) {
        throw new Error(`Row 1 Avg: Expected 4.5, got ${result.table.rows[1].cells[4].computed}`);
      }
    }
  },
  {
    name: 'Functions: round, abs, floor, ceil',
    input: `| Value | Rounded=round(Value, 1) | Abs=abs(Value) | Floor=floor(Value) | Ceil=ceil(Value) |
|-------|-------------------------|----------------|--------------------|--------------------|
| 3.14159 | | | | |
| -2.7 | | | | |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      // Row 0: 3.14159
      if (result.table.rows[0].cells[1].computed !== 3.1) {
        throw new Error(`Round: Expected 3.1, got ${result.table.rows[0].cells[1].computed}`);
      }
      if (result.table.rows[0].cells[2].computed !== 3.14159) {
        throw new Error(`Abs: Expected 3.14159, got ${result.table.rows[0].cells[2].computed}`);
      }
      if (result.table.rows[0].cells[3].computed !== 3) {
        throw new Error(`Floor: Expected 3, got ${result.table.rows[0].cells[3].computed}`);
      }
      if (result.table.rows[0].cells[4].computed !== 4) {
        throw new Error(`Ceil: Expected 4, got ${result.table.rows[0].cells[4].computed}`);
      }
      // Row 1: -2.7
      if (result.table.rows[1].cells[2].computed !== 2.7) {
        throw new Error(`Abs(-2.7): Expected 2.7, got ${result.table.rows[1].cells[2].computed}`);
      }
    }
  },
  {
    name: 'IF function',
    input: `| Score | Grade=if(Score>=60, "Pass", "Fail") |
|-------|--------------------------------------|
| 75 | |
| 45 | |
| 90 | |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      if (result.table.rows[0].cells[1].computed !== "Pass") {
        throw new Error(`Expected "Pass", got ${result.table.rows[0].cells[1].computed}`);
      }
      if (result.table.rows[1].cells[1].computed !== "Fail") {
        throw new Error(`Expected "Fail", got ${result.table.rows[1].cells[1].computed}`);
      }
      if (result.table.rows[2].cells[1].computed !== "Pass") {
        throw new Error(`Expected "Pass", got ${result.table.rows[2].cells[1].computed}`);
      }
    }
  },
  {
    name: 'Labels',
    input: `| Item | Amount |
|------|--------|
| Base | @base: 100 |
| Tax | =@base*0.1 |
| Total | =@base+@base*0.1 |`,
    check: (result) => {
      if (result.errors.length > 0) {
        throw new Error(`Unexpected errors: ${JSON.stringify(result.errors)}`);
      }
      if (result.table.rows[1].cells[1].computed !== 10) {
        throw new Error(`Tax: Expected 10, got ${result.table.rows[1].cells[1].computed}`);
      }
      if (result.table.rows[2].cells[1].computed !== 110) {
        throw new Error(`Total: Expected 110, got ${result.table.rows[2].cells[1].computed}`);
      }
    }
  }
];

async function runTests() {
  console.log('🧪 Running Rust WASM tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await calcmd(test.input);
      test.check(result);
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
