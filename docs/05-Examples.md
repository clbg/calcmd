# Examples: CalcMD

> Comprehensive examples showing CalcMD in real-world scenarios

---

## Basic Examples

### Example 1: Shopping List
```markdown
| Item | Quantity | Price | Subtotal=Quantity*Price |
|------|----------|-------|-------------------------|
| Apples | 6 | 0.5 | 3.00 |
| Bread | 2 | 2.5 | 5.00 |
| Milk | 1 | 3.2 | 3.20 |
| **Total** | | | **11.20=sum(Subtotal)** |
```

**Use case**: Quick price calculation while shopping

---

### Example 2: Travel Expense Split
```markdown
| Date | Item | Amount | Payer | Charlie_owes | ZZL_owes |
|------|------|--------|-------|--------------|----------|
| 2026-02-14 | Ramen | 3000 | Charlie | =if(Payer=="Charlie",0,Amount/2) | =if(Payer=="ZZL",0,Amount/2) |
| 2026-02-14 | Tickets | 400 | Charlie | 0 | 200 |
| 2026-02-14 | Train | 2680 | ZZL | 1340 | 0 |
| 2026-02-15 | Dinner | 6260 | ZZL | 3130 | 0 |
| **Charlie paid** | | **3400=sum_if(Payer=="Charlie",Amount)** | | | |
| **ZZL paid** | | **8940=sum_if(Payer=="ZZL",Amount)** | | | |
| **Charlie owes** | | | | **4470=sum(Charlie_owes)** | |
| **ZZL owes** | | | | | **200=sum(ZZL_owes)** |
| **Settlement** | | **4270=ZZL_owes-Charlie_owes** | | | |
```

**Interpretation**: ZZL should pay Charlie 4270 JPY

---

## Business Examples

### Example 3: Sales Report
```markdown
| Region | Q1 | Q2 | Q3 | Q4 | Total=Q1+Q2+Q3+Q4 | Growth=round((Q4-Q1)/Q1*100,1) |
|--------|-------|-------|-------|-------|-------------------|-------------------------------|
| North | 10000 | 12000 | 11000 | 15000 | 48000 | 50.0 |
| South | 8000 | 8500 | 9000 | 9500 | 35000 | 18.8 |
| East | 15000 | 16000 | 14000 | 18000 | 63000 | 20.0 |
| West | 7000 | 7500 | 8000 | 8200 | 30700 | 17.1 |
| **Total** | **40000=sum(Q1)** | **44000=sum(Q2)** | **42000=sum(Q3)** | **50700=sum(Q4)** | **176700=sum(Total)** | |
```

**Use case**: Quarterly sales review with growth rates

---

### Example 4: Budget vs Actual
```markdown
| Category | Budget | Actual | Variance=Actual-Budget | Variance%=round(Variance/Budget*100,1) |
|----------|--------|--------|------------------------|----------------------------------------|
| Marketing | 50000 | 48500 | -1500 | -3.0 |
| Engineering | 200000 | 215000 | 15000 | 7.5 |
| Sales | 80000 | 79000 | -1000 | -1.3 |
| Operations | 40000 | 42000 | 2000 | 5.0 |
| **Total** | **370000=sum(Budget)** | **384500=sum(Actual)** | **14500=sum(Variance)** | **3.9=round(sum(Variance)/sum(Budget)*100,1)** |
```

**Use case**: Financial planning and variance analysis

---

### Example 5: Invoice
```markdown
# Invoice #2026-001

**Bill To**: Acme Corp  
**Date**: 2026-03-13  
**Due**: 2026-04-13

| Description | Hours | Rate | Amount=Hours*Rate |
|-------------|-------|------|-------------------|
| Web Development | 40 | 150 | 6000 |
| API Integration | 20 | 175 | 3500 |
| Code Review | 8 | 125 | 1000 |
| **Subtotal** | **68=sum(Hours)** | | **10500=sum(Amount)** |
| **Tax (10%)** | | | **1050=Subtotal*0.1** |
| **Total Due** | | | **11550=Subtotal+Tax** |

**Payment Terms**: Net 30 days  
**Thank you for your business!**
```

**Use case**: Freelance invoicing with automatic calculations

---

## Data Analysis Examples

### Example 6: Survey Results
```markdown
| Response | Count | Percentage=round(Count/sum(Count)*100,1) |
|----------|-------|------------------------------------------|
| Very Satisfied | 120 | 48.0 |
| Satisfied | 80 | 32.0 |
| Neutral | 30 | 12.0 |
| Dissatisfied | 15 | 6.0 |
| Very Dissatisfied | 5 | 2.0 |
| **Total Responses** | **250=sum(Count)** | **100.0=sum(Percentage)** |
```

**Use case**: Survey analysis with percentage breakdowns

---

### Example 7: A/B Test Results
```markdown
| Metric | Control (A) | Variant (B) | Lift=round((Variant_B-Control_A)/Control_A*100,2) |
|--------|-------------|-------------|----------------------------------------------------|
| Users | 10000 | 10000 | 0.00 |
| Conversions | 450 | 523 | 16.22 |
| CVR (%) | =round(Conversions_A/Users_A*100,2) | =round(Conversions_B/Users_B*100,2) | |
| Revenue | 45000 | 52300 | 16.22 |
| ARPU | =round(Revenue_A/Users_A,2) | =round(Revenue_B/Users_B,2) | |
```

**Notes**: 
- Column references with suffixes: `Conversions_A` refers to "Conversions" in "Control (A)"
- This example shows advanced column naming (implementation detail)

**Use case**: A/B testing analysis

---

### Example 8: Cohort Retention
```markdown
| Cohort | Week 0 | Week 1 | Week 2 | Week 3 | Retention_W3=round(Week_3/Week_0*100,1) |
|--------|--------|--------|--------|--------|-----------------------------------------|
| 2026-01 | 1000 | 750 | 600 | 520 | 52.0 |
| 2026-02 | 1200 | 900 | 720 | 650 | 54.2 |
| 2026-03 | 1100 | 880 | 700 | 630 | 57.3 |
| **Average** | | | | | **54.5=round(avg(Retention_W3),1)** |
```

**Use case**: Product retention analysis

---

## Educational Examples

### Example 9: Grade Calculation
```markdown
| Student | Midterm | Final | Homework | Total=Midterm*0.3+Final*0.4+Homework*0.3 | Grade=if(Total>=90,"A",if(Total>=80,"B",if(Total>=70,"C",if(Total>=60,"D","F")))) |
|---------|---------|-------|----------|------------------------------------------|-------------------------------------------------------------------------------------|
| Alice | 85 | 92 | 88 | 88.7 | B |
| Bob | 78 | 85 | 90 | 84.4 | B |
| Charlie | 92 | 95 | 85 | 91.1 | A |
| Diana | 65 | 70 | 75 | 70.0 | C |
| **Class Average** | **80.0=avg(Midterm)** | **85.5=avg(Final)** | **84.5=avg(Homework)** | **83.6=avg(Total)** | |
```

**Use case**: Academic grade calculation with weighted components

---

### Example 10: Compound Interest
```markdown
| Year | Principal | Interest_Rate | Interest=round(Principal*Interest_Rate,2) | Balance=Principal+Interest |
|------|-----------|---------------|-------------------------------------------|----------------------------|
| 0 | 10000.00 | 0.05 | - | 10000.00 |
| 1 | 10000.00 | 0.05 | 500.00 | 10500.00 |
| 2 | 10500.00 | 0.05 | 525.00 | 11025.00 |
| 3 | 11025.00 | 0.05 | 551.25 | 11576.25 |
| 4 | 11576.25 | 0.05 | 578.81 | 12155.06 |
| 5 | 12155.06 | 0.05 | 607.75 | 12762.81 |
```

**Note**: This demonstrates progressive calculation where each year's balance becomes next year's principal.

**Use case**: Teaching financial concepts

---

## Project Management Examples

### Example 11: Sprint Planning
```markdown
| Task | Assignee | Story_Points | Hours=Story_Points*6 | Days=round(Hours/8,1) |
|------|----------|--------------|----------------------|-----------------------|
| User Auth API | Alice | 5 | 30 | 3.8 |
| Frontend Components | Bob | 8 | 48 | 6.0 |
| Database Schema | Charlie | 3 | 18 | 2.3 |
| Integration Tests | Diana | 5 | 30 | 3.8 |
| **Sprint Total** | | **21=sum(Story_Points)** | **126=sum(Hours)** | **15.8=sum(Days)** |
```

**Use case**: Sprint capacity planning

---

### Example 12: Risk Assessment
```markdown
| Risk | Probability | Impact | Score=Probability*Impact | Priority=if(Score>=15,"High",if(Score>=8,"Medium","Low")) |
|------|-------------|--------|--------------------------|-----------------------------------------------------------|
| API Downtime | 3 | 5 | 15 | High |
| Data Loss | 2 | 5 | 10 | Medium |
| UI Bug | 4 | 2 | 8 | Medium |
| Slow Performance | 3 | 3 | 9 | Medium |
| Security Breach | 1 | 5 | 5 | Low |
```

**Scale**: Probability & Impact (1-5)

**Use case**: Project risk management

---

## Personal Finance Examples

### Example 13: Monthly Budget
```markdown
| Category | Budgeted | Actual | Remaining=Budgeted-Actual | Status=if(Remaining>=0,"✅","⚠️") |
|----------|----------|--------|---------------------------|----------------------------------|
| Rent | 2000 | 2000 | 0 | ✅ |
| Groceries | 600 | 548 | 52 | ✅ |
| Transportation | 200 | 215 | -15 | ⚠️ |
| Entertainment | 300 | 320 | -20 | ⚠️ |
| Utilities | 150 | 142 | 8 | ✅ |
| **Total** | **3250=sum(Budgeted)** | **3225=sum(Actual)** | **25=sum(Remaining)** | |
```

**Use case**: Personal budgeting and expense tracking

---

### Example 14: Savings Goal Tracker
```markdown
| Month | Deposit | Total_Saved=sum(Deposit) | Goal | Progress%=round(Total_Saved/Goal*100,1) | Remaining=Goal-Total_Saved |
|-------|---------|--------------------------|------|-----------------------------------------|----------------------------|
| Jan | 500 | 500 | 6000 | 8.3 | 5500 |
| Feb | 600 | 1100 | 6000 | 18.3 | 4900 |
| Mar | 550 | 1650 | 6000 | 27.5 | 4350 |
| Apr | 500 | 2150 | 6000 | 35.8 | 3850 |
| May | 700 | 2850 | 6000 | 47.5 | 3150 |
| Jun | 600 | 3450 | 6000 | 57.5 | 2550 |
```

**Use case**: Tracking progress toward savings goal

---

## Health & Fitness Examples

### Example 15: Workout Log
```markdown
| Exercise | Sets | Reps | Weight_kg | Volume=Sets*Reps*Weight_kg |
|----------|------|------|-----------|----------------------------|
| Squat | 4 | 8 | 100 | 3200 |
| Bench Press | 3 | 10 | 80 | 2400 |
| Deadlift | 3 | 5 | 120 | 1800 |
| **Total Volume** | | | | **7400=sum(Volume)** |
```

**Use case**: Strength training volume tracking

---

### Example 16: Calorie Tracker
```markdown
| Meal | Food | Calories | Protein_g | Carbs_g | Fat_g |
|------|------|----------|-----------|---------|-------|
| Breakfast | Oatmeal | 300 | 10 | 54 | 6 |
| Breakfast | Banana | 105 | 1 | 27 | 0 |
| Lunch | Chicken Salad | 450 | 35 | 20 | 25 |
| Snack | Protein Bar | 200 | 20 | 25 | 7 |
| Dinner | Salmon & Rice | 550 | 40 | 60 | 15 |
| **Daily Total** | | **1605=sum(Calories)** | **106=sum(Protein_g)** | **186=sum(Carbs_g)** | **53=sum(Fat_g)** |
| **Goal** | | 2000 | 150 | 200 | 65 |
| **Remaining** | | **395=Goal_Calories-Daily_Total_Calories** | **44** | **14** | **12** |
```

**Use case**: Daily nutrition tracking

---

## Advanced Examples

### Example 17: Depreciation Schedule
```markdown
| Year | Asset_Value | Depreciation_Rate | Depreciation=round(Asset_Value*Depreciation_Rate,2) | Book_Value=Asset_Value-Depreciation |
|------|-------------|-------------------|-----------------------------------------------------|--------------------------------------|
| 0 | 50000 | 0.20 | - | 50000.00 |
| 1 | 50000 | 0.20 | 10000.00 | 40000.00 |
| 2 | 40000 | 0.20 | 8000.00 | 32000.00 |
| 3 | 32000 | 0.20 | 6400.00 | 25600.00 |
| 4 | 25600 | 0.20 | 5120.00 | 20480.00 |
| 5 | 20480 | 0.20 | 4096.00 | 16384.00 |
```

**Use case**: Asset depreciation tracking

---

### Example 18: Loan Amortization (Simplified)
```markdown
| Month | Balance | Interest_Rate | Interest=round(Balance*Interest_Rate/12,2) | Payment | Principal=Payment-Interest | New_Balance=Balance-Principal |
|-------|---------|---------------|-------------------------------------------|---------|----------------------------|-------------------------------|
| 0 | 10000 | 0.05 | - | - | - | 10000.00 |
| 1 | 10000 | 0.05 | 41.67 | 500 | 458.33 | 9541.67 |
| 2 | 9541.67 | 0.05 | 39.76 | 500 | 460.24 | 9081.43 |
| 3 | 9081.43 | 0.05 | 37.84 | 500 | 462.16 | 8619.27 |
```

**Use case**: Understanding loan payments

---

## Edge Cases & Error Demonstrations

### Example 19: Error Handling
```markdown
| Item | Value | Calculation | Status |
|------|-------|-------------|--------|
| Valid | 10 | 20=Value*2 | ✅ Valid |
| Wrong | 10 | 25=Value*2 | ⚠️ Expected 20, got 25 |
| Missing | 10 | =Value*Price | ❌ Error: Column 'Price' not found |
| Type Error | "text" | =Value*2 | ❌ Error: Cannot multiply string by number |
```

**Use case**: Demonstrating validation and error detection

---

### Example 20: Null Handling
```markdown
| Product | Units | Price | Total=Units*Price |
|---------|-------|-------|-------------------|
| A | 5 | 10 | 50 |
| B | | 15 | - |
| C | 3 | | - |
| D | 4 | 20 | 80 |
| **Sum** | **12=sum(Units)** | | **130=sum(Total)** |
```

**Note**: Empty cells are treated as null; `sum()` ignores them.

---

## Integration Examples

### Example 21: CI/CD Pipeline Metrics
```markdown
| Stage | Duration_min | Tests | Failures | Success_Rate=round((Tests-Failures)/Tests*100,1) |
|-------|--------------|-------|----------|--------------------------------------------------|
| Build | 5 | 0 | 0 | - |
| Unit Tests | 15 | 250 | 2 | 99.2 |
| Integration | 30 | 80 | 1 | 98.8 |
| E2E Tests | 45 | 50 | 0 | 100.0 |
| **Total** | **95=sum(Duration_min)** | **380=sum(Tests)** | **3=sum(Failures)** | **99.2=round((sum(Tests)-sum(Failures))/sum(Tests)*100,1)** |
```

**Use case**: CI/CD monitoring dashboard

---

### Example 22: API Performance
```markdown
| Endpoint | Requests | Avg_ms | P95_ms | P99_ms | Error_Rate%=round(Errors/Requests*100,2) | Errors |
|----------|----------|--------|--------|--------|------------------------------------------|--------|
| /api/users | 10000 | 45 | 120 | 200 | 0.05 | 5 |
| /api/products | 25000 | 30 | 80 | 150 | 0.02 | 5 |
| /api/orders | 8000 | 60 | 180 | 300 | 0.12 | 10 |
| **Total** | **43000=sum(Requests)** | | | | **0.05=round(sum(Errors)/sum(Requests)*100,2)** | **20=sum(Errors)** |
```

**Use case**: API monitoring and SLA tracking

---

## Tips for Writing CalcMD Tables

### 1. Start Simple
Begin with raw data, add formulas incrementally.

### 2. Name Columns Clearly
Use descriptive names: `Unit_Price` better than `UP` or `Price1`

### 3. Show Your Work
Include intermediate calculations:
```markdown
| Revenue | Cost | Profit=Revenue-Cost | Margin%=round(Profit/Revenue*100,1) |
```

### 4. Use Formatting for Readability
- **Bold** totals and aggregations
- Align numbers consistently
- Group related columns

### 5. Add Context
Include notes, goals, or targets:
```markdown
| Metric | Actual | Goal | Status=if(Actual>=Goal,"✅","⚠️") |
```

### 6. Validate as You Go
Run validation frequently to catch errors early.

---

Last updated: 2026-03-13
