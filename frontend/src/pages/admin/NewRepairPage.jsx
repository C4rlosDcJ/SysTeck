import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    customerService,
    repairService,
    servicesCatalog,
    settingsService,
    userService
} from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import {
    Save, X, User, Smartphone, Wrench, ClipboardCheck,
    DollarSign, Search, ChevronRight, CheckCircle2,
    Image as ImageIcon, Plus, Trash2, Camera
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
    const [settings, setSettings] = useState({});

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    
    // Checkbox explicitly needed to submit if there are conditions
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [customerSearch, setCustomerSearch] = useState('');
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [_selectedService, setSelectedService] = useState(null);

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
            const [types, brandsData, settingsData, staff] = await Promise.all([
                servicesCatalog.getDeviceTypes(),
                servicesCatalog.getBrands(),
                settingsService.getAll(),
                userService.getTechnicians()
            ]);
            setDeviceTypes(types || []);
            setBrands(brandsData || []);
            setTechnicians(staff || []);
            setSettings(settingsData || {});

            const defWarranty = settingsData?.default_warranty_days;
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

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedImages(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
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

    const handleSubmit = async (e, shouldPrint = false) => {
        e.preventDefault();
        if (!formData.customer_id) {
            alert('Por favor selecciona un cliente');
            return;
        }
        if (!acceptedTerms) {
            alert('Por favor confirma los términos de recepción antes de continuar.');
            return;
        }

        try {
            setLoading(true);
            const result = await repairService.create(formData);
            const newRepairId = result.repair.id;

            // Handle images if any
            if (selectedImages.length > 0) {
                try {
                    const { uploadService } = await import('../../services/api');
                    await uploadService.uploadImages(newRepairId, selectedImages, 'before');
                } catch (imgError) {
                    console.error('Error uploading initial images:', imgError);
                    alert('La reparación se creó pero hubo un error subiendo las imágenes iniciales.');
                }
            }
            
            // Clean up object URLs to prevent memory leaks
            imagePreviews.forEach(url => URL.revokeObjectURL(url));

            // Generate and download PDF if requested
            if (shouldPrint) {
                try {
                    const { generateServiceTicket } = await import('../../utils/pdfGenerator');
                    // We need to fetch the full updated repair with joins (customer name, etc) for the ticket
                    const fullRepair = await repairService.getById(newRepairId);
                    generateServiceTicket(fullRepair, settings);
                } catch (printError) {
                    console.error('Error printing ticket:', printError);
                    alert('Ocurrió un error al intentar generar el recibo PDF.');
                }
            }

            navigate(`/admin/reparaciones/${newRepairId}`);
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

    return (
        <div className="new-repair-page">
            <header className="page-header">
                <div>
                    <h1>Nueva Reparación</h1>
                    <p>Ingresa los detalles para la nueva orden de servicio</p>
                </div>
            </header>

            <form onSubmit={(e) => handleSubmit(e, false)} className="repair-form-layout">
                {/* ── Left Column: Form Details ── */}
                <div className="repair-form-main">
                    
                    {/* SECCIÓN 1: CLIENTE */}
                    <section className="form-card">
                        <div className="form-card-header">
                            <User size={20} className="icon-primary" />
                            <h2>Información del Cliente</h2>
                        </div>
                        
                        {selectedCustomer ? (
                            <div className="selected-customer">
                                <div className="customer-avatar">
                                    {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                                </div>
                                <div className="customer-info">
                                    <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>
                                    <span>{selectedCustomer.email} • {selectedCustomer.phone}</span>
                                </div>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <div className="customer-search">
                                <div className="search-box">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, email o teléfono..."
                                        value={customerSearch}
                                        onChange={handleCustomerSearch}
                                        className="input"
                                    />
                                </div>
                                {searchingCustomers && <p className="text-muted text-sm mt-xs">Buscando...</p>}
                                {customers.length > 0 && (
                                    <div className="search-results mt-sm">
                                        {customers.map(c => (
                                            <button
                                                key={c.id} type="button"
                                                className="search-item"
                                                onClick={() => selectCustomer(c)}
                                            >
                                                <div className="search-item-avatar text-xs font-bold">
                                                    {c.first_name[0]}{c.last_name[0]}
                                                </div>
                                                <div className="search-item-info">
                                                    <strong>{c.first_name} {c.last_name}</strong>
                                                    <span>{c.email}</span>
                                                </div>
                                                <ChevronRight size={16} className="text-muted" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 2: DISPOSITIVO */}
                    <section className="form-card">
                        <div className="form-card-header">
                            <Smartphone size={20} className="icon-primary" />
                            <h2>Detalles del Equipo</h2>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tipo de Equipo *</label>
                                <select name="device_type_id" className="select" value={formData.device_type_id} onChange={handleDeviceTypeChange} required>
                                    <option value="">Seleccionar...</option>
                                    {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Marca *</label>
                                <select name="brand_id" className="select" value={formData.brand_id} onChange={handleChange}>
                                    <option value="">Seleccionar...</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    <option value="other">Otra...</option>
                                </select>
                            </div>
                            {formData.brand_id === 'other' && (
                                <div className="form-group col-span-full">
                                    <label>Especificar Marca</label>
                                    <input type="text" name="brand_other" className="input" value={formData.brand_other} onChange={handleChange} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Modelo *</label>
                                <input type="text" name="model" className="input" value={formData.model} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <input type="text" name="color" className="input" value={formData.color} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Capacidad (GB)</label>
                                <input type="text" name="storage_capacity" className="input" value={formData.storage_capacity} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>IMEI / No. Serie</label>
                                <input type="text" name="imei" className="input" value={formData.imei} onChange={handleChange} />
                            </div>
                            <div className="form-group col-span-full">
                                <label>Contraseña / Patrón de Desbloqueo</label>
                                <input type="text" name="device_password" className="input" value={formData.device_password} onChange={handleChange} placeholder="Para pruebas de calidad..." />
                            </div>
                            <div className="form-group">
                                <label>Estado Batería</label>
                                <input type="text" name="battery_health" className="input" value={formData.battery_health} onChange={handleChange} placeholder="Ej: 85% o 'Mantenimiento'" />
                            </div>
                            <div className="form-group">
                                <label>Cuenta / iCloud</label>
                                <input type="text" name="account_status" className="input" value={formData.account_status} onChange={handleChange} placeholder="Libre, Bloqueada, etc." />
                            </div>
                            <div className="form-group col-span-full">
                                <label>Estado de Pantalla</label>
                                <input type="text" name="screen_status" className="input" value={formData.screen_status} onChange={handleChange} placeholder="Original, Cambiada, Estrellada..." />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: INSPECCIÓN */}
                    <section className="form-card">
                        <div className="form-card-header">
                            <ClipboardCheck size={20} className="icon-primary" />
                            <h2>Inspección de Entrada</h2>
                        </div>
                        <div className="form-group mb-md">
                            <label>Condición Física General (1-5)</label>
                            <div className="rating-selector">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v} type="button"
                                        className={`rating-btn ${formData.physical_condition === v ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, physical_condition: v }))}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group mb-md">
                            <label>Accesorios Recibidos</label>
                            <input type="text" name="accessories_received" className="input" value={formData.accessories_received} onChange={handleChange} placeholder="Funda, cargador, sim card..." />
                        </div>
                        <div className="form-group mb-md">
                            <label>Daños Físicos o Estéticos Existentes</label>
                            <textarea name="existing_damage" className="input" rows="2" value={formData.existing_damage} onChange={handleChange} placeholder="Describa rayones, golpes, etc..."></textarea>
                        </div>
                        <div className="form-group mb-md">
                            <label>Observaciones Técnicas Adicionales</label>
                            <textarea name="technical_observations" className="input" rows="2" value={formData.technical_observations} onChange={handleChange} placeholder="Notas internas para el técnico..."></textarea>
                        </div>
                        
                        <div className="form-group">
                            <label>Checklist Funcional Inicial</label>
                            <div className="checklist-grid">
                                {Object.entries(formData.function_checklist).map(([key, value]) => (
                                    <label key={key} className={`checklist-item ${value ? 'checked' : ''}`}>
                                        <input type="checkbox" name={`check_${key}`} checked={value} onChange={handleChange} className="hidden-checkbox" />
                                        <div className="checklist-box">
                                            {value && <CheckCircle2 size={16} />}
                                        </div>
                                        <span className="capitalize">{key === 'display' ? 'pantalla' : key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group mt-md">
                            <label className="flex justify-between items-center mb-xs">
                                <span>Fotografías del Equipo (Recepción)</span>
                                <label className="btn btn-ghost btn-sm text-primary pointer m-0">
                                    <Camera size={16} className="mr-xs" /> Agregar Fotos
                                    <input type="file" multiple hidden accept="image/*" onChange={handleImageSelect} />
                                </label>
                            </label>
                            
                            {imagePreviews.length > 0 ? (
                                <div className="image-preview-grid">
                                    {imagePreviews.map((url, index) => (
                                        <div key={index} className="preview-thumbnail">
                                            <img src={url} alt={`Preview ${index}`} />
                                            <button type="button" className="remove-btn" onClick={() => handleRemoveImage(index)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-images-area">
                                    <ImageIcon size={24} className="text-muted mb-xs" />
                                    <p className="text-sm text-muted">No se han agregado fotos de recepción.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* SECCIÓN 4: SERVICIO AL QUE INGRESA */}
                    <section className="form-card">
                        <div className="form-card-header">
                            <Wrench size={20} className="icon-primary" />
                            <h2>Detalle del Servicio</h2>
                        </div>
                        
                        <div className="form-group mb-md">
                            <label>Servicio Base</label>
                            <select name="service_id" className="select" value={formData.service_id} onChange={handleServiceChange} disabled={!formData.device_type_id}>
                                <option value="">Seleccionar servicio del catálogo...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.base_price)}</option>)}
                            </select>
                        </div>

                        <div className="form-group mb-md">
                            <label>Falla Reportada / Descripción de Solicitud *</label>
                            <textarea name="problem_description" className="input" rows="3" value={formData.problem_description} onChange={handleChange} required placeholder="Lo que el cliente reporta que falla..."></textarea>
                        </div>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Técnico Asignado</label>
                                <select name="technician_id" className="select" value={formData.technician_id} onChange={handleChange}>
                                    <option value="">Sin asignar</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Prioridad</label>
                                <select name="priority" className="select" value={formData.priority} onChange={handleChange}>
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Entrega Estimada</label>
                                <input type="date" name="estimated_delivery" className="input" value={formData.estimated_delivery} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Garantía (Días)</label>
                                <input type="number" name="warranty_days" className="input" value={formData.warranty_days} onChange={handleChange} />
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Right Column: Sticky Costs summary ── */}
                <div className="repair-form-sidebar">
                    <div className="costs-summary-card">
                        <div className="form-card-header">
                            <DollarSign size={20} className="icon-success" />
                            <h2>Presupuesto</h2>
                        </div>
                        
                        <div className="costs-inputs">
                            <div className="cost-row input-mode">
                                <label>Diagnóstico</label>
                                <div className="input-with-icon">
                                    <span>$</span>
                                    <input type="number" name="diagnosis_cost" className="input input-sm text-right" value={formData.diagnosis_cost} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="cost-row input-mode">
                                <label>Mano de obra</label>
                                <div className="input-with-icon">
                                    <span>$</span>
                                    <input type="number" name="labor_cost" className="input input-sm text-right" value={formData.labor_cost} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="cost-row input-mode">
                                <label>Refacciones</label>
                                <div className="input-with-icon">
                                    <span>$</span>
                                    <input type="number" name="parts_cost" className="input input-sm text-right" value={formData.parts_cost} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="cost-row input-mode">
                                <label>Descuento</label>
                                <div className="input-with-icon">
                                    <span>-$</span>
                                    <input type="number" name="discount" className="input input-sm text-right" value={formData.discount} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="costs-divider"></div>
                        
                        <div className="cost-row total-row">
                            <span>Total Cotizado</span>
                            <strong>{formatCurrency(calculateTotal())}</strong>
                        </div>

                        <div className="cost-row input-mode mt-md">
                            <label className="font-bold">Anticipo</label>
                            <div className="input-with-icon highlight-input">
                                <span>$</span>
                                <input type="number" name="advance_payment" className="input input-sm text-right" value={formData.advance_payment} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="cost-row pending-row mt-sm">
                            <span>Restante a Pagar</span>
                            <strong>{formatCurrency(calculateTotal() - formData.advance_payment)}</strong>
                        </div>

                        <div className="reception-terms bg-bg-elevated p-md rounded-md mt-lg border border-border">
                            <label className="flex items-start gap-sm cursor-pointer m-0">
                                <input 
                                    type="checkbox" 
                                    className="mt-xs" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    required 
                                />
                                <span className="text-sm">
                                    Confirmo que el cliente comprende las condiciones de recepción, ha sido informado de los daños físicos, y autoriza el diagnóstico/reparación de este equipo.
                                </span>
                            </label>
                        </div>

                        <div className="costs-actions mt-lg">
                            <button type="submit" className="btn btn-primary w-full" disabled={loading || !acceptedTerms}>
                                <Save size={18} /> {loading ? 'Procesando...' : 'Crear Orden'}
                            </button>
                            <button type="button" onClick={(e) => handleSubmit(e, true)} className="btn btn-secondary w-full" disabled={loading || !acceptedTerms} style={{borderColor: 'var(--color-primary-muted)', color: 'var(--color-primary)'}}>
                                Guardar e Imprimir Recibo
                            </button>
                            <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost w-full">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
