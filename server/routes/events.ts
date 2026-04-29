import { Router } from 'express';
import db from '../db.js';

const router = Router();

function formatEvent(e: any) {
  return { ...e, participants: JSON.parse(e.participants || '[]'), source_urls: JSON.parse(e.source_urls || '[]') };
}

function formatPerson(p: any) {
  return { ...p, roles: JSON.parse(p.roles || '[]'), source_urls: JSON.parse(p.source_urls || '[]') };
}

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const parsed = JSON.parse(event.participants || '[]') as { person_id: string; role: string }[];
  const personIds = parsed.map(p => p.person_id);
  const placeholders = personIds.map(() => '?').join(',');
  const persons = personIds.length > 0
    ? db.prepare(`SELECT * FROM persons WHERE id IN (${placeholders})`).all(...personIds) as any[]
    : [];

  res.json({
    event: formatEvent(event),
    participants: persons.map(formatPerson),
  });
});

export default router;
