/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { api } from '../services/api';
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';
import PriorityIcon from '../components/ui/PriorityIcon';
import StatusBadge from '../components/ui/StatusBadge';
import { FaFileAlt, FaNetworkWired, FaCalendarWeek } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, Tooltip, Legend);

const statusColors = {
    active: 'rgba(86, 155, 255, 0.7)',   // --netgrip-primary-accent
    in_work: 'rgba(255, 193, 7, 0.7)',    // --netgrip-warning
    completed: 'rgba(40, 167, 69, 0.7)',  // --netgrip-success
    broken: 'rgba(220, 53, 69, 0.7)',     // --netgrip-danger
    pending: 'rgba(13, 202, 240, 0.7)',    // --netgrip-info
};

type ReportColumn = keyof Lease;

// Fix: Improved typing for predefined report data.
type PredefinedReportRow = Record<string, string | number>;

type PredefinedReport = {
    title: string;
    data: PredefinedReportRow[];
    summary: string;
    columns: { key: string; label: string }[];
} | null;

const ReportsPage = () => {
    const { t } = useTranslation();
    const [reportData, setReportData] = useState<Lease[] | null>(null);
    const [chartData, setChartData] = useState<ChartData<'pie', number[], string> | null>(null);
    const [predefinedReport, setPredefinedReport] = useState<PredefinedReport>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const initialColumns: Record<ReportColumn, boolean> = {
        id: false,
        ip: true,
        mac: true,
        hostname: true,
        status: true,
        taken_by: true,
        priority: true,
        labels: false,
    };
    const [columns, setColumns] = useState(initialColumns);
    const availableColumns = Object.keys(initialColumns) as ReportColumn[];

    const handlePredefinedReport = async (reportType: 'weekly' | 'utilization') => {
        setIsLoading(true);
        setReportData(null);
        setChartData(null);
        setPredefinedReport(null);

        try {
            if (reportType === 'weekly') {
                const { report, summary } = await api.getWeeklyLeaseActivityReport();
                setPredefinedReport({
                    title: 'Еженедельная активность аренды',
                    data: report,
                    summary,
                    columns: [
                        { key: 'status', label: 'Статус' },
                        { key: 'count', label: 'Количество' },
                    ],
                });
            } else if (reportType === 'utilization') {
                const { report, summary } = await api.getNetworkUtilizationReport();
                setPredefinedReport({
                    title: 'Использование сети',
                    data: report,
                    summary,
                    columns: [
                        { key: 'category', label: 'Категория' },
                        { key: 'value', label: 'Значение' },
                    ],
                });
            } else {
                alert(`Отчёт «${reportType}» появится позже.`);
            }
        } catch (error: unknown) {
             if (error instanceof Error) {
                 console.error('Не удалось сформировать готовый отчёт:', error.message);
             } else {
                 console.error('Не удалось сформировать готовый отчёт: неизвестная ошибка');
             }
        } finally {
            setIsLoading(false);
        }
    };

    const handleColumnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setColumns(prev => ({ ...prev, [name]: checked }));
    };

    const generateCustomReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setReportData(null);
        setChartData(null);
        setPredefinedReport(null);
        try {
            const leases = await api.getLeases();

            const statusCounts = leases.reduce((acc, lease) => {
                acc[lease.status] = (acc[lease.status] || 0) + 1;
                return acc;
            }, {} as Record<Lease['status'], number>);

            const labels = Object.keys(statusCounts);
            const data = Object.values(statusCounts);
            const backgroundColors = labels.map(label => statusColors[label] || '#cccccc');

            setChartData({
                labels: labels.map(label => t(`status.${label}`, { defaultValue: label })),
                datasets: [{
                    label: 'Распределение по статусам',
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: '#1a1d2e',
                    borderWidth: 2,
                }],
            });

            setReportData(leases);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Не удалось сформировать отчёт:', error.message);
            } else {
                console.error('Не удалось сформировать отчёт: неизвестная ошибка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const selectedColumns = availableColumns.filter(col => columns[col]);
    const columnLabels: Record<ReportColumn, string> = {
        id: 'ID',
        ip: 'IP-адрес',
        mac: 'MAC-адрес',
        hostname: 'Имя хоста',
        status: 'Статус',
        taken_by: 'Назначено',
        priority: 'Приоритет',
        labels: 'Метки',
    };

    return (
        <div>
            <header className="page-header">
                <h1>Отчёты</h1>
            </header>

            <div className="reports-grid">
                <div className="card">
                    <h2 style={{marginBottom: '1.5rem'}}>Готовые отчёты</h2>
                    <div className='predefined-reports-list'>
                        <button className="btn" onClick={() => handlePredefinedReport('weekly')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaCalendarWeek /> Еженедельная активность аренды
                        </button>
                         <button className="btn" onClick={() => handlePredefinedReport('utilization')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaNetworkWired /> Использование сети
                        </button>
                         <button className="btn" onClick={() => alert('Отчёт по аудиту устройств появится позже!')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaFileAlt /> Журнал аудита устройств
                        </button>
                    </div>
                </div>

                <div className="card">
                     <h2 style={{marginBottom: '1.5rem'}}>Конструктор отчётов</h2>
                     <form onSubmit={generateCustomReport} className="report-builder-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="start-date">Дата начала</label>
                                <input id="start-date" type="date" className="form-control" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="end-date">Дата окончания</label>
                                <input id="end-date" type="date" className="form-control" />
                            </div>
                        </div>
                        <div className="columns-selector">
                            <h4>Выберите столбцы</h4>
                             <div className="columns-grid">
                                {availableColumns.map(col => (
                                    // Fix: Use String(col) for key, name, and string operations to handle potential non-string keys.
                                    <label key={String(col)} className="column-option">
                                        <input
                                            type="checkbox"
                                            name={String(col)}
                                            checked={columns[col]}
                                            onChange={handleColumnChange}
                                        />
                                        {columnLabels[col]}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Формирование…' : 'Сформировать отчёт'}
                        </button>
                     </form>
                </div>
            </div>

            {isLoading && (
                 <div className="loading-overlay" style={{position: 'relative', minHeight: '300px', borderRadius: '8px', marginTop: '2rem'}}>
                    <div className="spinner"></div>
                </div>
            )}

            {predefinedReport && (
                 <div className="card report-output-section">
                    <h2>{predefinedReport.title}</h2>
                    <p>{predefinedReport.summary}</p>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {predefinedReport.columns.map(column => <th key={column.key}>{column.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {predefinedReport.data.map((row, index) => (
                                    <tr key={index}>
                                        {predefinedReport.columns.map(column => (
                                            <td key={column.key}>{row[column.key]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reportData && chartData && (
                <div className="card report-output-section">
                    <h2>Результаты отчёта</h2>
                    <div className="report-output-grid">
                        <div className="chart-container">
                             <Pie data={chartData} options={{
                                responsive: true,
                                plugins: { legend: { position: 'top', labels: { color: 'var(--netgrip-text-dark)' } } }
                            }} />
                        </div>
                        <div className="table-wrapper">
                             <table>
                                <thead>
                                    <tr>
                                        {/* Fix: Use String(col) for key and string operations. */}
                                        {selectedColumns.map(col => <th key={String(col)}>{columnLabels[col]}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(lease => (
                                        <tr key={lease.id}>
                                            {selectedColumns.map(col => (
                                                // Fix: Use String(col) for key to handle potential non-string types.
                                                <td key={`${lease.id}-${String(col)}`}>
                                                    {col === 'status' ? <StatusBadge status={lease[col]} /> :
                                                     col === 'priority' ? <PriorityIcon priority={lease[col]} /> :
                                                     lease[col] ?? '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;