import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/api';
import {
    Search,
    RefreshCw,
    Users,
    Mail,
    Phone,
    Eye,
    UserPlus
} from 'lucide-react';
import './AdminCustomers.css';

export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = { limit: 20, page };
            if (searchTerm) params.search = searchTerm;

            const data = await customerService.getAll(params);
            setCustomers(data.customers || []);
            setTotalPages(Math.ceil((data.total || 0) / 20));
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCustomers();
    };


    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="admin-customers-container">
            <header className="page-header">
                <div>
                    <h1>Gestión de Clientes</h1>
                    <p className="text-muted">Administra la información de clientes</p>
                </div>
                <div className="header-actions">
                    <button onClick={fetchCustomers} className="btn btn-secondary">
                        <RefreshCw size={18} />
                        <span className="hide-on-mobile">Actualizar</span>
                    </button>
                    <Link to="/admin/clientes/nuevo" className="btn btn-primary">
                        <UserPlus size={18} />
                        <span className="hide-on-mobile">Nuevo Cliente</span>
                    </Link>
                </div>
            </header>

            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                    />
                </div>
                <button type="submit" className="btn btn-secondary">
                    Buscar
                </button>
            </form>

            {/* Grid de clientes */}
            <div className="customers-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando clientes...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Users size={48} />
                        </div>
                        <h3>No se encontraron clientes</h3>
                        <p>Intenta con otros términos de búsqueda</p>
                    </div>
                ) : (
                    <>
                        <div className="customers-grid">
                            {customers.map((customer) => (
                                <div key={customer.id} className="customer-card">
                                    <div className="customer-avatar">
                                        {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                                    </div>
                                    <div className="customer-info">
                                        <h3>{customer.first_name} {customer.last_name}</h3>
                                        <div className="customer-contact">
                                            <span className="contact-item">
                                                <Mail size={14} />
                                                {customer.email}
                                            </span>
                                            {customer.phone && (
                                                <span className="contact-item">
                                                    <Phone size={14} />
                                                    {customer.phone}
                                                </span>
                                            )}
                                        </div>
                                        <div className="customer-stats">
                                            <span className="stat">
                                                <strong>{customer.total_repairs || 0}</strong> reparaciones
                                            </span>
                                            <span className="stat">
                                                Desde {formatDate(customer.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/admin/clientes/${customer.id}`}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        <Eye size={16} />
                                        Ver
                                    </Link>
                                </div>
                            ))}
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
        </div >
    );
}
