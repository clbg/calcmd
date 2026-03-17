# Tech Stack

## Core Library (`@calcmd/core`)

- TypeScript 5, targeting ES2020, CommonJS output
- Jest + ts-jest for testing
- Strict mode enabled (`"strict": true` in tsconfig)
- No runtime dependencies — pure TypeScript

## Playground (`@calcmd/playground`)

- React 18 with TypeScript 5
- Vite 5 + @vitejs/plugin-react
- Dev sandbox for testing core features
- Depends on `@calcmd/core` via workspace reference (`workspace:*`)

## Website (`@calcmd/website`)

- React 18 with TypeScript 5
- Vite 5 + @vitejs/plugin-react
- Public landing page, deployed to GitHub Pages
- Imports `@calcmd/core` for live demo evaluation in the browser
- `vite.config.ts` sets `base: '/calcmd/'` for GitHub Pages subpath

## Package Management

- pnpm workspaces — single `pnpm install` from `poc/` installs all packages
- Workspace root: `poc/`
- Workspace config: `poc/pnpm-workspace.yaml`

## Common Commands

All commands run from `poc/` (workspace root).

### Install everything

```bash
pnpm install
```

### Core library

```bash
pnpm --filter @calcmd/core build   # tsc compile → dist/
pnpm --filter @calcmd/core dev     # tsc --watch
pnpm --filter @calcmd/core test    # jest
```

### Playground

```bash
pnpm --filter @calcmd/playground dev      # dev server at http://localhost:5173
pnpm --filter @calcmd/playground build
```

### Website (landing page)

```bash
pnpm --filter @calcmd/website dev         # dev server at http://localhost:5174
pnpm --filter @calcmd/website build       # outputs to packages/website/dist/
pnpm --filter @calcmd/website preview
```

### Root-level shortcuts

```bash
pnpm build          # build core
pnpm dev            # build core then start playground
pnpm dev:website    # build core then start website
pnpm build:website  # build core then build website for deployment
pnpm test           # run core tests
```

### Typical dev workflow

```bash
# Terminal 1 — watch core
pnpm --filter @calcmd/core dev

# Terminal 2 — run playground
pnpm --filter @calcmd/playground dev
```

## Output

- Core compiles to `poc/packages/core/dist/`
- Entry point: `dist/index.js`, types: `dist/index.d.ts`
