// Example CalcMD tables

export const EXAMPLES = [
  {
    name: 'Shopping List',
    markdown: `| Item | Qty | Price | Total=Qty*Price |
|------|-----|-------|-----------------|
| Apple | 3 | 1.5 | 4.5 |
| Banana | 5 | 0.8 | 4.0 |
| Orange | 2 | 2.0 | 4.0 |
| **Total** | | | **=sum(Total)** |`
  },
  {
    name: 'Travel Expense Split',
    markdown: `| Item | Amount | Payer | Charlie_owes | Jason_owes |
|------|--------|-------|---------|----------|
| Ramen | 3000 | Charlie | 0 | =Amount/2 |
| Tickets | 400 | Charlie | 0 | =Amount/2 |
| Train | 2680 | Jason | =Amount/2 | 0 |
| Dinner | 6260 | Jason | =Amount/2 | 0 |
| **Charlie Total** | | | **=sum(Charlie_owes)** | |
| **Jason Total** | | | | **=sum(Jason_owes)** |`
  },
  {
    name: 'Sales Report',
    markdown: `| Region | Q1 | Q2 | Q3 | Q4 | Total=Q1+Q2+Q3+Q4 |
|--------|-------|-------|-------|-------|-------------------|
| North | 10000 | 12000 | 11000 | 15000 | 48000 |
| South | 8000 | 8500 | 9000 | 9500 | 35000 |
| East | 15000 | 16000 | 14000 | 18000 | 63000 |
| West | 7000 | 7500 | 8000 | 8200 | 30700 |
| **Total** | **=sum(Q1)** | **=sum(Q2)** | **=sum(Q3)** | **=sum(Q4)** | **=sum(Total)** |`
  },
  {
    name: 'Label Reference',
    markdown: `| Description | Amount |
|-------------|--------|
| Item A | 100 |
| Item B | 200 |
| @subtotal | **=sum(Amount)** |
| Tax_Rate | 0.1 |
| Tax | =@subtotal*Tax_Rate |
| @total | =@subtotal+Tax |`
  },
  {
    name: 'Grade Calculation',
    markdown: `| Student | Midterm | Final | Total=Midterm*0.4+Final*0.6 | Grade=if(Total>=90,"A",if(Total>=80,"B","C")) |
|---------|---------|-------|-----------------------------|--------------------------------------------|
| Alice | 85 | 92 | 89.2 | B |
| Bob | 95 | 88 | 90.8 | A |
| Charlie | 78 | 85 | 82.2 | B |
| **Average** | **=avg(Midterm)** | **=avg(Final)** | **=avg(Total)** | |`
  }
];
