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
    │   │   ├── types.ts          # Type definitions
    │   │   ├── parser.ts         # Markdown → AST parser
    │   │   ├── formula-parser.ts # Formula string → Expression AST
    │   │   ├── evaluator.ts      # Formula evaluator
    │   │   └── index.ts          # Main API
    │   └── tests/
    └── playground/        # @calcmd/playground — React UI (Vite)
        ├── index.html            # Vite entry point
        ├── vite.config.ts
        └── src/
            ├── App.tsx           # Main app component
            ├── Editor.tsx        # Left: markdown editor
            ├── Preview.tsx       # Right: rendered table
            └── examples.ts       # Example tables
```

## Quick Start

Requires [pnpm](https://pnpm.io). Install it with:
```bash
npm install -g pnpm
```

From the `poc/` directory:

```bash
pnpm install
pnpm --filter @calcmd/core build
pnpm --filter @calcmd/playground dev
```

Open [http://localhost:5173](http://localhost:5173).

## Dev Workflow

Terminal 1 — watch core for changes:
```bash
pnpm --filter @calcmd/core dev
```

Terminal 2 — run playground:
```bash
pnpm --filter @calcmd/playground dev
```

## Root Scripts

```bash
pnpm build   # build @calcmd/core
pnpm dev     # build core then start playground
pnpm test    # run core tests
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

## Testing

```bash
pnpm test
# or
pnpm --filter @calcmd/core test
```

## License

MIT
