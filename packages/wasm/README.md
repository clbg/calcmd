# @calcmd/wasm

Rust + WebAssembly implementation of CalcMD - verifiable calculations in markdown tables.

## Overview

This package provides a high-performance WebAssembly build of CalcMD written in Rust. It can be used from JavaScript/TypeScript in both Node.js and browser environments, with future support planned for Python, Go, and other languages.

## Status

✅ **Alpha** - Core functionality complete with 7/7 basic tests passing

- Full CalcMD specification support
- Rust implementation with pest parser and petgraph
- TypeScript wrapper for easy integration
- Small bundle size (~15KB WASM)

## Quick Start

### Installation

```bash
# From workspace root
pnpm install

# Build WASM package
cd packages/wasm
pnpm run build
```

### Usage (Node.js)

```javascript
import { calcmd, initialize } from '@calcmd/wasm';
import { readFile } from 'fs/promises';

// Initialize WASM module (Node.js requires manual loading)
const wasmBuffer = await readFile('path/to/calcmd_wasm_bg.wasm');
await initialize(wasmBuffer);

// Use it
const result = await calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |
`);

console.log(result.table.rows[0].cells[3].computed); // 4.5
console.log(result.table.rows[1].cells[3].computed); // 4
```

### Usage (Browser)

```javascript
import { calcmd } from '@calcmd/wasm';

// Browser automatically loads WASM
const result = await calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |
`);

console.log(result.table.rows[0].cells[3].computed); // 4.5
```

## Features

All CalcMD features are supported:

- **Operators**: `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `and`, `or`, `not`
- **Functions**: `sum()`, `avg()`, `min()`, `max()`, `count()`, `round()`, `abs()`, `floor()`, `ceil()`, `if()`
- **Cell labels**: `@label: value` for cross-row references
- **Column aliases**: `#alias` for ergonomic formulas
- **Dependency resolution**: Automatic topological sort
- **Error handling**: Circular dependency detection, type checking

## Documentation

📚 **[Complete Documentation](docs/README.md)** - Start here for all documentation

Key documents:
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and implementation details
- [Development Guide](docs/DEVELOPMENT.md) - Building, testing, and contributing
- [Change History](docs/CHANGELOG.md) - Project evolution and optimizations
- [Library Optimization](docs/LIBRARY-OPTIMIZATION.md) - Performance improvements

## Development

### Prerequisites

- Rust 1.70+ with wasm32-unknown-unknown target
- Node.js 18+
- pnpm
- wasm-pack

### Build

```bash
pnpm install
pnpm run build:wasm    # Build WASM with wasm-pack
pnpm run build:wrapper # Build TypeScript wrapper
pnpm run build         # Build both
```

### Test

```bash
node tests/rust-basic.test.mjs  # Run basic test suite (7 tests)
```

### Project Structure

```
src/                # Rust source code
  ├── lib.rs              # WASM entry point
  ├── ast.rs              # Type definitions
  ├── parser.rs           # Markdown parser
  ├── formula_parser.rs   # Formula parser (pest)
  ├── formula.pest        # Pest grammar
  ├── evaluator.rs        # Main evaluator
  ├── index.ts            # TypeScript wrapper
  └── types.ts            # TypeScript types
pkg/                # Generated WASM output (gitignored)
tests/              # Test suites
docs/               # Documentation
```

## Architecture

### Technology Stack

- **Rust** - Core implementation language
- **pest** - Parser generator for formula parsing
- **petgraph** - Graph algorithms for dependency resolution
- **wasm-bindgen** - Rust-JavaScript interop
- **serde** - Serialization framework

### Pipeline

```
Markdown → Parser → Formula Parser → Evaluator → JSON
           (Rust)   (pest)           (petgraph)
```

## Performance

- Build size: ~15KB (release WASM)
- Build time: ~4 seconds
- Runtime: Expected to be faster than JavaScript for complex calculations

## Language SDKs

### Planned

- **JavaScript/TypeScript**: User-friendly wrapper (coming soon)
- **Python**: Using wasmtime-py or wasmer-python
- **Go**: Using wazero or wasmer-go
- **Rust**: Using wasmtime or wasmer
- **Ruby**: Using wasmtime-rb
- **Java**: Using wasmtime-java
- **.NET**: Using wasmtime-dotnet

## License

MIT

## Links

- [CalcMD Specification](../../docs/04-Spec.md)
- [TypeScript Implementation](../core/)
- [GitHub Repository](https://github.com/clbg/calcmd)
- [Website](https://clbg.github.io/calcmd/)
