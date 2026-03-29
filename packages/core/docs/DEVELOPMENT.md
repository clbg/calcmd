# @calcmd/core Development Guide

## Prerequisites

- Rust 1.70+ with `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- Node.js 18+
- pnpm

```bash
# Add the WASM target if needed
rustup target add wasm32-unknown-unknown
```

## Building

```bash
# From repo root
pnpm --filter @calcmd/core build

# Or step by step from packages/core/
pnpm run build:wasm     # Rust → WASM (wasm-pack --target bundler --out-dir pkg)
pnpm run build:wrapper  # TypeScript wrapper (tsup + tsc --emitDeclarationOnly)
pnpm run build          # Both in sequence
```

### Build output

```
pkg/                        # wasm-pack output (bundler target)
  ├── calcmd_wasm.js        # JS bindings (imports .wasm statically)
  ├── calcmd_wasm_bg.js     # Low-level bindings
  ├── calcmd_wasm_bg.wasm   # Compiled WASM binary (~270KB release)
  └── calcmd_wasm.d.ts      # Type declarations

dist/                       # tsup + tsc output
  ├── index.js              # ESM wrapper
  ├── index.d.ts            # Type declarations
  ├── types.d.ts
  └── utils.d.ts
```

## Testing

```bash
# From repo root
pnpm --filter @calcmd/core test

# Or directly
node packages/core/tests/basic.test.mjs
```

19 tests covering all CalcMD features. Tests load WASM directly via `calcmd_wasm_bg.js` + `WebAssembly.instantiate` — no Jest, no build step needed for tests.

## Adding new features

1. Update the Rust implementation in `src/` (parser, evaluator, or ast)
2. Run `pnpm run build:wasm` to recompile
3. Add test cases to `tests/basic.test.mjs`
4. Run `node tests/basic.test.mjs` to verify
5. If the public API changes, update `src/types.ts` and `src/index.ts`

## Rust codebase overview

| File | Responsibility |
|------|---------------|
| `lib.rs` | WASM entry point — single `calcmd(markdown) → JSON` export |
| `ast.rs` | All type definitions (Cell, Column, Row, Table, ParsedTable, etc.) |
| `parser.rs` | Markdown table parser — extracts columns, rows, labels, aliases |
| `formula_parser.rs` | Formula string → Expression AST using pest |
| `formula.pest` | PEG grammar for CalcMD formula syntax |
| `evaluator.rs` | Evaluates cells in dependency order using petgraph |

## Troubleshooting

**`wasm-pack` not found**
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

**Rust compile errors after editing `.pest` file**
The pest grammar is compiled at build time via `pest_derive`. Run `cargo build` to see grammar errors with line numbers.

**Tests fail after changing Rust output shape**
Update `src/types.ts` to match the new serde JSON output, and update the normalization in `src/index.ts` if needed.
