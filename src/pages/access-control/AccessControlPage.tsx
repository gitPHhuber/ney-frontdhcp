/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaHistory, FaKey, FaShieldAlt, FaUserCog, FaUsers } from 'react-icons/fa';
import { toast } from 'sonner';

import UserManagementTable from '../../components/admin/UserManagementTable';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { AccessAuditEvent, AccessRequest, Permission, Role, User } from '../../types';
import Card from '../../components/ui/Card';

type PermissionCatalog = Record<string, string[]>;

const permissionLabels: Record<Permission, string> = {
    'leases:read': 'Просмотр аренды',
    'leases:update': 'Редактирование аренды',
    'leases:delete': 'Удаление аренды',
    'static_ips:read': 'Просмотр статических IP',
    'static_ips:create': 'Создание статических IP',
    'static_ips:delete': 'Удаление статических IP',
    'reports:read': 'Просмотр отчётов',
    'mes:production': 'Производственный контур',
    'mes:quality': 'Контроль качества',
    'mes:labs': 'Испытательные лаборатории',
    'mes:workforce': 'Аналитика персонала',
    'mes:flash': 'Консоль прошивки',
    'mes:flash:override': 'Переопределение ограничений прошивки',
    'mes:flash:presets': 'Управление шаблонами прошивки',
    'users:read': 'Просмотр пользователей',
    'users:update': 'Редактирование пользователей',
    'users:delete': 'Удаление пользователей',
    'roles:read': 'Просмотр ролей',
    'roles:create': 'Создание ролей',
    'roles:update': 'Редактирование ролей',
    'roles:delete': 'Удаление ролей',
    'settings:read': 'Просмотр настроек',
    'settings:update': 'Изменение настроек',
    'access:read': 'Просмотр центра доступа',
    'access:approve': 'Одобрение заявок',
    'audit:read': 'Просмотр журнала аудита',
};

const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

const formatRelative = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.round(diff / (1000 * 60));
    if (minutes < 1) return 'меньше минуты назад';
    if (minutes < 60) return `${minutes} мин. назад`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.round(hours / 24);
    return `${days} дн. назад`;
};

const requestStatusLabel: Record<AccessRequest['status'], string> = {
    pending: 'Ожидает решения',
    approved: 'Одобрено',
    rejected: 'Отклонено',
};

const AccessControlPage: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [auditTrail, setAuditTrail] = useState<AccessAuditEvent[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionCatalog>({});
    const [users, setUsers] = useState<User[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
    const [quickRequestUserId, setQuickRequestUserId] = useState<number | ''>('');
    const [quickRequestRoleId, setQuickRequestRoleId] = useState<number | ''>('');
    const [quickRequestComment, setQuickRequestComment] = useState('');
    const [submittingQuickRequest, setSubmittingQuickRequest] = useState(false);

    const loadUsers = useCallback(async () => {
        const list = await api.getUsers();
        setUsers(list);
    }, []);

    const loadRoles = useCallback(async () => {
        const [roleList, catalog] = await Promise.all([api.getRoles(), api.getAllPermissions()]);
        setRoles(roleList);
        const readableCatalog = Object.fromEntries(
            Object.entries(catalog).map(([group, permissions]) => [
                group,
                permissions.map(permission => permissionLabels[permission] ?? permission),
            ]),
        );
        setPermissionsCatalog(readableCatalog);
    }, []);

    const loadRequests = useCallback(async () => {
        setLoadingRequests(true);
        const requestList = await api.getAccessRequests();
        setRequests(requestList);
        setLoadingRequests(false);
    }, []);

    const loadAudit = useCallback(async () => {
        const events = await api.getAccessAuditTrail();
        setAuditTrail(events);
    }, []);

    useEffect(() => {
        void loadUsers();
        void loadRoles();
        void loadRequests();
        void loadAudit();
    }, [loadUsers, loadRoles, loadRequests, loadAudit]);

    const roleNameById = useCallback((id: number) => roles.find(role => role.id === id)?.name ?? 'Не назначено', [roles]);

    const activeUsers = useMemo(
        () => users.filter(item => item.status === 'active'),
        [users],
    );

    const pendingUsers = useMemo(
        () => users.filter(item => item.status === 'pending'),
        [users],
    );

    const pendingRequests = useMemo(
        () => requests.filter(request => request.status === 'pending'),
        [requests],
    );

    const auditLastDay = useMemo(
        () => auditTrail.filter(event => Date.now() - event.timestamp < 1000 * 60 * 60 * 24),
        [auditTrail],
    );

    const summaryCards = useMemo(
        () => [
            {
                key: 'active-users',
                value: activeUsers.length.toLocaleString('ru-RU'),
                title: 'Активных учётных записей',
                helper: `${pendingUsers.length.toLocaleString('ru-RU')} ожидают подтверждения`,
                icon: <FaUsers />,
                anchor: '#users-section',
            },
            {
                key: 'pending-requests',
                value: pendingRequests.length.toLocaleString('ru-RU'),
                title: 'Заявок на доступ в очереди',
                helper: 'Отработайте запросы, чтобы ускорить онбординг и offboarding.',
                icon: <FaKey />,
                anchor: '#requests-section',
            },
            {
                key: 'audit-events',
                value: auditLastDay.length.toLocaleString('ru-RU'),
                title: 'Событий аудита за 24 часа',
                helper: 'Контроль изменений ролей и критичных действий.',
                icon: <FaHistory />,
                anchor: '#audit-section',
            },
            {
                key: 'roles-total',
                value: roles.length.toLocaleString('ru-RU'),
                title: 'Ролей RBAC',
                helper: 'Регулярно пересматривайте матрицу полномочий.',
                icon: <FaShieldAlt />,
                anchor: '#roles-section',
            },
        ],
        [activeUsers.length, pendingUsers.length, pendingRequests.length, auditLastDay.length, roles.length],
    );

    const handleReviewRequest = async (
        requestId: number,
        status: Extract<AccessRequest['status'], 'approved' | 'rejected'>,
    ) => {
        setProcessingRequestId(requestId);
        try {
            const targetRequest = requests.find(item => item.id === requestId);
            const reviewer = user?.username ?? 'Администратор';
            const comment =
                status === 'approved'
                    ? 'Доступ подтверждён и роль обновлена.'
                    : 'Заявка отклонена. Укажите дополнительные шаги пользователю.';
            await api.reviewAccessRequest(requestId, status, { reviewer, comment });

            if (status === 'approved' && targetRequest) {
                const targetUser = users.find(item => item.username === targetRequest.username);
                if (targetUser) {
                    if (targetUser.status === 'pending') {
                        await api.approveUser(targetUser.id);
                    }
                    if (targetUser.roleId !== targetRequest.requestedRoleId) {
                        await api.updateUserRole(targetUser.id, targetRequest.requestedRoleId);
                    }
                }
            }

            toast.success(
                status === 'approved'
                    ? 'Заявка одобрена и изменения зафиксированы.'
                    : 'Заявка отклонена и внесена в журнал.',
            );
            await Promise.all([loadRequests(), loadUsers(), loadAudit()]);
        } catch (error) {
            console.error(error);
            toast.error('Не удалось обработать заявку. Попробуйте ещё раз.');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleQuickRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (quickRequestUserId === '' || quickRequestRoleId === '' || !quickRequestComment.trim()) {
            toast.warning('Заполните все поля, чтобы отправить заявку.');
            return;
        }
        const selectedUser = users.find(item => item.id === quickRequestUserId);
        if (!selectedUser) {
            toast.error('Выбранный пользователь не найден.');
            return;
        }
        setSubmittingQuickRequest(true);
        try {
            await api.submitAccessRequest({
                username: selectedUser.username,
                currentRoleId: selectedUser.roleId,
                requestedRoleId: quickRequestRoleId,
                justification: quickRequestComment.trim(),
            });
            setQuickRequestComment('');
            setQuickRequestRoleId('');
            setQuickRequestUserId('');
            toast.success('Заявка отправлена и появится в очереди.');
            await Promise.all([loadRequests(), loadAudit()]);
        } catch (error) {
            console.error(error);
            toast.error('Не удалось отправить заявку. Попробуйте повторить.');
        } finally {
            setSubmittingQuickRequest(false);
        }
    };

    return (
        <div className="access-control-page">
            <header className="page-header">
                <div className="page-header__summary">
                    <h1>Контроль доступа</h1>
                    <p className="page-header__subtitle">
                        Центр управления пользователями, ролями и аудитом. Следите за заявками на доступ, назначайте права и
                        фиксируйте все критичные изменения в единой точке.
                    </p>
                </div>
                <div className="page-header__status" aria-live="polite">
                    <span className="page-header__status-label">Дежурный администратор</span>
                    <span className="status-chip">{user?.username ?? 'неизвестен'}</span>
                </div>
            </header>

            <section className="dashboard-grid" aria-label="Сводные показатели">
                {summaryCards.map(card => (
                    <Card
                        key={card.key}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        helperText={card.helper}
                        to={card.anchor}
                    />
                ))}
            </section>

            <section id="users-section" className="access-section">
                <div className="section-header">
                    <h2>
                        <FaUsers aria-hidden="true" /> Управление пользователями
                    </h2>
                    <p>
                        Отслеживайте статусы учётных записей, подтверждайте новых пользователей и повышайте уровень доступа без
                        выхода из единой панели.
                    </p>
                </div>
                <UserManagementTable />
            </section>

            <section id="requests-section" className="access-section">
                <div className="section-header">
                    <h2>
                        <FaKey aria-hidden="true" /> Заявки на доступ
                    </h2>
                    <p>
                        Каждая заявка фиксируется в аудите. Одобряйте или отклоняйте запросы с комментарием, чтобы команда
                        безопасности могла отследить контекст.
                    </p>
                </div>

                <form className="quick-request" onSubmit={handleQuickRequestSubmit}>
                    <h3>
                        <FaUserCog aria-hidden="true" /> Быстрая заявка
                    </h3>
                    <div className="quick-request__grid">
                        <label className="form-group">
                            <span>Пользователь</span>
                            <select
                                className="form-control"
                                value={quickRequestUserId}
                                onChange={(event) =>
                                    setQuickRequestUserId(
                                        event.target.value ? Number.parseInt(event.target.value, 10) : '',
                                    )
                                }
                            >
                                <option value="">Выберите пользователя…</option>
                                {users.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.username} • {roleNameById(item.roleId)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-group">
                            <span>Желаемая роль</span>
                            <select
                                className="form-control"
                                value={quickRequestRoleId}
                                onChange={(event) =>
                                    setQuickRequestRoleId(
                                        event.target.value ? Number.parseInt(event.target.value, 10) : '',
                                    )
                                }
                            >
                                <option value="">Выберите роль…</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-group form-group--wide">
                            <span>Обоснование</span>
                            <textarea
                                className="form-control"
                                rows={2}
                                value={quickRequestComment}
                                onChange={(event) => setQuickRequestComment(event.target.value)}
                                placeholder="Например: требуется доступ для смены конфигурации стенда разработки."
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        className={`btn btn-primary ${submittingQuickRequest ? 'is-loading' : ''}`}
                        disabled={submittingQuickRequest}
                    >
                        <span className="btn-text-content">Отправить заявку</span>
                        {submittingQuickRequest && <span className="spinner-inline" />}
                    </button>
                </form>

                <div className="requests-grid" aria-live="polite">
                    {loadingRequests && pendingRequests.length === 0 ? (
                        <div className="loading-overlay">
                            <div className="spinner" aria-hidden="true" />
                            <p>Загружаем очередь заявок…</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <p className="empty-state">Новых заявок нет — очередь чиста.</p>
                    ) : (
                        pendingRequests.map(request => {
                            const submitting = processingRequestId === request.id;
                            const requester = users.find(item => item.username === request.username);
                            return (
                                <article key={request.id} className="request-card">
                                    <header className="request-card__header">
                                        <h3>{request.username}</h3>
                                        <span className={`status-badge status-badge--${request.status}`}>
                                            {requestStatusLabel[request.status]}
                                        </span>
                                    </header>
                                    <dl className="request-card__meta">
                                        <div>
                                            <dt>Текущая роль</dt>
                                            <dd>{roleNameById(request.currentRoleId)}</dd>
                                        </div>
                                        <div>
                                            <dt>Запрошенная роль</dt>
                                            <dd>{roleNameById(request.requestedRoleId)}</dd>
                                        </div>
                                        <div>
                                            <dt>Отправлено</dt>
                                            <dd>{formatRelative(request.submittedAt)}</dd>
                                        </div>
                                    </dl>
                                    <p className="request-card__comment">{request.justification}</p>
                                    <footer className="request-card__actions">
                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleReviewRequest(request.id, 'approved')}
                                            disabled={submitting}
                                        >
                                            <FaCheckCircle aria-hidden="true" /> Одобрить
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReviewRequest(request.id, 'rejected')}
                                            disabled={submitting}
                                        >
                                            <FaKey aria-hidden="true" /> Отклонить
                                        </button>
                                        {submitting && <span className="spinner-inline" aria-hidden="true" />}
                                        {requester && (
                                            <span className="request-card__hint">
                                                Текущий статус: {requester.status === 'pending' ? 'ожидает подтверждения' : 'активен'}
                                            </span>
                                        )}
                                    </footer>
                                </article>
                            );
                        })
                    )}
                </div>
            </section>

            <section id="roles-section" className="access-section">
                <div className="section-header">
                    <h2>
                        <FaShieldAlt aria-hidden="true" /> Матрица ролей и полномочий
                    </h2>
                    <p>
                        Сверяйте наборы прав по ролям и согласовывайте изменения через аудит. Каждый модуль разделён по доменам
                        ответственности.
                    </p>
                </div>
                <div className="roles-grid">
                    {roles.map(role => (
                        <article key={role.id} className="role-card">
                            <header>
                                <h3>{role.name}</h3>
                                <span className="role-card__count">{role.permissions.length} прав</span>
                            </header>
                            <ul className="role-card__permissions">
                                {role.permissions.map(permission => (
                                    <li key={permission}>{permissionLabels[permission] ?? permission}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
                <div className="permissions-catalog">
                    <h3>Категории полномочий</h3>
                    <dl>
                        {(Object.entries(permissionsCatalog) as Array<[string, string[]]>).map(([category, permissions]) => (
                            <div key={category} className="permissions-catalog__group">
                                <dt>{category}</dt>
                                <dd>{permissions.join(', ')}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section id="audit-section" className="access-section">
                <div className="section-header">
                    <h2>
                        <FaHistory aria-hidden="true" /> Журнал аудита доступа
                    </h2>
                    <p>
                        Последние операции с ролями, заявками и учётными записями. Журнал пригоден для внутреннего и внешнего
                        аудита.
                    </p>
                </div>
                {auditTrail.length === 0 ? (
                    <p className="empty-state">Журнал пуст. Выполните действия с доступом, чтобы увидеть записи.</p>
                ) : (
                    <ul className="audit-timeline">
                        {auditTrail.map(event => (
                            <li key={event.id} className={`audit-timeline__item audit-timeline__item--${event.risk}`}>
                                <div className="audit-timeline__meta">
                                    <span className="audit-timeline__actor">{event.actor}</span>
                                    <time dateTime={new Date(event.timestamp).toISOString()}>{formatDateTime(event.timestamp)}</time>
                                </div>
                                <div className="audit-timeline__content">
                                    <strong>{event.action}</strong>
                                    <p>{event.description}</p>
                                    <span className="audit-timeline__target">Объект: {event.target}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AccessControlPage;
