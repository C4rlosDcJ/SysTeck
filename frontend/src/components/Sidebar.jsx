import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    BarChart4
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, toggleMenu }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const clientLinks = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', exact: true },
        { to: '/dashboard/nueva-cotizacion', icon: FileText, label: 'Nueva Cotización' },
        { to: '/dashboard/reparaciones', icon: ClipboardList, label: 'Mis Reparaciones' },
        { to: '/dashboard/perfil', icon: User, label: 'Mi Perfil' },
    ];

    const adminLinks = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/admin/reparaciones', icon: Wrench, label: 'Reparaciones' },
        { to: '/admin/clientes', icon: Users, label: 'Clientes' },
        { to: '/admin/servicios', icon: FileSpreadsheet, label: 'Servicios' },
        { to: '/admin/reportes', icon: BarChart4, label: 'Reportes' },
        { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
        { to: '/admin/nueva-reparacion', icon: PlusCircle, label: 'Nueva Reparación' },
    ];

    const links = isAdmin ? adminLinks : clientLinks;

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Wrench size={24} className="logo-icon" />
                        <span className="logo-text">Sys<span className="text-primary">-Teck</span></span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {links.map((link) => (
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
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
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
        </>
    );
}
