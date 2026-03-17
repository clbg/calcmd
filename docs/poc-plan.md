# CalcMD POC Plan

## MVP 函数支持（基于使用频率）

### Tier 1: 核心必备（前 80% 使用场景）
1. **四则运算**: `+`, `-`, `*`, `/`, `%`, `()`
2. **聚合函数**:
   - `SUM(col)` - 最常用
   - `AVG(col)` / `AVERAGE(col)`
   - `COUNT(col)`
   - `MIN(col)`
   - `MAX(col)`
3. **数学函数**:
   - `ROUND(n, decimals)`
   - `ABS(n)`
4. **逻辑**:
   - `IF(condition, true_val, false_val)`
   - 比较: `==`, `!=`, `>`, `<`, `>=`, `<=`
   - `AND`, `OR`, `NOT`

### Tier 2: 有用但非必需（留给 v0.2）
- `FLOOR(n)`, `CEIL(n)`
- `COUNTIF(col, condition)`
- `SUMIF(col, condition, sum_col)`
- `CONCATENATE()` / 字符串操作

### Tier 3: 复杂功能（可能永远不支持）
- `VLOOKUP`, `XLOOKUP`
- `PIVOT` 相关
- 日期函数（`DATE`, `NOW`, `DATEDIF`）
- 财务函数（`NPV`, `IRR`）

## POC 架构

```
calcmd-poc/
├── packages/
│   ├── core/              # TypeScript 核心库
│   │   ├── src/
│   │   │   ├── parser.ts      # Markdown → AST
│   │   │   ├── validator.ts   # 类型检查 + 依赖分析
│   │   │   ├── evaluator.ts   # 公式求值
│   │   │   ├── types.ts       # 类型定义
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   └── playground/        # React playground
│       ├── src/
│       │   ├── App.tsx
│       │   ├── Editor.tsx     # 左侧编辑器
│       │   ├── Preview.tsx    # 右侧预览（带高亮）
│       │   └── examples.ts    # 示例库
│       └── package.json
└── package.json           # 根目录
```

## 核心功能

### 1. 解析器 (parser.ts)
输入: CalcMD markdown 字符串
输出: Table AST
```typescript
interface Table {
  columns: Column[];
  rows: Row[];
  labels: Map<string, number>; // @label → row index
}
```

### 2. 求值器 (evaluator.ts)
- 拓扑排序（处理依赖）
- 公式求值
- 错误处理

### 3. React Playground
- **左侧**: Monaco Editor（实时编辑）
- **右侧**: 渲染表格
  - 点击单元格 → 高亮关联单元格（依赖图）
  - 错误单元格红色标记
  - 公式单元格浅蓝色背景
- **底部**: 错误/警告列表

## 实现顺序

### Phase 1: 核心引擎（今晚）
1. ✅ 项目结构搭建
2. Parser: 解析基础表格
3. Evaluator: 四则运算
4. Evaluator: 列引用
5. Evaluator: SUM/AVG

### Phase 2: 行标签（明天）
6. Parser: 识别 `@label`
7. Evaluator: `@label` 引用
8. Validator: 循环依赖检测

### Phase 3: React Playground（明天）
9. 基础布局（左右分栏）
10. Monaco Editor 集成
11. 实时渲染
12. 单元格高亮

### Phase 4: 完善（后天）
13. 更多函数（IF, ROUND, etc.）
14. 错误提示优化
15. 示例库

## 开始！
