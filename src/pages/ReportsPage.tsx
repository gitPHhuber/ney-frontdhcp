/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { api } from '../services/api';
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';
import PriorityIcon from '../components/ui/PriorityIcon';
import StatusBadge from '../components/ui/StatusBadge';
import { FaFileAlt, FaNetworkWired, FaCalendarWeek } from 'react-icons/fa';

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
type PredefinedReport = {
    title: string;
    data: Record<string, any>[];
    summary: string;
    headers: string[];
} | null;

const ReportsPage = () => {
    const [reportData, setReportData] = useState<Lease[] | null>(null);
    const [chartData, setChartData] = useState<any | null>(null);
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
                setPredefinedReport({ title: 'Weekly Lease Activity', data: report, summary, headers: ['Status', 'Count'] });
            } else if (reportType === 'utilization') {
                const { report, summary } = await api.getNetworkUtilizationReport();
                setPredefinedReport({ title: 'Network Utilization', data: report, summary, headers: ['Category', 'Value'] });
            } else {
                 alert(`Generating '${reportType}' report... (feature coming soon)`);
            }
        } catch (error) {
             console.error("Failed to generate predefined report:", error);
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
                labels,
                datasets: [{
                    label: 'Lease Status Distribution',
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: '#1a1d2e',
                    borderWidth: 2,
                }],
            });

            setReportData(leases);

        } catch (error) {
            console.error("Failed to generate report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedColumns = availableColumns.filter(col => columns[col]);

    return (
        <div>
            <header className="page-header">
                <h1>Reports</h1>
            </header>

            <div className="reports-grid">
                <div className="card">
                    <h2 style={{marginBottom: '1.5rem'}}>Pre-defined Reports</h2>
                    <div className='predefined-reports-list'>
                        <button className="btn" onClick={() => handlePredefinedReport('weekly')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaCalendarWeek /> Weekly Lease Activity
                        </button>
                         <button className="btn" onClick={() => handlePredefinedReport('utilization')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaNetworkWired /> Network Utilization
                        </button>
                         <button className="btn" onClick={() => alert('Device Audit Log report coming soon!')} style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <FaFileAlt /> Device Audit Log
                        </button>
                    </div>
                </div>

                <div className="card">
                     <h2 style={{marginBottom: '1.5rem'}}>Custom Report Builder</h2>
                     <form onSubmit={generateCustomReport} className="report-builder-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="start-date">Start Date</label>
                                <input id="start-date" type="date" className="form-control" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="end-date">End Date</label>
                                <input id="end-date" type="date" className="form-control" />
                            </div>
                        </div>
                        <div className="columns-selector">
                            <h4>Select Columns</h4>
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
                                        {String(col).charAt(0).toUpperCase() + String(col).slice(1).replace('_', ' ')}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Generating...' : 'Generate Report'}
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
                                    {predefinedReport.headers.map(header => <th key={header}>{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {predefinedReport.data.map((row, index) => (
                                    <tr key={index}>
                                        {predefinedReport.headers.map(header => (
                                            <td key={header}>{row[header.toLowerCase()]}</td>
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
                    <h2>Report Results</h2>
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
                                        {selectedColumns.map(col => <th key={String(col)}>{String(col).replace('_', ' ')}</th>)}
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
                                                     lease[col] ?? 'N/A'}
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