import type { Person, Relationship, HistoricalEvent, Faction, Role } from '../types';
import pinyin from 'tiny-pinyin';
import personsData from '../../data/persons.json';
import relationshipsData from '../../data/relationships.json';
import eventsData from '../../data/events.json';

export const persons: Person[] = personsData as Person[];
export const relationships: Relationship[] = relationshipsData as Relationship[];
export const events: HistoricalEvent[] = eventsData as HistoricalEvent[];

export const personMap: Record<string, Person> = {};
persons.forEach(p => { personMap[p.id] = p; });

export const degreeMap: Record<string, number> = {};
relationships.forEach(r => {
  degreeMap[r.source] = (degreeMap[r.source] || 0) + 1;
  degreeMap[r.target] = (degreeMap[r.target] || 0) + 1;
});

export const relsByPerson: Record<string, Relationship[]> = {};
relationships.forEach(r => {
  (relsByPerson[r.source] ??= []).push(r);
  (relsByPerson[r.target] ??= []).push(r);
});

export const eventsByPerson: Record<string, HistoricalEvent[]> = {};
events.forEach(e => {
  e.participants.forEach(p => {
    (eventsByPerson[p.person_id] ??= []).push(e);
  });
});

export const factionCounts: Record<Faction, number> = { wei: 0, shu: 0, wu: 0, han: 0, jin: 0, other: 0 };
persons.forEach(p => { factionCounts[p.faction] = (factionCounts[p.faction] || 0) + 1; });

export const roleCounts: Record<Role, number> = {} as Record<Role, number>;
persons.forEach(p => {
  p.roles.forEach(r => { roleCounts[r] = (roleCounts[r] || 0) + 1; });
});

export const relTypeCounts: Record<string, number> = {};
relationships.forEach(r => { relTypeCounts[r.type] = (relTypeCounts[r.type] || 0) + 1; });

// Meaningful degree: excludes 'colleagues' (inflated by bulk generation)
export const meaningfulDegreeMap: Record<string, number> = {};
relationships.forEach(r => {
  if (r.type !== 'colleagues') {
    meaningfulDegreeMap[r.source] = (meaningfulDegreeMap[r.source] || 0) + 1;
    meaningfulDegreeMap[r.target] = (meaningfulDegreeMap[r.target] || 0) + 1;
  }
});

export const factionStats: Record<Faction, { count: number; topPersons: Person[] }> = {} as any;
(Object.keys(factionCounts) as Faction[]).forEach(f => {
  const factionPersons = persons.filter(p => p.faction === f);
  const sorted = [...factionPersons].sort((a, b) => (meaningfulDegreeMap[b.id] || 0) - (meaningfulDegreeMap[a.id] || 0));
  factionStats[f] = { count: factionPersons.length, topPersons: sorted.slice(0, 15) };
});

export const crossFactionRels: { source: Faction; target: Faction; count: number }[] = [];
{
  const pairCount: Record<string, number> = {};
  relationships.forEach(r => {
    const sf = personMap[r.source]?.faction;
    const tf = personMap[r.target]?.faction;
    if (!sf || !tf || sf === tf) return;
    const key = [sf, tf].sort().join('-');
    pairCount[key] = (pairCount[key] || 0) + 1;
  });
  Object.entries(pairCount).forEach(([key, count]) => {
    const [s, t] = key.split('-') as [Faction, Faction];
    crossFactionRels.push({ source: s, target: t, count });
  });
}

export interface SearchEntry {
  id: string;
  name: string;
  courtesyName: string | null;
  faction: Faction;
  roles: Role[];
  pinyinName: string;
  pinyinInitials: string;
}

function toPinyin(text: string): string {
  return pinyin.convertToPinyin(text, '', true).toLowerCase();
}

function toPinyinInitials(text: string): string {
  const parsed = pinyin.parse(text);
  return parsed.map(item => {
    if (item.type === 2) {
      return item.target.charAt(0).toLowerCase();
    }
    return item.source.charAt(0).toLowerCase();
  }).join('');
}

export const searchIndex: SearchEntry[] = persons.map(p => ({
  id: p.id,
  name: p.name,
  courtesyName: p.courtesy_name ?? null,
  faction: p.faction,
  roles: p.roles,
  pinyinName: toPinyin(p.name),
  pinyinInitials: toPinyinInitials(p.name),
}));

export function search(query: string): SearchEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return searchIndex
    .filter(entry =>
      entry.name.includes(q) ||
      (entry.courtesyName && entry.courtesyName.includes(q)) ||
      entry.pinyinName.startsWith(q) ||
      entry.pinyinInitials.startsWith(q)
    )
    .sort((a, b) => {
      const aExact = a.name === q ? 0 : 1;
      const bExact = b.name === q ? 0 : 1;
      return aExact - bExact;
    })
    .slice(0, 10);
}
