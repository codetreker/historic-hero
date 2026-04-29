import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pinyin from 'tiny-pinyin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(__dirname, '..', 'historic-hero.db');

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE persons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    courtesy_name TEXT,
    title TEXT,
    faction TEXT NOT NULL,
    roles TEXT,
    birth_year INTEGER,
    death_year INTEGER,
    birth_place TEXT,
    description TEXT,
    source_urls TEXT,
    importance_score INTEGER DEFAULT 0,
    pinyin TEXT,
    pinyin_initials TEXT
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
    participants TEXT,
    result TEXT,
    source_urls TEXT
  );

  CREATE INDEX idx_persons_faction ON persons(faction);
  CREATE INDEX idx_persons_name ON persons(name);
  CREATE INDEX idx_persons_pinyin ON persons(pinyin);
  CREATE INDEX idx_persons_pinyin_initials ON persons(pinyin_initials);
  CREATE INDEX idx_rels_source ON relationships(source);
  CREATE INDEX idx_rels_target ON relationships(target);
  CREATE INDEX idx_events_year ON events(year);
`);

const ROLE_WEIGHTS: Record<string, number> = {
  emperor: 100, warlord: 80, strategist: 60, advisor: 60,
  minister: 40, general: 30, politician: 30, scholar: 20,
  noble: 20, consort: 15, poet: 15, regent: 50,
  calligrapher: 10, musician: 10, rebel: 10, foreigner: 10,
  other: 10, eunuch: 5,
};

const REL_WEIGHTS: Record<string, number> = {
  'lord-vassal': 5, 'father-son': 5, 'rivals': 4,
  'killed-by': 4, 'betrayal': 3, 'sworn-brothers': 3,
  'husband-wife': 3, 'master-student': 3, 'allies': 2,
  'brothers': 2, 'successor': 2, 'mother-son': 2,
  'in-law': 1, 'friends': 1, 'subordinate': 1,
  'colleagues': 0,
};

function toPinyinStr(text: string): string {
  return pinyin.convertToPinyin(text, '', true).toLowerCase();
}

function toPinyinInitials(text: string): string {
  const parsed = pinyin.parse(text);
  return parsed.map((item: any) => {
    if (item.type === 2) return item.target.charAt(0).toLowerCase();
    return item.source.charAt(0).toLowerCase();
  }).join('');
}

interface PersonData {
  id: string; name: string; courtesy_name?: string; title?: string;
  faction: string; roles: string[]; birth_year?: number; death_year?: number;
  birth_place?: string; description: string; source_urls: string[];
}
interface RelData {
  id: string; source: string; target: string; type: string; label: string;
  description?: string; bidirectional: boolean; start_year?: number;
  end_year?: number; source_urls: string[];
}
interface EventData {
  id: string; name: string; year: number; end_year?: number; location?: string;
  type: string; description: string; participants: { person_id: string; role: string }[];
  result?: string; source_urls: string[];
}

const persons: PersonData[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'persons.json'), 'utf-8'));
const relationships: RelData[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'relationships.json'), 'utf-8'));
const events: EventData[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf-8'));

// Compute importance scores
const importanceMap: Record<string, number> = {};
persons.forEach(p => {
  let score = 0;
  p.roles.forEach(r => { score += ROLE_WEIGHTS[r] || 10; });
  const personRels = relationships.filter(r => r.source === p.id || r.target === p.id);
  personRels.forEach(r => { score += REL_WEIGHTS[r.type] || 0; });
  importanceMap[p.id] = score;
});

const insertPerson = db.prepare(`
  INSERT INTO persons (id, name, courtesy_name, title, faction, roles, birth_year, death_year, birth_place, description, source_urls, importance_score, pinyin, pinyin_initials)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRel = db.prepare(`
  INSERT INTO relationships (id, source, target, type, label, description, bidirectional, start_year, end_year, source_urls)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEvent = db.prepare(`
  INSERT INTO events (id, name, year, end_year, location, type, description, participants, result, source_urls)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAll = db.transaction(() => {
  for (const p of persons) {
    insertPerson.run(
      p.id, p.name, p.courtesy_name ?? null, p.title ?? null, p.faction,
      JSON.stringify(p.roles), p.birth_year ?? null, p.death_year ?? null,
      p.birth_place ?? null, p.description, JSON.stringify(p.source_urls),
      importanceMap[p.id] || 0, toPinyinStr(p.name), toPinyinInitials(p.name)
    );
  }
  for (const r of relationships) {
    insertRel.run(
      r.id, r.source, r.target, r.type, r.label, r.description ?? null,
      r.bidirectional ? 1 : 0, r.start_year ?? null, r.end_year ?? null,
      JSON.stringify(r.source_urls)
    );
  }
  for (const e of events) {
    insertEvent.run(
      e.id, e.name, e.year, e.end_year ?? null, e.location ?? null, e.type,
      e.description, JSON.stringify(e.participants), e.result ?? null,
      JSON.stringify(e.source_urls)
    );
  }
});

insertAll();

console.log(`Imported ${persons.length} persons, ${relationships.length} relationships, ${events.length} events`);
console.log(`Database: ${dbPath}`);
db.close();
