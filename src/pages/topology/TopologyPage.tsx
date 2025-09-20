import React from 'react';
import { TopologyCanvas } from '../../features/topology/TopologyCanvas';

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
      <div className="page-placeholder">
        <h2>Automation ideas</h2>
        <p className="muted">
          Document site interconnect dependencies and export snapshots to share topology deltas with peers.
        </p>
      </div>
    </aside>
  </div>
);

export default TopologyPage;
