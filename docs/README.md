# CalcMD - Calculated Markdown Tables

> Making AI-generated tables verifiable with embedded formulas

## Working Backwards Documents

This project follows Amazon's Working Backwards methodology. Read in this order:

1. **[00-PR-FAQ](00-PR-FAQ.md)** - **START HERE** - Press Release & Frequently Asked Questions
2. **[01-Vision](01-Vision.md)** - Long-term vision and strategic direction
3. **[02-Tenets](02-Tenets.md)** - Core principles guiding all decisions
4. **[03-User-Stories](03-User-Stories.md)** - Concrete user scenarios and use cases
5. **[04-Spec](04-Spec.md)** - Technical specification v0.1 (source of truth)
6. **[05-Examples](05-Examples.md)** - Comprehensive examples
7. **[06-Roadmap](06-Roadmap.md)** - Execution roadmap and milestones
8. **[07-Backlog](07-Backlog.md)** - Feature backlog and prioritization
9. **[08-Decisions](08-Decisions.md)** - Architecture Decision Records (ADRs)
10. **[09-Promotion-Strategy](09-Promotion-Strategy.md)** - Marketing and outreach plan
11. **[10-Release-Process](10-Release-Process.md)** - npm publishing and release workflow

## Quick Links

- **Problem**: AI generates tables with calculations, but users can't verify them
- **Solution**: Embed formulas directly in markdown tables
- **Target**: Developers, data analysts, AI users who need trustworthy calculations
- **Differentiation**: Simpler than Excel, more powerful than plain markdown

## Status

- [x] Phase 0: Core documents (Week 1)
- [x] Phase 1: Specification & examples (Week 1-2)
- [x] Phase 2: Reference implementation (Week 2-3)
- [x] Phase 3: Web Components UI library
- [x] Phase 4: Playground and website
- [ ] Phase 5: npm publication and promotion

## Technical Decisions

All significant technical decisions are documented as Architecture Decision Records (ADRs) in [08-Decisions.md](08-Decisions.md):

- **ADR-001**: Floating-point display strategy (6 significant digits)
- **ADR-002**: Context-aware aggregation semantics (cell vs column formulas)
- **ADR-003**: UI component architecture (Web Components with Lit)
- **ADR-004**: Multi-language SDK strategy (WASM + thin wrappers)
- **ADR-005**: Browser distribution strategy (standalone bundle)

---

Last updated: 2026-03-22
