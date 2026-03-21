# CalcMD - Quick Start Guide

## Prerequisites

Install pnpm if you haven't:
```bash
npm install -g pnpm
```

From the repo root:
```bash
pnpm install
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@calcmd/core` | Parser + evaluator library |
| `@calcmd/ui` | Web Components (Editor, Preview) using Lit |
| `@calcmd/website` | Landing page + playground (single app) |

---

## Development

One command starts everything:
```bash
pnpm dev
```

This runs Turborepo which:
1. Builds `@calcmd/core` (CJS + ESM)
2. Starts core ESM watch (`tsc --watch`)
3. Starts website dev server at http://localhost:5173

The website includes:
- Landing page at `/calcmd/`
- Playground at `/calcmd/playground`

---

## Running Tests

```bash
pnpm test
```

---

## Building for Deployment

```bash
pnpm build:website
```

Output goes to `packages/website/dist/`. Deployment to GitHub Pages is automatic via GitHub Actions on push to `master`.

---

## All Scripts

```bash
pnpm build           # build all packages (Turborepo, with caching)
pnpm dev             # core watch + website dev server
pnpm test            # run core tests
pnpm lint            # ESLint across all packages
pnpm format          # Prettier format all .ts/.tsx files
pnpm build:website   # build website for deployment
```

---

## Example CalcMD Syntax

```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | |
| Banana | 5 | 0.8 | |
| **Total** | | | **=sum(Total)** |
```

Supported: `sum()`, `avg()`, `min()`, `max()`, `count()`, `round()`, `abs()`, `floor()`, `ceil()`, `if()`
