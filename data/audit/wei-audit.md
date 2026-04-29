# 曹魏（Wei）阵营人物数据质量审核报告

**审核日期**: 2026-04-29
**数据源**: `/workspace/historic-hero/data/persons.json`
**筛选条件**: `faction = "wei"`

---

## 一、重复项列表

### 1.1 完全同名重复（同名不同 ID）

| 人物名 | ID 1 | ID 2 | 建议 |
|--------|-------|-------|------|
| 郭女王 | `guo-nuwang` | `guo-nwang` | 保留 `guo-nuwang`（有完整数据），删除 `guo-nwang` |
| 文聘 | `wen-pin` | `wen-pin-wen-ping` | 保留 `wen-pin`（有完整数据），删除 `wen-pin-wen-ping` |
| 成倅 | `wei-cheng-cui` | `cheng-cui` | 合并为一条，保留数据更完整的 |
| 令狐愚 | `wei-linghu-yu` | `linghu-yu` | 合并为一条，保留数据更完整的 |
| 郝昭 | `wei-hao-zhao` | `hao-zhao` | 合并为一条，保留数据更完整的 |

### 1.2 同字（courtesy_name）重复——疑似同一人

| 字 | 人物 1 | 人物 2 | 判定 |
|----|--------|--------|------|
| 稚叔 | `zhong-you` 钟毓 | `zhong-yu` 鍾毓 | **同一人**（简繁体差异），需合并 |
| 子恪 | `lu-qian` 吕虔 | `l-qian` 呂虔 | **同一人**（ID 拼写差异），需合并 |
| 公治 | `wei-linghu-yu` 令狐愚 | `linghu-yu` 令狐愚 | 同上 1.1 已列 |
| 伯道 | `wei-hao-zhao` 郝昭 | `hao-zhao` 郝昭 | 同上 1.1 已列 |

### 1.3 跨阵营重复

| 人物名 | Wei 侧 ID | 另一阵营 ID | 阵营 | 判定 |
|--------|-----------|------------|------|------|
| 许靖 | `xu-you-caowei` (wei) | `xu-jing` (shu) | shu | **同一人**，许靖归蜀汉，wei 侧应删除（详见阵营错误） |

---

## 二、错误项列表

### 2.1 阵营归属错误

| ID | 人物 | 当前阵营 | 问题 | 建议 |
|----|------|---------|------|------|
| `xu-you-caowei` | 许靖 | wei | 许靖（字文休）是蜀汉太傅，归刘备集团。数据库中 `xu-jing`（shu）已有此人。此条是重复且阵营错误。ID 命名也有误（xu-you 暗示许攸）。 | **删除此条** |
| `cai-yong` | 蔡邕 | wei | 蔡邕生于 132 年，卒于 192 年（被王允所杀），此时曹魏政权尚未建立。蔡邕是东汉人物，与曹魏无直接隶属关系。 | 改为 `faction: "han"` 或创建东汉独立分类 |
| `xu-shu` | 徐庶 | wei | 徐庶核心身份为刘备谋士，因母亲被掳才入曹营，传说入曹营后未献一策。归属有争议，但作为 wei 勉强可接受。 | **待讨论**，可标注为 `faction: "shu"` 或添加 `former_faction` 字段 |

### 2.2 角色标注错误

| ID | 人物 | 当前 roles | 问题 | 建议 |
|----|------|-----------|------|------|
| `cao-cao` | 曹操 | `[warlord, general, poet, politician]` | 曹操谥号为「武皇帝」（title 字段已记录），但 roles 中无 `emperor`。虽然曹操生前仅为魏王，但若 title 含「皇帝」则 roles 应保持一致。 | 添加 `emperor`（追谥）或在数据中区分「生前」与「追谥」 |
| `zhang-ji-jingzhong` | 张缉 | `[politician]` | 描述提到「其女为曹芳皇后」，但 roles 无 `consort` 标注——注意：这是皇后的**父亲**，不是皇后本人，所以 `consort` 不适用。但标注提醒：若有张缉之女作为独立人物，需确认她是否已收录。 | 无需修改张缉 roles |
| `deng-jing` | 鄧靜 | 含 `general` | description 为空，但从字面信息看（scholar 标注在内），general 标注缺乏依据 | 需补充 description 后确认，暂标记存疑 |
| `yue-xiang` | 樂詳 | 含 `general` | 同上，scholar + general 组合但无描述支撑军事身份 | 需补充 description 后确认 |

### 2.3 ID 命名问题

| ID | 人物 | 问题 |
|----|------|------|
| `xu-you-caowei` | 许靖 | ID 暗示「许攸-曹魏」，但人物实际是许靖（字文休），且应归蜀汉 |
| `wang-can-shuangquan` | 王观 | ID 中 `wang-can` 容易与王粲（`wang-can`）混淆，`shuangquan` 含义不明 |
| `zhong-hui-mu` | 卞夫人 | ID 中 `zhong-hui` 指钟会，与卞夫人无关 |
| `l-qian` | 呂虔 | ID 缺少元音，应为 `lv-qian` 或 `lu-qian`（后者已存在，即为重复） |
| `l-an`, `l-chang`, `l-cui` 等 | 呂氏系列 | 所有呂姓人物 ID 前缀为 `l-`，不规范，建议统一为 `lv-` 或 `lu-` |
| `guo-nwang` | 郭女王 | 拼写不完整，缺 `u`，应为 `guo-nuwang`（已有此 ID） |

---

## 三、生卒年检查

**未发现明显的生卒年错误。** 所有有生卒年数据的人物均满足：
- 出生年在 100–300 年之间
- 死亡年不早于出生年
- 寿命未超过 120 岁

---

## 四、空数据统计

### 4.1 description 为空

**共 654 人**缺少描述（占总数 71.1%）。

> 由于数量过多，不在此逐一列出。完整列表见审核脚本输出。
> 主要集中在次要人物和宗族成员。

### 4.2 roles 为空

**共 52 人**缺少角色标注。部分示例：

| ID | 人物 |
|----|------|
| `bei-zhan` | 卑湛 |
| `cao-liang` | 曹亮 |
| `cao-wenshu` | 曹文叔 |
| `xiahou-cheng` | 夏侯稱 |
| `xiahou-lingn` | 夏侯令女 |
| `xiahou-rong` | 夏侯榮 |
| `zhang-changpu` | 張昌蒲 |

（完整列表共 52 人）

---

## 五、统计摘要

| 指标 | 数量 | 占比 |
|------|------|------|
| **曹魏阵营总人数** | **920** | 100% |
| 有 description 的人数 | 266 | 28.9% |
| description 为空 | 654 | 71.1% |
| 有 birth_year 的人数 | 91 | 9.9% |
| 有 death_year 的人数 | 249 | 27.1% |
| 同时有生卒年的人数 | 89 | 9.7% |
| roles 为空的人数 | 52 | 5.7% |
| 疑似重复条目 | 7 对 | — |
| 阵营归属错误 | 2–3 条 | — |
| 角色标注存疑 | 2–4 条 | — |

---

## 六、优先修复建议

1. **P0 — 删除/合并重复条目**（7 对）
   - 删除 `guo-nwang`、`wen-pin-wen-ping`、`cheng-cui`、`linghu-yu`、`hao-zhao`、`zhong-yu`、`l-qian`
   - 合并前确认保留更完整的数据

2. **P0 — 修复阵营错误**
   - 删除 `xu-you-caowei`（许靖已在 shu 阵营存在）
   - 将 `cai-yong` 改为 `faction: "han"`

3. **P1 — 修复 ID 命名问题**
   - `zhong-hui-mu`（卞夫人）→ 改为 `lady-bian` 或 `bian-furen`
   - `wang-can-shuangquan`（王观）→ 改为 `wang-guan`（注意已有同名 ID `wang-guan`，需确认是否重复）
   - 统一呂姓 ID 前缀

4. **P2 — 补充空数据**
   - 优先补充 52 个 roles 为空的人物
   - 逐步补充 654 个 description 为空的人物（可按知名度优先级分批）

5. **P3 — 补充生卒年**
   - 90% 的人物缺少出生年，可从历史资料中逐步补充核心人物
