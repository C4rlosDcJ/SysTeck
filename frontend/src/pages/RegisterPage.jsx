import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Wrench,
    Mail,
    Lock,
    User,
    Phone,
    Eye,
    EyeOff,
    ArrowLeft,
    CheckCircle,
    LayoutDashboard,
    Bell,
    Shield
} from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
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

        // Validar contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Error al registrar usuario');
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
                            <span className="logo-text">Sis<span className="text-primary">-Tec</span></span>
                        </div>
                        <h1>Únete a Sis-Tec</h1>
                        <p>Crea tu cuenta y obtén acceso a todas las ventajas de nuestro servicio de reparación</p>
                        <div className="auth-features">
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <CheckCircle size={20} />
                                </div>
                                <span>Cotizaciones en línea</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <LayoutDashboard size={20} />
                                </div>
                                <span>Panel de control personal</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <Bell size={20} />
                                </div>
                                <span>Alertas de estado</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon-wrapper">
                                    <Shield size={20} />
                                </div>
                                <span>Garantía en reparaciones</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-container">
                    <div className="auth-form-wrapper">
                        <h2>Crear Cuenta</h2>
                        <p className="auth-subtitle">
                            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                        </p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="error-alert">{error}</div>}

                            <div className="form-row">
                                <div className="input-group">
                                    <label htmlFor="first_name">Nombre</label>
                                    <div className="input-with-icon">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            className="input"
                                            placeholder="Juan"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="last_name">Apellido</label>
                                    <div className="input-with-icon">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            className="input"
                                            placeholder="Pérez"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

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
                                <label htmlFor="phone">Teléfono</label>
                                <div className="input-with-icon">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className="input"
                                        placeholder="(123) 456-7890"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
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
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="confirmPassword">Confirmar</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} className="input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            className="input"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
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
                            </div>

                            <label className="checkbox-label">
                                <input type="checkbox" required />
                                <span>Acepto los <a href="#">términos y condiciones</a></span>
                            </label>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="btn-loading">
                                        <span className="spinner-small"></span>
                                        Creando cuenta...
                                    </span>
                                ) : (
                                    'Crear Cuenta'
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
