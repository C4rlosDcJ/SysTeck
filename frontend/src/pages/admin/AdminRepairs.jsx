import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repairService } from '../../services/api';
import {
    Search,
    Filter,
    RefreshCw,
    ChevronRight,
    Wrench,
    Download,
    Eye
} from 'lucide-react';
import './AdminRepairs.css';

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

export default function AdminRepairs() {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchRepairs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page, searchTerm]);

    const fetchRepairs = async () => {
        setLoading(true);
        try {
            const params = { limit: 20, page };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;

            const data = await repairService.getAll(params);
            setRepairs(data.repairs || []);
            setTotalPages(Math.ceil((data.total || 0) / 20));
        } catch (error) {
            console.error('Error al cargar reparaciones:', error);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="admin-repairs-container">
            <header className="page-header">
                <div>
                    <h1>Gestión de Reparaciones</h1>
                    <p className="text-muted">Administra todas las órdenes de reparación</p>
                </div>
                <div className="header-actions">
                    <button onClick={fetchRepairs} className="btn btn-secondary">
                        <RefreshCw size={18} />
                        <span className="hide-on-mobile">Actualizar</span>
                    </button>
                    <Link to="/admin/nueva-reparacion" className="btn btn-primary">
                        <Wrench size={18} />
                        <span className="hide-on-mobile">Nueva Reparación</span>
                    </Link>
                </div>
            </header>

            {/* Filtros */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por ticket, cliente, modelo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="select"
                    >
                        <option value="all">Todos los estados</option>
                        {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla de reparaciones */}
            <div className="repairs-table-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando reparaciones...</p>
                    </div>
                ) : repairs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Wrench size={48} />
                        </div>
                        <h3>No se encontraron reparaciones</h3>
                        <p>Intenta con otros filtros o crea una nueva reparación</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table repairs-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Cliente</th>
                                        <th>Dispositivo</th>
                                        <th>Modelo</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                        <th>Fecha</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repairs.map((repair) => (
                                        <tr key={repair.id}>
                                            <td>
                                                <span className="ticket-number">{repair.ticket_number}</span>
                                            </td>
                                            <td>
                                                <div className="client-info">
                                                    <span className="client-name">{repair.first_name} {repair.last_name}</span>
                                                    <span className="client-email">{repair.email}</span>
                                                </div>
                                            </td>
                                            <td>{repair.device_type_name}</td>
                                            <td>{repair.model}</td>
                                            <td>
                                                <span className={`status-badge status-${repair.status}`}>
                                                    {statusLabels[repair.status]}
                                                </span>
                                            </td>
                                            <td className="cost-cell">{formatCurrency(repair.total_cost)}</td>
                                            <td className="date-cell">{formatDate(repair.created_at)}</td>
                                            <td>
                                                <Link
                                                    to={`/admin/reparaciones/${repair.id}`}
                                                    className="btn btn-icon btn-ghost"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Anterior
                                </button>
                                <span className="page-info">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
