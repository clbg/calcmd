// CalcMD WebAssembly Entry Point

import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { serializeTable } from './json';

/**
 * Main entry point for CalcMD WASM
 * Takes a markdown string and returns a JSON string with the parsed result
 */
export function calcmd(markdown: string): string {
  const parser = new Parser();
  const table = parser.parse(markdown);

  const evaluator = new Evaluator();
  const result = evaluator.evaluate(table);

  return serializeTable(result);
}

/**
 * Simple test function to verify WASM is working
 */
export function add(a: i32, b: i32): i32 {
  return a + b;
}

/**
 * Test string manipulation
 */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
