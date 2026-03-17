# CalcMD POC - Quick Start Guide

## Prerequisites

Install pnpm if you haven't:
```bash
npm install -g pnpm
```

Then from the `poc/` directory, install all packages at once:
```bash
pnpm install
```

---

## Packages

| Package | Description | Port |
|---------|-------------|------|
| `@calcmd/core` | Parser + evaluator library | — |
| `@calcmd/playground` | Dev sandbox with split-pane editor | 5173 |
| `@calcmd/website` | Public landing page with live demo | 5174 |

---

## Running the Playground

The playground is a full-featured dev sandbox for testing CalcMD syntax.

```bash
# Build core first (required)
pnpm --filter @calcmd/core build

# Start playground
pnpm --filter @calcmd/playground dev
```

Or use the root shortcut:
```bash
pnpm dev
```

Opens at http://localhost:5173

### Watch mode (core + playground together)

Terminal 1:
```bash
pnpm --filter @calcmd/core dev
```

Terminal 2:
```bash
pnpm --filter @calcmd/playground dev
```

---

## Running the Website Locally

The website is the public landing page with a live CalcMD demo powered by `@calcmd/core`.

```bash
pnpm dev:website
```

Opens at http://localhost:5174

---

## Deploying the Website to GitHub Pages

### Manual deployment

```bash
# 1. Build everything
pnpm build:website

# 2. The output is in poc/packages/website/dist/
# 3. Commit and push
git add poc/packages/website/dist
git commit -m "chore: update website build"
git push
```

Then in GitHub repo settings → Pages → set source to the `dist/` folder.

### Recommended: GitHub Actions (automatic)

Create `.github/workflows/deploy-website.yml`:

```yaml
name: Deploy Website

on:
  push:
    branches: [master]
    paths:
      - 'poc/packages/website/**'
      - 'poc/packages/core/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: poc/pnpm-lock.yaml
      - run: pnpm install
        working-directory: poc
      - run: pnpm build:website
        working-directory: poc
      - uses: actions/upload-pages-artifact@v3
        with:
          path: poc/packages/website/dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

In GitHub repo settings → Pages → set source to **GitHub Actions**.

The site will auto-deploy on every push to `master` that touches `core/` or `website/`.

---

## Running Tests

```bash
pnpm test
```

---

## All Root Scripts

```bash
pnpm build          # build @calcmd/core (CJS + ESM)
pnpm dev            # build core → start playground (localhost:5173)
pnpm dev:website    # build core → start website (localhost:5174)
pnpm build:website  # build core + website → dist/
pnpm test           # run core tests
```

---

## Example CalcMD Syntax

```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |
| **Total** | | | **8.5=sum(Total)** |
```

Supported: `sum()`, `avg()`, `min()`, `max()`, `count()`, `round()`, `abs()`, `floor()`, `ceil()`, `if()`
