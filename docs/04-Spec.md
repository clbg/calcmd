# Specification: CalcMD v0.1

> **Status**: Draft  
> **Version**: 0.1.4  
> **Last Updated**: 2026-03-18

---

## Table of Contents

1. [Overview](#overview)
2. [Syntax](#syntax)
3. [Formula Language](#formula-language)
4. [Type System](#type-system)
5. [Execution Model](#execution-model)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Conformance](#conformance)
9. [Examples](#examples)
10. [Open Issues & Known Gaps](#open-issues--known-gaps)
11. [Version History](#version-history)
12. [References](#references)
13. [License](#license)

---

## 1. Overview

### 1.1 Purpose

CalcMD extends markdown table syntax to support embedded formulas, enabling:
- Verifiable calculations in plain text
- Human-readable formula definitions
- Tool-based validation and execution

### 1.2 Design Goals

1. **Human-readable**: Formulas are obvious without tools
2. **AI-friendly**: Easy for LLMs to generate
3. **Git-friendly**: Diffs show formula changes
4. **Secure**: Safe to auto-execute
5. **Simple**: Limited scope, clear semantics
6. **Non-intrusive**: CalcMD adapts to the user's table, not the other way around. Column names, row content, and table structure are the user's choice — CalcMD MUST NOT impose naming conventions, structural constraints, or reserved patterns that restrict how users organize their data

### 1.3 Non-Goals

- Replace spreadsheet applications
- Support complex financial/statistical functions
- Enable scripting or macros
- Provide UI/rendering specifications

---

## 2. Syntax

### 2.1 Table Structure

CalcMD uses standard markdown pipe table syntax:

```markdown
| Column1 | Column2 | Column3 |
|---------|---------|---------|
| value   | value   | value   |
```

### 2.2 Document Scope

A single markdown document MAY contain multiple CalcMD tables. Each table is an **isolated scope**: formulas in one table cannot reference columns or rows in another table. Cross-table references are not supported in v0.1.

### 2.3 Formula Placement

Formulas can appear in two locations:

#### A. Column Header Formula (Default Template)
```markdown
| Item | Qty | Price | Total=Qty*Price |
```

**Semantics**: The formula `Qty*Price` is the **default template** for the `Total` column. It applies to every cell in that column that does not have its own cell-level formula. Column references (`Qty`, `Price`) resolve to values in the same row.

#### B. Cell Formula
```markdown
| Item  | Amount |
|-------|--------|
| A     | 100    |
| B     | 200    |
| **Total** | **300=sum(Amount)** |
```

**Semantics**: The specific cell contains a formula. This is typically used for aggregations.

#### C. Cell Formula Overrides Column Formula

When a column has a header formula AND a cell in that column has its own formula, the **cell formula takes precedence**. The column formula is skipped for that cell.

```markdown
| Item   | Qty | Price | Total=Qty*Price     |
|--------|-----|-------|---------------------|
| Widget | 10  | 5     |                     |
| @gd: Gadget | 3 | 20  |                     |
| Half   |     |       | =@gd.Total / 2     |
| @total: Sum  |  |     | **=sum(Total)**     |
```

**Evaluation**:
- Row "Widget": `Total` uses column formula → `10*5 = 50`
- Row "Gadget" (label `gd`): `Total` uses column formula → `3*20 = 60`
- Row "Half": `Total` uses **cell formula** (overrides column formula) → `60/2 = 30`
- Row "Sum" (label `total`): `Total` uses **cell formula** (overrides column formula) → `sum(Total) = 110`

This design mirrors Excel Structured Tables: the column formula is a convenience for the common case, but individual cells can always override it.

### 2.4 Formula Syntax

**Format**: `[display_value]=[formula]`

- **`display_value`**: Optional. The pre-computed result shown for verification.
- **`=`**: Delimiter between display value and formula.
- **`formula`**: The expression to evaluate.

**Examples**:
```markdown
3000=Qty*Price          # With display value
=Qty*Price              # Without display value (computed on-the-fly)
300=sum(Amount)         # Aggregation with display value
```

**Validation behavior**:
- If `display_value` is present, tools SHOULD validate it matches the computed result and report a warning on mismatch (see Section 6.3).
- If `display_value` is absent and the formula errors, the cell displays `#ERROR` (see Section 6.4).
- If `display_value` is present and the formula errors, the cell retains the display value and the error is reported separately.

### 2.5 Column Naming

Column names are used in formulas. Rules:

1. **Case-insensitive**: `Qty`, `qty`, `QTY` all refer to the same column
2. **Whitespace**: Spaces in column names → replace with `_` in formulas
   - Column: `Unit Price` → Formula: `Unit_Price`
3. **Special characters**: Alphanumeric and `_` only in formulas
4. **Reserved**: Cannot use function names (`sum`, `avg`, etc.) as column names

**Example**:
```markdown
| Product Name | Unit Price | Quantity | Total=Unit_Price*Quantity |
```

#### Column Aliases

Column names can be long or awkward in formulas. To improve ergonomics without restricting how users name their columns (see Design Goal 6), a column MAY declare an alias using `#alias` at the end of the header name:

```markdown
| Adjusted Gross Income #agi | Federal Tax Rate #rate | Tax Due=agi*rate |
```

- `#alias` — the alias identifier. Alphanumeric and `_` only, case-insensitive.
- The alias is stripped during parsing; the column's display name remains `Adjusted Gross Income`.
- Formulas can use either the alias (`agi`) or the full name with underscores (`Adjusted_Gross_Income`). Alias takes precedence if there is a name collision.
- Aliases MUST be unique within a table. Duplicate aliases → error.
- An alias MUST NOT collide with another column's full name (after underscore normalization). E.g., if a column is named `Rate`, another column cannot use `#Rate` as an alias.

**With row labels**:
```markdown
| Line | Description | Adjusted Gross Income #agi |
|------|-------------|----------------------------|
| 1    | @wages: Gross Income | 85000               |
| 2    | @ded: Deductions     | 13850               |
| 3    | Taxable Income       | =@wages.agi - @ded.agi |
```

`@wages.agi` is equivalent to `@wages.Adjusted_Gross_Income` — shorter and less error-prone.

**Column alias + column formula**:
```markdown
| Adjusted Gross Income #agi | Tax Rate #rate | Tax Due #tax=agi*rate |
```

The column formula `agi*rate` uses aliases. This is equivalent to `Adjusted_Gross_Income*Tax_Rate` but far more readable. When both alias and formula are present, the header is parsed as: `Display Name #alias=formula`. The `=` delimiter separates the column name (with alias) from the formula, then `#alias` is extracted from the name portion.

**Parsing order for headers**:
1. Split on first `=` → left side is column name (possibly with `#alias`), right side is formula
2. In the column name, check for `#alias` suffix → extract alias, remainder is display name
3. Result: display name, optional alias, optional formula

**Graceful degradation**: In a plain markdown renderer, the header displays `Adjusted Gross Income #agi`. The `#agi` suffix is visible but unobtrusive — readers can infer it's a shorthand marker.

### 2.6 Markdown Formatting in Cells

Cells MAY contain markdown inline formatting such as `**bold**` or `*italic*`. Implementations MUST strip inline formatting before parsing cell content for formulas or values.

For example, `**300=sum(Amount)**` is parsed as the formula `300=sum(Amount)` with bold formatting. This is commonly used for summary/total rows.

### 2.7 Escaping

- **Pipe in cell**: Use `\|` to escape
- **Equals in cell**: To include a literal `=` that is not a formula delimiter:
  - Prefix with a space: ` =this is not a formula`
  - Wrap in quotes: `"=also not a formula"`
  - Use in a position where the left side is not a valid display value (implementation-defined)

> **⚠️ Open question**: The escaping rules for `=` are minimal. A future version may define a more explicit escape mechanism (e.g., `\=`). See Section 10.

---

## 3. Formula Language

### 3.1 Expression Types

CalcMD supports:
1. **Literals**: `123`, `3.14`, `"text"`, `true`, `false`
2. **Column references**: `Qty`, `Price`, `Unit_Price`
3. **Row label references**: `@label`, `@label.Column` (see Section 3.5)
4. **Operators**: `+`, `-`, `*`, `/`, `%`, `()`, comparison, logical
5. **Functions**: Whitelist only (see Section 3.3)

### 3.2 Operators

#### Arithmetic
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `+` | Addition / String concatenation | `10+5` | `15` |
| `-` | Subtraction | `10-5` | `5` |
| `*` | Multiplication | `10*5` | `50` |
| `/` | Division | `10/5` | `2` |
| `%` | Modulo | `10%3` | `1` |
| `()` | Grouping | `(10+5)*2` | `30` |

**`+` operator behavior**:

> **⚠️ Spec/implementation inconsistency**: The spec originally stated `Number + String → ERROR` (strict typing). However, the POC implementation coerces both operands to strings when either side is a string (e.g., `5+"text"` → `"5text"`). This MUST be reconciled before v1.0. The recommended resolution is to follow the spec (ERROR), since implicit coercion is a common source of bugs and contradicts the strict typing principle in Section 3.4.

| Left Type | Right Type | Result |
|-----------|------------|--------|
| Number | Number | Number (addition) |
| String | String | String (concatenation) |
| Number | String | **ERROR** (see note above) |
| String | Number | **ERROR** (see note above) |

#### Comparison
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `==` | Equal | `5==5` | `true` |
| `!=` | Not equal | `5!=3` | `true` |
| `>` | Greater than | `5>3` | `true` |
| `>=` | Greater or equal | `5>=5` | `true` |
| `<` | Less than | `3<5` | `true` |
| `<=` | Less or equal | `3<=5` | `true` |

**Cross-type comparison rules**:
- `==` and `!=`: Comparing different types returns `false` (no coercion). E.g., `5=="5"` → `false`.
- `>`, `<`, `>=`, `<=`: Both operands MUST be the same type (both Number or both String). Mixed types → **ERROR**.

> **⚠️ Spec/implementation inconsistency**: The POC evaluator uses JavaScript's native comparison for `>`, `<`, `>=`, `<=` without type checking, which means `5 > "3"` silently succeeds via JS coercion. This should be fixed to match the spec rule above.

#### Logical
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `and` | Logical AND | `true and false` | `false` |
| `or` | Logical OR | `true or false` | `true` |
| `not` | Logical NOT | `not true` | `false` |

#### Operator Precedence (high to low)

| Priority | Operators | Associativity |
|----------|-----------|---------------|
| 1 | `()` | — |
| 2 | Unary `-`, `not` | Right |
| 3 | `*`, `/`, `%` | Left |
| 4 | `+`, `-` | Left |
| 5 | `>`, `>=`, `<`, `<=` | Left |
| 6 | `==`, `!=` | Left |
| 7 | `and` | Left |
| 8 | `or` | Left |

> **⚠️ Correction from v0.1.0**: The original spec listed `not` at priority 6 (between `==`/`!=` and `and`). This was incorrect. `not` is a unary operator and binds tighter than all binary operators, consistent with the POC parser implementation. The table above reflects the correct precedence.

### 3.3 Functions

Function names are **case-insensitive**: `SUM()`, `Sum()`, and `sum()` are equivalent.

#### Aggregation Functions

| Function | Description | Example | Notes |
|----------|-------------|---------|-------|
| `sum(col)` | Sum of all values in column | `sum(Amount)` | Ignores non-numeric and null |
| `avg(col)` | Average of values | `avg(Amount)` | Ignores non-numeric and null |
| `min(col)` | Minimum value | `min(Amount)` | Numbers only |
| `max(col)` | Maximum value | `max(Amount)` | Numbers only |
| `count(col)` | Count of non-empty values | `count(Item)` | All types; excludes null |

**Aggregation Scope**: Aggregation functions operate on all rows in the table **excluding the row containing the formula itself**. This prevents self-referential calculations in summary rows.

#### Mathematical Functions

| Function | Description | Example | Result | Status |
|----------|-------------|---------|--------|--------|
| `round(n, d)` | Round to d decimal places | `round(3.14159, 2)` | `3.14` | ✅ Implemented |
| `abs(n)` | Absolute value | `abs(-5)` | `5` | ✅ Implemented |
| `floor(n)` | Round down | `floor(3.7)` | `3` | ⚠️ Not yet implemented in POC |
| `ceil(n)` | Round up | `ceil(3.2)` | `4` | ⚠️ Not yet implemented in POC |

#### Conditional Functions

| Function | Description | Example |
|----------|-------------|---------|
| `if(cond, true_val, false_val)` | Conditional | `if(Status=="Active", Amount, 0)` |

**Semantics**:
- `cond`: Expression that evaluates to a truthy/falsy value
- `true_val`: Returned if `cond` is truthy
- `false_val`: Returned if `cond` is falsy
- Nested `if()` is supported: `if(x>90,"A",if(x>80,"B","C"))`

### 3.4 Type Coercion

CalcMD uses **strict typing** with minimal coercion:

| Operation | Type Rules | Example |
|-----------|------------|---------|
| Arithmetic (`-`, `*`, `/`, `%`) | Number × Number → Number | `5*3` → `15` |
| | Any other combination → ERROR | `5*"text"` → ERROR |
| Addition (`+`) | Number + Number → Number | `5+3` → `8` |
| | String + String → String (concat) | `"Hello"+" World"` → `"Hello World"` |
| | Number + String → ERROR | `5+"text"` → ERROR |
| Equality (`==`, `!=`) | Same type → Boolean | `5==5` → `true` |
| | Different types → `false` / `true` | `5=="5"` → `false` |
| Ordering (`>`, `<`, `>=`, `<=`) | Same type only | `5>3` → `true` |
| | Different types → ERROR | `5>"3"` → ERROR |

**Note**: No implicit number ↔ string conversion. This is intentional to prevent subtle bugs in AI-generated tables.

### 3.5 Row Label References

Row labels allow formulas to reference specific cells by row name + column name, using the `@` prefix.

#### Declaring a Label

A label is declared inside any cell using the syntax `@label_name: value`:

```
@label_name: cell_value
```

- `@label_name` — the label identifier. Alphanumeric and `_` only (same rules as column names).
- `: ` — colon followed by a space is the delimiter between label and value.
- `cell_value` — the actual value of the cell (number, string, formula, etc.).

The label is stripped during parsing; the cell's effective value is `cell_value` only.

**Example**:
```markdown
| Line | Description          | Amount |
|------|----------------------|--------|
| 1    | @wages: Gross Income | 85000  |
| 2    | @ded: Deductions     | 13850  |
| 3    | Taxable Income       | =@wages.Amount - @ded.Amount |
```

- Row 1, Description cell: label is `wages`, cell value is `Gross Income`
- Row 2, Description cell: label is `ded`, cell value is `Deductions`
- Row 3 has no label

**Rules**:
1. A label MAY appear in any column, not just the first column.
2. Each row MAY have at most one label. If multiple cells in the same row declare labels, the parser MUST report an error.
3. Label names are case-sensitive: `@wages` and `@Wages` are different labels.
4. Label names MUST be unique within a table. Duplicate labels → error.
5. A cell with only `@label_name` (no colon, no value) is shorthand for `@label_name: @label_name` — the label is declared and the cell value is the string `@label_name`. This preserves backward compatibility and graceful degradation.

**Graceful degradation**: In a plain markdown renderer, `@wages: Gross Income` displays as-is. The `@wages:` prefix is visible but human-readable — readers can infer it's a label marker.

#### Referencing a Label

Formulas reference labeled cells using `@label.Column`:

- **`@label.Column`** — returns the value of the specified column in the labeled row.

```markdown
| Category             | Q1   | Q2   | Total=Q1+Q2              |
|----------------------|------|------|--------------------------|
| @rev: Revenue        | 5000 | 6000 |                          |
| @cost: Cost          | 3000 | 3500 |                          |
| Profit               |      |      | =@rev.Total - @cost.Total |
```

**Bare `@label` (without `.Column`)**: Not recommended. Implementations MAY support bare `@label` as a convenience (e.g., returning the last numeric value in the row), but this behavior is implementation-defined and not portable. Formulas intended to be portable across implementations MUST use `@label.Column`.

> **Open question for future versions**: The `@label.Column` syntax requires knowing the column name, which can be awkward when column names are long or unusual. Future versions may consider column aliases or positional references (e.g., `@label[2]`) as ergonomic improvements. See backlog.

---

## 4. Type System

### 4.1 Supported Types

1. **Number**: `123`, `3.14`, `-5`, `1e6`
2. **String**: `"text"`, `"with \"quotes\""`
3. **Boolean**: `true`, `false`
4. **Null**: Empty cells or undefined values

### 4.2 Type Inference

Cell values (not inside formulas) are parsed as:
1. **Number** if matches regex: `-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?`
2. **Boolean** if exact match: `true` or `false` (case-insensitive)
3. **String** otherwise

> **Note**: Negative numbers in cell values are parsed as Number via the regex above. In formulas, `-5` is parsed as the unary operator `-` applied to the literal `5`. The result is the same, but the AST representation differs. Implementations should be aware of this distinction.

### 4.3 Null Handling

- Empty cells: Treated as `null`
- Arithmetic with `null`: Result is `null` (null propagation)
- Aggregations: `sum()`, `avg()`, `min()`, `max()` skip `null` values; `count()` excludes `null`
- Comparison: `null == null` → `true`, `null == anything_else` → `false`
- Conditional: `if(null, true_val, false_val)` → `false_val` (null is falsy)

### 4.4 Number Precision and Formatting

> **⚠️ Underspecified**: The spec does not define:
> - Numeric precision requirements (IEEE 754 double? arbitrary precision?)
> - Display formatting rules (how many decimal places to show for computed values)
> - Rounding behavior for display (truncate vs. round)
>
> The POC uses JavaScript's native `number` type (IEEE 754 double-precision). Implementations in other languages should document their precision model. A future version of the spec should define minimum precision requirements and a default display format.

---

## 5. Execution Model

### 5.1 Evaluation Phases

1. **Parse**: Extract table structure from markdown, identify formulas in headers and cells
2. **Expand**: Expand column-header formulas into per-cell formulas. For each cell in a column with a header formula, if the cell does NOT have its own cell-level formula, assign the column formula as the cell's effective formula. Cells with their own formula are left unchanged (cell overrides column — see §2.3C).
3. **Dependency Analysis**: Build a directed acyclic graph (DAG) at **cell granularity**. Each cell with a formula is a node. Edges represent dependencies:
   - Column reference in a row-level formula → edge to the referenced cell in the same row
   - Aggregation function (`sum(Col)`, etc.) → edges to all cells in the referenced column (excluding the current row)
   - Label reference (`@label.Col`) → edge to the specific cell in the labeled row
4. **Topological Sort**: Determine evaluation order from the DAG. Cells with no dependencies are evaluated first.
5. **Compute**: Evaluate formulas in topological order
6. **Validate**: If display values are present, compare with computed results

### 5.2 Dependency Rules

#### Row-Level Dependencies
A column formula can reference other columns in the same row:
```markdown
| A | B | C=A+B |
```
After expansion, each row's `C` cell has formula `A+B`, with edges to `A` and `B` in the same row.

#### Column-Level Dependencies (Aggregations)
A cell formula can reference an entire column for aggregation:
```markdown
| Amount |
|--------|
| 100    |
| 200    |
| **300=sum(Amount)** |
```
The `sum(Amount)` cell depends on all other `Amount` cells (excluding itself).

#### Cross-Column Dependencies
A computed column can be referenced by another formula. Evaluation follows topological order:
```markdown
| Qty | Price | Subtotal=Qty*Price | Tax=Subtotal*0.1 | Total=Subtotal+Tax |
```

After expansion, for each row: `Subtotal` depends on `Qty` and `Price`; `Tax` depends on `Subtotal`; `Total` depends on `Subtotal` and `Tax`. Topological sort ensures correct order.

#### Mixed Dependencies (Column Formula + Cell Override)
A cell formula MAY override a column formula and aggregate computed values:
```markdown
| Qty | Price | Subtotal=Qty*Price |
|-----|-------|--------------------|
| 2   | 100   |                    |
| 3   | 50    |                    |
| **Total** | | **=sum(Subtotal)** |
```

After expansion:
- Row 0, `Subtotal`: effective formula `Qty*Price` (from column)
- Row 1, `Subtotal`: effective formula `Qty*Price` (from column)
- Row 2, `Subtotal`: effective formula `sum(Subtotal)` (cell override)

The dependency graph ensures Row 0 and Row 1 `Subtotal` cells are evaluated before Row 2's `sum(Subtotal)`.

#### Cell Override with Cross-Row Reference
A cell formula MAY reference another row's computed value in the same column:
```markdown
| Item   | Qty | Price | Total=Qty*Price    |
|--------|-----|-------|--------------------|
| Widget | 10  | 5     |                    |
| @gd: Gadget | 3 | 20 |                    |
| Half   |     |       | =@gd.Total / 2    |
```

Row "Half" overrides the column formula and references `@gd.Total`. The dependency graph tracks this: `Half.Total → Gadget.Total → Gadget.Qty, Gadget.Price`.

### 5.3 Circular References

Circular dependencies are **forbidden**:
```markdown
| A=B+1 | B=A+1 |  ← ERROR: Circular dependency
```

**Detection**: Implementations MUST detect circular references during dependency analysis (Phase 3) by checking for cycles in the DAG. If a cycle is found:
- All cells participating in the cycle are marked as errors
- Error message MUST include the cycle path (e.g., `Circular dependency: R0.A → R0.B → R0.A`)
- Non-circular cells continue evaluation normally

**Same-column cross-row references** are allowed as long as they don't form a cycle:
```markdown
| Item       | Value          |
|------------|----------------|
| @a: First  | 100            |
| B          | =@a.Value * 2  |
```

But:
```markdown
| Item       | Value          |
|------------|----------------|
| @a: First  | =@b.Value + 1  |
| @b: Second | =@a.Value + 1  |
```
→ ERROR: `@a.Value → @b.Value → @a.Value`

### 5.4 Execution Limits

To ensure security and performance, implementations MUST enforce:

| Limit | Value | On Exceed |
|-------|-------|-----------|
| Max expression depth | 100 nested operations | Error on the offending cell |
| Max table size | 10,000 rows × 100 columns | Error; entire table not evaluated |
| Max string length | 10,000 characters | Error on the offending cell |
| Evaluation timeout | 5 seconds per table | Error; entire table not evaluated |

When a per-cell limit is exceeded, only that cell errors; other cells continue evaluation. When a table-level limit is exceeded (size, timeout), the entire table is not evaluated and a single error is reported.

---

## 6. Error Handling

### 6.1 Error Categories

CalcMD defines three error categories:

| Category | When | Severity |
|----------|------|----------|
| Parse error | Formula has invalid syntax | Error |
| Runtime error | Type mismatch, division by zero, missing reference | Error |
| Validation warning | Display value doesn't match computed result | Warning |

### 6.2 Parse Errors

**Syntax error in formula**:
```
Error: Column 3, Row 2: Unexpected token '?' in formula
```

**Missing column reference**:
```
Error: Column 'Pric' not found. Did you mean 'Price'?
```

Implementations SHOULD provide "did you mean?" suggestions for misspelled column names.

### 6.3 Runtime Errors

**Type error**:
```
Error: Row 2, Column 'Total': Cannot multiply string by number
```

**Division by zero**:
```
Error: Row 3, Column 'Ratio': Division by zero
```

**Circular reference**:
```
Error: Circular dependency detected: A → B → A
```

**Unknown function**:
```
Error: Row 1, Column 'Result': Unknown function 'sum_if'
```

### 6.4 Validation Warnings

**Mismatched result**:
```
Warning: Row 2, Column 'Total': Display value is 3000, computed value is 3500
```

Validation warnings are non-fatal. The computed value takes precedence for downstream formulas; the display value is treated as documentation.

### 6.5 Error Propagation

- Errors in one cell do NOT halt evaluation of other cells.
- A cell with an error displays `#ERROR` (when no display value is present).
- A cell with a display value and an error retains the display value; the error is reported separately.
- If a formula references a cell that is in an error state, the referencing cell also errors (error propagation).
- Tools SHOULD collect all errors and report them together after evaluation completes.

### 6.6 Error Message Format

Error messages SHOULD follow this structure:
```
[Error|Warning]: [Location]: [Description]
```

Where location is `Row N, Column 'Name'` for cell errors, or `Column 'Name'` for column-level errors.

Implementations MAY enhance error messages with additional context but MUST include at minimum the location and a human-readable description.

---

## 7. Security

### 7.1 Sandboxing

Implementations MUST:
- Evaluate formulas in a sandboxed environment
- Prevent access to:
  - File system
  - Network
  - System calls
  - External processes
  - Host language runtime (e.g., no `eval()`, no reflection)

### 7.2 Function Whitelist

ONLY functions listed in Section 3.3 are allowed.

**Forbidden**:
- User-defined functions
- `eval()` or similar dynamic execution
- Import/require/include
- Reflection/introspection
- Any function not explicitly listed in the spec

Implementations that add extension functions (see Section 8.3) MUST clearly document them as non-standard.

### 7.3 Execution Limits

See Section 5.4. Limits prevent:
- Denial of service (deeply nested expressions)
- Memory exhaustion (oversized tables or strings)
- Stack overflow (deeply nested function calls)

### 7.4 Injection Prevention

Formula parsers MUST:
- Treat cell content as data, not executable code
- Validate all inputs against the grammar before evaluation
- Escape special characters in error messages to prevent secondary injection

---

## 8. Conformance

### 8.1 Conformance Levels

#### Level 1: Parser
- Parse CalcMD syntax (table structure, formula detection)
- Build AST
- Detect and report syntax errors

#### Level 2: Validator
- Level 1 +
- Validate formulas (type checking, column resolution)
- Detect circular references
- Compare display values with computed results

#### Level 3: Executor
- Level 2 +
- Evaluate all formulas
- Handle errors gracefully (non-throwing, collect errors)
- Enforce execution limits (Section 5.4)

### 8.2 Test Suite

> **⚠️ Not yet available**: The spec references a conformance test suite at `tests/spec-tests.yaml`. This file does not yet exist. Creating a comprehensive test suite is a priority for v0.2. Implementations should use the examples in Section 9 and `docs/05-Examples.md` as interim test cases.

### 8.3 Extensions

Implementations MAY add:
- Additional functions (clearly marked as non-standard extensions)
- Enhanced error messages and suggestions
- Performance optimizations
- Alternative output formats

Implementations MUST NOT:
- Change core syntax (formula placement, `=` delimiter, column references)
- Break compatibility with conforming CalcMD files
- Silently accept invalid formulas (must report errors)
- Add operators not defined in this spec

---

## 9. Examples

### Example 1: Simple Calculation
```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3  | 1.50  | 4.50            |
| Banana | 5 | 0.80 | 4.00            |
| **Total** | | | **8.50=sum(Total)** |
```

### Example 2: Conditional Logic
```markdown
| Student | Score | Grade=if(Score>=90,"A",if(Score>=80,"B",if(Score>=70,"C","D"))) |
|---------|-------|------------------------------------------------------------------|
| Alice   | 95    | A                                                                |
| Bob     | 82    | B                                                                |
| Charlie | 68    | D                                                                |
```

### Example 3: Multi-Step Calculation
```markdown
| Product | Units | Price | Subtotal=Units*Price | Tax=round(Subtotal*0.1,2) | Total=Subtotal+Tax |
|---------|-------|-------|----------------------|---------------------------|---------------------|
| Laptop  | 2     | 1000  | 2000                 | 200.00                    | 2200.00             |
| Mouse   | 5     | 25    | 125                  | 12.50                     | 137.50              |
| **Sum** |       |       | **2125=sum(Subtotal)** | **212.50=sum(Tax)** | **2337.50=sum(Total)** |
```

### Example 4: Percentage Calculation
```markdown
| Category | Count | Percentage=round(Count/sum(Count)*100,1) |
|----------|-------|------------------------------------------|
| A        | 45    | 45.0                                     |
| B        | 30    | 30.0                                     |
| C        | 25    | 25.0                                     |
| **Total** | **100=sum(Count)** | **100.0=sum(Percentage)** |
```

> **Note on Example 4**: The `Percentage` column formula uses `sum(Count)` as a divisor. Since this is a column-header formula, `sum(Count)` is evaluated per-row and excludes the current row. This means each row's percentage is calculated against the sum of all *other* rows' counts, which may produce unexpected results. Implementations should document this behavior clearly. A future version may introduce a `total(col)` function that includes all rows.

---

## 10. Open Issues & Known Gaps

All open issues, missing features, spec/implementation inconsistencies, and underspecified areas have been moved to the centralized backlog:

**→ See `docs/07-Backlog.md`**

The backlog is organized by category (functions, spec inconsistencies, underspecified areas, workflow, tooling, future features) and prioritized P0–P3. Key P0 items that block core use cases:

- **F-01**: `sum_if(condition, col)` — conditional aggregation, needed for expense-split use case
- **F-02**: `total(col)` — all-inclusive aggregation, needed for percentage-of-total calculations
- **S-01**: `+` operator type coercion mismatch between spec and POC
- **S-02**: Comparison operator type checking missing in POC
- **S-04**: Cell formula must override column formula (POC has wrong priority)
- **S-05**: Dependency graph at cell granularity with topological sort (POC evaluates by row order)
- **S-06**: Circular reference detection (POC has none, silently produces wrong results)
- **W-01**: Display value inconsistency handling — tools should auto-update and prompt user to accept or remove

---

## 11. Version History

- **v0.1.4** (2026-03-18): Added Design Goal 6 "Non-intrusive" — CalcMD adapts to user's table, not the other way around (§1.2). Added column alias syntax `#alias` in headers (§2.5) for ergonomic formula references without restricting column naming freedom.
- **v0.1.3** (2026-03-18): Row label syntax redesigned — `@label: value` with colon+space delimiter, label can appear in any column (§3.5). Bare `@label` marked as implementation-defined. Resolved U-01 and U-02.
- **v0.1.2** (2026-03-18): Column formula is now a default template — cell formula overrides column formula (§2.3C). Execution model rewritten: added expansion phase, dependency graph at cell granularity, topological sort, cycle detection with cycle-path reporting (§5.1–5.3). Added same-column cross-row reference examples.
- **v0.1.1** (2026-03-18): Revised draft — added open issues section, documented spec/implementation inconsistencies, clarified underspecified areas (row labels, escaping, number precision, document scope, markdown formatting in cells, aggregation scope semantics), corrected operator precedence table, added implementation status to function list.
- **v0.1.0** (2026-03-13): Initial draft specification.

---

## 12. References

- CommonMark Specification: https://spec.commonmark.org/
- GitHub Flavored Markdown: https://github.github.com/gfm/
- TOML Specification: https://toml.io/en/
- IEEE 754 Floating-Point Standard: https://standards.ieee.org/ieee/754/6210/
- CalcMD Examples: `docs/05-Examples.md`
- CalcMD User Stories: `docs/03-User-Stories.md`

---

## 13. License

This specification is released under CC0 1.0 Universal (Public Domain).

---

Last updated: 2026-03-18
