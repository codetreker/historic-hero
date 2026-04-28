export type Faction = 'wei' | 'shu' | 'wu' | 'han' | 'jin' | 'other';

export type Role =
  | 'emperor' | 'general' | 'strategist' | 'minister'
  | 'warlord' | 'scholar' | 'consort' | 'eunuch'
  | 'rebel' | 'foreigner' | 'other'
  | 'poet' | 'politician' | 'advisor' | 'calligrapher'
  | 'musician' | 'noble' | 'regent';

export type RelationType = 
  | 'father-son' | 'mother-son' | 'brothers' | 'husband-wife'
  | 'lord-vassal' | 'master-student' | 'allies' | 'rivals'
  | 'friends' | 'sworn-brothers' | 'betrayal' | 'in-law'
  | 'colleagues' | 'subordinate' | 'successor' | 'killed-by';

export type EventType = 
  | 'battle' | 'political' | 'diplomatic' | 'cultural'
  | 'death' | 'rebellion' | 'succession' | 'other';

export interface Person {
  id: string;
  name: string;
  courtesy_name?: string | null;
  title?: string | null;
  faction: Faction;
  roles: Role[];
  birth_year?: number | null;
  death_year?: number | null;
  birth_place?: string | null;
  description: string;
  source_urls: string[];
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  label: string;
  description?: string | null;
  bidirectional: boolean;
  start_year?: number | null;
  end_year?: number | null;
  source_urls: string[];
}

export interface HistoricalEvent {
  id: string;
  name: string;
  year: number;
  end_year?: number | null;
  location?: string | null;
  type: EventType;
  description: string;
  participants: { person_id: string; role: string }[];
  result?: string | null;
  source_urls: string[];
}

export const FACTION_CONFIG: Record<Faction, { label: string; color: string }> = {
  wei: { label: '曹魏', color: '#1677ff' },
  shu: { label: '蜀汉', color: '#52c41a' },
  wu: { label: '东吴', color: '#fa541c' },
  han: { label: '东汉', color: '#722ed1' },
  jin: { label: '西晋', color: '#faad14' },
  other: { label: '其他', color: '#8c8c8c' },
};

export const ROLE_CONFIG: Record<Role, { label: string }> = {
  emperor: { label: '帝王' },
  general: { label: '武将' },
  strategist: { label: '谋士' },
  minister: { label: '文臣' },
  warlord: { label: '诸侯' },
  scholar: { label: '文人' },
  consort: { label: '后妃' },
  eunuch: { label: '宦官' },
  rebel: { label: '起义者' },
  foreigner: { label: '异族' },
  other: { label: '其他' },
  poet: { label: '诗人' },
  politician: { label: '政治家' },
  advisor: { label: '谋臣' },
  calligrapher: { label: '书法家' },
  musician: { label: '乐师' },
  noble: { label: '贵族' },
  regent: { label: '摄政' },
};
