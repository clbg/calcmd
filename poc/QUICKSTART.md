# CalcMD POC - Quick Start Guide

## What We Built

### Core Library (`@calcmd/core`)
- Markdown table parser
- Formula parser (arithmetic, functions, label references)
- Evaluator with 10+ functions
- Error handling and validation

### React Playground
- Real-time split-pane editor
- Live preview with formula highlighting
- Cell selection and hover tooltips
- 5 built-in examples
- Error display

## How to Run

### Prerequisites

Install pnpm if you haven't:
```bash
npm install -g pnpm
```

### Quick Start

From the `poc/` directory — one command installs everything:

```bash
pnpm install
pnpm --filter @calcmd/core build
pnpm --filter @calcmd/playground dev
```

Browser opens at http://localhost:5173

### Development Mode (watch core + run playground)

Terminal 1 — watch core for changes:
```bash
pnpm --filter @calcmd/core dev
```

Terminal 2 — run playground:
```bash
pnpm --filter @calcmd/playground dev
```

### Run tests

```bash
pnpm test
```

## Try It Out

Once the playground opens:

1. Edit the table in the left pane
2. See results in the right pane instantly
3. Click examples at the top to load presets
4. Hover cells to see formulas
5. Click cells to select and highlight

### Example to Try

Paste this into the editor:

```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |
| **Total** | | | **=sum(Total)** |
```

## Supported Features

### Column Formulas
```markdown
| Item | Qty | Price | Total=Qty*Price |
```
Every cell in `Total` column auto-calculates.

### Aggregations
```markdown
| **Sum** | | | **=sum(Total)** |
```
`sum()`, `avg()`, `min()`, `max()`, `count()`

### Label References
```markdown
| @subtotal | **300** |
| Tax | =@subtotal*0.1 |
```

### Conditional Logic
```markdown
| Grade=if(Score>=90,"A","B") |
```

### Math Functions
```markdown
| Rounded=round(Price*1.15, 2) |
```

## Known Limitations

- Aggregations exclude current row (avoid self-reference)
- No circular dependency detection yet
- Formula cells must start with `=`
- Label references (`@label`) must be defined before use

## Architecture

```
User types markdown
    ↓
Parser (markdown → Table AST)
    ↓
FormulaParser (formula string → Expression AST)
    ↓
Evaluator (compute values)
    ↓
React Preview (render with highlighting)
```

## API Example

```typescript
import { calcmd } from '@calcmd/core';

const result = calcmd(`
| Item | Amount |
|------|--------|
| A | 100 |
| @total | =sum(Amount) |
`);

console.log(result.rows[1].cells[1].computed); // 100
```
