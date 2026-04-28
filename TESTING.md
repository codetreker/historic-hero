# 测试指南 — Historic Hero（历史英雄谱 · 三国）

> Owner: QA（烈马）  
> 最后更新: 2026-04-28  
> PRD: `docs/tasks/HH-VIS-001/prd.md`

---

## 环境准备

### 前置条件

- Node.js ≥ 18
- npm
- 现代浏览器（Chrome/Edge 最新版）
- Playwright（E2E 截图验证用）

### 从零开始

```bash
cd /workspace/historic-hero
npm install
npm run build          # 编译必须 0 error
npm run dev -- --host 0.0.0.0 --port 3457   # 启动 dev server
```

验证：浏览器打开 `http://<host>:3457/`，页面无白屏、无 JS 报错。

---

## 验收层级

| 层级 | 内容 | 工具 | 何时跑 |
|------|------|------|--------|
| L0 — 构建 | `npm run build` 无 error | CLI | 每次 PR |
| L1 — 数据完整性 | JSON schema + 数量 + 引用一致性 | Node 脚本 | 每次数据变更 |
| L2 — 页面冒烟 | 页面加载、无 JS error、核心元素可见 | Playwright | 每次 PR |
| L3 — 功能 E2E | 按 PRD 7 个需求逐条验证 | Playwright + 人工截图 | 每次功能 PR |
| L4 — 性能 | 加载时间、交互响应、内存占用 | Playwright + DevTools | 功能完成后 / 数据量变更时 |

---

## L0 — 构建验证

```bash
cd /workspace/historic-hero
npm run build
# 期望: 0 error, 输出到 dist/
# 检查: dist/index.html 存在，bundle 大小合理（< 5MB）
```

**通过标准**：`tsc` + `vite build` 无错误，无 TypeScript 类型警告。

---

## L1 — 数据完整性

数据文件：`data/persons.json`、`data/relationships.json`、`data/events.json`

### 检查项

| # | 检查 | 方法 | 当前值 |
|---|------|------|--------|
| D1 | 人物总数 ≥ 439 | `jq length persons.json` | 439 |
| D2 | 关系总数 ≥ 433 | `jq length relationships.json` | 433 |
| D3 | 事件总数 ≥ 95 | `jq length events.json` | 95 |
| D4 | 关系引用的 person ID 全部存在 | 脚本校验 source/target 在 persons 中 | — |
| D5 | 事件参与者的 person_id 全部存在 | 脚本校验 participants[].person_id | — |
| D6 | 每个人物必须字段非空 | id, name, faction, roles, description | — |
| D7 | 16 种关系类型全部有数据覆盖 | 统计 relationship type 分布 | 16/16 |
| D8 | 6 个阵营全部有人物 | 统计 faction 分布 | 6/6 |
| D9 | 无重复 ID | persons/relationships/events 各自 ID 唯一 | — |
| D10 | source_urls 格式合法 | URL 格式校验 | — |

### 校验脚本

```bash
node scripts/validate-data.js
# 输出: PASS / FAIL + 具体问题
```

> 脚本由开发创建，QA 负责定义检查项和验收。

---

## L2 — 页面冒烟测试

用 Playwright 无头浏览器打开页面，验证基本可用性。

### 冒烟检查项

| # | 检查 | 判定方法 |
|---|------|---------|
| S1 | 页面加载无白屏 | 截图可见内容 |
| S2 | 控制台无 JS error | `page.on('console')` 监听 error 级别 |
| S3 | 标题「历史英雄谱 · 三国」可见 | `page.textContent` |
| S4 | 搜索框可见 | selector 存在 |
| S5 | 阵营筛选器可见 | selector 存在 |
| S6 | 图谱画布渲染 | canvas/svg 元素存在且有尺寸 |
| S7 | 图谱节点数 > 0 | canvas 渲染后有 circle/node 元素 |

### 执行

```bash
node scripts/e2e-smoke.js http://localhost:3457
# 截图保存到 /tmp/hh-smoke-*.png
```

**通过标准**：S1-S7 全部 PASS，截图确认页面正常渲染。

---

## L3 — 功能 E2E（按 PRD 需求逐条）

每条 PRD 需求对应一组 E2E 验证。**所有验证必须有截图证据。**

### 需求 1: 关系图谱（主视图）

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R1.1 | 打开页面即可看到图谱 | 截图确认 canvas 渲染，节点可见 |
| R1.2 | 阵营分色 + 图例 | 截图对比颜色，确认 6 种阵营颜色区分 |
| R1.3 | 核心人物节点更大 | 对比曹操/刘备（关系多）vs 边缘人物的节点大小 |
| R1.4 | 关系连线有类型标签 | hover/点击连线查看 label |
| R1.5 | 拖拽/缩放/平移 | 手动交互 + 截图前后对比 |
| R1.6 | 439 节点无明显卡顿 | 主观体验 + Performance API 测量（见 L4） |

### 需求 2: 分层浏览（v2，MVP 跳过）

> 飞马 + PM 已同意 MVP 不做阵营聚合，用过滤替代。本需求 v1 不验收。

### 需求 3: 搜索

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R3.1 | 搜索框存在，支持姓名/字搜索 | 输入"诸葛亮"、输入"孟德"（曹操的字） |
| R3.2 | 实时模糊匹配建议列表 | 输入"诸葛"看到下拉建议 |
| R3.3 | 选中后图谱居中 + 高亮 | 选择诸葛亮后截图确认定位和高亮效果 |
| R3.4 | 空结果有提示 | 搜索"不存在的人物" |

### 需求 4: 过滤

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R4.1 | 阵营多选过滤 | 选"蜀汉"→ 只显示蜀汉人物，截图确认 |
| R4.2 | 身份过滤 | 选"武将"→ 只显示武将 |
| R4.3 | 关系类型过滤 | 选"结义"→ 只显示结义关系 |
| R4.4 | 组合过滤 | "蜀汉" + "武将" → 截图确认 |
| R4.5 | 一键清除 | 清除后恢复全量 |

### 需求 5: 人物详情面板

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R5.1 | 点击节点弹出详情 | 点击曹操节点 → 右侧 Drawer 打开 |
| R5.2 | 基本信息完整 | 姓名/字/阵营/身份/生卒/籍贯 全部显示 |
| R5.3 | 人物简介 | description 显示 |
| R5.4 | 关系列表 | 曹操应有大量关系（君臣/父子/对手等） |
| R5.5 | 参与事件列表 | 曹操参与的事件（官渡、赤壁等） |
| R5.6 | 来源链接可点击 | Wikipedia URL 可打开 |
| R5.7 | 面板可关闭 | 关闭后恢复正常视图 |

### 需求 6: 事件详情

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R6.1 | 从人物详情进入事件 | 点击曹操→事件列表→赤壁之战 |
| R6.2 | 事件信息完整 | 名称/年份/地点/类型/描述/参与者/结果/来源 |
| R6.3 | 参与人物可跳转回人物 | 点击周瑜 → 打开周瑜详情 |

### 需求 7: 时间轴导航

| # | 验收标准 | 验证方法 |
|---|---------|---------|
| R7.1 | 时间轴组件可见 | 截图确认存在 |
| R7.2 | 标注重要事件 | 赤壁(208)、官渡(200) 等可见 |
| R7.3 | 拖动筛选时间段 | 选 200-220 → 图谱只显示该时段人物 |
| R7.4 | 与图谱联动 | 时间筛选后节点数量明显减少 |

---

## L4 — 性能验收

| # | 指标 | 目标 | 测量方法 |
|---|------|------|---------|
| P1 | 首次加载到图谱可交互 | < 3 秒 | Performance API / Lighthouse |
| P2 | 全量渲染（439 节点）帧率 | ≥ 30fps | DevTools Performance panel |
| P3 | 拖拽/缩放响应 | 无肉眼可见卡顿 | 手动交互体验 |
| P4 | 过滤切换响应 | < 500ms | 计时 |
| P5 | 搜索响应 | < 200ms | 输入后看结果出现时间 |
| P6 | Bundle 大小 | < 5MB（含数据） | `ls -la dist/` |
| P7 | 内存占用 | < 200MB | DevTools Memory |
| P8 | 无内存泄漏 | 反复切换过滤/搜索后内存稳定 | Heap snapshot 对比 |

> ⚠️ 建军反馈性能非常差、浏览器卡死 — 这是 P1 级问题。性能验收在修复后重点关注。

---

## 建军反馈的已知问题（2026-04-28）

| # | 问题 | 严重度 | 状态 |
|---|------|--------|------|
| BUG-001 | 性能极差，浏览器卡死 | P0 | 待修复 |
| BUG-002 | 数据不全，关系和历史事件偏少 | P1 | 待评估（当前 433 关系 / 95 事件） |
| BUG-003 | 搜索不好用 | P1 | 待修复（当前只有简单文本匹配，无下拉建议） |
| BUG-004 | JS 错误 | P0 | 待修复（飞马已尝试修一版） |

---

## E2E 验收执行流程

每次功能 PR 提交验收时，QA 执行以下流程：

```
1. git pull / checkout 到任务分支
2. npm install && npm run build       → L0 构建验证
3. node scripts/validate-data.js      → L1 数据完整性
4. npm run dev -- --host 0.0.0.0      → 启动 dev server
5. 浏览器打开 + Playwright 冒烟       → L2 冒烟测试
6. 按 PRD 需求逐条验证               → L3 功能 E2E
7. 性能检查                           → L4 性能验收
8. 出验收报告（PASS / FAIL + 证据）
```

**QA 验收结论格式**：见 `~/.openclaw/workspace-qa/AGENTS.md` 中的验收规范。

---

## 清理

```bash
# 停止 dev server
# kill $(lsof -ti :3457) 或 Ctrl+C

# 清理构建产物
rm -rf dist/ node_modules/.vite/
```

---

## 已知限制

- 纯前端项目，无后端 API → 不需要 API 测试
- 数据内置在 bundle 中 → 数据量大时影响加载性能
- G6 v5 图谱渲染 → canvas 内部元素不易用 DOM 选择器定位，部分验证需要截图人工判断
- 分层浏览（需求 2）v1 不做 → 不验收
