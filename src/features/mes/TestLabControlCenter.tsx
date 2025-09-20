import React, { useMemo } from 'react';
import { useMaintenanceOrdersQuery, useTestCellsQuery, useTestPlansQuery, useTestRunsQuery } from './hooks';

const statusLabel: Record<string, string> = {
  online: 'В сети',
  maintenance: 'Обслуживание',
  idle: 'Простой',
  running: 'Выполняется',
  queued: 'В очереди',
  failed: 'С ошибкой',
  passed: 'Пройден',
};

export const TestLabControlCenter: React.FC = () => {
  const { data: testCells = [] } = useTestCellsQuery();
  const { data: testPlans = [] } = useTestPlansQuery();
  const { data: testRuns = [] } = useTestRunsQuery();
  const { data: maintenanceOrders = [] } = useMaintenanceOrdersQuery();

  const maintenanceByAsset = useMemo(() => {
    const grouped = new Map<string, string>();
    maintenanceOrders.forEach(order => {
      if (order.status !== 'completed') {
        grouped.set(order.assetId, order.status);
      }
    });
    return grouped;
  }, [maintenanceOrders]);

  const runsByCell = useMemo(() => {
    return testCells.map(cell => {
      const cellRuns = testRuns.filter(run => run.testCellId === cell.id);
      return {
        cell,
        running: cellRuns.filter(run => run.status === 'running').length,
        queued: cellRuns.filter(run => run.status === 'queued').length,
        failed: cellRuns.filter(run => run.status === 'failed').length,
      };
    });
  }, [testCells, testRuns]);

  return (
    <section className="test-lab" aria-label="Контроль тестовой лаборатории">
      <header className="test-lab__header">
        <div>
          <h1>Контроль тестовой лаборатории</h1>
          <p className="muted">Управляйте HIL и burn-in станциями, следите за очередями и планами калибровки.</p>
        </div>
        <div className="test-lab__actions">
          <button type="button" className="primary">Забронировать слот</button>
          <button type="button" className="secondary">Экспорт расписания</button>
        </div>
      </header>
      <div className="test-lab__grid">
        <article className="test-lab__card test-lab__card--wide">
          <header>
            <h2>Состояние стендов</h2>
          </header>
          <ul className="test-lab__cells">
            {runsByCell.map(({ cell, running, queued, failed }) => {
              const maintenanceStatus =
                maintenanceByAsset.get(cell.id) ?? (cell.id.includes('hil') ? maintenanceByAsset.get('wc-hil') : undefined);
              return (
                <li key={cell.id}>
                  <div>
                    <strong>{cell.name}</strong>
                    <p className="muted">{cell.capability}</p>
                    <p className="muted">Смена: {cell.shift}</p>
                    <p className="muted">Операторы: {cell.operators.join(', ')}</p>
                    {maintenanceStatus && (
                      <p className="alert">Обслуживание: {maintenanceStatus}</p>
                    )}
                  </div>
                  <div className="test-lab__cell-stats">
                    <span className={`status status--${cell.status}`}>{statusLabel[cell.status]}</span>
                    <span>Очередь: {cell.queueDepth}</span>
                    <span>В очереди (прогоны): {queued}</span>
                    <span>Запущено: {running}</span>
                    <span>Отказов: {failed}</span>
                    <span>План: {cell.activePlanId ?? '—'}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
        <article className="test-lab__card">
          <header>
            <h2>Распределение прогонов</h2>
            <p className="muted">Сводка последней смены.</p>
          </header>
          <div className="test-lab__runs">
            {['running', 'queued', 'failed', 'passed'].map(status => (
              <div key={status}>
                <span className="metric__label">{statusLabel[status]}</span>
                <span className="metric__value">{testRuns.filter(run => run.status === status).length}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="test-lab__card">
          <header>
            <h2>Стандарты и планы</h2>
            <p className="muted">Следите за актуальностью и покрытием.</p>
          </header>
          <ul className="test-lab__plans">
            {testPlans.map(plan => (
              <li key={plan.id}>
                <div>
                  <strong>{plan.name}</strong>
                  <p className="muted">Владелец: {plan.ownerTeam}</p>
                  <p className="muted">Последняя валидация: {new Date(plan.lastValidatedAt).toLocaleString('ru-RU')}</p>
                </div>
                <span className="metric__value">{Math.round(plan.coverage * 100)}%</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};
