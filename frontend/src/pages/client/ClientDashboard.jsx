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
    ChevronRight,
    Clock,
    Activity,
    Shield
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

const getProgressPercent = (status) => {
    const steps = ['received', 'diagnosing', 'waiting_approval', 'waiting_parts', 'repairing', 'quality_check', 'ready', 'delivered'];
    const index = steps.indexOf(status);
    if (index === -1) return 0;
    if (status === 'cancelled') return 0;
    return Math.round(((index + 1) / steps.length) * 100);
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
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchRepairs();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchRepairs = async () => {
        try {
            const allData = await repairService.getAll({ limit: 200 });
            const all = allData.repairs || [];

            const active = all.filter(r => !['delivered', 'cancelled'].includes(r.status)).length;
            const completed = all.filter(r => r.status === 'delivered').length;

            setRepairs(all.slice(0, 5));
            setStats({ active, completed, total: all.length });
        } catch (error) {
            console.error('Error al cargar reparaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando tu panel...</p>
            </div>
        );
    }

    return (
        <main className="dashboard-main animate-fadeIn">
            {/* Welcome Banner */}
            <div className="welcome-banner">
                <div className="welcome-content">
                    <span className="welcome-time">
                        <Clock size={14} />
                        {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h1>¡{getGreeting()}, {user?.first_name}!</h1>
                    <p>Sigue de cerca el estado de tus dispositivos y solicita nuevas cotizaciones al instante.</p>
                </div>
                <div className="welcome-actions">
                    <Link to="/dashboard/nueva-cotizacion" className="btn btn-primary">
                        <FileText size={18} />
                        Nueva Cotización
                    </Link>
                </div>
            </div>

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
                        <span className="stat-label">Dispositivos Entregados</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon total">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Historial Total</span>
                    </div>
                </div>
            </div>

            {/* Content Split */}
            <div className="dashboard-split-layout">
                {/* Recent Repairs */}
                <section className="dashboard-section main-col">
                    <div className="section-header">
                        <h2>Dispositivos en Proceso</h2>
                        <Link to="/dashboard/reparaciones" className="btn btn-ghost btn-sm">
                            Ver todo <ChevronRight size={16} />
                        </Link>
                    </div>

                    {repairs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Smartphone size={48} />
                            </div>
                            <h3>No tienes reparaciones activas</h3>
                            <p>Solicita una cotización gratuita para comenzar a reparar tu dispositivo.</p>
                            <Link to="/dashboard/nueva-cotizacion" className="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }}>
                                Solicitar Cotización
                            </Link>
                        </div>
                    ) : (
                        <div className="repairs-list">
                            {repairs.map((repair) => {
                                const progress = getProgressPercent(repair.status);
                                return (
                                    <div key={repair.id} className="repair-card-premium">
                                        <div className="card-top">
                                            <div className="device-brand-info">
                                                <Smartphone className="device-type-icon text-primary" size={20} />
                                                <div>
                                                    <h3>{repair.device_type_name} {repair.brand_name || repair.brand_other}</h3>
                                                    <span className="model-name">{repair.model}</span>
                                                </div>
                                            </div>
                                            <span className={`status-badge status-${repair.status}`}>
                                                {statusLabels[repair.status]}
                                            </span>
                                        </div>
                                        
                                        <div className="card-progress-section">
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <div className="progress-labels">
                                                <span>Recibido</span>
                                                <span>Progreso: {progress}%</span>
                                                <span>Listo</span>
                                            </div>
                                        </div>

                                        <div className="card-footer-info">
                                            <span className="ticket-code">Ticket: <strong>{repair.ticket_number}</strong></span>
                                            <Link to={`/dashboard/reparaciones/${repair.id}`} className="btn btn-secondary btn-sm">
                                                Ver Detalle
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Quick Actions Column */}
                <section className="dashboard-section sidebar-col">
                    <h2>Acciones Rápidas</h2>
                    <div className="quick-actions-list">
                        <Link to="/dashboard/nueva-cotizacion" className="quick-action-item">
                            <div className="action-item-icon">
                                <FileText size={20} />
                            </div>
                            <div className="action-item-text">
                                <h4>Solicitar Reparación</h4>
                                <p>Ingresa los detalles de tu dispositivo</p>
                            </div>
                            <ChevronRight size={16} className="chevron" />
                        </Link>

                        <Link to="/dashboard/reparaciones" className="quick-action-item">
                            <div className="action-item-icon">
                                <Activity size={20} />
                            </div>
                            <div className="action-item-text">
                                <h4>Ver Mis Dispositivos</h4>
                                <p>Rastrea el progreso en tiempo real</p>
                            </div>
                            <ChevronRight size={16} className="chevron" />
                        </Link>

                        <Link to="/dashboard/perfil" className="quick-action-item">
                            <div className="action-item-icon">
                                <User size={20} />
                            </div>
                            <div className="action-item-text">
                                <h4>Editar Mi Perfil</h4>
                                <p>Actualiza tu dirección y contraseña</p>
                            </div>
                            <ChevronRight size={16} className="chevron" />
                        </Link>
                    </div>

                    <div className="security-info-box" style={{ marginTop: 'var(--sp-6)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)', display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-start' }}>
                        <Shield size={24} className="text-primary" style={{ flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Servicio Garantizado</h4>
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                Todas nuestras reparaciones cuentan con garantía extendida registrada automáticamente en tu perfil.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
