import { useState, useEffect } from 'react';
import { servicesCatalog } from '../../services/api';
import {
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    DollarSign,
    Search,
    Smartphone,
    Trophy,
    Wrench,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import './AdminServices.css';

export default function AdminServices() {
    // State
    const [activeTab, setActiveTab] = useState('services'); // 'services', 'types', 'brands'
    const [services, setServices] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'services') {
                const [sData, tData] = await Promise.all([
                    servicesCatalog.getAll(),
                    servicesCatalog.getDeviceTypes()
                ]);
                setServices(sData || []);
                setDeviceTypes(tData || []);
            } else if (activeTab === 'types') {
                const data = await servicesCatalog.getDeviceTypes({ all: true });
                setDeviceTypes(data || []);
            } else if (activeTab === 'brands') {
                const data = await servicesCatalog.getBrands({ all: true });
                setBrands(data || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item = null) => {
        setEditingItem(item);
        if (activeTab === 'services') {
            setFormData(item ? { ...item } : {
                name: '',
                description: '',
                device_type_id: '',
                base_price: '',
                estimated_time: '',
                is_active: true
            });
        } else {
            setFormData(item ? { ...item } : {
                name: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'services') {
                if (editingItem) await servicesCatalog.update(editingItem.id, formData);
                else await servicesCatalog.create(formData);
            } else if (activeTab === 'types') {
                if (editingItem) await servicesCatalog.updateDeviceType(editingItem.id, formData);
                else await servicesCatalog.createDeviceType(formData);
            } else if (activeTab === 'brands') {
                if (editingItem) await servicesCatalog.updateBrand(editingItem.id, formData);
                else await servicesCatalog.createBrand(formData);
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error('Error al guardar:', error);
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
        try {
            if (activeTab === 'services') await servicesCatalog.delete(id);
            else if (activeTab === 'types') await servicesCatalog.deleteDeviceType(id);
            else if (activeTab === 'brands') await servicesCatalog.deleteBrand(id);
            fetchData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert(error.message);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesType = !filterType || s.device_type_id === parseInt(filterType);
        return matchesSearch && matchesType;
    });

    const filteredTypes = deviceTypes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-services-container">
            <header className="page-header">
                <div>
                    <h1>Configuración de Catálogos</h1>
                    <p className="text-muted">Administra servicios, equipos y marcas</p>
                </div>
                <div className="header-actions">
                    <button onClick={fetchData} className="btn btn-secondary">
                        <RefreshCw size={18} /> <span className="hide-on-mobile">Actualizar</span>
                    </button>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <Plus size={18} /> Nuevo <span className="hide-on-mobile">{activeTab === 'services' ? 'Servicio' : activeTab === 'types' ? 'Tipo' : 'Marca'}</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('services'); setSearchTerm(''); }}
                >
                    <Wrench size={18} /> Servicios
                </button>
                <button
                    className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('types'); setSearchTerm(''); }}
                >
                    <Smartphone size={18} /> Tipos de Equipo
                </button>
                <button
                    className={`tab-btn ${activeTab === 'brands' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('brands'); setSearchTerm(''); }}
                >
                    <Trophy size={18} /> Marcas
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={`Buscar ${activeTab === 'services' ? 'servicios' : activeTab === 'types' ? 'tipos' : 'marcas'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                    />
                </div>
                {activeTab === 'services' && (
                    <select
                        className="select filter-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">Todos los tipos</option>
                        {deviceTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Content */}
            <div className="catalog-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando datos...</p>
                    </div>
                ) : (activeTab === 'services' && filteredServices.length === 0) ||
                    (activeTab === 'types' && filteredTypes.length === 0) ||
                    (activeTab === 'brands' && filteredBrands.length === 0) ? (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>No se encontraron resultados</h3>
                        <p>Intenta ajustar tus filtros o búsqueda</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                {activeTab === 'services' ? (
                                    <tr>
                                        <th>Servicio</th>
                                        <th>Tipo</th>
                                        <th>Precio</th>
                                        <th>Estimado</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'services' && filteredServices.map(item => (
                                    <tr key={item.id} className={!item.is_active ? 'inactive-row' : ''}>
                                        <td>
                                            <div className="service-info">
                                                <span className="bold">{item.name}</span>
                                                <span className="text-muted text-xs">{item.description}</span>
                                            </div>
                                        </td>
                                        <td>{deviceTypes.find(t => t.id === item.device_type_id)?.name || 'General'}</td>
                                        <td className="text-success bold">{servicesCatalog.formatCurrency(item.base_price)}</td>
                                        <td>{item.estimated_time || '-'}</td>
                                        <td>
                                            <span className={`status-pill ${item.is_active ? 'active' : 'inactive'}`}>
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button onClick={() => openModal(item)} className="btn btn-icon btn-ghost"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-icon btn-ghost btn-danger"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(activeTab === 'types' ? filteredTypes : filteredBrands).map(item => (
                                    <tr key={item.id} className={!item.is_active ? 'inactive-row' : ''}>
                                        <td className="bold">{item.name}</td>
                                        <td>
                                            <span className={`status-pill ${item.is_active ? 'active' : 'inactive'}`}>
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button onClick={() => openModal(item)} className="btn btn-icon btn-ghost"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-icon btn-ghost btn-danger"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'services' ? 'Servicio' : activeTab === 'types' ? 'Tipo' : 'Marca'}</h3>
                            <button onClick={closeModal} className="btn-icon"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="form">
                            <div className="input-group">
                                <label>Nombre *</label>
                                <input type="text" name="name" className="input" value={formData.name || ''} onChange={handleChange} required />
                            </div>
                            {activeTab === 'services' && (
                                <>
                                    <div className="input-group">
                                        <label>Descripción</label>
                                        <textarea name="description" className="input" rows="2" value={formData.description || ''} onChange={handleChange}></textarea>
                                    </div>
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Tipo de Equipo</label>
                                            <select name="device_type_id" className="select" value={formData.device_type_id || ''} onChange={handleChange}>
                                                <option value="">General (Todos)</option>
                                                {deviceTypes.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Precio Base ($)</label>
                                            <input type="number" name="base_price" className="input" value={formData.base_price || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Tiempo Estimado</label>
                                        <input type="text" name="estimated_time" className="input" placeholder="Ej: 1 hr, 2 días..." value={formData.estimated_time || ''} onChange={handleChange} />
                                    </div>
                                </>
                            )}
                            <label className="checkbox-label mt-md">
                                <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleChange} />
                                <span>Elemento Activo</span>
                            </label>
                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary"><Save size={18} /> Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
