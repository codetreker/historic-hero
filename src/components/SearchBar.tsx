import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface Props {
  onSearch?: (value: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  return (
    <Input
      placeholder="搜索人物..."
      prefix={<SearchOutlined />}
      onChange={(e) => onSearch?.(e.target.value)}
      style={{ width: 240 }}
      allowClear
    />
  );
}
