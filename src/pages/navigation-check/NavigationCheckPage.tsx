/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { appNavigation } from '../../app/navigation';

interface RouteDescriptor {
  path: string;
  title: string;
  titleKey?: string;
  group: string;
  groupKey?: string;
  loader?: () => Promise<unknown>;
}

interface RouteHealthResult extends RouteDescriptor {
  status: 'ok' | 'fail';
  durationMs: number;
  error?: string;
}

const flattenNavigation = (): RouteDescriptor[] =>
  appNavigation.flatMap(section =>
    section.items.map(item => ({
      path: item.path,
      title: item.title,
      titleKey: item.translationKey,
      group: section.title,
      groupKey: section.translationKey,
      loader: item.loader,
    })),
  );

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

const NavigationCheckPage: React.FC = () => {
  const routes = useMemo(() => flattenNavigation(), []);
  const [results, setResults] = useState<RouteHealthResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { t } = useTranslation();

  const summary = useMemo(() => {
    const ok = results.filter(result => result.status === 'ok').length;
    const fail = results.filter(result => result.status === 'fail').length;
    return { ok, fail, total: results.length };
  }, [results]);

  const runHealthCheck = async () => {
    setIsRunning(true);
    const nextResults: RouteHealthResult[] = [];

    for (const route of routes) {
      const started = performance.now();
      try {
        if (route.loader) {
          await route.loader();
        }
        const durationMs = performance.now() - started;
        nextResults.push({ ...route, status: 'ok', durationMs });
      } catch (error) {
        const durationMs = performance.now() - started;
        nextResults.push({
          ...route,
          status: 'fail',
          durationMs,
          error: error instanceof Error ? error.message : 'Unknown module error',
        });
      }
    }

    nextResults.sort((a, b) => {
      if (a.status === b.status) {
        return a.title.localeCompare(b.title);
      }
      return a.status === 'fail' ? -1 : 1;
    });

    setResults(nextResults);
    setLastRun(new Date().toISOString());
    setIsRunning(false);
  };

  return (
    <div className="navigation-check-page">
      <header className="page-header">
        <div className="page-header-copy">
          <h1>
            {t('navigationCheckPage.title', {
              defaultValue: 'Navigation health check',
            })}
          </h1>
          <p className="page-subtitle">
            {t('navigationCheckPage.description', {
              defaultValue:
                'Validate that every lazy route resolves without throwing, and capture a timestamped OK/FAIL summary for release notes.',
            })}
          </p>
          {lastRun && (
            <p className="last-run">
              {t('navigationCheckPage.lastRun', {
                timestamp: formatTimestamp(lastRun),
                defaultValue: `Last run: ${formatTimestamp(lastRun)}`,
              })}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={`btn btn-primary ${isRunning ? 'is-loading' : ''}`}
            onClick={runHealthCheck}
            disabled={isRunning}
          >
            <span className="btn-text-content">
              {isRunning
                ? t('navigationCheckPage.checking', { defaultValue: 'Checking…' })
                : t('navigationCheckPage.runCheck', { defaultValue: 'Run health check' })}
            </span>
            {isRunning && <span className="spinner-inline" />}
          </button>
        </div>
      </header>

      <section className="diagnostics-summary">
        <div className="summary-card success">
          <p className="card-title">
            {t('navigationCheckPage.summary.healthy', { defaultValue: 'Healthy routes' })}
          </p>
          <p className="card-value">{summary.ok}</p>
        </div>
        <div className="summary-card error">
          <p className="card-title">
            {t('navigationCheckPage.summary.failed', { defaultValue: 'Failed routes' })}
          </p>
          <p className="card-value">{summary.fail}</p>
        </div>
        <div className="summary-card">
          <p className="card-title">
            {t('navigationCheckPage.summary.total', { defaultValue: 'Total routes' })}
          </p>
          <p className="card-value">{summary.total}</p>
        </div>
      </section>

      <section className="diagnostics-results">
        <h2>
          {t('navigationCheckPage.reportTitle', { defaultValue: 'Route validation report' })}
        </h2>
        <p className="section-hint">
          {t('navigationCheckPage.reportHint', {
            defaultValue:
              'Each entry attempts to import the lazy module inside an ErrorBoundary. Failures include the thrown message for quick triage.',
          })}
        </p>
        <div className="table-wrapper">
          {results.length ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    {t('navigationCheckPage.table.route', { defaultValue: 'Route' })}
                  </th>
                  <th scope="col">
                    {t('navigationCheckPage.table.section', { defaultValue: 'Section' })}
                  </th>
                  <th scope="col">
                    {t('navigationCheckPage.table.status', { defaultValue: 'Status' })}
                  </th>
                  <th scope="col">
                    {t('navigationCheckPage.table.loadTime', { defaultValue: 'Load time' })}
                  </th>
                  <th scope="col">
                    {t('navigationCheckPage.table.notes', { defaultValue: 'Notes' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <ErrorBoundary
                    key={result.path}
                    fallback={
                      <tr>
                        <td colSpan={5} className="diagnostic-status error">
                          {t('navigationCheckPage.fallbackRow', {
                            path: result.path,
                            defaultValue: `Failed to render health row for ${result.path}`,
                          })}
                        </td>
                      </tr>
                    }
                  >
                    <RouteResultRow result={result} t={t} />
                  </ErrorBoundary>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              {t('navigationCheckPage.emptyState', {
                defaultValue:
                  'Launch the health check to populate the OK/FAIL matrix for every route in the application shell.',
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface RouteResultRowProps {
  result: RouteHealthResult;
  t: TFunction<'translation'>;
}

const RouteResultRow: React.FC<RouteResultRowProps> = ({ result, t }) => (
  <tr>
    <td className="target-cell">
      <div>
        <strong>
          {result.titleKey
            ? t(result.titleKey, { defaultValue: result.title })
            : result.title}
        </strong>
      </div>
      <div>{result.path}</div>
    </td>
    <td>
      {result.groupKey
        ? t(result.groupKey, { defaultValue: result.group })
        : result.group}
    </td>
    <td>
      <span
        className={`diagnostic-status ${result.status === 'ok' ? 'success' : 'error'}`}
        aria-label={
          result.status === 'ok'
            ? t('navigationCheckPage.status.ok', { defaultValue: 'OK' })
            : t('navigationCheckPage.status.fail', { defaultValue: 'FAIL' })
        }
      >
        {result.status === 'ok'
          ? t('navigationCheckPage.status.ok', { defaultValue: 'OK' })
          : t('navigationCheckPage.status.fail', { defaultValue: 'FAIL' })}
      </span>
    </td>
    <td>
      {t('navigationCheckPage.loadTime', {
        value: Math.round(result.durationMs),
        defaultValue: `${Math.round(result.durationMs)} ms`,
      })}
    </td>
    <td className="notes-cell">
      {result.error
        ? result.error
        : t('navigationCheckPage.successNotes', { defaultValue: 'Module resolved successfully.' })}
    </td>
  </tr>
);

export default NavigationCheckPage;
