# HH-VIS-004: 后端 API + SQLite 架构迁移

日期：2026-04-29 | 作者：飞马

## 背景

数据量从 521 人扩到 3200 人，JSON 文件已达 2MB+。加上关系/事件补充后预计 3-5MB。每次打开页面下载全量数据不合理（尤其移动端）。建军确认走后端 API + SQLite。

## 目标

1. 前端按需加载，首屏只加载阵营聚合数据（几 KB）
2. 搜索/展开走 API 查询
3. 保持 Docker 部署，SQLite 单文件不需要额外数据库服务
4. Build 时 JSON → SQLite .db

## 方案设计

### 技术栈

- **后端**：Node.js + Express（或 Hono，更轻量）
- **数据库**：SQLite（better-sqlite3，同步 API，性能好）
- **前端**：现有 React + G6，改 data layer 为 API 调用
- **部署**：Docker（Node.js 服务 + SQLite .db 文件 + 前端静态文件）

### API 设计

```
GET /api/factions
  → { factions: [{ id: "wei", name: "曹魏", count: 776, color: "#1677ff" }, ...] }
  → 阵营聚合数据 + 跨阵营关系统计

GET /api/factions/:faction/top?limit=15
  → { persons: [...], relationships: [...] }
  → 阵营 top N 核心人物 + 相互关系

GET /api/persons/:id/network
  → { center: {...}, neighbors: [...], relationships: [...] }
  → 以某人为中心的 1-hop 子图

GET /api/search?q=刘表&limit=10
  → { results: [{ id, name, courtesy_name, faction, roles }] }
  → 搜索（支持中文名 + 拼音）

GET /api/persons/:id
  → { person: {...}, relationships: [...], events: [...] }
  → 人物详情（全量关系 + 参与事件）

GET /api/events/:id
  → { event: {...}, participants: [...] }
  → 事件详情
```

### SQLite Schema

```sql
CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  courtesy_name TEXT,
  title TEXT,
  faction TEXT NOT NULL,
  roles TEXT,           -- JSON array
  birth_year INTEGER,
  death_year INTEGER,
  birth_place TEXT,
  description TEXT,
  source_urls TEXT,      -- JSON array
  importance_score INTEGER DEFAULT 0
);

CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  description TEXT,
  bidirectional INTEGER DEFAULT 0,
  start_year INTEGER,
  end_year INTEGER,
  source_urls TEXT
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER,
  end_year INTEGER,
  location TEXT,
  type TEXT,
  description TEXT,
  participants TEXT,     -- JSON array
  result TEXT,
  source_urls TEXT
);

-- Indexes for query performance
CREATE INDEX idx_persons_faction ON persons(faction);
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_rels_source ON relationships(source);
CREATE INDEX idx_rels_target ON relationships(target);
CREATE INDEX idx_events_year ON events(year);
```

### 项目结构

```
/
├── server/
│   ├── index.ts          -- Express/Hono 入口
│   ├── routes/
│   │   ├── factions.ts
│   │   ├── persons.ts
│   │   ├── search.ts
│   │   └── events.ts
│   ├── db.ts             -- SQLite 连接
│   └── import.ts         -- JSON → SQLite 导入脚本
├── src/                   -- 前端（现有）
├── data/                  -- JSON 源数据
├── historic-hero.db       -- Build 产物
├── Dockerfile             -- 改为 Node.js 服务
└── docker-compose.prod.yml
```

### Dockerfile 改造

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build          # 前端 build
RUN node server/import.ts  # JSON → SQLite

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/historic-hero.db ./
COPY --from=build /app/server ./server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 80
CMD ["node", "server/index.ts"]
```

### 前端改造

- `src/data/index.ts` 从 JSON import 改为 API fetch
- 搜索组件：改为调 `/api/search`
- GraphView：每次视图切换调 API 获取数据
- 加 loading 状态（API 请求时显示加载中）

## Task Breakdown

| ID | 子任务 | 估时 |
|----|--------|------|
| T1 | 后端骨架（Express/Hono + SQLite） | 1h |
| T2 | JSON → SQLite 导入脚本 | 0.5h |
| T3 | API endpoints（6 个） | 2h |
| T4 | 前端 data layer 改为 API 调用 | 2h |
| T5 | Dockerfile 改造 | 0.5h |
| T6 | 搜索 + 拼音索引 | 1h |
| T7 | 测试 + 部署验证 | 1h |

关键路径：T1 → T2 → T3 → T4 → T5 → T7（约 8h）

## 验收标准

1. 首屏加载 < 500KB（不再打包全量 JSON）
2. 搜索 3200 人 < 200ms
3. 展开阵营/人物子图 < 500ms
4. 0 功能回归（所有 INTERACTION-SPEC 规则仍通过）
5. Docker 部署正常
