import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesCatalog, repairService, uploadService } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
    Smartphone,
    Wrench,
    FileText,
    Camera,
    Upload,
    X,
    ChevronLeft,
    CheckCircle
} from 'lucide-react';
import './NewQuoteForm.css';

export default function NewQuoteForm() {
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [images, setImages] = useState([]);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        device_type_id: '',
        brand_id: '',
        brand_other: '',
        model: '',
        color: '',
        storage_capacity: '',
        serial_number: '',
        imei: '',
        problem_description: '',
        service_id: '',
        priority: 'normal',
        accessories_received: '',
        device_password: ''
    });

    useEffect(() => {
        loadFormData();
    }, []);

    const loadFormData = async () => {
        try {
            const [typesData, brandsData, servicesData] = await Promise.all([
                servicesCatalog.getDeviceTypes(),
                servicesCatalog.getBrands(),
                servicesCatalog.getAll({ active_only: 'true' })
            ]);
            setDeviceTypes(typesData);
            setBrands(brandsData);
            setServices(servicesData);
        } catch (err) {
            console.error('Error cargando datos:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 10) {
            setError('Máximo 10 imágenes permitidas');
            return;
        }

        const previews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...previews].slice(0, 10));
    };

    const removeImage = (index) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Crear la reparación/cotización
            const response = await repairService.create(formData);

            // Subir imágenes si hay
            if (images.length > 0 && response.repair?.id) {
                const files = images.map(img => img.file);
                await uploadService.uploadImages(response.repair.id, files);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Error al enviar cotización');
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = formData.device_type_id
        ? services.filter(s => !s.device_type_id || s.device_type_id == formData.device_type_id)
        : services;

    if (success) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="success-state">
                        <div className="success-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h2>¡Cotización Enviada!</h2>
                        <p>Tu solicitud ha sido recibida. Te notificaremos cuando tengamos un diagnóstico.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1>Nueva Cotización</h1>
                        <p className="text-muted">Completa el formulario para solicitar una reparación</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="quote-form">
                    {error && <div className="error-alert">{error}</div>}

                    {/* Información del dispositivo */}
                    <section className="form-section">
                        <h2>
                            <Smartphone size={20} />
                            Información del Dispositivo
                        </h2>

                        <div className="form-grid">
                            <div className="input-group">
                                <label htmlFor="device_type_id">Tipo de Dispositivo *</label>
                                <select
                                    id="device_type_id"
                                    name="device_type_id"
                                    className="select"
                                    value={formData.device_type_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {deviceTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="brand_id">Marca *</label>
                                <select
                                    id="brand_id"
                                    name="brand_id"
                                    className="select"
                                    value={formData.brand_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.brand_id && brands.find(b => b.id == formData.brand_id)?.name === 'Otro' && (
                                <div className="input-group">
                                    <label htmlFor="brand_other">Especificar Marca</label>
                                    <input
                                        type="text"
                                        id="brand_other"
                                        name="brand_other"
                                        className="input"
                                        placeholder="Nombre de la marca"
                                        value={formData.brand_other}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label htmlFor="model">Modelo *</label>
                                <input
                                    type="text"
                                    id="model"
                                    name="model"
                                    className="input"
                                    placeholder="Ej: iPhone 14 Pro, Galaxy S23"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="color">Color</label>
                                <input
                                    type="text"
                                    id="color"
                                    name="color"
                                    className="input"
                                    placeholder="Ej: Negro, Azul"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="storage_capacity">Capacidad</label>
                                <input
                                    type="text"
                                    id="storage_capacity"
                                    name="storage_capacity"
                                    className="input"
                                    placeholder="Ej: 128GB, 256GB"
                                    value={formData.storage_capacity}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="serial_number">Número de Serie</label>
                                <input
                                    type="text"
                                    id="serial_number"
                                    name="serial_number"
                                    className="input"
                                    placeholder="Opcional"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="imei">IMEI (Solo celulares)</label>
                                <input
                                    type="text"
                                    id="imei"
                                    name="imei"
                                    className="input"
                                    placeholder="15 dígitos"
                                    value={formData.imei}
                                    onChange={handleChange}
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Problema */}
                    <section className="form-section">
                        <h2>
                            <Wrench size={20} />
                            Descripción del Problema
                        </h2>

                        <div className="input-group">
                            <label htmlFor="service_id">Servicio Requerido</label>
                            <select
                                id="service_id"
                                name="service_id"
                                className="select"
                                value={formData.service_id}
                                onChange={handleChange}
                            >
                                <option value="">Selecciona un servicio (opcional)</option>
                                {filteredServices.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - ${service.base_price}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="problem_description">Describe el Problema *</label>
                            <textarea
                                id="problem_description"
                                name="problem_description"
                                className="input textarea"
                                placeholder="Describe detalladamente qué le pasa a tu dispositivo..."
                                value={formData.problem_description}
                                onChange={handleChange}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="priority">Prioridad</label>
                            <select
                                id="priority"
                                name="priority"
                                className="select"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgente (cargo adicional puede aplicar)</option>
                            </select>
                        </div>
                    </section>

                    {/* Información adicional */}
                    <section className="form-section">
                        <h2>
                            <FileText size={20} />
                            Información Adicional
                        </h2>

                        <div className="form-grid">
                            <div className="input-group">
                                <label htmlFor="accessories_received">Accesorios Entregados</label>
                                <input
                                    type="text"
                                    id="accessories_received"
                                    name="accessories_received"
                                    className="input"
                                    placeholder="Ej: Cargador, funda"
                                    value={formData.accessories_received}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="device_password">Contraseña/Patrón</label>
                                <input
                                    type="text"
                                    id="device_password"
                                    name="device_password"
                                    className="input"
                                    placeholder="Para diagnóstico (opcional)"
                                    value={formData.device_password}
                                    onChange={handleChange}
                                />
                                <small className="input-hint">Esta información se maneja de forma confidencial</small>
                            </div>
                        </div>
                    </section>

                    {/* Imágenes */}
                    <section className="form-section">
                        <h2>
                            <Camera size={20} />
                            Fotos del Dispositivo
                        </h2>
                        <p className="section-description">Agrega fotos del dispositivo para un mejor diagnóstico (máximo 10)</p>

                        <div className="image-upload-area">
                            <input
                                type="file"
                                id="images"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="file-input"
                            />
                            <label htmlFor="images" className="upload-label">
                                <Upload size={32} />
                                <span>Click aquí o arrastra imágenes</span>
                            </label>
                        </div>

                        {images.length > 0 && (
                            <div className="image-previews">
                                {images.map((img, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-image"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ChevronLeft size={18} />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar Cotización'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
