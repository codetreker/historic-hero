import { Badge, Space, Typography } from 'antd';
import { FACTION_CONFIG } from '../types';
import type { Faction, RelationType } from '../types';

const RELATION_COLORS: Record<string, string> = {
  'lord-vassal': '#1677ff',
  'father-son': '#52c41a',
  'brothers': '#13c2c2',
  'husband-wife': '#eb2f96',
  'rivals': '#f5222d',
  'betrayal': '#fa541c',
  'sworn-brothers': '#faad14',
  'killed-by': '#000000',
  'master-student': '#722ed1',
  'allies': '#2f54eb',
};

const REL_TYPE_LABELS: Record<string, string> = {
  'lord-vassal': '君臣',
  'father-son': '父子',
  'brothers': '兄弟',
  'husband-wife': '夫妻',
  'rivals': '对手',
  'betrayal': '背叛',
  'sworn-brothers': '结义',
  'killed-by': '被杀',
  'master-student': '师徒',
  'allies': '同盟',
};

const RELATION_DASH: Record<string, string> = {
  'rivals': '6,3',
  'betrayal': '4,4',
  'allies': '8,4',
};

export default function Legend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 8,
      left: 8,
      background: 'rgba(255,255,255,0.92)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      zIndex: 10,
      maxWidth: 200,
    }}>
      <Typography.Text strong style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>阵营</Typography.Text>
      <Space wrap size={[8, 2]}>
        {(Object.keys(FACTION_CONFIG) as Faction[]).map(f => (
          <span key={f}>
            <Badge color={FACTION_CONFIG[f].color} text={FACTION_CONFIG[f].label} />
          </span>
        ))}
      </Space>

      <Typography.Text strong style={{ fontSize: 11, display: 'block', marginTop: 8, marginBottom: 4 }}>关系</Typography.Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(Object.keys(RELATION_COLORS) as RelationType[]).map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={24} height={8}>
              <line
                x1={0} y1={4} x2={24} y2={4}
                stroke={RELATION_COLORS[t]}
                strokeWidth={2}
                strokeDasharray={RELATION_DASH[t] || ''}
              />
            </svg>
            <span>{REL_TYPE_LABELS[t]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
