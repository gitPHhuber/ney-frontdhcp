/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';

// Simulates the data that would come from the backend API.
export const MOCK_LEASES: Lease[] = [
  { id: 1, ip: '192.168.1.101', mac: '00:1A:2B:3C:4D:5E', hostname: 'dev-machine-01', status: 'in_work', taken_by: 'admin', priority: 'medium', labels: ['development', 'urgent'] },
  { id: 2, ip: '192.168.1.102', mac: '00:1A:2B:3C:4D:5F', hostname: 'test-server-alpha', status: 'completed', taken_by: 'admin', priority: 'low', labels: ['qa'] },
  { id: 3, ip: '192.168.1.103', mac: '00:1A:2B:3C:4D:6A', hostname: 'fileshare-nas', status: 'active', taken_by: null, priority: 'low', labels: ['storage'] },
  { id: 4, ip: '192.168.1.104', mac: '00:1A:2B:3C:4D:6B', hostname: 'web-prod-01', status: 'active', taken_by: null, priority: 'high', labels: ['production', 'web'] },
  { id: 5, ip: '192.168.1.105', mac: '00:1A:2B:3C:4D:6C', hostname: 'db-master', status: 'broken', taken_by: null, priority: 'high', labels: ['database', 'maintenance'] },
  { id: 6, ip: '192.168.1.106', mac: '00:1A:2B:3C:4D:6D', hostname: 'monitoring-vm', status: 'pending', taken_by: null, priority: 'medium', labels: ['monitoring'] },
  { id: 7, ip: '192.168.1.107', mac: '00:1A:2B:3C:4D:6E', hostname: 'build-agent-ci', status: 'active', taken_by: null, priority: 'low', labels: ['ci', 'automation'] },
  { id: 8, ip: '192.168.1.108', mac: '00:1A:2B:3C:4D:6F', hostname: 'vpn-gateway', status: 'in_work', taken_by: 'jdoe', priority: 'medium', labels: ['network', 'security'] },
  { id: 9, ip: '192.168.1.109', mac: '00:1A:2B:3C:4D:7A', hostname: 'k8s-node-1', status: 'active', taken_by: null, priority: 'low', labels: ['k8s', 'cluster'] },
  { id: 10, ip: '192.168.1.110', mac: '00:1A:2B:3C:4D:7B', hostname: 'k8s-node-2', status: 'completed', taken_by: 'admin', priority: 'low', labels: ['k8s', 'cluster'] },
];

export const MOCK_STATIC_LEASES: Lease[] = [
  { id: 101, ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', hostname: 'main-printer', status: 'reserved', taken_by: 'admin', priority: 'medium', labels: ['office', 'peripheral'] },
  { id: 102, ip: '192.168.1.50', mac: 'AA:BB:CC:DD:EE:02', hostname: 'entry-camera', status: 'reserved', taken_by: 'admin', priority: 'low', labels: ['security'] },
  { id: 103, ip: '192.168.1.2', mac: 'AA:BB:CC:DD:EE:03', hostname: 'firewall-main', status: 'reserved', taken_by: 'admin', priority: 'high', labels: ['network', 'critical'] },
];