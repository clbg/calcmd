# AssemblyScript Library Optimization Analysis

## Status: ✅ COMPLETED

Successfully replaced all custom string utilities with AssemblyScript standard library methods.

## Results

- ✅ All 42 tests passing (3 unit + 20 comparison + 19 core)
- ✅ Exact match with TypeScript implementation
- ✅ Code reduced by ~100 lines
- ✅ Bundle size: 67KB (release), 165KB (debug)
- ✅ Cleaner, more maintainable code

## Overview

Analysis of which custom implementations in `assembly/` can be replaced with AssemblyScript standard library or third-party packages.

## Current Custom Implementations

### 1. String Utilities (utils.ts)

#### Can Use Standard Library ✅

AssemblyScript's `String` class already provides:

| Our Implementation | Standard Library | Recommendation |
|-------------------|------------------|----------------|
| `trim(s)` | `s.trim()` | ✅ Replace |
| `startsWith(s, prefix)` | `s.startsWith(prefix)` | ✅ Replace |
| `endsWith(s, suffix)` | `s.endsWith(suffix)` | ✅ Replace |
| `indexOf(s, search, from)` | `s.indexOf(search, from)` | ✅ Replace |
| `split(s, delimiter)` | `s.split(delimiter)` | ✅ Replace |
| `toLowerCase(s)` | `s.toLowerCase()` | ✅ Replace |
| `replace(s, search, repl)` | `s.replace(search, repl)` | ✅ Replace |

**Benefits:**
- Less code to maintain
- Better performance (native implementation)
- More reliable (well-tested)

#### Keep Custom ⚠️

| Function | Reason |
|----------|--------|
| `parseValue()` | Custom logic for CalcMD value parsing |
| `formatValue()` | Custom formatting for CalcMD |
| `isValidIdentifier()` | Domain-specific validation |
| `cellId()` | CalcMD-specific ID generation |

### 2. JSON Serialization (json.ts)

#### Third-Party Options

**Option 1: json-as** (Recommended ⭐)
- Package: `json-as` on npm
- Modern, actively maintained
- High performance
- Full JSON compatibility

```bash
npm install json-as
```

**Option 2: assemblyscript-json**
- Package: `assemblyscript-json` on npm
- Older but stable
- Good performance

**Option 3: as-json**
- Package: `as-json` on npm
- Full JSON compatibility
- Good for complex objects

#### Keep Custom ✅

**Recommendation: Keep custom implementation**

Reasons:
1. **Simplicity**: Our JSON serialization is straightforward and specific to `ParsedTable`
2. **No dependencies**: Adding a JSON library adds ~10-20KB to bundle
3. **Performance**: Custom serialization is optimized for our exact use case
4. **Control**: We control the exact output format
5. **Size**: Our implementation is ~100 lines, very small

The third-party libraries are designed for general-purpose JSON, which is overkill for our needs.

## Recommended Changes

### Phase 1: Use Standard String Methods (High Priority)

Replace custom string utilities with standard library:

```typescript
// Before
import { trim, toLowerCase, startsWith } from './utils';
const cleaned = trim(toLowerCase(str));

// After
const cleaned = str.trim().toLowerCase();
```

**Impact:**
- Remove ~100 lines of code
- Better performance
- More maintainable

### Phase 2: Keep Domain-Specific Code (Current)

Keep these custom implementations:
- `parseValue()` - CalcMD-specific parsing
- `formatValue()` - CalcMD-specific formatting
- `isValidIdentifier()` - Validation logic
- `cellId()` - ID generation
- JSON serialization - Optimized for our use case

## Implementation Plan

### ✅ Step 1: Refactor utils.ts (COMPLETED)

Removed all custom string utility functions and kept only domain-specific code:

```typescript
// assembly/utils.ts (refactored)

import { CellValue, NumberValue, StringValue, BooleanValue, NullValue } from './types';

export const DISPLAY_PRECISION: i32 = 6;

// Value parsing (keep - domain specific)
export function parseValue(str: string): CellValue {
  const trimmed = str.trim();
  
  if (trimmed.length === 0) {
    return new NullValue();
  }
  
  const lower = trimmed.toLowerCase();
  if (lower === 'true') {
    return new BooleanValue(true);
  }
  if (lower === 'false') {
    return new BooleanValue(false);
  }
  
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return new NumberValue(num);
  }
  
  // Remove quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return new StringValue(trimmed.substring(1, trimmed.length - 1));
  }
  
  return new StringValue(trimmed);
}

// Value formatting (keep - domain specific)
export function formatValue(v: CellValue): string {
  const type = v.getType();
  
  if (type === 3) return '';
  if (type === 2) return v.toBoolean() ? 'true' : 'false';
  if (type === 0) return formatNumber(v.toNumber(), DISPLAY_PRECISION);
  
  return v.toString();
}

function formatNumber(num: f64, precision: i32): string {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e15 || (absNum < 1e-6 && absNum > 0)) {
    return num.toString();
  }
  
  const factor = Math.pow(10, precision);
  const rounded = Math.round(num * factor) / factor;
  
  return rounded.toString();
}

// Identifier validation (keep - domain specific)
export function isValidIdentifier(s: string): bool {
  if (s.length === 0) return false;
  
  const first = s.charCodeAt(0);
  if (!isAlpha(first) && first !== 95) return false;
  
  for (let i = 1; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (!isAlphaNumeric(code) && code !== 95) return false;
  }
  
  return true;
}

function isAlpha(code: i32): bool {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAlphaNumeric(code: i32): bool {
  return isAlpha(code) || (code >= 48 && code <= 57);
}

export function isDigit(code: i32): bool {
  return code >= 48 && code <= 57;
}

// Cell ID generation (keep - domain specific)
export function cellId(row: i32, col: i32): string {
  return 'R' + row.toString() + '.C' + col.toString();
}
```

### ✅ Step 2: Update All Imports (COMPLETED)

Updated files that imported from utils.ts:
- `parser.ts`
- `formula-parser.ts`
- `evaluator.ts`
- `dependency-graph.ts`

Change from:
```typescript
import { trim, toLowerCase, split } from './utils';
```

To:
```typescript
// Use standard String methods directly
// No import needed
```

### ✅ Step 3: Update Usage (COMPLETED)

Replaced custom function calls with standard methods:

```typescript
// Before
const parts = split(line, '|');
const cleaned = trim(toLowerCase(part));

// After
const parts = line.split('|');
const cleaned = part.trim().toLowerCase();
```

## Benefits Summary

### Code Reduction
- Remove ~100 lines of custom string utilities
- Simpler codebase
- Less to maintain

### Performance
- Native string methods are optimized
- Potentially faster execution
- Smaller WASM binary

### Maintainability
- Standard library is well-tested
- Familiar API for developers
- Less custom code to debug

### Bundle Size
- Estimated reduction: ~1-2KB
- No additional dependencies needed

## Testing Strategy

✅ After refactoring:
1. ✅ Ran all 42 tests - ALL PASSED
2. ✅ Verified exact same output as TypeScript version
3. ✅ Checked bundle size: 67KB release, 165KB debug
4. ✅ Confirmed code reduction of ~100 lines

## Conclusion

**✅ Optimization Complete:**
1. ✅ Replaced custom string utilities with standard library
2. ✅ Kept domain-specific utilities (parseValue, formatValue, etc.)
3. ✅ Kept custom JSON serialization (optimized for our use case)
4. ❌ Didn't add third-party JSON libraries (unnecessary overhead)

**Results:**
- ✅ Cleaner code
- ✅ Better maintainability
- ✅ Smaller codebase (~100 lines removed)
- ✅ All tests passing
- ✅ Exact match with TypeScript implementation
