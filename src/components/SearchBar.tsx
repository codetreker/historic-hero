import { useState } from 'react';
import { AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { search, personMap } from '../data';
import { FACTION_CONFIG, ROLE_CONFIG } from '../types';
import { useApp } from '../context/AppContext';

export default function SearchBar() {
  const { state, dispatch } = useApp();
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode; key: string }[]>([]);

  const handleSearch = (value: string) => {
    dispatch({ type: 'SET_SEARCH', payload: value });
    if (!value.trim()) {
      setOptions([]);
      return;
    }
    const results = search(value);
    setOptions(results.map(entry => ({
      value: entry.name,
      key: entry.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>{entry.name}</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            <span style={{ color: FACTION_CONFIG[entry.faction]?.color }}>
              {FACTION_CONFIG[entry.faction]?.label}
            </span>
            {entry.roles.length > 0 && (
              <span style={{ marginLeft: 4 }}>
                {ROLE_CONFIG[entry.roles[0]]?.label}
              </span>
            )}
          </span>
        </div>
      ),
    })));
  };

  const handleSelect = (_value: string, option: { key?: string }) => {
    const personId = option.key;
    if (!personId) return;
    const person = personMap[personId];
    if (!person) return;

    if (state.viewMode === 'overview' || state.expandedFaction !== person.faction) {
      dispatch({ type: 'EXPAND_FACTION', payload: person.faction });
    }

    // Always expand to show person-centered subgraph
    dispatch({ type: 'SET_EXPANDED_PERSON', payload: person.id });

    dispatch({ type: 'SET_SELECTED_PERSON', payload: person });
  };

  return (
    <AutoComplete
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      placeholder="搜索人物（支持拼音）"
      allowClear
      onClear={() => {
        dispatch({ type: 'SET_SEARCH', payload: '' });
        dispatch({ type: 'SET_HIGHLIGHT', payload: null });
      }}
      style={{ width: 240 }}
      suffixIcon={<SearchOutlined />}
    />
  );
}
