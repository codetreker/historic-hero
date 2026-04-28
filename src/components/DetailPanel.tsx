import { Drawer, Typography, Tag, Descriptions, List, Divider } from 'antd';
import type { Person } from '../types';
import { relationships, events, persons } from '../data';
import { FACTION_CONFIG, ROLE_CONFIG } from '../types';

interface Props {
  person: Person | null;
  visible: boolean;
  onClose: () => void;
}

export default function DetailPanel({ person, visible, onClose }: Props) {
  if (!person) return null;

  const personRels = relationships.filter(
    r => r.source === person.id || r.target === person.id
  );

  const personEvents = events.filter(
    e => e.participants.some(p => p.person_id === person.id)
  );

  const factionConfig = FACTION_CONFIG[person.faction];

  // Helper to resolve person ID to name
  const resolveName = (id: string): string => {
    const p = persons.find(x => x.id === id);
    return p ? p.name : id;
  };

  return (
    <Drawer
      title={
        <span>
          {person.name}
          {person.courtesy_name && (
            <span style={{ color: '#999', marginLeft: 8 }}>
              字 {person.courtesy_name}
            </span>
          )}
        </span>
      }
      open={visible}
      onClose={onClose}
      width={420}
    >
      <Tag color={factionConfig?.color}>{factionConfig?.label}</Tag>
      {person.roles?.map((role: string) => (
        <Tag key={role}>
          {(ROLE_CONFIG as Record<string, { label: string }>)[role]?.label || role}
        </Tag>
      ))}

      <Descriptions column={1} style={{ marginTop: 16 }} size="small" bordered>
        <Descriptions.Item label="生卒">
          {person.birth_year || '?'} - {person.death_year || '?'}
        </Descriptions.Item>
        {person.birth_place && (
          <Descriptions.Item label="籍贯">
            {person.birth_place}
          </Descriptions.Item>
        )}
        {person.title && (
          <Descriptions.Item label="谥号">{person.title}</Descriptions.Item>
        )}
      </Descriptions>

      <Typography.Paragraph style={{ marginTop: 16 }}>
        {person.description}
      </Typography.Paragraph>

      {personRels.length > 0 && (
        <>
          <Divider>关系 ({personRels.length})</Divider>
          <List
            size="small"
            dataSource={personRels}
            renderItem={(rel) => (
              <List.Item>
                <span>
                  {rel.label}:{' '}
                  {rel.source === person.id
                    ? resolveName(rel.target)
                    : resolveName(rel.source)}
                </span>
              </List.Item>
            )}
          />
        </>
      )}

      {personEvents.length > 0 && (
        <>
          <Divider>参与事件 ({personEvents.length})</Divider>
          <List
            size="small"
            dataSource={personEvents}
            renderItem={(evt) => (
              <List.Item>
                <span>
                  {evt.year}年 {evt.name}
                </span>
              </List.Item>
            )}
          />
        </>
      )}
    </Drawer>
  );
}
