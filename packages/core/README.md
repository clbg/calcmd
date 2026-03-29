# @calcmd/core

Rust + WebAssembly implementation of CalcMD — verifiable calculations in markdown tables.

## Overview

This package is the core of CalcMD. It parses markdown tables with embedded formulas and evaluates them, returning computed values and any errors. Written in Rust, compiled to WebAssembly via wasm-pack, with a thin TypeScript wrapper.

## Usage

```typescript
import { calcmd } from '@calcmd/core';

const result = calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |
`);

console.log(result.rows[0].cells[3].computed); // 4.5
console.log(result.rows[1].cells[3].computed); // 4
console.log(result.errors);                    // []
```

The call is **synchronous**. In browser environments, `vite-plugin-wasm` handles WASM loading transparently.

## Utilities

```typescript
import { format, fill, formatValue } from '@calcmd/core';

// Auto-align markdown table columns (CJK-aware)
const aligned = format(markdown);

// Rewrite formula cells with their computed values
const filled = fill(markdown, result);

// Format a cell value for display (6 significant digits)
const display = formatValue(cell.computed); // "4.5", "true", ""
```

## ParsedTable shape

```typescript
interface ParsedTable {
  table: { columns, rows, labels, aliases }; // raw Rust output
  rows: Row[];       // alias for table.rows
  columns: Column[]; // alias for table.columns
  dependencies: {
    nodes: Record<string, CellNode>;
    edges: Map<string, Set<string>>; // cellId → Set of dependency IDs
    order: string[];
  };
  errors: ValidationError[];
}
```

## Development

### Prerequisites

- Rust 1.70+ with `wasm32-unknown-unknown` target
- wasm-pack
- Node.js 18+
- pnpm

### Build

```bash
# From repo root
pnpm --filter @calcmd/core build

# Or from this directory
pnpm run build:wasm     # Rust → WASM (wasm-pack --target bundler)
pnpm run build:wrapper  # TypeScript wrapper (tsup + tsc)
pnpm run build          # Both
```

### Test

```bash
pnpm --filter @calcmd/core test
# or: node tests/basic.test.mjs
```

19 tests covering all CalcMD features.

## Architecture

```
src/
├── lib.rs            # WASM entry point — exports calcmd(markdown) → JSON string
├── ast.rs            # Rust type definitions (serde Serialize/Deserialize)
├── parser.rs         # Markdown table parser
├── formula_parser.rs # Formula parser (pest grammar)
├── formula.pest      # Pest PEG grammar
├── evaluator.rs      # Evaluator with petgraph topological sort
├── index.ts          # JS wrapper — normalizes JSON, exports calcmd()
├── types.ts          # TypeScript types matching Rust JSON output
└── utils.ts          # Pure TS: format(), fill(), formatValue()
pkg/                  # wasm-pack output (bundler target)
dist/                 # tsup + tsc output
```
