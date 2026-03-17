# Specification: CalcMD v0.1

> **Status**: Draft  
> **Version**: 0.1.0  
> **Last Updated**: 2026-03-13

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

### 2.2 Formula Placement

Formulas can appear in two locations:

#### A. Column Header Formula
```markdown
| Item | Qty | Price | Total=Qty*Price |
```

**Semantics**: Every cell in the `Total` column is computed using the formula `Qty*Price`, where `Qty` and `Price` refer to values in the same row.

#### B. Cell Formula
```markdown
| Item  | Amount |
|-------|--------|
| A     | 100    |
| B     | 200    |
| **Total** | **300=sum(Amount)** |
```

**Semantics**: The specific cell contains a formula. This is typically used for aggregations.

### 2.3 Formula Syntax

**Format**: `[display_value]=[formula]`

- **`display_value`**: Optional. The computed result (for verification)
- **`=`**: Delimiter
- **`formula`**: The expression to evaluate

**Examples**:
```markdown
3000=Qty*Price          # With display value
=Qty*Price              # Without display value (computed on-the-fly)
300=sum(Amount)         # Aggregation with display value
```

**Precedence**: If display value is present, tools SHOULD validate it matches the computed result.

### 2.4 Column Naming

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

### 2.5 Escaping

- **Pipe in cell**: Use `\|` to escape
- **Equals in cell**: Prefix with space or wrap in quotes to avoid formula interpretation
  - ` =this is not a formula`
  - `"=also not a formula"`

---

## 3. Formula Language

### 3.1 Expression Types

CalcMD supports:
1. **Literals**: `123`, `3.14`, `"text"`, `true`, `false`
2. **Column references**: `Qty`, `Price`, `Unit_Price`
3. **Operators**: `+`, `-`, `*`, `/`, `%`, `()`, comparison, logical
4. **Functions**: Whitelist only (see below)

### 3.2 Operators

#### Arithmetic
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `+` | Addition | `10+5` | `15` |
| `-` | Subtraction | `10-5` | `5` |
| `*` | Multiplication | `10*5` | `50` |
| `/` | Division | `10/5` | `2` |
| `%` | Modulo | `10%3` | `1` |
| `()` | Grouping | `(10+5)*2` | `30` |

#### Comparison
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `==` | Equal | `5==5` | `true` |
| `!=` | Not equal | `5!=3` | `true` |
| `>` | Greater than | `5>3` | `true` |
| `>=` | Greater or equal | `5>=5` | `true` |
| `<` | Less than | `3<5` | `true` |
| `<=` | Less or equal | `3<=5` | `true` |

#### Logical
| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `and` | Logical AND | `true and false` | `false` |
| `or` | Logical OR | `true or false` | `true` |
| `not` | Logical NOT | `not true` | `false` |

**Precedence** (high to low):
1. `()`
2. `*`, `/`, `%`
3. `+`, `-`
4. `>`, `>=`, `<`, `<=`
5. `==`, `!=`
6. `not`
7. `and`
8. `or`

### 3.3 Functions

#### Aggregation Functions

| Function | Description | Example | Notes |
|----------|-------------|---------|-------|
| `sum(col)` | Sum of all values in column | `sum(Amount)` | Ignores non-numeric |
| `avg(col)` | Average of values | `avg(Amount)` | Ignores non-numeric |
| `min(col)` | Minimum value | `min(Amount)` | Works on numbers |
| `max(col)` | Maximum value | `max(Amount)` | Works on numbers |
| `count(col)` | Count of non-empty values | `count(Item)` | All types |

**Aggregation Scope**: Functions operate on all rows in the table (excluding the row containing the formula itself).

#### Mathematical Functions

| Function | Description | Example | Notes |
|----------|-------------|---------|-------|
| `round(n, d)` | Round to d decimal places | `round(3.14159, 2)` | Returns `3.14` |
| `abs(n)` | Absolute value | `abs(-5)` | Returns `5` |
| `floor(n)` | Round down | `floor(3.7)` | Returns `3` |
| `ceil(n)` | Round up | `ceil(3.2)` | Returns `4` |

#### Conditional Functions

| Function | Description | Example |
|----------|-------------|---------|
| `if(cond, true_val, false_val)` | Conditional | `if(Status=="Active", Amount, 0)` |

**Semantics**:
- `cond`: Boolean expression
- `true_val`: Returned if `cond` is true
- `false_val`: Returned if `cond` is false

### 3.4 Type Coercion

CalcMD uses strict typing with limited coercion:

| Operation | Type Rules | Example |
|-----------|------------|---------|
| Arithmetic | Number + Number → Number | `5+3` → `8` |
| | Number + String → ERROR | `5+"text"` → ERROR |
| Comparison | Number == Number | `5==5` → `true` |
| | String == String | `"a"=="a"` → `true` |
| | Number == String → `false` | `5=="5"` → `false` |
| String Concat | Use `+` on strings | `"Hello"+" World"` → `"Hello World"` |

**Note**: No implicit number ↔ string conversion.

---

## 4. Type System

### 4.1 Supported Types

1. **Number**: `123`, `3.14`, `-5`, `1e6`
2. **String**: `"text"`, `"with \"quotes\""`
3. **Boolean**: `true`, `false`
4. **Null**: Empty cells or undefined values

### 4.2 Type Inference

Cells are parsed as:
1. **Number** if matches regex: `-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?`
2. **Boolean** if exact match: `true` or `false` (case-insensitive)
3. **String** otherwise

### 4.3 Null Handling

- Empty cells: Treated as `null`
- Arithmetic with `null`: Result is `null`
- Aggregations: `sum()`, `avg()` skip `null` values
- Comparison: `null == null` → `true`, `null == anything_else` → `false`

---

## 5. Execution Model

### 5.1 Evaluation Phases

1. **Parse**: Extract table structure, identify formulas
2. **Dependency Analysis**: Build directed acyclic graph (DAG)
3. **Topological Sort**: Determine evaluation order
4. **Compute**: Evaluate formulas in order
5. **Validate**: If display values present, compare with computed values

### 5.2 Dependency Rules

#### Row-Level Dependencies
Formula in column `C` can reference columns `A`, `B` in same row:
```markdown
| A | B | C=A+B |
```

#### Column-Level Dependencies
Formula can reference entire column (for aggregations):
```markdown
| Amount |
|--------|
| 100    |
| 200    |
| **Total=sum(Amount)** |
```

#### Cross-Column Dependencies
Computed column can be used in another formula:
```markdown
| Qty | Price | Subtotal=Qty*Price | Tax=Subtotal*0.1 | Total=Subtotal+Tax |
```

**Evaluation order**: `Subtotal` → `Tax` → `Total`

### 5.3 Circular References

Circular dependencies are **forbidden**:
```markdown
| A=B+1 | B=A+1 |  ← ERROR: Circular dependency
```

**Detection**: Implementations MUST detect and reject circular references.

### 5.4 Execution Limits

To ensure security and performance, implementations MUST enforce:

1. **Max expression depth**: 100 nested operations
2. **Max table size**: 10,000 rows × 100 columns
3. **Max string length**: 10,000 characters
4. **Timeout**: 5 seconds per table evaluation

Exceeding limits → Error (table not evaluated).

---

## 6. Error Handling

### 6.1 Parse Errors

**Syntax error in formula**:
```
Error: Column 3, Row 2: Unexpected token '?' in formula
```

**Missing column reference**:
```
Error: Column 'Pric' not found. Did you mean 'Price'?
```

### 6.2 Runtime Errors

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

### 6.3 Validation Errors

**Mismatched result**:
```
Warning: Row 2, Column 'Total': Expected 3000, computed 3500
```

### 6.4 Error Propagation

- Errors in one cell do NOT halt evaluation of other cells
- Error cells display: `#ERROR`
- Tools SHOULD collect all errors and report together

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

### 7.2 Function Whitelist

ONLY functions listed in Section 3.3 are allowed.

**Forbidden**:
- User-defined functions
- `eval()` or similar
- Import/require
- Reflection/introspection

### 7.3 Execution Limits

See Section 5.4. Limits prevent:
- Denial of service (infinite loops)
- Memory exhaustion (huge tables)
- Stack overflow (deeply nested expressions)

### 7.4 Injection Prevention

Formula parsers MUST:
- Treat cell content as data, not code
- Validate all inputs
- Escape special characters in error messages

---

## 8. Conformance

### 8.1 Conformance Levels

#### Level 1: Parser
- Parse CalcMD syntax
- Build AST
- Detect syntax errors

#### Level 2: Validator
- Level 1 +
- Validate formulas (type checking)
- Detect circular references
- Compare display values with computed results

#### Level 3: Executor
- Level 2 +
- Evaluate formulas
- Handle errors gracefully
- Enforce execution limits

### 8.2 Test Suite

A conformance test suite is available at: `tests/spec-tests.yaml`

Implementations SHOULD pass all tests to claim conformance.

### 8.3 Extensions

Implementations MAY add:
- Additional functions (clearly marked as extensions)
- Enhanced error messages
- Performance optimizations

Implementations MUST NOT:
- Change syntax
- Break compatibility with conforming CalcMD files
- Silently accept invalid formulas

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

---

## 10. Version History

- **v0.1.0** (2026-03-13): Initial draft specification

---

## 11. References

- CommonMark Specification: https://spec.commonmark.org/
- GitHub Flavored Markdown: https://github.github.com/gfm/
- TOML Specification: https://toml.io/en/

---

## 12. License

This specification is released under CC0 1.0 Universal (Public Domain).

---

Last updated: 2026-03-13
