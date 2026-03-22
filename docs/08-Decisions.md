# Technical Decisions

This document records key technical decisions made during CalcMD development.

## WASM Implementation: Rust vs AssemblyScript

**Date**: 2026-03-23  
**Decision**: Use Rust for WASM implementation  
**Status**: ✅ Implemented

### Context

Initially explored AssemblyScript for WASM implementation due to TypeScript-like syntax. After completing AssemblyScript version, decided to rewrite in Rust.

### Options Considered

1. **AssemblyScript**
   - Pros: TypeScript-like syntax, easy to port
   - Cons: Limited ecosystem, manual string utilities, less mature tooling

2. **Rust**
   - Pros: Mature ecosystem, excellent tooling, type safety, performance
   - Cons: Steeper learning curve, longer compile times

### Decision

Chose Rust for the following reasons:

1. **Mature Libraries**
   - pest: Declarative parser generator
   - petgraph: Battle-tested graph algorithms
   - serde: Flexible serialization

2. **Type Safety**
   - Rust's ownership system prevents memory bugs
   - Compile-time guarantees
   - Better error messages

3. **Tooling**
   - wasm-pack: Excellent WASM build tool
   - wasm-bindgen: Seamless JS interop
   - cargo: Robust package manager

4. **Performance**
   - Expected better performance for complex calculations
   - Smaller WASM output (~15KB vs ~67KB)
   - More optimization opportunities

### Implementation Notes

- Used pest for formula parsing (declarative grammar)
- Used petgraph's tarjan_scc for dependency resolution
- Error handling via Result types (no exceptions)
- Serde with camelCase renaming for JS compatibility

### Results

- ✅ 7/7 tests passing
- ✅ ~15KB WASM bundle
- ✅ Clean architecture
- ✅ Easy to maintain

### Lessons Learned

1. **Use mature libraries** - pest and petgraph saved weeks of work
2. **Type safety matters** - Rust caught many bugs at compile time
3. **Start simple** - Build up complexity with tests
4. **Document as you go** - Architecture decisions are valuable

---

## Parser Strategy: pest vs Hand-written

**Date**: 2026-03-23  
**Decision**: Use pest parser generator  
**Status**: ✅ Implemented

### Context

Formula parsing requires handling operator precedence, function calls, and various literal types.

### Options Considered

1. **Hand-written Recursive Descent**
   - Pros: Full control, no dependencies
   - Cons: More code, harder to maintain, manual precedence

2. **pest Parser Generator**
   - Pros: Declarative, automatic precedence, easy to extend
   - Cons: Additional dependency, learning curve

### Decision

Chose pest because:

1. **Declarative Grammar** - Easy to read and maintain
2. **Automatic Precedence** - No manual operator precedence handling
3. **Better Errors** - pest provides good error messages
4. **Extensibility** - Easy to add new syntax

### Grammar Highlights

```pest
expr_or = { expr_and ~ (op_or ~ expr_and)* }
expr_and = { expr_comp ~ (op_and ~ expr_comp)* }
expr_comp = { expr_add ~ (op_comp ~ expr_add)* }
expr_add = { expr_mul ~ (op_add ~ expr_mul)* }
expr_mul = { atom ~ (op_mul ~ atom)* }
```

This automatically handles precedence: `or` < `and` < comparison < `+/-` < `*/%`

---

## Dependency Resolution: petgraph vs Custom

**Date**: 2026-03-23  
**Decision**: Use petgraph library  
**Status**: ✅ Implemented

### Context

Need to resolve cell dependencies and detect circular references.

### Options Considered

1. **Custom Implementation**
   - Pros: No dependencies, tailored to needs
   - Cons: More code, potential bugs, reinventing wheel

2. **petgraph Library**
   - Pros: Battle-tested, efficient algorithms, well-documented
   - Cons: Additional dependency, learning curve

### Decision

Chose petgraph because:

1. **tarjan_scc** - Efficient strongly connected components algorithm
2. **Proven** - Used in production by many projects
3. **Correct** - Handles all edge cases (self-loops, multi-node cycles)
4. **Maintained** - Active development and support

### Implementation

```rust
let sccs = tarjan_scc(&graph);
for scc in sccs {
    if scc.len() > 1 {
        // Multi-node cycle
    } else if is_self_loop(scc[0]) {
        // Self-referencing cell
    }
}
```

---

## Error Handling: Result vs Panic

**Date**: 2026-03-23  
**Decision**: Use Result types, collect errors  
**Status**: ✅ Implemented

### Context

WASM doesn't support exceptions. Need error handling strategy.

### Options Considered

1. **Panic on Error**
   - Pros: Simple
   - Cons: Crashes WASM, poor UX

2. **Result Types + Error Collection**
   - Pros: Non-throwing, collects all errors, good UX
   - Cons: More verbose

### Decision

Use Result types with error collection:

```rust
fn evaluate(&self, expr: &Expression) -> Result<CellValue, String>
```

Errors are collected in `Vec<ValidationError>` and returned with results.

### Benefits

1. **Non-throwing** - Never crashes
2. **Complete** - Shows all errors, not just first
3. **Debuggable** - Errors include context (row, column, message)
4. **Matches TypeScript** - Same error handling pattern

---

## Serialization: Serde with Renaming

**Date**: 2026-03-23  
**Decision**: Use serde with camelCase renaming  
**Status**: ✅ Implemented

### Context

Rust uses snake_case, JavaScript uses camelCase. Need compatible JSON.

### Solution

Use serde's `#[serde(rename)]` attribute:

```rust
#[derive(Serialize)]
pub struct Cell {
    pub value: CellValue,
    #[serde(rename = "effectiveFormula")]
    pub effective_formula: Option<String>,
    #[serde(rename = "isColumnFormula")]
    pub is_column_formula: Option<bool>,
}
```

### Benefits

1. **Idiomatic** - Rust code uses snake_case
2. **Compatible** - JSON uses camelCase for JS
3. **Type-safe** - Compile-time checking
4. **Flexible** - Can customize per-field

---

## Future Decisions

### Multi-language SDKs

**Status**: 🔄 Planned

Options:
- Python: wasmtime-py or wasmer-python
- Go: wazero or wasmer-go
- Ruby: wasmtime-rb

### Performance Optimization

**Status**: 🔄 Planned

Areas to explore:
- SIMD for numeric operations
- Streaming parser for large tables
- Incremental evaluation
- Memory pooling

### Custom Functions

**Status**: 🔄 Planned

Allow users to define custom functions:
- Via JavaScript callbacks
- Via WASM modules
- Via configuration
