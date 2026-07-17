import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import {
    Smartphone, Laptop, Monitor, Gamepad2, Watch, Tablet, Wrench,
    ClipboardList, Search, Truck, Star, MapPin, Phone,
    Mail, Clock, Shield, Zap, Award, ArrowRight, ChevronRight,
    Cpu, Sparkles
} from 'lucide-react';
import heroImage from '../assets/images/hero_visual.png';
import './LandingPage.css';

const ICON_MAP = {
    smartphone: Smartphone,
    phone: Smartphone,
    laptop: Laptop,
    monitor: Monitor,
    desktop: Monitor,
    gamepad: Gamepad2,
    console: Gamepad2,
    watch: Watch,
    smartwatch: Watch,
    tablet: Tablet,
    wrench: Wrench,
    default: Wrench
};

// Hook para animar elementos al entrar en el viewport
function useScrollReveal() {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

// Componente wrapper para secciones animadas
function Reveal({ children, className = '', delay = 0 }) {
    const ref = useScrollReveal();
    return (
        <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

export default function LandingPage() {
    const { isAuthenticated, isAdmin } = useAuth();
    const {
        landingShowStats,
        landingShowWhy,
        landingShowServices,
        landingShowProcess,
        landingShowTestimonials,
        landingShowCTA,
        landingShowContact,
        contactAddress,
        contactSchedule,
        contactPhone,
        contactEmail,
        defaultWarrantyDays,
        landingServices,
        landingTestimonials
    } = useTheme();
    const navigate = useNavigate();
    const [quickTicket, setQuickTicket] = useState('');

    const handleQuickTrack = (e) => {
        e.preventDefault();
        if (quickTicket.trim()) {
            navigate(`/rastrear?ticketId=${encodeURIComponent(quickTicket.trim().toUpperCase())}`);
        }
    };

    const processSteps = [
        { number: '01', icon: ClipboardList, title: 'Recepción', description: 'Traes tu dispositivo o solicitas una cotización en línea.' },
        { number: '02', icon: Search, title: 'Diagnóstico', description: 'Evaluamos tu equipo y te damos un presupuesto exacto.' },
        { number: '03', icon: Wrench, title: 'Reparación', description: 'Nuestros técnicos expertos reparan tu dispositivo.' },
        { number: '04', icon: Truck, title: 'Entrega', description: 'Recibes tu equipo funcionando con garantía incluida.' }
    ];

    const whyUs = [
        { icon: Shield, title: 'Garantía Real', description: 'Todas nuestras reparaciones incluyen garantía por escrito. Si algo falla, lo resolvemos sin costo.' },
        { icon: Zap, title: 'Rapidez Comprobada', description: 'Diagnóstico en menos de 2 horas. La mayoría de reparaciones se completan el mismo día.' },
        { icon: Award, title: 'Piezas Originales', description: 'Trabajamos exclusivamente con refacciones certificadas y de máxima calidad.' },
        { icon: Cpu, title: 'Técnicos Certificados', description: 'Nuestro equipo cuenta con certificaciones y años de experiencia profesional.' }
    ];

    return (
        <div className="landing-page">
            <Navbar />

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-ambient"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-badge anim-hero-1">
                            <Sparkles size={16} />
                            <span>Centro de Servicio Tecnico</span>
                        </div>

                        <h1 className="hero-title anim-hero-2">
                            Reparacion profesional para <span className="text-accent">todos tus dispositivos</span>
                        </h1>

                        <p className="hero-description anim-hero-3">
                            Diagnostico express, refacciones originales y garantia por escrito en cada servicio.
                            Celulares, laptops, consolas, tablets y mas.
                        </p>

                        <div className="hero-buttons anim-hero-4">
                            <Link
                                to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard/nueva-cotizacion') : '/register'}
                                className="btn btn-primary btn-lg"
                            >
                                {isAuthenticated ? 'Solicitar Reparación' : 'Crear Cuenta'}
                                <ArrowRight size={16} />
                            </Link>
                            <a href="#servicios" className="btn btn-outline btn-lg">
                                Ver Servicios
                            </a>
                        </div>

                        <form onSubmit={handleQuickTrack} className="quick-track anim-hero-5">
                            <Search size={16} className="quick-track-icon" />
                            <input
                                type="text"
                                placeholder="Rastrear ticket (ej. ST-1001)"
                                value={quickTicket}
                                onChange={(e) => setQuickTicket(e.target.value)}
                            />
                            <button type="submit">Rastrear</button>
                        </form>
                    </div>

                    <div className="hero-visual anim-hero-img">
                        <div className="hero-image-wrapper">
                            <img src={heroImage} alt="Device Repair" className="hero-main-image" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            {landingShowStats && (
                <section className="stats-section">
                    <div className="container">
                        <div className="stats-grid">
                            {[
                                { value: '500+', label: 'Equipos Reparados' },
                                { value: '98%', label: 'Clientes Satisfechos' },
                                { value: `${defaultWarrantyDays || 30} Días`, label: 'Garantía Completa' },
                                { value: '<24h', label: 'Tiempo Promedio' }
                            ].map((stat, i) => (
                                <Reveal key={i} delay={i * 80}>
                                    <div className="stat-item">
                                        <span className="stat-value">{stat.value}</span>
                                        <span className="stat-label">{stat.label}</span>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── WHY US ── */}
            {landingShowWhy && (
                <section className="section why-section">
                    <div className="container">
                        <Reveal>
                            <div className="section-header">
                                <span className="section-tag">¿Por qué elegirnos?</span>
                                <h2>Confianza respaldada por <span className="text-accent">resultados</span></h2>
                            </div>
                        </Reveal>
                        <div className="why-grid">
                            {whyUs.map((item, i) => (
                                <Reveal key={i} delay={i * 100}>
                                    <div className="why-card">
                                        <div className="why-icon">
                                            <item.icon size={22} />
                                        </div>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── SERVICES ── */}
            {landingShowServices && (
                <section id="servicios" className="section services-section">
                    <div className="container">
                        <Reveal>
                            <div className="section-header">
                                <span className="section-tag">Especialidades</span>
                                <h2>Reparamos <span className="text-accent">todo tipo</span> de dispositivos</h2>
                                <p>Servicio técnico especializado con la mejor calidad y garantía.</p>
                            </div>
                        </Reveal>
                        <div className="services-grid">
                            {landingServices.map((service, i) => {
                                const ServiceIcon = ICON_MAP[service.icon?.toLowerCase()] || Wrench;
                                return (
                                    <Reveal key={i} delay={i * 80}>
                                        <div className="service-card" style={{ '--accent': service.color }}>
                                            <div className="service-icon-wrap">
                                                <ServiceIcon size={24} />
                                            </div>
                                            <h3>{service.title}</h3>
                                            <p>{service.description}</p>
                                            <Link to={isAuthenticated ? '/dashboard/nueva-cotizacion' : '/register'} className="service-link">
                                                Cotizar <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── PROCESS ── */}
            {landingShowProcess && (
                <section id="proceso" className="section process-section">
                    <div className="container">
                        <Reveal>
                            <div className="section-header">
                                <span className="section-tag">Proceso</span>
                                <h2>Cuatro pasos, <span className="text-accent">cero complicaciones</span></h2>
                                <p>Te mantenemos informado en cada etapa del servicio.</p>
                            </div>
                        </Reveal>
                        <div className="process-grid">
                            {processSteps.map((step, i) => (
                                <Reveal key={i} delay={i * 120}>
                                    <div className="process-card">
                                        <div className="process-number">{step.number}</div>
                                        <div className="process-icon-wrap">
                                            <step.icon size={20} />
                                        </div>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── TESTIMONIALS ── */}
            {landingShowTestimonials && (
                <section className="section testimonials-section">
                    <div className="container">
                        <Reveal>
                            <div className="section-header">
                                <span className="section-tag">Clientes</span>
                                <h2>Lo que opinan de <span className="text-accent">nuestro servicio</span></h2>
                            </div>
                        </Reveal>
                        <div className="testimonials-grid">
                            {landingTestimonials.map((t, i) => (
                                <Reveal key={i} delay={i * 100}>
                                    <div className="testimonial-card">
                                        <div className="testimonial-stars">
                                            {[...Array(t.rating || 5)].map((_, j) => (
                                                <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                                            ))}
                                        </div>
                                        <p className="testimonial-text">"{t.text}"</p>
                                        <div className="testimonial-author">
                                            <div className="author-avatar">{t.name ? t.name.charAt(0) : '?'}</div>
                                            <div>
                                                <span className="author-name">{t.name}</span>
                                                <span className="author-device">{t.device}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA ── */}
            {landingShowCTA && (
                <section className="section cta-section">
                    <div className="container">
                        <Reveal>
                            <div className="cta-card">
                                <div className="cta-content">
                                    <h2>¿Tu equipo necesita asistencia?</h2>
                                    <p>Cotiza gratis y recibe diagnóstico express el mismo día. Sin compromiso.</p>
                                    <Link
                                        to={isAuthenticated ? '/dashboard/nueva-cotizacion' : '/register'}
                                        className="btn btn-primary btn-lg"
                                    >
                                        Solicitar Cotización
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                                <div className="cta-visual">
                                    <div className="cta-icon-ring">
                                        <Smartphone size={40} />
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>
            )}

            {/* ── CONTACT ── */}
            {landingShowContact && (
                <section id="contacto" className="section contact-section">
                    <div className="container">
                        <Reveal>
                            <div className="section-header">
                                <span className="section-tag">Contacto</span>
                                <h2>Visítanos o <span className="text-accent">escríbenos</span></h2>
                            </div>
                        </Reveal>
                        <div className="contact-grid">
                            {[
                                { icon: MapPin, title: 'Ubicación', info: contactAddress },
                                { icon: Phone, title: 'Teléfono', info: contactPhone },
                                { icon: Mail, title: 'Correo', info: contactEmail },
                                { icon: Clock, title: 'Horario', info: contactSchedule }
                            ].map((c, i) => (
                                <Reveal key={i} delay={i * 80}>
                                    <div className="contact-card">
                                        <div className="contact-icon-wrap">
                                            <c.icon size={20} />
                                        </div>
                                        <h4>{c.title}</h4>
                                        <p>{c.info}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <Wrench size={22} />
                                <span>Sys<span className="text-primary">-Teck</span></span>
                            </div>
                            <p>Servicio técnico profesional para todos tus dispositivos electrónicos.</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-col">
                                <h4>Servicios</h4>
                                <a href="#servicios">Celulares</a>
                                <a href="#servicios">Laptops</a>
                                <a href="#servicios">Consolas</a>
                            </div>
                            <div className="footer-col">
                                <h4>Empresa</h4>
                                <a href="#proceso">Proceso</a>
                                <a href="#contacto">Contacto</a>
                                <Link to="/rastrear">Rastrear</Link>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 SysTeck. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
