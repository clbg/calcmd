# Project Structure

## Top-Level

```
docs/           # Spec and planning documents
├── 00-PR-FAQ.md
├── 01-Vision.md
├── 02-Tenets.md
├── 03-User-Stories.md
├── 04-Spec.md        # CalcMD v0.1 specification (source of truth)
├── 05-Examples.md
├── 06-Roadmap.md
├── 07-Backlog.md
├── 08-Decisions.md
├── 09-Promotion-Strategy.md
├── 10-Release-Process.md
├── poc-plan.md
└── README.md
packages/       # All code packages
```

## Packages

```
packages/
├── core/                 # @calcmd/core — Rust/WASM implementation
│   ├── src/
│   │   ├── lib.rs            # WASM entry point (wasm-bindgen)
│   │   ├── ast.rs            # Rust type definitions
│   │   ├── parser.rs         # Markdown table → Table AST (Rust)
│   │   ├── formula_parser.rs # Formula string → Expression AST (pest)
│   │   ├── formula.pest      # Pest grammar for formulas
│   │   ├── evaluator.rs      # Walks AST, computes values (Rust)
│   │   ├── types.ts          # TypeScript types matching Rust JSON output
│   │   ├── utils.ts          # Pure TS utilities: format(), fill(), formatValue()
│   │   └── index.ts          # Public API — exports calcmd() and named exports
│   ├── pkg/                  # wasm-pack output (bundler target, gitignored)
│   ├── tests/
│   │   └── basic.test.mjs    # Node.js integration tests (19 cases)
│   ├── dist/                 # tsup + tsc output (gitignored)
│   ├── Cargo.toml
│   └── tsup.config.ts
├── ui/                   # @calcmd/ui — reusable UI components (Editor, Preview)
│   └── src/
│       ├── editor.ts         # calcmd-editor web component (Lit)
│       ├── preview.ts        # calcmd-preview web component (Lit)
│       ├── examples.ts
│       ├── react-wrappers.tsx
│       └── index.ts          # Public API — exports components
└── website/              # @calcmd/website — landing page + playground (Vite + React)
    ├── index.html
    ├── vite.config.ts        # base: '/calcmd/', vite-plugin-wasm, esnext target
    └── src/
        ├── App.tsx           # React Router: / and /playground
        ├── main.tsx
        ├── styles.css
        ├── playground.css
        ├── pages/
        │   ├── LandingPage.tsx
        │   └── PlaygroundPage.tsx
        └── components/
            ├── Nav.tsx
            ├── Hero.tsx
            ├── LiveDemo.tsx
            ├── Features.tsx
            └── Syntax.tsx
```

## Architecture

The core library pipeline (Rust/WASM):

```
markdown string
  → parser.rs      (produces Table with Row/Column/Cell structure)
  → formula_parser.rs (parses formula strings into Expression ASTs via pest)
  → evaluator.rs   (resolves dependencies via petgraph, computes values)
  → JSON string    (serialized by serde_json, returned to JS)
  → index.ts       (normalizes JSON: adds rows/columns aliases, edges → Map)
  → ParsedTable    (TypeScript type, ready for consumers)
```

`website` consumes both `@calcmd/core` and `@calcmd/ui` as workspace dependencies.
`vite-plugin-wasm` handles WASM loading transparently in the browser.

## Key Conventions

- Rust is the source of truth for parsing and evaluation logic
- TypeScript types in `types.ts` mirror the Rust serde JSON output
- `calcmd(markdown: string): ParsedTable` is the main entry point (synchronous)
- `ParsedTable.rows` and `.columns` are convenience aliases for `.table.rows/.columns`
- `ParsedTable.dependencies.edges` is a `Map<string, Set<string>>` (normalized from Rust's plain object)
- Errors are collected and returned (non-throwing) — callers check `result.errors`
- The spec in `docs/04-Spec.md` is the source of truth; implementation follows it
- Run all commands from the repo root using pnpm
