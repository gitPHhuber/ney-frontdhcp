
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lease {
    id: number;
    ip: string;
    mac: string;
    hostname: string;
    status: 'active' | 'in_work' | 'completed' | 'broken' | 'pending' | 'reserved' | 'online' | 'offline' | 'restarting';
    taken_by: string | null;
    priority: 'high' | 'medium' | 'low';
    labels: string[];
}

export type Permission =
    | 'leases:read' | 'leases:update' | 'leases:delete'
    | 'static_ips:read' | 'static_ips:create' | 'static_ips:delete'
    | 'reports:read'
    | 'users:read' | 'users:update' | 'users:delete'
    | 'roles:read' | 'roles:create' | 'roles:update' | 'roles:delete'
    | 'settings:read' | 'settings:update'
    | 'access:read' | 'access:approve'
    | 'audit:read'
    | 'mes:production' | 'mes:quality' | 'mes:labs' | 'mes:workforce';

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  roleId: number;
  status: 'active' | 'pending';
}

export interface AccessAuditEvent {
    id: number;
    actor: string;
    action: string;
    target: string;
    risk: 'low' | 'medium' | 'high';
    timestamp: number;
    description: string;
}

export interface AccessRequest {
    id: number;
    username: string;
    currentRoleId: number;
    requestedRoleId: number;
    justification: string;
    submittedAt: number;
    status: 'pending' | 'approved' | 'rejected';
    reviewer?: string;
    reviewComment?: string;
}

export interface LogEntry {
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

export interface DhcpServerConfig {
    server_ip: string;
    subnet_mask: string;
    ip_range_start: string;
    ip_range_end: string;
    router: string;
    dns_server: string;
    lease_time: string;
}

export interface DhcpServerState {
    isConnected: boolean;
    status: 'online' | 'offline' | 'restarting';
    config: DhcpServerConfig;
    logs: LogEntry[];
}