import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Lock,
    CheckCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener mínimo 6 caracteres' });
            return;
        }

        setPasswordLoading(true);
        try {
            await authService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="profile-container animate-fadeIn">
            <header className="page-header" style={{ marginBottom: 'var(--sp-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>Mi Perfil</h1>
                    <p className="text-muted">Administra tu información personal y de seguridad</p>
                </div>
            </header>

            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: 'var(--sp-4)' }}>
                    {message.type === 'success' && <CheckCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="profile-grid">
                {/* Columna Izquierda: Tarjeta Resumen */}
                <div className="profile-card">
                    <div className="profile-avatar-lg">
                        {formData.first_name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="profile-name">{formData.first_name} {formData.last_name}</h2>
                    <span className="profile-role">Cliente Registrado</span>
                    
                    <div className="profile-meta">
                        <div className="profile-meta-item">
                            <Mail size={14} className="text-primary" />
                            <span>{formData.email}</span>
                        </div>
                        {formData.phone && (
                            <div className="profile-meta-item">
                                <Phone size={14} className="text-primary" />
                                <span>{formData.phone}</span>
                            </div>
                        )}
                        {formData.address && (
                            <div className="profile-meta-item" style={{ alignItems: 'flex-start' }}>
                                <MapPin size={14} className="text-primary" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{formData.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Formularios de Edición */}
                <div className="profile-forms-col">
                    <section className="profile-section">
                        <h2>
                            <User size={20} className="text-primary" />
                            Información Personal
                        </h2>
                        <form onSubmit={handleProfileSubmit} className="profile-form">
                            <div className="profile-form-grid">
                                <div className="input-group">
                                    <label htmlFor="first_name">Nombre</label>
                                    <div className="input-with-icon">
                                        <User size={16} className="input-icon" />
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            className="input"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="last_name">Apellido</label>
                                    <div className="input-with-icon">
                                        <User size={16} className="input-icon" />
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            className="input"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="email">Correo Electrónico</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} className="input-icon" />
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="phone">Teléfono</label>
                                    <div className="input-with-icon">
                                        <Phone size={16} className="input-icon" />
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="input-group full-width">
                                    <label htmlFor="address">Dirección de Entrega / Contacto</label>
                                    <div className="input-with-icon">
                                        <MapPin size={16} className="input-icon" />
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            className="input"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Calle, número, colonia, ciudad"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="profile-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Save size={16} />
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="profile-section">
                        <h2>
                            <Lock size={20} className="text-primary" />
                            Cambiar Contraseña
                        </h2>
                        <form onSubmit={handlePasswordSubmit} className="profile-form">
                            <div className="profile-form-grid">
                                <div className="input-group">
                                    <label htmlFor="current_password">Contraseña Actual</label>
                                    <div className="input-with-icon">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            id="current_password"
                                            name="current_password"
                                            className="input"
                                            value={passwordData.current_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="new_password">Nueva Contraseña</label>
                                    <div className="input-with-icon">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            id="new_password"
                                            name="new_password"
                                            className="input"
                                            value={passwordData.new_password}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
                                    <div className="input-with-icon">
                                        <Lock size={16} className="input-icon" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirm_password"
                                            name="confirm_password"
                                            className="input"
                                            value={passwordData.confirm_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="profile-actions">
                                <button type="submit" className="btn btn-secondary" disabled={passwordLoading}>
                                    <Lock size={16} />
                                    {passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
