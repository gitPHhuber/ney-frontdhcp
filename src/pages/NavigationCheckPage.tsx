/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';

import ErrorBoundary from '../components/ui/ErrorBoundary';
import { appNavigation } from '../app/navigation';

interface RouteDescriptor {
  path: string;
  title: string;
  group: string;
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
      title: item.translationKey ?? item.title,
      group: section.title,
      loader: item.loader,
    })),
  );

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

const NavigationCheckPage: React.FC = () => {
  const routes = useMemo(() => flattenNavigation(), []);
  const [results, setResults] = useState<RouteHealthResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

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
          <h1>Navigation health check</h1>
          <p className="page-subtitle">
            Validate that every lazy route resolves without throwing, and capture a timestamped OK/FAIL summary for release notes.
          </p>
          {lastRun && <p className="last-run">Last run: {formatTimestamp(lastRun)}</p>}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={`btn btn-primary ${isRunning ? 'is-loading' : ''}`}
            onClick={runHealthCheck}
            disabled={isRunning}
          >
            <span className="btn-text-content">{isRunning ? 'Checking…' : 'Run health check'}</span>
            {isRunning && <span className="spinner-inline" />}
          </button>
        </div>
      </header>

      <section className="diagnostics-summary">
        <div className="summary-card success">
          <p className="card-title">Healthy routes</p>
          <p className="card-value">{summary.ok}</p>
        </div>
        <div className="summary-card error">
          <p className="card-title">Failed routes</p>
          <p className="card-value">{summary.fail}</p>
        </div>
        <div className="summary-card">
          <p className="card-title">Total routes</p>
          <p className="card-value">{summary.total}</p>
        </div>
      </section>

      <section className="diagnostics-results">
        <h2>Route validation report</h2>
        <p className="section-hint">
          Each entry attempts to import the lazy module inside an ErrorBoundary. Failures include the thrown message for quick triage.
        </p>
        <div className="table-wrapper">
          {results.length ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Section</th>
                  <th scope="col">Status</th>
                  <th scope="col">Load time</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <ErrorBoundary
                    key={result.path}
                    fallback={
                      <tr>
                        <td colSpan={5} className="diagnostic-status error">
                          Failed to render health row for {result.path}
                        </td>
                      </tr>
                    }
                  >
                    <RouteResultRow result={result} />
                  </ErrorBoundary>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              Launch the health check to populate the OK/FAIL matrix for every route in the application shell.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface RouteResultRowProps {
  result: RouteHealthResult;
}

const RouteResultRow: React.FC<RouteResultRowProps> = ({ result }) => (
  <tr>
    <td className="target-cell">
      <div>
        <strong>{result.title}</strong>
      </div>
      <div>{result.path}</div>
    </td>
    <td>{result.group}</td>
    <td>
      <span
        className={`diagnostic-status ${result.status === 'ok' ? 'success' : 'error'}`}
        aria-label={result.status === 'ok' ? 'OK' : 'FAIL'}
      >
        {result.status === 'ok' ? 'OK' : 'FAIL'}
      </span>
    </td>
    <td>{`${Math.round(result.durationMs)} ms`}</td>
    <td className="notes-cell">{result.error ?? 'Module resolved successfully.'}</td>
  </tr>
);

export default NavigationCheckPage;
