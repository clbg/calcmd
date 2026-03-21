| Expense            | Alice | Bob  | Each=round((Alice+Bob)/2,0) | Settlement                           |
|--------------------|-------|------|-----------------------------|--------------------------------------|
| Ramen              | 3000  | 0    | 1500                        |                                      |
| Museum tickets     | 0     | 800  | 400                         |                                      |
| Train              | 2680  | 0    | 1340                        |                                      |
| Dinner             | 0     | 6260 | 3130                        |                                      |
| Taxi               | 1200  | 0    | 600                         |                                      |
| **Total**          | @ap: =sum(Alice) | @bp: =sum(Bob) | **=sum(Each)** |               |
| **Alice owes Bob** |       |      |               =0           | =if(@bp>@ap,round((@bp-@ap)/2,0),0) |
| **Bob owes Alice** |       |      |               =0           | =if(@ap>@bp,round((@ap-@bp)/2,0),0) |
