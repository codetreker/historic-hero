import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Graph } from '@antv/g6';
import { relationships, degreeMap, personMap, relsByPerson, factionStats, crossFactionRels } from '../data';
import { FACTION_CONFIG } from '../types';
import type { Person, Faction } from '../types';
import type { NodeData, EdgeData } from '@antv/g6';
import { useApp, type AppState } from '../context/AppContext';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const RELATION_COLORS: Record<string, string> = {
  'lord-vassal': '#1677ff',
  'father-son': '#52c41a',
  'mother-son': '#52c41a',
  'brothers': '#13c2c2',
  'husband-wife': '#eb2f96',
  'rivals': '#f5222d',
  'betrayal': '#fa541c',
  'sworn-brothers': '#faad14',
  'killed-by': '#000000',
  'master-student': '#722ed1',
  'allies': '#2f54eb',
};

const RELATION_DASH: Record<string, number[]> = {
  'rivals': [6, 3],
  'betrayal': [4, 4],
  'allies': [8, 4],
};

const REL_PRIORITY: Record<string, number> = {
  'father-son': 0, 'mother-son': 1, 'husband-wife': 2, 'brothers': 3,
  'sworn-brothers': 4, 'lord-vassal': 5, 'killed-by': 6, 'betrayal': 7,
  'rivals': 8, 'master-student': 9, 'allies': 10, 'friends': 11,
  'in-law': 12, 'successor': 13, 'subordinate': 14, 'colleagues': 15,
};

const MAX_RELS_PER_NODE = 15;

function trimRelationships(rels: typeof relationships) {
  const sorted = [...rels].sort(
    (a, b) => (REL_PRIORITY[a.type] ?? 99) - (REL_PRIORITY[b.type] ?? 99),
  );
  const count: Record<string, number> = {};
  const result: typeof rels = [];
  for (const r of sorted) {
    const sc = count[r.source] ?? 0;
    const tc = count[r.target] ?? 0;
    if (sc >= MAX_RELS_PER_NODE && tc >= MAX_RELS_PER_NODE) continue;
    result.push(r);
    count[r.source] = sc + 1;
    count[r.target] = tc + 1;
  }
  return result;
}


function getOverviewData() {
  const factions: Faction[] = ['wei', 'shu', 'wu', 'han', 'jin', 'other'];
  const maxCount = Math.max(...factions.map(f => factionStats[f].count));
  const minSize = 80, maxSize = 160;

  const cx = 400, cy = 300, radius = 220;
  const nodes: NodeData[] = factions.map((f, i) => {
    const angle = (i / factions.length) * Math.PI * 2 - Math.PI / 2;
    const size = minSize + (factionStats[f].count / maxCount) * (maxSize - minSize);
    return {
      id: `faction-${f}`,
      data: {
        name: FACTION_CONFIG[f].label,
        faction: f,
        count: factionStats[f].count,
        isOverview: true,
      },
      style: {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        size,
        fill: FACTION_CONFIG[f].color,
        stroke: '#fff',
        lineWidth: 3,
        labelText: `${FACTION_CONFIG[f].label}\n${factionStats[f].count}人`,
        labelFontSize: 16,
        labelFontWeight: 'bold',
        labelFill: '#333',
        labelPlacement: 'center' as const,
        cursor: 'pointer',
      },
    };
  });

  const maxRelCount = Math.max(...crossFactionRels.map(r => r.count), 1);
  const edges: EdgeData[] = crossFactionRels.map((r, i) => ({
    id: `cross-${i}`,
    source: `faction-${r.source}`,
    target: `faction-${r.target}`,
    data: { count: r.count, label: `${r.count} 条关系` },
    style: {
      lineWidth: 1 + (r.count / maxRelCount) * 4,
      stroke: '#bbb',
      opacity: 0.5,
      labelText: '',
      labelFontSize: 11,
      labelFill: '#666',
    },
  }));

  return { nodes, edges };
}

function getFactionDetailData(faction: Faction, state: AppState) {
  let factionPersons = factionStats[faction].topPersons;

  if (state.selectedRoles.length > 0) {
    factionPersons = factionPersons.filter(p => p.roles.some(r => state.selectedRoles.includes(r)));
  }

  const ids = new Set(factionPersons.map(p => p.id));

  let rels = relationships.filter(r => ids.has(r.source) && ids.has(r.target));
  if (state.selectedRelTypes.length > 0) {
    rels = rels.filter(r => state.selectedRelTypes.includes(r.type));
  }
  rels = trimRelationships(rels);

  const nodes: NodeData[] = factionPersons.map(p => {
    const degree = degreeMap[p.id] || 0;
    const isCore = degree >= 10;
    return {
      id: p.id,
      data: { name: p.name, faction: p.faction, degree },
      style: {
        size: isCore ? Math.max(20, Math.min(35, degree * 3 + 15)) : 14,
        fill: isCore ? FACTION_CONFIG[p.faction].color : FACTION_CONFIG[p.faction].color,
        opacity: isCore ? 1 : 0.7,
        stroke: '#fff',
        lineWidth: isCore ? 2 : 1,
        labelText: p.name,
        labelFontSize: isCore ? 13 : 10,
        labelFontWeight: isCore ? 'bold' : 'normal',
        labelFill: '#333',
        labelPlacement: 'bottom' as const,
      },
    };
  });

  const edges: EdgeData[] = rels.map(r => ({
    id: r.id,
    source: r.source,
    target: r.target,
    data: { type: r.type, label: r.label, bidirectional: r.bidirectional },
  }));

  return { nodes, edges };
}

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const destroyedRef = useRef(false);
  const renderedRef = useRef(false);
  const { state, dispatch } = useApp();

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const stateRef = useRef(state);
  stateRef.current = state;

  const handlePersonClick = useCallback((person: Person) => {
    dispatchRef.current({ type: 'SET_SELECTED_PERSON', payload: person });

    const neighborIds = new Set<string>();
    neighborIds.add(person.id);
    (relsByPerson[person.id] || []).forEach(r => {
      neighborIds.add(r.source);
      neighborIds.add(r.target);
    });

    dispatchRef.current({ type: 'SET_HIGHLIGHT', payload: person.id });

    const graph = graphRef.current;
    if (!graph || destroyedRef.current || !renderedRef.current) return;

    try {
      graph.getNodeData().forEach(n => {
        graph.setElementState(n.id as string, neighborIds.has(n.id as string) ? 'highlight' : 'dim');
      });
      graph.getEdgeData().forEach(e => {
        if (neighborIds.has(e.source as string) && neighborIds.has(e.target as string)) {
          graph.setElementState(e.id as string, 'highlight');
        } else {
          graph.setElementState(e.id as string, 'dim');
        }
      });
      graph.focusElement(person.id);
    } catch { /* graph may have been destroyed */ }
  }, []);

  const filterKey = useMemo(
    () => JSON.stringify([state.viewMode, state.expandedFaction, state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange]),
    [state.viewMode, state.expandedFaction, state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    destroyedRef.current = false;

    if (graphRef.current) {
      try { graphRef.current.destroy(); } catch { /* already destroyed */ }
      graphRef.current = null;
    }

    const isOverview = state.viewMode === 'overview';

    if (isOverview) {
      const { nodes, edges } = getOverviewData();

      const graph = new Graph({
        container: containerRef.current,
        data: { nodes, edges },
        autoFit: 'view',
        animation: false,
        node: {
          style: {},
          state: {
            highlight: { stroke: '#ff4d4f', lineWidth: 4 },
            dim: { opacity: 0.15 },
          },
        },
        edge: {
          style: {},
          state: {
            highlight: {
              opacity: 1,
            },
            dim: { opacity: 0.08 },
          },
        },
        behaviors: ['drag-canvas', 'zoom-canvas'],
      });

      graph.on('node:click', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const id = event?.target?.id as string;
        if (id?.startsWith('faction-')) {
          const faction = id.replace('faction-', '') as Faction;
          dispatchRef.current({ type: 'EXPAND_FACTION', payload: faction });
        }
      });

      graph.on('node:mouseenter', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const id = event?.target?.id as string;
        if (!id || !renderedRef.current || destroyedRef.current) return;
        try {
          graph.getEdgeData().forEach(e => {
            if (e.source === id || e.target === id) {
              graph.setElementState(e.id as string, 'highlight');
            }
          });
        } catch { /* noop */ }
      });

      graph.on('node:mouseleave', () => {
        if (!renderedRef.current || destroyedRef.current) return;
        try {
          graph.getEdgeData().forEach(e => {
            graph.setElementState(e.id as string, []);
          });
        } catch { /* noop */ }
      });

      renderedRef.current = false;
      graphRef.current = graph;
      graph.render().then(() => {
        if (!destroyedRef.current) renderedRef.current = true;
      }).catch(() => { /* destroyed during render */ });

    } else {
      const faction = state.expandedFaction;
      if (!faction) return;

      const { nodes, edges } = getFactionDetailData(faction, state);
      if (nodes.length === 0) return;

      const graph = new Graph({
        container: containerRef.current,
        data: { nodes, edges },
        autoFit: 'view',
        animation: false,
        node: {
          style: {},
          state: {
            highlight: { stroke: '#ff4d4f', lineWidth: 3, labelFontSize: 14, labelFontWeight: 'bold' },
            dim: { opacity: 0.15 },
          },
        },
        edge: {
          style: {
            stroke: (d: EdgeData) => RELATION_COLORS[d.data?.type as string] || '#ddd',
            lineWidth: 1,
            lineDash: (d: EdgeData) => RELATION_DASH[d.data?.type as string] || [],
            endArrow: (d: EdgeData) => !d.data?.bidirectional,
            labelText: '',
            labelFontSize: 9,
            labelFill: '#999',
            opacity: 0.3,
          },
          state: {
            highlight: {
              opacity: 1,
              lineWidth: 2,
            },
            dim: { opacity: 0.08 },
          },
        },
        layout: {
          type: 'd3-force',
          preventOverlap: true,
          nodeSize: 40,
          linkDistance: 400,
          nodeStrength: -300,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force'],
      });

      graph.on('node:click', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const id = event?.target?.id;
        if (id) {
          const person = personMap[id];
          if (person) handlePersonClick(person);
        }
      });

      graph.on('node:mouseenter', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (stateRef.current.highlightedPersonId) return;
        const id = event?.target?.id;
        if (!id || !renderedRef.current || destroyedRef.current) return;

        const neighborIds = new Set<string>();
        neighborIds.add(id);
        (relsByPerson[id] || []).forEach(r => {
          neighborIds.add(r.source);
          neighborIds.add(r.target);
        });

        try {
          graph.getNodeData().forEach(n => {
            graph.setElementState(n.id as string, neighborIds.has(n.id as string) ? 'highlight' : 'dim');
          });
          graph.getEdgeData().forEach(e => {
            const connected = neighborIds.has(e.source as string) && neighborIds.has(e.target as string)
              && (e.source === id || e.target === id);
            graph.setElementState(e.id as string, connected ? 'highlight' : 'dim');
          });
        } catch { /* noop */ }
      });

      graph.on('node:mouseleave', () => {
        if (stateRef.current.highlightedPersonId) return;
        if (!renderedRef.current || destroyedRef.current) return;
        try {
          graph.getNodeData().forEach(n => graph.setElementState(n.id as string, []));
          graph.getEdgeData().forEach(e => graph.setElementState(e.id as string, []));
        } catch { /* noop */ }
      });

      renderedRef.current = false;
      graphRef.current = graph;
      graph.render().then(() => {
        if (!destroyedRef.current) renderedRef.current = true;
      }).catch(() => { /* destroyed during render */ });
    }

    return () => {
      destroyedRef.current = true;
      renderedRef.current = false;
      if (graphRef.current) {
        try { graphRef.current.destroy(); } catch { /* already destroyed */ }
        graphRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, handlePersonClick]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || destroyedRef.current || !renderedRef.current) return;
    if (state.viewMode !== 'faction-detail') return;

    if (!state.highlightedPersonId) {
      try {
        graph.getNodeData().forEach(n => graph.setElementState(n.id as string, []));
        graph.getEdgeData().forEach(e => graph.setElementState(e.id as string, []));
      } catch { /* graph may have been destroyed */ }
    }
  }, [state.highlightedPersonId, state.viewMode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {state.viewMode === 'faction-detail' && (
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => dispatch({ type: 'BACK_TO_OVERVIEW' })}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            fontSize: 14,
            fontWeight: 500,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          返回总览
        </Button>
      )}
    </div>
  );
}
