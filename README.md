<p align="center">
  <img src="packages/website/public/logo.svg" alt="CalcMD" width="320" />
</p>

<p align="center">
  <strong>Verifiable calculations in markdown tables</strong>
</p>

<p align="center">
  <a href="https://clbg.github.io/calcmd/">Website</a> · 
  <a href="https://clbg.github.io/calcmd/playground">Try It Online</a> · 
  <a href="docs/04-Spec.md">Specification</a> · 
  <a href="docs/05-Examples.md">Examples</a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@calcmd/core" alt="npm version" />
  <img src="https://img.shields.io/github/license/clbg/calcmd" alt="MIT License" />
  <img src="https://img.shields.io/github/stars/clbg/calcmd" alt="GitHub stars" />
</p>

---

## The Problem

AI assistants frequently generate tables with calculated values, but users have no way to verify the math:

```markdown
| Item   | Qty | Price | Total |
|--------|-----|-------|-------|
| Apple  | 3   | 1.50  | 4.50  |
| Banana | 5   | 0.80  | 4.00  |
| Total  |     |       | 8.50  |
```

**Questions users ask:**
- Is 8.50 correct?
- How was it calculated?
- What if I change the quantities?

## The Solution

CalcMD embeds human-readable formulas directly in the table:

```markdown
| Item   | Qty | Price | Total=Qty*Price        |
|--------|-----|-------|------------------------|
| Apple  | 3   | 1.50  | 4.50                   |
| Banana | 5   | 0.80  | 4.00                   |
| Total  |     |       | **8.50=sum(Total)**    |
```

Now you can:
- ✅ **Verify** the calculation instantly
- ✅ **Understand** how numbers are derived
- ✅ **Modify** formulas without re-prompting the AI
- ✅ **Trust** AI-generated numerical data

## Quick Example

```typescript
import { calcmd } from '@calcmd/core';

const markdown = `
| Item   | Qty | Price | Total=Qty*Price |
|--------|-----|-------|-----------------|
| Apple  | 3   | 1.50  |                 |
| Banana | 5   | 0.80  |                 |
`;

const result = calcmd(markdown);

console.log(result.rows[0].cells[3].computed); // 4.5
console.log(result.rows[1].cells[3].computed); // 4.0
console.log(result.errors);                    // []
```

## Features

### 🧮 Powerful Formula Language

- **Column formulas**: `Total=Qty*Price` (applies to every row)
- **Cell formulas**: `=sum(Amount)` (for aggregations)
- **Row labels**: `@wages: 85000` (cross-row references)
- **Column aliases**: `#agi` (ergonomic shortcuts)

### 🔒 Secure by Design

- Sandboxed evaluation (no file system, network, or code execution)
- Whitelist-only functions (no `eval()` or arbitrary code)
- Execution limits (prevents DoS attacks)
- Strict type checking (no implicit coercion)

### 🎯 AI-Friendly

- Human-readable syntax (column names, not A1 notation)
- Easy for LLMs to generate and validate
- Clear error messages for debugging
- Graceful degradation (renders as normal markdown)

### 📦 Developer-Friendly

- Simple API: `calcmd(markdown)` → `ParsedTable`
- TypeScript with full type definitions
- Zero runtime dependencies
- MIT licensed

## Supported Functions

| Category | Functions |
|----------|-----------|
| **Aggregation** | `sum()`, `avg()`, `count()`, `min()`, `max()` |
| **Math** | `round()`, `abs()`, `floor()`, `ceil()` |
| **Conditional** | `if(condition, true_val, false_val)` |
| **Operators** | `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `and`, `or`, `not` |

[See full specification →](docs/04-Spec.md)

## Use Cases

### 📊 Financial Reports
```markdown
| Category | Q1    | Q2    | Total=Q1+Q2 | Change%=round((Q2-Q1)/Q1*100,1) |
|----------|-------|-------|-------------|----------------------------------|
| Revenue  | 5000  | 6000  | 11000       | 20.0                             |
| Cost     | 3000  | 3500  | 6500        | 16.7                             |
| Profit   | 2000  | 2500  | 4500        | 25.0                             |
```

### 🧾 Expense Tracking
```markdown
| Item    | Amount | Tax=round(Amount*0.1,2) | Total=Amount+Tax |
|---------|--------|-------------------------|------------------|
| Laptop  | 1000   | 100.00                  | 1100.00          |
| Mouse   | 25     | 2.50                    | 27.50            |
| **Sum** | **1025=sum(Amount)** | **102.50=sum(Tax)** | **1127.50=sum(Total)** |
```

### 📈 Data Analysis
```markdown
| Category | Count | Percentage=round(Count/sum(Count)*100,1) |
|----------|-------|------------------------------------------|
| A        | 45    | 45.0                                     |
| B        | 30    | 30.0                                     |
| C        | 25    | 25.0                                     |
```

[More examples →](docs/05-Examples.md)

## Installation

```bash
npm install @calcmd/core
```

Or try it online: [CalcMD Playground](https://clbg.github.io/calcmd/playground)

## Integration Examples

### Node.js / TypeScript
```typescript
import { calcmd } from '@calcmd/core';

const result = calcmd(markdownString);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
} else {
  console.log('Computed values:', result.rows);
}
```

### React Component
```tsx
import { calcmd } from '@calcmd/core';
import { Preview } from '@calcmd/ui';

function MyComponent({ markdown }: { markdown: string }) {
  const result = calcmd(markdown);
  return <Preview table={result} />;
}
```

### CLI Tool
```bash
npx @calcmd/cli validate document.md
npx @calcmd/cli eval document.md --output json
```

## Why CalcMD?

### vs. Spreadsheets
- ✅ Plain text (git-friendly, diffable)
- ✅ Portable (works everywhere)
- ✅ Embeddable (in docs, READMEs, wikis)
- ❌ Not as feature-rich (by design)

### vs. A1 Notation
- ✅ Human-readable (`Qty*Price` vs `B2*C2`)
- ✅ Resilient to row/column changes
- ✅ Self-documenting

### vs. Scripting
- ✅ Secure (sandboxed, no arbitrary code)
- ✅ Simple (limited scope, clear semantics)
- ✅ Verifiable (formulas are visible)

## Project Structure

```
docs/              # Specification and planning documents
packages/
├── core/          # @calcmd/core — parser, evaluator, types
├── ui/            # @calcmd/ui — Web Components (Editor, Preview)
└── website/       # Landing page + playground
```

## Development

Requires [pnpm](https://pnpm.io):

```bash
pnpm install       # Install dependencies
pnpm dev           # Start dev server (http://localhost:5173)
pnpm test          # Run tests
pnpm build         # Build all packages
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- 🐛 [Report bugs](https://github.com/clbg/calcmd/issues)
- 💡 [Request features](https://github.com/clbg/calcmd/issues)
- 📖 [Improve docs](https://github.com/clbg/calcmd/pulls)
- 🔧 [Submit PRs](https://github.com/clbg/calcmd/pulls)

## Roadmap

- [x] Core specification (v0.1)
- [x] TypeScript implementation
- [x] Web playground
- [x] Web Components UI library
- [ ] npm package publication
- [ ] VSCode extension
- [ ] Python SDK
- [ ] AI tool integrations (Claude, ChatGPT, etc.)
- [ ] v1.0 specification

[Full roadmap →](docs/06-Roadmap.md)

## Community

- 💬 [GitHub Discussions](https://github.com/clbg/calcmd/discussions)
- 🐦 [Twitter](https://twitter.com/calcmd) (coming soon)
- 📧 Email: [your-email]

## License

MIT © Charlie

---

<p align="center">
  Made with ❤️ for the AI and markdown communities
</p>
