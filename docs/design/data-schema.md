# HH-001 数据 Schema 设计

## 概述

三类核心实体：人物(Person)、关系(Relationship)、事件(Event)。
数据格式：JSON，纯静态文件，前端直接 import。

## Person（人物）

```typescript
interface Person {
  id: string;              // 唯一标识，拼音格式，如 "cao-cao"
  name: string;            // 姓名，如 "曹操"
  courtesy_name?: string;  // 字，如 "孟德"
  title?: string;          // 谥号/庙号/封号，如 "魏武帝"
  faction: Faction;        // 阵营
  roles: Role[];           // 身份标签（多选）
  birth_year?: number;     // 出生年（公元）
  death_year?: number;     // 去世年（公元）
  birth_place?: string;    // 出生地
  description: string;     // 人物简介（100-300字）
  source_urls: string[];   // 数据来源 URL
}

type Faction =
  | "wei"       // 曹魏
  | "shu"       // 蜀汉
  | "wu"        // 东吴
  | "han"       // 东汉（含汉末群雄）
  | "jin"       // 西晋
  | "other";    // 其他（异族、中立等）

type Role =
  | "emperor"       // 帝王
  | "general"       // 武将
  | "strategist"    // 谋士
  | "minister"      // 文臣
  | "warlord"       // 诸侯/军阀
  | "scholar"       // 文人/学者
  | "consort"       // 后妃
  | "eunuch"        // 宦官
  | "rebel"         // 起义领袖
  | "foreigner"     // 异族首领
  | "other";        // 其他
```

## Relationship（关系）

```typescript
interface Relationship {
  id: string;              // 唯一标识，格式: "{source}-{target}-{type}"
  source: string;          // 人物A的id
  target: string;          // 人物B的id
  type: RelationType;      // 关系类型
  label: string;           // 显示标签，如 "父子"
  description?: string;    // 关系描述（可选）
  bidirectional: boolean;  // 是否双向关系
  start_year?: number;     // 关系起始年份（可选）
  end_year?: number;       // 关系结束年份（可选，如背叛/反目）
  source_urls: string[];   // 数据来源 URL
}

type RelationType =
  | "father-son"       // 父子
  | "mother-son"       // 母子
  | "brothers"         // 兄弟
  | "husband-wife"     // 夫妻
  | "lord-vassal"      // 君臣
  | "master-student"   // 师徒
  | "allies"           // 同盟
  | "rivals"           // 对手/敌对
  | "friends"          // 友人
  | "sworn-brothers"   // 结义兄弟
  | "betrayal"         // 背叛
  | "in-law"           // 姻亲
  | "colleagues"       // 同僚
  | "subordinate"      // 上下级（非君臣的从属关系）
  | "successor"        // 继任者
  | "killed-by";       // 被杀/处死
```

## Event（事件）

```typescript
interface Event {
  id: string;              // 唯一标识，如 "battle-of-red-cliffs"
  name: string;            // 事件名称，如 "赤壁之战"
  year: number;            // 发生年份（公元）
  end_year?: number;       // 结束年份（跨年事件）
  location?: string;       // 地点
  type: EventType;         // 事件类型
  description: string;     // 事件描述（200-500字）
  participants: Participant[];  // 参与人物
  result?: string;         // 事件结果/影响
  source_urls: string[];   // 数据来源 URL
}

interface Participant {
  person_id: string;       // 人物id
  role: string;            // 在事件中的角色，如 "指挥者"、"参与者"、"受害者"
}

type EventType =
  | "battle"        // 战役
  | "political"     // 政治事件（称帝、废立、政变）
  | "diplomatic"    // 外交事件（结盟、和谈）
  | "cultural"      // 文化事件
  | "death"         // 重要人物死亡
  | "rebellion"     // 起义/叛乱
  | "succession"    // 继位/禅让
  | "other";
```

## 文件结构

```
data/
├── persons.json          // Person[]
├── relationships.json    // Relationship[]
└── events.json           // Event[]
```

## ID 命名规范

- 人物：姓名拼音，连字符分隔，如 `zhuge-liang`、`cao-cao`
- 同名人物：追加阵营或字号，如 `zhang-fei-shu`（蜀）vs `zhang-fei-other`
- 关系：`{source}-{target}-{type}`，如 `cao-cao-cao-pi-father-son`
- 事件：英文描述，连字符分隔，如 `battle-of-red-cliffs`、`oath-of-peach-garden`

## 数据质量要求

1. 所有数据必须有互联网来源（source_urls），不允许 AI 编造
2. 人物简介需引用正史（《三国志》优先）和通鉴，《三国演义》仅作补充
3. 生卒年不确定的标为 null，不猜测
4. 关系类型必须有史料依据
