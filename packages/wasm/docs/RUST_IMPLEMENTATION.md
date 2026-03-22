# Rust Implementation Guide

This document describes the Rust implementation of CalcMD WASM.

## Architecture Overview

The Rust implementation follows the same pipeline as the TypeScript version but leverages Rust's type system and performance characteristics.

### Module Structure

```
src/
├── lib.rs              # WASM entry point, exports calcmd()
├── ast.rs              # Type definitions and AST nodes
├── parser.rs           # Markdown table parser
├── formula_parser.rs   # Formula expression parser
├── formula.pest        # Pest grammar definition
├── evaluator.rs        # Main evaluation engine
├── index.ts            # TypeScript wrapper
└── types.ts            # TypeScript type definitions
```

## Key Components

### 1. Parser (parser.rs)

Parses markdown tables into structured data:

- Splits table into rows and columns
- Extracts formulas from headers and cells
- Identifies labels (`@label: value`)
- Identifies aliases (`#alias`)
- Performs basic value type inference

### 2. Formula Parser (formula_parser.rs + formula.pest)

Uses pest parser generator to parse formula expressions:

- Tokenizes formula strings
- Builds expression AST
- Handles operator precedence
- Supports all CalcMD operators and functions

**Pest Grammar Features:**
- String literals with quotes
- Number literals (integer and float)
- Boolean literals
- Identifiers (column names)
- Label references (`@label`)
- Function calls
- Binary operators with precedence
- Unary operators
- Parenthesized expressions

### 3. Evaluator (evaluator.rs)

Main evaluation engine:

- Expands column formulas to cells
- Builds dependency graph
- Performs topological sort using petgraph
- Detects circular dependencies
- Evaluates expressions in dependency order
- Collects and reports errors

**Dependency Resolution:**
- Uses petgraph's `tarjan_scc` for strongly connected components
- Detects both self-loops and multi-node cycles
- Reports full cycle paths in errors

**Built-in Functions:**
- Aggregations: `sum()`, `avg()`, `count()`, `min()`, `max()`
- Math: `round()`, `abs()`, `floor()`, `ceil()`
- Conditional: `if(condition, true_val, false_val)`

### 4. AST (ast.rs)

Type definitions with serde serialization:

- `CellValue` - Primitive values (number, string, boolean, null)
- `Cell` - Table cell with value, formula, computed result
- `Row` - Array of cells
- `Column` - Column definition with optional formula
- `Table` - Complete table structure
- `ParsedTable` - Table + dependencies + errors
- `Expression` - Formula AST nodes

**Serialization:**
- Uses serde with JSON format
- Renames fields to camelCase for JavaScript compatibility
- Skips optional fields when None

## Implementation Details

### Error Handling

Rust doesn't support exceptions in WASM, so errors are handled via:

1. **Result types** - Functions return `Result<T, String>`
2. **Error collection** - Errors accumulated in `Vec<ValidationError>`
3. **Error propagation** - Errors bubble up through expression evaluation

### Memory Management

- Rust's ownership system ensures memory safety
- No manual memory management needed
- WASM memory managed by wasm-bindgen

### Type Safety

Rust's type system prevents many common errors:

- No null pointer exceptions
- No type coercion bugs
- Compile-time guarantees

## Differences from TypeScript

### 1. Parser Generator

- **TypeScript**: Hand-written recursive descent parser
- **Rust**: pest parser generator with declarative grammar

**Advantages:**
- Easier to maintain and extend
- Better error messages
- Automatic precedence handling

### 2. Dependency Resolution

- **TypeScript**: Custom topological sort implementation
- **Rust**: petgraph library with tarjan_scc

**Advantages:**
- Battle-tested algorithm
- Better cycle detection
- More efficient

### 3. Serialization

- **TypeScript**: Native JSON support
- **Rust**: serde with custom serialization

**Advantages:**
- Type-safe serialization
- Flexible field naming
- Efficient binary formats possible

## Testing

### Test Suite

Located in `tests/rust-basic.test.mjs`:

1. Simple arithmetic
2. Column formulas
3. Sum aggregation
4. Multiple operations
5. Math functions (round, abs, floor, ceil)
6. IF conditional function
7. Label references

### Running Tests

```bash
node tests/rust-basic.test.mjs
```

### Debug Tools

- `tests/debug-rust.mjs` - General debugging
- `tests/debug-if.mjs` - IF function debugging
- `tests/debug-labels.mjs` - Label debugging

## Building

### WASM Build

```bash
wasm-pack build --target web --out-dir pkg
```

This generates:
- `pkg/calcmd_wasm_bg.wasm` - WASM binary
- `pkg/calcmd_wasm.js` - JavaScript loader
- `pkg/calcmd_wasm.d.ts` - TypeScript definitions

### TypeScript Wrapper

```bash
tsup
```

This generates:
- `dist/index.js` - ESM bundle
- `dist/index.d.ts` - TypeScript definitions

## Future Improvements

### Performance

- [ ] Benchmark against TypeScript version
- [ ] Optimize hot paths
- [ ] Consider SIMD for numeric operations
- [ ] Streaming parser for large tables

### Features

- [ ] More built-in functions
- [ ] Custom function support
- [ ] Better error messages with source locations
- [ ] Incremental evaluation

### Multi-language Support

- [ ] Python bindings (wasmtime-py)
- [ ] Go bindings (wazero)
- [ ] Ruby bindings (wasmtime-rb)
- [ ] Java bindings (wasmtime-java)

## Resources

- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [pest Book](https://pest.rs/book/)
- [petgraph Documentation](https://docs.rs/petgraph/)
