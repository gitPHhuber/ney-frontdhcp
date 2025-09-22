import React, { useMemo, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import type { DeviceSession, FlashChecklistItem, FlashJob, FlashPort, FlashPreset } from '../../entities';
import {
  useDeviceSessionsQuery,
  useFlashAgentsQuery,
  useFlashArtifactsQuery,
  useFlashJobsQuery,
  useFlashPortsQuery,
  useFlashPresetsQuery,
} from './hooks';

const portStateLabel: Record<FlashPort['state'], string> = {
  disconnected: 'Отключен',
  ready: 'Готов',
  bootloader: 'Bootloader',
  flashing: 'Прошивается',
  ok: 'ОК',
  error: 'Ошибка',
};

const portStateClass: Record<FlashPort['state'], string> = {
  disconnected: 'status--disconnected',
  ready: 'status--ready',
  bootloader: 'status--bootloader',
  flashing: 'status--running',
  ok: 'status--ok',
  error: 'status--error',
};

const jobStatusLabel = {
  queued: 'В очереди',
  running: 'Прошивается',
  ok: 'Успех',
  error: 'Ошибка',
  aborted: 'Отменено',
} as const;

const jobStatusClass = {
  queued: 'status--queued',
  running: 'status--running',
  ok: 'status--ok',
  error: 'status--error',
  aborted: 'status--aborted',
} as const;

type ManualPanelState = {
  id: string;
  portId?: string;
  presetId?: string;
  artifactId?: string;
  project?: 'servers' | 'drones';
  deviceType?: string;
  model?: string;
  serialNumber?: string;
  options?: {
    erase: boolean;
    verify: boolean;
    setParams: boolean;
  };
};

const formatNumber = (value: number) => value.toLocaleString('ru-RU');

const formatDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (minutes === 0) {
    return `${secs} с`;
  }
  return `${minutes} мин ${secs.toString().padStart(2, '0')} с`;
};

const formatTime = (value?: string) => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatSpeed = (speedKbps?: number) => {
  if (!speedKbps) {
    return '—';
  }
  if (speedKbps > 1024) {
    return `${(speedKbps / 1024).toFixed(1)} МБ/с`;
  }
  return `${Math.round(speedKbps)} КБ/с`;
};

const checklistItems = (items?: FlashChecklistItem[]) =>
  items?.map(item => (
    <li key={item.id}>
      <span>{item.label}</span>
      {item.required && <span className="chip chip--warning">Обязательно</span>}
    </li>
  ));

const optionsBadges = (options?: { erase: boolean; verify: boolean; setParams: boolean }) => {
  if (!options) {
    return null;
  }
  return (
    <div className="firmware-console__options">
      <span className={`chip ${options.erase ? 'chip--accent' : 'chip--muted'}`}>Erase</span>
      <span className={`chip ${options.verify ? 'chip--accent' : 'chip--muted'}`}>Verify</span>
      <span className={`chip ${options.setParams ? 'chip--accent' : 'chip--muted'}`}>Set params</span>
    </div>
  );
};

const logPreview = (job?: FlashJob) => {
  if (!job?.log?.length) {
    return <p className="muted">Лог появится после запуска.</p>;
  }
  const tail = job.log.slice(-3);
  return (
    <ul className="firmware-console__log">
      {tail.map(entry => (
        <li key={entry.id} className={`firmware-console__log-line firmware-console__log-line--${entry.level}`}>
          <span>{formatTime(entry.ts)}</span>
          <span>{entry.message}</span>
        </li>
      ))}
    </ul>
  );
};

export const FirmwareFlashingConsole: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data: agents = [] } = useFlashAgentsQuery();
  const { data: ports = [] } = useFlashPortsQuery();
  const { data: presets = [] } = useFlashPresetsQuery();
  const { data: artifacts = [] } = useFlashArtifactsQuery();
  const { data: jobs = [] } = useFlashJobsQuery({ date: 'today', status: 'all' });
  const { data: deviceSessions = [] } = useDeviceSessionsQuery();

  const [manualPanels, setManualPanels] = useState<ManualPanelState[]>([]);
  const [projectFilter, setProjectFilter] = useState<'all' | 'servers' | 'drones'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'running' | 'ok' | 'error' | 'aborted'>('all');
  const [workstationFilter, setWorkstationFilter] = useState<'all' | string>('all');
  const [artifactFilter, setArtifactFilter] = useState<'all' | string>('all');

  const canOverride = hasPermission('mes:flash:override');
  const canManagePresets = hasPermission('mes:flash:presets');

  const artifactMap = useMemo(() => new Map(artifacts.map(artifact => [artifact.id, artifact])), [artifacts]);
  const presetMap = useMemo(() => new Map(presets.map(preset => [preset.id, preset])), [presets]);
  const sessionMap = useMemo(
    () => new Map(deviceSessions.map((session: DeviceSession) => [session.serialNumber, session])),
    [deviceSessions],
  );
  const jobByPort = useMemo(() => {
    const grouped = new Map<string, FlashJob>();
    jobs.forEach(job => {
      const existing = grouped.get(job.portId);
      if (!existing || new Date(job.startedAt).getTime() > new Date(existing.startedAt).getTime()) {
        grouped.set(job.portId, job);
      }
    });
    return grouped;
  }, [jobs]);

  const totalJobs = jobs.length;
  const okJobs = jobs.filter(job => job.status === 'ok').length;
  const errorJobs = jobs.filter(job => job.status === 'error').length;
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  const queuedJobs = jobs.filter(job => job.status === 'queued').length;
  const averageDurationSec = useMemo(() => {
    const completed = jobs.filter(job => job.durationSec);
    if (!completed.length) {
      return 0;
    }
    const totalDuration = completed.reduce((acc, job) => acc + (job.durationSec ?? 0), 0);
    return Math.round(totalDuration / completed.length);
  }, [jobs]);

  const readyPorts = ports.filter(port => port.state === 'ready');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (projectFilter !== 'all' && job.project !== projectFilter) {
        return false;
      }
      if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false;
      }
      if (workstationFilter !== 'all' && job.workstationId !== workstationFilter) {
        return false;
      }
      if (artifactFilter !== 'all' && job.artifactId !== artifactFilter) {
        return false;
      }
      return true;
    });
  }, [artifactFilter, jobs, projectFilter, statusFilter, workstationFilter]);

  const workstationOptions = useMemo(() => {
    const unique = new Map<string, string>();
    agents.forEach(agent => {
      unique.set(agent.workstationId, agent.workstationName);
    });
    jobs.forEach(job => {
      if (!unique.has(job.workstationId)) {
        unique.set(job.workstationId, job.workstationId);
      }
    });
    return Array.from(unique.entries());
  }, [agents, jobs]);

  const handleAddManualPanel = () => {
    setManualPanels(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
      },
    ]);
  };

  const handleRemoveManualPanel = (panelId: string) => {
    setManualPanels(prev => prev.filter(panel => panel.id !== panelId));
  };

  const handleManualChange = (panelId: string, patch: Partial<ManualPanelState>) => {
    setManualPanels(prev =>
      prev.map(panel =>
        panel.id === panelId
          ? {
              ...panel,
              ...patch,
            }
          : panel,
      ),
    );
  };

  const handlePresetApply = (preset: FlashPreset) => {
    setManualPanels(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        presetId: preset.id,
        artifactId: preset.artifactId,
        project: preset.project,
        deviceType: preset.deviceType,
        model: preset.model,
        options: { ...preset.defaultOptions },
      },
    ]);
  };

  const renderChecklist = (items?: FlashChecklistItem[]) => {
    if (!items?.length) {
      return null;
    }
    return (
      <div className="firmware-console__checklist">
        <span className="firmware-console__section-label">Питание / boot</span>
        <ul>{checklistItems(items)}</ul>
      </div>
    );
  };

  return (
    <section className="mes-page firmware-console" aria-label="Консоль прошивки">
      <header className="firmware-console__header">
        <h1>Прошивка устройств</h1>
        <p className="muted">
          Управляйте стендами прошивки, контролируйте версии и прослеживаемость для серверов и дронов в одной панели.
        </p>
      </header>

      <div className="firmware-console__metrics">
        <div className="metric">
          <span className="metric__label">Всего прошивок сегодня</span>
          <span className="metric__value">{formatNumber(totalJobs)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Успешно</span>
          <span className="metric__value">{formatNumber(okJobs)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Ошибок</span>
          <span className="metric__value">{formatNumber(errorJobs)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">В процессе</span>
          <span className="metric__value">{formatNumber(runningJobs)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Средняя длительность</span>
          <span className="metric__value">{formatDuration(averageDurationSec)}</span>
        </div>
      </div>

      <div className="firmware-console__content">
        <section className="firmware-console__panels" aria-label="Панели прошивки">
          <div className="firmware-console__panel-controls">
            <button type="button" className="primary" disabled={readyPorts.length === 0}>
              Прошить всё подключённое ({readyPorts.length})
            </button>
            <button type="button" className="secondary" onClick={handleAddManualPanel}>
              Добавить панель вручную
            </button>
          </div>
          <div className="firmware-console__panel-grid">
            {ports.map(port => {
              const job = jobByPort.get(port.id);
              const preset = job?.presetId ? presetMap.get(job.presetId) : undefined;
              const artifact = job ? artifactMap.get(job.artifactId) : undefined;
              const session = job ? sessionMap.get(job.serialNumber) : undefined;
              const mismatch = Boolean(job && artifact && !artifact.compatibleModels.includes(job.model));
              const versionAllowed = artifact?.allowed ?? true;
              const options = preset?.defaultOptions;
              const canStartPort = !job && port.state === 'ready';
              const canDetach = job?.status === 'running' ? false : true;
              const logLink = job?.resultLogUrl;
              const workstation = agents.find(item => item.workstationId === port.workstationId);
              return (
                <article key={port.id} className="firmware-console__panel">
                  <header className="firmware-console__panel-header">
                    <div>
                      <h3>
                        {port.displayName} · <span className="muted">{port.path}</span>
                      </h3>
                      <p className="muted">{port.deviceHint ?? 'USB устройство'}</p>
                    </div>
                    <span
                      className={`firmware-console__status ${
                        job ? jobStatusClass[job.status] : portStateClass[port.state]
                      }`}
                    >
                      {job ? jobStatusLabel[job.status] : portStateLabel[port.state]}
                    </span>
                  </header>
                  <dl className="firmware-console__details">
                    <div>
                      <dt>Проект</dt>
                      <dd>{job ? (job.project === 'servers' ? 'Серверы' : 'Дроны') : '—'}</dd>
                    </div>
                    <div>
                      <dt>Тип устройства</dt>
                      <dd>{job?.deviceType ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Модель</dt>
                      <dd>{job?.model ?? session?.model ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Серийный номер</dt>
                      <dd>{job?.serialNumber ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Версия прошивки</dt>
                      <dd>{job?.artifactVersion ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Checksum</dt>
                      <dd>{job?.checksum ?? artifact?.checksum ?? '—'}</dd>
                    </div>
                  </dl>
                  {optionsBadges(options)}
                  {job?.status === 'running' && typeof job.progressPercent === 'number' && (
                    <div className="progress" aria-label="Прогресс прошивки">
                      <div className="progress__bar" style={{ width: `${job.progressPercent}%` }}>
                        {job.progressPercent}%
                      </div>
                    </div>
                  )}
                  <div className="firmware-console__telemetry">
                    <span>Старт: {formatTime(job?.startedAt)}</span>
                    <span>ETA: {job?.status === 'running' ? formatDuration(job.etaSec) : '—'}</span>
                    <span>Скорость: {formatSpeed(job?.speedKbps)}</span>
                    <span>Станция: {workstation?.workstationName ?? port.workstationId ?? '—'}</span>
                  </div>
                  {renderChecklist(job?.powerChecklist ?? preset?.defaultChecklist)}
                  {mismatch && (
                    <div className="firmware-console__alert" role="alert">
                      <span>
                        Модель {job?.model} не входит в совместимые для {artifact?.version}
                      </span>
                      {canOverride ? (
                        <button type="button" className="ghost">
                          Переопределить
                        </button>
                      ) : (
                        <span className="chip chip--danger">Требуется мастер</span>
                      )}
                    </div>
                  )}
                  {!versionAllowed && (
                    <div className="firmware-console__alert firmware-console__alert--warning" role="alert">
                      <span>Версия не разрешена политикой выпуска.</span>
                    </div>
                  )}
                  <div className="firmware-console__log-wrapper">{logPreview(job)}</div>
                  <div className="firmware-console__panel-actions">
                    <button type="button" className="primary" disabled={!canStartPort}>
                      {job?.status === 'ok' ? 'Пере-прошить' : 'Начать прошивку'}
                    </button>
                    {logLink ? (
                      <a className="secondary" href={logLink}>
                        Открыть лог
                      </a>
                    ) : (
                      <button type="button" className="secondary" disabled>
                        Открыть лог
                      </button>
                    )}
                    <button type="button" className="ghost" disabled={!canDetach}>
                      Отвязать порт
                    </button>
                  </div>
                </article>
              );
            })}

            {manualPanels.map(panel => {
              const preset = panel.presetId ? presetMap.get(panel.presetId) : undefined;
              const artifact = panel.artifactId
                ? artifactMap.get(panel.artifactId)
                : preset
                ? artifactMap.get(preset.artifactId)
                : undefined;
              const options = panel.options ?? preset?.defaultOptions;
              const availableArtifacts = artifacts.filter(artifactItem => {
                if (panel.project && artifactItem.project !== panel.project) {
                  return false;
                }
                if (panel.deviceType && artifactItem.deviceType !== panel.deviceType) {
                  return false;
                }
                if (panel.model && artifactItem.model !== panel.model) {
                  return false;
                }
                return true;
              });
              const mismatch = Boolean(
                panel.model && artifact && !artifact.compatibleModels.includes(panel.model),
              );
              const versionAllowed = artifact?.allowed ?? true;
              const canStart = Boolean(panel.serialNumber && panel.artifactId && (versionAllowed || canOverride));
              return (
                <article key={panel.id} className="firmware-console__panel firmware-console__panel--manual">
                  <header className="firmware-console__panel-header">
                    <div>
                      <h3>Ручная панель</h3>
                      <p className="muted">Выберите порт и пресет</p>
                    </div>
                    <span className="firmware-console__status status--ready">Готов</span>
                  </header>
                  <div className="firmware-console__manual-fields">
                    <label>
                      <span>Порт</span>
                      <select
                        value={panel.portId ?? ''}
                        onChange={event => handleManualChange(panel.id, { portId: event.target.value || undefined })}
                      >
                        <option value="">Не выбрано</option>
                        {ports.map(port => (
                          <option key={port.id} value={port.id}>
                            {port.displayName} · {port.path}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Шаблон</span>
                      <select
                        value={panel.presetId ?? ''}
                        onChange={event => {
                          const newPreset = event.target.value ? presetMap.get(event.target.value) : undefined;
                          handleManualChange(panel.id, {
                            presetId: newPreset?.id,
                            artifactId: newPreset?.artifactId,
                            project: newPreset?.project,
                            deviceType: newPreset?.deviceType,
                            model: newPreset?.model,
                            options: newPreset ? { ...newPreset.defaultOptions } : panel.options,
                          });
                        }}
                      >
                        <option value="">Не выбрано</option>
                        {presets.map(presetOption => (
                          <option key={presetOption.id} value={presetOption.id}>
                            {presetOption.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Версия прошивки</span>
                      <select
                        value={panel.artifactId ?? ''}
                        onChange={event => handleManualChange(panel.id, { artifactId: event.target.value || undefined })}
                      >
                        <option value="">Не выбрано</option>
                        {availableArtifacts.map(artifactOption => (
                          <option key={artifactOption.id} value={artifactOption.id}>
                            {artifactOption.version} · {artifactOption.model}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Проект</span>
                      <select
                        value={panel.project ?? ''}
                        onChange={event =>
                          handleManualChange(panel.id, {
                            project: event.target.value
                              ? (event.target.value as ManualPanelState['project'])
                              : undefined,
                          })
                        }
                      >
                        <option value="">Не выбрано</option>
                        <option value="servers">Серверы</option>
                        <option value="drones">Дроны</option>
                      </select>
                    </label>
                    <label>
                      <span>Серийный номер</span>
                      <input
                        value={panel.serialNumber ?? ''}
                        onChange={event => handleManualChange(panel.id, { serialNumber: event.target.value || undefined })}
                      />
                    </label>
                    <label>
                      <span>Модель</span>
                      <input
                        value={panel.model ?? ''}
                        onChange={event => handleManualChange(panel.id, { model: event.target.value || undefined })}
                      />
                    </label>
                  </div>
                  <label className="firmware-console__options-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(options)}
                      onChange={event =>
                        handleManualChange(panel.id, {
                          options: event.target.checked
                            ? options ?? { erase: true, verify: true, setParams: true }
                            : undefined,
                        })
                      }
                    />
                    Настроить опции вручную
                  </label>
                  {optionsBadges(options)}
                  {mismatch && (
                    <div className="firmware-console__alert" role="alert">
                      <span>
                        Модель {panel.model} не входит в совместимые для {artifact?.version}
                      </span>
                      {canOverride ? (
                        <button type="button" className="ghost">
                          Переопределить
                        </button>
                      ) : (
                        <span className="chip chip--danger">Требуется мастер</span>
                      )}
                    </div>
                  )}
                  {!versionAllowed && (
                    <div className="firmware-console__alert firmware-console__alert--warning" role="alert">
                      <span>Версия не разрешена политикой выпуска.</span>
                    </div>
                  )}
                  <div className="firmware-console__panel-actions">
                    <button type="button" className="secondary" onClick={() => handleRemoveManualPanel(panel.id)}>
                      Удалить панель
                    </button>
                    <button type="button" className="primary" disabled={!canStart}>
                      Запустить прошивку
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="firmware-console__sidebar" aria-label="Состояние инфраструктуры">
          <section aria-label="Состояние агентов">
            <h2>Состояние агентов</h2>
            <ul className="firmware-console__agents-list">
              {agents.map(agent => {
                const agentStatusLabel =
                  agent.status === 'online'
                    ? 'В сети'
                    : agent.status === 'updating'
                    ? 'Обновляется'
                    : 'Недоступен';
                const agentStatusClass =
                  agent.status === 'online'
                    ? 'status--ready'
                    : agent.status === 'updating'
                    ? 'status--running'
                    : 'status--error';
                return (
                  <li key={agent.id} className="firmware-console__agents-item">
                    <div>
                      <strong>{agent.workstationName}</strong>
                      <p className="muted">Версия {agent.version} · IP {agent.ipAddress}</p>
                    </div>
                    <span className={`firmware-console__status ${agentStatusClass}`}>{agentStatusLabel}</span>
                  </li>
                );
              })}
              {agents.length === 0 && <li className="muted">Агенты не подключены</li>}
            </ul>
            <div className="firmware-console__agent-meta">
              <span>
                Активные порты: <strong>{ports.length}</strong>
              </span>
              <span>
                В очереди: <strong>{queuedJobs}</strong>
              </span>
            </div>
          </section>
          <section aria-label="Шаблоны прошивки">
            <h2>Шаблоны прошивки</h2>
            <ul className="firmware-console__presets-list">
              {presets.map(preset => (
                <li key={preset.id}>
                  <div>
                    <strong>{preset.name}</strong>
                    <p className="muted">
                      {preset.project === 'servers' ? 'Серверы' : 'Дроны'} · {preset.deviceType} · {preset.model}
                    </p>
                    <p className="muted">Версия {preset.version}</p>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handlePresetApply(preset)}
                    disabled={!canManagePresets && preset.requiresMasterOverride}
                  >
                    Применить
                  </button>
                </li>
              ))}
              {presets.length === 0 && <li className="muted">Нет сохранённых шаблонов</li>}
            </ul>
          </section>
          <section aria-label="Политики выпуска">
            <h2>Политики выпуска</h2>
            <ul className="firmware-console__policies-list">
              <li>Допустимые версии определяются по проекту и модели.</li>
              <li>Ошибка прошивки автоматически создаёт NCR с прикреплённым логом.</li>
              <li>Перезапуск отмечается как Reflash и сохраняет оба лога.</li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="firmware-console__summary" aria-label="Сводка прошивок">
        <header>
          <div>
            <h2>Сводка прошивок</h2>
            <p className="muted">Операторы, станции и результаты с прослеживаемостью логов.</p>
          </div>
          <div className="firmware-console__summary-actions">
            <button type="button" className="secondary">Экспорт CSV</button>
            <button type="button" className="secondary">Экспорт XLSX</button>
          </div>
        </header>
        <div className="firmware-console__filters">
          <label>
            <span>Проект</span>
            <select value={projectFilter} onChange={event => setProjectFilter(event.target.value as typeof projectFilter)}>
              <option value="all">Все</option>
              <option value="drones">Дроны</option>
              <option value="servers">Серверы</option>
            </select>
          </label>
          <label>
            <span>Статус</span>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Все</option>
              <option value="queued">В очереди</option>
              <option value="running">В работе</option>
              <option value="ok">Успешно</option>
              <option value="error">Ошибка</option>
              <option value="aborted">Отменено</option>
            </select>
          </label>
          <label>
            <span>Станция</span>
            <select
              value={workstationFilter}
              onChange={event => setWorkstationFilter(event.target.value as typeof workstationFilter)}
            >
              <option value="all">Все</option>
              {workstationOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Артефакт</span>
            <select value={artifactFilter} onChange={event => setArtifactFilter(event.target.value as typeof artifactFilter)}>
              <option value="all">Все</option>
              {Array.from(new Set(jobs.map(job => job.artifactId))).map(artifactId => {
                const artifact = artifactMap.get(artifactId);
                return (
                  <option key={artifactId} value={artifactId}>
                    {artifact?.version ?? artifactId}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <table className="firmware-console__table table">
          <thead>
            <tr>
              <th scope="col">Время</th>
              <th scope="col">Оператор</th>
              <th scope="col">Рабочая станция</th>
              <th scope="col">Устройство</th>
              <th scope="col">SN</th>
              <th scope="col">Артефакт</th>
              <th scope="col">Checksum</th>
              <th scope="col">Длительность</th>
              <th scope="col">Результат</th>
              <th scope="col">Лог</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => {
              const artifact = artifactMap.get(job.artifactId);
              const agent = agents.find(item => item.workstationId === job.workstationId);
              return (
                <tr key={job.id}>
                  <td>{formatDateTime(job.startedAt)}</td>
                  <td>{job.operator}</td>
                  <td>{agent?.workstationName ?? job.workstationId}</td>
                  <td>
                    {job.deviceType} · {job.model}
                  </td>
                  <td>{job.serialNumber}</td>
                  <td>
                    {artifact?.version ?? job.artifactVersion}
                    {!artifact?.allowed && <span className="chip chip--warning">Запрет</span>}
                  </td>
                  <td>{job.checksum}</td>
                  <td>{job.durationSec ? formatDuration(job.durationSec) : '—'}</td>
                  <td>
                    <span className={`firmware-console__status ${jobStatusClass[job.status]}`}>
                      {jobStatusLabel[job.status]}
                    </span>
                  </td>
                  <td>
                    {job.resultLogUrl ? (
                      <a href={job.resultLogUrl} className="ghost">
                        Лог
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </section>
  );

};
