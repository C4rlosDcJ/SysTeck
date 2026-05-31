import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Save, RefreshCw, ShieldCheck, Building, Palette, Check, LayoutGrid, Upload, Trash2, Image } from 'lucide-react';
import './SettingsPage.css';

const ACCENT_PALETTE = [
    { name: 'Rosa SysTeck', value: '#e63358' },
    { name: 'Azul Moderno', value: '#3b82f6' },
    { name: 'Esmeralda', value: '#10b981' },
    { name: 'Violeta Tecnológico', value: '#a855f7' },
    { name: 'Ámbar Cálido', value: '#f59e0b' }
];

export default function SettingsPage() {
    const { accentColor, setAccentColor, borderRadius, setBorderRadius, setBusinessName, businessLogo, setBusinessLogo } = useTheme();
    const [settings, setSettings] = useState({
        default_warranty_days: '30',
        business_name: 'Sys-Teck',
        contact_email: '',
        contact_phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('La imagen es demasiado grande. El límite es de 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setBusinessLogo(reader.result);
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
            if (data && data.business_name) {
                setBusinessName(data.business_name);
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
            alert('Configuraciones globales guardadas correctamente');
        } catch (error) {
            alert('Error al guardar configuraciones: ' + error.message);
        } finally {
            setSaving(false);
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
            </div>
        </div>
    );
}
