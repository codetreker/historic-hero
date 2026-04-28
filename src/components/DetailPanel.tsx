import { Drawer, Typography, Descriptions } from 'antd';
import type { Person } from '../types';

interface Props {
  person: Person | null;
  visible: boolean;
  onClose: () => void;
}

export default function DetailPanel({ person, visible, onClose }: Props) {
  if (!person) return null;
  
  return (
    <Drawer title={person.name} open={visible} onClose={onClose} width={400}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="字">{person.courtesy_name || '—'}</Descriptions.Item>
        <Descriptions.Item label="生卒">
          {person.birth_year || '?'} - {person.death_year || '?'}
        </Descriptions.Item>
        <Descriptions.Item label="籍贯">{person.birth_place || '—'}</Descriptions.Item>
      </Descriptions>
      <Typography.Paragraph style={{ marginTop: 16 }}>
        {person.description}
      </Typography.Paragraph>
    </Drawer>
  );
}
