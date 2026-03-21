# Architecture Decision Records

Lightweight log of significant technical decisions — what was decided, why, and what was ruled out.

**Table of Contents**
- [ADR-001: Floating-Point Display Strategy](#adr-001-floating-point-display-strategy)
- [ADR-002: Context-Aware Aggregation Semantics](#adr-002-context-aware-aggregation-semantics)
- [ADR-003: UI Component Architecture (Web Components)](#adr-003-ui-component-architecture-web-components)
- [ADR-004: Multi-Language SDK Strategy](#adr-004-multi-language-sdk-strategy)
- [ADR-005: Browser Distribution Strategy](#adr-005-browser-distribution-strategy)

---

## ADR-001: Floating-Point Display Strategy

**Date**: 2026-03-21
**Status**: Accepted

### Decision

Use `parseFloat(v.toPrecision(6)).toString()` for all numeric display output (DISPLAY_PRECISION = 6). This is applied in a single shared `formatValue()` function exported from `@calcmd/core`, used by both `fill()` and the `Preview` component.

### Context

JavaScript uses IEEE 754 double-precision floating point, which produces noise like `13.000000000000002` for certain calculations. This is a display problem, not a calculation problem.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Arbitrary precision library (decimal.js) | Exact results | ~30KB bundle cost, all arithmetic must be wrapped |
| `toPrecision(6)` truncation | Zero deps, matches Excel-style display | Still floating point internally |
| `toPrecision(15)` truncation | More precision | Too many digits for typical use cases |
| Leave as-is (`toString()`) | No code | Ugly output for users |

### Rationale

Excel uses the same underlying IEEE 754 arithmetic and applies display truncation. CalcMD's use cases (prices, quantities, percentages) are well within 6 significant digits. The "所见即所得" (WYSIWYG) principle means fill() should write what users see in the preview (6 digits), not internal precision (15 digits).

### Consequences

- `formatValue` is part of the public API of `@calcmd/core`
- All display layers must use `formatValue` — do not call `.toString()` directly on computed numbers
- `DISPLAY_PRECISION = 6` is a constant in `utils.ts`
- If a future use case requires exact decimal arithmetic (e.g. currency with regulatory requirements), revisit decimal.js at that point

---

## ADR-002: Context-Aware Aggregation Semantics

**Date**: 2026-03-22
**Status**: Accepted

### Decision

Aggregation functions (`sum()`, `avg()`, etc.) behave differently based on where the formula is located:

**Cell formulas** (e.g., `| **=sum(Amount)** |`):
- Aggregate from first row to row before current row
- Use case: summary rows, subtotals, running totals
- Example: Row 5 sum aggregates rows 0-4

**Column formulas** (e.g., `| Percentage=Count/sum(Count)*100 |`):
- Aggregate all rows in the column (including current row)
- Each row sees the same total value
- Use case: percentage calculations, ratios, normalization
- Exception: Self-reference (Amount=sum(Amount)) detected as circular dependency

### Context

Users need two different aggregation behaviors:
1. Summary rows that don't include themselves (avoid circular reference)
2. Percentage calculations that divide by a fixed total (all rows)

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Always exclude current row | Avoids circular refs | Can't do percentage calculations |
| Always include current row | Simple rule | Circular refs in summary rows |
| Context-aware (chosen) | Supports both use cases | More complex implementation |
| Separate functions (sum_all, sum_above) | Explicit | Verbose, confusing for users |

### Rationale

The context-aware approach matches user intuition:
- When you write a formula in a specific cell, you're creating a summary → exclude self
- When you write a formula in a column header, you're defining a calculation → include all

This is similar to how Excel's structured tables work: column formulas apply to all rows, but you can override individual cells.

### Implementation

- Added `isColumnFormula?: boolean` flag to Cell type
- Added `colIndex: number` to EvaluationContext
- Updated `collectDeps()` to create appropriate dependency edges
- Updated `getColumnValues()` to return correct row range
- Updated spec documentation with examples

### Consequences

- Breaking change from previous behavior
- More intuitive for users
- Enables percentage calculations without special functions
- Self-reference in column formulas properly detected as circular dependency

---

## ADR-003: UI Component Architecture (Web Components)

**Date**: 2026-03-21
**Status**: Accepted

### Decision

Migrate UI library from React components to Web Components using Lit framework.

### Context

The original UI library (`@calcmd/ui`) was built with React, which created version conflicts and limited reusability across different frameworks.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Keep React | Already implemented | Version conflicts, framework lock-in |
| Web Components (Lit) | Framework-agnostic, standard-based | Need to rewrite components |
| Mitosis | Write once, compile to any framework | Immature ecosystem, complex tooling |
| Svelte | Small bundle, good DX | Still framework-specific |

### Rationale

Web Components are:
- **Standard-based**: Native browser API, no framework lock-in
- **Framework-agnostic**: Works with React, Vue, Svelte, vanilla JS
- **Zero version conflicts**: No React version dependencies
- **Lightweight**: Lit is ~5KB, much smaller than React
- **Future-proof**: Browser standard, won't be deprecated

Lit provides excellent DX with decorators, reactive properties, and TypeScript support while compiling to standard Web Components.

### Implementation

- Created `packages/ui/src/preview.ts` - Lit version of Preview
- Created `packages/ui/src/editor.ts` - Lit version of Editor
- Created `packages/ui/src/react-wrappers.tsx` - React compatibility layer
- Updated package.json to use Lit instead of React
- All features preserved: cell/column highlighting, dependency tracking, toolbar

### Consequences

- UI components work in any framework
- No React version conflicts
- Smaller bundle size
- React users can still use via wrapper components
- Need to maintain Web Component + React wrapper

---

## ADR-004: Multi-Language SDK Strategy

**Date**: 2026-03-22
**Status**: Proposed

### Decision

Use WASM + thin language wrappers for multi-language support, rather than manual ports or code generation.

### Context

To promote CalcMD adoption, we need SDKs for multiple languages (Python, Go, Rust, Ruby, etc.). There are several approaches to achieve this.

### Options Considered

| Option | Effort | Maintenance | Performance | Recommended |
|--------|--------|-------------|-------------|-------------|
| **WASM FFI** | 2 weeks | Low | Good | ⭐⭐⭐ YES |
| **Node.js FFI** | 1 week | Low | Medium | ⭐⭐ Maybe |
| **Code Generation** | High | Medium | Varies | ⭐ No |
| **Manual Ports** | 3 months | Very High | Best | ❌ No |

### Rationale

**WASM FFI approach**:
1. Compile CalcMD to WASM once (using AssemblyScript or Rust)
2. Each language loads the WASM module
3. Provide thin wrapper for ergonomic API

**Benefits**:
- ✅ Write once, run everywhere
- ✅ Single source of truth (no sync issues)
- ✅ Consistent behavior across languages
- ✅ Easy to maintain (one codebase)
- ✅ Automatic updates (update WASM, all languages benefit)

**Supported languages**: JavaScript, Python, Rust, Go, Java, C#, Ruby, PHP (all have WASM runtimes)

### Implementation Plan

**Phase 1**: WASM Build (1 week)
- Port TypeScript to AssemblyScript
- Compile to WASM
- Test in browser

**Phase 2**: Python SDK (3 days)
```python
from calcmd import calcmd
result = calcmd("| Item | Qty | Price | Total=Qty*Price |")
```

**Phase 3**: Other languages (1-2 days each)
- Go wrapper
- Rust wrapper
- Ruby wrapper
- Add more based on demand

### Consequences

- Need to learn AssemblyScript or Rust for WASM compilation
- Slight FFI overhead (usually negligible)
- All languages share same core logic and bugs
- Easy to add new languages (1-2 days each)
- No need to maintain N separate implementations

### Alternative Considered: Manual Ports

Rewriting CalcMD in each language would provide:
- Native feeling
- Best performance
- No dependencies

But requires:
- 2-3 weeks per language
- Maintaining N codebases
- Risk of behavior divergence
- Spec changes require updating all implementations

**Verdict**: Not worth the effort for CalcMD's use case.

---

## ADR-005: Browser Distribution Strategy

**Date**: 2026-03-22
**Status**: Proposed

### Decision

Create a standalone browser bundle (IIFE + ESM) for CDN distribution, rather than requiring users to use a bundler.

### Context

Many users want to use CalcMD directly in HTML without npm/bundler setup. We need a way to distribute CalcMD for browser usage.

### Options Considered

| Option | Effort | User Experience | Recommended |
|--------|--------|-----------------|-------------|
| **Browser Bundle** | 4 hours | Excellent | ⭐⭐⭐ YES |
| **True WASM** | 1 week | Good | ⭐⭐ Later |
| **Require Bundler** | 0 hours | Poor | ❌ No |

### Rationale

**Browser bundle approach**:
1. Use Rollup to create standalone builds
2. Publish to npm with browser-friendly files
3. Users can load via CDN (unpkg, jsdelivr)

**Benefits**:
- ✅ Zero setup for users
- ✅ Works with `<script>` tag
- ✅ Can implement today (4 hours)
- ✅ Solves 90% of use cases

### Implementation

**Build configuration** (rollup.config.browser.js):
```javascript
export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/calcmd.browser.js', format: 'iife', name: 'CalcMD' },
    { file: 'dist/calcmd.browser.min.js', format: 'iife', name: 'CalcMD', plugins: [terser()] },
    { file: 'dist/calcmd.esm.js', format: 'es' },
  ],
  plugins: [nodeResolve(), typescript()],
};
```

**Usage**:
```html
<!-- Via CDN -->
<script src="https://unpkg.com/@calcmd/core/dist/calcmd.browser.min.js"></script>
<script>
  const result = CalcMD.calcmd('| Item | Qty | ... |');
</script>

<!-- Via ES Module -->
<script type="module">
  import { calcmd } from 'https://unpkg.com/@calcmd/core/dist/calcmd.esm.js';
</script>
```

### Consequences

- Users can use CalcMD without npm/bundler
- Works in CodePen, JSFiddle, Observable
- Can be used in Python (via PyScript)
- Larger file size than WASM (~50KB vs ~20KB)
- Can add true WASM later for optimization

### Future: True WASM

If performance/size becomes critical:
1. Port to AssemblyScript (1 week)
2. Compile to WASM
3. Publish as `@calcmd/core-wasm`
4. 60% smaller, 50% faster

But start with browser bundle since it's quick and practical.

---

## Decision Process

When making technical decisions, we consider:

1. **User Impact**: Does this improve the user experience?
2. **Maintenance Burden**: Can we maintain this long-term?
3. **Implementation Effort**: Is the benefit worth the cost?
4. **Reversibility**: Can we change this later if needed?
5. **Alignment**: Does this fit CalcMD's design principles?

### Design Principles (from docs/02-Tenets.md)

1. Human-readable: formulas use column names, not A1 cell references
2. AI-friendly: easy for LLMs to generate and validate
3. Git-friendly: plain text, diffs cleanly
4. Graceful degradation: renders as normal markdown without tools
5. Secure: whitelist-only functions, sandboxed evaluation, no scripting
6. Non-intrusive: CalcMD adapts to the user's table, not the other way around

---

## Status Definitions

- **Proposed**: Under consideration, not yet implemented
- **Accepted**: Decision made and implemented
- **Deprecated**: No longer recommended, but still supported
- **Superseded**: Replaced by a newer decision
