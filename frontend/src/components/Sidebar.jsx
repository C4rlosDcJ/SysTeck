import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Wrench,
    Home,
    FileText,
    ClipboardList,
    User,
    LogOut,
    LayoutDashboard,
    Users,
    Settings,
    PlusCircle,
    FileSpreadsheet,
    BarChart4,
    ShoppingCart,
    Receipt,
    Package,
    Search,
    Moon,
    Sun,
    ShoppingBag,
    ClipboardCheck
} from 'lucide-react';
import GlobalSearch from './common/GlobalSearch';
import './Sidebar.css';

export default function Sidebar({ isOpen, toggleMenu }) {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme, businessName, businessLogo } = useTheme();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);

    // Cmd+K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isAdmin) {
                    setSearchOpen(prev => !prev);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAdmin]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const clientLinks = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', exact: true },
        { to: '/dashboard/tienda', icon: ShoppingBag, label: 'Tienda' },
        { to: '/dashboard/pedidos', icon: Package, label: 'Mis Pedidos' },
        { to: '/dashboard/nueva-cotizacion', icon: FileText, label: 'Nueva Cotización' },
        { to: '/dashboard/reparaciones', icon: ClipboardList, label: 'Mis Reparaciones' },
        { to: '/dashboard/perfil', icon: User, label: 'Mi Perfil' },
    ];

    const adminLinks = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { type: 'separator', label: 'Operaciones' },
        { to: '/admin/reparaciones', icon: Wrench, label: 'Reparaciones' },
        { to: '/admin/nueva-reparacion', icon: PlusCircle, label: 'Nueva Reparación' },
        { to: '/admin/clientes', icon: Users, label: 'Clientes' },
        { to: '/admin/servicios', icon: FileSpreadsheet, label: 'Servicios' },
        { type: 'separator', label: 'Ventas' },
        { to: '/admin/pos', icon: ShoppingCart, label: 'Punto de Venta' },
        { to: '/admin/ventas', icon: Receipt, label: 'Historial Ventas' },
        { to: '/admin/inventario', icon: Package, label: 'Inventario' },
        { type: 'separator', label: 'Administración' },
        { to: '/admin/reportes', icon: BarChart4, label: 'Reportes' },
        { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    ];

    const links = isAdmin ? adminLinks : clientLinks;

    // Split business name to color secondary parts (e.g. Sys-Teck -> Sys & -Teck)
    const renderBusinessName = () => {
        if (!businessName) return 'Sys-Teck';
        if (businessName.includes('-')) {
            const parts = businessName.split('-');
            return <>{parts[0]}<span className="text-primary">-{parts.slice(1).join('-')}</span></>;
        }
        if (businessName.includes(' ')) {
            const parts = businessName.split(' ');
            return <>{parts[0]} <span className="text-primary">{parts.slice(1).join(' ')}</span></>;
        }
        // If single word, split in half to create stylized visual contrast
        const mid = Math.ceil(businessName.length / 2);
        return <>{businessName.substring(0, mid)}<span className="text-primary">{businessName.substring(mid)}</span></>;
    };

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {businessLogo ? (
                            <img src={businessLogo} alt="Logo" className="logo-img-sidebar" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                        ) : (
                            <Wrench size={24} className="logo-icon" />
                        )}
                        <span className="logo-text">{renderBusinessName()}</span>
                    </div>
                </div>

                {isAdmin && (
                    <div className="sidebar-search-trigger" onClick={() => setSearchOpen(true)}>
                        <Search size={18} />
                        <span>Buscar...</span>
                        <kbd className="search-kbd">⌘K</kbd>
                    </div>
                )}

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {links.map((link, idx) => (
                            link.type === 'separator' ? (
                                <li key={`sep-${idx}`} className="nav-separator">
                                    <span>{link.label}</span>
                                </li>
                            ) : (
                                <li key={link.to}>
                                    <NavLink
                                        to={link.to}
                                        end={link.exact}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            if (window.innerWidth <= 900) toggleMenu();
                                        }}
                                    >
                                        <link.icon size={20} className="nav-icon" />
                                        <span className="nav-label">{link.label}</span>
                                    </NavLink>
                                </li>
                            )
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="theme-toggle-container" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button onClick={toggleTheme} className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                            {theme === 'light' ? (
                                <><Moon size={18} /> <span>Modo Oscuro</span></>
                            ) : (
                                <><Sun size={18} /> <span>Modo Claro</span></>
                            )}
                        </button>
                    </div>
                    <div className="user-info">
                        <div className="sidebar-user-avatar">
                            {user?.first_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.first_name} {user?.last_name}</span>
                            <span className="user-role">
                                {isAdmin ? 'Administrador' : 'Cliente'}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span>Salir</span>
                    </button>
                </div>
            </aside>

            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}
