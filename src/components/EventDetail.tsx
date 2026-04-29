import { useEffect, useState } from 'react';
import { Tag, Typography, Divider, Spin } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { fetchEventDetail, personMap } from '../data';
import type { Person } from '../types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  battle: '战役',
  political: '政治',
  diplomatic: '外交',
  cultural: '文化',
  death: '死亡',
  rebellion: '叛乱',
  succession: '继承',
  other: '其他',
};

export default function EventDetail() {
  const { state, dispatch } = useApp();
  const event = state.selectedEvent;
  const [participants, setParticipants] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event) { setParticipants([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchEventDetail(event.id).then(data => {
      if (cancelled) return;
      data.participants.forEach(p => { personMap[p.id] = p; });
      setParticipants(data.participants);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event) return null;

  const handlePersonClick = (personId: string) => {
    const p = personMap[personId];
    if (p) {
      if (!state.selectedFactions.includes(p.faction)) {
        dispatch({ type: 'SET_FACTIONS', payload: [...state.selectedFactions, p.faction] });
      }
      dispatch({ type: 'SET_SELECTED_PERSON', payload: p });
      dispatch({ type: 'SET_HIGHLIGHT', payload: p.id });
    }
  };

  const participantMap: Record<string, Person> = {};
  participants.forEach(p => { participantMap[p.id] = p; });

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>{event.name}</Typography.Title>

      <Tag>{EVENT_TYPE_LABELS[event.type] || event.type}</Tag>
      <Tag>{event.year}年{event.end_year ? ` - ${event.end_year}年` : ''}</Tag>
      {event.location && <Tag>{event.location}</Tag>}

      <Typography.Paragraph style={{ marginTop: 12 }}>
        {event.description}
      </Typography.Paragraph>

      {event.result && (
        <>
          <Divider>结果</Divider>
          <Typography.Paragraph>{event.result}</Typography.Paragraph>
        </>
      )}

      {loading ? <Spin /> : event.participants.length > 0 && (
        <>
          <Divider>参与人物 ({event.participants.length})</Divider>
          {event.participants.map(p => {
            const person = participantMap[p.person_id] || personMap[p.person_id];
            return (
              <div key={p.person_id} style={{ padding: '4px 0' }}>
                <a
                  onClick={() => handlePersonClick(p.person_id)}
                  style={{ cursor: 'pointer' }}
                >
                  {person?.name || p.person_id}
                </a>
                <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{p.role}</span>
              </div>
            );
          })}
        </>
      )}

      {event.source_urls.length > 0 && (
        <>
          <Divider>来源</Divider>
          {event.source_urls.map((url, i) => (
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
