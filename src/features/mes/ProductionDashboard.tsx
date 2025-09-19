import React, { useMemo } from 'react';
import { useProductionOrdersQuery, useWorkOrdersQuery, useWorkCentersQuery, useQualityChecksQuery, useNonconformancesQuery, useMaintenanceOrdersQuery } from './hooks';
import type { ProductionOrder, WorkOrder } from '../../entities';

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const getProgress = (order: ProductionOrder, workOrders: WorkOrder[]) => {
  const total = workOrders.filter(workOrder => workOrder.prodOrderId === order.id).length;
  const completed = workOrders.filter(workOrder => workOrder.prodOrderId === order.id && workOrder.status === 'completed').length;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

export const ProductionDashboard: React.FC = () => {
  const { data: productionOrders = [] } = useProductionOrdersQuery();
  const { data: workOrders = [] } = useWorkOrdersQuery();
  const { data: workCenters = [] } = useWorkCentersQuery();
  const { data: qualityChecks = [] } = useQualityChecksQuery();
  const { data: nonconformances = [] } = useNonconformancesQuery();
  const { data: maintenanceOrders = [] } = useMaintenanceOrdersQuery();

  const workloadByCenter = useMemo(() => {
    return workCenters.map(center => {
      const queue = workOrders.filter(order => order.wcId === center.id && order.status !== 'completed');
      return {
        id: center.id,
        name: center.name,
        inQueue: queue.length,
        active: queue.some(order => order.status === 'in-progress'),
      };
    });
  }, [workCenters, workOrders]);

  return (
    <section className="mes-dashboard">
      <header className="mes-dashboard__header">
        <div>
          <h2>Manufacturing Execution</h2>
          <p className="muted">Stay ahead of production, work center load, and quality gates.</p>
        </div>
      </header>
      <div className="mes-dashboard__grid">
        <div className="mes-dashboard__panel">
          <h3>Production Orders</h3>
          <ul className="timeline">
            {productionOrders.map(order => {
              const progress = getProgress(order, workOrders);
              return (
                <li key={order.id}>
                  <div className="timeline__header">
                    <strong>{order.id}</strong>
                    <span className={`status status--${order.status}`}>{order.status}</span>
                  </div>
                  <p className="muted">Due {formatDate(order.dueDate)} • Qty {order.qty}</p>
                  <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress__bar" style={{ width: `${progress}%` }}>
                      <span>{progress}%</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mes-dashboard__panel">
          <h3>Work Center Load</h3>
          <ul className="work-centers">
            {workloadByCenter.map(center => (
              <li key={center.id}>
                <div>
                  <strong>{center.name}</strong>
                  <p className="muted">Queue: {center.inQueue}</p>
                </div>
                <span className={`status ${center.active ? 'status--running' : 'status--idle'}`}>
                  {center.active ? 'Active' : 'Idle'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mes-dashboard__panel">
          <h3>Quality Checks</h3>
          <ul className="quality-list">
            {qualityChecks.map(check => (
              <li key={check.id}>
                <span>{check.ruleId}</span>
                <span>{check.entityType} #{check.entityId}</span>
                <span className={`status status--${check.status}`}>{check.status}</span>
              </li>
            ))}
          </ul>
          <h4>Nonconformances</h4>
          <ul className="quality-list">
            {nonconformances.map(nc => (
              <li key={nc.id}>
                <span>{nc.refType} #{nc.refId}</span>
                <span>{nc.action ?? 'Pending action'}</span>
                <span className={`status status--${nc.status}`}>{nc.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mes-dashboard__panel">
          <h3>Maintenance Orders</h3>
          <ul className="maintenance-list">
            {maintenanceOrders.map(order => (
              <li key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <span className="muted">Asset {order.assetId}</span>
                </div>
                <span>{formatDate(order.schedule)}</span>
                <span className={`status status--${order.status}`}>{order.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
