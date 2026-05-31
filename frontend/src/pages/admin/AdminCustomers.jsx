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
    Plus,
    Edit2,
    X,
    Filter,
    ArrowUpDown,
    Check,
    Copy,
    AlertCircle
} from 'lucide-react';
import './AdminCustomers.css';

export default function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Advanced Filtering and Sorting States
    const [sortBy, setSortBy] = useState('recent'); // 'recent', 'repairs_desc', 'name_asc'
    const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    // Temp Password for created customer
    const [tempPassword, setTempPassword] = useState('');
    const [copied, setCopied] = useState(false);

    // Form Data States
    const [newCustomer, setNewCustomer] = useState({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: ''
    });
    const [editingCustomer, setEditingCustomer] = useState(null);

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = { limit: 100, page }; // Load a larger limit to sort and filter easily
            if (searchTerm) params.search = searchTerm;

            const data = await customerService.getAll(params);
            setCustomers(data.customers || []);
            setTotalPages(data.pagination?.totalPages || 1);
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

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError('');
        try {
            const response = await customerService.create(newCustomer);
            setTempPassword(response.customer?.temp_password || '');
            setNewCustomer({
                email: '',
                first_name: '',
                last_name: '',
                phone: '',
                address: ''
            });
            fetchCustomers();
        } catch (err) {
            setModalError(err.message || 'Error al registrar cliente');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditCustomer = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError('');
        try {
            await customerService.update(editingCustomer.id, {
                first_name: editingCustomer.first_name,
                last_name: editingCustomer.last_name,
                phone: editingCustomer.phone,
                address: editingCustomer.address
            });
            setShowEditModal(false);
            setEditingCustomer(null);
            fetchCustomers();
        } catch (err) {
            setModalError(err.message || 'Error al actualizar cliente');
        } finally {
            setModalLoading(false);
        }
    };

    const openEditModal = (customer) => {
        setEditingCustomer({
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone || '',
            address: customer.address || ''
        });
        setModalError('');
        setShowEditModal(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Apply Sorting and Filtering locally on customers
    const filteredCustomers = customers
        .filter((customer) => {
            const hasActive = parseInt(customer.active_repairs || 0) > 0;
            if (filterActive === 'active') return hasActive;
            if (filterActive === 'inactive') return !hasActive;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'repairs_desc') {
                return (b.total_repairs || 0) - (a.total_repairs || 0);
            }
            if (sortBy === 'name_asc') {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            }
            // default 'recent'
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <div className="admin-customers-container">
            <header className="page-header">
                <div>
                    <h1>Gestión de Clientes</h1>
                    <p className="text-muted">Administra y registra la información de clientes</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => { setTempPassword(''); setShowAddModal(true); }} className="btn btn-primary">
                        <Plus size={16} />
                        <span>Nuevo Cliente</span>
                    </button>
                    <button onClick={fetchCustomers} className="btn btn-secondary">
                        <RefreshCw size={16} />
                        <span className="hide-on-mobile">Actualizar</span>
                    </button>
                </div>
            </header>

            {/* Búsqueda y Filtros */}
            <div className="filters-bar-container">
                <form onSubmit={handleSearch} className="filters-search-row">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">
                        Buscar
                    </button>
                </form>

                <div className="filters-select-row">
                    <div className="filter-item">
                        <Filter size={14} className="filter-icon" />
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="select select-sm"
                        >
                            <option value="all">Todas las reparaciones</option>
                            <option value="active">Con reparaciones activas</option>
                            <option value="inactive">Sin reparaciones activas</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <ArrowUpDown size={14} className="filter-icon" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="select select-sm"
                        >
                            <option value="recent">Más recientes</option>
                            <option value="repairs_desc">Más reparaciones</option>
                            <option value="name_asc">Nombre (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid de clientes */}
            <div className="customers-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando clientes...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Users size={48} />
                        </div>
                        <h3>No se encontraron clientes</h3>
                        <p>Intenta cambiar los términos de búsqueda o filtros.</p>
                    </div>
                ) : (
                    <>
                        <div className="customers-grid">
                            {filteredCustomers.map((customer) => (
                                <div key={customer.id} className="customer-card">
                                    <div className="customer-card-header">
                                        <div className="customer-avatar">
                                            {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                                        </div>
                                        <div className="customer-card-actions">
                                            <button 
                                                onClick={() => openEditModal(customer)} 
                                                className="btn btn-ghost btn-sm icon-btn"
                                                title="Editar cliente"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
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
                                            {parseInt(customer.active_repairs || 0) > 0 && (
                                                <span className="badge badge-warning active-badge">
                                                    {customer.active_repairs} activas
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="customer-card-footer">
                                        <span className="member-since text-muted">
                                            Desde {formatDate(customer.created_at)}
                                        </span>
                                        <Link
                                            to={`/admin/clientes/${customer.id}`}
                                            className="btn btn-ghost btn-sm"
                                        >
                                            <Eye size={16} />
                                            Ver Historial
                                        </Link>
                                    </div>
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

            {/* MODAL: Registrar Cliente */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Registrar Nuevo Cliente</h2>
                            <button onClick={() => setShowAddModal(false)} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {tempPassword ? (
                            <div className="temp-password-alert">
                                <div className="alert-header">
                                    <Check className="success-icon" size={24} />
                                    <h3>¡Cliente Registrado con Éxito!</h3>
                                </div>
                                <p>Se ha generado una contraseña temporal para que el cliente inicie sesión:</p>
                                <div className="password-display">
                                    <code>{tempPassword}</code>
                                    <button 
                                        onClick={() => copyToClipboard(tempPassword)} 
                                        className="btn btn-ghost btn-sm copy-btn"
                                    >
                                        {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                </div>
                                <div className="alert-footer">
                                    <p className="note"><AlertCircle size={14} /> Guarda la contraseña ahora. No se volverá a mostrar.</p>
                                    <button onClick={() => { setShowAddModal(false); setTempPassword(''); }} className="btn btn-primary">
                                        Entendido
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleAddCustomer} className="modal-form">
                                {modalError && <div className="error-alert">{modalError}</div>}
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                            className="input"
                                            placeholder="ejemplo@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Nombre</label>
                                            <input
                                                type="text"
                                                value={newCustomer.first_name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                                                className="input"
                                                placeholder="Juan"
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Apellido</label>
                                            <input
                                                type="text"
                                                value={newCustomer.last_name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                                                className="input"
                                                placeholder="Pérez"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            className="input"
                                            placeholder="(123) 456-7890"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Dirección</label>
                                        <input
                                            type="text"
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                            className="input"
                                            placeholder="Calle, Número, Ciudad"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" disabled={modalLoading}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                                        {modalLoading ? 'Registrando...' : 'Registrar Cliente'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: Editar Cliente */}
            {showEditModal && editingCustomer && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Editar Cliente</h2>
                            <button onClick={() => setShowEditModal(false)} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditCustomer} className="modal-form">
                            {modalError && <div className="error-alert">{modalError}</div>}
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Correo Electrónico (No modificable)</label>
                                    <input
                                        type="email"
                                        value={editingCustomer.email}
                                        className="input"
                                        disabled
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={editingCustomer.first_name}
                                            onChange={(e) => setEditingCustomer({ ...editingCustomer, first_name: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Apellido</label>
                                        <input
                                            type="text"
                                            value={editingCustomer.last_name}
                                            onChange={(e) => setEditingCustomer({ ...editingCustomer, last_name: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="tel"
                                        value={editingCustomer.phone}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        value={editingCustomer.address}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" disabled={modalLoading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                                    {modalLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
