import type { Person, Relationship, HistoricalEvent, Faction, Role } from '../types';

const BASE = '/api';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface FactionStat {
  id: string;
  name: string;
  count: number;
  color: string;
}

export interface CrossFactionRel {
  source: string;
  target: string;
  count: number;
}

export interface FactionOverview {
  factions: FactionStat[];
  crossFactionRels: CrossFactionRel[];
}

export interface FactionTopResult {
  persons: Person[];
  relationships: Relationship[];
}

export interface NetworkResult {
  center: Person;
  neighbors: Person[];
  relationships: Relationship[];
}

export interface SearchResult {
  id: string;
  name: string;
  courtesy_name: string | null;
  faction: Faction;
  roles: Role[];
}

export interface PersonDetail {
  person: Person;
  relationships: Relationship[];
  events: HistoricalEvent[];
}

export interface EventDetail {
  event: HistoricalEvent;
  participants: Person[];
}

export const api = {
  getFactions: () => get<FactionOverview>('/factions'),

  getFactionTop: (faction: string, limit = 15) =>
    get<FactionTopResult>(`/factions/${faction}/top?limit=${limit}`),

  getPersonNetwork: (id: string) =>
    get<NetworkResult>(`/persons/${id}/network`),

  search: (q: string, limit = 10) =>
    get<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getPerson: (id: string) =>
    get<PersonDetail>(`/persons/${id}`),

  getEvent: (id: string) =>
    get<EventDetail>(`/events/${id}`),

  getStats: () =>
    get<{ roleCounts: Record<string, number>; relTypeCounts: Record<string, number> }>('/factions/stats'),
};
