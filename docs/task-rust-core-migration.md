# Rust Core Migration — Completed

Migrated `@calcmd/core` from TypeScript to Rust/WASM. Rust is now the sole implementation; the duplicate TypeScript core has been removed.

---

## What Changed

### packages/wasm → packages/core

The `packages/wasm` directory (Rust source) was merged into `packages/core`, replacing the TypeScript implementation entirely. `packages/wasm` no longer exists.

**Deleted from `packages/core`:**
- `src/evaluator.ts`, `src/parser.ts`, `src/formula-parser.ts`, `src/index.ts`, `src/types.ts`
- `tests/basic.test.ts`
- `tsconfig.json`, `tsconfig.esm.json`, `tsconfig.test.json`

**Added to `packages/core`:**
- `src/lib.rs`, `src/ast.rs`, `src/parser.rs`, `src/formula_parser.rs`, `src/evaluator.rs`, `src/formula.pest` — Rust source
- `src/index.ts` — thin JS wrapper (normalizes WASM JSON output)
- `src/types.ts` — TypeScript types matching Rust serde output
- `src/utils.ts` — kept as-is (pure TS: `format()`, `fill()`, `formatValue()`)
- `tests/basic.test.mjs` — 19 Node.js integration tests (replaces Jest suite)
- `Cargo.toml`, `tsup.config.ts`
- `pkg/` — wasm-pack output (`--target bundler`)

### wasm-pack target: `web` → `bundler`

`--target bundler` lets Vite handle WASM loading automatically. No manual `await init()` needed — callers use `calcmd()` synchronously, same as before.

### packages/website/vite.config.ts

- Added `vite-plugin-wasm`
- Added `build.target: 'esnext'` (required for WASM ESM)
- Removed `@calcmd/core` source alias — now resolves via workspace dependency to `dist/`

### JS wrapper normalization

The Rust WASM returns plain JSON. `src/index.ts` normalizes it for backward compatibility:

- Adds `result.rows` and `result.columns` as aliases for `result.table.rows/columns`
- Converts `dependencies.edges` from `Record<string, string[]>` → `Map<string, Set<string>>`

This means `ui/src/preview.ts`, `editor.ts`, and all website code work without any changes.

---

## Final State

| Item | Status |
|------|--------|
| `packages/wasm` | Deleted |
| `packages/core` | Rust/WASM + TS wrapper |
| `@calcmd/core` package name | Unchanged |
| Public API (`calcmd()`, `format()`, `fill()`, etc.) | Unchanged |
| Tests | 19/19 passing (`node tests/basic.test.mjs`) |
| Website build | Clean (`vite build` ✓) |
| `ui` and `website` consumer code | No changes needed |

---

## Build Commands

```bash
# Build core (Rust → WASM → JS wrapper)
pnpm --filter @calcmd/core build

# Run tests
pnpm --filter @calcmd/core test

# Build website
pnpm --filter @calcmd/website build
```

See `packages/core/docs/DEVELOPMENT.md` for full details.
