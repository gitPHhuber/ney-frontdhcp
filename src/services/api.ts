/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { MOCK_LEASES, MOCK_STATIC_LEASES } from '../data/mockData';
// Fix: Corrected import path for types
import type { DhcpServerState, Lease, LogEntry, Permission, Role, User } from '../types';

type LeaseStorageShape = Omit<Lease, 'labels'> & { labels?: string[] };

const normalizeLease = (lease: LeaseStorageShape): Lease => ({
    ...lease,
    labels: Array.isArray(lease.labels) ? lease.labels : [],
});

const normalizeLeases = (items: LeaseStorageShape[]): Lease[] => items.map(normalizeLease);

// --- LOCAL STORAGE HELPERS ---
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from storage`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to storage`, error);
    }
};


// --- MOCK DATABASE ---
const ALL_PERMISSIONS: Record<string, Permission[]> = {
    'Leases': ['leases:read', 'leases:update', 'leases:delete'],
    'Static IPs': ['static_ips:read', 'static_ips:create', 'static_ips:delete'],
    'Reports': ['reports:read'],
    'Users': ['users:read', 'users:update', 'users:delete'],
    'Roles': ['roles:read', 'roles:create', 'roles:update', 'roles:delete'],
    'Settings': ['settings:read', 'settings:update'],
};

const INITIAL_ROLES: Role[] = [
    { id: 1, name: 'Administrator', permissions: Object.values(ALL_PERMISSIONS).flat() },
    { id: 2, name: 'Network Engineer', permissions: ['leases:read', 'leases:update', 'static_ips:read', 'static_ips:create', 'static_ips:delete', 'reports:read', 'settings:read'] },
    { id: 3, name: 'Auditor', permissions: ['leases:read', 'static_ips:read', 'reports:read'] },
];

const INITIAL_USERS: User[] = [
    { id: 1, username: 'admin', roleId: 1, status: 'active' },
    { id: 2, username: 'user', roleId: 2, status: 'active' },
    { id: 3, username: 'newuser', roleId: 3, status: 'pending' },
];

const INITIAL_DHCP_SERVER: DhcpServerState = {
    isConnected: false,
    status: 'offline',
    config: {
        server_ip: '',
        subnet_mask: '255.255.255.0',
        ip_range_start: '192.168.1.100',
        ip_range_end: '192.168.1.200',
        router: '192.168.1.1',
        dns_server: '8.8.8.8',
        lease_time: '24h',
    },
    logs: []
};

let leases = normalizeLeases(loadFromStorage<LeaseStorageShape[]>('netgrip_leases', [...MOCK_LEASES]));
let staticLeases = normalizeLeases(loadFromStorage<LeaseStorageShape[]>('netgrip_static_leases', [...MOCK_STATIC_LEASES]));
let MOCK_ROLES = loadFromStorage('netgrip_roles', INITIAL_ROLES);
let MOCK_USERS = loadFromStorage('netgrip_users', INITIAL_USERS);
let MOCK_DHCP_SERVER = loadFromStorage('netgrip_dhcp_server', INITIAL_DHCP_SERVER);

let nextStaticLeaseId = Math.max(200, ...staticLeases.map(l => l.id)) + 1;
let nextUserId = Math.max(4, ...MOCK_USERS.map(u => u.id)) + 1;
let nextRoleId = Math.max(4, ...MOCK_ROLES.map(r => r.id)) + 1;


const addLog = (level: LogEntry['level'], message: string) => {
  MOCK_DHCP_SERVER.logs.unshift({ timestamp: Date.now(), level, message });
  if (MOCK_DHCP_SERVER.logs.length > 100) {
    MOCK_DHCP_SERVER.logs.pop();
  }
  saveToStorage('netgrip_dhcp_server', MOCK_DHCP_SERVER);
};

// Simulates network requests to a backend.
export const api = {
  login: (username, password): Promise<{ token: string; user: User, permissions: Permission[] }> => new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username === username);
      if (user) {
          if (user.status === 'pending') {
              reject(new Error('Account is pending approval.'));
          } else if (user.status === 'active') {
              // SANDBOX MODE: Grant admin permissions to any logged-in user.
              const adminRole = MOCK_ROLES.find(r => r.name === 'Administrator');
              const permissions = adminRole ? adminRole.permissions : [];
              resolve({ token: `fake-token-for-${user.id}`, user: user, permissions });
          } else {
              reject(new Error('Account is inactive.'));
          }
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 500);
  }),
  
  ssoLogin: (provider: string): Promise<{ token: string; user: User, permissions: Permission[] }> => new Promise((resolve) => {
    setTimeout(() => {
        console.log(`Simulating SSO login with ${provider}`);
        const user = MOCK_USERS.find(u => u.username === 'admin');
        const adminRole = MOCK_ROLES.find(r => r.name === 'Administrator');
        const permissions = adminRole ? adminRole.permissions : [];
        resolve({ token: `fake-sso-token-for-${user.id}`, user, permissions });
    }, 500);
  }),

  register: (username, password): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (MOCK_USERS.some(u => u.username === username)) {
            reject(new Error('Username already exists.'));
            return;
        }
        const newUser: User = {
            id: nextUserId++,
            username,
            roleId: 3, // New users default to Auditor role
            status: 'pending',
        };
        MOCK_USERS.push(newUser);
        saveToStorage('netgrip_users', MOCK_USERS);
        resolve({ success: true });
    }, 500);
  }),

  forgotPassword: (username: string): Promise<{ success: boolean }> => new Promise(resolve => {
    setTimeout(() => {
        console.log(`Password reset requested for user: ${username}`);
        resolve({ success: true });
    }, 500);
  }),
  
  changePassword: (userId: number, newPassword: string): Promise<{ success: boolean }> => new Promise(resolve => {
    setTimeout(() => {
        console.log(`Password for user ${userId} changed to "${newPassword}"`);
        resolve({ success: true });
    }, 500);
  }),

  // --- User Management API for Admins ---
  getUsers: (): Promise<User[]> => new Promise(resolve => {
    setTimeout(() => resolve(MOCK_USERS.map(u => ({...u}))), 300);
  }),

  approveUser: (userId: number): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (user) {
            user.status = 'active';
            saveToStorage('netgrip_users', MOCK_USERS);
            resolve({ success: true });
        } else {
            reject(new Error("User not found"));
        }
      }, 300);
  }),

  deleteUser: (userId: number): Promise<{ success: boolean }> => new Promise(resolve => {
      setTimeout(() => {
        MOCK_USERS = MOCK_USERS.filter(u => u.id !== userId);
        saveToStorage('netgrip_users', MOCK_USERS);
        resolve({ success: true });
      }, 300);
  }),
  
  updateUserRole: (userId: number, roleId: number): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const user = MOCK_USERS.find(u => u.id === userId);
          if (user) {
              user.roleId = roleId;
              saveToStorage('netgrip_users', MOCK_USERS);
              resolve({ success: true });
          } else {
              reject(new Error("User not found"));
          }
      }, 300);
  }),

  // --- Role Management ---
  getRoles: (): Promise<Role[]> => new Promise(resolve => {
      setTimeout(() => resolve(MOCK_ROLES.map(r => ({...r}))), 300);
  }),
  
  getAllPermissions: (): Promise<Record<string, Permission[]>> => new Promise(resolve => {
      setTimeout(() => resolve(ALL_PERMISSIONS), 100);
  }),
  
  createRole: (roleData: Omit<Role, 'id'>): Promise<Role> => new Promise(resolve => {
      setTimeout(() => {
          const newRole = { ...roleData, id: nextRoleId++ };
          MOCK_ROLES.push(newRole);
          saveToStorage('netgrip_roles', MOCK_ROLES);
          resolve(newRole);
      }, 300);
  }),

  updateRole: (updatedRole: Role): Promise<Role> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const index = MOCK_ROLES.findIndex(r => r.id === updatedRole.id);
          if (index !== -1) {
              MOCK_ROLES[index] = updatedRole;
              saveToStorage('netgrip_roles', MOCK_ROLES);
              resolve(updatedRole);
          } else {
              reject(new Error("Role not found"));
          }
      }, 300);
  }),

  deleteRole: (roleId: number): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      setTimeout(() => {
          if (MOCK_USERS.some(u => u.roleId === roleId)) {
              reject(new Error("Cannot delete role: it is currently assigned to one or more users."));
              return;
          }
          MOCK_ROLES = MOCK_ROLES.filter(r => r.id !== roleId);
          saveToStorage('netgrip_roles', MOCK_ROLES);
          resolve({ success: true });
      }, 300);
  }),

  // --- Dashboard & Leases API ---
  getDashboardStats: (): Promise<{
    total: number;
    active: number;
    in_work: number;
    broken: number;
    pending: number;
    completed: number;
    popularLabels: { label: string; count: number }[];
  }> => new Promise(resolve => {
    setTimeout(() => {
        const labelCounts = leases.reduce<Record<string, number>>((acc, lease) => {
            lease.labels.forEach(label => {
                const normalizedLabel = label.trim();
                if (!normalizedLabel) return;
                acc[normalizedLabel] = (acc[normalizedLabel] || 0) + 1;
            });
            return acc;
        }, {});

        const popularLabels = Object.entries(labelCounts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        const stats = {
            total: leases.length,
            active: leases.filter(l => l.status === 'active').length,
            in_work: leases.filter(l => l.status === 'in_work').length,
            broken: leases.filter(l => l.status === 'broken').length,
            pending: leases.filter(l => l.status === 'pending').length,
            completed: leases.filter(l => l.status === 'completed').length,
            popularLabels,
        };
        resolve(stats);
    }, 300);
  }),
  getLeases: (): Promise<Lease[]> => new Promise(resolve => {
    setTimeout(() => resolve(leases.map(lease => ({ ...lease, labels: [...lease.labels] }))), 300);
  }),
  editLease: (updatedLease: Lease): Promise<Lease> => new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = leases.findIndex(l => l.id === updatedLease.id);
      if (index !== -1) {
        const normalizedLease = normalizeLease(updatedLease);
        leases[index] = normalizedLease;
        saveToStorage('netgrip_leases', leases);
        resolve(normalizedLease);
      } else {
        reject(new Error('Lease not found'));
      }
    }, 300);
  }),
  deleteLease: (leaseId: number): Promise<{ success: boolean }> => new Promise(resolve => {
    setTimeout(() => {
      leases = leases.filter(l => l.id !== leaseId);
      saveToStorage('netgrip_leases', leases);
      resolve({ success: true });
    }, 300);
  }),
  getStaticLeases: (): Promise<Lease[]> => new Promise(resolve => {
    setTimeout(() => resolve(staticLeases.map(lease => ({ ...lease, labels: [...lease.labels] }))), 300);
  }),
  addStaticLease: (data: { ip: string; mac: string; hostname: string }): Promise<Lease> => new Promise(resolve => {
    setTimeout(() => {
      const newStaticLease: Lease = {
        ...data,
        id: nextStaticLeaseId++,
        status: 'reserved',
        taken_by: 'admin',
        priority: 'medium',
        labels: [],
      };
      staticLeases.push(newStaticLease);
      saveToStorage('netgrip_static_leases', staticLeases);
      resolve(newStaticLease);
    }, 300);
  }),
  deleteStaticLease: (leaseId: number): Promise<{ success: boolean }> => new Promise(resolve => {
    setTimeout(() => {
      staticLeases = staticLeases.filter(l => l.id !== leaseId);
      saveToStorage('netgrip_static_leases', staticLeases);
      resolve({ success: true });
    }, 300);
  }),

  // --- Reports API ---
  getWeeklyLeaseActivityReport: (): Promise<{ report: { status: string; count: number }[], summary: string }> => new Promise(resolve => {
    setTimeout(() => {
        // Fix: Explicitly type accumulator to ensure correct type inference for statusCounts.
        const statusCounts = leases.reduce((acc: Record<string, number>, lease) => {
            const statusLabel = lease.status.replace('_', ' ').charAt(0).toUpperCase() + lease.status.replace('_', ' ').slice(1);
            acc[statusLabel] = (acc[statusLabel] || 0) + 1;
            return acc;
        }, {});
        
        const report = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
        const mostCommon = Object.keys(statusCounts).length > 0 ? `'${Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b)}'` : 'N/A';
        const summary = `A total of ${leases.length} leases were analyzed. The most common status is ${mostCommon}.`;
        
        resolve({ report, summary });
    }, 400);
  }),
  getNetworkUtilizationReport: (): Promise<{ report: { category: string; value: string | number }[], summary: string }> => new Promise(resolve => {
    setTimeout(() => {
        const totalPossible = 101; // From .100 to .200 inclusive
        const dynamicUsed = leases.length;
        const staticUsed = staticLeases.length;
        const totalUsed = dynamicUsed; // Utilization usually refers to dynamic pool
        const utilization = totalPossible > 0 ? ((totalUsed / totalPossible) * 100).toFixed(1) + '%' : '0%';
        
        const report = [
            { category: 'IP Range', value: `${MOCK_DHCP_SERVER.config.ip_range_start} - ${MOCK_DHCP_SERVER.config.ip_range_end}` },
            { category: 'Available IPs in Range', value: totalPossible },
            { category: 'Dynamic Leases Used', value: dynamicUsed },
            { category: 'Static Reservations', value: staticUsed },
            { category: 'DHCP Pool Utilization', value: utilization },
        ];
        const summary = `The DHCP pool has a ${utilization} utilization rate with ${totalUsed} out of ${totalPossible} available dynamic IPs assigned.`;
        
        resolve({ report, summary });
    }, 400);
  }),

  // --- DHCP Server API ---
  getDhcpServerState: (): Promise<DhcpServerState> => new Promise(resolve => {
      setTimeout(() => resolve(JSON.parse(JSON.stringify(MOCK_DHCP_SERVER))), 200);
  }),
  connectToDhcpServer: (ip: string): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      setTimeout(() => {
          if (ip === "192.168.1.1") {
              MOCK_DHCP_SERVER.isConnected = true;
              MOCK_DHCP_SERVER.status = 'online';
              MOCK_DHCP_SERVER.config.server_ip = ip;
              MOCK_DHCP_SERVER.logs = []; // Clear logs on new connection
              saveToStorage('netgrip_dhcp_server', MOCK_DHCP_SERVER); // Save state before adding logs
              addLog('INFO', `Successfully connected to DHCP server at ${ip}.`);
              addLog('INFO', 'Server is online and serving leases.');
              resolve({ success: true });
          } else {
              reject(new Error("Invalid IP or server not found."));
          }
      }, 1000);
  }),
  disconnectFromDhcpServer: (): Promise<{ success: boolean }> => new Promise(resolve => {
      setTimeout(() => {
          const oldIp = MOCK_DHCP_SERVER.config.server_ip;
          MOCK_DHCP_SERVER.isConnected = false;
          MOCK_DHCP_SERVER.status = 'offline';
          MOCK_DHCP_SERVER.config.server_ip = '';
          saveToStorage('netgrip_dhcp_server', MOCK_DHCP_SERVER);
          addLog('INFO', `Disconnected from DHCP server at ${oldIp}.`);
          resolve({ success: true });
      }, 500);
  }),
  controlDhcpServer: (action: 'start' | 'stop' | 'restart'): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      if (!MOCK_DHCP_SERVER.isConnected) {
          reject(new Error("Not connected to any server."));
          return;
      }
      setTimeout(() => {
          switch (action) {
              case 'start':
                  if (MOCK_DHCP_SERVER.status === 'offline') {
                      MOCK_DHCP_SERVER.status = 'online';
                      addLog('INFO', 'DHCP service started successfully.');
                  }
                  break;
              case 'stop':
                   if (MOCK_DHCP_SERVER.status === 'online') {
                      MOCK_DHCP_SERVER.status = 'offline';
                      addLog('WARN', 'DHCP service has been stopped.');
                   }
                   break;
              case 'restart':
                  if (MOCK_DHCP_SERVER.status === 'online') {
                      MOCK_DHCP_SERVER.status = 'restarting';
                      addLog('INFO', 'DHCP service restarting...');
                      setTimeout(() => {
                          MOCK_DHCP_SERVER.status = 'online';
                          addLog('INFO', 'DHCP service has restarted successfully.');
                      }, 2500);
                  }
                  break;
          }
          resolve({ success: true });
      }, 500);
  }),
};