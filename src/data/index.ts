import type { Person, Relationship, Faction } from '../types';
import { api } from '../api';
import type { FactionOverview, FactionTopResult, NetworkResult } from '../api';

export type { FactionOverview, FactionTopResult, NetworkResult };

export const personMap: Record<string, Person> = {};

function indexPersons(persons: Person[]) {
  persons.forEach(p => { personMap[p.id] = p; });
}

function buildRelsByPerson(relationships: Relationship[]): Record<string, Relationship[]> {
  const map: Record<string, Relationship[]> = {};
  relationships.forEach(r => {
    (map[r.source] ??= []).push(r);
    (map[r.target] ??= []).push(r);
  });
  return map;
}

export async function fetchFactions(): Promise<FactionOverview> {
  return api.getFactions();
}

export async function fetchFactionTop(faction: Faction, limit = 15): Promise<FactionTopResult> {
  const result = await api.getFactionTop(faction, limit);
  indexPersons(result.persons);
  return result;
}

export async function fetchPersonNetwork(id: string): Promise<NetworkResult & { relsByPerson: Record<string, Relationship[]> }> {
  const result = await api.getPersonNetwork(id);
  const allPersons = [result.center, ...result.neighbors];
  indexPersons(allPersons);
  return { ...result, relsByPerson: buildRelsByPerson(result.relationships) };
}

export async function searchPersons(q: string) {
  const result = await api.search(q);
  return result.results;
}

export async function fetchPersonDetail(id: string) {
  const result = await api.getPerson(id);
  personMap[result.person.id] = result.person;
  return result;
}

export async function fetchEventDetail(id: string) {
  return api.getEvent(id);
}
