import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
    Smartphone,
    Laptop,
    Monitor,
    Gamepad2,
    Watch,
    Tablet,
    Wrench,
    ClipboardList,
    Search,
    CheckCircle,
    Truck,
    Star,
    MapPin,
    Phone,
    Mail,
    Clock,
    Shield,
    Zap,
    Users,
    Award,
    ArrowRight,
    ChevronRight
} from 'lucide-react';
import heroImage from '../assets/images/hero_visual.png';
import './LandingPage.css';

export default function LandingPage() {
    const { isAuthenticated, isAdmin } = useAuth();

    const services = [
        { icon: Smartphone, title: 'Celulares', description: 'Pantallas, baterías, puertos de carga, cámaras y más', color: '#DA0037' },
        { icon: Laptop, title: 'Laptops', description: 'Pantallas, teclados, discos duros, memorias y más', color: '#2196F3' },
        { icon: Monitor, title: 'Computadoras', description: 'Mantenimiento, upgrades, formateo y reparaciones', color: '#4CAF50' },
        { icon: Gamepad2, title: 'Consolas', description: 'PlayStation, Xbox, Nintendo Switch y más', color: '#9C27B0' },
        { icon: Watch, title: 'Smartwatches', description: 'Baterías, pantallas y reparaciones generales', color: '#FF9800' },
        { icon: Tablet, title: 'Tablets', description: 'iPad, Samsung Tab, pantallas y baterías', color: '#00BCD4' }
    ];

    const processSteps = [
        { number: '01', icon: ClipboardList, title: 'Recepción', description: 'Traes tu dispositivo o solicitas una cotización en línea' },
        { number: '02', icon: Search, title: 'Diagnóstico', description: 'Evaluamos tu equipo y te damos un presupuesto exacto' },
        { number: '03', icon: Wrench, title: 'Reparación', description: 'Nuestros técnicos expertos reparan tu dispositivo' },
        { number: '04', icon: Truck, title: 'Entrega', description: 'Recibes tu equipo funcionando y con garantía' }
    ];

    // Features are displayed inline using stats, confidenceMetrics, and commonIssues

    const testimonials = [
        { name: 'María García', text: 'Excelente servicio, repararon mi iPhone en menos de 2 horas. Muy recomendados!', rating: 5, device: 'iPhone 15 Pro' },
        { name: 'Carlos Rodríguez', text: 'Mi MacBook quedó impecable. Precios transparentes y trato profesional.', rating: 5, device: 'MacBook Pro M2' },
        { name: 'Ana Martínez', text: 'La mejor experiencia en servicio técnico. Sin duda los expertos en la ciudad.', rating: 5, device: 'Samsung Galaxy S24 Ultra' }
    ];

    const confidenceMetrics = [
        { icon: Shield, title: 'Protección Total', description: 'Garantía por escrito en cada reparación' },
        { icon: Zap, title: 'Servicio Express', description: 'Diagnóstico en menos de 2 horas' },
        { icon: Award, title: 'Calidad Premium', description: 'Refacciones certificadas y originales' }
    ];

    const stats = [
        { value: '5,000+', label: 'Dispositivos reparados' },
        { value: '98%', label: 'Clientes satisfechos' },
        { value: '30', label: 'Días de garantía' },
        { value: '24h', label: 'Tiempo promedio' }
    ];

    const commonIssues = [
        { title: 'Pantalla Rota', category: 'Smartphone', icon: Smartphone },
        { title: 'Batería Agotada', category: 'Universal', icon: Zap },
        { title: 'Sobrecalentamiento', category: 'Laptop/PC', icon: Laptop },
        { title: 'Daño por Agua', category: 'Universal', icon: Truck },
        { title: 'Puerto de Carga', category: 'Smartphone', icon: Smartphone },
        { title: 'Software/Virus', category: 'PC/Laptop', icon: Shield }
    ];

    return (
        <div className="landing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-pattern"></div>
                </div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Wrench size={16} />
                            <span>Servicio Técnico Profesional</span>
                        </div>
                        <h1 className="hero-title">
                            Expertos en <span className="text-gradient">Reparación</span> de Dispositivos
                        </h1>
                        <p className="hero-description">
                            Servicio técnico profesional para celulares, laptops, computadoras y consolas.
                            Diagnóstico rápido, precios justos y garantía en todas nuestras reparaciones.
                        </p>
                        <div className="hero-buttons">
                            <Link
                                to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard/nueva-cotizacion') : '/register'}
                                className="btn btn-primary btn-lg"
                            >
                                {isAuthenticated ? 'Solicitar Reparación' : 'Comenzar Ahora'}
                                <ArrowRight size={20} />
                            </Link>
                            <a href="#servicios" className="btn btn-outline btn-lg">
                                Ver Servicios
                            </a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-image-wrapper">
                            <img src={heroImage} alt="Device Repair" className="hero-main-image" />
                            <div className="glass-overlay"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="stats-bar">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Confidence Section */}
            <section className="confidence-section">
                <div className="container">
                    <div className="confidence-grid">
                        {confidenceMetrics.map((metric, index) => (
                            <div key={index} className="confidence-card">
                                <div className="confidence-icon">
                                    <metric.icon size={24} />
                                </div>
                                <div className="confidence-text">
                                    <h4>{metric.title}</h4>
                                    <p>{metric.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Common Issues Section */}
            <section className="section issues-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Problemas Comunes</span>
                        <h2>¿Qué le pasa a tu <span className="text-gradient">equipo</span>?</h2>
                        <p>Resolvemos los fallos más habituales en tiempo récord</p>
                    </div>
                    <div className="issues-grid">
                        {commonIssues.map((issue, index) => (
                            <div key={index} className="issue-card">
                                <div className="issue-icon">
                                    <issue.icon size={24} />
                                </div>
                                <div className="issue-info">
                                    <span className="issue-category">{issue.category}</span>
                                    <h4>{issue.title}</h4>
                                </div>
                                <ArrowRight size={18} className="issue-arrow" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicios" className="section services-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Nuestros Servicios</span>
                        <h2>Reparamos <span className="text-gradient">Todo Tipo</span> de Dispositivos</h2>
                        <p>Servicio técnico especializado con la mejor calidad y garantía</p>
                    </div>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card" style={{ '--accent-color': service.color }}>
                                <div className="service-icon">
                                    <service.icon size={32} />
                                </div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                                <Link to={isAuthenticated ? '/dashboard/nueva-cotizacion' : '/register'} className="service-link">
                                    Cotizar <ChevronRight size={16} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section id="proceso" className="section process-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Cómo Funciona</span>
                        <h2>Proceso <span className="text-gradient">Simple</span> y Transparente</h2>
                        <p>Cuatro sencillos pasos para reparar tu dispositivo</p>
                    </div>
                    <div className="process-timeline">
                        <div className="timeline-line"></div>
                        {processSteps.map((step, index) => (
                            <div key={index} className="process-step">
                                <div className="step-marker">
                                    <div className="step-number">{step.number}</div>
                                    <div className="step-icon">
                                        <step.icon size={24} />
                                    </div>
                                </div>
                                <div className="step-content">
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="section testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Testimonios</span>
                        <h2>Lo que dicen <span className="text-gradient">nuestros clientes</span></h2>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="testimonial-stars">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={18} fill="#FFD700" color="#FFD700" />
                                    ))}
                                </div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className="author-info">
                                        <span className="author-name">{testimonial.name}</span>
                                        <span className="author-device">{testimonial.device}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2>¿Tu dispositivo necesita reparación?</h2>
                            <p>Solicita una cotización gratuita y recibe respuesta en menos de 24 horas</p>
                            <Link
                                to={isAuthenticated ? '/dashboard/nueva-cotizacion' : '/register'}
                                className="btn btn-cta btn-lg"
                            >
                                Solicitar Cotización Gratis
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                        <div className="cta-visual">
                            <div className="cta-icon">
                                <Smartphone size={64} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contacto" className="section contact-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Contacto</span>
                        <h2>Visítanos o <span className="text-gradient">Contáctanos</span></h2>
                    </div>
                    <div className="contact-grid">
                        <div className="contact-card">
                            <div className="contact-icon">
                                <MapPin size={24} />
                            </div>
                            <h4>Dirección</h4>
                            <p>Av. Principal #123, Ciudad</p>
                        </div>
                        <div className="contact-card">
                            <div className="contact-icon">
                                <Phone size={24} />
                            </div>
                            <h4>Teléfono</h4>
                            <p>(123) 456-7890</p>
                        </div>
                        <div className="contact-card">
                            <div className="contact-icon">
                                <Mail size={24} />
                            </div>
                            <h4>Email</h4>
                            <p>info@systeck.com</p>
                        </div>
                        <div className="contact-card">
                            <div className="contact-icon">
                                <Clock size={24} />
                            </div>
                            <h4>Horario</h4>
                            <p>Lun - Sáb: 9:00 AM - 7:00 PM</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <Wrench size={24} />
                                <span>Sys<span className="text-primary">-Teck</span></span>
                            </div>
                            <p>Servicio técnico profesional para todos tus dispositivos electrónicos.</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Servicios</h4>
                                <a href="#servicios">Celulares</a>
                                <a href="#servicios">Laptops</a>
                                <a href="#servicios">Consolas</a>
                            </div>
                            <div className="footer-column">
                                <h4>Empresa</h4>
                                <a href="#proceso">Cómo Funciona</a>
                                <a href="#contacto">Contacto</a>
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
