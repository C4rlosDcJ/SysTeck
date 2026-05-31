import { Menu, X, Wrench } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './MobileHeader.css';

export default function MobileHeader({ isOpen, toggleMenu }) {
    const { businessLogo, businessName } = useTheme();

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
        <header className="mobile-header">
            <div className="mobile-header-left">
                <button
                    className="menu-toggle-btn"
                    onClick={toggleMenu}
                    aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="mobile-logo">
                    {businessLogo ? (
                        <img src={businessLogo} alt="Logo" className="logo-img-mobile" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                        <Wrench size={20} className="logo-icon" />
                    )}
                    <span className="logo-text">{renderBusinessName()}</span>
                </div>
            </div>
            <div className="mobile-header-right">
                {/* Posibilidad de añadir notificaciones o perfil aquí en el futuro */}
            </div>
        </header>
    );
}
