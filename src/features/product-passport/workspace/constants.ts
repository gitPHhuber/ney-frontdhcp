import type { DeviceStatus } from '../../../entities';

export const deviceStatusLabels: Record<DeviceStatus, string> = {
  in_service: 'В эксплуатации',
  maintenance: 'На обслуживании',
  storage: 'Склад',
  decommissioned: 'Списано',
};
