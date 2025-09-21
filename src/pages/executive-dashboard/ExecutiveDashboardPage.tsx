import React from 'react';

const ExecutiveDashboardPage: React.FC = () => (
  <section className="executive-dashboard">
    <header className="executive-dashboard__header">
      <div>
        <h1>Дашборд для руководства</h1>
        <p className="muted">
          Отображайте доступность, MTTR, соблюдение SLA, тренды инцидентов и оценку рисков в формате, понятном топ-менеджменту.
        </p>
      </div>
      <div className="executive-dashboard__actions">
        <button type="button" className="primary">Экспортировать отчёт</button>
        <button type="button" className="secondary">Запланировать еженедельную рассылку</button>
      </div>
    </header>
    <div className="executive-dashboard__grid">
      <article className="dashboard-card">
        <header>
          <span className="dashboard-card__title">Соблюдение SLA</span>
          <span className="dashboard-card__loader" aria-hidden>
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" stroke="rgba(51, 245, 255, 0.35)" strokeWidth="2" fill="none" />
              <path
                d="M28 16a12 12 0 0 0-12-12"
                stroke="var(--netgrip-primary-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </header>
        <div className="dashboard-card__body">
          <div className="dashboard-card__metric">97.4%</div>
          <p className="muted">Синхронизация данных с ServiceNow и Grafana Insights.</p>
        </div>
      </article>
      <article className="dashboard-card">
        <header>
          <span className="dashboard-card__title">Динамика MTTR</span>
          <span className="dashboard-card__loader" aria-hidden>
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" stroke="rgba(124, 58, 237, 0.35)" strokeWidth="2" fill="none" />
              <path
                d="M4 20l6-6 4 4 6-8 8 12"
                stroke="rgba(124, 58, 237, 0.85)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
        </header>
        <div className="dashboard-card__body">
          <div className="dashboard-card__skeleton">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Еженедельная динамика MTTR по ключевым сегментам инфраструктуры.</p>
        </div>
      </article>
      <article className="dashboard-card">
        <header>
          <span className="dashboard-card__title">Распределение серьёзности инцидентов</span>
          <span className="dashboard-card__loader" aria-hidden>
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" stroke="rgba(248, 113, 113, 0.45)" strokeWidth="2" fill="none" />
              <path
                d="M16 4a12 12 0 0 1 0 24 12 12 0 0 1 0-24Z"
                fill="rgba(248, 113, 113, 0.2)"
              />
              <path
                d="M16 4a12 12 0 0 1 8.49 20.49L16 16Z"
                fill="rgba(250, 204, 21, 0.35)"
              />
            </svg>
          </span>
        </header>
        <div className="dashboard-card__body">
          <div className="dashboard-card__chart" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Автоматический парсинг инцидентов из Opsgenie и NetGrip Alerts.</p>
        </div>
      </article>
      <article className="dashboard-card dashboard-card--wide">
        <header>
          <span className="dashboard-card__title">Сводка для руководства</span>
          <span className="dashboard-card__loader" aria-hidden>
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" fill="none" />
              <path
                d="M12 12h8M12 16h8M12 20h6"
                stroke="rgba(226, 232, 240, 0.8)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </header>
        <div className="dashboard-card__body">
          <p className="muted">
            Каркас сводки показывает KPI, заполняемые данными из CMDB и SLA-хранилища. Добавьте виджеты для NPS,
            финансового воздействия и статуса проектов модернизации.
          </p>
        </div>
      </article>
    </div>
  </section>
);

export default ExecutiveDashboardPage;
