import React from 'react';
import { TopologyCanvas } from '../../features/topology/TopologyCanvas';
import { GuidedTour } from '../../widgets/guided-tour/GuidedTour';

const TopologyPage: React.FC = () => (
  <div className="page-with-sidebar">
    <section className="page-main">
      <header className="page-header">
        <h1>Network topology</h1>
        <p className="muted">Switch between layouts, search nodes, export PNG/SVG snapshots.</p>
      </header>
      <TopologyCanvas />
    </section>
    <aside className="page-sidebar">
      <GuidedTour />
    </aside>
  </div>
);

export default TopologyPage;
