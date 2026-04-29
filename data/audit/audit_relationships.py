#!/usr/bin/env python3
"""Audit relationships.json against persons.json - v2 with improved father-daughter detection."""
import json
import os
from collections import Counter, defaultdict

DATA_DIR = "/workspace/historic-hero/data"

with open(os.path.join(DATA_DIR, "relationships.json"), "r") as f:
    relationships = json.load(f)

with open(os.path.join(DATA_DIR, "persons.json"), "r") as f:
    persons = json.load(f)

person_ids = {p["id"] for p in persons}
person_map = {p["id"]: p for p in persons}

# 1. Invalid references
invalid_refs = []
for r in relationships:
    if r["source"] not in person_ids:
        invalid_refs.append({"id": r["id"], "field": "source", "missing_id": r["source"]})
    if r["target"] not in person_ids:
        invalid_refs.append({"id": r["id"], "field": "target", "missing_id": r["target"]})

# 2. Duplicate relationships
seen = {}
duplicates = []
for r in relationships:
    key = (r["source"], r["target"], r["type"])
    if key in seen:
        duplicates.append({"first": seen[key], "duplicate": r["id"], "key": key})
    else:
        seen[key] = r["id"]

# 3. Self-references
self_refs = [r for r in relationships if r["source"] == r["target"]]

# 4. Type distribution
type_counter = Counter(r["type"] for r in relationships)
total = len(relationships)

# 5. Isolated persons
persons_in_rels = set()
for r in relationships:
    persons_in_rels.add(r["source"])
    persons_in_rels.add(r["target"])
isolated = [pid for pid in person_ids if pid not in persons_in_rels]

# 6. Direction logic errors
direction_errors = []
for r in relationships:
    if r["type"] == "father-son":
        src = person_map.get(r["source"])
        tgt = person_map.get(r["target"])
        if src and tgt:
            src_birth = src.get("birth_year")
            tgt_birth = tgt.get("birth_year")
            if src_birth is not None and tgt_birth is not None:
                if src_birth > tgt_birth:
                    direction_errors.append({
                        "id": r["id"],
                        "source": r["source"],
                        "source_name": src.get("name", "?"),
                        "source_birth": src_birth,
                        "target": r["target"],
                        "target_name": tgt.get("name", "?"),
                        "target_birth": tgt_birth,
                    })

# Father-daughter detection: only flag clearly female targets
FEMALE_ROLES = {"consort", "empress"}
FEMALE_NAME_PATTERNS = ["夫人", "皇后", "文姬", "宪英", "春华", "尚香", "鲁班", "鲁育", "貂蝉", "女王", "大乔", "小乔"]
KNOWN_FEMALE_IDS = {
    "cai-wenji", "sun-luban", "sun-luyu", "sun-shangxiang", "xin-xianying",
    "diao-chan", "zhen-ji", "guo-nuwang", "da-qiao", "xiao-qiao",
    "lady-gan", "lady-mi", "zhang-chunhua", "wu-guotai",
    "empress-zhang-1", "empress-zhang-2", "zhong-hui-mu",
}

father_daughter_issues = []
for r in relationships:
    if r["type"] == "father-son":
        tgt = person_map.get(r["target"])
        if not tgt:
            continue
        is_female = False
        roles = tgt.get("roles", [])
        name = tgt.get("name", "")
        tid = r["target"]
        
        if tid in KNOWN_FEMALE_IDS:
            is_female = True
        elif any(fr in roles for fr in FEMALE_ROLES):
            is_female = True
        elif any(pat in name for pat in FEMALE_NAME_PATTERNS):
            is_female = True
        
        if is_female:
            father_daughter_issues.append({
                "id": r["id"],
                "source": r["source"],
                "source_name": person_map.get(r["source"], {}).get("name", "?"),
                "target": r["target"],
                "target_name": name,
                "roles": roles,
            })

# No source_urls
no_source = [r for r in relationships if not r.get("source_urls")]

# Generate report
lines = []
lines.append("# 关系数据质量审核报告")
lines.append("")
lines.append(f"**审核时间**: 2026-04-29")
lines.append(f"**数据源**: `relationships.json` ({len(relationships)} 条关系), `persons.json` ({len(persons)} 个人物)")
lines.append("")

# Summary
lines.append("## 概要")
lines.append("")
colleague_count = type_counter.get("colleagues", 0)
colleague_pct = colleague_count / total * 100 if total else 0

lines.append(f"| 检查项 | 结果 | 状态 |")
lines.append(f"|--------|------|------|")
lines.append(f"| 无效引用 | {len(invalid_refs)} 条 | {'⚠️ 有问题' if invalid_refs else '✅ 通过'} |")
lines.append(f"| 重复关系 | {len(duplicates)} 组 | {'⚠️ 有问题' if duplicates else '✅ 通过'} |")
lines.append(f"| 自引用 | {len(self_refs)} 条 | {'⚠️ 有问题' if self_refs else '✅ 通过'} |")
lines.append(f"| 同僚占比 | {colleague_pct:.1f}% ({colleague_count}/{total}) | {'⚠️ 占比过高' if colleague_pct > 30 else '✅ 合理'} |")
isolation_pct = len(isolated) / len(person_ids) * 100 if person_ids else 0
lines.append(f"| 孤立人物 | {len(isolated)}/{len(person_ids)} ({isolation_pct:.0f}%) | {'⚠️ 较多' if isolation_pct > 30 else '✅ 合理'} |")
lines.append(f"| 方向逻辑错误 | {len(direction_errors)} 条 | {'⚠️ 有问题' if direction_errors else '✅ 通过'} |")
lines.append(f"| 父女类型误用 | {len(father_daughter_issues)} 条 | {'⚠️ 有问题' if father_daughter_issues else '✅ 通过'} |")
lines.append(f"| 缺少来源链接 | {len(no_source)} 条 | {'⚠️ 有问题' if no_source else '✅ 通过'} |")
lines.append("")

# 1
lines.append("## 1. 无效引用")
lines.append("")
if invalid_refs:
    missing_ids = set(r["missing_id"] for r in invalid_refs)
    lines.append(f"共 {len(invalid_refs)} 条引用指向不存在的人物 ID（涉及 {len(missing_ids)} 个缺失 ID）：")
    lines.append("")
    lines.append("| 关系 ID | 字段 | 缺失人物 ID |")
    lines.append("|---------|------|-------------|")
    for r in invalid_refs:
        lines.append(f"| `{r['id']}` | {r['field']} | `{r['missing_id']}` |")
    lines.append("")
    lines.append(f"**缺失人物 ID 汇总**: {', '.join(f'`{mid}`' for mid in sorted(missing_ids))}")
else:
    lines.append("✅ 所有 source/target 引用的人物 ID 均存在于 persons.json 中。")
lines.append("")

# 2
lines.append("## 2. 重复关系")
lines.append("")
if duplicates:
    lines.append(f"共 {len(duplicates)} 组重复关系：")
    lines.append("")
    lines.append("| 首条 ID | 重复 ID | source → target (type) |")
    lines.append("|---------|---------|------------------------|")
    for d in duplicates:
        lines.append(f"| `{d['first']}` | `{d['duplicate']}` | `{d['key'][0]}` → `{d['key'][1]}` ({d['key'][2]}) |")
else:
    lines.append("✅ 未发现重复关系（同一 source+target+type 对）。")
lines.append("")

# 3
lines.append("## 3. 自引用")
lines.append("")
if self_refs:
    lines.append(f"共 {len(self_refs)} 条自引用关系：")
    lines.append("")
    for r in self_refs:
        p = person_map.get(r["source"], {})
        lines.append(f"- `{r['id']}`: `{r['source']}` ({p.get('name', '?')}) → 自身 ({r['type']})")
else:
    lines.append("✅ 未发现 source == target 的自引用关系。")
lines.append("")

# 4
lines.append("## 4. 关系类型分布")
lines.append("")
lines.append(f"总关系数: **{total}**")
lines.append("")
lines.append("| 类型 | 中文标签 | 数量 | 占比 |")
lines.append("|------|---------|------|------|")
type_labels = {}
for r in relationships:
    if r["type"] not in type_labels:
        type_labels[r["type"]] = r.get("label", "-")
for t, count in type_counter.most_common():
    pct = count / total * 100
    flag = " ⚠️" if t == "colleagues" and pct > 30 else ""
    lines.append(f"| {t} | {type_labels.get(t, '-')} | {count} | {pct:.1f}%{flag} |")
lines.append("")
if colleague_pct > 30:
    lines.append(f"⚠️ **同僚(colleagues)关系占比 {colleague_pct:.1f}%，超过 30% 阈值。** 同僚关系是组合爆炸的来源（N 人小组产生 N*(N-1)/2 条关系）。建议：")
    lines.append("- 用 **group 实体**（如「五子良将」「五虎上将」「蜀汉四相」）代替两两配对关系")
    lines.append("- 只保留有实际协作/冲突故事的同僚关系")
    lines.append("- 移除纯粹「属于同一阵营」的泛泛同僚")
else:
    lines.append(f"✅ 同僚(colleagues)关系占比 {colleague_pct:.1f}%，低于 30% 阈值，类型分布合理。")
lines.append("")

# 5
lines.append("## 5. 孤立人物")
lines.append("")
lines.append(f"persons.json 中共 **{len(person_ids)}** 个人物，其中 **{len(isolated)}** 个（{isolation_pct:.1f}%）在 relationships.json 中完全没有出现。")
lines.append("")
if isolated:
    faction_groups = defaultdict(list)
    for pid in sorted(isolated):
        p = person_map.get(pid)
        faction = p.get("faction", "unknown") if p else "unknown"
        name = p.get("name", pid) if p else pid
        faction_groups[faction].append(f"`{pid}` ({name})")
    
    lines.append("各阵营孤立人物数量：")
    lines.append("")
    lines.append("| 阵营 | 孤立人物数 |")
    lines.append("|------|-----------|")
    for faction in sorted(faction_groups.keys()):
        lines.append(f"| {faction} | {len(faction_groups[faction])} |")
    lines.append("")
    lines.append("（完整孤立人物列表较长，此处省略。核心问题是 persons.json 远大于 relationships.json 的覆盖范围。）")
    lines.append("")
    lines.append("**建议**：这是正常的数据建设阶段现象——persons 先录入，relationships 逐步补充。优先为主要人物（君主、名将、重要谋士）补充关系。")
else:
    lines.append("✅ 所有人物都出现在至少一条关系中。")
lines.append("")

# 6
lines.append("## 6. 关系方向逻辑错误")
lines.append("")
if direction_errors:
    lines.append(f"共 {len(direction_errors)} 条 father-son 关系中父亲出生年晚于儿子：")
    lines.append("")
    lines.append("| 关系 ID | 父(source) | 父出生年 | 子(target) | 子出生年 |")
    lines.append("|---------|-----------|---------|-----------|---------|")
    for e in direction_errors:
        lines.append(f"| `{e['id']}` | {e['source_name']} | {e['source_birth']} | {e['target_name']} | {e['target_birth']} |")
else:
    lines.append("✅ 所有 father-son 关系中（有出生年数据的），父亲出生年均早于或等于儿子。")
lines.append("")

# 7
lines.append("## 7. 附加检查")
lines.append("")

lines.append("### 7.1 缺少 source_urls")
lines.append("")
if no_source:
    lines.append(f"共 {len(no_source)} 条关系没有 source_urls：")
    lines.append("")
    for r in no_source:
        lines.append(f"- `{r['id']}` ({r['type']}): {r['source']} → {r['target']}")
else:
    lines.append("✅ 所有关系都有 source_urls。")
lines.append("")

lines.append("### 7.2 父女关系使用 father-son 类型")
lines.append("")
if father_daughter_issues:
    lines.append(f"以下 {len(father_daughter_issues)} 条关系的 target 为女性，但使用了 `father-son` 类型（建议改为 `father-daughter` 或 `parent-child`）：")
    lines.append("")
    lines.append("| 关系 ID | 父亲 | 女儿 |")
    lines.append("|---------|------|------|")
    for item in father_daughter_issues:
        lines.append(f"| `{item['id']}` | {item['source_name']} | {item['target_name']} (`{item['target']}`) |")
else:
    lines.append("✅ 未发现父女关系误用 father-son 类型。")
lines.append("")

# Summary
lines.append("---")
lines.append("")
lines.append("## 总结")
lines.append("")

issues = []
if invalid_refs:
    issues.append(f"**{len(invalid_refs)} 条无效引用** — 需要在 persons.json 中补充缺失人物或修正 ID")
if duplicates:
    issues.append(f"**{len(duplicates)} 组重复关系** — 需要去重")
if self_refs:
    issues.append(f"**{len(self_refs)} 条自引用** — `{self_refs[0]['id']}` source==target，需修正")
if colleague_pct > 30:
    issues.append(f"**同僚关系占比 {colleague_pct:.1f}%** — 超过 30% 阈值，建议用 group 实体替代两两配对")
if isolation_pct >= 50:
    issues.append(f"**{len(isolated)} 个孤立人物 ({isolation_pct:.0f}%)** — persons 覆盖远超 relationships，需持续补充")
if direction_errors:
    issues.append(f"**{len(direction_errors)} 条方向逻辑错误** — 父亲出生年晚于儿子")
if father_daughter_issues:
    issues.append(f"**{len(father_daughter_issues)} 条父女关系类型不当** — 建议新增 `father-daughter` 或 `parent-child` 类型")
if no_source:
    issues.append(f"**{len(no_source)} 条关系缺少 source_urls** — 建议补充来源")

if not issues:
    lines.append("🎉 **数据质量良好**，未发现严重问题。")
else:
    lines.append(f"共发现以下数据质量问题：")
    lines.append("")
    for i, issue in enumerate(issues, 1):
        lines.append(f"{i}. ⚠️ {issue}")
    lines.append("")
    lines.append("### 优先级建议")
    lines.append("")
    lines.append("| 优先级 | 问题 | 原因 |")
    lines.append("|--------|------|------|")
    lines.append("| P0 (立即修) | 自引用 | 数据错误，影响图谱正确性 |")
    lines.append("| P1 (近期优化) | 同僚关系占比过高 | 引入 group 实体可大幅精简数据 |")
    lines.append("| P1 (近期优化) | 父女类型不当 | 语义不准确，影响前端展示 |")
    lines.append("| P2 (持续完善) | 孤立人物 | 正常的数据建设阶段，逐步补充即可 |")
    lines.append("| P2 (持续完善) | 缺少 source_urls | 补充来源提升可信度 |")

report = "\n".join(lines)
output_path = os.path.join(DATA_DIR, "audit", "relationships-audit.md")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w") as f:
    f.write(report)

print(f"Report written to {output_path}")
print(f"\nQuick summary:")
print(f"  Total relationships: {total}")
print(f"  Total persons: {len(person_ids)}")
print(f"  Invalid refs: {len(invalid_refs)}")
print(f"  Duplicates: {len(duplicates)}")
print(f"  Self-refs: {len(self_refs)}")
print(f"  Colleague %: {colleague_pct:.1f}%")
print(f"  Isolated persons: {len(isolated)} ({isolation_pct:.1f}%)")
print(f"  Direction errors: {len(direction_errors)}")
print(f"  Father-daughter mistype: {len(father_daughter_issues)}")
print(f"  Missing source_urls: {len(no_source)}")
