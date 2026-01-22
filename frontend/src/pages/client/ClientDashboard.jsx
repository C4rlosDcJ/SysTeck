import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repairService } from '../../services/api';
import {
    Smartphone,
    CheckCircle,
    ClipboardList,
    FileText,
    User,
    ChevronRight
} from 'lucide-react';
import './ClientDashboard.css';

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

export default function ClientDashboard() {
    const { user } = useAuth();
    const [repairs, setRepairs] = useState([]);
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRepairs();
    }, []);

    const fetchRepairs = async () => {
        try {
            const data = await repairService.getAll({ limit: 5 });
            setRepairs(data.repairs || []);

            // Calcular estadísticas
            const allRepairs = await repairService.getAll({ limit: 100 });
            const active = allRepairs.repairs?.filter(r =>
                !['delivered', 'cancelled'].includes(r.status)
            ).length || 0;
            const completed = allRepairs.repairs?.filter(r =>
                r.status === 'delivered'
            ).length || 0;

            setStats({
                active,
                completed,
                total: allRepairs.repairs?.length || 0
            });
        } catch (error) {
            console.error('Error al cargar reparaciones:', error);
        } finally {
            setLoading(false);
        }
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
                    <h1>¡Hola, {user?.first_name}!</h1>
                    <p className="text-muted">Bienvenido a tu panel de control</p>
                </div>
                <Link to="/dashboard/nueva-cotizacion" className="btn btn-primary">
                    <FileText size={18} />
                    Nueva Cotización
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon active">
                        <Smartphone size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.active}</span>
                        <span className="stat-label">Reparaciones Activas</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon completed">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-label">Completadas</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon total">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Histórico</span>
                    </div>
                </div>
            </div>

            {/* Recent Repairs */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2>Mis Reparaciones Recientes</h2>
                    <Link to="/dashboard/reparaciones" className="btn btn-ghost btn-sm">
                        Ver todas <ChevronRight size={16} />
                    </Link>
                </div>

                {repairs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Smartphone size={48} />
                        </div>
                        <h3>No tienes reparaciones aún</h3>
                        <p>Solicita una cotización para comenzar</p>
                        <Link to="/dashboard/nueva-cotizacion" className="btn btn-primary">
                            Solicitar Cotización
                        </Link>
                    </div>
                ) : (
                    <div className="repairs-list">
                        {repairs.map((repair) => (
                            <div key={repair.id} className="repair-card">
                                <div className="repair-info">
                                    <div className="repair-header">
                                        <span className="ticket-number">{repair.ticket_number}</span>
                                        <span className={`status-badge status-${repair.status}`}>
                                            {statusLabels[repair.status]}
                                        </span>
                                    </div>
                                    <h3>{repair.device_type_name} - {repair.brand_name || repair.brand_other}</h3>
                                    <p className="repair-model">{repair.model}</p>
                                    <p className="repair-date">
                                        Creado: {new Date(repair.created_at).toLocaleDateString('es-MX')}
                                    </p>
                                </div>
                                <Link to={`/dashboard/reparaciones/${repair.id}`} className="btn btn-secondary btn-sm">
                                    Ver Detalle
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <section className="dashboard-section">
                <h2>Acciones Rápidas</h2>
                <div className="quick-actions">
                    <Link to="/dashboard/nueva-cotizacion" className="action-card">
                        <span className="action-icon">
                            <FileText size={28} />
                        </span>
                        <span>Nueva Cotización</span>
                    </Link>
                    <Link to="/dashboard/reparaciones" className="action-card">
                        <span className="action-icon">
                            <ClipboardList size={28} />
                        </span>
                        <span>Mis Reparaciones</span>
                    </Link>
                    <Link to="/dashboard/perfil" className="action-card">
                        <span className="action-icon">
                            <User size={28} />
                        </span>
                        <span>Mi Perfil</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}
