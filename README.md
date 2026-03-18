<p align="center">
  <img src="packages/website/public/logo.svg" alt="CalcMD" width="320" />
</p>

<p align="center">
  An open specification that extends markdown table syntax with embedded formulas.
</p>

## Project Structure

```
docs/              # Spec and planning documents
packages/
├── core/          # @calcmd/core — parser, evaluator, types
├── ui/            # @calcmd/ui — reusable React components (Editor, Preview)
└── website/       # @calcmd/website — landing page + playground (Vite + React)
```

## Quick Start

Requires [pnpm](https://pnpm.io):
```bash
npm install -g pnpm
```

From the repo root:
```bash
pnpm install
pnpm dev           # core watch + website dev server at http://localhost:5173
```

## Scripts

```bash
pnpm build           # build all packages (via Turborepo)
pnpm dev             # core watch + website dev (includes /playground)
pnpm test            # run core tests
pnpm lint            # ESLint across all packages
pnpm format          # Prettier format
pnpm build:website   # build website for deployment
```

## Features

### Core Library (`@calcmd/core`)

- Column formulas: `Total=Qty*Price` (default template, cell can override)
- Cell formulas: `=sum(Amount)`
- Row labels: `@label: value` for cross-row references
- Column aliases: `#alias` for ergonomic formula references
- Cell-granularity dependency graph with topological sort
- Circular reference detection
- Functions: `sum()`, `avg()`, `count()`, `min()`, `max()`, `round()`, `abs()`, `floor()`, `ceil()`, `if()`
- Strict type checking (no implicit coercion)

### Website + Playground

- Landing page at `/`
- Interactive playground at `/playground` with 5 built-in examples
- Real-time formula evaluation powered by `@calcmd/core`

## API

```typescript
import { calcmd } from '@calcmd/core';

const result = calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
`);

result.rows[0].cells[3].computed; // 4.5
result.errors;                    // []
```

## Tooling

- pnpm workspaces + Turborepo (build orchestration + caching)
- TypeScript 5 with shared tsconfig base
- ESLint + Prettier
- Jest + ts-jest for testing
- GitHub Actions CI (test + lint on PR, auto-deploy website)
- Dependabot for dependency updates

## License

MIT
