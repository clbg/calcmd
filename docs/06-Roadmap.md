# Roadmap: CalcMD

> Execution plan from concept to industry standard

---

## Overview

**Timeline**: 12 months to v1.0 and ecosystem foundation

**Key Milestones**:
- Week 4: Public launch (v0.1)
- Month 3: 5k GitHub stars, browser extension released
- Month 6: v1.0 specification locked, major platform adoption
- Month 12: 10k+ stars, CalcMD Foundation formed

---

## Phase 0: Foundation (Weeks 1-2)

**Goal**: Complete core documentation and specification

### Week 1: Documentation
- [x] PR/FAQ (Working Backwards document)
- [x] Vision & strategy
- [x] Core tenets
- [x] User stories
- [x] Technical specification v0.1
- [x] Comprehensive examples

### Week 2: Specification Finalization
- [ ] Review spec with 5+ technical reviewers
- [ ] Create formal test suite (50+ test cases)
- [ ] Define error messages and codes
- [ ] Finalize syntax edge cases
- [ ] Write migration guide (from plain markdown)

**Deliverables**:
- Complete Working Backwards docs ✅
- CalcMD Spec v0.1 ✅
- Test suite (JSON/YAML format)
- calcmd.dev domain registered

---

## Phase 1: MVP Implementation (Weeks 3-4)

**Goal**: Working reference implementation and playground

### Week 3: JavaScript Reference Implementation
- [ ] Parser (markdown → AST)
- [ ] Type checker & validator
- [ ] Formula evaluator
- [ ] Error handling
- [ ] Pass all spec tests
- [ ] Publish to NPM: `calcmd-js`

### Week 4: Web Playground
- [ ] Next.js app hosted on Vercel
- [ ] Editor pane (Monaco/CodeMirror)
- [ ] Preview pane (rendered table)
- [ ] Validation UI (errors/warnings)
- [ ] Share functionality (save to URL)
- [ ] Examples library (20+ examples)
- [ ] Deploy to calcmd.dev

**Deliverables**:
- `calcmd-js` v0.1.0 on NPM
- calcmd.dev playground live
- GitHub repo: `calcmd/calcmd` (public)

---

## Phase 2: Community & Launch (Weeks 4-8)

**Goal**: Public launch, initial adoption, 1k GitHub stars

### Week 4: Launch Preparation
- [ ] README.md with compelling demo
- [ ] Record demo GIF (30 seconds)
- [ ] Prepare launch posts:
  - Hacker News title & description
  - Reddit posts (r/programming, r/datascience, r/ChatGPT)
  - Twitter thread (10 tweets)
  - Dev.to article (2000+ words)
- [ ] Contact 10 tech journalists (press kit ready)

### Week 5: Public Launch
**Launch Day (Tuesday or Wednesday)**:
- 10:00 AM PST: Post to Hacker News (Show HN)
- 10:05 AM: Post to Reddit r/programming
- 10:10 AM: Post Twitter thread
- Throughout day: Respond to every comment (Reddit, HN)

**Days 2-3**:
- Post to niche subreddits (r/ChatGPT, r/MachineLearning, r/datascience)
- Cross-post Dev.to article
- Reach out to AI community influencers

**Week 5 Goal**: 500 GitHub stars

### Week 6-8: Python Implementation & CLI
- [ ] Python reference implementation (`calcmd-py`)
- [ ] CLI tool: `calcmd validate file.md`
- [ ] CLI tool: `calcmd compute file.md`
- [ ] CLI tool: `calcmd diff old.md new.md`
- [ ] Publish to PyPI
- [ ] Write "CalcMD for Data Scientists" tutorial

**Deliverables**:
- 1000 GitHub stars
- 2 language implementations (JS, Python)
- CLI tools available
- First 50 community contributions (issues, PRs, discussions)

---

## Phase 3: Ecosystem Tools (Months 3-4)

**Goal**: Browser extension, editor plugins, 5k stars

### Month 3: Browser Extension
**Targets**: Chrome, Firefox, Edge

**Features**:
- Auto-detect CalcMD tables in:
  - ChatGPT (chat.openai.com)
  - Claude (claude.ai)
  - Gemini (gemini.google.com)
  - GitHub (github.com)
- One-click "Verify" button
- Inline error highlighting
- Edit & re-compute
- Export to plain markdown

**Launch**:
- Submit to Chrome Web Store
- Submit to Firefox Add-ons
- Announce on ProductHunt
- Goal: 5k extension users by end of month

### Month 4: Editor Plugins
**VS Code Extension**:
- Syntax highlighting for formulas
- Live validation (as you type)
- Hover tooltips (show computed values)
- Code actions: "Add formula column", "Compute all"
- Publish to VS Code Marketplace

**Obsidian Plugin** (Community-driven):
- Live rendering in preview mode
- Edit mode syntax highlighting
- Validation on save
- Publish to Obsidian Community Plugins

**Deliverables**:
- Browser extension: 10k users
- VS Code extension: 5k installs
- Obsidian plugin: 2k installs
- 5000 GitHub stars

---

## Phase 4: Platform Integration (Months 5-6)

**Goal**: Major platform adoption, v1.0 spec locked

### Month 5: Platform Outreach
**GitHub**:
- Open RFC: "CalcMD support in GitHub Flavored Markdown"
- Demonstrate demand (link to extension usage stats)
- Offer to contribute implementation

**GitLab**:
- Similar RFC process
- GitLab has faster feature adoption cycle

**Notion**:
- Use their API to build integration
- Pitch to Notion team for native support

**Observable**:
- Perfect fit (data + markdown)
- Reach out to Observable team
- Offer to collaborate on integration

### Month 6: Specification v1.0
**Goal**: Lock down syntax for long-term stability

**Process**:
1. Collect community feedback (6 months of usage)
2. RFC process for v1.0 changes
3. Update test suite (500+ tests)
4. Breaking changes (if any) → clear migration guide
5. Announce v1.0 freeze

**v1.0 Guarantees**:
- Syntax is stable (no breaking changes for 2+ years)
- All v0.x tables remain valid
- New features only via opt-in extensions

**Deliverables**:
- CalcMD Spec v1.0 published
- At least 1 major platform commits to native support
- 10,000 GitHub stars
- 10+ language implementations

---

## Phase 5: Standardization (Months 7-12)

**Goal**: Industry-wide adoption, governance structure

### Month 7-9: Language Implementations
**Community-driven implementations** in:
- Ruby (calcmd-rb)
- Go (calcmd-go)
- Rust (calcmd-rs)
- Java (calcmd-java)
- C# (calcmd-cs)
- PHP (calcmd-php)

**Core team provides**:
- Comprehensive test suite
- Reference parser architecture
- Implementation guide

### Month 10: AI Platform Integration
**Goal**: Get AI platforms to generate CalcMD by default

**OpenAI (ChatGPT)**:
- Submit feature request
- Demonstrate user demand (extension metrics)
- Offer to provide system prompt templates
- Pitch: "Reduces re-queries due to calculation errors"

**Anthropic (Claude)**:
- Similar approach via Claude team connections
- Highlight alignment with AI safety (verifiable outputs)

**Google (Gemini)**:
- Pitch via Google AI Studio channels
- Emphasize integration with Google Workspace

**Target**: At least one major AI platform includes CalcMD in their docs/examples

### Month 11: CalcMD Foundation
**Goal**: Long-term governance structure

**Form non-profit foundation**:
- Steering committee (5-7 members)
- Major implementers get representation
- Community-elected representatives

**Foundation responsibilities**:
- Maintain specification
- Run test suite infrastructure
- Organize annual conference
- Manage calcmd.dev website
- Handle trademark (if needed)

### Month 12: First CalcMD Conference
**Virtual or hybrid event**:
- Keynote: "State of CalcMD"
- Track 1: Implementers (sharing learnings)
- Track 2: Users (use case presentations)
- Track 3: Future (RFC proposals)
- Workshops: Building CalcMD tools

**Deliverables**:
- CalcMD Foundation incorporated
- 50+ tool integrations
- 100k+ active users
- First annual conference held
- 15k GitHub stars

---

## Success Metrics

### Quantitative Metrics

| Metric | Week 4 | Month 3 | Month 6 | Month 12 |
|--------|--------|---------|---------|----------|
| GitHub Stars | 500 | 2000 | 10000 | 15000 |
| Extension Users | - | 5000 | 20000 | 50000 |
| Playground Monthly Users | 1000 | 5000 | 20000 | 50000 |
| NPM Weekly Downloads | 100 | 500 | 2000 | 5000 |
| Language Implementations | 1 | 2 | 5 | 10+ |
| Platform Integrations | 0 | 0 | 1 | 3+ |

### Qualitative Metrics

**Community Health**:
- Active Discord/Slack channel (1000+ members by month 12)
- 50+ contributors by month 6
- Welcoming, helpful community culture

**Ecosystem Vitality**:
- 3rd-party tools emerging organically
- StackOverflow questions being answered
- CalcMD mentioned in blog posts, tutorials

**Adoption Signals**:
- Companies using CalcMD in documentation
- Courses teaching CalcMD
- Job postings mentioning CalcMD (rare but powerful signal)

---

## Risk Mitigation

### Risk 1: Low Initial Adoption
**Mitigation**:
- Invest heavily in launch marketing
- Build tools that provide immediate value (playground, extension)
- Target communities with strongest pain points (AI users)

### Risk 2: Competing Standards Emerge
**Mitigation**:
- Move fast to establish momentum
- Build comprehensive ecosystem quickly
- Form governance early to manage forks

### Risk 3: Major Platform Rejects CalcMD
**Mitigation**:
- Browser extensions provide value even without native support
- Focus on platforms with faster adoption cycles (GitLab vs GitHub)
- Build bottom-up demand that platforms can't ignore

### Risk 4: AI Platforms Don't Adopt
**Mitigation**:
- Make it trivially easy (just system prompt changes)
- Demonstrate clear value (fewer re-queries)
- Provide data on user demand

### Risk 5: Specification Complexity Creeps
**Mitigation**:
- Tenets document as decision framework
- RFC process for all changes
- "No" is default answer to feature requests

---

## Long-term Vision (Years 2-5)

### Year 2
- CalcMD in 5+ major platforms natively
- 100k+ GitHub stars
- CalcMD taught in university courses
- Annual conference (1000+ attendees)

### Year 3
- CalcMD is default for AI-generated tables
- W3C/WHATWG consideration for standardization
- Mobile app ecosystem emerges

### Year 5
- CalcMD is ubiquitous (like markdown tables are now)
- "Does it support CalcMD?" is a standard question for tools
- CalcMD Foundation is self-sustaining

---

## What You Can Do Now

### As Project Founder
**Immediate (This Week)**:
1. Finalize spec based on docs review
2. Start JavaScript implementation
3. Set up GitHub repo (public)
4. Register calcmd.dev domain
5. Create Twitter/Reddit accounts

**Next Week**:
1. Complete playground MVP
2. Prepare launch materials
3. Reach out to 5 early reviewers
4. Write launch blog post
5. Record demo video

### Call for Contributors
We need help with:
- **Language implementations** (Python, Ruby, Go, Rust)
- **Editor plugins** (VS Code, Vim, Emacs, JetBrains)
- **Documentation** (tutorials, examples, translations)
- **Testing** (spec test contributions, edge case discovery)
- **Design** (logo, website, marketing materials)

Join us: github.com/calcmd/calcmd

---

## Conclusion

CalcMD has the potential to become **the standard for verifiable calculations in plain text**. 

The roadmap is ambitious but achievable:
- Strong technical foundation (spec + implementations)
- Clear product-market fit (AI era pain point)
- Ecosystem-first approach (tools before monolith)
- Community governance (open, inclusive)

**The future of tables is calculated, verifiable, and collaborative.**

Let's build it together.

---

Last updated: 2026-03-13
