import React from 'react';

const SAMPLE_PLAYBOOKS = [
  { id: 'plbk-01', name: 'Перезапуск службы DHCP', risk: 'low' },
  { id: 'plbk-02', name: 'Переключение на резервный маршрутизатор', risk: 'high' },
  { id: 'plbk-03', name: 'Сбор системных логов с магистрали', risk: 'medium' },
];

const riskLabels: Record<string, string> = {
  low: 'Низкий риск',
  medium: 'Средний риск',
  high: 'Высокий риск',
};

export const PlaybookList: React.FC = () => (
  <section className="playbook-list">
    <header>
      <h2>Автоматизация</h2>
      <p className="muted">Запускайте готовые сценарии с учётом прав доступа и фиксируйте все действия в аудите.</p>
    </header>
    <ul>
      {SAMPLE_PLAYBOOKS.map(playbook => (
        <li key={playbook.id}>
          <strong>{playbook.name}</strong>
          <span className={`risk risk--${playbook.risk}`}>{riskLabels[playbook.risk]}</span>
          <div className="actions">
            <button type="button" className="ghost">Пробный запуск</button>
            <button type="button" className="primary">Запустить</button>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
