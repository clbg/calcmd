# @calcmd/core

> Verifiable calculations in markdown tables

CalcMD extends markdown table syntax with embedded formulas, making calculated values verifiable and transparent — especially in AI-generated content.

## Installation

```bash
npm install @calcmd/core
```

## Quick Start

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

- **Column formulas**: `Total=Qty*Price` (applies to every row)
- **Cell formulas**: `=sum(Amount)` (for aggregations)
- **Row labels**: `@wages: 85000` (cross-row references)
- **Column aliases**: `#agi` (ergonomic shortcuts)
- **Secure**: Sandboxed evaluation, whitelist-only functions
- **Type-safe**: Full TypeScript support
- **Zero dependencies**: Pure TypeScript implementation

## Supported Functions

| Category | Functions |
|----------|-----------|
| **Aggregation** | `sum()`, `avg()`, `count()`, `min()`, `max()` |
| **Math** | `round()`, `abs()`, `floor()`, `ceil()` |
| **Conditional** | `if(condition, true_val, false_val)` |
| **Operators** | `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `and`, `or`, `not` |

## API

### `calcmd(markdown: string): ParsedTable`

Parse and evaluate a CalcMD table.

**Parameters:**
- `markdown` - Markdown string containing a table with formulas

**Returns:** `ParsedTable` object with:
- `columns` - Array of column definitions
- `rows` - Array of rows with computed values
- `labels` - Map of cell labels to locations
- `aliases` - Map of column aliases to names
- `dependencies` - Dependency graph
- `errors` - Array of validation/runtime errors

**Example:**

```typescript
const result = calcmd(`
| Item | Amount |
|------|--------|
| A    | 100    |
| B    | 200    |
| Total | **300=sum(Amount)** |
`);

// Access computed values
result.rows[2].cells[1].computed; // 300

// Check for errors
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

## Examples

### Financial Report

```markdown
| Category | Q1   | Q2   | Total=Q1+Q2 | Change%=round((Q2-Q1)/Q1*100,1) |
|----------|------|------|-------------|----------------------------------|
| Revenue  | 5000 | 6000 | 11000       | 20.0                             |
| Cost     | 3000 | 3500 | 6500        | 16.7                             |
| Profit   | 2000 | 2500 | 4500        | 25.0                             |
```

### Expense Tracking

```markdown
| Item    | Amount | Tax=round(Amount*0.1,2) | Total=Amount+Tax |
|---------|--------|-------------------------|------------------|
| Laptop  | 1000   | 100.00                  | 1100.00          |
| Mouse   | 25     | 2.50                    | 27.50            |
| **Sum** | **1025=sum(Amount)** | **102.50=sum(Tax)** | **1127.50=sum(Total)** |
```

### Percentage Calculation

```markdown
| Category | Count | Percentage=round(Count/sum(Count)*100,1) |
|----------|-------|------------------------------------------|
| A        | 45    | 45.0                                     |
| B        | 30    | 30.0                                     |
| C        | 25    | 25.0                                     |
```

## TypeScript Types

```typescript
import type { ParsedTable, Cell, Column, Row, ValidationError } from '@calcmd/core';

// All types are exported for use in your application
```

## Error Handling

CalcMD collects errors instead of throwing them:

```typescript
const result = calcmd(markdown);

if (result.errors.length > 0) {
  result.errors.forEach(error => {
    console.error(`${error.type} error: ${error.message}`);
    if (error.row !== undefined) {
      console.error(`  at row ${error.row}, column ${error.column}`);
    }
  });
}
```

Error types:
- `parse` - Syntax errors in formulas
- `validation` - Invalid references or circular dependencies
- `runtime` - Type errors or division by zero

## Security

CalcMD is designed to be safe for evaluating untrusted input:

- ✅ Sandboxed evaluation (no access to file system, network, or globals)
- ✅ Whitelist-only functions (no `eval()` or arbitrary code execution)
- ✅ Execution limits (prevents DoS attacks)
- ✅ Strict type checking (no implicit coercion)

## Links

- [Website](https://clbg.github.io/calcmd/)
- [Playground](https://clbg.github.io/calcmd/playground)
- [Specification](https://github.com/clbg/calcmd/blob/master/docs/04-Spec.md)
- [Examples](https://github.com/clbg/calcmd/blob/master/docs/05-Examples.md)
- [GitHub](https://github.com/clbg/calcmd)

## License

MIT © CalcMD Team
