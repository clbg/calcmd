# Tech Stack

## Core Library (`@calcmd/core`)

- TypeScript 5, targeting ES2020, CommonJS output
- Jest + ts-jest for testing
- Strict mode enabled (`"strict": true` in tsconfig)
- No runtime dependencies — pure TypeScript

## UI Components (`@calcmd/ui`)

- React 18 with TypeScript 5
- Pure component library (Editor, Preview, examples)
- No build step — consumed as source by website via Vite alias
- Depends on `@calcmd/core` via workspace reference (`workspace:*`)

## Website (`@calcmd/website`)

- React 18 with TypeScript 5
- Vite 5 + @vitejs/plugin-react
- React Router for `/` (landing) and `/playground` routes
- Imports `@calcmd/core` for live demo and `@calcmd/ui` for playground components
- `vite.config.ts` sets `base: '/calcmd/'` for GitHub Pages subpath

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
pnpm --filter @calcmd/core build   # tsc compile → dist/
pnpm --filter @calcmd/core dev     # tsc --watch (ESM)
pnpm --filter @calcmd/core test    # jest
```

### Website (includes playground)

```bash
pnpm --filter @calcmd/website dev         # dev server at http://localhost:5173
pnpm --filter @calcmd/website build       # outputs to packages/website/dist/
pnpm --filter @calcmd/website preview
```

### Root-level shortcuts

```bash
pnpm build          # build core
pnpm dev            # build core then start core watch + website dev
pnpm build:website  # build core then build website for deployment
pnpm test           # run core tests
```

### Typical dev workflow

```bash
pnpm dev    # one command: core watch + website dev server in parallel
```

## Output

- Core compiles to `packages/core/dist/`
- Entry point: `dist/index.js`, types: `dist/index.d.ts`
