import { useEffect, useState } from 'react';
import { Checkbox, Collapse, Button, Space, Badge } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { FACTION_CONFIG, ROLE_CONFIG } from '../types';
import type { Faction, Role, RelationType } from '../types';
import { fetchFactions } from '../data';
import { api } from '../api';

const REL_TYPE_LABELS: Record<RelationType, string> = {
  'lord-vassal': '君臣',
  'father-son': '父子',
  'mother-son': '母子',
  'brothers': '兄弟',
  'husband-wife': '夫妻',
  'rivals': '对手',
  'betrayal': '背叛',
  'sworn-brothers': '结义',
  'killed-by': '被杀',
  'master-student': '师徒',
  'allies': '同盟',
  'friends': '友人',
  'in-law': '姻亲',
  'colleagues': '同僚',
  'subordinate': '下属',
  'successor': '继任',
};

export default function FilterPanel() {
  const { state, dispatch } = useApp();
  const [factionCounts, setFactionCounts] = useState<Record<string, number>>({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [relTypeCounts, setRelTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchFactions().then(data => {
      const counts: Record<string, number> = {};
      data.factions.forEach(f => { counts[f.id] = f.count; });
      setFactionCounts(counts);
    }).catch(() => {});
    api.getStats().then(data => {
      setRoleCounts(data.roleCounts);
      setRelTypeCounts(data.relTypeCounts);
    }).catch(() => {});
  }, []);

  const isOverview = state.viewMode === 'overview';

  const factionOptions = (Object.keys(FACTION_CONFIG) as Faction[]).map(f => ({
    label: (
      <span>
        <Badge color={FACTION_CONFIG[f].color} />
        {FACTION_CONFIG[f].label} ({factionCounts[f] || 0})
      </span>
    ),
    value: f,
  }));

  const roleOptions = (Object.keys(ROLE_CONFIG) as Role[]).map(r => ({
    label: `${ROLE_CONFIG[r].label} (${roleCounts[r] || 0})`,
    value: r,
  }));

  const relTypeOptions = (Object.keys(REL_TYPE_LABELS) as RelationType[]).map(t => ({
    label: `${REL_TYPE_LABELS[t]} (${relTypeCounts[t] || 0})`,
    value: t,
  }));

  const items = [
    {
      key: 'faction',
      label: '阵营',
      children: (
        <Checkbox.Group
          options={factionOptions}
          value={state.selectedFactions}
          onChange={(v) => dispatch({ type: 'SET_FACTIONS', payload: v as Faction[] })}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      ),
    },
    {
      key: 'role',
      label: '身份',
      children: (
        <Checkbox.Group
          options={roleOptions}
          value={state.selectedRoles}
          onChange={(v) => dispatch({ type: 'SET_ROLES', payload: v as Role[] })}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      ),
    },
    {
      key: 'relType',
      label: '关系类型',
      children: (
        <Checkbox.Group
          options={relTypeOptions}
          value={state.selectedRelTypes}
          onChange={(v) => dispatch({ type: 'SET_REL_TYPES', payload: v as RelationType[] })}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      ),
    },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '12px 0' }}>
      {isOverview && (
        <div style={{ padding: '8px 16px', color: '#999', textAlign: 'center', fontSize: 13 }}>
          点击阵营节点查看详情
        </div>
      )}
      <Collapse
        defaultActiveKey={['faction', 'role', 'relType']}
        ghost
        items={items}
      />
      <Space style={{ padding: '12px 16px' }}>
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
        >
          清除所有过滤
        </Button>
      </Space>
    </div>
  );
}
