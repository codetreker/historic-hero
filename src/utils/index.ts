import type { Faction } from '../types';
import { FACTION_CONFIG } from '../types';

export function getFactionColor(faction: Faction): string {
  return FACTION_CONFIG[faction]?.color ?? '#8c8c8c';
}

export function getFactionLabel(faction: Faction): string {
  return FACTION_CONFIG[faction]?.label ?? '其他';
}
