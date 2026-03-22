# CalcMD WASM Architecture

## Project Structure

```
packages/wasm/
├── assembly/              # AssemblyScript source code (compiles to WASM)
│   ├── types.ts          # Type definitions (mirrors core/src/types.ts)
│   ├── utils.ts          # String utilities and helpers
│   ├── parser.ts         # Markdown table parser
│   ├── formula-parser.ts # Formula expression parser
│   ├── evaluator.ts      # Main evaluator (orchestrates evaluation)
│   ├── evaluator-context.ts    # Evaluation context state
│   ├── evaluator-functions.ts  # Built-in functions (sum, avg, etc.)
│   ├── dependency-graph.ts     # Dependency resolution & topological sort
│   ├── json.ts           # JSON serialization
│   ├── index.ts          # Public API entry point
│   └── tsconfig.json     # AssemblyScript compiler config
│
├── build/                # Compiled WASM output (gitignored)
│   ├── debug.wasm        # Debug build with source maps
│   ├── release.wasm      # Optimized production build
│   └── *.d.ts, *.js      # TypeScript definitions and JS loaders
│
├── tests/                # Test suites
│   ├── unit.test.mjs     # Basic functionality tests
│   ├── compare.test.mjs  # WASM vs TypeScript comparison tests
│   └── all-core-tests.mjs # Complete core test suite port
│
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # This file - project structure
│   ├── STATUS.md         # Implementation status
│   ├── TESTING.md        # Testing guide
│   └── TEST-RESULTS.md   # Test results summary
│
├── asconfig.json         # AssemblyScript build configuration
├── package.json          # NPM package configuration
├── tsconfig.json         # TypeScript configuration (for tooling)
├── run-all-tests.sh      # Convenience script to run all tests
└── README.md             # Package overview and quick start
```

## Architecture Overview

### Compilation Pipeline

```
AssemblyScript Source (assembly/*.ts)
  ↓
AssemblyScript Compiler (asc)
  ↓
WebAssembly Binary (build/*.wasm)
  ↓
JavaScript Loader (@assemblyscript/loader)
  ↓
JavaScript/TypeScript Application
```

### Evaluation Pipeline

```
Markdown String
  ↓
Parser (parser.ts)
  → Tokenize and parse markdown table
  → Extract formulas from headers and cells
  → Parse cell labels (@label: value)
  → Parse column aliases (#alias)
  ↓
ParsedTable (types.ts)
  → Columns with formulas and aliases
  → Rows with cells (value, formula, label)
  ↓
FormulaParser (formula-parser.ts)
  → Parse formula strings into Expression AST
  → Support all operators and functions
  ↓
DependencyGraphBuilder (dependency-graph.ts)
  → Build dependency graph between cells
  → Topological sort for evaluation order
  → Detect circular dependencies
  ↓
Evaluator (evaluator.ts)
  → Evaluate cells in dependency order
  → Compute formula results
  → Collect errors (no exceptions)
  ↓
ParsedTable with computed values
  ↓
JSON Serializer (json.ts)
  → Convert to JSON string
  ↓
JSON String (returned to JavaScript)
```

## Module Responsibilities

### Core Modules

**types.ts**
- All type definitions
- Mirrors `packages/core/src/types.ts`
- Defines AST nodes, table structure, cell values

**parser.ts**
- Markdown table parsing
- Cell value extraction
- Label and alias detection
- No formula evaluation

**formula-parser.ts**
- Formula string → Expression AST
- Tokenization and parsing
- Operator precedence
- Function call parsing

**evaluator.ts**
- Main orchestrator
- Calls parser, dependency builder, evaluator
- Manages evaluation lifecycle
- Error collection

### Evaluator Subsystems

**dependency-graph.ts**
- Builds dependency graph
- Topological sort (DFS-based)
- Circular dependency detection
- Cycle path reporting

**evaluator-context.ts**
- Evaluation state management
- Column/alias lookups
- Label resolution
- Current row/cell tracking

**evaluator-functions.ts**
- Built-in function implementations
- Aggregations: sum, avg, min, max, count
- Math: round, abs, floor, ceil
- Conditional: if
- Column value extraction

### Utilities

**utils.ts**
- String manipulation (toLowerCase, trim, split, etc.)
- Number parsing (parseFloat, parseInt)
- Cell ID generation
- Helper functions

**json.ts**
- ParsedTable → JSON string
- Manual serialization (no JSON.stringify in WASM)
- Handles all value types

## Key Design Decisions

### 1. No Exceptions
AssemblyScript doesn't support exceptions, so:
- All errors return error values (StringValue with "ERROR:" prefix)
- Errors are collected in arrays
- Functions check for errors and propagate them

### 2. No Closures
AssemblyScript doesn't support closures, so:
- Nested functions refactored to class methods
- TopoSorter class instead of nested visit function
- State passed explicitly

### 3. Explicit Type Checking
No `any` type in AssemblyScript, so:
- Use `instanceof` for type checking
- Explicit type casts after checks
- Proper type guards

### 4. Map.get() Pattern
Map.get() returns nullable, so:
- Always check Map.has() first
- Then use Map.get() with non-null assertion
- Or handle null case explicitly

### 5. String Handling
Strings are managed differently in WASM:
- Use __newString to pass strings to WASM
- Use __getString to get strings from WASM
- Manual string building (no template literals in some contexts)

## Performance Characteristics

### Build Size
- Debug build: ~50KB
- Release build: ~15KB (optimized)
- Gzipped: ~3-5KB (estimated)

### Build Time
- Debug: ~1 second
- Release: ~2 seconds
- Total: ~2 seconds

### Runtime Performance
- Faster than JavaScript for numeric operations
- Comparable for string operations
- No JIT warmup needed (ahead-of-time compiled)

## Testing Strategy

### Three Test Suites

1. **Unit Tests** (unit.test.mjs)
   - Basic functionality
   - WASM module loading
   - Simple calculations

2. **Comparison Tests** (compare.test.mjs)
   - Compare WASM vs TypeScript output
   - Verify exact match on all fields
   - 20 comprehensive test cases

3. **Core Test Suite** (all-core-tests.mjs)
   - Port of packages/core/tests/basic.test.ts
   - 19 tests covering all features
   - Ensures feature parity

### Test Coverage
- All operators
- All functions
- All features (labels, aliases, etc.)
- Error handling
- Edge cases

## Future Enhancements

### Planned
1. JavaScript/TypeScript wrapper (src/ directory)
2. Python SDK (using wasmtime-py or wasmer-python)
3. Performance benchmarks
4. Streaming parser for large tables
5. SIMD optimizations

### Possible
1. Parallel evaluation (Web Workers)
2. Incremental parsing
3. Custom memory allocator
4. Additional language SDKs (Go, Rust, Ruby, Java, .NET)

## Development Workflow

### Building
```bash
pnpm run build          # Build both debug and release
pnpm run asbuild:debug  # Debug build only
pnpm run asbuild:release # Release build only
```

### Testing
```bash
pnpm test:all      # Run all tests
pnpm test:unit     # Unit tests only
pnpm test:compare  # Comparison tests only
pnpm test:core     # Core test suite only
```

### Development
```bash
pnpm run dev       # Watch mode (debug build)
```

## Maintenance Notes

### Keeping in Sync with TypeScript
When updating `packages/core/src/`:
1. Update corresponding file in `assembly/`
2. Adapt for AssemblyScript constraints
3. Run all tests to verify compatibility
4. Update tests if behavior changes

### Adding New Features
1. Add to TypeScript version first
2. Add tests to core test suite
3. Port to AssemblyScript
4. Verify all tests pass
5. Update documentation

### Performance Optimization
1. Profile with AssemblyScript profiler
2. Identify hot paths
3. Optimize algorithms
4. Consider SIMD for numeric operations
5. Benchmark against TypeScript

## References

- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [CalcMD Specification](../../../docs/04-Spec.md)
- [TypeScript Implementation](../../core/src/)
