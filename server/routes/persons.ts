import { Router } from 'express';
import db from '../db.js';

const router = Router();

function formatPerson(p: any) {
  return { ...p, roles: JSON.parse(p.roles || '[]'), source_urls: JSON.parse(p.source_urls || '[]') };
}

function formatRel(r: any) {
  return { ...r, bidirectional: !!r.bidirectional, source_urls: JSON.parse(r.source_urls || '[]') };
}

function formatEvent(e: any) {
  return { ...e, participants: JSON.parse(e.participants || '[]'), source_urls: JSON.parse(e.source_urls || '[]') };
}

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(id) as any;
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const rels = db.prepare('SELECT * FROM relationships WHERE source = ? OR target = ?').all(id, id) as any[];

  const events = db.prepare(`
    SELECT e.* FROM events e
    WHERE EXISTS (
      SELECT 1 FROM json_each(e.participants) je
      WHERE json_extract(je.value, '$.person_id') = ?
    )
  `).all(id) as any[];

  res.json({
    person: formatPerson(person),
    relationships: rels.map(formatRel),
    events: events.map(formatEvent),
  });
});

router.get('/:id/network', (req, res) => {
  const { id } = req.params;
  const center = db.prepare('SELECT * FROM persons WHERE id = ?').get(id) as any;
  if (!center) return res.status(404).json({ error: 'Person not found' });

  const rels = db.prepare('SELECT * FROM relationships WHERE source = ? OR target = ?').all(id, id) as any[];

  const neighborIds = new Set<string>();
  rels.forEach(r => {
    neighborIds.add(r.source);
    neighborIds.add(r.target);
  });
  neighborIds.delete(id);

  const neighborPlaceholders = [...neighborIds].map(() => '?').join(',');
  const neighbors = neighborIds.size > 0
    ? db.prepare(`SELECT * FROM persons WHERE id IN (${neighborPlaceholders})`).all(...neighborIds) as any[]
    : [];

  const allIds = [id, ...neighborIds];
  const allPlaceholders = allIds.map(() => '?').join(',');
  const allRels = allIds.length > 1
    ? db.prepare(
        `SELECT * FROM relationships WHERE source IN (${allPlaceholders}) AND target IN (${allPlaceholders})`
      ).all(...allIds, ...allIds) as any[]
    : rels;

  res.json({
    center: formatPerson(center),
    neighbors: neighbors.map(formatPerson),
    relationships: allRels.map(formatRel),
  });
});

export default router;
