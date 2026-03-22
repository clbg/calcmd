// Debug test to find the memory issue
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loader from '@assemblyscript/loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('Loading WASM module...');
  const wasmPath = path.join(__dirname, '../build/release.wasm');
  const wasmModule = await loader.instantiate(
    fs.promises.readFile(wasmPath),
    {
      env: {
        abort: (msg, file, line, col) => {
          const msgStr = msg ? wasmModule.__getString(msg) : 'unknown';
          const fileStr = file ? wasmModule.__getString(file) : 'unknown';
          console.error(`\nWASM ABORT: ${msgStr}`);
          console.error(`  at ${fileStr}:${line}:${col}`);
        }
      }
    }
  );
  
  console.log('WASM module loaded successfully\n');
  
  // Test 1: Simple functions
  console.log('Test 1: add(5, 3)');
  try {
    const result = wasmModule.exports.add(5, 3);
    console.log('Result:', result);
    console.log('✅ PASSED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
  }
  
  // Test 2: String function
  console.log('Test 2: greet("World")');
  try {
    const result = wasmModule.exports.greet("World");
    console.log('Result:', result);
    console.log('✅ PASSED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
  }
  
  // Test 3: Very simple table
  console.log('Test 3: Simple table (no formulas)');
  const simpleTable = `| A | B |
|---|---|
| 1 | 2 |`;
  
  try {
    console.log('Input:', JSON.stringify(simpleTable));
    const result = wasmModule.exports.calcmd(simpleTable);
    console.log('Result type:', typeof result);
    console.log('Result:', result.substring(0, 200));
    console.log('✅ PASSED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack, '\n');
  }
  
  // Test 4: Table with one formula
  console.log('Test 4: Table with simple formula');
  const formulaTable = `| A | B=A*2 |
|---|-------|
| 5 | |`;
  
  try {
    console.log('Input:', JSON.stringify(formulaTable));
    const result = wasmModule.exports.calcmd(formulaTable);
    console.log('Result:', result.substring(0, 300));
    const parsed = JSON.parse(result);
    console.log('Parsed columns:', parsed.columns.length);
    console.log('Parsed rows:', parsed.rows.length);
    console.log('✅ PASSED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack, '\n');
  }
}

test().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
