import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowLeft, Bell, History, Smartphone } from 'lucide-react';
import './AuthPages.css';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await login(formData.email, formData.password);
            // Redirigir según el rol
            if (response.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <div className="auth-logo">
                            <Wrench size={28} className="logo-icon" />
                            <span className="logo-text">Sys<span className="text-primary">-Teck</span></span>
                        </div>
                        <h1>Bienvenido de vuelta</h1>
                        <p>Accede a tu cuenta para gestionar tus reparaciones y seguir el estado de tus dispositivos</p>
                        <div className="auth-features">
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <Smartphone size={20} />
                                </div>
                                <span>Seguimiento en tiempo real</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <Bell size={20} />
                                </div>
                                <span>Notificaciones por email</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <History size={20} />
                                </div>
                                <span>Historial de reparaciones</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-container">
                    <div className="auth-form-wrapper">
                        <h2>Iniciar Sesión</h2>
                        <p className="auth-subtitle">
                            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                        </p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="error-alert">{error}</div>}

                            <div className="input-group">
                                <label htmlFor="email">Correo Electrónico</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="input"
                                        placeholder="tu@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        className="input"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input type="checkbox" />
                                    <span>Recordarme</span>
                                </label>
                                <Link to="/forgot-password" className="forgot-link">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="btn-loading">
                                        <span className="spinner-small"></span>
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        <Link to="/" className="back-link">
                            <ArrowLeft size={16} />
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
