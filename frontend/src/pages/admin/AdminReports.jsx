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
    waiting_parts: '#6b7280',
    repairing: '#ef4444',
    quality_check: '#06b6d4',
    ready: '#10b981',
    delivered: '#22c55e',
    cancelled: '#9ca3af',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                {label && <p className="tooltip-label">{label}</p>}
                {payload.map((p, i) => (
                    <p key={i} className="tooltip-value" style={{ color: p.color || 'var(--color-primary)' }}>
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
            <p>Generando reportes comerciales...</p>
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
                    <p className="text-muted">Resumen del rendimiento financiero y operativo del negocio</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary">
                    <RefreshCw size={14} /> Actualizar Datos
                </button>
            </header>

            {/* ── KPI Row ── */}
            <div className="kpi-row">
                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
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
                    <div className="kpi-tile-icon" style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary)', borderColor: 'rgba(var(--color-primary-rgb), 0.15)' }}>
                        <Wrench size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">Reparaciones (mes)</span>
                        <span className="kpi-tile-value">{data?.thisMonth?.repairs ?? 0}</span>
                        <span className="kpi-tile-sub">mes anterior: {data?.lastMonth?.repairs ?? 0}</span>
                    </div>
                </div>

                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
                        <Users size={20} />
                    </div>
                    <div className="kpi-tile-body">
                        <span className="kpi-tile-label">Total de clientes</span>
                        <span className="kpi-tile-value">{data?.totalCustomers ?? 0}</span>
                        <span className="kpi-tile-sub">registrados activos</span>
                    </div>
                </div>

                <div className="kpi-tile">
                    <div className="kpi-tile-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
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
                            <p className="text-muted">Últimos 6 meses de facturación</p>
                        </div>
                    </div>
                    {revenueData.length > 0 ? (
                        <div className="chart-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="var(--color-text-secondary)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-secondary)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--dash-hover-glow)' }} />
                                    <Bar dataKey="Ingresos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
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
                        <span className="report-total">{totalRepairs} órdenes</span>
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
                        <div className="chart-area chart-area--sm" style={{ marginBottom: 'var(--sp-2)' }}>
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
                                            <Cell key={i} fill={entry.color} stroke="var(--color-bg-card)" strokeWidth={1} />
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke="var(--color-text-secondary)"
                                        tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="var(--color-text-secondary)"
                                        tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                                        axisLine={false} tickLine={false}
                                        width={95}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--dash-hover-glow)' }} />
                                    <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} name="Cantidad" />
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
                        <span className="report-total">{technicians.length} registrados</span>
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
                                        
                                        // Dynamic class based on success rate
                                        let rateClass = 'rate-low';
                                        if (rate >= 80) rateClass = 'rate-high';
                                        else if (rate >= 50) rateClass = 'rate-mid';

                                        return (
                                            <tr key={tech.id}>
                                                <td>
                                                    <div className="tech-cell">
                                                        <div className="tech-avatar-sm">
                                                            {tech.first_name?.charAt(0).toUpperCase()}{tech.last_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{tech.first_name} {tech.last_name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge-count success">{tech.completed ?? 0}</span></td>
                                                <td><span className="badge-count warning">{tech.in_progress ?? 0}</span></td>
                                                <td>
                                                    <div className="rate-bar-container">
                                                        <div className="rate-track">
                                                            <div className={`rate-fill ${rateClass}`} style={{ width: `${rate}%` }} />
                                                        </div>
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
                        <p className="text-muted" style={{ padding: 'var(--sp-4) 0', textAlign: 'center' }}>No hay técnicos registrados activos.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
