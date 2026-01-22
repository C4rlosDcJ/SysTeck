import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Lock,
    CheckCircle
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
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="page-header">
                    <div>
                        <h1>Mi Perfil</h1>
                        <p className="text-muted">Administra tu información personal</p>
                    </div>
                </header>

                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.type === 'success' && <CheckCircle size={18} />}
                        {message.text}
                    </div>
                )}

                <div className="profile-grid">
                    {/* Profile Info */}
                    <section className="profile-section">
                        <h2>
                            <User size={20} />
                            Información Personal
                        </h2>
                        <form onSubmit={handleProfileSubmit}>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label htmlFor="first_name">Nombre</label>
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
                                <div className="input-group">
                                    <label htmlFor="last_name">Apellido</label>
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
                                <div className="input-group">
                                    <label htmlFor="email">
                                        <Mail size={16} /> Correo Electrónico
                                    </label>
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
                                <div className="input-group">
                                    <label htmlFor="phone">
                                        <Phone size={16} /> Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className="input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="input-group full-width">
                                    <label htmlFor="address">
                                        <MapPin size={16} /> Dirección
                                    </label>
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
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <Save size={18} />
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </section>

                    {/* Change Password */}
                    <section className="profile-section">
                        <h2>
                            <Lock size={20} />
                            Cambiar Contraseña
                        </h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="input-group">
                                <label htmlFor="current_password">Contraseña Actual</label>
                                <input
                                    type="password"
                                    id="current_password"
                                    name="current_password"
                                    className="input"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="new_password">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    id="new_password"
                                    name="new_password"
                                    className="input"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    id="confirm_password"
                                    name="confirm_password"
                                    className="input"
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-secondary" disabled={passwordLoading}>
                                <Lock size={18} />
                                {passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
