import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Graph } from '@antv/g6';
import { personMap, fetchFactions, fetchFactionTop, fetchPersonNetwork } from '../data';
import type { FactionOverview, FactionTopResult, NetworkResult } from '../data';
import { FACTION_CONFIG } from '../types';
import type { Person, Faction, Relationship } from '../types';
import type { NodeData, EdgeData } from '@antv/g6';
import { useApp, type AppState } from '../context/AppContext';
import { Button, Spin } from 'antd';

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


function buildOverviewData(data: FactionOverview) {
  const factions: Faction[] = ['wei', 'shu', 'wu', 'han', 'jin', 'other'];
  const countMap: Record<string, number> = {};
  data.factions.forEach(f => { countMap[f.id] = f.count; });
  const maxCount = Math.max(...factions.map(f => countMap[f] || 0));
  const minSize = 80, maxSize = 160;

  const cx = 400, cy = 300, radius = 220;
  const nodes: NodeData[] = factions.map((f, i) => {
    const angle = (i / factions.length) * Math.PI * 2 - Math.PI / 2;
    const count = countMap[f] || 0;
    const size = minSize + (count / maxCount) * (maxSize - minSize);
    return {
      id: `faction-${f}`,
      data: { name: FACTION_CONFIG[f].label, faction: f, count, isOverview: true },
      style: {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        size,
        fill: FACTION_CONFIG[f].color,
        stroke: '#fff',
        lineWidth: 3,
        labelText: `${FACTION_CONFIG[f].label}\n${count}人`,
        labelFontSize: 16,
        labelFontWeight: 'bold',
        labelFill: '#333',
        labelPlacement: 'center' as const,
        cursor: 'pointer',
      },
    };
  });

  const maxRelCount = Math.max(...data.crossFactionRels.map(r => r.count), 1);
  const edges: EdgeData[] = data.crossFactionRels.map((r, i) => ({
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

function buildFactionDetailData(
  factionData: FactionTopResult,
  faction: Faction,
  state: AppState,
) {
  let factionPersons = factionData.persons;
  const allRels = factionData.relationships;

  if (state.selectedRoles.length > 0) {
    factionPersons = factionPersons.filter(p => p.roles.some(r => state.selectedRoles.includes(r)));
  }

  const coreIds = new Set(factionPersons.map(p => p.id));
  const relsByPerson: Record<string, Relationship[]> = {};
  allRels.forEach(r => {
    (relsByPerson[r.source] ??= []).push(r);
    (relsByPerson[r.target] ??= []).push(r);
  });

  if (state.expandedPersonId && !coreIds.has(state.expandedPersonId)) {
    const p = personMap[state.expandedPersonId];
    if (p && p.faction === faction) {
      factionPersons = [...factionPersons, p];
      coreIds.add(p.id);
    }
  }

  let neighborPersons: Person[] = [];
  const neighborIds = new Set<string>();
  if (state.expandedPersonId && coreIds.has(state.expandedPersonId)) {
    (relsByPerson[state.expandedPersonId] || []).forEach(r => {
      const otherId = r.source === state.expandedPersonId ? r.target : r.source;
      if (!coreIds.has(otherId) && !neighborIds.has(otherId)) {
        neighborIds.add(otherId);
        const p = personMap[otherId];
        if (p) neighborPersons.push(p);
      }
    });
  }

  const allIds = new Set([...coreIds, ...neighborIds]);
  let rels = allRels.filter(r => allIds.has(r.source) && allIds.has(r.target));
  if (state.selectedRelTypes.length > 0) {
    rels = rels.filter(r => state.selectedRelTypes.includes(r.type));
  }

  const importanceMap: Record<string, number> = {};
  factionData.persons.forEach(p => { importanceMap[p.id] = (p as any).importance_score || 0; });

  const nodes: NodeData[] = factionPersons.map((p) => {
    const rank = factionData.persons.indexOf(p);
    const isTop5 = rank >= 0 && rank < 5;
    const isCore = rank >= 0 && rank < 15;
    return {
      id: p.id,
      data: { name: p.name, faction: p.faction, degree: importanceMap[p.id] || 0, isNeighbor: false },
      style: {
        size: isTop5 ? 50 : (isCore ? 40 : 32),
        fill: FACTION_CONFIG[p.faction].color,
        opacity: isTop5 ? 1 : 0.7,
        stroke: '#fff',
        lineWidth: isTop5 ? 2 : 1,
        labelText: p.name,
        labelFontSize: isTop5 ? 10 : 9,
        labelFontWeight: isTop5 ? 'bold' : 'normal',
        labelFill: '#fff',
        labelPlacement: 'center' as const,
      },
    };
  });

  neighborPersons.forEach(p => {
    nodes.push({
      id: p.id,
      data: { name: p.name, faction: p.faction, degree: importanceMap[p.id] || 0, isNeighbor: true },
      style: {
        size: 28,
        fill: FACTION_CONFIG[p.faction].color,
        opacity: 0.5,
        stroke: '#fff',
        lineWidth: 1,
        labelText: p.name,
        labelFontSize: 8,
        labelFill: '#fff',
        labelPlacement: 'center' as const,
      },
    });
  });

  const edges: EdgeData[] = rels.map(r => ({
    id: r.id, source: r.source, target: r.target,
    data: { type: r.type, label: r.label, bidirectional: r.bidirectional },
  }));

  return { nodes, edges, relsByPerson };
}

function buildNetworkData(network: NetworkResult, centerId: string, selectedRelTypes: string[]) {
  const allPersons = [network.center, ...network.neighbors];
  let rels = network.relationships;
  if (selectedRelTypes.length > 0) {
    rels = rels.filter(r => selectedRelTypes.includes(r.type));
  }

  const relsByPerson: Record<string, Relationship[]> = {};
  network.relationships.forEach(r => {
    (relsByPerson[r.source] ??= []).push(r);
    (relsByPerson[r.target] ??= []).push(r);
  });

  const nodes: NodeData[] = allPersons.map(p => {
    const isCenter = p.id === centerId;
    return {
      id: p.id,
      data: { name: p.name, faction: p.faction, degree: 0 },
      style: {
        size: isCenter ? 55 : 32,
        fill: FACTION_CONFIG[p.faction]?.color || '#8c8c8c',
        opacity: isCenter ? 1 : 0.85,
        stroke: isCenter ? '#ff4d4f' : '#fff',
        lineWidth: isCenter ? 4 : 1.5,
        labelText: p.name,
        labelFontSize: isCenter ? 12 : 9,
        labelFontWeight: isCenter ? 'bold' : 'normal',
        labelFill: '#fff',
        labelPlacement: 'center' as const,
      },
    };
  });

  const edges: EdgeData[] = rels.map(r => ({
    id: r.id, source: r.source, target: r.target,
    data: { type: r.type, label: r.label, bidirectional: r.bidirectional },
  }));

  return { nodes, edges, relsByPerson };
}

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const destroyedRef = useRef(false);
  const renderedRef = useRef(false);
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const stateRef = useRef(state);
  stateRef.current = state;

  const relsByPersonRef = useRef<Record<string, Relationship[]>>({});

  const handlePersonClick = useCallback((person: Person) => {
    dispatchRef.current({ type: 'SET_SELECTED_PERSON', payload: person });

    const neighborIds = new Set<string>();
    neighborIds.add(person.id);
    (relsByPersonRef.current[person.id] || []).forEach(r => {
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
    () => JSON.stringify([state.viewMode, state.expandedFaction, state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange, state.expandedPersonId]),
    [state.viewMode, state.expandedFaction, state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange, state.expandedPersonId]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    destroyedRef.current = false;
    let cancelled = false;

    if (graphRef.current) {
      try { graphRef.current.destroy(); } catch { /* already destroyed */ }
      graphRef.current = null;
    }

    const isOverview = state.viewMode === 'overview';

    async function loadAndRender() {
      if (!containerRef.current) return;
      setLoading(true);

      try {
        if (isOverview) {
          const data = await fetchFactions();
          if (cancelled) return;
          const { nodes, edges } = buildOverviewData(data);

          const graph = new Graph({
            container: containerRef.current!,
            data: { nodes, edges },
            autoFit: 'view',
            zoomRange: [0.2, 1.5],
            padding: [60, 60, 60, 60],
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
                highlight: { opacity: 1 },
                dim: { opacity: 0.08 },
              },
            },
            behaviors: ['drag-canvas', 'zoom-canvas'],
          });

          graph.on('node:click', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const nodeData = graph.getNodeData().find((n: NodeData) => {
              const el = event?.target;
              return el?.id === n.id || el?.parentElement?.id === n.id;
            });
            const id = nodeData?.id as string ?? event?.target?.id as string;
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

          let nodes: NodeData[], edges: EdgeData[];

          if (state.expandedPersonId) {
            const network = await fetchPersonNetwork(state.expandedPersonId);
            if (cancelled) return;
            const result = buildNetworkData(network, state.expandedPersonId, state.selectedRelTypes);
            nodes = result.nodes;
            edges = result.edges;
            relsByPersonRef.current = result.relsByPerson;
          } else {
            const factionData = await fetchFactionTop(faction);
            if (cancelled) return;
            const result = buildFactionDetailData(factionData, faction, state);
            nodes = result.nodes;
            edges = result.edges;
            relsByPersonRef.current = result.relsByPerson;
          }

          if (nodes.length === 0) return;

          const graph = new Graph({
            container: containerRef.current!,
            data: { nodes, edges },
            autoFit: 'view',
            zoomRange: [0.2, 1.5],
            padding: [60, 60, 60, 60],
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
                highlight: { opacity: 1, lineWidth: 2 },
                dim: { opacity: 0.08 },
              },
            },
            layout: {
              type: 'd3-force',
              preventOverlap: true,
              nodeSize: 50,
              linkDistance: 400,
              nodeStrength: -300,
            },
            behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force'],
          });

          graph.on('node:click', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            let id = event?.target?.id;
            if (!id || !personMap[id]) {
              const el = event?.target?.parentElement;
              if (el?.id && personMap[el.id]) id = el.id;
            }
            if (!id || !personMap[id]) {
              const allNodes = graph.getNodeData();
              for (const n of allNodes) {
                if (n.id === event?.target?.id || n.id === event?.target?.parentElement?.id) {
                  id = n.id;
                  break;
                }
              }
            }
            if (id && personMap[id]) {
              const person = personMap[id];
              handlePersonClick(person);
              const currentExpanded = stateRef.current.expandedPersonId;
              if (currentExpanded === id) {
                dispatchRef.current({ type: 'SET_EXPANDED_PERSON', payload: null });
              } else {
                dispatchRef.current({ type: 'SET_EXPANDED_PERSON', payload: id });
                setTimeout(() => {
                  try {
                    if (graphRef.current && renderedRef.current && !destroyedRef.current) {
                      graphRef.current.focusElement(id);
                    }
                  } catch { /* noop */ }
                }, 500);
              }
            }
          });

          graph.on('canvas:click', () => {
            dispatchRef.current({ type: 'SET_EXPANDED_PERSON', payload: null });
            dispatchRef.current({ type: 'SET_HIGHLIGHT', payload: null });
            dispatchRef.current({ type: 'SET_SELECTED_PERSON', payload: null });
          });

          graph.on('node:mouseenter', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (stateRef.current.highlightedPersonId) return;
            const id = event?.target?.id;
            if (!id || !renderedRef.current || destroyedRef.current) return;

            const neighborIds = new Set<string>();
            neighborIds.add(id);
            (relsByPersonRef.current[id] || []).forEach(r => {
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
            if (!destroyedRef.current) {
              renderedRef.current = true;
              const ep = stateRef.current.expandedPersonId;
              if (ep) {
                try {
                  const neighborIds = new Set<string>([ep]);
                  (relsByPersonRef.current[ep] || []).forEach(r => {
                    neighborIds.add(r.source);
                    neighborIds.add(r.target);
                  });
                  graph.getNodeData().forEach(n => {
                    if (n.id === ep) {
                      graph.setElementState(n.id as string, 'highlight');
                    } else if (!neighborIds.has(n.id as string)) {
                      graph.setElementState(n.id as string, 'dim');
                    }
                  });
                  graph.getEdgeData().forEach(e => {
                    const connected = (e.source === ep || e.target === ep);
                    graph.setElementState(e.id as string, connected ? 'highlight' : 'dim');
                  });
                  graph.focusElement(ep);
                } catch { /* noop */ }
              }
              setTimeout(() => {
                try {
                  if (!destroyedRef.current && graphRef.current) {
                    graphRef.current.fitView();
                  }
                } catch { /* noop */ }
              }, 1500);
            }
          }).catch(() => { /* destroyed during render */ });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAndRender();

    return () => {
      cancelled = true;
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
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}>
          <Spin size="large" />
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {state.viewMode === 'faction-detail' && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 6,
          padding: '4px 8px',
        }}>
          <Button
            type="link"
            size="small"
            onClick={() => dispatch({ type: 'BACK_TO_OVERVIEW' })}
            style={{ fontSize: 13, padding: 0 }}
          >
            总览
          </Button>
          {state.expandedFaction && (
            <>
              <span style={{ color: '#999', fontSize: 13 }}>&gt;</span>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  dispatch({ type: 'SET_EXPANDED_PERSON', payload: null });
                }}
                style={{ fontSize: 13, padding: 0 }}
              >
                {FACTION_CONFIG[state.expandedFaction]?.label}
              </Button>
            </>
          )}
          {state.expandedPersonId && personMap[state.expandedPersonId] && (
            <>
              <span style={{ color: '#999', fontSize: 13 }}>&gt;</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {personMap[state.expandedPersonId].name}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
