import { ConfigProvider, Layout, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider, useApp } from './context/AppContext';
import GraphView from './components/GraphView';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import PersonDetail from './components/DetailPanel';
import EventDetail from './components/EventDetail';
import TimelineNav from './components/TimelineNav';
import Legend from './components/Legend';

const { Header, Content, Sider, Footer } = Layout;

function AppInner() {
  const { state, dispatch } = useApp();

  const hasDetail = state.drawerVisible && (state.drawerMode === 'person' || state.drawerMode === 'event');

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
      </Header>

      <TimelineNav />

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider width={240} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
          <FilterPanel />
        </Sider>
        <Content style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <GraphView />
          <Legend />
        </Content>
        <Sider width={360} style={{ background: '#fff', borderLeft: '1px solid #f0f0f0', overflow: 'auto', padding: 0 }}>
          {hasDetail ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{ position: 'absolute', top: 12, right: 12, cursor: 'pointer', zIndex: 1 }}
                onClick={() => dispatch({ type: 'TOGGLE_DRAWER', payload: { visible: false } })}
              >
                <CloseOutlined />
              </div>
              {state.drawerMode === 'person' ? <PersonDetail /> : <EventDetail />}
            </div>
          ) : (
            <div style={{ padding: 24, color: '#999', textAlign: 'center', marginTop: 120 }}>
              点击图谱中的人物节点查看详情
            </div>
          )}
        </Sider>
      </Layout>

      <Footer style={{ textAlign: 'center', background: '#fafafa', padding: '10px 0', height: 40, lineHeight: '20px', color: '#999', fontSize: 13 }}>
        © 历史英雄谱 · 三国
      </Footer>
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
