import { Slider, Typography } from 'antd';

interface Props {
  onRangeChange?: (range: [number, number]) => void;
}

export default function TimelineNav({ onRangeChange }: Props) {
  return (
    <div style={{ padding: '8px 24px' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>时间轴</Typography.Text>
      <Slider
        range
        min={150}
        max={280}
        defaultValue={[150, 280]}
        marks={{
          150: '150',
          184: '黄巾',
          200: '官渡',
          208: '赤壁',
          220: '三国',
          234: '五丈原',
          263: '灭蜀',
          280: '统一'
        }}
        onChange={(value) => onRangeChange?.(value as [number, number])}
      />
    </div>
  );
}
