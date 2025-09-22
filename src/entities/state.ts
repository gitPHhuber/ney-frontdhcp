import { type InventoryState } from './inventory/types';
import { type MesState } from './mes/types';
import { type ErpState } from './erp/types';
import { type TaskState } from './tasks/types';
import { type ProductPassportState } from './product-passport/types';
import { type AutomationState } from './automation/types';
import { type WorkforceState } from './workforce/types';
import { deepClone } from './utils';
import { inventorySeed } from './state/inventorySeed';
import { mesSeed } from './state/mesSeed';
import { erpSeed } from './state/erpSeed';
import { tasksSeed } from './state/tasksSeed';
import { passportsSeed } from './state/passportsSeed';
import { automationSeed } from './state/automationSeed';
import { workforceSeed } from './state/workforceSeed';

export interface EnterpriseState {
  inventory: InventoryState;
  mes: MesState;
  erp: ErpState;
  tasks: TaskState;
  passports: ProductPassportState;
  automation: AutomationState;
  workforce: WorkforceState;
}

const seedState: EnterpriseState = {
  inventory: inventorySeed,
  mes: mesSeed,
  erp: erpSeed,
  tasks: tasksSeed,
  passports: passportsSeed,
  automation: automationSeed,
  workforce: workforceSeed,
};

export const enterpriseState: EnterpriseState = deepClone(seedState);

export const resetEnterpriseState = () => {
  const snapshot = deepClone(seedState);
  enterpriseState.inventory = snapshot.inventory;
  enterpriseState.mes = snapshot.mes;
  enterpriseState.erp = snapshot.erp;
  enterpriseState.tasks = snapshot.tasks;
  enterpriseState.passports = snapshot.passports;
  enterpriseState.automation = snapshot.automation;
  enterpriseState.workforce = snapshot.workforce;
};
