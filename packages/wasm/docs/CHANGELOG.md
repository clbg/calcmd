# CalcMD WASM Change History

Complete history of the CalcMD WASM implementation, including major milestones, refactorings, and optimizations.

## 2026-03-22: Library Optimization

### Changes

**Replaced custom string utilities with AssemblyScript standard library**

Removed ~100 lines of custom string utility functions and replaced them with native AssemblyScript String methods:

| Custom Function | Standard Library | Status |
|----------------|------------------|--------|
| `trim(s)` | `s.trim()` | ✅ Replaced |
| `toLowerCase(s)` | `s.toLowerCase()` | ✅ Replaced |
| `startsWith(s, prefix)` | `s.startsWith(prefix)` | ✅ Replaced |
| `endsWith(s, suffix)` | `s.endsWith(suffix)` | ✅ Replaced |
| `indexOf(s, search)` | `s.indexOf(search)` | ✅ Replaced |
| `split(s, delimiter)` | `s.split(delimiter)` | ✅ Replaced |
| `replace(s, search, repl)` | `s.replace(search, repl)` | ✅ Replaced |

**Kept domain-specific utilities:**
- `parseValue()` - CalcMD-specific value parsing
- `formatValue()` - CalcMD-specific formatting
- `isValidIdentifier()` - Identifier validation
- `cellId()` - Cell ID generation
- Custom JSON serialization (optimized for ParsedTable)

**Files modified:**
- `assembly/utils.ts` - Removed custom string utilities
- `assembly/json.ts` - Cleaned up unused imports
- `assembly/evaluator.ts` - Using standard methods
- `assembly/dependency-graph.ts` - Using standard methods
- `assembly/formula-parser.ts` - Using standard methods
- `assembly/evaluator-functions.ts` - Removed unused import

### Results

- ✅ All 42 tests passing
- ✅ Exact match with TypeScript implementation
- ✅ Code reduced by ~100 lines
- ✅ Cleaner, more maintainable codebase
- ✅ No diagnostics or errors

### Documentation

See [LIBRARY-OPTIMIZATION.md](LIBRARY-OPTIMIZATION.md) for detailed analysis and implementation plan.

---

## 2026-03-22: Project Refactoring

### Changes

**Reorganized project structure for better maintainability**

1. **File Renaming**
   - `assembly/evaluator-part1.ts` → `assembly/dependency-graph.ts`
   - More descriptive name indicating module purpose
   - Updated import in `evaluator.ts`

2. **Directory Structure**
   - Created `docs/` directory
   - Moved all documentation from root to `docs/`
   - Better separation of concerns

3. **Documentation Organization**
   - Moved: `STATUS.md` → `docs/STATUS.md`
   - Moved: `TEST-RESULTS.md` → `docs/TEST-RESULTS.md`
   - Moved: `TESTING.md` → `docs/TESTING.md`
   - Created: `docs/ARCHITECTURE.md` (comprehensive guide)
   - Created: `docs/REFACTORING.md` (refactoring summary)

4. **Cleanup**
   - Removed obsolete test files:
     - `test-calcmd.mjs`
     - `test-wasm.js`
     - `test-wasm.mjs`
     - `tests/index.js`
   - Kept organized test files:
     - `tests/unit.test.mjs`
     - `tests/compare.test.mjs`
     - `tests/all-core-tests.mjs`

5. **Package Configuration**
   - Updated `package.json` with test scripts
   - Added: `test:unit`, `test:compare`, `test:core`, `test:all`
   - Updated `README.md` with clearer structure

### Final Structure

```
packages/wasm/
├── assembly/              # AssemblyScript source
│   ├── types.ts
│   ├── utils.ts
│   ├── parser.ts
│   ├── formula-parser.ts
│   ├── evaluator.ts
│   ├── evaluator-context.ts
│   ├── evaluator-functions.ts
│   ├── dependency-graph.ts    # ← Renamed
│   ├── json.ts
│   └── index.ts
├── build/                 # Compiled WASM
├── tests/                 # Test suites
│   ├── unit.test.mjs
│   ├── compare.test.mjs
│   └── all-core-tests.mjs
├── docs/                  # Documentation ← New
│   ├── ARCHITECTURE.md
│   ├── STATUS.md
│   ├── TESTING.md
│   ├── TEST-RESULTS.md
│   └── REFACTORING.md
└── README.md
```

### Benefits

- ✅ Clearer file names and organization
- ✅ Professional project structure
- ✅ Easier to navigate and maintain
- ✅ Better documentation organization
- ✅ No clutter from obsolete files

### Verification

All tests pass after refactoring:
- ✅ 3/3 unit tests
- ✅ 20/20 comparison tests
- ✅ 19/19 core tests
- ✅ **Total: 42/42 tests passing**

---

## 2026-03-22: Complete Test Suite

### Changes

**Ported all tests from TypeScript implementation**

Created comprehensive test suite with three levels:

1. **Unit Tests** (3 tests)
   - Basic WASM module loading
   - Simple functionality verification
   - Quick smoke tests

2. **Comparison Tests** (20 tests)
   - Direct WASM vs TypeScript output comparison
   - Covers all operators and functions
   - Verifies exact match on all features

3. **Core Test Suite** (19 tests)
   - Complete port from `packages/core/tests/basic.test.ts`
   - All CalcMD features tested
   - Edge cases and error handling

### Results

**✅ 42/42 tests passing with 100% match to TypeScript**

All features verified:
- Column formulas and cell formulas
- All operators (arithmetic, comparison, logical)
- All functions (sum, avg, min, max, count, round, abs, floor, ceil, if)
- Cell labels (@label: value)
- Column aliases (#alias)
- Dependency resolution and topological sort
- Circular dependency detection with cycle path reporting
- Error collection and reporting

### Key Achievements

1. **Complete Feature Parity**
   - Every TypeScript feature works identically in WASM
   - Exact output match on all test cases

2. **Error Handling Without Exceptions**
   - Error values instead of thrown exceptions
   - Error propagation through expression tree
   - Full error collection in ValidationError array

3. **Circular Dependency Detection**
   - Full cycle path reporting
   - Matches TypeScript error count and messages

### Documentation

See [DEVELOPMENT.md](DEVELOPMENT.md#testing) for complete testing guide.

---

## 2026-03-22: Error Handling Fixes

### Changes

**Fixed error handling to work without exceptions**

AssemblyScript doesn't support exceptions, so we implemented error handling using error values:

1. **Replaced all `throw new Error()`**
   - Before: `throw new Error('Type error')`
   - After: `return new StringValue('ERROR: Type error')`

2. **Added error propagation**
   - Check for error values after each evaluation step
   - Propagate errors through expression tree
   - Store errors in cell.error field

3. **Fixed circular dependency detection**
   - Added error collection to TopoSorter class
   - Report full cycle path in error message
   - Match TypeScript error count (3 errors for cycle)

### Files Modified

- `assembly/evaluator.ts` - Error propagation in all evaluation methods
- `assembly/dependency-graph.ts` - Cycle path error reporting
- `assembly/evaluator-functions.ts` - Function error handling

### Results

- ✅ Type errors return proper error values
- ✅ Circular dependencies detected with full path
- ✅ Error count matches TypeScript exactly
- ✅ No "unreachable" exceptions

---

## 2026-03-21: Initial WASM Implementation

### Changes

**Complete port of CalcMD from TypeScript to AssemblyScript**

Ported all modules:
- ✅ Types system (`types.ts`)
- ✅ Utilities (`utils.ts`)
- ✅ Parser (`parser.ts`)
- ✅ Formula Parser (`formula-parser.ts`)
- ✅ Evaluator Context (`evaluator-context.ts`)
- ✅ Built-in Functions (`evaluator-functions.ts`)
- ✅ Dependency Graph (`dependency-graph.ts`)
- ✅ Main Evaluator (`evaluator.ts`)
- ✅ JSON Serialization (`json.ts`)
- ✅ Entry Point (`index.ts`)

### Key Adaptations

1. **No Exceptions**
   - Replaced all `throw` statements with error value returns
   - Added error checking at each step

2. **No Closures**
   - Refactored nested functions to class methods
   - Created TopoSorter class for topological sort

3. **Explicit Types**
   - Replaced `any` with proper type checking
   - Used `instanceof` checks with explicit casts

4. **Map Operations**
   - Always use `map.has()` before `map.get()`
   - Handle null cases explicitly

### Build Output

- Debug build: ~165KB
- Release build: ~67KB
- Clean build with no errors

### Results

- ✅ Successful compilation
- ✅ All features implemented
- ✅ Ready for testing

---

## Summary

### Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-03-21 | Initial WASM implementation | ✅ Complete |
| 2026-03-22 | Error handling fixes | ✅ Complete |
| 2026-03-22 | Complete test suite | ✅ Complete |
| 2026-03-22 | Project refactoring | ✅ Complete |
| 2026-03-22 | Library optimization | ✅ Complete |

### Current Status

**✅ Production Ready**

- 100% feature complete
- 42/42 tests passing
- Exact match with TypeScript
- Optimized bundle size (67KB)
- Clean, maintainable code
- Comprehensive documentation

### Next Steps

1. **JavaScript/TypeScript Wrapper** - Create user-friendly JS/TS API
2. **Python SDK** - Build Python bindings
3. **Performance Benchmarks** - Compare speed vs TypeScript
4. **NPM Package** - Publish as `@calcmd/wasm`
5. **Multi-language SDKs** - Go, Rust, Ruby, Java, .NET

---

## Migration Notes

### For Developers

**Import Changes:**
```typescript
// Old
import { DependencyGraphBuilder } from './evaluator-part1';

// New
import { DependencyGraphBuilder } from './dependency-graph';
```

**Documentation Paths:**
```
Old: STATUS.md, TESTING.md, TEST-RESULTS.md
New: docs/STATUS.md, docs/TESTING.md, docs/TEST-RESULTS.md
```

**Test Scripts:**
```bash
# New scripts available
pnpm test:unit      # Unit tests
pnpm test:compare   # Comparison tests
pnpm test:core      # Core test suite
pnpm test:all       # All tests
```

### For Users

No breaking changes - the public API remains the same:

```typescript
export function calcmd(markdown: string): string
```

Returns JSON string with ParsedTable structure, identical to TypeScript version.
