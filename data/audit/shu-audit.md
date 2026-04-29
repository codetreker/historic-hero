# 蜀汉阵营人物 — 数据质量审核报告

**审核日期**: 2026-04-29  
**数据源**: `/workspace/historic-hero/data/persons.json`  
**蜀汉人物总数**: 306 人

---

## 1. 重复检查

共发现 **11 对确认重复**（同一人出现两次，简繁体或不同 ID 前缀）+ **1 对跨阵营重复** + **1 对合理同名**。

### 1.1 确认重复（同一人，不同 ID）

| # | 人物 | ID-1（有完整描述） | ID-2（空或简略描述） | 说明 |
|---|------|-------------------|---------------------|------|
| 1 | 霍峻 | `shu-huo-jun` | `huo-jun` | 同人，death_year 有 1 年差异（217 vs 216） |
| 2 | 秦宓 | `shu-qin-mi` | `qin-mi` | 同人，death_year 一致（226） |
| 3 | 吴班 | `shu-wu-ban` | `wu-ban` | 完全同人，后者无描述 |
| 4 | 陈式 | `shu-chen-shi` | `chen-shi` | 完全同人，后者无描述 |
| 5 | 吕乂 | `lv-yi` | `l-yi` | 简繁体差异（吕乂 / 呂乂），同人 |
| 6 | 吕凯 | `lv-kai` | `l-kai` | 简繁体差异（吕凯 / 呂凱），同人 |
| 7 | 张嶷 | `zhang-ni` | `zhang-ni-zhang-yi` | 完全同人，death_year 一致（254） |
| 8 | 张翼 | `zhang-yi-1` | `zhang-yi` | 完全同人，death_year 一致（264） |
| 9 | 庞宏 | `pang-tong-hong` | `pang-hong` | 简繁体差异（庞宏 / 龐宏），同人 |
| 10 | 赵累 | `shu-zhao-lei` | `zhao-lei` | 同人，death_year 有 1 年差异（219 vs 220） |
| 11 | 陈祗 | `chen-zhi` | `chen-di` | 简繁体差异（陈祗 / 陳袛），同人，death_year 一致（258） |

**建议**: 合并每对重复，保留有完整描述的记录，删除空记录。注意 #1 和 #10 的 death_year 差异需人工确认。

### 1.2 跨阵营重复

| 人物 | 蜀方 ID | 另一方 ID | 另一方 faction | 说明 |
|------|---------|----------|---------------|------|
| 许靖 | `xu-jing`（shu） | `xu-you-caowei`（wei） | wei | **同一人**，许靖最终仕蜀汉任太傅，不应归魏。wei 方的记录应删除或修改 faction 为 shu |
| 霍弋 | `shu-huo-yi`（shu） | `huo-yi`（wei） | wei | **同一人**，霍弋是蜀汉将领（蜀亡后降晋）。wei 方记录有误 |

### 1.3 合理同名（非重复）

| 人物 | ID-1 | ID-2 | 说明 |
|------|------|------|------|
| 张皇后 | `empress-zhang-1` | `empress-zhang-2` | 刘禅第一任和第二任皇后，是张飞两个女儿，确实是不同的人，**非重复** |
| 马忠（蜀） | `ma-zhong`（shu） | `ma-zhong-wu`（wu） | 蜀汉马忠和东吴马忠是不同人，**非重复** |

### 1.4 可疑同名 — 費承 / 費恭

| 人物 | ID | 字 | 描述 |
|------|----|----|------|
| 費承 | `fei-cheng` | 文偉 | （空） |
| 費恭 | `fei-gong` | 文偉 | （空） |

两人字号相同（文偉），均无描述。費祎字文偉，此二人可能是费祎相关的错误条目或费祎之子/亲族。需人工确认是否为误录。

---

## 2. 阵营归属错误

以下人物标记为 `faction="shu"` 但归属存疑：

### 2.1 严重错误 — 不属于蜀汉

| 人物 | ID | 问题 | 建议 |
|------|-----|------|------|
| **苻健** | `fujian` | 前秦开国皇帝（338–355），晚于三国近百年，完全不是蜀汉人物 | **删除** 或移到其他朝代 |
| **郭修** | `shu-guo-xiu` | 曹魏降将，入蜀后刺杀费祎。本质上是魏国间谍/刺客 | 改为 `faction="wei"` 更合适 |

### 2.2 有争议但可接受

| 人物 | ID | 情况 | 建议 |
|------|-----|------|------|
| 孟达 | `shu-meng-da` | 先仕刘璋→刘备→降魏→谋归蜀，反复叛离。最终身份是魏臣 | 可归蜀，但注明多阵营经历 |
| 糜芳 | `shu-mi-fang` | 原为蜀汉南郡太守，关羽北伐时降吴 | 归蜀合理（前半生效力蜀汉） |
| 范疆 | `shu-fan-qiang` | 张飞部将，刺杀张飞后投吴 | 归蜀合理（原为蜀将） |
| 张达 | `shu-zhang-da` | 同上 | 归蜀合理 |
| 雍闿 | `yong-kai` | 蜀汉南中将领，刘备死后叛蜀 | 归蜀合理（叛前为蜀臣） |
| 黄皓 | `huang-hao` | 蜀汉宦官 | 归蜀合理（虽为奸臣但确实是蜀汉人） |
| 夏侯霸 | `xiahou-ba` | 原为曹魏将领，249年投蜀 | 归蜀合理（后半生效力蜀汉） |

---

## 3. 角色标注错误

### 3.1 缺失的角色标注

| 人物 | ID | 当前 roles | 问题 | 建议 |
|------|-----|-----------|------|------|
| 关兴 | `guan-xing` | `["minister"]` | 关羽之子，虽史载为侍中/中监军，但小说中为武将形象。按史实 minister 尚可，但建议加 general | 补充 `general` |

### 3.2 非标准 role 值

以下人物使用了 `"official"` 等非标准 role 值，与数据集主体的角色命名不一致：

| 人物 | ID | 当前 roles | 建议替换 |
|------|-----|-----------|---------|
| 柳隐 | `shu-liu-yin` | `["general", "official"]` | `["general", "minister"]` |
| 霍弋 | `shu-huo-yi` | `["general", "official"]` | `["general", "minister"]` |
| 罗宪 | `shu-luo-xian` | `["general", "official"]` | `["general", "minister"]` |
| 宗预 | `shu-zong-yu` | `["diplomat", "official"]` | `["minister"]` 或 `["politician"]` |
| 糜芳 | `shu-mi-fang` | `["general", "official"]` | `["general", "minister"]` |
| 秦宓 | `shu-qin-mi` | `["scholar", "official"]` | `["scholar", "minister"]` |
| 程畿 | `shu-cheng-ji` | `["official"]` | `["minister"]` |

### 3.3 非常规 role 值

以下 role 描述不规范或存在问题：

| 人物 | ID | 当前 roles | 问题 |
|------|-----|-----------|------|
| 郭修 | `shu-guo-xiu` | `["assassin", "general"]` | `assassin` 不是标准角色分类 |
| 胡氏 | `lady-hu` | `["liu yan (shu han)'s wife"]` | 应改为 `["consort"]` 或 `["noble"]` |
| 夏侯氏 | `lady-xiahou` | `["zhang fei's wife"]` | 应改为 `["consort"]` 或 `["noble"]` |
| 鄭天生 | `zheng-tiansheng` | `["deng zhi's mother"]` | 应改为 `["noble"]` 或 `["other"]`，角色不应是关系描述 |
| 趙直 | `zhao-zhi` | `["fortune teller", "politician"]` | `fortune teller` 非标准，建议改为 `["scholar", "politician"]` |
| 周巨 | `zhou-ju` | `["astrologer"]` | 建议改为 `["scholar"]` |
| 宋遠 | `song-yuan` | `["officer"]` | 建议改为 `["general"]` 或 `["minister"]` |

---

## 4. 生卒年错误

**未发现严重的日期异常。** 所有有标注的 birth_year 和 death_year 均在合理的三国时期范围内（100–300 年），且无死亡早于出生的情况。

> 注意：大部分蜀汉人物的 birth_year 和 death_year 为 null，这是历史资料缺失的正常现象，不视为错误。

### 4.1 微小差异（重复条目间）

| 人物 | ID-1 death_year | ID-2 death_year | 差异 |
|------|----------------|----------------|------|
| 霍峻 | 217（`shu-huo-jun`） | 216（`huo-jun`） | 1 年差异，需确认 |
| 赵累 | 219（`shu-zhao-lei`） | 220（`zhao-lei`） | 1 年差异，需确认 |

---

## 5. 空数据

### 5.1 description 为空

共 **149 人** description 为空（占蜀汉总数 48.7%）。这些大多是史料记载极少的边缘人物（如诸葛亮北伐中的基层将领、地方官吏等），集中在后半部分的批量录入数据中。

**典型空描述人物示例**（前 20 人）：

| ID | 人物 | roles |
|-----|------|-------|
| `cen-shu` | 岑述 | general |
| `chang-bo` | 常播 | politician |
| `chang-fang` | 常房 | politician |
| `chen-di` | 陳袛 | general, politician |
| `chen-feng` | 陳鳳 | general |
| `chen-hu` | 陳曶 | general |
| `chen-shi` | 陳式 | general |
| `chen-shu` | 陳術 | scholar, politician |
| `cheng-fan` | 成藩 | general |
| `cheng-qi` | 程祁 | _(empty)_ |
| `cuan-xi` | 爨習 | general |
| `deng-fu` | 鄧輔 | politician |
| `deng-kai` | 鄧凱 | general |
| `ding-jungan` | 丁君幹 | _(empty)_ |
| `ding-li` | 丁立 | general |
| `ding-xian` | 丁咸 | general |
| `du-pu` | 杜普 | general |
| `du-xiong` | 杜雄 | politician |
| `du-yi` | 杜義 | general |
| `fan-qi` | 樊岐 | general |

**建议**: 优先补充有 Wikipedia 来源或《三国志》明确记载的人物描述。纯粹只在注释中提到一次的极边缘人物可考虑标记为 `stub` 级别。

### 5.2 roles 为空

共 **16 人** roles 为空数组 `[]`：

| ID | 人物 |
|-----|------|
| `cheng-qi` | 程祁 |
| `ding-jungan` | 丁君幹 |
| `guan-yi` | 關彝 |
| `han-shiyuan` | 韓士元 |
| `han-yan` | 韓儼 |
| `huang-xu` | 黃叙 |
| `li-boren` | 李伯仁 |
| `li-hong` | 李鴻 |
| `ma-hui` | 馬恢 |
| `wei-wenjing` | 衛文經 |
| `xu-qin` | 許欽 |
| `yang-gong` | 楊恭 |
| `yang-tai` | 楊汰 |
| `yin-zong` | 尹宗 |
| `zhuge-huai` | 諸葛懷 |
| `zhuge-xian` | 諸葛顯 |

**建议**: 补充 roles，或对于信息不足的条目至少标记为 `["other"]`。

---

## 审核总结

| 检查项 | 问题数量 | 严重程度 |
|--------|---------|---------|
| 确认重复（站内） | **11 对** | 🔴 高 — 需去重 |
| 跨阵营重复 | **2 对**（许靖、霍弋） | 🔴 高 — 需修正 |
| 阵营归属严重错误 | **2 人**（苻健、郭修） | 🔴 高 — 苻健必须移除 |
| 阵营归属有争议 | 6 人 | 🟡 中 — 可接受但需注释 |
| 角色标注不规范 | **9+ 人** | 🟡 中 — 统一 role 命名 |
| 非标准 role 值 | **11 人** | 🟡 中 — 需规范化 |
| 生卒年错误 | 0 | ✅ 无问题 |
| description 为空 | **149 人**（48.7%） | 🟠 中高 — 近半数据不完整 |
| roles 为空 | **16 人** | 🟡 中 — 需补充 |
| 可疑条目（費承/費恭） | 2 人 | 🟡 中 — 需人工确认 |

### 优先修复建议

1. **P0 — 立即修复**：删除苻健（不属于三国）；合并 11 对重复条目；修正许靖和霍弋的跨阵营重复
2. **P1 — 尽快修复**：统一非标准 role 值（`official` → `minister`，关系描述 → `consort`/`noble`）
3. **P2 — 后续完善**：补充 149 条空描述；补充 16 条空 roles；人工确认費承/費恭是否为误录
