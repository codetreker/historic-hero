# HH-VIS-003: 全量数据分层展示 — 技术设计

日期：2026-04-29 | 作者：飞马

## 背景

建军明确要求：**521 人 / 1807 关系 / 220 事件一个不能少**。之前的方案一直在"减少显示数量"上打转（top 30→top 15），方向错了。正确方向是：**全量数据 + 分层展示**。

## 核心原则

1. 数据完整性是底线——全量在前端，一个不少
2. 通过交互层控制每屏信息密度
3. 用户层层探索，可以访问到每一个人和每一条关系

## 三层交互模型

```
第一层：阵营总览（6 个节点）
  ↓ 点击阵营
第二层：核心人物（~15 人，按重要性排序）
  ↓ 点击核心人物
第三层：展开 1-hop 全部邻居（不裁剪）
```

## 方案设计

### 视图状态

```typescript
type ViewMode = 'overview' | 'faction' | 'person-expand';

interface ViewState {
  mode: ViewMode;
  expandedFaction: Faction | null;
  expandedPersonId: string | null;  // 新增：第三层展开的核心人物
}
```

### 第一层：阵营总览（已实现）

保持现有 6 个阵营大节点 + 跨阵营连线。✅ 已有。

### 第二层：阵营核心人物

**排序修复**：不再用 degree（被同僚关系灌水），改用 **weighted importance score**：

```typescript
function getImportanceScore(person: Person, rels: Relationship[]): number {
  let score = 0;
  
  // 角色权重
  const roleWeights: Record<string, number> = {
    emperor: 100, warlord: 80, strategist: 60,
    minister: 40, general: 30, scholar: 20,
    consort: 15, other: 10, eunuch: 5,
  };
  person.roles.forEach(r => { score += roleWeights[r] || 10; });
  
  // 关系权重（排除同僚）
  const relWeights: Record<string, number> = {
    'lord-vassal': 5, 'father-son': 5, 'rivals': 4,
    'killed-by': 4, 'betrayal': 3, 'sworn-brothers': 3,
    'husband-wife': 3, 'master-student': 3, 'allies': 2,
    'brothers': 2, 'successor': 2, 'mother-son': 2,
    'in-law': 1, 'friends': 1, 'subordinate': 1,
    'colleagues': 0,  // 同僚不计分
  };
  
  const personRels = rels.filter(r => r.source === person.id || r.target === person.id);
  personRels.forEach(r => { score += relWeights[r.type] || 0; });
  
  // 事件参与加分
  // (可选，暂不实现)
  
  return score;
}
```

显示 top 15，但**全部人物数据都在**，通过第三层可以访问。

节点样式：
- 核心人物（importance top 5）：大节点 35px + 阵营色 + 粗标签
- 次要人物（6-15）：中节点 25px + 浅阵营色 + 普通标签
- 标签在节点下方

### 第三层：点击展开 1-hop 邻居

**点击核心人物** → 展开他的全部 1-hop 邻居（不裁剪，不限数量）：

```typescript
function expandPerson(personId: string): { nodes: NodeData[], edges: EdgeData[] } {
  const neighbors = new Set<string>();
  const expandEdges: Relationship[] = [];
  
  relationships.forEach(r => {
    if (r.source === personId) {
      neighbors.add(r.target);
      expandEdges.push(r);
    }
    if (r.target === personId) {
      neighbors.add(r.source);
      expandEdges.push(r);
    }
  });
  
  // 展开的邻居节点样式：小 + 半透明
  const expandedNodes = [...neighbors]
    .filter(id => !currentVisibleNodes.has(id))  // 排除已显示的
    .map(id => ({
      id,
      data: { ...personMap[id], isExpanded: true },
    }));
  
  return { nodes: expandedNodes, edges: expandEdges };
}
```

展开节点样式：
- 小圆 16px + 阵营色 50% 透明度
- 标签 9px + 灰色
- 区分"核心节点"和"展开节点"

**再次点击同一核心人物** → 收起展开的邻居。

**点击另一个核心人物** → 收起上一个的展开，展开新的。

### 搜索联动

搜索任意人物（521 人都能搜到）：
1. 自动跳到该人物所在阵营
2. 如果不在 top 15 → 临时加入图谱并高亮
3. 展开该人物的 1-hop 邻居
4. 打开详情面板

### 详情面板

**修复 node:click 回归**：恢复点击打开详情面板。

详情面板中显示该人物的**全部关系**（不是 top 15），可滚动。每条关系可点击跳转。

### G6 布局

阵营展开时（第二层 + 第三层）：
```typescript
layout: {
  type: 'd3-force',
  preventOverlap: true,
  nodeSize: 50,       // 比实际稍大，防重叠
  linkDistance: 400,
  nodeStrength: -300,
  simulation: {
    alphaDecay: 0.02,  // 快速稳定
  },
}
```

展开节点时不重建整个 graph，而是用 `graph.addData()` 增量添加。

## Task Breakdown

| ID | 子任务 | 估时 |
|----|--------|------|
| T1 | 修复 node:click 回归（P0）| 0.5h |
| T2 | importance score 排序替换 degree 排序 | 0.5h |
| T3 | 第三层展开/收起逻辑 | 1.5h |
| T4 | 展开节点样式（小+半透明+区分） | 0.5h |
| T5 | 搜索联动（非 top15 人物临时加入） | 1h |
| T6 | 详情面板全量关系显示 | 0.5h |
| T7 | 测试 + 验证 521 人全部可访问 | 0.5h |

关键路径：T1 → T2 → T3 → T4 → T5 → T7（约 5h）

## 验收标准

1. 默认 6 个阵营节点 ✅（已有）
2. 展开阵营显示 top 15 核心人物（按 importance，不被同僚灌水）
3. 曹魏 top 15 必须包含：曹操、曹丕、荀彧、郭嘉、司马懿
4. 点击核心人物 → 展开全部 1-hop 邻居（不裁剪）
5. 再点击 → 收起
6. 搜索 521 人任意一个都能找到并定位
7. 详情面板显示全部关系
8. 0 JS error
