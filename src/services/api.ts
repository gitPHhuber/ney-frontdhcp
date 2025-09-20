/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { MOCK_LEASES, MOCK_STATIC_LEASES } from '../data/mockData';
// Fix: Corrected import path for types
import type {
    AccessAuditEvent,
    AccessRequest,
    DhcpServerState,
    Lease,
    LogEntry,
    Permission,
    Role,
    User,
} from '../types';

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
    'Выдача адресов': ['leases:read', 'leases:update', 'leases:delete'],
    'Статические IP': ['static_ips:read', 'static_ips:create', 'static_ips:delete'],
    'Отчёты': ['reports:read'],
    'Пользователи': ['users:read', 'users:update', 'users:delete'],
    'Роли': ['roles:read', 'roles:create', 'roles:update', 'roles:delete'],
    'Настройки': ['settings:read', 'settings:update'],
    'Контроль доступа': ['access:read', 'access:approve', 'audit:read'],
};

const INITIAL_ROLES: Role[] = [
    { id: 1, name: 'Администратор', permissions: Object.values(ALL_PERMISSIONS).flat() },
    {
        id: 2,
        name: 'Сетевой инженер',
        permissions: [
            'leases:read',
            'leases:update',
            'static_ips:read',
            'static_ips:create',
            'static_ips:delete',
            'reports:read',
            'settings:read',
        ],
    },
    { id: 3, name: 'Аудитор', permissions: ['leases:read', 'static_ips:read', 'reports:read', 'audit:read'] },
    {
        id: 4,
        name: 'Менеджер доступа',
        permissions: [
            'users:read',
            'users:update',
            'roles:read',
            'roles:update',
            'access:read',
            'access:approve',
            'audit:read',
        ],
    },
];

const INITIAL_USERS: User[] = [
    { id: 1, username: 'admin', roleId: 1, status: 'active' },
    { id: 2, username: 'user', roleId: 2, status: 'active' },
    { id: 3, username: 'auditor', roleId: 3, status: 'active' },
    { id: 4, username: 'newuser', roleId: 4, status: 'pending' },
    { id: 5, username: 'contractor', roleId: 3, status: 'pending' },
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

const INITIAL_ACCESS_AUDIT: AccessAuditEvent[] = [
    {
        id: 1,
        actor: 'admin',
        action: 'Создана роль',
        target: 'Менеджер доступа',
        risk: 'medium',
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
        description: 'Администратор создал шаблон роли для управления пользователями и аудитом.',
    },
    {
        id: 2,
        actor: 'auditor',
        action: 'Просмотр журнала',
        target: 'DHCP сервер',
        risk: 'low',
        timestamp: Date.now() - 1000 * 60 * 60 * 3,
        description: 'Аудитор проверил свежие события DHCP через панель мониторинга.',
    },
    {
        id: 3,
        actor: 'admin',
        action: 'Изменены права',
        target: 'user',
        risk: 'medium',
        timestamp: Date.now() - 1000 * 60 * 30,
        description: 'Роль пользователя user обновлена с добавлением доступа к отчётам.',
    },
];

const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [
    {
        id: 1,
        username: 'newuser',
        currentRoleId: 4,
        requestedRoleId: 2,
        justification: 'Нужно сопровождать стенд разработки и управлять динамическими арендами.',
        submittedAt: Date.now() - 1000 * 60 * 90,
        status: 'pending',
    },
    {
        id: 2,
        username: 'contractor',
        currentRoleId: 3,
        requestedRoleId: 4,
        justification: 'Нужно подтверждать заявки и закрывать устаревшие учётные записи подрядчиков.',
        submittedAt: Date.now() - 1000 * 60 * 60 * 4,
        status: 'pending',
    },
    {
        id: 3,
        username: 'auditor',
        currentRoleId: 3,
        requestedRoleId: 3,
        justification: 'Запросил расширенный доступ к журналам для проверки SLA.',
        submittedAt: Date.now() - 1000 * 60 * 60 * 24,
        status: 'approved',
        reviewer: 'admin',
        reviewComment: 'Предоставлен одноразовый доступ к экспортам.',
    },
];

let leases = normalizeLeases(loadFromStorage<LeaseStorageShape[]>('netgrip_leases', [...MOCK_LEASES]));
let staticLeases = normalizeLeases(loadFromStorage<LeaseStorageShape[]>('netgrip_static_leases', [...MOCK_STATIC_LEASES]));
let MOCK_ROLES = loadFromStorage('netgrip_roles', INITIAL_ROLES);
let MOCK_USERS = loadFromStorage('netgrip_users', INITIAL_USERS);
let MOCK_DHCP_SERVER = loadFromStorage('netgrip_dhcp_server', INITIAL_DHCP_SERVER);
let ACCESS_AUDIT = loadFromStorage('netgrip_access_audit', INITIAL_ACCESS_AUDIT);
let ACCESS_REQUESTS = loadFromStorage('netgrip_access_requests', INITIAL_ACCESS_REQUESTS);

let nextStaticLeaseId = Math.max(200, ...staticLeases.map(l => l.id)) + 1;
let nextUserId = Math.max(5, ...MOCK_USERS.map(u => u.id)) + 1;
let nextRoleId = Math.max(5, ...MOCK_ROLES.map(r => r.id)) + 1;
let nextAccessRequestId = Math.max(4, ...ACCESS_REQUESTS.map(r => r.id)) + 1;
let nextAuditEventId = Math.max(10, ...ACCESS_AUDIT.map(event => event.id)) + 1;


const addLog = (level: LogEntry['level'], message: string) => {
  MOCK_DHCP_SERVER.logs.unshift({ timestamp: Date.now(), level, message });
  if (MOCK_DHCP_SERVER.logs.length > 100) {
    MOCK_DHCP_SERVER.logs.pop();
  }
  saveToStorage('netgrip_dhcp_server', MOCK_DHCP_SERVER);
};

const saveAccessAudit = () => {
    saveToStorage('netgrip_access_audit', ACCESS_AUDIT);
};

const saveAccessRequests = () => {
    saveToStorage('netgrip_access_requests', ACCESS_REQUESTS);
};

const logAccessAudit = (
    entry: Omit<AccessAuditEvent, 'id' | 'timestamp'> & { timestamp?: number },
) => {
    const event: AccessAuditEvent = {
        id: nextAuditEventId++,
        timestamp: entry.timestamp ?? Date.now(),
        actor: entry.actor,
        action: entry.action,
        target: entry.target,
        risk: entry.risk,
        description: entry.description,
    };
    ACCESS_AUDIT = [event, ...ACCESS_AUDIT].slice(0, 200);
    saveAccessAudit();
    return event;
};

const updateRequestStatus = (
    matcher: string | number,
    status: AccessRequest['status'],
    reviewer = 'Система',
    reviewComment?: string,
) => {
    const request = typeof matcher === 'number'
        ? ACCESS_REQUESTS.find(item => item.id === matcher)
        : ACCESS_REQUESTS.find(item => item.username === matcher && item.status === 'pending');
    if (!request) {
        return null;
    }
    request.status = status;
    request.reviewer = reviewer;
    request.reviewComment = reviewComment;
    saveAccessRequests();
    return request;
};

const getRoleName = (roleId: number) =>
    MOCK_ROLES.find(role => role.id === roleId)?.name ?? 'Не назначена';

// Simulates network requests to a backend.
export const api = {
  login: (username, _password): Promise<{ token: string; user: User, permissions: Permission[] }> => new Promise((resolve, reject) => {
    void _password;
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username === username);
      if (user) {
          if (user.status === 'pending') {
              reject(new Error('Account is pending approval.'));
          } else if (user.status === 'active') {
              // SANDBOX MODE: Grant admin permissions to any logged-in user.
              const adminRole = MOCK_ROLES.find(r => r.name === 'Администратор');
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
        const adminRole = MOCK_ROLES.find(r => r.name === 'Администратор');
        const permissions = adminRole ? adminRole.permissions : [];
        resolve({ token: `fake-sso-token-for-${user.id}`, user, permissions });
    }, 500);
  }),

  register: (username, _password): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
    void _password;
    setTimeout(() => {
        if (MOCK_USERS.some(u => u.username === username)) {
            reject(new Error('Username already exists.'));
            return;
        }
        const newUser: User = {
            id: nextUserId++,
            username,
            roleId: 4, // Новые пользователи запрашивают роль менеджера доступа
            status: 'pending',
        };
        MOCK_USERS.push(newUser);
        saveToStorage('netgrip_users', MOCK_USERS);
        const newRequest: AccessRequest = {
            id: nextAccessRequestId++,
            username,
            currentRoleId: newUser.roleId,
            requestedRoleId: newUser.roleId,
            justification: 'Самостоятельная регистрация через портал.',
            submittedAt: Date.now(),
            status: 'pending',
        };
        ACCESS_REQUESTS = [newRequest, ...ACCESS_REQUESTS];
        saveAccessRequests();
        logAccessAudit({
            actor: username,
            action: 'Создана заявка на доступ',
            target: getRoleName(newUser.roleId),
            risk: 'low',
            description: 'Пользователь отправил форму регистрации и ожидает подтверждения.',
        });
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
            updateRequestStatus(user.username, 'approved', 'Система', 'Учётная запись активирована.');
            logAccessAudit({
                actor: 'Система',
                action: 'Подтверждена учётная запись',
                target: user.username,
                risk: 'medium',
                description: `Пользователь получил статус active и роль «${getRoleName(user.roleId)}».`,
            });
            resolve({ success: true });
        } else {
            reject(new Error("User not found"));
        }
      }, 300);
  }),

  deleteUser: (userId: number): Promise<{ success: boolean }> => new Promise(resolve => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.id === userId);
        MOCK_USERS = MOCK_USERS.filter(u => u.id !== userId);
        saveToStorage('netgrip_users', MOCK_USERS);
        if (user) {
            updateRequestStatus(user.username, 'rejected', 'Система', 'Учётная запись удалена.');
            logAccessAudit({
                actor: 'Система',
                action: 'Удалена учётная запись',
                target: user.username,
                risk: 'medium',
                description: 'Пользователь удалён из каталога и больше не имеет доступа.',
            });
        }
        resolve({ success: true });
      }, 300);
  }),
  
  updateUserRole: (userId: number, roleId: number): Promise<{ success: boolean }> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const user = MOCK_USERS.find(u => u.id === userId);
          if (user) {
              user.roleId = roleId;
              saveToStorage('netgrip_users', MOCK_USERS);
              updateRequestStatus(user.username, 'approved', 'Система', `Роль обновлена на «${getRoleName(roleId)}».`);
              logAccessAudit({
                  actor: 'Система',
                  action: 'Обновлена роль пользователя',
                  target: user.username,
                  risk: 'medium',
                  description: `Назначена роль «${getRoleName(roleId)}».`,
              });
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
          logAccessAudit({
              actor: 'Система',
              action: 'Создана роль',
              target: newRole.name,
              risk: 'medium',
              description: 'Роль доступна для назначения пользователям.',
          });
          resolve(newRole);
      }, 300);
  }),

  updateRole: (updatedRole: Role): Promise<Role> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const index = MOCK_ROLES.findIndex(r => r.id === updatedRole.id);
          if (index !== -1) {
              MOCK_ROLES[index] = updatedRole;
              saveToStorage('netgrip_roles', MOCK_ROLES);
              logAccessAudit({
                  actor: 'Система',
                  action: 'Обновлена роль',
                  target: updatedRole.name,
                  risk: 'medium',
                  description: 'Набор прав для роли был пересмотрен.',
              });
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
          const role = MOCK_ROLES.find(r => r.id === roleId);
          MOCK_ROLES = MOCK_ROLES.filter(r => r.id !== roleId);
          saveToStorage('netgrip_roles', MOCK_ROLES);
          if (role) {
              logAccessAudit({
                  actor: 'Система',
                  action: 'Удалена роль',
                  target: role.name,
                  risk: 'medium',
                  description: 'Роль исключена из каталога и больше не доступна.',
              });
          }
          resolve({ success: true });
      }, 300);
  }),

  getAccessAuditTrail: (): Promise<AccessAuditEvent[]> => new Promise(resolve => {
      setTimeout(() => resolve(ACCESS_AUDIT.map(event => ({ ...event }))), 200);
  }),

  getAccessRequests: (): Promise<AccessRequest[]> => new Promise(resolve => {
      setTimeout(() => resolve(ACCESS_REQUESTS.map(request => ({ ...request }))), 200);
  }),

  reviewAccessRequest: (
      requestId: number,
      status: Extract<AccessRequest['status'], 'approved' | 'rejected'>,
      options?: { reviewer?: string; comment?: string },
  ): Promise<AccessRequest> => new Promise((resolve, reject) => {
      setTimeout(() => {
          const updated = updateRequestStatus(requestId, status, options?.reviewer ?? 'Система', options?.comment);
          if (!updated) {
              reject(new Error('Запрос не найден.'));
              return;
          }
          logAccessAudit({
              actor: options?.reviewer ?? 'Система',
              action: status === 'approved' ? 'Одобрена заявка на доступ' : 'Отклонена заявка на доступ',
              target: updated.username,
              risk: status === 'approved' ? 'medium' : 'low',
              description: options?.comment ?? 'Комментарий отсутствует.',
          });
          resolve({ ...updated });
      }, 300);
  }),

  submitAccessRequest: (payload: {
      username: string;
      currentRoleId: number;
      requestedRoleId: number;
      justification: string;
  }): Promise<AccessRequest> => new Promise(resolve => {
      setTimeout(() => {
          const request: AccessRequest = {
              id: nextAccessRequestId++,
              username: payload.username,
              currentRoleId: payload.currentRoleId,
              requestedRoleId: payload.requestedRoleId,
              justification: payload.justification,
              submittedAt: Date.now(),
              status: 'pending',
          };
          ACCESS_REQUESTS = [request, ...ACCESS_REQUESTS];
          saveAccessRequests();
          logAccessAudit({
              actor: payload.username,
              action: 'Создана заявка на доступ',
              target: getRoleName(payload.requestedRoleId),
              risk: 'low',
              description: payload.justification,
          });
          resolve({ ...request });
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
        const mostCommon = Object.keys(statusCounts).length > 0 ? `'${Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b)}'` : '—';
        const summary = `Всего проанализировано ${leases.length} аренды. Самый распространённый статус — ${mostCommon}.`;
        
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
        const summary = `Пул DHCP использован на ${utilization} — задействовано ${totalUsed} из ${totalPossible} доступных динамических IP-адресов.`;
        
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