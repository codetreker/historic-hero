import { Drawer, Tag, Typography, Divider } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { personMap } from '../data';

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

  return (
    <Drawer
      title={event.name}
      open={state.drawerVisible && state.drawerMode === 'event'}
      onClose={() => dispatch({ type: 'TOGGLE_DRAWER', payload: { visible: false } })}
      width={420}
    >
      <Tag>{EVENT_TYPE_LABELS[event.type] || event.type}</Tag>
      <Tag>{event.year}年{event.end_year ? ` - ${event.end_year}年` : ''}</Tag>
      {event.location && <Tag>{event.location}</Tag>}

      <Typography.Paragraph style={{ marginTop: 12 }}>
        {event.description}
      </Typography.Paragraph>

      {event.result && (
        <>
          <Divider >结果</Divider>
          <Typography.Paragraph>{event.result}</Typography.Paragraph>
        </>
      )}

      {event.participants.length > 0 && (
        <>
          <Divider >参与人物 ({event.participants.length})</Divider>
          {event.participants.map(p => {
            const person = personMap[p.person_id];
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
          <Divider >来源</Divider>
          {event.source_urls.map((url, i) => (
            <div key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <LinkOutlined /> {new URL(url).hostname}
              </a>
            </div>
          ))}
        </>
      )}
    </Drawer>
  );
}
