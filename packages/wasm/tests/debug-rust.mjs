#!/usr/bin/env node

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

const markdown = `| A | B | C=A+B |
|---|---|-------|
| 1 | 2 |       |
| 3 | 4 |       |`;

console.log('Input markdown:');
console.log(markdown);
console.log('\n---\n');

try {
  const result = await calcmd(markdown);
  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error);
}
