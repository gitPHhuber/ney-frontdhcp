import React from 'react';
import { Tooltip } from '../../shared/ui/Tooltip';

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

const ACTION_DESCRIPTIONS = {
  trial: 'Пробный прогон выполняет все шаги без внесения изменений в инфраструктуру и фиксирует вывод в аудите.',
  production: 'Боевой запуск применяет сценарий на выбранных устройствах. Проверьте права и список целей перед стартом.',
};

export const PlaybookList: React.FC = () => (
  <section className="playbook-list">
    <header className="playbook-list__header">
      <div>
        <h2>Автоматизация</h2>
        <p className="muted">Запускайте готовые сценарии с учётом прав доступа и фиксируйте все действия в аудите.</p>
      </div>
      <span className="status-badge status-completed">Готово к аудиту</span>
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
              <div className="playbook-actions__option">
                <button type="button" role="menuitem">Пробный запуск</button>
                <Tooltip id={`${playbook.id}-trial`} text={ACTION_DESCRIPTIONS.trial} />
              </div>
              <div className="playbook-actions__option">
                <button type="button" role="menuitem">Боевой запуск</button>
                <Tooltip id={`${playbook.id}-production`} text={ACTION_DESCRIPTIONS.production} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
