# CalcMD POC

Proof of concept for CalcMD — calculated markdown tables.

## Project Structure

```
poc/
├── package.json           # Workspace root
├── pnpm-workspace.yaml    # pnpm workspace config
└── packages/
    ├── core/              # @calcmd/core — TypeScript core library
    │   ├── src/
    │   │   ├── types.ts
    │   │   ├── parser.ts
    │   │   ├── formula-parser.ts
    │   │   ├── evaluator.ts
    │   │   └── index.ts
    │   └── tests/
    ├── playground/        # @calcmd/playground — dev sandbox (Vite + React)
    │   ├── index.html
    │   ├── vite.config.ts
    │   └── src/
    │       ├── App.tsx
    │       ├── Editor.tsx
    │       ├── Preview.tsx
    │       └── examples.ts
    └── website/           # @calcmd/website — public landing page (Vite + React)
        ├── index.html
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── main.tsx
            ├── styles.css
            └── components/
                ├── Nav.tsx
                ├── Hero.tsx
                ├── LiveDemo.tsx   # Uses @calcmd/core for live evaluation
                ├── Features.tsx
                └── Syntax.tsx
```

## Quick Start

Requires [pnpm](https://pnpm.io). Install it with:
```bash
npm install -g pnpm
```

From the `poc/` directory:

```bash
pnpm install
pnpm dev             # playground at http://localhost:5173
pnpm dev:website     # landing page at http://localhost:5174
```

## Root Scripts

```bash
pnpm build           # build @calcmd/core (CJS + ESM outputs)
pnpm dev             # build core → start playground (localhost:5173)
pnpm dev:website     # build core → start website (localhost:5174)
pnpm build:website   # build core + website → packages/website/dist/
pnpm test            # run core tests
```

## Features

### Core Library (`@calcmd/core`)

- Markdown table parsing
- Column-level formulas: `Total=Qty*Price`
- Cell-level formulas: `=sum(Amount)`
- Row labels: `@label` for cross-row references
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `and`, `or`, `not`
- Functions: `sum()`, `avg()`, `count()`, `min()`, `max()`, `round()`, `abs()`, `if()`

### Playground

- Real-time editing and preview
- Formula highlighting (blue background)
- Error highlighting (red border)
- Hover to see formula details
- 5 built-in examples

## API

```typescript
import { calcmd } from '@calcmd/core';

const result = calcmd(`
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
`);

result.rows[0].cells[3].computed; // 4.5
result.errors;                    // []
```

## Core Library — Dual Output

`@calcmd/core` builds two formats:
- `dist/index.js` — CommonJS (for Node.js, Jest)
- `dist/esm/index.js` — ESM (for Vite, bundlers)

The `exports` field in `package.json` routes automatically based on the consumer.

```bash
pnpm test
# or
pnpm --filter @calcmd/core test
```

## License

MIT
