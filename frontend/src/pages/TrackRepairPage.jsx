import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicService } from '../services/api';
import { STATUS_LABELS, formatDate, formatDateTime } from '../utils/constants';
import {
    Search, Smartphone, Clock, Calendar, CheckCircle2, ChevronLeft,
    AlertCircle, ShieldCheck, Share2, Copy, Send
} from 'lucide-react';
import './TrackRepairPage.css';

export default function TrackRepairPage() {
    const navigate = useNavigate();
    const [ticket, setTicket] = useState('');
    const [loading, setLoading] = useState(false);
    const [repair, setRepair] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!ticket.trim()) return;

        setLoading(true);
        setError(null);
        setRepair(null);

        try {
            const data = await publicService.trackRepair(ticket);
            setRepair(data);
        } catch (err) {
            setError(err.message || 'No se encontró la reparación o el ticket es incorrecto.');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = (status) => {
        switch (status) {
            case 'received': return 0;
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
        return currentMapped === step;
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

    return (
        <div className="track-page">
            <div className="track-hero">
                <div className="container">
                    <button className="btn-back-landing" onClick={() => navigate('/')}>
                        <ChevronLeft size={16} /> Volver al Inicio
                    </button>
                    <h1>Sigue tu Reparación</h1>
                    <p>Introduce tu número de ticket para conocer el estado de tu dispositivo en tiempo real.</p>
                    
                    <div className="track-search-wrapper">
                        <form onSubmit={handleSearch} className="track-search-box">
                            <div className="search-icon-track">
                                <Search size={20} />
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
                            <div className="track-error-msg">
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
                        <div className="device-icon-circle">
                            <Smartphone size={28} />
                        </div>
                        <div className="device-header-info">
                            <h2>
                                {repair.brand_name === 'Otro' ? repair.brand_other : repair.brand_name} {repair.model}
                            </h2>
                            <div>
                                <span className="ticket-tag">TICKET: {repair.ticket_number}</span>
                            </div>
                        </div>
                        <div className="device-header-meta">
                            <span className="delivery-est">
                                <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                Entrega Estimada: <strong>{formatDate(repair.estimated_delivery)}</strong>
                            </span>
                            {repair.status === 'delivered' && repair.warranty_expires && (
                                <span className="warranty-tag">
                                    <ShieldCheck size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                    Garantía activa hasta: {formatDate(repair.warranty_expires)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Timeline Progress */}
                    <div className="track-timeline">
                        <h3>Progreso de Reparación</h3>
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
                                            {completed ? <CheckCircle2 size={18} /> : idx + 1}
                                        </div>
                                        <span className={`step-label ${active ? 'active-label' : ''} ${completed ? 'completed-label' : ''}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Status detail */}
                        <div className="status-current-box">
                            <p>Estado actual: <strong>{STATUS_LABELS[repair.status] || repair.status}</strong></p>
                        </div>
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
                                            <span>Por: {note.first_name}</span> &bull; <span>{formatDateTime(note.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="track-actions">
                        <button className="btn-secondary" onClick={handleCopyLink}>
                            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            {copied ? 'Copiado' : 'Copiar enlace'}
                        </button>
                        <button className="btn-primary" onClick={handleShareWhatsApp}>
                            <Share2 size={16} /> Compartir por WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
