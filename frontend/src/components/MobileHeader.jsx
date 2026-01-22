import { Menu, X, Wrench } from 'lucide-react';
import './MobileHeader.css';

export default function MobileHeader({ isOpen, toggleMenu }) {
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
                    <Wrench size={20} className="logo-icon" />
                    <span className="logo-text">Sis<span className="text-primary">-Tec</span></span>
                </div>
            </div>
            <div className="mobile-header-right">
                {/* Posibilidad de añadir notificaciones o perfil aquí en el futuro */}
            </div>
        </header>
    );
}
