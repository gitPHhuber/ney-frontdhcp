import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { automationRepository, type PlaybookRun, type PlaybookTemplate } from '../../entities';
import { Tooltip } from '../../shared/ui/Tooltip';

type RiskLevel = 'low' | 'medium' | 'high';

const categoryLabels: Record<PlaybookTemplate['category'], string> = {
  inventory: 'Инвентаризация и склад',
  maintenance: 'Обслуживание инфраструктуры',
  release: 'Выпуск и релизы',
  incident: 'Инциденты и реагирование',
};

const categoryRiskMap: Record<PlaybookTemplate['category'], RiskLevel> = {
  inventory: 'low',
  maintenance: 'medium',
  release: 'medium',
  incident: 'high',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Низкий риск',
  medium: 'Средний риск',
  high: 'Высокий риск',
};

const CATEGORY_DESCRIPTIONS: Record<PlaybookTemplate['category'], string> = {
  inventory: 'Работа со складом, приёмкой и движением запасов. Подходит для тестовых прогона и аудита ERP.',
  maintenance: 'Поддержка сервисов и инфраструктуры, включает регламентные проверки и уведомления команд.',
  release: 'Подготовка и выпуск обновлений. Перед запуском убедитесь в готовности стендов и расписания.',
  incident: 'Реагирование на инциденты и аварийные сценарии. Требует повышенного внимания и подтверждения.',
};

const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) {
    return '—';
  }

  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) {
    return '—';
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'только что';
  }
  if (diffMs < hour) {
    const value = Math.round(diffMs / minute);
    return `${value} мин назад`;
  }
  if (diffMs < day) {
    const value = Math.round(diffMs / hour);
    return `${value} ч назад`;
  }
  const value = Math.round(diffMs / day);
  return `${value} дн назад`;
};

const resolveLastRuns = (runs: PlaybookRun[]) =>
  runs.reduce<Record<string, PlaybookRun>>((acc, run) => {
    const current = acc[run.playbookId];
    if (!current) {
      acc[run.playbookId] = run;
      return acc;
    }
    if (new Date(run.startedAt).getTime() > new Date(current.startedAt).getTime()) {
      acc[run.playbookId] = run;
    }
    return acc;
  }, {});

export const PlaybookList: React.FC = () => {
  const { user } = useAuth();
  const actorName = user?.username ?? 'automation-user';
  const [templates, setTemplates] = React.useState<PlaybookTemplate[]>([]);
  const [lastRuns, setLastRuns] = React.useState<Record<string, PlaybookRun>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [triggerState, setTriggerState] = React.useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const actionDescriptions = React.useMemo(
    () => ({
      trial:
        'Пробный прогон выполняет шаги без изменений в инфраструктуре, собирает вывод команд и записывает результат в аудит.',
      production: `Боевой запуск применяет сценарий на выбранных устройствах. Действует пользователь ${actorName}.`,
    }),
    [actorName],
  );

  React.useEffect(() => {
    let cancelled = false;

    const loadAutomation = async () => {
      try {
        const [fetchedTemplates, fetchedRuns] = await Promise.all([
          automationRepository.listTemplates(),
          automationRepository.listRuns(),
        ]);
        if (cancelled) {
          return;
        }
        setTemplates(fetchedTemplates);
        setLastRuns(resolveLastRuns(fetchedRuns));
      } catch (repositoryError) {
        console.error(repositoryError);
        if (!cancelled) {
          setError('Не удалось загрузить плейбуки. Попробуйте обновить страницу позже.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAutomation();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTrigger = async (playbookId: string, dryRun: boolean) => {
    setTriggerState(prev => ({ ...prev, [playbookId]: true }));
    setFeedback(null);
    try {
      const run = await automationRepository.triggerPlaybook({
        playbookId,
        dryRun,
        actor: actorName,
      });
      setLastRuns(prev => ({ ...prev, [playbookId]: run }));
      const template = templates.find(entry => entry.id === playbookId);
      const templateName = template?.name ?? 'плейбук';
      setFeedback(
        dryRun
          ? `Плейбук «${templateName}» запущен в пробном режиме. Проверяйте журнал аудита для оценки шагов.`
          : `Плейбук «${templateName}» запущен в боевом режиме. Результаты доступны в истории запусков.`,
      );
    } catch (repositoryError) {
      console.error(repositoryError);
      setFeedback('Не удалось запустить плейбук. Проверьте права доступа и повторите попытку.');
    } finally {
      setTriggerState(prev => ({ ...prev, [playbookId]: false }));
    }
  };

  return (
    <section className="playbook-list" aria-live="polite">
      <header className="playbook-list__header">
        <div>
          <h2>Автоматизация</h2>
          <p className="muted">Запускайте готовые сценарии с учётом прав доступа и фиксируйте все действия в аудите.</p>
        </div>
        <span className="status-badge status-completed">Готово к аудиту</span>
      </header>

      {isLoading && <div className="playbook-list__empty">Загружаем шаблоны автоматизации…</div>}

      {!isLoading && error && (
        <div className="playbook-list__empty" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && templates.length === 0 && (
        <div className="playbook-list__empty">
          Шаблоны ещё не добавлены. Используйте конструктор, чтобы собрать первый сценарий и назначить исполнителей.
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <ul className="playbook-list__items">
          {templates.map(template => {
            const risk = categoryRiskMap[template.category];
            const lastRun = lastRuns[template.id];
            const lastRunTime = lastRun ? lastRun.finishedAt ?? lastRun.startedAt : undefined;
            return (
              <li key={template.id} className="playbook-list__item">
                <div className="playbook-list__details">
                  <strong>{template.name}</strong>
                  {template.description && (
                    <p className="playbook-list__description">{template.description}</p>
                  )}
                  <p className="muted" aria-live="polite">
                    {lastRun
                      ? `Последний запуск: ${formatRelativeTime(lastRunTime)} • ${lastRun.dryRun ? 'Пробный' : 'Боевой'} • ${lastRun.runBy}`
                      : 'Ещё не запускался'}
                  </p>
                  <div className="playbook-list__tags" aria-label="Метки сценария">
                    <span className="chip chip--selected">{categoryLabels[template.category]}</span>
                    {template.tags.map(tag => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="playbook-list__meta">
                  <span className={`status-badge playbook-list__risk playbook-list__risk--${risk}`}>
                    {riskLabels[risk]}
                  </span>
                  <Tooltip
                    id={`${template.id}-risk`}
                    text={CATEGORY_DESCRIPTIONS[template.category]}
                    className="playbook-list__meta-tooltip"
                  />
                </div>
                <div className="playbook-actions">
                  <button
                    type="button"
                    className="playbook-actions__trigger"
                    aria-haspopup="menu"
                    aria-label={`Открыть варианты запуска для ${template.name}`}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden focusable="false">
                      <path
                        d="M6.5 4.5v11l7.5-5.5-7.5-5.5Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="playbook-actions__menu" role="menu">
                    <div className="playbook-actions__option">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleTrigger(template.id, true)}
                        disabled={Boolean(triggerState[template.id])}
                      >
                        {triggerState[template.id] ? 'Запуск…' : 'Пробный запуск'}
                      </button>
                      <Tooltip id={`${template.id}-trial`} text={actionDescriptions.trial} />
                    </div>
                    <div className="playbook-actions__option">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleTrigger(template.id, false)}
                        disabled={Boolean(triggerState[template.id])}
                      >
                        {triggerState[template.id] ? 'Запуск…' : 'Боевой запуск'}
                      </button>
                      <Tooltip id={`${template.id}-production`} text={actionDescriptions.production} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {feedback && (
        <p className="playbook-list__feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
};
