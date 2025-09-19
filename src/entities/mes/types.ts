export type WorkOrderStatus = 'planned' | 'in-progress' | 'paused' | 'completed' | 'blocked';
export type ProductionOrderStatus = 'draft' | 'released' | 'in-progress' | 'completed' | 'closed';
export type QualityStatus = 'pending' | 'passed' | 'failed' | 'blocked';
export type NonconformanceStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type MaintenanceOrderStatus = 'draft' | 'scheduled' | 'in-progress' | 'completed';

export interface OperationStep {
  opId: string;
  seq: number;
  wcId: string;
  stdTimeMin: number;
}

export interface Routing {
  id: string;
  itemId: string;
  operations: OperationStep[];
}

export interface WorkCenter {
  id: string;
  name: string;
  capabilityTags: string[];
}

export interface ProductionOrder {
  id: string;
  itemId: string;
  qty: number;
  dueDate: string;
  status: ProductionOrderStatus;
  releasedAt?: string;
}

export interface WorkOrder {
  id: string;
  prodOrderId: string;
  opId: string;
  wcId: string;
  assignee?: string;
  status: WorkOrderStatus;
  startedAt?: string;
  finishedAt?: string;
}

export interface QualityCheckEvidence {
  id: string;
  type: 'image' | 'document' | 'note';
  url?: string;
  content?: string;
}

export interface QualityCheck {
  id: string;
  entityType: 'StockLot' | 'ProductionOrder' | 'WorkOrder' | 'PurchaseOrder';
  entityId: string;
  ruleId: string;
  status: QualityStatus;
  evidence: QualityCheckEvidence[];
}

export interface Nonconformance {
  id: string;
  refType: 'ProductionOrder' | 'WorkOrder' | 'PurchaseOrder' | 'QualityCheck';
  refId: string;
  severity: 'low' | 'medium' | 'high';
  status: NonconformanceStatus;
  action?: string;
}

export interface MaintenanceLogEntry {
  id: string;
  ts: string;
  note: string;
  actor: string;
}

export interface MaintenanceOrder {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'inspection';
  status: MaintenanceOrderStatus;
  schedule: string;
  logs: MaintenanceLogEntry[];
}

export interface MesState {
  routings: Routing[];
  workCenters: WorkCenter[];
  productionOrders: ProductionOrder[];
  workOrders: WorkOrder[];
  qualityChecks: QualityCheck[];
  nonconformances: Nonconformance[];
  maintenanceOrders: MaintenanceOrder[];
}
