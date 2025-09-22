export type WorkOrderStatus = 'planned' | 'in-progress' | 'paused' | 'completed' | 'blocked';
export type ProductionOrderStatus = 'draft' | 'released' | 'in-progress' | 'completed' | 'closed';
export type QualityStatus = 'pending' | 'passed' | 'failed' | 'blocked';
export type NonconformanceStatus = 'draft' | 'open' | 'investigating' | 'resolved' | 'closed';
export type MaintenanceOrderStatus = 'draft' | 'scheduled' | 'in-progress' | 'completed';
export type FlashPortState = 'disconnected' | 'ready' | 'bootloader' | 'flashing' | 'ok' | 'error';
export type FlashAgentStatus = 'online' | 'offline' | 'updating';
export type FlashJobStatus = 'queued' | 'running' | 'ok' | 'error' | 'aborted';
export type FlashLogLevel = 'info' | 'warn' | 'error';

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

export interface ProductionLine {
  id: string;
  name: string;
  streamId: string;
  workCenterIds: string[];
  shiftPattern: string;
  taktTimeSec: number;
  targetPerShift: number;
  currentWip: number;
  throughputPerShift: number;
  availability: number;
  blockers: string[];
}

export interface ValueStream {
  id: string;
  name: string;
  focus: string;
  demandThisWeek: number;
  backlogUnits: number;
  riskLevel: 'low' | 'medium' | 'high';
  gatekeepers: string[];
  nextMilestone: string;
}

export interface TestCell {
  id: string;
  name: string;
  capability: string;
  status: 'online' | 'maintenance' | 'idle';
  queueDepth: number;
  activePlanId?: string;
  shift: string;
  operators: string[];
}

export interface TestPlan {
  id: string;
  name: string;
  coverage: number;
  cycleTimeMin: number;
  ownerTeam: string;
  requiredFor: string[];
  lastValidatedAt: string;
}

export interface TestRun {
  id: string;
  testCellId: string;
  planId: string;
  boardSerial: string;
  status: 'queued' | 'running' | 'failed' | 'passed';
  startedAt: string;
  finishedAt?: string;
  operatorId: string;
  defectsFound: number;
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
  refType: 'ProductionOrder' | 'WorkOrder' | 'PurchaseOrder' | 'QualityCheck' | 'FlashJob';
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

export interface FlashAgent {
  id: string;
  workstationId: string;
  workstationName: string;
  status: FlashAgentStatus;
  version: string;
  ipAddress: string;
  supportedTools: string[];
  lastSeenAt: string;
  connectedPorts: string[];
}

export interface FlashPort {
  id: string;
  path: string;
  displayName: string;
  vendorId?: string;
  productId?: string;
  deviceHint?: string;
  busy: boolean;
  state: FlashPortState;
  workstationId: string;
  lastSeenAt: string;
  notes?: string;
}

export interface FlashArtifact {
  id: string;
  project: 'servers' | 'drones';
  deviceType: string;
  model: string;
  version: string;
  buildId: string;
  checksum: string;
  url: string;
  releasedAt: string;
  allowed: boolean;
  compatibleModels: string[];
  mandatoryOptions?: string[];
}

export interface FlashPresetOption {
  erase: boolean;
  verify: boolean;
  setParams: boolean;
  notes?: string;
}

export interface FlashChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface FlashPreset {
  id: string;
  name: string;
  project: 'servers' | 'drones';
  deviceType: string;
  model: string;
  artifactId: string;
  defaultOptions: FlashPresetOption;
  defaultChecklist: FlashChecklistItem[];
  requiresMasterOverride?: boolean;
}

export interface FlashLogEntry {
  id: string;
  ts: string;
  level: FlashLogLevel;
  message: string;
}

export interface FlashJob {
  id: string;
  jobNumber: string;
  portId: string;
  workstationId: string;
  operator: string;
  status: FlashJobStatus;
  project: 'servers' | 'drones';
  deviceType: string;
  model: string;
  serialNumber: string;
  presetId?: string;
  artifactId: string;
  artifactVersion: string;
  checksum: string;
  startedAt: string;
  finishedAt?: string;
  durationSec?: number;
  bytesWritten?: number;
  speedKbps?: number;
  progressPercent?: number;
  etaSec?: number;
  log: FlashLogEntry[];
  resultLogUrl?: string;
  ncrId?: string;
  reflash?: boolean;
  powerChecklist: FlashChecklistItem[];
}

export interface DeviceSession {
  serialNumber: string;
  project: 'servers' | 'drones';
  deviceType: string;
  model: string;
  lastArtifactId: string;
  lastArtifactVersion: string;
  lastFlashedAt: string;
  lastOperator: string;
  allowedArtifactIds: string[];
  notes?: string;
}

export interface MesState {
  routings: Routing[];
  workCenters: WorkCenter[];
  productionOrders: ProductionOrder[];
  workOrders: WorkOrder[];
  qualityChecks: QualityCheck[];
  nonconformances: Nonconformance[];
  maintenanceOrders: MaintenanceOrder[];
  productionLines: ProductionLine[];
  valueStreams: ValueStream[];
  testCells: TestCell[];
  testPlans: TestPlan[];
  testRuns: TestRun[];
  flashAgents: FlashAgent[];
  flashPorts: FlashPort[];
  flashArtifacts: FlashArtifact[];
  flashPresets: FlashPreset[];
  flashJobs: FlashJob[];
  deviceSessions: DeviceSession[];
}
