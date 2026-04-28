import { useRef } from 'react';
import { Typography } from 'antd';

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={3}>三国英雄关系图谱</Typography.Title>
        <Typography.Text type="secondary">
          数据加载中，图谱渲染即将开始...
        </Typography.Text>
        <div ref={containerRef} id="graph-container" style={{ width: '100%', height: '600px', marginTop: 16 }} />
      </div>
    </div>
  );
}
