import { Select, Space } from 'antd';
import { FACTION_CONFIG, ROLE_CONFIG } from '../types';
import type { Faction, Role } from '../types';

interface Props {
  onFactionChange?: (factions: Faction[]) => void;
  onRoleChange?: (roles: Role[]) => void;
}

export default function FilterPanel({ onFactionChange, onRoleChange }: Props) {
  return (
    <Space>
      <Select
        mode="multiple"
        placeholder="筛选阵营"
        style={{ minWidth: 200 }}
        onChange={onFactionChange}
        options={Object.entries(FACTION_CONFIG).map(([value, { label }]) => ({ value, label }))}
      />
      <Select
        mode="multiple"
        placeholder="筛选身份"
        style={{ minWidth: 200 }}
        onChange={onRoleChange}
        options={Object.entries(ROLE_CONFIG).map(([value, { label }]) => ({ value, label }))}
      />
    </Space>
  );
}
