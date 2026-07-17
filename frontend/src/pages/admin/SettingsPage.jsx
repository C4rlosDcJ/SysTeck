import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Save, RefreshCw, ShieldCheck, Building, Palette, Check, LayoutGrid, Upload, Trash2, Image, Wrench, Star, Sparkles, Eye, EyeOff } from 'lucide-react';
import './SettingsPage.css';

const ACCENT_PALETTE = [
    { name: 'Nothing Red', value: '#ff003c' },
    { name: 'Apple Blue', value: '#0070f3' },
    { name: 'Carbon Black', value: '#1a1a1a' },
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Slate Grey', value: '#71717a' }
];

export default function SettingsPage() {
    const {
        accentColor,
        setAccentColor,
        borderRadius,
        setBorderRadius,
        setBusinessName,
        businessLogo,
        setBusinessLogo,
        landingShowStats,
        setLandingShowStats,
        landingShowWhy,
        setLandingShowWhy,
        landingShowServices,
        setLandingShowServices,
        landingShowProcess,
        setLandingShowProcess,
        landingShowTestimonials,
        setLandingShowTestimonials,
        landingShowCTA,
        setLandingShowCTA,
        landingShowContact,
        setLandingShowContact,
        contactAddress,
        setContactAddress,
        contactSchedule,
        setContactSchedule,
        contactEmail,
        setContactEmail,
        contactPhone,
        setContactPhone,
        landingServices,
        setLandingServices
    } = useTheme();
    
    const [settings, setSettings] = useState({
        default_warranty_days: '30',
        business_name: 'Sys-Teck',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        contact_schedule: '',
        gemini_api_key: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Formulario de nuevo servicio
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [newService, setNewService] = useState({ title: '', description: '', color: '#3b82f6', icon: 'smartphone' });
    const [showApiKey, setShowApiKey] = useState(false);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 with compressed quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                    setBusinessLogo(dataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getAll();
            setSettings(prev => ({
                ...prev,
                ...data
            }));
            if (data) {
                if (data.business_name) setBusinessName(data.business_name);
                if (data.contact_address) setContactAddress(data.contact_address);
                if (data.contact_schedule) setContactSchedule(data.contact_schedule);
                if (data.contact_email) setContactEmail(data.contact_email);
                if (data.contact_phone) setContactPhone(data.contact_phone);
            }
        } catch (error) {
            console.error('Error al cargar configuraciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await settingsService.update(settings);
            setBusinessName(settings.business_name);
            setContactAddress(settings.contact_address || '');
            setContactSchedule(settings.contact_schedule || '');
            setContactEmail(settings.contact_email || '');
            setContactPhone(settings.contact_phone || '');
            alert('Configuraciones globales guardadas correctamente');
        } catch (error) {
            alert('Error al guardar configuraciones: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Funciones para agregar/eliminar servicios
    const handleAddService = (e) => {
        e.preventDefault();
        if (!newService.title.trim()) return;
        const updated = [...landingServices, newService];
        setLandingServices(updated);
        setNewService({ title: '', description: '', color: '#3b82f6', icon: 'smartphone' });
        setShowServiceForm(false);
    };

    const handleDeleteService = (idx) => {
        if (window.confirm('¿Estás seguro de eliminar esta especialidad?')) {
            const updated = landingServices.filter((_, i) => i !== idx);
            setLandingServices(updated);
        }
    };

    if (loading) {
        return (
            <div className="settings-container">
                <main className="dashboard-main">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando configuraciones...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="settings-container animate-fadeIn">
            <header className="settings-header" style={{ marginBottom: 'var(--sp-6)' }}>
                <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Configuración del Sistema</h1>
                <p className="text-muted">Gestiona los parámetros globales de la aplicación y el estilo visual</p>
            </header>

            <div className="settings-grid">
                {/* ═══ Personalización Estética (Local / Global CSS) ═══ */}
                <div className="settings-card">
                    <div className="settings-section">
                        <h2><Palette size={20} className="text-primary" /> Estilo y Personalización Visual</h2>
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--sp-2)' }}>
                            Personaliza el color primario de los botones, enlaces y acentos visuales en todo el sistema.
                        </p>
                        
                        <div className="input-group">
                            <label>Color de Acento del Sistema</label>
                            <div className="accent-picker">
                                {ACCENT_PALETTE.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        className={`accent-color-btn ${accentColor === color.value ? 'selected' : ''}`}
                                        style={{ backgroundColor: color.value }}
                                        onClick={() => setAccentColor(color.value)}
                                        title={color.name}
                                    >
                                        {accentColor === color.value && <Check size={16} style={{ color: '#fff' }} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: 'var(--sp-4)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <LayoutGrid size={14} /> Redondeado de Componentes (Bordes)
                            </label>
                            <div className="radius-selector" style={{ marginTop: 'var(--sp-2)' }}>
                                <button
                                    type="button"
                                    className={`radius-btn ${borderRadius === '0px' ? 'selected' : ''}`}
                                    onClick={() => setBorderRadius('0px')}
                                >
                                    Recto
                                </button>
                                <button
                                    type="button"
                                    className={`radius-btn ${borderRadius === '6px' ? 'selected' : ''}`}
                                    onClick={() => setBorderRadius('6px')}
                                >
                                    Suave (6px)
                                </button>
                                <button
                                    type="button"
                                    className={`radius-btn ${borderRadius === '12px' ? 'selected' : ''}`}
                                    onClick={() => setBorderRadius('12px')}
                                >
                                    Redondeado (12px)
                                </button>
                                <button
                                    type="button"
                                    className={`radius-btn ${borderRadius === '20px' ? 'selected' : ''}`}
                                    onClick={() => setBorderRadius('20px')}
                                >
                                    Máximo (20px)
                                </button>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--sp-4)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Image size={14} /> Logo o Icono del Sistema
                            </label>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginBottom: 'var(--sp-2)' }}>
                                Sube una imagen personalizada para reemplazar el icono por defecto en todo el sistema.
                            </p>
                            
                            <div className="logo-upload-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginTop: 'var(--sp-2)' }}>
                                {businessLogo ? (
                                    <div className="logo-preview-container" style={{ position: 'relative', width: '60px', height: '60px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--color-bg-elevated)' }}>
                                        <img src={businessLogo} alt="Business Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div className="logo-preview-placeholder" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)' }}>
                                        <Image size={24} />
                                    </div>
                                )}
                                
                                <div className="logo-upload-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: 'var(--font-xs)', padding: '6px 12px' }}>
                                        <Upload size={12} /> Seleccionar Imagen
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {businessLogo && (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: 'var(--font-xs)', padding: '6px 12px', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                            onClick={() => setBusinessLogo('')}
                                        >
                                            <Trash2 size={12} /> Eliminar Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Secciones de la Página de Inicio ═══ */}
                <div className="settings-card">
                    <div className="settings-section">
                        <h2><LayoutGrid size={20} className="text-primary" /> Secciones de la Página de Inicio</h2>
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--sp-4)' }}>
                            Activa o desactiva las secciones visibles para los clientes en la página de inicio.
                        </p>
                        
                        <div className="toggles-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                            {[
                                { label: 'Barra de Estadísticas', desc: 'Muestra cifras clave como equipos reparados y clientes satisfechos.', value: landingShowStats, setter: setLandingShowStats },
                                { label: '¿Por qué elegirnos?', desc: 'Muestra las tarjetas con los pilares y fortalezas de tu servicio.', value: landingShowWhy, setter: setLandingShowWhy },
                                { label: 'Especialidades y Servicios', desc: 'Muestra el listado de categorías de dispositivos que reparas.', value: landingShowServices, setter: setLandingShowServices },
                                { label: 'Proceso en Cuatro Pasos', desc: 'Describe las fases por las que pasa el dispositivo (Recepción, Diagnóstico, etc.).', value: landingShowProcess, setter: setLandingShowProcess },
                                { label: 'Opiniones de Clientes (Testimonios)', desc: 'Muestra lo que opinan tus clientes sobre tus reparaciones.', value: landingShowTestimonials, setter: setLandingShowTestimonials },
                                { label: 'Llamada a la Acción (CTA)', desc: 'Invita al usuario a solicitar una cotización con un botón destacado.', value: landingShowCTA, setter: setLandingShowCTA },
                                { label: 'Información de Contacto', desc: 'Muestra dirección, teléfono, correo y horario al final de la página.', value: landingShowContact, setter: setLandingShowContact }
                            ].map((toggle, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--sp-3)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: 'var(--sp-4)' }}>
                                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-text)' }}>{toggle.label}</span>
                                        <span className="text-muted" style={{ fontSize: 'var(--font-xs)', lineHeight: 1.4 }}>{toggle.desc}</span>
                                    </div>
                                    <label className="switch-wrapper" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', flexShrink: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={toggle.value}
                                            onChange={(e) => toggle.setter(e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span className="slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: toggle.value ? 'var(--color-primary)' : 'var(--color-border-strong)', transition: '.3s', borderRadius: '20px' }}>
                                            <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: toggle.value ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }} />
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ Ajustes de Garantía e Información del Negocio ═══ */}
                <div className="settings-card">
                    <form onSubmit={handleSubmit} className="settings-form">
                        <section className="settings-section">
                            <h2><ShieldCheck size={20} className="text-primary" /> Garantías de Reparación</h2>
                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label htmlFor="default_warranty_days">Días de garantía por defecto</label>
                                    <input
                                        type="number"
                                        id="default_warranty_days"
                                        name="default_warranty_days"
                                        value={settings.default_warranty_days}
                                        onChange={handleChange}
                                        className="input"
                                        min="0"
                                        required
                                    />
                                    <p className="settings-note">
                                        Este valor se asignará por defecto a los nuevos tickets de reparación.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="settings-section">
                            <h2><Building size={20} className="text-primary" /> Información de Contacto Comercial</h2>
                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label htmlFor="business_name">Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        id="business_name"
                                        name="business_name"
                                        value={settings.business_name}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="contact_email">Email del Soporte</label>
                                    <input
                                        type="email"
                                        id="contact_email"
                                        name="contact_email"
                                        value={settings.contact_email}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-2" style={{ marginTop: 'var(--sp-2)' }}>
                                <div className="input-group">
                                    <label htmlFor="contact_phone">Teléfono de Atención</label>
                                    <input
                                        type="text"
                                        id="contact_phone"
                                        name="contact_phone"
                                        value={settings.contact_phone}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="contact_schedule">Horario de Servicio</label>
                                    <input
                                        type="text"
                                        id="contact_schedule"
                                        name="contact_schedule"
                                        value={settings.contact_schedule || ''}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Lun - Sáb: 9AM - 7PM"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-1" style={{ marginTop: 'var(--sp-2)' }}>
                                <div className="input-group">
                                    <label htmlFor="contact_address">Dirección Física (Ubicación)</label>
                                    <input
                                        type="text"
                                        id="contact_address"
                                        name="contact_address"
                                        value={settings.contact_address || ''}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Av. Principal #123, Ciudad"
                                    />
                                </div>
                            </div>
                        </section>
 
                        <div className="settings-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Guardando...' : 'Guardar Parámetros'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Integracion de Inteligencia Artificial */}
                <div className="settings-card">
                    <div className="settings-section">
                        <h2><Sparkles size={20} className="text-primary" /> Inteligencia Artificial (Gemini)</h2>
                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--sp-4)' }}>
                            Configura la API Key de Google Gemini para habilitar las funciones de IA del sistema: diagnóstico inteligente, chatbot de soporte y profesionalización de notas.
                        </p>

                        <div className="input-group">
                            <label htmlFor="gemini_api_key">API Key de Google Gemini</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    id="gemini_api_key"
                                    name="gemini_api_key"
                                    value={settings.gemini_api_key}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="AIzaSy..."
                                    style={{ paddingRight: '44px' }}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title={showApiKey ? 'Ocultar clave' : 'Mostrar clave'}
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="settings-note">
                                Obtén tu API Key en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Google AI Studio</a>. Esta clave se almacena de forma segura en la base de datos del servidor.
                            </p>
                        </div>

                        <div className="settings-actions" style={{ marginTop: 'var(--sp-4)' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={saving}
                                onClick={async () => {
                                    try {
                                        setSaving(true);
                                        await settingsService.update({ gemini_api_key: settings.gemini_api_key });
                                        alert('API Key de Gemini guardada correctamente.');
                                    } catch (error) {
                                        alert('Error al guardar la API Key: ' + error.message);
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                            >
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Guardando...' : 'Guardar API Key'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ Administración de Especialidades y Servicios ═══ */}
                <div className="settings-card" style={{ gridColumn: 'span 2' }}>
                    <div className="settings-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
                            <div>
                                <h2><Wrench size={20} className="text-primary" /> Especialidades y Servicios</h2>
                                <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
                                    Agrega, edita o elimina los servicios destacados que se muestran en la página principal.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowServiceForm(!showServiceForm)}
                            >
                                {showServiceForm ? 'Cancelar' : 'Agregar Servicio'}
                            </button>
                        </div>

                        {showServiceForm && (
                            <form onSubmit={handleAddService} className="settings-form animate-fadeIn" style={{ background: 'var(--color-bg-elevated)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', marginBottom: 'var(--sp-4)' }}>
                                <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--sp-3)' }}>Nuevo Servicio</h3>
                                <div className="grid grid-2">
                                    <div className="input-group">
                                        <label>Título</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newService.title}
                                            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                                            placeholder="Ej. Consolas de Videojuegos"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Icono</label>
                                        <select
                                            className="input"
                                            value={newService.icon}
                                            onChange={(e) => setNewService({ ...newService, icon: e.target.value })}
                                        >
                                            <option value="smartphone">Celular / Smartphone</option>
                                            <option value="laptop">Laptop / Portátil</option>
                                            <option value="monitor">Computadora / Desktop</option>
                                            <option value="gamepad">Consola / Videojuegos</option>
                                            <option value="watch">Reloj / Smartwatch</option>
                                            <option value="tablet">Tablet</option>
                                            <option value="wrench">Herramienta (Por defecto)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-2" style={{ marginTop: 'var(--sp-3)' }}>
                                    <div className="input-group">
                                        <label>Descripción</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newService.description}
                                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                            placeholder="Ej. Cambio de puertos HDMI, láser, etc."
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Color de Acento (Hexadecimal)</label>
                                        <input
                                            type="color"
                                            className="input"
                                            style={{ height: '42px', padding: '4px' }}
                                            value={newService.color}
                                            onChange={(e) => setNewService({ ...newService, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--sp-3)' }}>
                                    Guardar Servicio
                                </button>
                            </form>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
                            {(landingServices || []).map((service, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                                        <Wrench size={18} />
                                    </div>
                                    <div style={{ flexGrow: 1, paddingRight: 'var(--sp-6)' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{service.title}</h4>
                                        <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '2px', lineHeight: 1.4 }}>{service.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteService(idx)}
                                        className="service-delete-btn"
                                        style={{ position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        title="Eliminar especialidad"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>            </div>
        </div>
    );
}
