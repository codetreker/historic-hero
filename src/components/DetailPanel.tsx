import { useEffect, useState } from 'react';
import { Tag, Descriptions, Divider, Typography, Space, Spin } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { fetchPersonDetail, personMap } from '../data';
import { FACTION_CONFIG, ROLE_CONFIG } from '../types';
import type { Relationship, HistoricalEvent, RelationType } from '../types';

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

export default function PersonDetail() {
  const { state, dispatch } = useApp();
  const person = state.selectedPerson;
  const [rels, setRels] = useState<Relationship[]>([]);
  const [personEvents, setPersonEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!person) { setRels([]); setPersonEvents([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchPersonDetail(person.id).then(data => {
      if (cancelled) return;
      setRels(data.relationships);
      setPersonEvents(data.events);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [person?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!person) return null;

  const relsByType: Record<string, { id: string; name: string; direction: string }[]> = {};
  rels.forEach(r => {
    const type = r.type;
    if (!relsByType[type]) relsByType[type] = [];
    const otherId = r.source === person.id ? r.target : r.source;
    const other = personMap[otherId];
    const direction = r.bidirectional ? '↔' : (r.source === person.id ? '→' : '←');
    relsByType[type].push({ id: otherId, name: other?.name || otherId, direction });
  });

  const handlePersonClick = (personId: string) => {
    const p = personMap[personId];
    if (p) {
      if (state.expandedFaction !== p.faction) {
        dispatch({ type: 'EXPAND_FACTION', payload: p.faction });
      }
      dispatch({ type: 'SET_EXPANDED_PERSON', payload: p.id });
      dispatch({ type: 'SET_SELECTED_PERSON', payload: p });
      dispatch({ type: 'SET_HIGHLIGHT', payload: p.id });
    }
  };

  const factionConfig = FACTION_CONFIG[person.faction];

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        {person.name}
        {person.courtesy_name && (
          <span style={{ color: '#999', marginLeft: 8, fontWeight: 'normal', fontSize: 14 }}>
            字：{person.courtesy_name}
          </span>
        )}
      </Typography.Title>

      <Space wrap style={{ marginBottom: 12 }}>
        <Tag color={factionConfig?.color}>{factionConfig?.label}</Tag>
        {person.roles?.map(role => (
          <Tag key={role}>{ROLE_CONFIG[role]?.label || role}</Tag>
        ))}
      </Space>

      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="生卒">
          {person.birth_year || '?'} - {person.death_year || '?'}
        </Descriptions.Item>
        {person.birth_place && (
          <Descriptions.Item label="籍贯">{person.birth_place}</Descriptions.Item>
        )}
        {person.title && (
          <Descriptions.Item label="谥号">{person.title}</Descriptions.Item>
        )}
      </Descriptions>

      <Typography.Paragraph style={{ marginTop: 12 }}>
        {person.description}
      </Typography.Paragraph>

      {loading ? <Spin /> : (
        <>
          {rels.length > 0 && (
            <>
              <Divider>关系 ({rels.length})</Divider>
              {Object.entries(relsByType).map(([type, items]) => (
                <div key={type} style={{ marginBottom: 12 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {REL_TYPE_LABELS[type as RelationType] || type}
                  </Typography.Text>
                  <div style={{ paddingLeft: 12, marginTop: 4 }}>
                    {items.map(item => (
                      <span key={item.id} style={{ marginRight: 8 }}>
                        {item.direction}{' '}
                        <a onClick={() => handlePersonClick(item.id)} style={{ cursor: 'pointer' }}>
                          {item.name}
                        </a>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {personEvents.length > 0 && (
            <>
              <Divider>参与事件 ({personEvents.length})</Divider>
              {personEvents
                .sort((a, b) => a.year - b.year)
                .map(evt => (
                  <div
                    key={evt.id}
                    style={{ cursor: 'pointer', padding: '4px 0', color: '#1677ff' }}
                    onClick={() => dispatch({ type: 'SET_SELECTED_EVENT', payload: evt })}
                  >
                    {evt.year} {evt.name}
                  </div>
                ))}
            </>
          )}
        </>
      )}

      {person.source_urls.length > 0 && (
        <>
          <Divider>来源</Divider>
          {person.source_urls.map((url, i) => (
            <div key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <LinkOutlined /> {new URL(url).hostname}
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
