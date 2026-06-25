import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Menu, X, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const { businessLogo, businessName } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

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

    const handleSectionClick = (e, targetId) => {
        setMenuOpen(false);
        if (location.pathname === '/') {
            e.preventDefault();
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    {businessLogo ? (
                        <img src={businessLogo} alt="Logo" className="logo-img-navbar" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                        <Wrench size={24} className="logo-icon" />
                    )}
                    <span className="logo-text">{renderBusinessName()}</span>
                </Link>

                {/* Mobile menu button */}
                <button
                    className={`menu-toggle ${menuOpen ? 'active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Navigation links */}
                <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
                    <div className="navbar-links">
                        <Link
                            to="/"
                            className={`nav-link ${isActive('/') ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Inicio
                        </Link>
                        <Link
                            to="/tienda"
                            className={`nav-link ${isActive('/tienda') ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Tienda
                        </Link>
                        <Link
                            to="/rastrear"
                            className={`nav-link ${isActive('/rastrear') ? 'active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            Rastrear
                        </Link>
                        <Link
                            to="/#servicios"
                            className="nav-link"
                            onClick={(e) => handleSectionClick(e, 'servicios')}
                        >
                            Servicios
                        </Link>
                        <Link
                            to="/#proceso"
                            className="nav-link"
                            onClick={(e) => handleSectionClick(e, 'proceso')}
                        >
                            Proceso
                        </Link>
                        <Link
                            to="/#contacto"
                            className="nav-link"
                            onClick={(e) => handleSectionClick(e, 'contacto')}
                        >
                            Contacto
                        </Link>
                    </div>

                    {/* Auth buttons */}
                    <div className="navbar-auth">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={isAdmin ? '/admin' : '/dashboard'}
                                    className="nav-link user-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className="user-avatar">
                                        {user?.first_name?.charAt(0).toUpperCase()}
                                    </span>
                                    {user?.first_name}
                                </Link>
                                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                                    <LogOut size={16} />
                                    Salir
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="btn btn-ghost"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
