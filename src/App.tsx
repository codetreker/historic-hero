import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, Typography } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import GraphView from './components/GraphView';

const { Header, Content } = Layout;

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Layout style={{ height: '100vh' }}>
          <Header style={{ 
            background: '#fff', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
          }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              🏯 历史英雄谱 · 三国
            </Typography.Title>
          </Header>
          <Content style={{ overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<GraphView />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
