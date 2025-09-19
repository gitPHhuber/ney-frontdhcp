import React from 'react';
import cytoscape from 'cytoscape';

const sampleElements: cytoscape.ElementDefinition[] = [
  { data: { id: 'core', label: 'Core Router', status: 'ok' } },
  { data: { id: 'dist-1', label: 'Dist-1', status: 'warn' } },
  { data: { id: 'dist-2', label: 'Dist-2', status: 'ok' } },
  { data: { id: 'edge', label: 'Edge Firewall', status: 'crit' } },
  { data: { id: 'link-1', source: 'core', target: 'dist-1' } },
  { data: { id: 'link-2', source: 'core', target: 'dist-2' } },
  { data: { id: 'link-3', source: 'dist-1', target: 'edge' } },
];

export const TopologyCanvas: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const instance = cytoscape({
      container: containerRef.current,
      elements: sampleElements,
      layout: { name: 'cose', animate: false },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': '#2563eb',
            color: '#f8fafc',
          },
        },
        {
          selector: 'node[status = "warn"]',
          style: { 'background-color': '#facc15' },
        },
        {
          selector: 'node[status = "crit"]',
          style: { 'background-color': '#ef4444' },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
    });

    return () => {
      instance.destroy();
    };
  }, []);

  return <div ref={containerRef} className="topology-canvas" role="presentation" />;
};
