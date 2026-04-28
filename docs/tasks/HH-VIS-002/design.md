# HH-VIS-002: 阵营聚合视图 — 技术设计补充

日期：2026-04-28 | 作者：飞马

## 背景

PR #1/#2 上线后，单阵营 141 节点全量渲染仍不可读（建军截图确认）。线框图的核心设计——阵营聚合→展开——必须在 v1 实现。

建军进一步提出：阵营是**多层嵌套**概念，大到魏/蜀/吴，小到家族/团体，本质都是聚合单位。

## 目标

1. 默认视图只有 6 个阵营节点，清晰可读
2. 点击阵营展开内部人物（top 20-30 按 degree）
3. 数据结构预留第三层（家族/小团体），v1 先做两层
4. "← 返回总览" 可收回到阵营视图

## 方案设计

### 两层视图切换（v1）

**视图状态机：**
```
OVERVIEW（默认） ←→ FACTION_DETAIL（展开某阵营）
```

**State 扩展：**
```typescript
interface AppState {
  // ... existing fields ...
  viewMode: 'overview' | 'faction-detail';
  expandedFaction: Faction | null;
}
```

**视图 A: Overview（阵营聚合）**

渲染 6 个大节点：
```typescript
const factionNodes = [
  { id: 'faction-wei', data: { name: '曹魏', count: 119, faction: 'wei' } },
  { id: 'faction-shu', data: { name: '蜀汉', count: 121, faction: 'shu' } },
  { id: 'faction-wu', data: { name: '东吴', count: 119, faction: 'wu' } },
  { id: 'faction-han', data: { name: '东汉', count: 62, faction: 'han' } },
  { id: 'faction-jin', data: { name: '西晋', count: 8, faction: 'jin' } },
  { id: 'faction-other', data: { name: '其他', count: 10, faction: 'other' } },
];
```

节点样式：
- 大小按人数比例（min 60, max 140）
- 阵营色填充
- 标签：阵营名 + 人数（如 "曹魏 119人"）

阵营间连线：
```typescript
// 预计算跨阵营关系数
const crossFactionEdges = computeCrossFactionRelations(relationships);
// 例如: { source: 'faction-wei', target: 'faction-shu', data: { count: 45, label: '45 条关系' } }
```
- 线宽按关系数（1-5px）
- hover 显示关系数

布局：固定位置或简单力导向（6 个节点不需要复杂布局）

**视图 B: Faction Detail（阵营展开）**

点击阵营节点 → 切换到该阵营内部视图：
- 只渲染该阵营的 top 30 人物（按 degree 排序）
- 保留跨阵营的核心对手/同盟关系（虚线连到阵营外标记）
- 右上角 "← 返回总览" 按钮
- 力导向布局，linkDistance 200

展开人物进一步分为核心/次要：
- 核心（degree ≥ 10）：大节点 + 阵营色 + 清晰标签
- 次要（degree < 10）：小节点 + 浅色 + 小标签

### GraphView 改造

```typescript
function GraphView() {
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    if (state.viewMode === 'overview') {
      renderOverview();
    } else {
      renderFactionDetail(state.expandedFaction);
    }
  }, [state.viewMode, state.expandedFaction]);
  
  function renderOverview() {
    // 6 个阵营节点 + 跨阵营连线
    // node:click → dispatch SET_VIEW_MODE faction-detail
  }
  
  function renderFactionDetail(faction: Faction) {
    // top 30 人物 + 内部关系
    // 保留现有的 hover 高亮、边标签隐藏等
  }
}
```

### 数据预处理（build time）

```typescript
// 预计算阵营统计
export const factionStats: Record<Faction, { count: number; topPersons: string[] }>;

// 预计算跨阵营关系
export const crossFactionRels: { source: Faction; target: Faction; count: number }[];
```

### 第三层预留（v2）

数据结构预留 `group` 字段：
```typescript
interface Person {
  // ... existing fields ...
  group?: string;  // v2: "曹氏家族" | "五子良将" | "谋士团" | ...
}
```

v2 实现时，阵营展开后显示子团体节点，再点击展开具体人物。

## Task Breakdown

| ID | 子任务 | 估时 |
|----|--------|------|
| T1 | AppState 扩展（viewMode + expandedFaction） | 0.5h |
| T2 | 预计算阵营统计 + 跨阵营关系 | 0.5h |
| T3 | Overview 渲染（6 个阵营节点 + 连线） | 1.5h |
| T4 | Faction Detail 渲染（top 30 + 核心/次要区分） | 1h |
| T5 | 视图切换动画 + 返回按钮 | 0.5h |
| T6 | 搜索联动（搜索人物时自动进入对应阵营） | 0.5h |
| T7 | 测试 + 线框图对照验证 | 0.5h |

关键路径：T1 → T2 → T3 → T4 → T5 → T7（约 5h）

## 验收标准

1. 默认打开只看到 6 个阵营节点
2. 点击阵营展开内部人物（≤30 个），可读清晰
3. "返回总览" 回到阵营视图
4. 搜索人物时自动跳转到对应阵营
5. 0 JS error
6. 对照线框图状态 A/B 逐条验证
