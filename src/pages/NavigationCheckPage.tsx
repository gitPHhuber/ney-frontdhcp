/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaFileCode,
  FaFileCsv,
  FaTimesCircle,
} from 'react-icons/fa';

import Dropdown from '../components/ui/Dropdown';

type DiagnosticStatus = 'success' | 'warning' | 'error';
type DiagnosticSeverity = 'low' | 'medium' | 'high';

interface DiagnosticResult {
  id: string;
  check: string;
  target: string;
  status: DiagnosticStatus;
  severity: DiagnosticSeverity;
  message: string;
  checkedAt: string;
  durationMs: number;
}

const STATUS_ICONS: Record<DiagnosticStatus, React.ReactNode> = {
  success: <FaCheckCircle />,
  warning: <FaExclamationTriangle />,
  error: <FaTimesCircle />,
};

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const createSampleDiagnostics = (): DiagnosticResult[] => {
  const now = new Date();
  return [
    {
      id: 'NAV-001',
      check: 'DNS Resolution',
      target: 'core.netgrip.local',
      status: 'success',
      severity: 'low',
      message: 'Host resolved correctly (10.10.10.10).',
      checkedAt: now.toISOString(),
      durationMs: 118,
    },
    {
      id: 'NAV-002',
      check: 'Gateway Reachability',
      target: '192.168.1.1',
      status: 'warning',
      severity: 'medium',
      message: 'Latency exceeded threshold (142ms).',
      checkedAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
      durationMs: 142,
    },
    {
      id: 'NAV-003',
      check: 'Routing Consistency',
      target: 'edge-router-01',
      status: 'success',
      severity: 'low',
      message: 'Routes match expected configuration snapshot.',
      checkedAt: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
      durationMs: 96,
    },
    {
      id: 'NAV-004',
      check: 'Firewall Policy',
      target: 'fw-core',
      status: 'error',
      severity: 'high',
      message: 'Unexpected deny rule detected for navigation subnet.',
      checkedAt: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
      durationMs: 87,
    },
  ];
};

const wrapCsvValue = (value: string | number) => {
  const stringified = String(value ?? '');
  const escaped = stringified.replace(/"/g, '""');
  return `"${escaped}"`;
};

const serializeDiagnosticsToCsv = (data: DiagnosticResult[]) => {
  const headerRow = [
    'ID',
    'Check',
    'Target',
    'Status',
    'Severity',
    'Message',
    'Checked At',
    'Duration (ms)',
  ]
    .map(wrapCsvValue)
    .join(',');

  const bodyRows = data.map(result =>
    [
      wrapCsvValue(result.id),
      wrapCsvValue(result.check),
      wrapCsvValue(result.target),
      wrapCsvValue(result.status),
      wrapCsvValue(result.severity),
      wrapCsvValue(result.message),
      wrapCsvValue(new Date(result.checkedAt).toISOString()),
      wrapCsvValue(result.durationMs),
    ].join(','),
  );

  return [headerRow, ...bodyRows].join('\n');
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const NavigationCheckPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      diagnostics.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        {
          success: 0,
          warning: 0,
          error: 0,
        } as Record<DiagnosticStatus, number>,
      ),
    [diagnostics],
  );

  const handleRunDiagnostics = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = createSampleDiagnostics();
      setDiagnostics(results);
      setLastRun(new Date().toISOString());
      setIsRunning(false);
    }, 900);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!diagnostics.length) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const baseFilename = `navigation-diagnostics-${timestamp}`;

    if (format === 'json') {
      const json = JSON.stringify(diagnostics, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      triggerFileDownload(blob, `${baseFilename}.json`);
      return;
    }

    const csv = serializeDiagnosticsToCsv(diagnostics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `${baseFilename}.csv`);
  };

  const hasDiagnostics = diagnostics.length > 0;

  return (
    <div className="navigation-check-page">
      <header className="page-header">
        <div className="page-header-copy">
          <h1>Navigation Check</h1>
          <p className="page-subtitle">
            Run automated diagnostics to verify routing, gateway reachability, and navigation policies across your network.
          </p>
          {lastRun && <p className="last-run">Last run: {formatDateTime(lastRun)}</p>}
        </div>

        <div className="header-actions">
          <button
            className={`btn btn-primary${isRunning ? ' is-loading' : ''}`}
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            type="button"
          >
            <span className="btn-text-content">Run diagnostics</span>
            {isRunning && <span className="spinner-inline" aria-hidden="true" />}
          </button>

          <Dropdown
            trigger={
              <button type="button" className="btn" disabled={!hasDiagnostics} aria-disabled={!hasDiagnostics}>
                <FaDownload />
                <span>Export</span>
              </button>
            }
          >
            <button type="button" onClick={() => handleExport('csv')} disabled={!hasDiagnostics}>
              <FaFileCsv /> Export CSV
            </button>
            <button type="button" onClick={() => handleExport('json')} disabled={!hasDiagnostics}>
              <FaFileCode /> Export JSON
            </button>
          </Dropdown>
        </div>
      </header>

      <section className="diagnostics-summary">
        <div className="card summary-card success">
          <div className="card-icon">
            <FaCheckCircle />
          </div>
          <div className="card-value">{summary.success}</div>
          <div className="card-title">Passing checks</div>
        </div>
        <div className="card summary-card warning">
          <div className="card-icon">
            <FaExclamationTriangle />
          </div>
          <div className="card-value">{summary.warning}</div>
          <div className="card-title">Warnings</div>
        </div>
        <div className="card summary-card error">
          <div className="card-icon">
            <FaTimesCircle />
          </div>
          <div className="card-value">{summary.error}</div>
          <div className="card-title">Failed checks</div>
        </div>
      </section>

      <section className="card diagnostics-results">
        <h2>Diagnostics timeline</h2>
        <p className="section-hint">
          Review the detailed output from the most recent diagnostic run. Export results for sharing or further analysis.
        </p>

        {hasDiagnostics ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">Check</th>
                  <th scope="col">Target</th>
                  <th scope="col">Status</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Checked</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.map(result => (
                  <tr key={result.id}>
                    <td>{result.check}</td>
                    <td className="target-cell">{result.target}</td>
                    <td>
                      <span className={`diagnostic-status ${result.status}`}>
                        {STATUS_ICONS[result.status]}
                        {result.status}
                      </span>
                    </td>
                    <td className={`severity ${result.severity}`}>{result.severity}</td>
                    <td>{result.durationMs} ms</td>
                    <td>{formatDateTime(result.checkedAt)}</td>
                    <td className="notes-cell">{result.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No diagnostics available yet. Run diagnostics to generate the latest insights.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NavigationCheckPage;
