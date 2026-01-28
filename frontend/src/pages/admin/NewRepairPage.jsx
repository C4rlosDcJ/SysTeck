import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    customerService,
    repairService,
    servicesCatalog,
    settingsService,
    userService
} from '../../services/api';
import {
    Save,
    X,
    User,
    Smartphone,
    Wrench,
    ClipboardCheck,
    DollarSign,
    Calendar,
    Search,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import './NewRepairPage.css';

export default function NewRepairPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [services, setServices] = useState([]);
    const [technicians, setTechnicians] = useState([]);

    // Search states
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchingCustomers, setSearchingCustomers] = useState(false);

    // Selection states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [_selectedService, setSelectedService] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        customer_id: '',
        device_type_id: '',
        brand_id: '',
        brand_other: '',
        model: '',
        color: '',
        storage_capacity: '',
        serial_number: '',
        imei: '',
        device_password: '',
        accessories_received: '',
        physical_condition: 5,
        existing_damage: '',
        problem_description: '',
        service_id: '',
        service_requested: '',
        priority: 'normal',
        estimated_delivery: '',
        diagnosis_cost: 0,
        labor_cost: 0,
        parts_cost: 0,
        discount: 0,
        advance_payment: 0,
        warranty_days: 30,
        technician_id: '',
        battery_health: '',
        screen_status: '',
        account_status: '',
        technical_observations: '',
        function_checklist: {
            power: true,
            display: true,
            touch: true,
            cameras: true,
            audio: true,
            wifi: true,
            charging: true,
            buttons: true
        }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [types, brandsData, settings, staff] = await Promise.all([
                servicesCatalog.getDeviceTypes(),
                servicesCatalog.getBrands(),
                settingsService.get(),
                userService.getTechnicians()
            ]);
            setDeviceTypes(types || []);
            setBrands(brandsData || []);
            setTechnicians(staff || []);

            const defWarranty = settings?.default_warranty_days;
            if (defWarranty) {
                setFormData(prev => ({ ...prev, warranty_days: parseInt(defWarranty) }));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleCustomerSearch = async (e) => {
        const value = e.target.value;
        setCustomerSearch(value);
        if (value.length < 3) {
            setCustomers([]);
            return;
        }

        try {
            setSearchingCustomers(true);
            const data = await customerService.getAll({ search: value, limit: 10 });
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setSearchingCustomers(false);
        }
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setFormData(prev => ({ ...prev, customer_id: customer.id }));
        setCustomerSearch('');
        setCustomers([]);
    };

    const handleDeviceTypeChange = async (e) => {
        const typeId = e.target.value;
        setFormData(prev => ({ ...prev, device_type_id: typeId, service_id: '' }));
        setSelectedService(null);

        if (typeId) {
            try {
                const data = await servicesCatalog.getAll();
                const filtered = data.filter(s => !s.device_type_id || s.device_type_id === parseInt(typeId));
                setServices(filtered);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        } else {
            setServices([]);
        }
    };

    const handleServiceChange = (e) => {
        const serviceId = e.target.value;
        const service = services.find(s => s.id === parseInt(serviceId));
        setSelectedService(service);

        setFormData(prev => ({
            ...prev,
            service_id: serviceId,
            service_requested: service?.name || '',
            labor_cost: service?.base_price || 0
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name.startsWith('check_')) {
            const checkKey = name.replace('check_', '');
            setFormData(prev => ({
                ...prev,
                function_checklist: {
                    ...prev.function_checklist,
                    [checkKey]: checked
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customer_id) {
            alert('Por favor selecciona un cliente');
            return;
        }

        try {
            setLoading(true);
            const result = await repairService.create(formData);
            navigate(`/admin/reparaciones/${result.repair.id}`);
        } catch (error) {
            console.error('Error creating repair:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        const { diagnosis_cost, labor_cost, parts_cost, discount } = formData;
        return (parseFloat(diagnosis_cost) || 0) +
            (parseFloat(labor_cost) || 0) +
            (parseFloat(parts_cost) || 0) -
            (parseFloat(discount) || 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    return (
        <div className="new-repair-container">
            <header className="page-header">
                <div>
                    <h1>Nueva Reparación</h1>
                    <p className="text-muted">Ingresa los detalles para una nueva orden de servicio</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost">
                        <X size={18} /> <span className="hide-on-mobile">Cancelar</span>
                    </button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="repair-form">
                <div className="form-grid">
                    {/* SECCIÓN 1: CLIENTE */}
                    <section className="form-section customer-section">
                        <h2><User size={20} /> Información del Cliente</h2>

                        {selectedCustomer ? (
                            <div className="selected-customer-card">
                                <div className="customer-avatar sm">
                                    {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                                </div>
                                <div className="customer-details">
                                    <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>
                                    <span>{selectedCustomer.email}</span>
                                    <span>{selectedCustomer.phone}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-icon btn-ghost"
                                    onClick={() => setSelectedCustomer(null)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="customer-search-container">
                                <div className="search-box">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente (nombre, email, tel)..."
                                        value={customerSearch}
                                        onChange={handleCustomerSearch}
                                        className="input"
                                    />
                                </div>

                                {searchingCustomers && <div className="searching-indicator">Buscando...</div>}

                                {customers.length > 0 && (
                                    <div className="search-results">
                                        {customers.map(c => (
                                            <div
                                                key={c.id}
                                                className="search-item"
                                                onClick={() => selectCustomer(c)}
                                            >
                                                <span>{c.first_name} {c.last_name} ({c.email})</span>
                                                <ChevronRight size={14} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-md">
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/clientes')}>
                                        + Registrar nuevo cliente
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 2: DISPOSITIVO */}
                    <section className="form-section device-section">
                        <h2><Smartphone size={20} /> Detalles del Equipo</h2>
                        <div className="form-row">
                            <div className="input-group">
                                <label>Tipo de Equipo *</label>
                                <select
                                    name="device_type_id"
                                    className="select"
                                    value={formData.device_type_id}
                                    onChange={handleDeviceTypeChange}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {deviceTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Marca *</label>
                                <select
                                    name="brand_id"
                                    className="select"
                                    value={formData.brand_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleccionar...</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                    <option value="other">Otra...</option>
                                </select>
                            </div>
                        </div>

                        {formData.brand_id === 'other' && (
                            <div className="input-group">
                                <label>Especificar Marca</label>
                                <input
                                    type="text"
                                    name="brand_other"
                                    className="input"
                                    value={formData.brand_other}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div className="form-row">
                            <div className="input-group">
                                <label>Modelo *</label>
                                <input
                                    type="text"
                                    name="model"
                                    className="input"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    className="input"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Capacidad (GB)</label>
                                <input
                                    type="text"
                                    name="storage_capacity"
                                    className="input"
                                    value={formData.storage_capacity}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>IMEI / No. Serie</label>
                                <input
                                    type="text"
                                    name="imei"
                                    className="input"
                                    value={formData.imei}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Contraseña / Patrón</label>
                            <input
                                type="text"
                                name="device_password"
                                className="input"
                                value={formData.device_password}
                                onChange={handleChange}
                                placeholder="Para pruebas..."
                            />
                        </div>
                        <div className="form-row">
                            <div className="input-group">
                                <label>Estado Batería (%)</label>
                                <input
                                    type="text"
                                    name="battery_health"
                                    className="input"
                                    value={formData.battery_health}
                                    onChange={handleChange}
                                    placeholder="Ej: 85% o 'Inflada'"
                                />
                            </div>
                            <div className="input-group">
                                <label>Cuenta / iCloud</label>
                                <input
                                    type="text"
                                    name="account_status"
                                    className="input"
                                    value={formData.account_status}
                                    onChange={handleChange}
                                    placeholder="Sin cuenta, Bloqueada, etc."
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Estado de Pantalla</label>
                            <input
                                type="text"
                                name="screen_status"
                                className="input"
                                value={formData.screen_status}
                                onChange={handleChange}
                                placeholder="Original, Genérica, Rayada, etc."
                            />
                        </div>
                    </section>

                    {/* SECCIÓN 3: ESTADO FÍSICO */}
                    <section className="form-section inspection-section">
                        <h2><ClipboardCheck size={20} /> Inspección de Entrada</h2>
                        <div className="input-group">
                            <label>Condición Física (1-5)</label>
                            <div className="rating-selector">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        className={`rating-btn ${formData.physical_condition === v ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, physical_condition: v }))}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Accesorios Recibidos</label>
                            <input
                                type="text"
                                name="accessories_received"
                                className="input"
                                value={formData.accessories_received}
                                onChange={handleChange}
                                placeholder="Cargador, funda, chip, etc."
                            />
                        </div>
                        <div className="input-group">
                            <label>Observaciones Técnicas / Notas Especiales</label>
                            <textarea
                                name="technical_observations"
                                className="input"
                                rows="2"
                                value={formData.technical_observations}
                                onChange={handleChange}
                                placeholder="Detalles técnicos adicionales..."
                            ></textarea>
                        </div>
                        <div className="input-group">
                            <label>Daños Existentes</label>
                            <textarea
                                name="existing_damage"
                                className="input"
                                rows="2"
                                value={formData.existing_damage}
                                onChange={handleChange}
                                placeholder="Rayones, golpes, tapas sueltas..."
                            ></textarea>
                        </div>

                        <label className="info-label mt-md">Checklist Funcional</label>
                        <div className="checklist-grid">
                            {Object.entries(formData.function_checklist).map(([key, value]) => (
                                <label key={key} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        name={`check_${key}`}
                                        checked={value}
                                        onChange={handleChange}
                                    />
                                    <span className="capitalize">{key === 'display' ? 'Pantalla' : key}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* SECCIÓN 4: SERVICIO */}
                    <section className="form-section service-section">
                        <h2><Wrench size={20} /> Servicio Solicitado</h2>
                        <div className="input-group">
                            <label>Servicio del Catálogo</label>
                            <select
                                name="service_id"
                                className="select"
                                value={formData.service_id}
                                onChange={handleServiceChange}
                                disabled={!formData.device_type_id}
                            >
                                <option value="">Seleccionar un servicio...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.base_price)}</option>
                                ))}
                            </select>
                            {!formData.device_type_id && <small className="text-muted">Selecciona tipo de equipo primero</small>}
                        </div>

                        <div className="input-group">
                            <label>Descripción del Problema *</label>
                            <textarea
                                name="problem_description"
                                className="input"
                                rows="3"
                                value={formData.problem_description}
                                onChange={handleChange}
                                required
                                placeholder="Falla reportada por el cliente..."
                            ></textarea>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label>Asignar Técnico</label>
                                <select
                                    name="technician_id"
                                    className="select"
                                    value={formData.technician_id}
                                    onChange={handleChange}
                                >
                                    <option value="">No asignado</option>
                                    {technicians.map(t => (
                                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Prioridad</label>
                                <select name="priority" className="select" value={formData.priority} onChange={handleChange}>
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Fecha Estimada de Entrega</label>
                            <input
                                type="date"
                                name="estimated_delivery"
                                className="input"
                                value={formData.estimated_delivery}
                                onChange={handleChange}
                            />
                        </div>
                    </section>

                    {/* SECCIÓN 5: COSTOS */}
                    <section className="form-section cost-section">
                        <h2><DollarSign size={20} /> Presupuesto y Anticipo</h2>
                        <div className="costs-grid">
                            <div className="input-group">
                                <label>Diagnóstico ($)</label>
                                <input
                                    type="number"
                                    name="diagnosis_cost"
                                    className="input"
                                    value={formData.diagnosis_cost}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Mano de Obra ($)</label>
                                <input
                                    type="number"
                                    name="labor_cost"
                                    className="input"
                                    value={formData.labor_cost}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Refacciones ($)</label>
                                <input
                                    type="number"
                                    name="parts_cost"
                                    className="input"
                                    value={formData.parts_cost}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Descuento ($)</label>
                                <input
                                    type="number"
                                    name="discount"
                                    className="input"
                                    value={formData.discount}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="total-display card">
                            <div className="total-row main">
                                <span>Total Presupuestado:</span>
                                <strong>{formatCurrency(calculateTotal())}</strong>
                            </div>
                            <div className="input-group mt-md">
                                <label>Anticipo Recibido ($)</label>
                                <input
                                    type="number"
                                    name="advance_payment"
                                    className="input"
                                    value={formData.advance_payment}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="total-row pending text-error">
                                <span>Restante:</span>
                                <strong>{formatCurrency(calculateTotal() - formData.advance_payment)}</strong>
                            </div>
                        </div>

                        <div className="input-group mt-md">
                            <label>Garantía (Días)</label>
                            <input
                                type="number"
                                name="warranty_days"
                                className="input"
                                value={formData.warranty_days}
                                onChange={handleChange}
                            />
                        </div>
                    </section>
                </div>

                <div className="form-footer">
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Save size={18} /> {loading ? 'Guardando...' : 'Crear Orden de Reparación'}
                    </button>
                </div>
            </form>
        </div>
    );
}
