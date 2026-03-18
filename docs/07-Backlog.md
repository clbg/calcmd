# CalcMD Backlog

> 按优先级排列的功能需求、规范改进和已知问题。
> 从 04-Spec.md Section 10 迁移 + 新增需求。

---

## Priority Levels

- **P0**: Blocks core use cases, must fix before v0.2
- **P1**: Important for v1.0, high user impact
- **P2**: Nice to have, improves ecosystem/tooling
- **P3**: Low priority, future consideration

---

## Category 1: New Functions

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-01 | `sum_if(cond, col)` | P0 | 条件聚合。如 `sum_if(Payer=="Charlie", Amount)`。05-Examples Example 2 已使用但未定义。费用分摊核心场景依赖此功能。 |
| F-02 | `total(col)` | P0 | 全行聚合（含当前行）。`sum(col)` 在 column-header formula 中排除当前行，导致百分比 `Count/sum(Count)*100` 错误。 |
| F-03 | `count_if(cond, col)` | P1 | 条件计数，`sum_if` 的自然伴侣。 |
| F-04 | `floor(n)` | P1 | 向下取整。已在 spec §3.3 定义但 POC 未实现。 |
| F-05 | `ceil(n)` | P1 | 向上取整。已在 spec §3.3 定义但 POC 未实现。 |
| F-06 | `min(a, b, ...)` 多参数 | P1 | 行级 min。如 `min(Price, 100)` 做值封顶。当前只支持列聚合。 |
| F-07 | `max(a, b, ...)` 多参数 | P1 | 行级 max，同 F-06。 |
| F-08 | `round(n)` 单参数 | P1 | 省略第二参数默认 round 到整数。当前要求 2 参数。 |
| F-09 | `avg_if(cond, col)` | P2 | 条件平均值，完善条件聚合函数集。 |
| F-10 | `concat(a, b, ...)` | P2 | 显式字符串拼接函数。 |

---

## Category 2: Spec / Implementation Inconsistencies

| ID | Area | Priority | Issue | Resolution |
|----|------|----------|-------|------------|
| S-01 | `+` operator (§3.2) | P0 | Spec: `Number + String → ERROR`。POC: 隐式转 string 拼接。 | 遵循 spec，修复 POC。 |
| S-02 | Comparison operators (§3.2) | P0 | Spec: 同类型操作数。POC: JS 原生比较无类型检查。 | 遵循 spec，混合类型 → ERROR。 |
| S-03 | Operator precedence (§3.2) | P1 | 原 spec `not` 优先级错误，v0.1.1 已修正。 | 验证 POC parser 一致。 |
| S-04 | Cell vs column formula 优先级 (§2.3C) | P0 | Spec v0.1.2: cell formula 覆盖 column formula。POC: column formula 优先，cell formula 被忽略。 | 反转优先级：先检查 cell formula，没有才 fallback 到 column formula。 |
| S-05 | Dependency graph 缺失 (§5.1) | P0 | Spec v0.1.2: 要求 cell 粒度 DAG + 拓扑排序。POC: 按行顺序求值，`DependencyGraph` 类型已定义但未使用。 | 实现 expansion phase + cell-level DAG + 拓扑排序求值。 |
| S-06 | 循环引用检测 (§5.3) | P0 | Spec v0.1.2: 要求检测环并报告环路径。POC: 无循环检测，静默产生错误结果。 | DAG 构建时检测环，报错含路径。 |
| S-07 | Label 语法不匹配 (§3.5) | P1 | Spec v0.1.3: `@label: value` 语法，任意列。POC: 只检查第一列 `@label`，无冒号分隔，label 替代 cell 值。 | 重写 parser label 检测逻辑，支持任意列 + 冒号分隔。 |
| S-08 | Column alias 未实现 (§2.5) | P1 | Spec v0.1.4: `#alias` 语法在 header 声明列别名。POC: 不支持。 | parser 解析 header 时检测 `#alias` 后缀，建立 alias → column 映射，formula parser / evaluator 解析列引用时查 alias。 |

---

## Category 3: Underspecified Areas

| ID | Area | Priority | Issue | Proposed Resolution |
|----|------|----------|-------|---------------------|
| U-01 | Row labels (§3.5) | ~~P1~~ Done | 声明语法未定义。 | v0.1.3: 定义 `@label: value` 语法，任意列可声明，冒号+空格分隔。 |
| U-02 | Bare `@label` reference | ~~P1~~ Done | 裸 `@label` fallback 行为任意。 | v0.1.3: 标记为 implementation-defined，推荐始终使用 `@label.Column`。 |
| U-03 | Number precision (§4.4) | P1 | 无最低精度要求。 | 要求 IEEE 754 double。 |
| U-04 | Display formatting (§4.4) | P1 | 计算值显示格式无规则。 | 定义默认：无尾零，最多 10 位小数。 |
| U-05 | Escaping `=` (§2.7) | P1 | 规则非正式，边界不清。 | 定义正式语法规则。 |
| U-06 | Markdown formatting (§2.6) | P2 | bold/italic 与公式解析交互隐式。 | 需语法级定义。 |
| U-07 | Aggregation scope | P1 | `sum(col)` 排除当前行，对百分比意外。 | 显式文档化 + `total(col)` (F-02)。 |
| U-08 | Table boundary detection | P2 | 多表文档中表边界检测。 | 标准 markdown 解析规则，显式声明。 |

---

## Category 4: Workflow & Behavior

| ID | Area | Priority | Description | Decision |
|----|------|----------|-------------|----------|
| W-01 | Display value 不一致处理 | P0 | 用户修改数据后 display value 与 formula 结果不一致。 | 工具应：(1) 自动更新 display value；(2) 进入不一致提示状态，让用户选择 "remove display value" 或 "accept update"。Formula 是 source of truth，display value 是缓存。 |
| W-02 | Copy/paste 行为 | P1 | 复制 CalcMD 表格到其他环境时的行为。 | 复制时不做任何中间修改，原样复制纯文本。Display value 在无工具环境中作为 fallback 渲染。复制不触发 recompute。 |
| W-03 | Freeform table | P1 | 不定义 "summary row" 语义。 | 表格是自由形式的，和 Excel 一样。聚合 "排除当前行" 规则适用于所有行，不区分 data/summary row。 |

---

## Category 5: Tooling & Ecosystem

| ID | Area | Priority | Description |
|----|------|----------|-------------|
| T-01 | Validation output 格式 | P2 | 定义机器可读 validation output（JSON），含 pass/fail 总结和每 cell 验证结果。 |
| T-02 | Conformance test suite | P1 | Spec §8.2 引用 `tests/spec-tests.yaml` 但不存在。需创建。 |
| T-03 | Formal grammar (BNF/EBNF) | P2 | 公式语言无正式语法定义。 |
| T-04 | Error codes | P2 | 无正式错误码体系。 |

---

## Category 6: Future Features (P3)

| ID | Feature | Description |
|----|---------|-------------|
| FF-01 | Running totals | 累计求和。需新语法如 `running_sum(col)` 或行范围引用。 |
| FF-02 | Row-to-row references | 行间引用（上一行的值）。复利、折旧、贷款场景需要。 |
| FF-03 | String functions | `len()`, `lower()`, `upper()`, `left()`, `right()`。 |
| FF-04 | Date/time support | 日期算术。按 non-goals 有意排除。 |
| FF-05 | Currency/number formatting | 显示格式如 `$1,234.56`。 |
| FF-06 | Nested aggregation expressions | `sum(if(...))` 模式。`sum_if` 是部分解法。 |
| FF-07 | Label 引用列位置引用 | 考虑 `@label[N]`（1-indexed 列号）作为列名引用的 escape hatch。优先级低于列别名（已在 §2.5 定义）。 |

---

## Summary by Priority

| Priority | Count | IDs |
|----------|-------|-----|
| P0 | 8 | F-01, F-02, S-01, S-02, S-04, S-05, S-06, W-01 |
| P1 | 16 | F-03, F-04, F-05, F-06, F-07, F-08, S-03, S-07, S-08, U-03, U-04, U-05, U-07, W-02, W-03, T-02 |
| P2 | 7 | F-09, F-10, U-06, U-08, T-01, T-03, T-04 |
| P3 | 7 | FF-01, FF-02, FF-03, FF-04, FF-05, FF-06, FF-07 |

---

Last updated: 2026-03-18
