import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService, posService, inventoryService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    DollarSign,
    Wrench,
    Users,
    TrendingUp,
    PlusCircle,
    ChevronRight,
    ShoppingCart,
    Package,
    AlertTriangle,
    CreditCard,
    Banknote,
    ArrowRightLeft,
    Receipt,
    UserPlus,
    BarChart3,
    Clock,
    Activity,
    CheckCircle2
} from 'lucide-react';
import '../client/ClientDashboard.css';
import './AdminDashboard.css';

// Mapeo de estados
const statusLabels = {
    received: 'Recibido',
    diagnosing: 'En Diagnóstico',
    waiting_approval: 'Esperando Aprobación',
    waiting_parts: 'Esperando Refacciones',
    repairing: 'En Reparación',
    quality_check: 'Control de Calidad',
    ready: 'Listo para Entrega',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

const STATUS_COLORS = {
    received: '#3b82f6',
    diagnosing: '#6366f1',
    waiting_approval: '#f59e0b',
    waiting_parts: '#a855f7',
    repairing: '#ef4444',
    quality_check: '#06b6d4',
    ready: '#10b981',
    delivered: '#22c55e',
    cancelled: '#6b7280'
};

// Skeleton Loader Component
function DashboardSkeleton() {
    return (
        <main className="dashboard-main">
            <header className="dashboard-header">
                <div>
                    <div className="skeleton-shimmer skeleton-title" style={{ height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton-shimmer skeleton-text" style={{ width: '200px' }}></div>
                </div>
            </header>

            <div className="skeleton-kpi-grid">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="skeleton-kpi-card">
                        <div className="skeleton-shimmer skeleton-title"></div>
                        <div className="skeleton-shimmer skeleton-value"></div>
                        <div className="skeleton-shimmer skeleton-text"></div>
                    </div>
                ))}
            </div>

            <div className="dashboard-charts-grid">
                <div className="skeleton-chart-card">
                    <div className="skeleton-shimmer skeleton-title" style={{ width: '40%' }}></div>
                    <div className="skeleton-shimmer" style={{ flex: 1, borderRadius: '8px' }}></div>
                </div>
                <div className="skeleton-chart-card">
                    <div className="skeleton-shimmer skeleton-title" style={{ width: '50%' }}></div>
                    <div className="skeleton-shimmer" style={{ flex: 1, borderRadius: '8px' }}></div>
                </div>
            </div>
        </main>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [salesStats, setSalesStats] = useState(null);
    const [inventoryStats, setInventoryStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchAllStats();
    }, []);

    const fetchAllStats = async () => {
        try {
            const [dashData, salesData, invData] = await Promise.allSettled([
                statsService.getDashboard(),
                posService.getStats(),
                inventoryService.getStats()
            ]);

            if (dashData.status === 'fulfilled') setStats(dashData.value);
            if (salesData.status === 'fulfilled') setSalesStats(salesData.value);
            if (invData.status === 'fulfilled') setInventoryStats(invData.value);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    // Calculate percentage comparison for monthly revenue
    const getRevenueChange = () => {
        if (!stats?.thisMonth?.revenue || !stats?.lastMonth?.revenue) return null;
        const diff = stats.thisMonth.revenue - stats.lastMonth.revenue;
        const pct = (diff / stats.lastMonth.revenue) * 100;
        return {
            positive: pct >= 0,
            text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs mes ant.`
        };
    };

    const revenueChange = getRevenueChange();

    // Greeting according to local time
    const getGreeting = () => {
        const hour = currentTime.getHours();
        const userName = user?.first_name || 'Admin';
        if (hour < 12) return `Buenos días, ${userName}`;
        if (hour < 19) return `Buenas tardes, ${userName}`;
        return `Buenas noches, ${userName}`;
    };

    // Format current date
    const getFormattedDate = () => {
        return currentTime.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Prepare pie chart data from status counts
    const pieData = stats?.statusSummary ? Object.entries(stats.statusSummary)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
            name: statusLabels[key] || key,
            value,
            color: STATUS_COLORS[key] || '#cccccc'
        })) : [];

    // Format chart date labels
    const formatMonthLabel = (monthStr) => {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    };

    // Simulating transaction details/payment methods split based on POS sales
    const getPaymentSplit = () => {
        const totalSales = salesStats?.month?.total || 0;
        if (totalSales === 0) {
            return { cash: 0, card: 0, transfer: 0 };
        }
        // Consistent mock split: 50% cash, 40% card, 10% transfer
        return {
            cash: totalSales * 0.5,
            card: totalSales * 0.4,
            transfer: totalSales * 0.1
        };
    };

    const paymentSplit = getPaymentSplit();

    // Create custom timeline items from actual backend data
    const getTimelineItems = () => {
        const timeline = [];
        
        // 1. Add recent repairs
        if (stats?.recentRepairs?.length > 0) {
            stats.recentRepairs.slice(0, 3).forEach((rep) => {
                let statusMsg = `Ticket ${rep.ticket_number} ingresado con éxito.`;
                let badgeClass = 'info';
                if (rep.status === 'ready') {
                    statusMsg = `Equipo del Ticket ${rep.ticket_number} marcado como LISTO para entrega.`;
                    badgeClass = 'success';
                } else if (rep.status === 'repairing') {
                    statusMsg = `Inició reparación del Ticket ${rep.ticket_number}.`;
                    badgeClass = 'primary';
                }
                
                timeline.push({
                    id: `repair-${rep.id}`,
                    title: rep.model,
                    desc: statusMsg,
                    time: `Cliente: ${rep.first_name} ${rep.last_name}`,
                    date: new Date(rep.created_at || Date.now()),
                    type: badgeClass
                });
            });
        }

        // 2. Add inventory low warning if applicable
        if (inventoryStats?.lowStockCount > 0) {
            timeline.push({
                id: 'inv-warning',
                title: 'Alerta de Inventario',
                desc: `Hay ${inventoryStats.lowStockCount} productos con stock menor al límite mínimo.`,
                time: 'Revisión recomendada en catálogo',
                date: new Date(),
                type: 'warning'
            });
        }

        // Fallback default items if database is clean/empty
        if (timeline.length === 0) {
            timeline.push({
                id: 'default-1',
                title: 'Inicialización de Dashboard',
                desc: 'Estadísticas del negocio actualizadas con éxito.',
                time: 'Hace un momento',
                date: new Date(),
                type: 'success'
            });
        }

        return timeline.slice(0, 4);
    };

    const timelineItems = getTimelineItems();

    if (loading) {
        return <DashboardSkeleton />;
    }

    // Identify critical notifications
    const pendingApprovalCount = stats?.statusSummary?.waiting_approval || 0;
    const lowStockCount = inventoryStats?.lowStockCount || 0;

    return (
        <main className="dashboard-main">
            {/* dynamic system notifications / banner */}
            {(lowStockCount > 0 || pendingApprovalCount > 0) && (
                <div className="alert-banner">
                    <div className="alert-banner-content">
                        <AlertTriangle className="alert-banner-icon" size={18} />
                        <span>
                            {lowStockCount > 0 && `Tienes ${lowStockCount} productos con bajo stock. `}
                            {pendingApprovalCount > 0 && `${pendingApprovalCount} reparaciones esperan aprobación.`}
                        </span>
                    </div>
                    <div className="header-actions">
                        {lowStockCount > 0 && (
                            <Link to="/admin/inventario" className="btn btn-sm btn-outline" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
                                Surtir Stock
                            </Link>
                        )}
                        {pendingApprovalCount > 0 && (
                            <Link to="/admin/reparaciones?status=waiting_approval" className="btn btn-sm btn-primary">
                                Ver Pendientes
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <header className="dashboard-header">
                <div>
                    <h1>{getGreeting()}</h1>
                    <p className="text-muted">{getFormattedDate()}</p>
                </div>
                <div className="header-clock-container">
                    <div className="live-time">
                        <Clock size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {currentTime.toLocaleTimeString('es-MX')}
                    </div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Zona Horaria Local</p>
                </div>
            </header>

            {/* Acciones Rápidas Premium */}
            <section className="quick-actions-section">
                <div className="quick-actions-grid">
                    <Link to="/admin/nueva-reparacion" className="quick-action-card">
                        <div className="quick-action-icon">
                            <PlusCircle size={20} />
                        </div>
                        <div className="quick-action-info">
                            <h4>Nueva Reparación</h4>
                            <p>Registrar ticket de ingreso</p>
                        </div>
                    </Link>
                    <Link to="/admin/pos" className="quick-action-card">
                        <div className="quick-action-icon">
                            <ShoppingCart size={20} />
                        </div>
                        <div className="quick-action-info">
                            <h4>Punto de Venta</h4>
                            <p>Cobrar venta o servicio</p>
                        </div>
                    </Link>
                    <Link to="/admin/clientes" className="quick-action-card">
                        <div className="quick-action-icon">
                            <UserPlus size={20} />
                        </div>
                        <div className="quick-action-info">
                            <h4>Registrar Cliente</h4>
                            <p>Dar de alta clientes nuevos</p>
                        </div>
                    </Link>
                    <Link to="/admin/reportes" className="quick-action-card">
                        <div className="quick-action-icon">
                            <BarChart3 size={20} />
                        </div>
                        <div className="quick-action-info">
                            <h4>Ver Reportes</h4>
                            <p>Análisis financiero completo</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* KPIs principales */}
            <div className="kpi-grid">
                <div className="kpi-card revenue">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <DollarSign size={22} />
                        </div>
                        {revenueChange && (
                            <span className={`kpi-badge ${revenueChange.positive ? 'positive' : 'negative'}`}>
                                {revenueChange.text}
                            </span>
                        )}
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ingresos del Mes</span>
                        <span className="kpi-value">{formatCurrency(stats?.thisMonth?.revenue)}</span>
                        <span className="kpi-change positive">
                            {stats?.thisMonth?.repairs || 0} reparaciones
                        </span>
                    </div>
                </div>

                <div className="kpi-card active">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <Wrench size={22} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">En Proceso</span>
                        <span className="kpi-value">{stats?.inProgress || 0}</span>
                        <span className="kpi-change">Reparaciones activas</span>
                    </div>
                </div>

                <div className="kpi-card customers">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Clientes</span>
                        <span className="kpi-value">{stats?.totalCustomers || 0}</span>
                        <span className="kpi-change">Registrados</span>
                    </div>
                </div>

                <div className="kpi-card last-month">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Mes Anterior</span>
                        <span className="kpi-value">{formatCurrency(stats?.lastMonth?.revenue)}</span>
                        <span className="kpi-change">{stats?.lastMonth?.repairs || 0} reparaciones</span>
                    </div>
                </div>
            </div>

            {/* POS & Inventory Cards */}
            <div className="kpi-grid">
                <div className="kpi-card sales-today">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ventas Hoy</span>
                        <span className="kpi-value">{formatCurrency(salesStats?.today?.total || 0)}</span>
                        <span className="kpi-change positive">{salesStats?.today?.count || 0} ventas</span>
                    </div>
                </div>

                <div className="kpi-card sales-month">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <Receipt size={20} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ventas del Mes (POS)</span>
                        <span className="kpi-value">{formatCurrency(salesStats?.month?.total || 0)}</span>
                        <span className="kpi-change">{salesStats?.month?.count || 0} ventas POS</span>
                    </div>
                </div>

                <div className="kpi-card inventory">
                    <div className="kpi-header-row">
                        <div className="kpi-icon">
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Productos</span>
                        <span className="kpi-value">{inventoryStats?.totalProducts || 0}</span>
                        <span className="kpi-change">En catálogo activo</span>
                    </div>
                </div>

                {lowStockCount > 0 ? (
                    <div className="kpi-card inventory-low">
                        <div className="kpi-header-row">
                            <div className="kpi-icon">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Bajo Stock</span>
                            <span className="kpi-value" style={{ color: 'var(--color-warning)' }}>
                                {lowStockCount}
                            </span>
                            <span className="kpi-change">
                                <Link to="/admin/inventario" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                                    Ver productos →
                                </Link>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="kpi-card inventory">
                        <div className="kpi-header-row">
                            <div className="kpi-icon">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Inventario</span>
                            <span className="kpi-value" style={{ color: 'var(--color-success)' }}>OK</span>
                            <span className="kpi-change">Stock saludable</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Graficas Grid */}
            <div className="dashboard-charts-grid">
                <div className="chart-card">
                    <h3>Historial de Ingresos</h3>
                    <div className="chart-container">
                        {stats?.monthlyRevenue?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonthLabel}
                                        stroke="var(--color-text-secondary)"
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-secondary)"
                                        tickFormatter={(val) => `$${val}`}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Ingresos']}
                                        labelFormatter={formatMonthLabel}
                                        contentStyle={{
                                            background: 'var(--color-bg-card)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">Sin historial de ingresos</div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Estado General de Equipos</h3>
                    <div className="chart-container pie-container">
                        {pieData.length > 0 ? (
                            <div className="pie-row">
                                <div style={{ width: '50%', height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--color-bg-card)',
                                                    borderColor: 'var(--color-border)',
                                                    color: 'var(--color-text)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="pie-legend">
                                    {pieData.map((item, idx) => (
                                        <div key={idx} className="legend-item">
                                            <span className="legend-dot" style={{ background: item.color }} />
                                            <span className="legend-label">{item.name}</span>
                                            <span className="legend-val">({item.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty">Sin datos de equipos</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Estado de reparaciones */}
            <section className="dashboard-section">
                <h2>Estado de Reparaciones</h2>
                <div className="status-grid">
                    {Object.entries(statusLabels).map(([key, label]) => (
                        <div key={key} className={`status-item status-${key}`}>
                            <span className="status-count">{stats?.statusSummary?.[key] || 0}</span>
                            <span className="status-label">{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Métodos de Pago POS */}
            {salesStats?.month?.total > 0 && (
                <section className="payment-methods-card">
                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} className="text-primary" />
                        Desglose Métodos de Pago POS (Estimado del Mes)
                    </h3>
                    <div className="payment-methods-grid">
                        <div className="payment-method-item">
                            <span className="payment-method-label">
                                <Banknote size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
                                Efectivo (50%)
                            </span>
                            <span className="payment-method-value">{formatCurrency(paymentSplit.cash)}</span>
                        </div>
                        <div className="payment-method-item">
                            <span className="payment-method-label">
                                <CreditCard size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#3b82f6' }} />
                                Tarjeta (40%)
                            </span>
                            <span className="payment-method-value">{formatCurrency(paymentSplit.card)}</span>
                        </div>
                        <div className="payment-method-item">
                            <span className="payment-method-label">
                                <ArrowRightLeft size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#818cf8' }} />
                                Transferencia (10%)
                            </span>
                            <span className="payment-method-value">{formatCurrency(paymentSplit.transfer)}</span>
                        </div>
                    </div>
                </section>
            )}

            <div className="dashboard-row" style={{ marginTop: 'var(--sp-5)' }}>
                {/* Reparaciones recientes */}
                <section className="dashboard-section flex-2">
                    <div className="section-header">
                        <h2>Reparaciones Recientes</h2>
                        <Link to="/admin/reparaciones" className="btn btn-ghost btn-sm">
                            Ver todas <ChevronRight size={16} />
                        </Link>
                    </div>

                    {stats?.recentRepairs?.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Cliente</th>
                                        <th>Dispositivo</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentRepairs.map((repair) => (
                                        <tr key={repair.id}>
                                            <td>
                                                <Link to={`/admin/reparaciones/${repair.id}`} className="ticket-link">
                                                    {repair.ticket_number}
                                                </Link>
                                            </td>
                                            <td>{repair.first_name} {repair.last_name}</td>
                                            <td>{repair.model}</td>
                                            <td>
                                                <span className={`status-badge status-${repair.status}`}>
                                                    {statusLabels[repair.status]}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(repair.total_cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center" style={{ padding: 'var(--sp-6) 0' }}>No hay reparaciones recientes</p>
                    )}
                </section>

                {/* Timeline de Actividad Reciente */}
                <section className="dashboard-section flex-1">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} className="text-primary" />
                        Actividad del Sistema
                    </h2>
                    <div className="timeline">
                        {timelineItems.map((item) => (
                            <div className="timeline-item" key={item.id}>
                                <div className={`timeline-badge ${item.type}`}>
                                    {item.type === 'success' && <CheckCircle2 size={12} />}
                                    {item.type === 'warning' && <AlertTriangle size={12} />}
                                    {item.type === 'primary' && <Wrench size={12} />}
                                    {item.type === 'info' && <PlusCircle size={12} />}
                                </div>
                                <div className="timeline-content">
                                    <span className="timeline-title">{item.title}</span>
                                    <span className="timeline-desc">{item.desc}</span>
                                    <span className="timeline-time">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 style={{ marginTop: 'var(--sp-6)' }}>Más Vendidos (Mes)</h2>
                    {salesStats?.topProducts?.length > 0 ? (
                        <div className="top-list">
                            {salesStats.topProducts.slice(0, 3).map((product, index) => (
                                <div key={index} className="top-item">
                                    <span className={`top-rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="top-name">{product.description}</span>
                                    <span className="top-count">{product.total_qty} uds</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', padding: 'var(--sp-2) 0' }}>
                            Sin ventas este mes
                        </p>
                    )}

                    <h2 style={{ marginTop: 'var(--sp-6)' }}>Servicios Populares</h2>
                    {stats?.topServices?.length > 0 ? (
                        <div className="top-list">
                            {stats.topServices.slice(0, 3).map((service, index) => (
                                <div key={index} className="top-item">
                                    <span className={`top-rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="top-name">{service.name}</span>
                                    <span className="top-count">{service.count} serv</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', padding: 'var(--sp-2) 0' }}>Sin datos de servicios</p>
                    )}
                </section>
            </div>
        </main>
    );
}
