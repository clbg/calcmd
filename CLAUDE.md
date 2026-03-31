# CalcMD — Claude Code Instructions

## Standard Change Workflow

Every code change MUST follow this sequence. Do not skip steps.

### 1. Build
```bash
pnpm build
```

### 2. Test
```bash
pnpm test
```
All tests must pass before proceeding.

### 3. Visual Verification
Start dev server and verify in browser:
```bash
pnpm --filter @calcmd/website dev
```
Then open browser and take screenshots:
```bash
browser-use --profile "Default" --session calcmd --headed open http://localhost:5173/calcmd/
browser-use --session calcmd screenshot /tmp/calcmd-verify.png
# Check playground too
browser-use --session calcmd close
browser-use --profile "Default" --session calcmd --headed open http://localhost:5173/calcmd/playground
browser-use --session calcmd screenshot /tmp/calcmd-playground.png
browser-use --session calcmd close
```
Read the screenshots to visually confirm changes look correct.

### 4. Iterate
If tests fail or visual issues found, fix and repeat from step 1.

### 5. Review Docs
Check if any docs need updating based on the changes:
- `QUICKSTART.md` — setup instructions, package descriptions
- `.kiro/steering/product.md` — product overview
- `.kiro/steering/structure.md` — project structure
- `.kiro/steering/tech.md` — tech stack details

### 6. Resolve Conflicts
Check `git status` for merge conflicts and resolve them before committing.

### 7. Commit
Stage and commit with a descriptive message. **Always show the full diff to the user before pushing.**

```bash
git diff --staged   # show what will be committed
git diff            # show unstaged changes
```

Ask user to confirm before `git push`.

## Project Prerequisites

- **pnpm** — package manager
- **Rust toolchain** — `rustup`, `cargo`, `wasm-pack`, `wasm32-unknown-unknown` target
  - If `cargo install wasm-pack` fails: `rustup update stable` first
- **Node.js** — for TypeScript wrapper and website

## Design System

The website uses a warm design system ("Warm, Textured, Intimate").
Full design system doc: `~/Library/CloudStorage/GoogleDrive-charlie.pengcheng@gmail.com/My Drive/Autosync/CharlieObsidianVault/Wiki/Projects/My Design System/My Design System.md`

- **Palette:** Warm cream bg (#FAF7F2), terracotta accent (#B8632E), no blue
- **Typography:** Source Serif 4 (headings) + Source Sans 3 (body) + Source Code Pro (mono)
- **Tokens:** CSS custom properties in `packages/website/src/styles.css`
- **UI components** (Lit shadow DOM): use CSS vars with warm fallback values
