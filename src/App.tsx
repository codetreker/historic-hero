import { useState, useCallback } from 'react';
import { ConfigProvider, Layout, Typography, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import GraphView from './components/GraphView';
import DetailPanel from './components/DetailPanel';
import { FACTION_CONFIG } from './types';
import type { Person } from './types';

const { Header, Content } = Layout;

function App() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [factionFilter, setFactionFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  const handleSelectPerson = useCallback((person: Person | null) => {
    setSelectedPerson(person);
    setDrawerVisible(!!person);
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 16,
          }}
        >
          <Typography.Title
            level={4}
            style={{ margin: 0, whiteSpace: 'nowrap' }}
          >
            🏯 历史英雄谱 · 三国
          </Typography.Title>
          <Input
            placeholder="搜索人物..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="筛选阵营"
            style={{ minWidth: 200 }}
            onChange={(v: string[]) => setFactionFilter(v)}
            options={Object.entries(FACTION_CONFIG).map(([value, { label }]) => ({
              value,
              label,
            }))}
            allowClear
          />
        </Header>
        <Content style={{ position: 'relative' }}>
          <GraphView
            factionFilter={factionFilter}
            searchText={searchText}
            onSelectPerson={handleSelectPerson}
          />
        </Content>
        <DetailPanel
          person={selectedPerson}
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
