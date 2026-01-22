import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repairService } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
    Search,
    Filter,
    ChevronRight,
    Smartphone,
    RefreshCw
} from 'lucide-react';
import './RepairsListPage.css';

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

export default function RepairsListPage() {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchRepairs();
    }, []);

    const fetchRepairs = async () => {
        setLoading(true);
        try {
            const data = await repairService.getAll({ limit: 100 });
            setRepairs(data.repairs || []);
        } catch (error) {
            console.error('Error al cargar reparaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRepairs = repairs.filter(repair => {
        const matchesSearch =
            repair.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            repair.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            repair.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="page-header">
                    <div>
                        <h1>Mis Reparaciones</h1>
                        <p className="text-muted">Historial y seguimiento de tus dispositivos</p>
                    </div>
                    <button onClick={fetchRepairs} className="btn btn-secondary">
                        <RefreshCw size={18} />
                        Actualizar
                    </button>
                </header>

                {/* Filtros */}
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por ticket, modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="select"
                        >
                            <option value="all">Todos los estados</option>
                            {Object.entries(statusLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lista de reparaciones */}
                <div className="repairs-container">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando reparaciones...</p>
                        </div>
                    ) : filteredRepairs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Smartphone size={48} />
                            </div>
                            <h3>No se encontraron reparaciones</h3>
                            <p>{searchTerm || statusFilter !== 'all' ? 'Intenta con otros filtros' : 'Aún no tienes reparaciones registradas'}</p>
                        </div>
                    ) : (
                        <div className="repairs-grid">
                            {filteredRepairs.map((repair) => (
                                <div key={repair.id} className="repair-card-full">
                                    <div className="card-header">
                                        <span className="ticket-number">{repair.ticket_number}</span>
                                        <span className={`status-badge status-${repair.status}`}>
                                            {statusLabels[repair.status]}
                                        </span>
                                    </div>
                                    <div className="card-body">
                                        <h3>{repair.device_type_name}</h3>
                                        <p className="device-info">
                                            {repair.brand_name || repair.brand_other} - {repair.model}
                                        </p>
                                        {repair.problem_description && (
                                            <p className="problem-excerpt">
                                                {repair.problem_description.substring(0, 100)}
                                                {repair.problem_description.length > 100 ? '...' : ''}
                                            </p>
                                        )}
                                        <div className="card-meta">
                                            <span className="meta-date">
                                                {new Date(repair.created_at).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            {repair.total_cost > 0 && (
                                                <span className="meta-cost">
                                                    ${repair.total_cost.toLocaleString('es-MX')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/dashboard/reparaciones/${repair.id}`} className="card-action">
                                        Ver detalle <ChevronRight size={16} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
