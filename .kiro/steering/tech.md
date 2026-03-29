# Tech Stack

## Core Library (`@calcmd/core`)

- Rust + WebAssembly via wasm-pack (`--target bundler`)
- TypeScript wrapper via tsup (JS) + tsc (types)
- Pure TS utilities: `format()`, `fill()`, `formatValue()` in `src/utils.ts`
- Node.js integration tests (`.mjs`) — no Jest
- Rust deps: wasm-bindgen, pest, petgraph, serde, serde_json
- Build: `wasm-pack build --target bundler --out-dir pkg` then `tsup && tsc --emitDeclarationOnly`

## UI Components (`@calcmd/ui`)

- React 18 with TypeScript 5
- Lit web components (Editor, Preview)
- No build step — consumed as source by website via Vite alias
- Depends on `@calcmd/core` via workspace reference (`workspace:*`)

## Website (`@calcmd/website`)

- React 18 with TypeScript 5
- Vite 5 + @vitejs/plugin-react + vite-plugin-wasm
- `build.target: 'esnext'` required for WASM ESM support
- React Router for `/` (landing) and `/playground` routes
- `vite.config.ts` sets `base: '/calcmd/'` for GitHub Pages subpath
- `@calcmd/core` resolves via workspace dependency (dist/), not source alias

## Package Management

- pnpm workspaces — single `pnpm install` from repo root installs all packages
- Workspace root: repo root (`/`)
- Workspace config: `pnpm-workspace.yaml`

## Common Commands

All commands run from the repo root.

### Install everything

```bash
pnpm install
```

### Core library

```bash
pnpm --filter @calcmd/core build   # wasm-pack + tsup + tsc → dist/ and pkg/
pnpm --filter @calcmd/core test    # node tests/basic.test.mjs (19 tests)
```

### Website (includes playground)

```bash
pnpm --filter @calcmd/website dev         # dev server at http://localhost:5173
pnpm --filter @calcmd/website build       # outputs to packages/website/dist/
pnpm --filter @calcmd/website preview
```

### Root-level shortcuts

```bash
pnpm build          # build core (wasm + wrapper)
pnpm test           # run core tests
pnpm build:website  # build core then build website for deployment
```

### Typical dev workflow

```bash
pnpm build                          # build core first
pnpm --filter @calcmd/website dev   # start website dev server
```

## Output

- Core WASM: `packages/core/pkg/` (wasm-pack output, bundler target)
- Core JS wrapper: `packages/core/dist/index.js`
- Core types: `packages/core/dist/index.d.ts`
