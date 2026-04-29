import { Router } from 'express';
import db from '../db.js';

const router = Router();

const FACTION_CONFIG: Record<string, { label: string; color: string }> = {
  wei: { label: '曹魏', color: '#1677ff' },
  shu: { label: '蜀汉', color: '#52c41a' },
  wu: { label: '东吴', color: '#fa541c' },
  han: { label: '东汉', color: '#722ed1' },
  jin: { label: '西晋', color: '#faad14' },
  other: { label: '其他', color: '#8c8c8c' },
};

router.get('/', (_req, res) => {
  const counts = db.prepare('SELECT faction, COUNT(*) as count FROM persons GROUP BY faction').all() as { faction: string; count: number }[];
  const countMap: Record<string, number> = {};
  counts.forEach(r => { countMap[r.faction] = r.count; });

  const factions = Object.entries(FACTION_CONFIG).map(([id, cfg]) => ({
    id, name: cfg.label, count: countMap[id] || 0, color: cfg.color,
  }));

  const crossRows = db.prepare(`
    SELECT p1.faction as sf, p2.faction as tf, COUNT(*) as count
    FROM relationships r
    JOIN persons p1 ON r.source = p1.id
    JOIN persons p2 ON r.target = p2.id
    WHERE p1.faction != p2.faction
    GROUP BY p1.faction, p2.faction
  `).all() as { sf: string; tf: string; count: number }[];

  const pairCount: Record<string, number> = {};
  crossRows.forEach(r => {
    const key = [r.sf, r.tf].sort().join('-');
    pairCount[key] = (pairCount[key] || 0) + r.count;
  });

  const crossFactionRels = Object.entries(pairCount).map(([key, count]) => {
    const [source, target] = key.split('-');
    return { source, target, count };
  });

  res.json({ factions, crossFactionRels });
});

router.get('/:faction/top', (req, res) => {
  const { faction } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 17, 50);

  const nativePersons = db.prepare(
    'SELECT * FROM persons WHERE faction = ? ORDER BY importance_score DESC LIMIT ?'
  ).all(faction, limit) as any[];

  const crossCandidates = db.prepare(`
    SELECT p.*, COUNT(r.id) as cross_rel_count FROM persons p
    JOIN relationships r ON (r.source = p.id OR r.target = p.id)
    JOIN persons p2 ON (CASE WHEN r.source = p.id THEN r.target ELSE r.source END) = p2.id
    WHERE p.faction != ? AND p2.faction = ? AND r.type != 'colleagues'
    GROUP BY p.id
    HAVING cross_rel_count >= 8 AND p.importance_score >= 200
    ORDER BY p.importance_score DESC
  `).all(faction, faction) as any[];

  const maxNative = limit - crossCandidates.length;
  const topNative = nativePersons.slice(0, Math.max(maxNative, 0));
  const allPersons = [...topNative, ...crossCandidates]
    .sort((a: any, b: any) => b.importance_score - a.importance_score);

  const personIds = allPersons.map((p: any) => p.id);
  const placeholders = personIds.map(() => '?').join(',');

  const rels = personIds.length > 0
    ? db.prepare(
        `SELECT * FROM relationships WHERE source IN (${placeholders}) AND target IN (${placeholders})`
      ).all(...personIds, ...personIds) as any[]
    : [];

  const formatPerson = (p: any) => ({
    ...p,
    roles: JSON.parse(p.roles || '[]'),
    source_urls: JSON.parse(p.source_urls || '[]'),
    bidirectional: undefined,
  });

  const formatRel = (r: any) => ({
    ...r,
    bidirectional: !!r.bidirectional,
    source_urls: JSON.parse(r.source_urls || '[]'),
  });

  res.json({
    persons: allPersons.map(formatPerson),
    relationships: rels.map(formatRel),
  });
});

router.get('/stats', (_req, res) => {
  const roleCounts: Record<string, number> = {};
  const rows = db.prepare("SELECT roles FROM persons").all() as { roles: string }[];
  rows.forEach(r => {
    const roles = JSON.parse(r.roles || '[]') as string[];
    roles.forEach(role => { roleCounts[role] = (roleCounts[role] || 0) + 1; });
  });

  const relTypeCounts: Record<string, number> = {};
  const relRows = db.prepare("SELECT type, COUNT(*) as c FROM relationships GROUP BY type").all() as { type: string; c: number }[];
  relRows.forEach(r => { relTypeCounts[r.type] = r.c; });

  res.json({ roleCounts, relTypeCounts });
});

export default router;
