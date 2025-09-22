import React, { useMemo } from 'react';
import { useMaintenanceOrdersQuery, useTestCellsQuery, useTestPlansQuery, useTestRunsQuery } from './hooks';

const formatNumber = (value: number) => value.toLocaleString('ru-RU');

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

  const testRunBuckets = useMemo(
    () =>
      testRuns.reduce(
        (acc, run) => {
          acc[run.status] = (acc[run.status] ?? 0) + 1;
          return acc;
        },
        { running: 0, queued: 0, failed: 0, passed: 0 } as Record<string, number>,
      ),
    [testRuns],
  );

  return (
    <section className="mes-page test-lab" aria-label="Контроль тестовой лаборатории">
      <header className="page__header">
        <div>
          <h1>Контроль тестовой лаборатории</h1>
          <p className="muted">Управляйте HIL и burn-in станциями, следите за очередями и планами калибровки.</p>
        </div>
        <div className="page__header-actions">
          <button type="button" className="primary">Забронировать слот</button>
          <button type="button" className="secondary">Экспорт расписания</button>
        </div>
      </header>

      <div className="page__metrics">
        <div className="page__metric-card">
          <span className="metric__label">Стендов в работе</span>
          <span className="metric__value">{formatNumber(testCells.length)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Прогонов сегодня</span>
          <span className="metric__value">{formatNumber(testRuns.length)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Очередь</span>
          <span className="metric__value">{formatNumber(testRunBuckets.queued)}</span>
        </div>
        <div className="page__metric-card">
          <span className="metric__label">Планы</span>
          <span className="metric__value">{formatNumber(testPlans.length)}</span>
        </div>
      </div>

      <div className="page__content">
        <section className="page__main" aria-label="Состояние стендов">
          <div className="page__panel-grid">
            <article className="card test-lab__card test-lab__card--wide">
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
                        {maintenanceStatus && <p className="alert">Обслуживание: {maintenanceStatus}</p>}
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
                {runsByCell.length === 0 && <li className="muted">Стенды не зарегистрированы</li>}
              </ul>
            </article>

            <article className="card test-lab__card">
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
                {testPlans.length === 0 && <li className="muted">Планы не назначены</li>}
              </ul>
            </article>
          </div>
        </section>
        <aside className="page__sidebar" aria-label="Очереди и обслуживание">
          <section className="card test-lab__card" aria-label="Распределение прогонов">
            <h2>Распределение прогонов</h2>
            <div className="test-lab__runs">
              {['running', 'queued', 'failed', 'passed'].map(status => (
                <div key={status}>
                  <span className="metric__label">{statusLabel[status]}</span>
                  <span className="metric__value">{testRuns.filter(run => run.status === status).length}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card test-lab__card" aria-label="Активные заявки на обслуживание">
            <h2>Активные заявки</h2>
            <ul className="test-lab__plans">
              {maintenanceOrders
                .filter(order => order.status !== 'completed')
                .slice(0, 5)
                .map(order => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.assetId}</strong>
                      <p className="muted">Тип: {order.type}</p>
                      <p className="muted">Статус: {order.status}</p>
                    </div>
                    <span className="metric__value">{order.schedule}</span>
                  </li>
                ))}
              {maintenanceOrders.filter(order => order.status !== 'completed').length === 0 && (
                <li className="muted">Обслуживание не требуется</li>
              )}
            </ul>
          </section>
        </aside>
      </div>

      <section className="page__summary card" aria-label="Сводка прогонов по стендам">
        <h2>Сводка прогонов по стендам</h2>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Стенд</th>
              <th scope="col">Запущено</th>
              <th scope="col">В очереди</th>
              <th scope="col">Отказов</th>
            </tr>
          </thead>
          <tbody>
            {runsByCell.map(({ cell, running, queued, failed }) => (
              <tr key={cell.id}>
                <td>{cell.name}</td>
                <td>{running}</td>
                <td>{queued}</td>
                <td>{failed}</td>
              </tr>
            ))}
            {runsByCell.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">Нет данных по прогонам</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </section>
  );

};
