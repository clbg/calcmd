# @calcmd/wasm

WebAssembly implementation of CalcMD - verifiable calculations in markdown tables.

## Overview

This package provides a WebAssembly build of CalcMD that can be used from any language that supports WASM, including JavaScript, TypeScript, Python, Go, Rust, Ruby, Java, and .NET.

## Status

✅ **Production Ready** - 100% feature complete with 42/42 tests passing

- Full CalcMD specification support
- Exact match with TypeScript implementation
- No runtime dependencies
- Small bundle size (~15KB, ~3-5KB gzipped)

## Quick Start

### Installation

```bash
npm install @calcmd/wasm
# or
pnpm add @calcmd/wasm
```

### Usage (JavaScript/TypeScript)

```javascript
import loader from '@assemblyscript/loader';
import fs from 'fs';

// Load WASM module
const wasmModule = await loader.instantiate(
  fs.promises.readFile('node_modules/@calcmd/wasm/build/release.wasm')
);

// Create wrapper function
const calcmd = (markdown) => {
  const { __newString, __getString } = wasmModule.exports;
  const inputPtr = __newString(markdown);
  const resultPtr = wasmModule.exports.calcmd(inputPtr);
  const result = __getString(resultPtr);
  return JSON.parse(result);
};

// Use it
const result = calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |
`);

console.log(result.rows[0].cells[3].computed); // 4.5
console.log(result.rows[1].cells[3].computed); // 4
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

- Node.js 18+
- pnpm

### Build

```bash
pnpm install
pnpm run build
```

### Test

```bash
pnpm test:all      # Run all tests
pnpm test:unit     # Unit tests
pnpm test:compare  # Comparison tests
pnpm test:core     # Core test suite
```

### Project Structure

```
assembly/          # AssemblyScript source code
  ├── types.ts              # Type definitions
  ├── parser.ts             # Markdown parser
  ├── formula-parser.ts     # Formula parser
  ├── evaluator.ts          # Main evaluator
  ├── dependency-graph.ts   # Dependency resolution
  └── ...
build/             # Compiled WASM output
tests/             # Test suites
docs/              # Documentation
```

## Performance

- Build size: ~15KB (release), ~3-5KB gzipped
- Build time: ~2 seconds
- Runtime: Faster than JavaScript for numeric operations

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
