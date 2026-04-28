import type { Person, Relationship, HistoricalEvent } from '../types';
import personsData from '../../data/persons.json';
import relationshipsData from '../../data/relationships.json';
import eventsData from '../../data/events.json';

export const persons: Person[] = personsData as Person[];
export const relationships: Relationship[] = relationshipsData as Relationship[];
export const events: HistoricalEvent[] = eventsData as HistoricalEvent[];
