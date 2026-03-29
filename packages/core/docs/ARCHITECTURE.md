# @calcmd/core Architecture

## Overview

`@calcmd/core` is implemented in Rust, compiled to WebAssembly via wasm-pack, with a thin TypeScript wrapper. The package name and public API are identical to the previous TypeScript implementation — consumers see no difference.

## Project Structure

```
packages/core/
├── src/
│   ├── lib.rs            # WASM entry point (wasm-bindgen)
│   ├── ast.rs            # All Rust type definitions
│   ├── parser.rs         # Markdown table parser
│   ├── formula_parser.rs # Formula parser (pest PEG grammar)
│   ├── formula.pest      # Pest grammar file
│   ├── evaluator.rs      # Evaluator with petgraph dependency resolution
│   ├── index.ts          # TypeScript wrapper — normalizes output, exports API
│   ├── types.ts          # TypeScript types matching Rust serde JSON output
│   └── utils.ts          # Pure TS utilities: format(), fill(), formatValue()
├── pkg/                  # wasm-pack output (--target bundler, gitignored)
├── dist/                 # tsup + tsc output (gitignored)
├── tests/
│   └── basic.test.mjs    # 19 Node.js integration tests
├── Cargo.toml
└── tsup.config.ts
```

## Pipeline

```
markdown string (JS)
  ↓
calcmd() in lib.rs  [WASM boundary]
  ↓
parser.rs           → Table AST (columns, rows, labels, aliases)
  ↓
evaluator.rs
  ├── expand()      → assigns effectiveFormula to each cell
  ├── build_dependency_graph()  → petgraph DiGraph, tarjan SCC for cycle detection
  └── compute_in_order()        → evaluates cells in topological order
  ↓
serde_json::to_string()  → JSON string returned to JS
  ↓
index.ts normalize()
  ├── JSON.parse()
  ├── edges: Record<string, string[]> → Map<string, Set<string>>
  └── adds rows/columns top-level aliases
  ↓
ParsedTable (TypeScript)
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Parser | Hand-written Rust |
| Formula grammar | pest PEG parser |
| Dependency graph | petgraph (tarjan SCC for cycle detection) |
| Serialization | serde + serde_json |
| WASM binding | wasm-bindgen |
| JS wrapper | tsup (ESM) + tsc (types) |

## Key Design Decisions

### Bundler target
`wasm-pack --target bundler` generates code that Vite/webpack handle automatically. No manual `await init()` needed — the bundler resolves the `.wasm` import at build time.

### Synchronous API
`calcmd(markdown)` is synchronous from the caller's perspective. WASM initialization is handled by the bundler before any JS runs.

### JSON boundary
The WASM function returns a JSON string. The TypeScript wrapper parses it and normalizes the output (edges Map, top-level aliases). This keeps the Rust side simple and avoids complex wasm-bindgen type mappings.

### Type normalization
Rust's `HashMap<String, HashSet<String>>` serializes as `Record<string, string[]>`. The wrapper converts this to `Map<string, Set<string>>` so consumers can use `.get()` and `for...of` naturally.

### utils.ts stays in TypeScript
`format()`, `fill()`, and `formatValue()` are pure string manipulation — no benefit to Rust. They live in `src/utils.ts` and are bundled alongside the WASM wrapper.
