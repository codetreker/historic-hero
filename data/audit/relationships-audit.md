# 关系数据质量审核报告

**审核时间**: 2026-04-29
**数据源**: `relationships.json` (1807 条关系), `persons.json` (3200 个人物)

## 概要

| 检查项 | 结果 | 状态 |
|--------|------|------|
| 无效引用 | 0 条 | ✅ 通过 |
| 重复关系 | 0 组 | ✅ 通过 |
| 自引用 | 1 条 | ⚠️ 有问题 |
| 同僚占比 | 40.2% (727/1807) | ⚠️ 占比过高 |
| 孤立人物 | 2679/3200 (84%) | ⚠️ 较多 |
| 方向逻辑错误 | 0 条 | ✅ 通过 |
| 父女类型误用 | 5 条 | ⚠️ 有问题 |
| 缺少来源链接 | 1 条 | ⚠️ 有问题 |

## 1. 无效引用

✅ 所有 source/target 引用的人物 ID 均存在于 persons.json 中。

## 2. 重复关系

✅ 未发现重复关系（同一 source+target+type 对）。

## 3. 自引用

共 1 条自引用关系：

- `other-zhang-yan-other-zhang-yan-lord-vassal`: `other-zhang-yan` (张燕) → 自身 (lord-vassal)

## 4. 关系类型分布

总关系数: **1807**

| 类型 | 中文标签 | 数量 | 占比 |
|------|---------|------|------|
| colleagues | 同僚 | 727 | 40.2% ⚠️ |
| lord-vassal | 君臣 | 607 | 33.6% |
| father-son | 父子 | 100 | 5.5% |
| subordinate | 上下级 | 55 | 3.0% |
| brothers | 兄弟 | 53 | 2.9% |
| rivals | 对手 | 46 | 2.5% |
| allies | 同盟 | 45 | 2.5% |
| killed-by | 被杀 | 36 | 2.0% |
| friends | 友人 | 36 | 2.0% |
| betrayal | 背叛 | 26 | 1.4% |
| successor | 继任者 | 20 | 1.1% |
| husband-wife | 夫妻 | 20 | 1.1% |
| in-law | 姻亲 | 10 | 0.6% |
| mother-son | 母子 | 10 | 0.6% |
| master-student | 师徒 | 7 | 0.4% |
| siblings | 兄弟 | 4 | 0.2% |
| sworn-brothers | 结义兄弟 | 3 | 0.2% |
| protector | 保护 | 2 | 0.1% |

⚠️ **同僚(colleagues)关系占比 40.2%，超过 30% 阈值。** 同僚关系是组合爆炸的来源（N 人小组产生 N*(N-1)/2 条关系）。建议：
- 用 **group 实体**（如「五子良将」「五虎上将」「蜀汉四相」）代替两两配对关系
- 只保留有实际协作/冲突故事的同僚关系
- 移除纯粹「属于同一阵营」的泛泛同僚

## 5. 孤立人物

persons.json 中共 **3200** 个人物，其中 **2679** 个（83.7%）在 relationships.json 中完全没有出现。

各阵营孤立人物数量：

| 阵营 | 孤立人物数 |
|------|-----------|
| han | 435 |
| jin | 266 |
| other | 585 |
| shu | 170 |
| wei | 776 |
| wu | 447 |

（完整孤立人物列表较长，此处省略。核心问题是 persons.json 远大于 relationships.json 的覆盖范围。）

**建议**：这是正常的数据建设阶段现象——persons 先录入，relationships 逐步补充。优先为主要人物（君主、名将、重要谋士）补充关系。

## 6. 关系方向逻辑错误

✅ 所有 father-son 关系中（有出生年数据的），父亲出生年均早于或等于儿子。

## 7. 附加检查

### 7.1 缺少 source_urls

共 1 条关系没有 source_urls：

- `guan-yu-guan-suo-father-son` (father-son): guan-yu → guan-suo

### 7.2 父女关系使用 father-son 类型

以下 5 条关系的 target 为女性，但使用了 `father-son` 类型（建议改为 `father-daughter` 或 `parent-child`）：

| 关系 ID | 父亲 | 女儿 |
|---------|------|------|
| `sun-quan-sun-luban-father-son` | 孙权 | 孙鲁班 (`sun-luban`) |
| `sun-quan-sun-luyu-father-son` | 孙权 | 孙鲁育 (`sun-luyu`) |
| `cai-yong-cai-wenji-father-son` | 蔡邕 | 蔡文姬 (`cai-wenji`) |
| `xin-pi-xin-xianying-father-son` | 辛毗 | 辛宪英 (`xin-xianying`) |
| `rel-1504` | 孙坚 | 孙尚香 (`sun-shangxiang`) |

---

## 总结

共发现以下数据质量问题：

1. ⚠️ **1 条自引用** — `other-zhang-yan-other-zhang-yan-lord-vassal` source==target，需修正
2. ⚠️ **同僚关系占比 40.2%** — 超过 30% 阈值，建议用 group 实体替代两两配对
3. ⚠️ **2679 个孤立人物 (84%)** — persons 覆盖远超 relationships，需持续补充
4. ⚠️ **5 条父女关系类型不当** — 建议新增 `father-daughter` 或 `parent-child` 类型
5. ⚠️ **1 条关系缺少 source_urls** — 建议补充来源

### 优先级建议

| 优先级 | 问题 | 原因 |
|--------|------|------|
| P0 (立即修) | 自引用 | 数据错误，影响图谱正确性 |
| P1 (近期优化) | 同僚关系占比过高 | 引入 group 实体可大幅精简数据 |
| P1 (近期优化) | 父女类型不当 | 语义不准确，影响前端展示 |
| P2 (持续完善) | 孤立人物 | 正常的数据建设阶段，逐步补充即可 |
| P2 (持续完善) | 缺少 source_urls | 补充来源提升可信度 |