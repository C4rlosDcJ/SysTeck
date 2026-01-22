import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Menu, X, User, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <Wrench size={24} className="logo-icon" />
                    <span className="logo-text">Sis<span className="text-primary">-Tec</span></span>
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
                        <a
                            href="/#servicios"
                            className="nav-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            Servicios
                        </a>
                        <a
                            href="/#proceso"
                            className="nav-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            Proceso
                        </a>
                        <a
                            href="/#contacto"
                            className="nav-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            Contacto
                        </a>
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
