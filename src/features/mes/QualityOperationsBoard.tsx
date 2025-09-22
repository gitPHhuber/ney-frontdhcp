import React, { useMemo } from 'react';
import {
  useNonconformancesQuery,
  useQualityChecksQuery,
  useTestPlansQuery,
  useTestRunsQuery,
} from './hooks';

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const QualityOperationsBoard: React.FC = () => {
  const { data: qualityChecks = [] } = useQualityChecksQuery();
  const { data: nonconformances = [] } = useNonconformancesQuery();
  const { data: testPlans = [] } = useTestPlansQuery();
  const { data: testRuns = [] } = useTestRunsQuery();

  const qualityScore = useMemo(() => {
    if (qualityChecks.length === 0) return null;
    const passed = qualityChecks.filter(check => check.status === 'passed').length;
    const blocked = qualityChecks.filter(check => check.status === 'blocked').length;
    return {
      passed: passed / qualityChecks.length,
      blocked,
    };
  }, [qualityChecks]);

  const testRunBuckets = useMemo(() => {
    return testRuns.reduce(
      (acc, run) => {
        acc[run.status] = (acc[run.status] ?? 0) + 1;
        acc.defects += run.defectsFound;
        return acc;
      },
      { queued: 0, running: 0, failed: 0, passed: 0, defects: 0 } as Record<string, number>,
    );
  }, [testRuns]);

  const escalations = useMemo(() =>
    nonconformances
      .filter(item => item.status !== 'closed')
      .sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1)),
  [nonconformances]);

  return (
    <section className="mes-layout quality-board" aria-label="Качество и тестирование">
      <header className="mes-layout__hero">
        <div className="mes-layout__hero-main">
          <h1>Качество и соответствие</h1>
          <p className="muted">
            Прослеживаемость по контрольным точкам, статус эскалаций и готовность тестовых планов flight control.
          </p>
        </div>
        <div className="mes-layout__hero-actions quality-board__actions">
          <button type="button" className="primary">Запросить аудит</button>
          <button type="button" className="secondary">Экспортировать 8D отчёт</button>
        </div>
      </header>
      <div className="mes-layout__primary">
        <div className="quality-board__grid">
          <article className="mes-card quality-card">
            <header>
              <h2>КПИ качества</h2>
            </header>
            <div className="quality-card__body">
              <div className="metric">
                <span className="metric__label">Пройдено</span>
                <span className="metric__value">
                  {qualityScore ? formatPercent(qualityScore.passed) : '—'}
                </span>
              </div>
              <div className="metric">
                <span className="metric__label">Заблокировано</span>
                <span className="metric__value">{qualityScore ? qualityScore.blocked : 0}</span>
              </div>
              <div className="metric">
                <span className="metric__label">Записей в журнале</span>
                <span className="metric__value">{qualityChecks.length}</span>
              </div>
            </div>
          </article>
          <article className="mes-card quality-card quality-card--tall">
          <header>
            <h2>Несоответствия</h2>
            <p className="muted">Внимание на высокие степени риска.</p>
          </header>
          <ul className="quality-card__list">
            {escalations.map(item => (
              <li key={item.id}>
                <div>
                  <strong>{item.refType} #{item.refId}</strong>
                  <p className="muted">Действие: {item.action ?? '—'}</p>
                </div>
                <span className={`status status--${item.severity}`}>{item.status}</span>
              </li>
            ))}
            {escalations.length === 0 && <li className="muted">Нет открытых инцидентов</li>}
          </ul>
        </article>
        <article className="mes-card quality-card quality-card--tall">
          <header>
            <h2>Планы тестирования</h2>
            <p className="muted">Охват и владельцы по каждому обязательному сценарию.</p>
          </header>
          <ul className="quality-card__list">
            {testPlans.map(plan => (
              <li key={plan.id}>
                <div>
                  <strong>{plan.name}</strong>
                  <p className="muted">Команда: {plan.ownerTeam}</p>
                  <p className="muted">Обязателен для: {plan.requiredFor.join(', ')}</p>
                </div>
                <span>{formatPercent(plan.coverage)}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="mes-card quality-card">
          <header>
            <h2>Ход тестов</h2>
            <p className="muted">Полевые данные из HIL и burn-in.</p>
          </header>
          <div className="quality-card__body quality-card__body--runs">
            <div>
              <span className="metric__label">В очереди</span>
              <span className="metric__value">{testRunBuckets.queued}</span>
            </div>
            <div>
              <span className="metric__label">В работе</span>
              <span className="metric__value">{testRunBuckets.running}</span>
            </div>
            <div>
              <span className="metric__label">Пройдено</span>
              <span className="metric__value">{testRunBuckets.passed}</span>
            </div>
            <div>
              <span className="metric__label">С дефектами</span>
              <span className="metric__value">{testRunBuckets.defects}</span>
            </div>
          </div>
        </article>
        </div>
      </div>
    </section>
  );
};
