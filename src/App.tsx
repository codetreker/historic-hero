import { ConfigProvider, Layout, Typography, Tabs } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider, useApp } from './context/AppContext';
import GraphView from './components/GraphView';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import PersonDetail from './components/DetailPanel';
import EventDetail from './components/EventDetail';
import TimelineNav from './components/TimelineNav';
import Legend from './components/Legend';
import { FACTION_CONFIG } from './types';
import type { Faction } from './types';

const { Header, Content, Sider } = Layout;

const factionTabs = (Object.keys(FACTION_CONFIG) as Faction[]).map(f => ({
  key: f,
  label: FACTION_CONFIG[f].label,
}));

function AppInner() {
  const { state, dispatch } = useApp();

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        height: 56,
        lineHeight: '56px',
      }}>
        <Typography.Title level={4} style={{ margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
          历史英雄谱 · 三国
        </Typography.Title>
        <SearchBar />
        <Tabs
          activeKey={state.selectedFactions.length === 1 ? state.selectedFactions[0] : ''}
          items={factionTabs}
          onChange={(key) => dispatch({ type: 'SET_FACTIONS', payload: [key as Faction] })}
          style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
          size="small"
        />
      </Header>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider width={240} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
          <FilterPanel />
        </Sider>
        <Content style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <GraphView />
          <Legend />
        </Content>
      </Layout>

      <TimelineNav />
      <PersonDetail />
      <EventDetail />
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ConfigProvider>
  );
}
