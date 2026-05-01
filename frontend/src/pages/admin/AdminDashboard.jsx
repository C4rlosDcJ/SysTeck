import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService, posService, inventoryService } from '../../services/api';
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
    Receipt
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

const PAYMENT_LABELS = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
};

const PAYMENT_ICONS = {
    cash: Banknote,
    card: CreditCard,
    transfer: ArrowRightLeft
};

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [salesStats, setSalesStats] = useState(null);
    const [inventoryStats, setInventoryStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <main className="dashboard-main">
            <header className="dashboard-header">
                <div>
                    <h1>Panel de Administración</h1>
                    <p className="text-muted">Resumen general del negocio</p>
                </div>
                <div className="header-actions">
                    <Link to="/admin/pos" className="btn btn-outline" id="btn-goto-pos">
                        <ShoppingCart size={16} /> POS
                    </Link>
                    <Link to="/admin/nueva-reparacion" className="btn btn-primary">
                        <PlusCircle size={18} /> Nueva Reparación
                    </Link>
                </div>
            </header>

            {/* KPIs principales */}
            <div className="kpi-grid">
                <div className="kpi-card revenue">
                    <div className="kpi-icon">
                        <DollarSign size={28} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ingresos del Mes</span>
                        <span className="kpi-value">{formatCurrency(stats?.thisMonth?.revenue)}</span>
                        <span className="kpi-change positive">
                            {stats?.thisMonth?.repairs} reparaciones
                        </span>
                    </div>
                </div>
                <div className="kpi-card active">
                    <div className="kpi-icon">
                        <Wrench size={28} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">En Proceso</span>
                        <span className="kpi-value">{stats?.inProgress || 0}</span>
                        <span className="kpi-change">Reparaciones activas</span>
                    </div>
                </div>
                <div className="kpi-card customers">
                    <div className="kpi-icon">
                        <Users size={28} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Clientes</span>
                        <span className="kpi-value">{stats?.totalCustomers || 0}</span>
                        <span className="kpi-change">Registrados</span>
                    </div>
                </div>
                <div className="kpi-card last-month">
                    <div className="kpi-icon">
                        <TrendingUp size={28} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Mes Anterior</span>
                        <span className="kpi-value">{formatCurrency(stats?.lastMonth?.revenue)}</span>
                        <span className="kpi-change">{stats?.lastMonth?.repairs} reparaciones</span>
                    </div>
                </div>
            </div>

            {/* ═══ POS & Inventory Quick Stats ═══ */}
            <div className="kpi-grid" style={{ marginTop: 'var(--sp-3)' }}>
                <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-success)' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                        <ShoppingCart size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ventas Hoy</span>
                        <span className="kpi-value">{formatCurrency(salesStats?.today?.total || 0)}</span>
                        <span className="kpi-change positive">{salesStats?.today?.count || 0} ventas</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '3px solid #818cf8' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        <Receipt size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ventas del Mes</span>
                        <span className="kpi-value">{formatCurrency(salesStats?.month?.total || 0)}</span>
                        <span className="kpi-change">{salesStats?.month?.count || 0} ventas POS</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '3px solid #6366f1' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                        <Package size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-label">Productos</span>
                        <span className="kpi-value">{inventoryStats?.totalProducts || 0}</span>
                        <span className="kpi-change">En catálogo activo</span>
                    </div>
                </div>
                {(inventoryStats?.lowStockCount > 0) ? (
                    <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-warning)' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Bajo Stock</span>
                            <span className="kpi-value" style={{ color: 'var(--color-warning)' }}>
                                {inventoryStats.lowStockCount}
                            </span>
                            <span className="kpi-change">
                                <Link to="/admin/inventario" style={{ color: 'var(--color-warning)' }}>
                                    Ver productos →
                                </Link>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-success)' }}>
                        <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                            <Package size={24} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Inventario</span>
                            <span className="kpi-value" style={{ color: 'var(--color-success)' }}>OK</span>
                            <span className="kpi-change">Stock saludable</span>
                        </div>
                    </div>
                )}
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

            <div className="dashboard-row">
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
                        <p className="text-muted text-center">No hay reparaciones recientes</p>
                    )}
                </section>

                {/* Productos más vendidos + Servicios Populares */}
                <section className="dashboard-section flex-1">
                    <h2>Más Vendidos (Mes)</h2>
                    {salesStats?.topProducts?.length > 0 ? (
                        <div className="top-list">
                            {salesStats.topProducts.slice(0, 5).map((product, index) => (
                                <div key={index} className="top-item">
                                    <span className="top-rank">{index + 1}</span>
                                    <span className="top-name">{product.description}</span>
                                    <span className="top-count">{product.total_qty}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', padding: 'var(--sp-4) 0' }}>
                            Sin ventas este mes
                        </p>
                    )}

                    <h2 style={{ marginTop: 'var(--sp-4)' }}>Servicios Populares</h2>
                    {stats?.topServices?.length > 0 ? (
                        <div className="top-list">
                            {stats.topServices.map((service, index) => (
                                <div key={index} className="top-item">
                                    <span className="top-rank">{index + 1}</span>
                                    <span className="top-name">{service.name}</span>
                                    <span className="top-count">{service.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">Sin datos</p>
                    )}
                </section>
            </div>

        </main>
    );
}
