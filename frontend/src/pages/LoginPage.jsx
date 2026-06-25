import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowLeft, Bell, History, Smartphone } from 'lucide-react';
import './AuthPages.css';

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { businessLogo, businessName } = useTheme();
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
            // Redirigir según el rol o parámetro redirect
            if (response.user.role === 'admin') {
                navigate(redirectUrl || '/admin');
            } else {
                navigate(redirectUrl || '/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const renderBusinessName = () => {
        const name = businessName || 'Sys-Teck';
        if (name.includes('-')) {
            const parts = name.split('-');
            return <>{parts[0]}<span className="text-primary">-{parts.slice(1).join('-')}</span></>;
        }
        if (name.includes(' ')) {
            const parts = name.split(' ');
            return <>{parts[0]} <span className="text-primary">{parts.slice(1).join(' ')}</span></>;
        }
        const mid = Math.ceil(name.length / 2);
        return <>{name.substring(0, mid)}<span className="text-primary">{name.substring(mid)}</span></>;
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <div className="auth-logo">
                            {businessLogo ? (
                                <img src={businessLogo} alt="Logo" className="logo-img-auth" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                            ) : (
                                <div className="logo-icon">
                                    <Wrench size={20} />
                                </div>
                            )}
                            <span className="logo-text">{renderBusinessName()}</span>
                        </div>
                        <h1>Bienvenido de vuelta</h1>
                        <p>Accede a tu cuenta para gestionar tus reparaciones y seguir el estado de tus dispositivos en tiempo real.</p>
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
                                <span>Notificaciones automáticas</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <History size={20} />
                                </div>
                                <span>Historial y garantías</span>
                            </div>
                        </div>
                    </div>
                    <div className="auth-visual-ambient"></div>
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
                                style={{ marginTop: 'var(--sp-2)' }}
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
