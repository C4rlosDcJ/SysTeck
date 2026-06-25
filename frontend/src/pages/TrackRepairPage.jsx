import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicService } from '../services/api';
import Navbar from '../components/Navbar';
import { STATUS_LABELS, STATUS_COLORS, formatDate, formatDateTime } from '../utils/constants';
import {
    Search, Smartphone, Clock, Calendar, CheckCircle2, ChevronLeft,
    AlertCircle, ShieldCheck, Share2, Copy, Package, Wrench, AlertTriangle, User,
    Check
} from 'lucide-react';
import './TrackRepairPage.css';

export default function TrackRepairPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [ticket, setTicket] = useState('');
    const [loading, setLoading] = useState(false);
    const [repair, setRepair] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Auto-buscar si viene en la URL
    useEffect(() => {
        const urlTicket = searchParams.get('ticket');
        if (urlTicket) {
            setTicket(urlTicket);
            fetchRepair(urlTicket);
        }
    }, [searchParams]);

    const fetchRepair = async (ticketCode) => {
        setLoading(true);
        setError(null);
        setRepair(null);

        try {
            const data = await publicService.trackRepair(ticketCode);
            setRepair(data);
        } catch (err) {
            setError(err.message || 'No se encontró la reparación o el ticket es incorrecto.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (!ticket.trim()) return;

        // Actualiza el parámetro en la URL para permitir compartir el link directamente
        setSearchParams({ ticket: ticket.trim().toUpperCase() });
    };

    const getProgressPercentage = (status) => {
        switch (status) {
            case 'received': return 5;
            case 'diagnosing': return 25;
            case 'waiting_approval':
            case 'waiting_parts': return 35;
            case 'repairing':
            case 'quality_check': return 60;
            case 'ready': return 85;
            case 'delivered': return 100;
            case 'cancelled': return 100;
            default: return 0;
        }
    };

    const isStepActive = (step, currentStatus) => {
        const statusMap = {
            'received': 'received',
            'diagnosing': 'diagnosing',
            'waiting_approval': 'diagnosing',
            'waiting_parts': 'diagnosing',
            'repairing': 'repairing',
            'quality_check': 'repairing',
            'ready': 'ready',
            'delivered': 'delivered',
            'cancelled': 'delivered'
        };
        return (statusMap[currentStatus] || currentStatus) === step;
    };

    const isStepCompleted = (step, currentStatus) => {
        const order = ['received', 'diagnosing', 'repairing', 'ready', 'delivered'];
        const statusMap = {
            'received': 'received',
            'diagnosing': 'diagnosing',
            'waiting_approval': 'diagnosing',
            'waiting_parts': 'diagnosing',
            'repairing': 'repairing',
            'quality_check': 'repairing',
            'ready': 'ready',
            'delivered': 'delivered',
            'cancelled': 'delivered'
        };
        const currentMapped = statusMap[currentStatus] || currentStatus;
        const currentIndex = order.indexOf(currentMapped);
        const stepIndex = order.indexOf(step);
        return stepIndex < currentIndex;
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/rastrear?ticket=${encodeURIComponent(repair.ticket_number)}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const text = `Hola, puedes seguir el estado de tu reparación con ticket *${repair.ticket_number}* aquí: ${window.location.origin}/rastrear?ticket=${encodeURIComponent(repair.ticket_number)}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const getPriorityLabel = (priority) => {
        const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
        return priorityLabels[priority] || priority;
    };

    const getStepIcon = (stepId, size = 20) => {
        switch (stepId) {
            case 'received': return <Package size={size} />;
            case 'diagnosing': return <Search size={size} />;
            case 'repairing': return <Wrench size={size} />;
            case 'ready': return <CheckCircle2 size={size} />;
            case 'delivered': return <ShieldCheck size={size} />;
            default: return null;
        }
    };

    return (
        <div className="track-page">
            <Navbar />
            <div className="track-hero">
                <div className="container">
                    <h1>Sigue tu Reparación</h1>
                    <p>Introduce tu número de ticket para conocer el estado de tu dispositivo en tiempo real.</p>
                    
                    <div className="track-search-wrapper">
                        <form onSubmit={handleSearch} className="track-search-box">
                            <div className="search-icon-track">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Escribe tu número de ticket (ej. ST-1001)..."
                                value={ticket}
                                onChange={(e) => setTicket(e.target.value)}
                            />
                            <button type="submit" className="track-btn" disabled={loading}>
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </form>
                        {error && (
                            <div className="track-error-msg animate-shake">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="track-loading">
                    <div className="spinner"></div>
                    <p>Consultando el estado de tu reparación...</p>
                </div>
            )}

            {repair && !loading && (
                <div className="track-result">
                    {/* Device Header Card */}
                    <div className="device-header-card">
                        <div className="device-icon-circle animate-pulse-light">
                            <Smartphone size={32} />
                        </div>
                        <div className="device-header-info">
                            <span className="device-type-label">{repair.device_type_name || 'Dispositivo'}</span>
                            <h2>
                                {repair.brand_name === 'Otro' ? repair.brand_other : repair.brand_name} {repair.model}
                            </h2>
                            <div className="ticket-badges">
                                <span className="ticket-tag">TICKET: {repair.ticket_number}</span>
                                {repair.priority && (
                                    <span className={`priority-tag priority-${repair.priority}`}>
                                        Prioridad: {getPriorityLabel(repair.priority)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="device-header-meta">
                            <div className="status-badge" style={{ backgroundColor: `${STATUS_COLORS[repair.status] || '#6b7280'}22`, color: STATUS_COLORS[repair.status] || '#6b7280', border: `1px solid ${STATUS_COLORS[repair.status]}44` }}>
                                <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[repair.status] }} />
                                {STATUS_LABELS[repair.status] || repair.status}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Progress */}
                    <div className="track-timeline">
                        <div className="timeline-header">
                            <h3>Progreso de Reparación</h3>
                            <span className="delivery-est-banner">
                                <Clock size={15} />
                                Entrega Estimada: <strong>{formatDate(repair.estimated_delivery)}</strong>
                            </span>
                        </div>
                        
                        <div className="progress-steps">
                            <div 
                                className="progress-line" 
                                style={{ width: `${getProgressPercentage(repair.status)}%` }}
                            ></div>
                            
                            {[
                                { id: 'received', label: 'Recibido' },
                                { id: 'diagnosing', label: 'Diagnóstico' },
                                { id: 'repairing', label: 'En Reparación' },
                                { id: 'ready', label: 'Listo' },
                                { id: 'delivered', label: 'Entregado' }
                            ].map((step, idx) => {
                                const active = isStepActive(step.id, repair.status);
                                const completed = isStepCompleted(step.id, repair.status);
                                return (
                                    <div key={step.id} className="progress-step">
                                        <div className={`step-circle ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}>
                                            {completed ? <Check size={20} strokeWidth={3} /> : getStepIcon(step.id)}
                                        </div>
                                        <span className={`step-label ${active ? 'active-label' : ''} ${completed ? 'completed-label' : ''}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {repair.status === 'cancelled' && (
                            <div className="cancelled-banner animate-fade-in">
                                <AlertTriangle size={20} />
                                <div>
                                    <strong>Reparación Cancelada</strong>
                                    <p>Esta orden de servicio ha sido cancelada. Ponte en contacto con nosotros para mayor información.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details and History Grid */}
                    <div className="track-details-grid">
                        {/* Info details */}
                        <div className="details-card card-half">
                            <h3>Detalles del Servicio</h3>
                            <div className="detail-row">
                                <span className="detail-label">Fecha de Ingreso</span>
                                <span className="detail-value">{formatDate(repair.created_at)}</span>
                            </div>
                            {repair.started_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Inicio de Trabajo</span>
                                    <span className="detail-value">{formatDate(repair.started_at)}</span>
                                </div>
                            )}
                            {repair.completed_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Finalizado el</span>
                                    <span className="detail-value">{formatDate(repair.completed_at)}</span>
                                </div>
                            )}
                            {repair.delivered_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Entregado el</span>
                                    <span className="detail-value">{formatDate(repair.delivered_at)}</span>
                                </div>
                            )}
                            {repair.warranty_expires && (
                                <div className="detail-row warranty-highlight">
                                    <span className="detail-label">Garantía Vence</span>
                                    <span className="detail-value highlight-text">
                                        <ShieldCheck size={16} /> {formatDate(repair.warranty_expires)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Problem Card */}
                        {repair.problem_description && (
                            <div className="details-card card-half problem-card">
                                <h3>Falla Reportada</h3>
                                <p className="problem-text">{repair.problem_description}</p>
                            </div>
                        )}
                    </div>

                    {/* Notes (Client viewable notes) */}
                    {repair.notes && repair.notes.length > 0 && (
                        <div className="track-notes">
                            <h3>Historial de Actualizaciones</h3>
                            <div className="track-notes-list">
                                {repair.notes.map((note, index) => (
                                    <div key={index} className="track-note-item">
                                        <p>{note.note}</p>
                                        <div className="note-meta">
                                            <span><User size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {note.first_name}</span> &bull; <span>{formatDateTime(note.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="track-actions">
                        <button className="btn-secondary share-btn" onClick={handleCopyLink}>
                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            {copied ? '¡Copiado!' : 'Copiar Enlace de Seguimiento'}
                        </button>
                        <button className="btn-primary share-btn whatsapp-btn" onClick={handleShareWhatsApp}>
                            <Share2 size={18} /> Compartir por WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
