import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../../services/api';
import {
    DollarSign,
    Wrench,
    Users,
    TrendingUp,
    PlusCircle,
    ClipboardList,
    FileSpreadsheet,
    ChevronRight
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

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await statsService.getDashboard();
            setStats(data);
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
                <Link to="/admin/nueva-reparacion" className="btn btn-primary">
                    <PlusCircle size={18} />
                    Nueva Reparación
                </Link>
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

                {/* Servicios populares */}
                <section className="dashboard-section flex-1">
                    <h2>Servicios Populares</h2>
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
