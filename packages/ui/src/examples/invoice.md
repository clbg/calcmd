| Item       | Price | Quantity | Subtotal=Price*Quantity | Summary                       |
|------------|-------|----------|-------------------------|-------------------------------|
| Laptop     | 999   | 2        |                         |                               |
| Mouse      | 25    | 5        |                         |                               |
| Cable      | 12    | 10       |                         |                               |
| **Subtotal** |     |          |                         | **@sub: =sum(Subtotal)**      |
| **Tax (10%)** |    |          |                         | **@tax: =round(@sub*0.1,2)**  |
| **Total**  |       |          |                         | **=@sub+@tax**                |
