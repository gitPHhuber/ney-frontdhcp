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
    <header className="playbook-list__header">
      <div>
        <h2>Автоматизация</h2>
        <p className="muted">Запускайте готовые сценарии с учётом прав доступа и фиксируйте все действия в аудите.</p>
      </div>
      <span className="status-badge status-completed">Audit-ready</span>
    </header>
    <ul className="playbook-list__items">
      {SAMPLE_PLAYBOOKS.map(playbook => (
        <li key={playbook.id} className="playbook-list__item">
          <div className="playbook-list__details">
            <strong>{playbook.name}</strong>
            <span className="muted">Опубликован 12 минут назад</span>
          </div>
          <span className={`status-badge playbook-list__risk playbook-list__risk--${playbook.risk}`}>
            {riskLabels[playbook.risk]}
          </span>
          <div className="playbook-actions">
            <button
              type="button"
              className="playbook-actions__trigger"
              aria-haspopup="menu"
              aria-label={`Открыть варианты запуска для ${playbook.name}`}
            >
              <svg viewBox="0 0 20 20" aria-hidden focusable="false">
                <path
                  d="M6.5 4.5v11l7.5-5.5-7.5-5.5Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="playbook-actions__menu" role="menu">
              <button type="button" role="menuitem">Пробный запуск</button>
              <button type="button" role="menuitem">Боевой запуск</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
