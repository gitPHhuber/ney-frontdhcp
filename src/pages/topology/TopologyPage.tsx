import React from 'react';
import { TopologyCanvas } from '../../features/topology/TopologyCanvas';

const TopologyPage: React.FC = () => (
  <div className="page-with-sidebar">
    <section className="page-main">
      <header className="page-header">
        <h1>Сетевая топология</h1>
        <p className="muted">Переключайтесь между схемами, ищите узлы и экспортируйте снимки в PNG/SVG.</p>
      </header>
      <TopologyCanvas />
    </section>
    <aside className="page-sidebar">
      <div className="page-placeholder">
        <h2>Идеи автоматизации</h2>
        <p className="muted">
          Документируйте взаимосвязи площадок и отправляйте актуальные снимки топологии коллегам.
        </p>
      </div>
    </aside>
  </div>
);

export default TopologyPage;
