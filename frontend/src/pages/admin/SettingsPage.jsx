import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { Save, RefreshCw, ShieldCheck, Building } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        default_warranty_days: '30',
        business_name: 'Sis-Tec',
        contact_email: '',
        contact_phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
            alert('Configuraciones guardadas correctamente');
        } catch (error) {
            alert('Error al guardar configuraciones: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
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
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="settings-container animate-fadeIn">
                    <header className="settings-header">
                        <h1>Configuración del Sistema</h1>
                        <p className="text-muted">Gestiona los parámetros globales de la aplicación</p>
                    </header>

                    <div className="settings-card">
                        <form onSubmit={handleSubmit} className="settings-form">
                            <section className="settings-section">
                                <h2><ShieldCheck size={20} /> Garantías</h2>
                                <div className="form-row">
                                    <div className="form-group">
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
                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            Este valor se usará automáticamente en nuevas reparaciones.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="settings-section">
                                <h2><Building size={20} /> Información del Negocio</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="business_name">Nombre del Negocio</label>
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
                                    <div className="form-group">
                                        <label htmlFor="contact_email">Email de Contacto</label>
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
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="contact_phone">Teléfono de Contacto</label>
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
                                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
