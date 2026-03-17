# Tech Stack

## Core Library (`@calcmd/core`)

- TypeScript 5, targeting ES2020, CommonJS output
- Jest + ts-jest for testing
- Strict mode enabled (`"strict": true` in tsconfig)
- No runtime dependencies — pure TypeScript

## Playground (`@calcmd/playground`)

- React 18 with TypeScript 5
- Vite 5 + @vitejs/plugin-react
- Depends on `@calcmd/core` via workspace reference (`workspace:*`)

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
pnpm --filter @calcmd/playground build    # production build
pnpm --filter @calcmd/playground preview  # preview production build
```

### Root-level shortcuts

```bash
pnpm build   # build core
pnpm dev     # build core then start playground
pnpm test    # run core tests
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
