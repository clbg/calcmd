# User Stories: CalcMD

## Primary Personas

### Persona 1: Alex - AI Power User
**Profile**: Software engineer, uses ChatGPT/Claude daily, early adopter

**Goals**:
- Get quick calculations from AI
- Verify AI responses easily
- Avoid manual calculator checks

**Pain Points**:
- AI sometimes makes arithmetic errors
- Copying to Excel breaks workflow
- No way to see calculation logic

**How CalcMD Helps**:
- AI generates tables with visible formulas
- Browser extension validates instantly
- Stay in conversation flow

---

### Persona 2: Maria - Data Analyst
**Profile**: Works with datasets, creates reports in markdown, uses Git

**Goals**:
- Document analysis with calculations
- Version control analysis logic
- Share reproducible reports

**Pain Points**:
- Excel files don't diff well in Git
- Jupyter notebooks are too heavy for simple tables
- Can't embed calculations in markdown docs

**How CalcMD Helps**:
- Tables with formulas in markdown
- Git shows formula changes clearly
- Lightweight alternative to notebooks

---

### Persona 3: Chen - Small Business Owner
**Profile**: Non-technical, splits expenses with partners, needs simple accounting

**Goals**:
- Track shared expenses
- Calculate splits accurately
- Share with partners easily

**Pain Points**:
- Excel is overkill
- Google Sheets requires Google account
- Hard to verify manual calculations

**How CalcMD Helps**:
- Simple text file anyone can edit
- Formulas show how splits are calculated
- Can email or message the table directly

---

## User Stories by Category

### Category 1: AI Verification

#### Story 1.1: Verify Travel Expense Split
**As** a traveler splitting expenses with friends  
**I want** to verify AI-calculated splits  
**So that** everyone pays the correct amount

**Scenario**:
```
1. User asks ChatGPT: "We went to Akita. Here are expenses: [list]. 
   Split between Charlie and ZZL. How much does each person owe?"

2. ChatGPT generates CalcMD table:
   | Item | Amount | Payer | Split | Charlie_owes | ZZL_owes |
   |------|--------|-------|-------|--------------|----------|
   | ...  | ...    | ...   | ...   | =if(Payer=="Charlie",0,Amount/2) | ... |

3. User clicks browser extension "Verify"

4. Extension validates:
   ✅ All formulas compute correctly
   ✅ Total owed matches total paid
```

**Acceptance Criteria**:
- Browser extension recognizes CalcMD in ChatGPT
- One-click verification
- Clear ✅/❌ indicators
- Errors show expected vs actual values

---

#### Story 1.2: Validate Sales Report
**As** a sales manager  
**I want** to validate AI-generated sales summaries  
**So that** I don't present wrong numbers to my team

**Scenario**:
```
1. User uploads sales CSV to Claude

2. Asks: "Summarize total revenue by region and calculate growth %"

3. Claude generates CalcMD table with formulas

4. User pastes into VS Code with CalcMD extension

5. Extension highlights one formula in red: growth% incorrect

6. User catches error before sharing report
```

**Acceptance Criteria**:
- VS Code extension validates on save
- Error highlighting with hover details
- Can fix and re-validate
- Export to plain markdown for sharing

---

### Category 2: Documentation & Collaboration

#### Story 2.1: Budget Planning Document
**As** a project manager  
**I want** to maintain a budget in markdown  
**So that** the team can see how totals are calculated

**Scenario**:
```
1. Create docs/budget.md with CalcMD table:
   | Category | Q1 | Q2 | Q3 | Q4 | Total=Q1+Q2+Q3+Q4 |
   |----------|----|----|----|----|-------------------|
   | Engineering | 100k | 110k | 120k | 130k | 460k |
   | ...

2. Commit to Git

3. Teammate reviews PR, sees formula change in diff:
   - Total=Q1+Q2+Q3+Q4
   + Total=sum(Q1,Q2,Q3,Q4)

4. Comments: "Good, using sum() is clearer"

5. Merge with confidence
```

**Acceptance Criteria**:
- Formulas visible in Git diff
- GitHub renders table (with or without native support)
- Changes to formulas are obvious
- Team can verify calculations independently

---

#### Story 2.2: Meeting Notes with Action Items
**As** a team lead  
**I want** to track meeting action items with time estimates  
**So that** we know total commitment

**Scenario**:
```
Meeting notes (meeting-notes.md):

## Action Items
| Task | Owner | Hours | Days=Hours/8 |
|------|-------|-------|--------------|
| Implement API | Alex | 24 | 3 |
| Write tests | Maria | 16 | 2 |
| Documentation | Chen | 8 | 1 |
| **Total** | | **48=sum(Hours)** | **6=sum(Days)** |

Next meeting: Alex has 3 days of work ahead.
```

**Acceptance Criteria**:
- Formulas calculate automatically (in supporting editors)
- Plain text is still readable in Slack/Email
- Can copy-paste without losing formula info

---

### Category 3: Quick Calculations

#### Story 3.1: Shopping Price Comparison
**As** a consumer  
**I want** to compare product prices with tax  
**So that** I know the best deal

**Scenario**:
```
User creates note (price-comparison.md):

| Store | Price | Tax_rate | Total=Price*(1+Tax_rate) |
|-------|-------|----------|--------------------------|
| Amazon | 89.99 | 0.10 | 98.99 |
| BestBuy | 92.00 | 0.08 | 99.36 |
| Costco | 85.00 | 0.10 | 93.50 |

Winner: Costco at $93.50
```

**Acceptance Criteria**:
- Can create in any text editor
- Formulas make logic obvious
- Easy to add/remove rows
- Can verify by hand if needed

---

#### Story 3.2: Freelance Invoice
**As** a freelancer  
**I want** to generate invoices with calculations  
**So that** clients see the breakdown

**Scenario**:
```
invoice-2026-03.md:

# Invoice - March 2026

| Item | Hours | Rate | Subtotal=Hours*Rate |
|------|-------|------|---------------------|
| Development | 40 | 150 | 6000 |
| Consulting | 10 | 200 | 2000 |
| **Subtotal** | | | **8000=sum(Subtotal)** |
| **Tax (10%)** | | | **800=Subtotal*0.1** |
| **Total** | | | **8800=Subtotal+Tax** |

Payment due: April 15, 2026
```

**Acceptance Criteria**:
- Professional appearance (when rendered)
- Formulas show calculation logic
- Easy to update rates/hours
- Client can verify total

---

### Category 4: Data Analysis

#### Story 4.1: Survey Results Summary
**As** a researcher  
**I want** to summarize survey data  
**So that** stakeholders see key metrics

**Scenario**:
```
survey-results.md:

# Survey Results (n=250)

| Response | Count | Percentage=round(Count/250*100,1) |
|----------|-------|-----------------------------------|
| Very Satisfied | 120 | 48.0 |
| Satisfied | 80 | 32.0 |
| Neutral | 30 | 12.0 |
| Unsatisfied | 15 | 6.0 |
| Very Unsatisfied | 5 | 2.0 |
| **Total** | **250=sum(Count)** | **100.0=sum(Percentage)** |
```

**Acceptance Criteria**:
- Percentages update automatically
- Total validation catches data entry errors
- Can export to presentation (HTML/PDF)
- Formulas document calculation methodology

---

#### Story 4.2: A/B Test Results
**As** a product manager  
**I want** to compare test variants  
**So that** we make data-driven decisions

**Scenario**:
```
ab-test-results.md:

| Variant | Users | Conversions | CVR=round(Conversions/Users*100,2) |
|---------|-------|-------------|------------------------------------|
| Control (A) | 1000 | 45 | 4.50 |
| Test (B) | 1000 | 62 | 6.20 |
| **Lift** | | | **1.70=Test_CVR-Control_CVR** |

Conclusion: Variant B shows 1.7pp lift in conversion rate.
```

**Acceptance Criteria**:
- Calculations are reproducible
- Methodology is transparent
- Easy to update with new data
- Can share in Slack/Email/Docs

---

### Category 5: Learning & Education

#### Story 5.1: Teaching Spreadsheet Concepts
**As** an instructor  
**I want** to show students how formulas work  
**So that** they understand calculations, not just results

**Scenario**:
```
lesson-03-formulas.md:

# Lesson 3: Compound Interest

| Year | Balance | Interest=round(Balance*0.05,2) | New_Balance=Balance+Interest |
|------|---------|--------------------------------|------------------------------|
| 0 | 10000.00 | - | 10000.00 |
| 1 | 10000.00 | 500.00 | 10500.00 |
| 2 | 10500.00 | 525.00 | 11025.00 |
| 3 | 11025.00 | 551.25 | 11576.25 |

**Formula explanation**: Each year's balance grows by 5%.
```

**Acceptance Criteria**:
- Students see formulas alongside results
- Can modify rate and see impact
- No need for Excel license
- Works in online course platforms

---

## Edge Cases & Error Scenarios

### Error 1: Formula Doesn't Match Result
**Scenario**: AI generates incorrect result

```markdown
| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Bug  | 3   | 100   | 400             |  ← Should be 300
```

**Expected**:
- Validator shows: ❌ Row 1: Expected 300, got 400
- Highlights incorrect cell
- User can report to AI or fix manually

---

### Error 2: Circular Reference
**Scenario**: Formula references itself

```markdown
| A | B=A*2 | C=B+A | A=C-10 |  ← A references C, C references A
```

**Expected**:
- Parser detects circular dependency
- Error: "Circular reference detected: A → C → A"
- Refuses to evaluate

---

### Error 3: Missing Column
**Scenario**: Formula references non-existent column

```markdown
| Item | Qty | Total=Qty*Price |  ← Price column missing
```

**Expected**:
- Parser error: "Column 'Price' not found"
- Highlights problematic formula
- Suggests available columns

---

### Error 4: Type Mismatch
**Scenario**: Arithmetic on non-numeric data

```markdown
| Item | Status | Count=Status+1 |  ← Status is "Active", not a number
```

**Expected**:
- Runtime error: "Cannot add string to number"
- Shows row and column
- Suggests type conversion if applicable

---

## Success Metrics per Story

| Story | Success Metric | Target |
|-------|----------------|--------|
| AI Verification | % of AI tables verified before use | 70% |
| Git Documentation | % of docs with formulas committed | 40% |
| Quick Calculations | Time saved vs Excel | 5 min/table |
| Data Analysis | Reports using CalcMD | 30% |
| Education | Courses teaching CalcMD | 50+ |

---

## User Journey Map

### Journey 1: First-time User (via AI)
1. **Encounter**: Sees CalcMD table in ChatGPT response
2. **Curiosity**: "What's this `=Qty*Price` syntax?"
3. **Discovery**: Browser extension suggests verification
4. **Aha Moment**: "I can see AND verify the calculation!"
5. **Adoption**: Asks AI to always use CalcMD
6. **Advocacy**: Shares with colleagues

**Key Touchpoints**:
- Clear visual differentiation (formula in cell)
- One-click verification (browser extension)
- Helpful error messages
- Easy to share (just copy-paste)

---

### Journey 2: Developer Adopting CalcMD
1. **Problem**: Maintaining budget.md in Git, no formulas
2. **Search**: "markdown table with formulas"
3. **Find**: CalcMD specification
4. **Try**: Converts existing table, adds formulas
5. **Tool Up**: Installs VS Code extension
6. **Integrate**: Uses CLI in CI to validate tables
7. **Evangelize**: Writes blog post

**Key Touchpoints**:
- Good SEO (findable)
- Clear spec (understandable)
- Working examples (copy-pasteable)
- Tool ecosystem (usable)

---

## Anti-Stories (What We DON'T Support)

### Anti-Story 1: Complex Financial Modeling
**NOT SUPPORTED**: Multi-sheet models with NPV, IRR, scenario analysis

**Why**: Too complex. Use Excel/Sheets.

**What we say**: "CalcMD is for simple calculations. For financial modeling, we recommend Excel."

---

### Anti-Story 2: Real-time Collaborative Editing
**NOT SUPPORTED**: Google Sheets-style multi-cursor editing

**Why**: CalcMD is a format, not a collaboration platform.

**What we say**: "Use your preferred collaboration tool (Google Docs, Notion, etc.). CalcMD works in any markdown editor."

---

### Anti-Story 3: Data Visualization
**NOT SUPPORTED**: Charts, graphs, conditional formatting

**Why**: Scope creep. Many tools do this well.

**What we say**: "Export CalcMD to CSV, then use your favorite charting tool."

---

Last updated: 2026-03-13
