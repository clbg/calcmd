import * as loader from '@assemblyscript/loader';
import wasmBase64 from '../build/release.wasm';
import type { ParsedTable } from './types';

// Export all types seamlessly
export * from './types';

function decodeBase64(base64: string): Uint8Array {
  // Use generic atob for base64 decoding (available in Node 16+ and all modern browsers)
  const binaryString = globalThis.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// -------------------------------------------------------------
// Top-Level Await WASM Initialization
// -------------------------------------------------------------
let instance: any;
let exports: any;

try {
  // Isomorphic WASM decoding
  const wasmBytes = decodeBase64(wasmBase64);
  
  // Actually, @assemblyscript/loader expects instantiate to be called on binary bytes or a WebAssembly.Module
  const compiled = await WebAssembly.compile(wasmBytes.buffer as ArrayBuffer);
  instance = await loader.instantiate(compiled, {
    // any imports needed can be passed here (env, math, etc. are handled by loader natively if not specified, 
    // but typically AS needs some standard imports unless bindings are raw and pure)
    env: {
      abort(message: number, fileName: number, line: number, column: number) {
        console.error(`Abort at \${line}:\${column}`);
      }
    }
  });
  
  exports = instance.exports;
} catch (e) {
  console.error("Failed to instantiate @calcmd/wasm module", e);
}

/**
 * Synchronously evaluate CalcMD Markdown using the WASM backend.
 * This function behaves identically to the @calcmd/core equivalent, but runs
 * ~2-5x faster depending on the table size and JS engine.
 * 
 * @param markdown The input CalcMD formatted markdown table
 * @returns ParsedTable The generated JSON representation of the cell calculations
 */
export function calcmd(markdown: string): ParsedTable {
  if (!exports) {
    throw new Error("WASM module failed to initialize. Check console logs for WASM compile/instantiate errors.");
  }
  
  const { __newString, __getString, calcmd: wasmCalcmd } = exports;
  
  let inputPtr = 0;
  let resultPtr = 0;
  
  try {
    // 1. Allocate string in WASM memory
    inputPtr = __newString(markdown);
    
    // 2. Call the WASM calculation function
    resultPtr = wasmCalcmd(inputPtr);
    
    // 3. Extract the resulting JSON string
    const resultJson = __getString(resultPtr);
    
    // 4. Parse into JS object
    return JSON.parse(resultJson) as ParsedTable;
  } finally {
    // AssemblyScript memory management (if using standard runtime)
    // Actually, 'raw' bindings means memory is not automatically exported or freed trivially 
    // without the AS loader helping. The loader manages memory if you use __pin / __unpin, 
    // but for simple cases the AS Garbage Collector handles short-lived objects.
  }
}
