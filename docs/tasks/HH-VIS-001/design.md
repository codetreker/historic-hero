# HH-VIS-001: 三国人物关系图谱可视化 — 技术设计

日期：2026-04-28 | 状态：Draft | 作者：飞马

---

## 背景与问题

当前版本存在 3 个严重问题（建军实测反馈）：

1. **性能卡死（P0）**：一次性渲染 439 节点 + 433 边 + 实时力导向计算，浏览器直接卡死
2. **数据稀疏（P0）**：433 条关系 / 439 人 ≈ 0.99 条/人，图谱极度稀疏，没有看头
3. **搜索差（P1）**：只有占位组件，无模糊匹配、拼音搜索、自动补全、定位高亮

## 目标

| # | 需求 | 验收标准 |
|---|------|---------|
| 1 | 关系图谱主视图 | 阵营分色 + 节点度数 sizing + 交互流畅 |
| 2 | 分层浏览 | v1 用过滤代替（默认单阵营），v2 再做阵营聚合 |
| 3 | 搜索 | 拼音 + 模糊匹配 + AutoComplete + 定位高亮 + 展开关联 |
| 4 | 过滤 | 阵营/身份/关系类型多选组合，实时更新 |
| 5 | 人物详情 | 基本信息 + 关系列表（可跳转）+ 事件列表 + 来源链接 |
| 6 | 事件详情 | 事件信息 + 参与人物（可跳转）+ 来源链接 |
| 7 | 时间轴 | 184-280 Slider，联动过滤活跃人物 |
| 8 | 数据完整性 | 关系 ≥1500 条，事件 ≥200 个，核心人物 ≥10 条关系/人 |

**性能指标**：首次加载 <3s，交互 ≥30fps，默认视图 ≤200 节点

## UI 设计稿

- [主界面线框图](../ui/hh-vis-001-layout.md)

---

## 方案设计

### 整体架构

```
App
├── Header
│   ├── Logo + 标题
│   ├── SearchBar (AutoComplete)
│   └── FactionSelector (默认阵营切换)
├── MainLayout (flex row)
│   ├── FilterPanel (左侧 240px)
│   │   ├── 阵营过滤 (Checkbox Group)
│   │   ├── 身份过滤 (Checkbox Group)
│   │   └── 关系类型过滤 (Checkbox Group)
│   └── GraphView (flex: 1, G6 Canvas)
├── DetailDrawer (右侧 Drawer)
│   ├── PersonDetail
│   └── EventDetail
└── TimelineNav (底部 Slider)
```

**数据流**：

```
[JSON Files] → Vite import → [DataStore] → filter/search → [GraphView]
                                    ↓                          ↓
                              [SearchIndex]            [G6 Graph Instance]
                              (pinyin index)                   ↓
                                                    node:click → [DetailDrawer]
```

**状态管理**：React Context（项目简单，不需要 Zustand）

```typescript
interface AppState {
  // 过滤
  selectedFactions: Faction[];    // 默认 ['wei']
  selectedRoles: Role[];
  selectedRelTypes: RelationType[];
  timeRange: [number, number];    // 默认 [150, 280]
  
  // 搜索
  searchQuery: string;
  highlightedPersonId: string | null;
  
  // 详情
  selectedPerson: Person | null;
  selectedEvent: HistoricalEvent | null;
  drawerVisible: boolean;
  drawerMode: 'person' | 'event';
}
```

### 动态加载策略（P0 性能解决方案）

**核心原则：永远不一次性渲染全量数据。**

1. **默认视图**：只渲染一个阵营（默认曹魏 ~119 节点），顶部有阵营切换 Tab
2. **切换阵营**：销毁旧 Graph，用新阵营数据创建新 Graph
3. **"全部"模式**：
   - 先渲染 degree ≥ 5 的核心节点（约 50-80 个）
   - 1 秒后批量添加剩余节点（requestIdleCallback）
   - 或者：不提供"全部"模式，强制用户选阵营
4. **布局**：d3-force，单阵营 ~120 节点足够快，不需要预计算

```typescript
// 切换阵营时的数据过滤
function getFilteredData(state: AppState) {
  let filtered = persons;
  
  // 阵营过滤
  if (state.selectedFactions.length > 0) {
    filtered = filtered.filter(p => state.selectedFactions.includes(p.faction));
  }
  
  // 身份过滤
  if (state.selectedRoles.length > 0) {
    filtered = filtered.filter(p => p.roles.some(r => state.selectedRoles.includes(r)));
  }
  
  // 时间范围过滤
  const [start, end] = state.timeRange;
  filtered = filtered.filter(p => {
    const born = p.birth_year ?? 0;
    const died = p.death_year ?? 999;
    return born <= end && died >= start;
  });
  
  const ids = new Set(filtered.map(p => p.id));
  
  // 只保留两端都在过滤集中的关系
  const filteredRels = relationships.filter(r => 
    ids.has(r.source) && ids.has(r.target)
  );
  
  // 关系类型过滤
  const finalRels = state.selectedRelTypes.length > 0
    ? filteredRels.filter(r => state.selectedRelTypes.includes(r.type))
    : filteredRels;
  
  return { persons: filtered, relationships: finalRels };
}
```

### 搜索架构

**依赖**：`tiny-pinyin`（中文转拼音，~5KB）

**索引构建**（应用启动时一次性构建）：

```typescript
import pinyin from 'tiny-pinyin';

interface SearchEntry {
  id: string;
  name: string;
  courtesyName: string | null;
  faction: Faction;
  roles: Role[];
  pinyinName: string;      // "caocao"
  pinyinInitials: string;  // "cc"
}

// Build index
const searchIndex: SearchEntry[] = persons.map(p => ({
  id: p.id,
  name: p.name,
  courtesyName: p.courtesy_name,
  faction: p.faction,
  roles: p.roles,
  pinyinName: pinyin.convertToPinyin(p.name, '', true).toLowerCase(),
  pinyinInitials: pinyin.convertToPinyin(p.name, '', true)
    .split(' ').map(s => s[0]).join('').toLowerCase(),
}));
```

**搜索算法**（优先级排序）：

```typescript
function search(query: string): SearchEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return searchIndex
    .filter(entry => 
      entry.name.includes(q) ||                          // 中文名包含
      (entry.courtesyName && entry.courtesyName.includes(q)) || // 字包含
      entry.pinyinName.startsWith(q) ||                  // 拼音前缀
      entry.pinyinInitials.startsWith(q)                 // 拼音首字母
    )
    .sort((a, b) => {
      // 精确匹配优先
      const aExact = a.name === q ? 0 : 1;
      const bExact = b.name === q ? 0 : 1;
      return aExact - bExact;
    })
    .slice(0, 10);  // 最多 10 条建议
}
```

**选中人物后**：
1. 检查该人物是否在当前图谱中
2. 如果不在 → 自动切换到该人物所在阵营
3. G6 `graph.focusElement(personId)` 居中
4. 高亮该节点 + 所有 1-hop 邻居（设置 state，其他节点降低透明度）
5. 自动打开详情面板

### 过滤系统

**左侧面板**（固定宽度 240px，可折叠）：

```
▼ 阵营（Checkbox Group）
  ☑ 曹魏 🔵 (119)
  ☐ 蜀汉 🟢 (121)
  ☐ 东吴 🟠 (119)
  ☐ 东汉 🟣 (62)
  ☐ 西晋 🟡 (8)
  ☐ 其他 ⚫ (10)

▼ 身份（Checkbox Group）
  ☑ 全部
  ☐ 帝王  ☐ 武将  ☐ 谋士
  ☐ 文臣  ☐ 诸侯  ☐ 后妃 ...

▼ 关系类型（Checkbox Group）
  ☑ 全部
  ☐ 君臣  ☐ 父子  ☐ 对手
  ☐ 兄弟  ☐ 夫妻  ☐ 背叛 ...

[清除所有过滤]
```

**交互**：每次过滤变化 → 重新计算 `getFilteredData()` → 更新 G6 Graph

### G6 v5 渲染方案

```typescript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: containerRef.current,
  data: { nodes, edges },
  autoFit: 'view',
  animation: false,  // 禁用动画提升性能
  node: {
    style: {
      size: (d) => Math.max(20, Math.min(60, (d.data.degree || 0) * 4 + 20)),
      fill: (d) => FACTION_CONFIG[d.data.faction]?.color || '#8c8c8c',
      stroke: '#fff',
      lineWidth: 1.5,
      labelText: (d) => d.data.name || '',
      labelFontSize: 11,
      labelFill: '#333',
      labelPlacement: 'bottom',
    },
    state: {
      highlight: {
        stroke: '#ff4d4f',
        lineWidth: 3,
        labelFontSize: 14,
        labelFontWeight: 'bold',
      },
      dim: {
        opacity: 0.15,
      },
    },
  },
  edge: {
    style: {
      stroke: (d) => RELATION_COLORS[d.data.type] || '#ddd',
      lineWidth: 1,
      lineDash: (d) => RELATION_DASH[d.data.type] || [],
      endArrow: (d) => !d.data.bidirectional,
      labelText: (d) => d.data.label || '',
      labelFontSize: 9,
      labelFill: '#999',
    },
  },
  layout: {
    type: 'd3-force',
    preventOverlap: true,
    nodeSize: 40,
    linkDistance: 120,
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force'],
});
```

**关系类型视觉区分**：

```typescript
const RELATION_COLORS: Record<string, string> = {
  'lord-vassal': '#1677ff',    // 君臣 - 蓝
  'father-son': '#52c41a',     // 父子 - 绿
  'mother-son': '#52c41a',     // 母子 - 绿
  'brothers': '#13c2c2',       // 兄弟 - 青
  'husband-wife': '#eb2f96',   // 夫妻 - 粉
  'rivals': '#f5222d',         // 对手 - 红
  'betrayal': '#fa541c',       // 背叛 - 橙红
  'sworn-brothers': '#faad14', // 结义 - 金
  'killed-by': '#000000',      // 被杀 - 黑
  'master-student': '#722ed1', // 师徒 - 紫
  'allies': '#2f54eb',         // 同盟 - 深蓝
};

const RELATION_DASH: Record<string, number[]> = {
  'rivals': [6, 3],           // 虚线
  'betrayal': [4, 4],         // 虚线
  'allies': [8, 4],           // 长虚线
};
```

### 人物详情面板

**Ant Design Drawer**，宽度 420px：

```
┌─────────────────────────┐
│ 曹操          字：孟德   │
│ 🔵曹魏  诸侯  武将      │
├─────────────────────────┤
│ 生卒：155 - 220         │
│ 籍贯：沛国谯县          │
│ 谥号：武皇帝            │
├─────────────────────────┤
│ 东汉末年著名政治家、军   │
│ 事家、文学家...          │
├─────────────────────────┤
│ ── 关系 (23) ──         │
│                         │
│ 👨 父子                 │
│   → 曹丕  → 曹植  → 曹彰│
│                         │
│ 👑 君臣                 │
│   ← 荀彧  ← 郭嘉  ← 许褚│
│                         │
│ ⚔️ 对手                 │
│   ↔ 刘备  ↔ 孙权  ↔ 袁绍│
│                         │
│ 💀 被杀                 │
│   → 吕布  → 袁术        │
├─────────────────────────┤
│ ── 参与事件 (12) ──      │
│ ⚔ 200 官渡之战          │
│ ⚔ 208 赤壁之战          │
│ ...                     │
├─────────────────────────┤
│ 📎 来源                 │
│ Wikipedia ↗             │
└─────────────────────────┘
```

关系列表按类型分组，人名可点击跳转（切换 selectedPerson）。

### 事件详情面板

复用 Drawer，切换 mode='event'：
- 事件名、年份、地点、类型
- 事件描述
- 参与人物列表（可点击跳转回人物详情）
- 事件结果
- 来源链接

### 时间轴导航

**Ant Design Slider**（range mode），底部固定高度 60px：

```typescript
<Slider
  range
  min={150}
  max={280}
  defaultValue={[150, 280]}
  marks={{
    184: '黄巾', 200: '官渡', 208: '赤壁',
    220: '三国', 234: '五丈原', 263: '灭蜀', 280: '统一'
  }}
  onChange={([start, end]) => dispatch({ type: 'SET_TIME_RANGE', payload: [start, end] })}
/>
```

联动逻辑：选择范围后，过滤 `birth_year <= end && (death_year >= start || death_year == null)` 的人物。

### 数据层

```typescript
// src/data/index.ts
import personsData from '../../data/persons.json';
import relationshipsData from '../../data/relationships.json';
import eventsData from '../../data/events.json';
import type { Person, Relationship, HistoricalEvent } from '../types';

export const persons: Person[] = personsData as Person[];
export const relationships: Relationship[] = relationshipsData as Relationship[];
export const events: HistoricalEvent[] = eventsData as HistoricalEvent[];

// 预计算度数
export const degreeMap: Record<string, number> = {};
relationships.forEach(r => {
  degreeMap[r.source] = (degreeMap[r.source] || 0) + 1;
  degreeMap[r.target] = (degreeMap[r.target] || 0) + 1;
});

// 关系查询索引
export const relsByPerson: Record<string, Relationship[]> = {};
relationships.forEach(r => {
  (relsByPerson[r.source] ??= []).push(r);
  (relsByPerson[r.target] ??= []).push(r);
});

// 事件查询索引
export const eventsByPerson: Record<string, HistoricalEvent[]> = {};
events.forEach(e => {
  e.participants.forEach(p => {
    (eventsByPerson[p.person_id] ??= []).push(e);
  });
});
```

### 数据补充方案（P0 blocking）

**目标**：关系 433 → 1500+，事件 95 → 200+

**执行方式**：Codex

**关系补充策略**：
1. 核心人物关系加密：曹操/刘备/孙权/诸葛亮/关羽/司马懿 每人补到 ≥15 条
2. 批量补充 lord-vassal（君臣）：每个阵营的主公与所有重要臣子
3. 批量补充 colleagues（同僚）：同阵营同期为官者
4. 家族关系完善：曹氏/孙氏/刘氏/司马氏的完整家谱
5. 跨阵营对手关系：重要战役的对阵双方

**事件补充策略**：
1. 补充诸葛亮六出祁山的各次北伐
2. 补充姜维北伐系列
3. 补充东吴内部政变（孙峻/孙綝专权等）
4. 补充西晋统一过程

**验证**：每批数据补充后运行验证脚本检查引用一致性

**时机**：与前端开发并行，不阻塞

---

## 备选方案

### 方案 B：3D 力导向图（react-force-graph-3d）
- **优点**：视觉冲击力强，天然解决节点重叠
- **缺点**：交互复杂、移动端不友好、Three.js 包体积大
- **不选原因**：2D + 过滤/分层已够用，3D 增加复杂度不值得

### 方案 C：Sigma.js
- **优点**：WebGL 原生，10k+ 节点性能极好
- **缺点**：中文文档少，React 集成需额外封装，生态不如 G6
- **不选原因**：G6 蚂蚁出品，Ant Design 配合好，中文社区活跃

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| JSON 数据格式异常 | 捕获异常，显示"数据加载失败"+ 重试按钮 |
| G6 渲染失败 | try-catch 包裹，fallback 到人物列表视图 |
| 搜索无结果 | AutoComplete 显示"未找到匹配人物" |
| 图谱为空（过滤后无节点）| 显示"当前条件下无人物，请调整过滤" |

---

## 测试策略

| 层级 | 内容 | 工具 |
|------|------|------|
| L0 | `npm run build` 零错误 | Vite |
| L1 | JSON 引用一致性验证 | Node.js 脚本 |
| L2 | 冒烟测试：页面加载、无 JS error | Playwright 截图 |
| L3 | 功能 E2E：按 PRD 8 个需求逐条 | Playwright + 浏览器截图 |
| L4 | 性能：加载 <3s、交互 ≥30fps | Lighthouse / DevTools |

**覆盖率要求**：数据层工具函数 ≥ 80%

---

## Task Breakdown

| ID | 子任务 | 依赖 | 估时 |
|----|--------|------|------|
| T1 | 数据补充（关系 1500+，事件 200+）| 无 | 2h |
| T2 | 安装 tiny-pinyin + 搜索索引构建 | 无 | 0.5h |
| T3 | AppContext 状态管理 | 无 | 0.5h |
| T4 | GraphView 重写（动态加载 + 阵营切换 + 关系线型）| T3 | 2h |
| T5 | SearchBar（AutoComplete + 拼音 + 定位高亮）| T2, T3, T4 | 1.5h |
| T6 | FilterPanel（阵营 + 身份 + 关系类型）| T3, T4 | 1h |
| T7 | PersonDetail 面板（关系分组 + 人物跳转 + 事件列表）| T4 | 1.5h |
| T8 | EventDetail 面板 | T7 | 0.5h |
| T9 | TimelineNav + 联动 | T3, T4 | 1h |
| T10 | 图例组件 | T4 | 0.5h |
| T11 | 性能优化（animation:false, 预计算度数）| T4 | 0.5h |
| T12 | L0-L2 测试 + 构建验证 | 全部 | 1h |

**关键路径**：T3 → T4 → T5/T6/T7/T9 → T11 → T12（约 8-9h）

**T1（数据补充）与 T2-T12 并行，不阻塞前端开发。**

---

## 风险与开放问题

| 风险 | 缓解措施 |
|------|---------|
| G6 v5 API 文档不全 | 先跑小 demo 验证核心 API（布局、事件、state） |
| d3-force 布局 120 节点性能 | 禁用动画 + nodeSize 调大防重叠 |
| tiny-pinyin 拼音准确度 | 对比测试多音字场景，如"曹操"不会被搜成别的 |
| 数据补充质量 | 验证脚本 + 人工抽检核心人物关系 |

**开放问题**：
1. 人物数据 439 < 500，是否在数据补充时一起补人物？
2. 是否需要 URL hash 路由，让人物/事件可分享？
3. "全部阵营"模式要不要做？（建议 v1 不做，强制选单阵营）

---

## 参考资料

- [AntV G6 v5 文档](https://g6.antv.antgroup.com/)
- [G6 Force Layout](https://g6.antv.antgroup.com/en/manual/layout/force-layout)
- [tiny-pinyin](https://www.npmjs.com/package/tiny-pinyin)
- PRD：docs/tasks/HH-VIS-001/prd.md
- UI 线框图：docs/ui/hh-vis-001-layout.md
