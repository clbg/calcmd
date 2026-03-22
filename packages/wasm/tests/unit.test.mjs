// Unit test for individual WASM functions
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loader from '@assemblyscript/loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('Loading WASM module...');
  const wasmPath = path.join(__dirname, '../build/debug.wasm');
  const wasmModule = await loader.instantiate(
    fs.promises.readFile(wasmPath),
    {
      env: {
        abort: (msg, file, line, col) => {
          const msgStr = msg ? wasmModule.exports.__getString(msg) : 'unknown';
          const fileStr = file ? wasmModule.exports.__getString(file) : 'unknown';
          console.error(`\nWASM ABORT: ${msgStr}`);
          console.error(`  at ${fileStr}:${line}:${col}\n`);
        }
      }
    }
  );
  
  console.log('WASM module loaded\n');
  
  const { __newString, __getString, __pin, __unpin } = wasmModule.exports;
  
  // Test basic string operations
  console.log('=== Testing String Operations ===\n');
  
  console.log('Test: greet("World")');
  try {
    const inputPtr = __newString("World");
    const resultPtr = wasmModule.exports.greet(inputPtr);
    const result = __getString(resultPtr);
    console.log('Result:', result);
    console.log('Expected: Hello, World!');
    console.log(result === 'Hello, World!' ? '✅ PASSED\n' : '❌ FAILED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
  }
  
  console.log('Test: calcmd with header + separator');
  try {
    const input = "| A |\n|---|";
    console.log('Input:', JSON.stringify(input));
    const inputPtr = __newString(input);
    const resultPtr = wasmModule.exports.calcmd(inputPtr);
    const result = __getString(resultPtr);
    console.log('Result:', result.substring(0, 300));
    const parsed = JSON.parse(result);
    console.log('Columns:', parsed.columns.length);
    console.log('Rows:', parsed.rows.length);
    console.log('Errors:', parsed.errors.length);
    console.log('✅ PASSED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack, '\n');
  }
  
  console.log('Test: calcmd with simple formula');
  try {
    const input = "| A | B=A*2 |\n|---|-------|\n| 5 | |";
    console.log('Input:', JSON.stringify(input));
    const inputPtr = __newString(input);
    const resultPtr = wasmModule.exports.calcmd(inputPtr);
    const result = __getString(resultPtr);
    const parsed = JSON.parse(result);
    console.log('Columns:', parsed.columns.length);
    console.log('Rows:', parsed.rows.length);
    console.log('Cell[0,1] computed:', parsed.rows[0].cells[1].computed);
    console.log('Expected: 10');
    console.log(parsed.rows[0].cells[1].computed === 10 ? '✅ PASSED\n' : '❌ FAILED\n');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack, '\n');
  }
}

test().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
