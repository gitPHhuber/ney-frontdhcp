import React from 'react';

const SAMPLE_PLAYBOOKS = [
  { id: 'plbk-01', name: 'Restart DHCP service', risk: 'Low' },
  { id: 'plbk-02', name: 'Failover to standby router', risk: 'High' },
  { id: 'plbk-03', name: 'Collect syslogs from core devices', risk: 'Medium' },
];

export const PlaybookList: React.FC = () => (
  <section className="playbook-list">
    <header>
      <h2>Automation playbooks</h2>
      <p className="muted">Trigger scripted responses with RBAC control and audit trails.</p>
    </header>
    <ul>
      {SAMPLE_PLAYBOOKS.map(playbook => (
        <li key={playbook.id}>
          <strong>{playbook.name}</strong>
          <span className={`risk risk--${playbook.risk.toLowerCase()}`}>Risk: {playbook.risk}</span>
          <div className="actions">
            <button type="button" className="ghost">Dry run</button>
            <button type="button" className="primary">Launch</button>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
