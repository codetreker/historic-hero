import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (!q) return res.json({ results: [] });

  const results = db.prepare(`
    SELECT id, name, courtesy_name, faction, roles, importance_score
    FROM persons
    WHERE name LIKE ? OR courtesy_name LIKE ? OR pinyin LIKE ? OR pinyin_initials LIKE ?
    ORDER BY
      CASE WHEN name = ? THEN 0 ELSE 1 END,
      importance_score DESC
    LIMIT ?
  `).all(`%${q}%`, `%${q}%`, `${q}%`, `${q}%`, q, limit) as any[];

  res.json({
    results: results.map(r => ({
      id: r.id,
      name: r.name,
      courtesy_name: r.courtesy_name,
      faction: r.faction,
      roles: JSON.parse(r.roles || '[]'),
    })),
  });
});

export default router;
