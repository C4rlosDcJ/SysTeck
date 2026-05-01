import { useState, useEffect } from 'react';
import { statsService } from '../../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    DollarSign, Wrench, Users, TrendingUp, Award,
    RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/constants';
import './AdminReports.css';

const STATUS_LABELS = {
    received: 'Recibido',
    diagnosing: 'En Diagnóstico',
    waiting_approval: 'Esp. Aprobación',
    waiting_parts: 'Esp. Refacciones',
    repairing: 'En Reparación',
    quality_check: 'C. de Calidad',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

const STATUS_COLORS = {
    received: '#3b82f6',
    diagnosing: '#8b5cf6',
    waiting_approval: '#f59e0b',
    waiting_parts: '#78716c',
    repairing: '#ef4444',
    quality_check: '#06b6d4',
    ready: '#22c55e',
    delivered: '#84cc16',
    cancelled: '#6b7280',
};

const CHART_COLORS = ['#e63358', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                {label && <p className="tooltip-label">{label}</p>}
                {payload.map((p, i) => (
                    <p key={i} className="tooltip-value" style={{ color: p.color || '#e63358' }}>
                        {p.name}: {p.name === 'Ingresos' ? formatCurrency(p.value) : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminReports() {
    const [data, setData] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dashSt, techSt] = await Promise.all([
                statsService.getDashboard(),
                statsService.getTechniciansStats()
            ]);
            setData(dashSt);
            setTechnicians(techSt || []);
        } catch (e) {
            console.error('Error al cargar reportes:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="loading-state">
            <div className="spinner" />
            <p>Generando reportes...</p>
        </div>
    );

    /* ── Build chart data ── */
    const revenueData = (data?.monthlyRevenue || []).map(item => ({
        month: item.month,
        Ingresos: parseFloat(item.revenue || 0),
    }));

    const statusSummary = data?.statusSummary || {};
    const totalRepairs = Object.values(statusSummary).reduce((s, v) => s + v, 0);

    const pieData = Object.entries(statusSummary)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
            name: STATUS_LABELS[key] || key,
            value,
            color: STATUS_COLORS[key] || '#6b7280',
        }));

    /* Month-over-month change */
    const thisRev = data?.thisMonth?.revenue || 0;
    const lastRev = data?.lastMonth?.revenue || 0;
    const revChange = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : null;

    return (
        <div className="reports-page">
            {/* ── Header ── */}
            <header className="page-header reports-header">
                <div>
                    <h1>Análisis y Reportes</h1>
                    <p>Resumen del rendimiento del negocio</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} /> Actualizar
                </button>
            </header>

            {/* ── KPI Row ── */}
            <div className="kpi-row">
                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(230,51,88,0.12)', color: '#e63358' }}>
                        <DollarSign size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">Ingresos del mes</span>
                        <span className="kpi-tile-value">{formatCurrency(thisRev)}</span>
                        {revChange !== null && (
                            <span className={`kpi-tile-change ${revChange >= 0 ? 'positive' : 'negative'}`}>
                                {revChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(revChange).toFixed(1)}% vs mes anterior
                            </span>
                        )}
                    </div>
                </div>

                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                        <Wrench size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">Reparaciones (mes)</span>
                        <span className="kpi-tile-value">{data?.thisMonth?.repairs ?? 0}</span>
                        <span className="kpi-tile-sub">mes anterior: {data?.lastMonth?.repairs ?? 0}</span>
                    </div>
                </div>

                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">Total de clientes</span>
                        <span className="kpi-tile-value">{data?.totalCustomers ?? 0}</span>
                        <span className="kpi-tile-sub">registrados</span>
                    </div>
                </div>

                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        <Award size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">En proceso ahora</span>
                        <span className="kpi-tile-value">{data?.inProgress ?? 0}</span>
                        <span className="kpi-tile-sub">reparaciones activas</span>
                    </div>
                </div>
            </div>

            {/* ── Main Charts Grid ── */}
            <div className="reports-main-grid">
                {/* Revenue Chart — full width */}
                <div className="report-card report-card--full">
                    <div className="report-card-header">
                        <div>
                            <h2>Tendencia de Ingresos</h2>
                            <p>Últimos 6 meses</p>
                        </div>
                    </div>
                    {revenueData.length > 0 ? (
                        <div className="chart-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="Ingresos" fill="#e63358" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No hay datos de ingresos disponibles</p>
                        </div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="report-card">
                    <div className="report-card-header">
                        <h2>Estado de Reparaciones</h2>
                        <span className="report-total">{totalRepairs} total</span>
                    </div>
                    <div className="status-breakdown">
                        {Object.entries(statusSummary).filter(([, v]) => v >= 0).map(([key, count]) => {
                            const pct = totalRepairs > 0 ? (count / totalRepairs) * 100 : 0;
                            return (
                                <div key={key} className="breakdown-row">
                                    <div className="breakdown-meta">
                                        <span className="breakdown-dot" style={{ background: STATUS_COLORS[key] }} />
                                        <span className="breakdown-name">{STATUS_LABELS[key]}</span>
                                        <span className="breakdown-count">{count}</span>
                                    </div>
                                    <div className="breakdown-track">
                                        <div
                                            className="breakdown-fill"
                                            style={{ width: `${pct}%`, background: STATUS_COLORS[key] }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pie chart */}
                <div className="report-card">
                    <div className="report-card-header">
                        <h2>Distribución Visual</h2>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="chart-area chart-area--sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state"><p>Sin datos</p></div>
                    )}
                    {/* Custom legend */}
                    <div className="pie-legend">
                        {pieData.map((item, i) => (
                            <div key={i} className="pie-legend-item">
                                <span className="pie-legend-dot" style={{ background: item.color }} />
                                <span className="pie-legend-name">{item.name}</span>
                                <span className="pie-legend-val">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top services horizontal bar */}
                <div className="report-card">
                    <div className="report-card-header">
                        <h2>Servicios Más Solicitados</h2>
                    </div>
                    {(data?.topServices?.length > 0) ? (
                        <div className="chart-area chart-area--sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={data.topServices} barSize={16}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false} tickLine={false}
                                        width={90}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Cantidad" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state"><p>Sin datos de servicios</p></div>
                    )}
                </div>

                {/* Technicians table */}
                <div className="report-card report-card--full">
                    <div className="report-card-header">
                        <h2>Rendimiento de Técnicos</h2>
                        <span className="report-total">{technicians.length} técnicos</span>
                    </div>
                    {technicians.length > 0 ? (
                        <div className="tech-table-wrap">
                            <table className="tech-table">
                                <thead>
                                    <tr>
                                        <th>Técnico</th>
                                        <th>Completadas</th>
                                        <th>En proceso</th>
                                        <th>Tasa de éxito</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.map(tech => {
                                        const total = (tech.completed || 0) + (tech.in_progress || 0);
                                        const rate = total > 0 ? Math.round((tech.completed / total) * 100) : 0;
                                        return (
                                            <tr key={tech.id}>
                                                <td>
                                                    <div className="tech-cell">
                                                        <div className="tech-avatar-sm">
                                                            {tech.first_name?.charAt(0)}{tech.last_name?.charAt(0)}
                                                        </div>
                                                        <span>{tech.first_name} {tech.last_name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge-count success">{tech.completed ?? 0}</span></td>
                                                <td><span className="badge-count warning">{tech.in_progress ?? 0}</span></td>
                                                <td>
                                                    <div className="rate-bar">
                                                        <div className="rate-fill" style={{ width: `${rate}%` }} />
                                                        <span className="rate-label">{rate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted">No hay técnicos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
