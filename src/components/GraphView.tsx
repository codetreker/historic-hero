import { useEffect, useRef } from 'react';
import { Graph } from '@antv/g6';
import { persons, relationships } from '../data';
import { FACTION_CONFIG } from '../types';
import type { Person, Faction } from '../types';
import type { NodeData, EdgeData } from '@antv/g6';

interface Props {
  factionFilter: string[];
  searchText: string;
  onSelectPerson: (person: Person | null) => void;
}

export default function GraphView({
  factionFilter,
  searchText: _searchText,
  onSelectPerson,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous graph if exists (for re-render on filter change)
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }

    // Filter persons by faction
    const filteredPersons =
      factionFilter.length > 0
        ? persons.filter((p) => factionFilter.includes(p.faction))
        : persons;

    const personIds = new Set(filteredPersons.map((p) => p.id));

    // Count relationships per person for sizing
    const degreeMap: Record<string, number> = {};
    relationships.forEach((r) => {
      if (personIds.has(r.source) && personIds.has(r.target)) {
        degreeMap[r.source] = (degreeMap[r.source] || 0) + 1;
        degreeMap[r.target] = (degreeMap[r.target] || 0) + 1;
      }
    });

    const nodes: NodeData[] = filteredPersons.map((p) => ({
      id: p.id,
      data: {
        name: p.name,
        faction: p.faction,
        degree: degreeMap[p.id] || 0,
      },
    }));

    const edges: EdgeData[] = relationships
      .filter((r) => personIds.has(r.source) && personIds.has(r.target))
      .map((r) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        data: { type: r.type, label: r.label },
      }));

    const graph = new Graph({
      container: containerRef.current,
      data: { nodes, edges },
      autoFit: 'view',
      node: {
        style: {
          size: (d: NodeData) => {
            const degree = (d.data?.degree as number) || 0;
            return Math.max(16, Math.min(50, degree * 3 + 16));
          },
          fill: (d: NodeData) => {
            const faction = d.data?.faction as Faction;
            return FACTION_CONFIG[faction]?.color || '#8c8c8c';
          },
          stroke: '#fff',
          lineWidth: 1,
          labelText: (d: NodeData) => (d.data?.name as string) || '',
          labelFontSize: 10,
          labelFill: '#333',
          labelPlacement: 'bottom',
        },
      },
      edge: {
        style: {
          stroke: '#ddd',
          lineWidth: 0.5,
          endArrow: false,
        },
      },
      layout: {
        type: 'd3-force',
        preventOverlap: true,
        nodeSize: 30,
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force'],
    });

    graph.on('node:click', (event: any) => {
      const id = event?.target?.id;
      if (id) {
        const person = persons.find((p) => p.id === id);
        if (person) onSelectPerson(person);
      }
    });

    graph.render();
    graphRef.current = graph;

    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [factionFilter, onSelectPerson]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
