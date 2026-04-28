import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Graph } from '@antv/g6';
import { persons, relationships, degreeMap, personMap, relsByPerson } from '../data';
import { FACTION_CONFIG } from '../types';
import type { Person, Faction } from '../types';
import type { NodeData, EdgeData } from '@antv/g6';
import { useApp, type AppState } from '../context/AppContext';

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

function getFilteredData(state: AppState) {
  let filtered = persons;

  if (state.selectedFactions.length > 0) {
    filtered = filtered.filter(p => state.selectedFactions.includes(p.faction));
  }

  if (state.selectedRoles.length > 0) {
    filtered = filtered.filter(p => p.roles.some(r => state.selectedRoles.includes(r)));
  }

  const [start, end] = state.timeRange;
  filtered = filtered.filter(p => {
    const born = p.birth_year ?? 0;
    const died = p.death_year ?? 999;
    return born <= end && died >= start;
  });

  const ids = new Set(filtered.map(p => p.id));

  let filteredRels = relationships.filter(r => ids.has(r.source) && ids.has(r.target));

  if (state.selectedRelTypes.length > 0) {
    filteredRels = filteredRels.filter(r => state.selectedRelTypes.includes(r.type));
  }

  return { persons: filtered, relationships: filteredRels };
}

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const destroyedRef = useRef(false);
  const { state, dispatch } = useApp();

  // Use ref for dispatch to avoid re-triggering graph effect
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const handleNodeClick = useCallback((person: Person) => {
    dispatchRef.current({ type: 'SET_SELECTED_PERSON', payload: person });

    const neighborIds = new Set<string>();
    neighborIds.add(person.id);
    (relsByPerson[person.id] || []).forEach(r => {
      neighborIds.add(r.source);
      neighborIds.add(r.target);
    });

    dispatchRef.current({ type: 'SET_HIGHLIGHT', payload: person.id });

    const graph = graphRef.current;
    if (!graph || destroyedRef.current) return;

    try {
      const allNodeData = graph.getNodeData();
      allNodeData.forEach(n => {
        if (neighborIds.has(n.id as string)) {
          graph.setElementState(n.id as string, 'highlight');
        } else {
          graph.setElementState(n.id as string, 'dim');
        }
      });
      graph.focusElement(person.id);
    } catch { /* graph may have been destroyed */ }
  }, []);

  // Memoize filter inputs to avoid unnecessary re-renders
  const filterKey = useMemo(
    () => JSON.stringify([state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange]),
    [state.selectedFactions, state.selectedRoles, state.selectedRelTypes, state.timeRange]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Guard against StrictMode double-invoke
    destroyedRef.current = false;

    if (graphRef.current) {
      try { graphRef.current.destroy(); } catch { /* already destroyed */ }
      graphRef.current = null;
    }

    const data = getFilteredData(state);

    const nodes: NodeData[] = data.persons.map(p => ({
      id: p.id,
      data: {
        name: p.name,
        faction: p.faction,
        degree: degreeMap[p.id] || 0,
      },
    }));

    const edges: EdgeData[] = data.relationships.map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      data: {
        type: r.type,
        label: r.label,
        bidirectional: r.bidirectional,
      },
    }));

    if (nodes.length === 0) return;

    const graph = new Graph({
      container: containerRef.current,
      data: { nodes, edges },
      autoFit: 'view',
      animation: false,
      node: {
        style: {
          size: (d: NodeData) => {
            const degree = (d.data?.degree as number) || 0;
            return Math.max(20, Math.min(60, degree * 4 + 20));
          },
          fill: (d: NodeData) => {
            const faction = d.data?.faction as Faction;
            return FACTION_CONFIG[faction]?.color || '#8c8c8c';
          },
          stroke: '#fff',
          lineWidth: 1.5,
          labelText: (d: NodeData) => (d.data?.name as string) || '',
          labelFontSize: 11,
          labelFill: '#333',
          labelPlacement: 'bottom',
        },
        state: {
          highlight: {
            stroke: '#ff4d4f',
            lineWidth: 3,
            labelFontSize: 14,
            labelFontWeight: 'bold',
          },
          dim: {
            opacity: 0.15,
          },
        },
      },
      edge: {
        style: {
          stroke: (d: EdgeData) => RELATION_COLORS[d.data?.type as string] || '#ddd',
          lineWidth: 1,
          lineDash: (d: EdgeData) => RELATION_DASH[d.data?.type as string] || [],
          endArrow: (d: EdgeData) => !d.data?.bidirectional,
          labelText: (d: EdgeData) => (d.data?.label as string) || '',
          labelFontSize: 9,
          labelFill: '#999',
        },
      },
      layout: {
        type: 'd3-force',
        preventOverlap: true,
        nodeSize: 40,
        linkDistance: 120,
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force'],
    });

    graph.on('node:click', (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const id = event?.target?.id;
      if (id) {
        const person = personMap[id];
        if (person) handleNodeClick(person);
      }
    });

    // Render only if not already destroyed by StrictMode cleanup
    if (!destroyedRef.current) {
      graph.render();
      graphRef.current = graph;
    } else {
      // StrictMode already ran cleanup before render finished
      try { graph.destroy(); } catch { /* noop */ }
    }

    return () => {
      destroyedRef.current = true;
      if (graphRef.current) {
        try { graphRef.current.destroy(); } catch { /* already destroyed */ }
        graphRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, handleNodeClick]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || destroyedRef.current) return;

    if (!state.highlightedPersonId) {
      try {
        const allNodeData = graph.getNodeData();
        allNodeData.forEach(n => {
          graph.setElementState(n.id as string, []);
        });
      } catch { /* graph may have been destroyed */ }
    }
  }, [state.highlightedPersonId]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
