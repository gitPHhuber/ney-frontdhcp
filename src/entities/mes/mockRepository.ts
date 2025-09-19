import { enterpriseState } from '../state';
import { inventoryRepository } from '../inventory/mockRepository';
import { deepClone, generateId } from '../utils';
import type {
  MaintenanceLogEntry,
  MaintenanceOrder,
  MesState,
  Nonconformance,
  ProductionOrder,
  QualityCheck,
  WorkCenter,
  WorkOrder,
} from './types';

const getState = (): MesState => enterpriseState.mes;

const resolveDefaultLocations = () => {
  const locations = enterpriseState.inventory.locations;
  const raw = locations.find(location => location.path.toLowerCase().includes('raw'))?.id ?? locations[0]?.id;
  const wip = locations.find(location => location.path.toLowerCase().includes('wip'))?.id ?? locations[0]?.id;
  const fg = locations.find(location => location.path.toLowerCase().includes('fg'))?.id ?? locations[0]?.id;
  return { raw, wip, fg };
};

const allWorkOrdersCompleted = (prodOrderId: string) => {
  const state = getState();
  return state.workOrders
    .filter(order => order.prodOrderId === prodOrderId)
    .every(order => order.status === 'completed');
};

export const mesRepository = {
  async listWorkCenters(): Promise<WorkCenter[]> {
    return deepClone(getState().workCenters);
  },
  async listRoutings() {
    return deepClone(getState().routings);
  },
  async listProductionOrders(): Promise<ProductionOrder[]> {
    return deepClone(getState().productionOrders);
  },
  async listWorkOrders(): Promise<WorkOrder[]> {
    return deepClone(getState().workOrders);
  },
  async listQualityChecks(): Promise<QualityCheck[]> {
    return deepClone(getState().qualityChecks);
  },
  async listNonconformances(): Promise<Nonconformance[]> {
    return deepClone(getState().nonconformances);
  },
  async listMaintenanceOrders(): Promise<MaintenanceOrder[]> {
    return deepClone(getState().maintenanceOrders);
  },
  async generateWorkOrders(prodOrderId: string): Promise<WorkOrder[]> {
    const state = getState();
    const productionOrder = state.productionOrders.find(order => order.id === prodOrderId);
    if (!productionOrder) {
      throw new Error(`Production order ${prodOrderId} not found`);
    }
    const routing = state.routings.find(route => route.itemId === productionOrder.itemId);
    if (!routing) {
      throw new Error(`Routing not found for item ${productionOrder.itemId}`);
    }
    const existing = state.workOrders.filter(order => order.prodOrderId === prodOrderId);
    if (existing.length === routing.operations.length) {
      return deepClone(existing);
    }
    const generated: WorkOrder[] = routing.operations.map(operation => ({
      id: generateId(`wo-${prodOrderId}`),
      prodOrderId,
      opId: operation.opId,
      wcId: operation.wcId,
      status: 'planned',
    }));
    state.workOrders.push(...generated);
    return deepClone(generated);
  },
  async updateProductionStatus(prodOrderId: string, status: ProductionOrder['status']): Promise<ProductionOrder> {
    const state = getState();
    const productionOrder = state.productionOrders.find(order => order.id === prodOrderId);
    if (!productionOrder) {
      throw new Error(`Production order ${prodOrderId} not found`);
    }
    productionOrder.status = status;
    if (status === 'released' && !productionOrder.releasedAt) {
      productionOrder.releasedAt = new Date().toISOString();
    }
    return deepClone(productionOrder);
  },
  async startWorkOrder(workOrderId: string, assignee?: string): Promise<WorkOrder> {
    const state = getState();
    const workOrder = state.workOrders.find(order => order.id === workOrderId);
    if (!workOrder) {
      throw new Error(`Work order ${workOrderId} not found`);
    }
    workOrder.status = 'in-progress';
    workOrder.assignee = assignee ?? workOrder.assignee;
    workOrder.startedAt = new Date().toISOString();
    return deepClone(workOrder);
  },
  async completeWorkOrder(workOrderId: string): Promise<WorkOrder> {
    const state = getState();
    const workOrder = state.workOrders.find(order => order.id === workOrderId);
    if (!workOrder) {
      throw new Error(`Work order ${workOrderId} not found`);
    }
    workOrder.status = 'completed';
    workOrder.finishedAt = new Date().toISOString();

    const productionOrder = state.productionOrders.find(order => order.id === workOrder.prodOrderId);
    if (productionOrder) {
      const routing = state.routings.find(route => route.itemId === productionOrder.itemId);
      const operation = routing?.operations.find(op => op.opId === workOrder.opId);
      const { raw, wip, fg } = resolveDefaultLocations();

      if (operation && routing) {
        const firstOp = routing.operations[0];
        const lastOp = routing.operations[routing.operations.length - 1];
        if (operation.opId === firstOp.opId && raw && wip) {
          const bom = enterpriseState.inventory.boms.find(b => b.itemId === productionOrder.itemId);
          if (bom) {
            for (const component of bom.components) {
              await inventoryRepository.recordStockMove({
                itemId: component.itemId,
                qty: component.qty * productionOrder.qty,
                fromLocationId: raw,
                toLocationId: wip,
                refId: workOrder.id,
                refType: 'WorkOrder',
                note: 'Issue components',
              });
            }
          }
        }
        if (operation.opId === lastOp.opId && wip && fg) {
          await inventoryRepository.recordStockMove({
            itemId: productionOrder.itemId,
            qty: productionOrder.qty,
            fromLocationId: wip,
            toLocationId: fg,
            refId: workOrder.id,
            refType: 'WorkOrder',
            note: 'Finished goods transfer',
            status: 'available',
          });
        }
      }
      if (allWorkOrdersCompleted(productionOrder.id)) {
        productionOrder.status = 'completed';
      }
    }
    return deepClone(workOrder);
  },
  async recordQualityCheck(check: Omit<QualityCheck, 'id'>): Promise<QualityCheck> {
    const state = getState();
    const qualityCheck: QualityCheck = { ...check, id: generateId('qc') };
    state.qualityChecks.push(qualityCheck);
    return deepClone(qualityCheck);
  },
  async raiseNonconformance(nc: Omit<Nonconformance, 'id'>): Promise<Nonconformance> {
    const state = getState();
    const nonconformance: Nonconformance = { ...nc, id: generateId('nc') };
    state.nonconformances.push(nonconformance);
    return deepClone(nonconformance);
  },
  async appendMaintenanceLog(orderId: string, entry: Omit<MaintenanceLogEntry, 'id'>): Promise<MaintenanceOrder> {
    const state = getState();
    const maintenance = state.maintenanceOrders.find(order => order.id === orderId);
    if (!maintenance) {
      throw new Error(`Maintenance order ${orderId} not found`);
    }
    const log: MaintenanceLogEntry = { ...entry, id: generateId('mo-log') };
    maintenance.logs.push(log);
    return deepClone(maintenance);
  },
};

export type MesRepository = typeof mesRepository;
