# Tenets: CalcMD

These tenets guide all decisions about CalcMD. When in doubt, refer to these principles.

---

## 1. Human-Readable First, Tool-Parseable Second

**Tables must be understandable without any tool.**

❌ Bad:
```markdown
| A | B | C | D |
|---|---|---|---|
| 2 | 1500 | =B*C | |
```

✅ Good:
```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2  | 1500  | 3000            |
```

**Why**: CalcMD should degrade gracefully. Even in a basic text editor without any CalcMD support, the table should make sense.

**Implications**:
- Use meaningful column names, not A/B/C
- Formulas reference column names, not cell coordinates
- Results are shown alongside formulas, not hidden

---

## 2. Simple Things Should Be Simple, Complex Things Should Be Impossible

**We intentionally limit complexity to stay focused.**

CalcMD is for:
- ✅ Basic arithmetic: `Qty * Price`
- ✅ Common aggregations: `sum(Total)`
- ✅ Simple conditionals: `if(Status=="Active", Amount, 0)`

CalcMD is NOT for:
- ❌ VLOOKUP or complex lookups
- ❌ Pivot tables
- ❌ Macros or scripting
- ❌ Multi-sheet references
- ❌ External data sources

**Why**: Every feature adds complexity. We choose to be excellent at a small set of use cases rather than mediocre at everything.

**Implications**:
- Say "no" to most feature requests
- If someone needs complex features, recommend Excel/Sheets/Jupyter
- Keep function list small and well-defined

---

## 3. Explicit Over Implicit

**Make calculations obvious, not magical.**

❌ Bad (implicit):
```markdown
<!-- Formulas defined elsewhere -->
| Item | Qty | Price | Total |
|------|-----|-------|-------|
| Ramen | 2  | 1500  | 3000  |
```

✅ Good (explicit):
```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2  | 1500  | 3000            |
```

**Why**: When someone looks at a CalcMD table, they should immediately see how values are calculated.

**Implications**:
- Formulas are always visible in the table (in headers or cells)
- No hidden formula definitions
- No auto-fill or drag-to-copy behaviors (too magical)

---

## 4. AI-Friendly Syntax

**LLMs should easily generate and validate CalcMD.**

CalcMD syntax is designed so that:
- AI can learn it from a short system prompt
- Common patterns are easy to tokenize
- Errors are obvious to both AI and humans
- Validation is deterministic

❌ Bad (hard for AI):
```markdown
| Item | Qty | Price | Total |
|------|-----|-------|-------|
| =CELL("Ramen") | =CELL("2") | =CELL("1500") | =MULTIPLY(B2,C2) |
```

✅ Good (AI-friendly):
```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2  | 1500  | 3000            |
```

**Why**: In the AI era, many tables will be AI-generated. The format must be easy for AI to produce correctly.

**Implications**:
- Use natural syntax (like math notation)
- Avoid overly technical symbols
- Make formula structure predictable

---

## 5. Security by Default

**CalcMD must be safe to execute automatically.**

Unlike Excel (which can run arbitrary VBA), CalcMD:
- ✅ Only whitelisted functions
- ✅ No file/network/system access
- ✅ No loops or recursion
- ✅ Bounded computation (max expression depth)
- ✅ Sandboxed execution

**Why**: Auto-execution of formulas is a key feature. It must be safe.

**Implications**:
- Every function must be explicitly approved
- Implementations must enforce execution limits
- User-defined functions are NOT supported
- No eval() or code execution

---

## 6. Git and Version Control Friendly

**CalcMD should work well with diff, merge, and version history.**

Good properties:
- ✅ Plain text (no binary formats)
- ✅ Line-based (each row is independent)
- ✅ Formulas preserved (not just results)
- ✅ Merge conflicts are obvious

**Why**: Modern collaboration happens in Git. CalcMD must fit this workflow.

**Implications**:
- No binary metadata
- No hidden state
- Formulas are part of the source, not separate
- Changes to formulas are visible in diffs

---

## 7. Progressive Enhancement

**Basic use is trivial; advanced use is available but optional.**

Level 0: **Plain text table** (works everywhere)
```markdown
| Item | Qty | Price | Total |
|------|-----|-------|-------|
| Ramen | 2  | 1500  | 3000  |
```

Level 1: **Add formulas** (still readable without tools)
```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Ramen | 2  | 1500  | 3000            |
```

Level 2: **Tool validation** (browser extension highlights errors)

Level 3: **Live editing** (editor plugin updates results as you type)

**Why**: Users should be able to adopt CalcMD incrementally, not all-or-nothing.

**Implications**:
- Core format is simple
- Advanced features are tool-dependent
- No required tooling

---

## 8. Multiple Implementations Over Single Monolith

**CalcMD succeeds when there are many tools, not one "official" app.**

We encourage:
- ✅ Independent implementations in different languages
- ✅ Specialized tools for different use cases
- ✅ Competition and innovation in the ecosystem

We avoid:
- ❌ "Official CalcMD app"
- ❌ Forcing users into a specific toolchain
- ❌ Proprietary extensions to the spec

**Why**: Standards thrive when they're tool-agnostic. Markdown succeeded because it works everywhere.

**Implications**:
- Focus on specification quality
- Provide comprehensive test suite
- Celebrate third-party implementations

---

## 9. Fail Loudly, Not Silently

**Errors should be obvious and actionable.**

When validation fails:
- ✅ Clear error message: "Row 3: Total should be 3000, got 3500"
- ✅ Point to exact location: row/column
- ✅ Suggest fix when possible

When tool doesn't support CalcMD:
- ✅ Table still renders (formulas as text)
- ✅ No data loss
- ✅ No silent failures

**Why**: Trust comes from reliability. If something is wrong, users need to know immediately.

**Implications**:
- Error messages must be helpful
- Validation should be easy to run
- No "it looks right but it's wrong" scenarios

---

## 10. Standard First, Features Second

**Building a standard requires different thinking than building a product.**

For standards:
- ✅ Stability over iteration speed
- ✅ Backward compatibility is sacred
- ✅ Multiple implementations prove the spec
- ✅ Community consensus matters
- ✅ Documentation is as important as code

For products:
- Move fast and break things
- Add features to compete
- Optimize for single implementation
- Company decides direction

**Why**: We're building a standard, not a startup. Our measure of success is adoption and longevity, not revenue or feature count.

**Implications**:
- v1.0 should be stable for years
- Changes require RFC process
- Breaking changes require major version bump
- Deprecation periods are long

---

## Tenet Conflicts & Resolution

Sometimes tenets conflict. Here's how we resolve them:

### "Human-Readable" vs "AI-Friendly"
**Resolution**: When syntax choices conflict, optimize for human readability. AI can learn complex syntax; humans struggle with unreadable formats.

### "Simple" vs "Useful"
**Resolution**: If a feature would make CalcMD significantly more useful for core use cases AND complexity is contained, we consider it. But we default to "no."

### "Explicit" vs "Concise"
**Resolution**: Explicit wins. `Total=Qty*Price` is better than shorter but less clear alternatives.

### "Security" vs "Features"
**Resolution**: Security always wins. If a feature can't be made safe, we don't add it.

---

## Using These Tenets

**When proposing a change:**
1. Check which tenets support it
2. Check which tenets oppose it
3. If opposed by any tenet, explain why the benefit outweighs the cost
4. If opposed by Tenet 5 (Security), the bar is very high

**When debating features:**
- "This violates Tenet X" is a strong argument
- "This aligns with Tenets X, Y, Z" is persuasive
- Precedent: past decisions based on tenets guide future ones

**When in doubt:**
- Ask: "Would this make CalcMD more like Excel?" → If yes, probably no
- Ask: "Would this work without any tooling?" → If no, reconsider
- Ask: "Could an AI generate this correctly?" → If no, simplify

---

Last updated: 2026-03-13
