# Architecture Decision Records

Lightweight log of significant technical decisions — what was decided, why, and what was ruled out.

---

## ADR-001: Floating-Point Display Strategy

**Date**: 2026-03-21
**Status**: Accepted

### Decision

Use `parseFloat(v.toPrecision(15)).toString()` for all numeric display output. This is applied in a single shared `formatValue()` function exported from `@calcmd/core`, used by both `fill()` and the `Preview` component.

### Context

JavaScript uses IEEE 754 double-precision floating point, which produces noise like `13.000000000000002` for certain calculations. This is a display problem, not a calculation problem.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Arbitrary precision library (decimal.js) | Exact results | ~30KB bundle cost, all arithmetic must be wrapped |
| `toPrecision(15)` truncation | Zero deps, matches Excel behaviour | Still floating point internally |
| Leave as-is (`toString()`) | No code | Ugly output for users |

### Rationale

Excel uses the same underlying IEEE 754 arithmetic and applies a 15 significant digit display cap. CalcMD's use cases (prices, quantities, percentages) are well within this range. Introducing decimal.js would add bundle weight and complexity for no practical benefit given the target domain.

### Consequences

- `formatValue` is part of the public API of `@calcmd/core`
- All display layers must use `formatValue` — do not call `.toString()` directly on computed numbers
- If a future use case requires exact decimal arithmetic (e.g. currency with regulatory requirements), revisit decimal.js at that point
