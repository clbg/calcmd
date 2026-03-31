# CalcMD - Quick Start Guide

## Prerequisites

### Node.js / pnpm

Install pnpm if you haven't:
```bash
npm install -g pnpm
```

### Rust toolchain (required for @calcmd/core)

`@calcmd/core` is implemented in Rust and compiled to WebAssembly. You need the Rust toolchain to build it.

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack
```

> **Note:** If `cargo install wasm-pack` fails with an `edition2024` error, update your Rust toolchain first: `rustup update stable`

From the repo root:
```bash
pnpm install
```

---

## Packages

| Package | Description | Language |
|---------|-------------|----------|
| `@calcmd/core` | Parser + evaluator library (Rust → WASM + TS wrapper) | Rust + TypeScript |
| `@calcmd/ui` | Web components (Editor, Preview) | TypeScript/Lit |
| `@calcmd/website` | Landing page + playground | TypeScript/React |

---

## Development

One command starts everything:
```bash
pnpm dev
```

This runs Turborepo which:
1. Builds `@calcmd/core` (Rust → WASM → TS wrapper)
2. Starts core ESM watch (`tsup --watch`)
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
pnpm test            # run all tests
pnpm lint            # ESLint across all packages
pnpm format          # Prettier format all .ts/.tsx files
pnpm build:website   # build website for deployment
```

### Core-specific

```bash
pnpm --filter @calcmd/core build        # full build: Rust→WASM + TS wrapper
pnpm --filter @calcmd/core build:wasm   # Rust→WASM only
pnpm --filter @calcmd/core test         # run core test suite
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

Supported: `sum()`, `avg()`, `min()`, `max()`, `count()`, `round()`, `abs()`, `floor()`, `ceil()`, `if()`, `@label: value` cell labels, `#alias` column aliases
