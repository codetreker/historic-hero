import { Slider } from 'antd';
import { useApp } from '../context/AppContext';

const marks: Record<number, string> = {
  184: '黄巾',
  200: '官渡',
  208: '赤壁',
  220: '三国',
  234: '五丈原',
  263: '灭蜀',
  280: '统一',
};

export default function TimelineNav() {
  const { state, dispatch } = useApp();

  return (
    <div style={{ height: 60, padding: '8px 24px 0', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
      <Slider
        range
        min={150}
        max={280}
        value={state.timeRange}
        marks={marks}
        onChange={(value) => dispatch({ type: 'SET_TIME_RANGE', payload: value as [number, number] })}
      />
    </div>
  );
}
