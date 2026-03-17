# Vision: CalcMD

## 10-Year Vision (2036)

**CalcMD is the universal standard for verifiable calculations in plain text documents.**

When people write or read markdown documents containing tables with calculations:
- Authors naturally embed formulas using CalcMD syntax
- Readers expect formulas to be visible and verifiable
- Tools automatically validate and highlight discrepancies
- AI assistants default to generating CalcMD format
- Major platforms (GitHub, GitLab, Notion, Obsidian) render CalcMD natively

**Impact Metrics (2036):**
- 50M+ documents using CalcMD format
- Native support in 10+ major platforms
- 100+ tools and libraries across all major languages
- Taught in data literacy and technical writing courses
- Referenced in AI safety and transparency guidelines

## 3-Year Vision (2029)

**CalcMD is adopted by early majority and integrated into major AI platforms.**

### Adoption Milestones
- **Year 1 (2026)**: Early adopters (developers, data analysts, power users)
  - 10k GitHub stars
  - 5+ language implementations
  - Browser extension: 10k+ users
  
- **Year 2 (2027)**: Early majority (general tech-savvy users)
  - 50k GitHub stars
  - Native support in 2-3 major platforms
  - AI platforms integrate CalcMD in system prompts
  
- **Year 3 (2029)**: Mainstream awareness
  - 100k+ GitHub stars
  - 5+ major platforms with native support
  - First enterprise adoption case studies

### Ecosystem Vision
By 2029, CalcMD has a thriving ecosystem:

**Core:**
- Stable v1.0 specification (locked syntax)
- Test suite with 1000+ test cases
- Reference implementations in 10+ languages

**Tools:**
- Web playground with 100k+ monthly users
- CLI tools integrated in data pipelines
- Editor plugins for all major IDEs
- Mobile apps for iOS/Android

**Integrations:**
- ChatGPT/Claude/Gemini generate CalcMD by default
- GitHub/GitLab render CalcMD with formula highlighting
- Notion/Obsidian/Confluence support CalcMD natively
- Jupyter kernels support CalcMD import/export

**Community:**
- CalcMD Foundation (non-profit governance)
- Annual CalcMD conference
- Community Discord with 10k+ members
- Regional meetups in major tech hubs

## Strategic Pillars

### 1. Simplicity First
**Principle**: CalcMD solves 80% of needs with 20% of Excel's complexity.

We deliberately say "no" to:
- Complex functions (financial, statistical)
- Macros and scripting
- Multi-sheet references
- Conditional formatting
- Charts and visualizations

We focus on:
- Basic arithmetic
- Common aggregations
- Simple conditionals
- Column-based formulas

### 2. AI-Native Design
**Principle**: CalcMD is designed for the AI era, not ported from spreadsheet era.

Key differences:
- **Human-readable formulas**: `Total=Qty*Price` not `=B2*C2`
- **Explicit naming**: Column names, not cell coordinates
- **Verifiability**: Formulas visible in plain text
- **LLM-friendly**: Easy for AI to generate and validate

### 3. Open by Default
**Principle**: CalcMD succeeds when no one owns it.

Commitments:
- Specification is public domain (CC0)
- Reference implementations are MIT/Apache licensed
- No trademark restrictions on "CalcMD"
- Governance by community, not company

### 4. Tool Ecosystem Over Monolithic App
**Principle**: Many specialized tools beat one universal tool.

Instead of "CalcMD App", we enable:
- Parser libraries (embed CalcMD in any app)
- CLI tools (for automation)
- Editor plugins (for authoring)
- Browser extensions (for viewing)
- API services (for validation)

Each tool does one thing well and integrates easily.

### 5. Standards-Track Mindset
**Principle**: Think like a standard from day one.

This means:
- Clear versioning (v0.1, v1.0)
- Comprehensive test suite
- Multiple independent implementations
- Backward compatibility guarantees
- Formal specification language

## Anti-Goals (What We're NOT Building)

1. **Not a spreadsheet replacement**
   - If you need pivot tables, charts, complex formulas → use Excel/Sheets
   
2. **Not a computational notebook**
   - If you need to run Python/R code → use Jupyter/Quarto
   
3. **Not a database**
   - If you need to query large datasets → use DuckDB/SQLite
   
4. **Not a BI tool**
   - If you need dashboards and analytics → use Tableau/PowerBI
   
5. **Not a collaboration platform**
   - We provide the format; tools provide collaboration

## Success Criteria

### Year 1 (2026)
- ✅ **Specification**: v0.1 published, comprehensive test suite
- ✅ **Implementations**: JavaScript, Python reference implementations
- ✅ **Tools**: Web playground, browser extension, CLI
- ✅ **Adoption**: 10k GitHub stars, 5k extension users
- ✅ **Community**: 100+ contributors, 50+ integrations proposed

### Year 2 (2027)
- ✅ **Specification**: v1.0 stable (syntax locked)
- ✅ **Ecosystem**: 10+ language implementations, 50+ tools
- ✅ **Platform adoption**: 2-3 major platforms add native support
- ✅ **AI integration**: ChatGPT or Claude includes CalcMD in system prompt
- ✅ **Community**: 1000+ contributors, first CalcMD conference

### Year 3 (2029)
- ✅ **Industry standard**: Cited in technical writing guidelines
- ✅ **Mainstream adoption**: 50k+ GitHub stars, 100k+ extension users
- ✅ **Platform adoption**: 5+ major platforms with native support
- ✅ **Education**: Taught in data literacy courses
- ✅ **Governance**: CalcMD Foundation established

## Why This Will Succeed

### 1. Right Problem, Right Time
- **AI explosion**: AI-generated content is everywhere
- **Trust crisis**: AI hallucinations are a known problem
- **Verification burden**: Manually checking calculations is tedious
- **Existing solutions**: Excel (too heavy), plain text (no formulas)

### 2. Low Barrier to Adoption
- **No installation**: Works in any text editor
- **Graceful degradation**: Readable without tools
- **Easy to learn**: If you can write `Qty*Price`, you can use CalcMD
- **Incremental adoption**: Use it where it helps, ignore it elsewhere

### 3. Network Effects
- **More users** → more tools → more platform support → more users
- **More tools** → more use cases discovered → more adoption
- **More AI training data** → AI generates better CalcMD → more trust

### 4. Riding Existing Trends
- **Markdown everywhere**: From GitHub READMEs to Notion docs
- **Plain text resurgence**: Obsidian, Logseq, Roam popularity
- **Git for everything**: Version control is not just for code
- **AI as coworker**: ChatGPT/Claude/Copilot are daily tools

### 5. Clear Differentiation
- vs Excel: Simpler, text-based, Git-friendly
- vs Jupyter: Lighter, embeddable, no code environment
- vs CSV: Formulas included, human-readable
- vs Org-mode: Editor-agnostic, AI-friendly

## Risks & Mitigation

### Risk 1: Major platform ignores CalcMD
**Mitigation**: Build browser extensions to add support anyway. If enough users demand it, platforms will follow.

### Risk 2: Competing standards emerge
**Mitigation**: 
- Move fast to establish momentum
- Build comprehensive test suite to define compatibility
- Form governance body early to avoid fragmentation

### Risk 3: AI platforms don't adopt
**Mitigation**: 
- Make it trivially easy (just add to system prompt)
- Show user demand (metrics on extension usage)
- Demonstrate value (fewer re-queries, better trust)

### Risk 4: Complexity creep
**Mitigation**: 
- Write down anti-goals clearly
- Establish "MUST NOT" sections in spec
- Create governance process for saying "no"

### Risk 5: Security vulnerabilities
**Mitigation**: 
- Formula evaluation in sandboxed environment
- Whitelist-only approach to functions
- Mandatory complexity limits
- Security audit before v1.0

## Long-term Governance

### Phase 1 (Year 1): Benevolent Dictator
- Core team makes decisions
- Fast iteration
- Focus: prove the concept

### Phase 2 (Year 2): Community Governance
- Form CalcMD Working Group
- Major implementers have a voice
- Consensus-based decisions
- Focus: stabilize v1.0

### Phase 3 (Year 3+): Foundation
- Form CalcMD Foundation (non-profit)
- Elected steering committee
- Formal RFC process
- Focus: long-term sustainability

## The World We're Building Toward

**In 2036, when someone writes a document with calculations:**

1. They naturally write: `Total=Qty*Price` instead of just `3000`
2. Their editor highlights the formula in a subtle color
3. As they type, the result updates live
4. When they commit to Git, the formula is preserved
5. Their colleague opens it, sees the formula, trusts the calculation
6. An AI reviews the document, validates all formulas automatically
7. A discrepancy is found, flagged, and fixed before anyone makes a decision based on wrong data

**This is the world CalcMD makes possible.**

---

Last updated: 2026-03-13
