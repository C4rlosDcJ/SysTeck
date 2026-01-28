import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repairService, userService, BACKEND_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Wrench,
    Calendar,
    User,
    Clock,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Smartphone,
    CreditCard,
    ShieldCheck,
    Send,
    Plus,
    X,
    Image as ImageIcon,
    DollarSign,
    Save as SaveIcon,
    ClipboardCheck,
    Printer,
    PenTool
} from 'lucide-react';
import SignatureModal from '../../components/common/SignatureModal';
import { generateServiceTicket } from '../../utils/pdfGenerator';
import './RepairDetailPage.css';

const statusLabels = {
    received: 'Recibido',
    diagnosing: 'En Diagnóstico',
    waiting_approval: 'Esperando Aprobación',
    waiting_parts: 'Esperando Refacciones',
    repairing: 'En Reparación',
    quality_check: 'Control de Calidad',
    ready: 'Listo para Entrega',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

// Status colors are managed via CSS classes .status-{status}

export default function RepairDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();
    const [repair, setRepair] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicians, setTechnicians] = useState([]);

    // Form states for admin
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [warrantyDays, setWarrantyDays] = useState(30);
    const [costs, setCosts] = useState({
        diagnosis_cost: 0,
        labor_cost: 0,
        parts_cost: 0,
        discount: 0
    });
    const [isEditingCosts, setIsEditingCosts] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Estados para firma
    const [showSigModal, setShowSigModal] = useState(false);
    const [sigType, setSigType] = useState(null); // 'approval' | 'delivery'

    // Estados de edición admin
    const [isEditingTechnical, setIsEditingTechnical] = useState(false);
    const [technicalData, setTechnicalData] = useState({
        battery_health: '',
        screen_status: '',
        account_status: '',
        technical_observations: '',
        physical_condition: 5,
        accessories_received: '',
        existing_damage: '',
        technician_id: '',
        model: '',
        color: '',
        imei: '',
        serial_number: '',
        storage_capacity: '',
        device_password: '',
        problem_description: '',
        priority: 'normal',
        service_requested: '',
        estimated_delivery: ''
    });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Form states for images (handled via dynamic import)

    // Form states for notes
    const [noteText, setNoteText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [addingNote, setAddingNote] = useState(false);

    const [settings, setSettings] = useState({});

    useEffect(() => {
        const loadData = async () => {
            await fetchRepairData();
            await fetchTechnicians();
            await fetchSettings();
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchSettings = async () => {
        try {
            // Asumimos que hay un servicio settingsService disponible via api.js. 
            // Si no está exportado globalmente, lo importamos.
            // Verificamos si settingsService existe en el import de api.js
            // En caso que no, usamos fetchAPI directo si es necesario, pero settingsService ya está en api.js
            const data = await import('../../services/api').then(m => m.settingsService.getAll());
            setSettings(data);
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const data = await userService.getTechnicians();
            setTechnicians(data || []);
        } catch (err) {
            console.error('Error fetching technicians:', err);
        }
    };

    const fetchRepairData = async () => {
        try {
            setLoading(true);
            const data = await repairService.getById(id);
            setRepair(data);
            setNewStatus(data.status);
            setWarrantyDays(data.warranty_days);
            setCosts({
                diagnosis_cost: data.diagnosis_cost || 0,
                labor_cost: data.labor_cost || 0,
                parts_cost: data.parts_cost || 0,
                discount: data.discount || 0
            });
            setTechnicalData({
                battery_health: data.battery_health || '',
                screen_status: data.screen_status || '',
                account_status: data.account_status || '',
                technical_observations: data.technical_observations || '',
                physical_condition: data.physical_condition || 5,
                accessories_received: data.accessories_received || '',
                existing_damage: data.existing_damage || '',
                technician_id: data.technician_id || '',
                model: data.model || '',
                color: data.color || '',
                imei: data.imei || '',
                serial_number: data.serial_number || '',
                storage_capacity: data.storage_capacity || '',
                device_password: data.device_password || '',
                problem_description: data.problem_description || '',
                priority: data.priority || 'normal',
                service_requested: data.service_requested || '',
                estimated_delivery: data.estimated_delivery ? data.estimated_delivery.split('T')[0] : ''
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching repair:', err);
            setError('No se pudo cargar la información de la reparación.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignatureSave = async (signatureData) => {
        setShowSigModal(false);
        try {
            setUpdatingStatus(true);
            console.log('Sending signature data length:', signatureData.length);

            if (sigType === 'approval') {
                const notes = 'Cotización aprobada por el cliente con firma';
                await repairService.updateStatus(id, 'repairing', notes, technicalData.estimated_delivery, signatureData);
                alert('¡Reparación aprobada correctamente!');
            } else if (sigType === 'delivery') {
                await repairService.updateStatus(id, 'delivered', 'Equipo entregado al cliente', null, signatureData);
                alert('¡Equipo entregado y garantía activada!');
            }

            await fetchRepairData();
        } catch (err) {
            console.error(err);
            alert('Error al guardar firma: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handlePrintTicket = () => {
        try {
            // Pasamos settings al generador
            generateServiceTicket(repair, settings);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('No se pudo generar el ticket. Por favor intenta de nuevo.');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();

        try {
            setUpdatingStatus(true);

            const updates = {};
            if (parseInt(warrantyDays) !== parseInt(repair.warranty_days)) {
                updates.warranty_days = warrantyDays;
            }

            if (isEditingCosts) {
                updates.diagnosis_cost = Number(costs.diagnosis_cost) || 0;
                updates.labor_cost = Number(costs.labor_cost) || 0;
                updates.parts_cost = Number(costs.parts_cost) || 0;
                updates.discount = Number(costs.discount) || 0;
            }

            if (isEditingTechnical) {
                updates.battery_health = technicalData.battery_health;
                updates.screen_status = technicalData.screen_status;
                updates.account_status = technicalData.account_status;
                updates.technical_observations = technicalData.technical_observations;
                updates.physical_condition = technicalData.physical_condition;
                updates.accessories_received = technicalData.accessories_received;
                updates.existing_damage = technicalData.existing_damage;
                updates.technician_id = technicalData.technician_id;
                updates.model = technicalData.model;
                updates.color = technicalData.color;
                updates.imei = technicalData.imei;
                updates.serial_number = technicalData.serial_number;
                updates.storage_capacity = technicalData.storage_capacity;
                updates.device_password = technicalData.device_password;
                updates.problem_description = technicalData.problem_description;
                updates.priority = technicalData.priority;
                updates.service_requested = technicalData.service_requested;
                updates.estimated_delivery = technicalData.estimated_delivery || null;
            }

            if (Object.keys(updates).length > 0) {
                await repairService.update(id, updates);
            }

            if (newStatus !== repair.status) {
                if (newStatus === 'delivered') {
                    setSigType('delivery');
                    setShowSigModal(true);
                    setIsEditingCosts(false);
                    setIsEditingTechnical(false);
                    setUpdatingStatus(false);
                    await fetchRepairData();
                    return;
                }

                await repairService.updateStatus(id, newStatus, statusNote);
                setStatusNote('');
            }

            setIsEditingCosts(false);
            setIsEditingTechnical(false);
            await fetchRepairData();
        } catch (err) {
            alert('Error al actualizar: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setUploadingImages(true);
            const { uploadService } = await import('../../services/api');
            await uploadService.uploadImages(id, files, 'during');
            await fetchRepairData();
        } catch (err) {
            alert('Error al subir imágenes: ' + err.message);
        } finally {
            setUploadingImages(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;
        try {
            const { uploadService } = await import('../../services/api');
            await uploadService.deleteImage(imageId);
            await fetchRepairData();
        } catch (err) {
            alert('Error al eliminar imagen: ' + err.message);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        try {
            setAddingNote(true);
            await repairService.addNote(id, noteText, isInternal);
            setNoteText('');
            setIsInternal(false);
            await fetchRepairData();
        } catch (err) {
            alert('Error al agregar nota: ' + err.message);
        } finally {
            setAddingNote(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'Pendiente';
        return new Date(date).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando información...</p>
            </div>
        );
    }

    if (error || !repair) {
        return (
            <div className="error-state">
                <AlertCircle size={48} color="var(--color-error)" />
                <h3>Error</h3>
                <p>{error || 'Reparación no encontrada'}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">Regresar</button>
            </div>
        );
    }

    return (
        <div className="repair-detail-container">
            <header className="repair-detail-header">
                <div className="header-main-info">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-sm">
                        <ChevronLeft size={16} /> Volver
                    </button>
                    <div className="flex items-center gap-md">
                        <h1>Detalle de Reparación</h1>
                        {(repair.status === 'ready' || repair.status === 'delivered') && (
                            <button onClick={handlePrintTicket} className="btn btn-sm" title="Imprimir Ticket">
                                <Printer size={18} />
                            </button>
                        )}
                        <span className={`status-badge status-${repair.status}`}>
                            {statusLabels[repair.status]}
                        </span>
                    </div>
                    <span className="ticket-id">{repair.ticket_number}</span>
                </div>

                {isAdmin && (
                    <div className="admin-actions card">
                        <h3>Actualizar Estado</h3>
                        <form onSubmit={handleUpdateStatus} className="status-update-form">
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="select"
                            >
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <textarea
                                placeholder="Nota sobre el cambio de estado (opcional)"
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                className="input"
                                rows="2"
                            ></textarea>

                            <div className="form-group">
                                <label className="info-label">Días de Garantía</label>
                                <input
                                    type="number"
                                    value={warrantyDays}
                                    onChange={(e) => setWarrantyDays(e.target.value)}
                                    className="input"
                                    min="0"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={updatingStatus || (
                                    newStatus === repair.status &&
                                    parseInt(warrantyDays) === parseInt(repair.warranty_days) &&
                                    !isEditingCosts &&
                                    !isEditingTechnical
                                )}
                            >
                                <SaveIcon size={16} /> {updatingStatus ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Notificación para aceptar cotización (SOLO CLIENTES) */}
                {repair.status === 'waiting_approval' && !isAdmin && (
                    <div className="approval-card detail-card">
                        <div className="approval-header">
                            <AlertCircle size={24} color="var(--color-warning)" />
                            <h3>Cotización Pendiente de Aprobación</h3>
                        </div>
                        <div className="approval-content">
                            <p>
                                El costo total estimado para tu reparación es de <strong>{formatCurrency(repair.total_cost)}</strong>.
                                Por favor revisa el detalle y confirma si deseas proceder.
                            </p>

                        </div>
                        <div className="approval-actions">
                            <button
                                className="btn-approve"
                                onClick={() => {
                                    setSigType('approval');
                                    setShowSigModal(true);
                                }}
                                disabled={updatingStatus}
                            >
                                <PenTool size={18} /> Firmar y Aprobar
                            </button>
                            <button
                                className="btn-reject"
                                onClick={async () => {
                                    if (window.confirm('¿Estás seguro de rechazar esta cotización? La reparación será cancelada.')) {
                                        try {
                                            setUpdatingStatus(true);
                                            await repairService.updateStatus(id, 'cancelled', 'Cotización rechazada por el cliente');
                                            await fetchRepairData();
                                        } catch (err) {
                                            alert('Error: ' + err.message);
                                        } finally {
                                            setUpdatingStatus(false);
                                        }
                                    }
                                }}
                                disabled={updatingStatus}
                            >
                                <X size={18} /> Rechazar
                            </button>
                        </div>
                    </div>
                )}

                {/* Agendamiento de Recolección (SOLO CLIENTES - Status Ready) */}
                {repair.status === 'ready' && !isAdmin && (
                    <div className="approval-card detail-card" style={{ borderLeftColor: '#4CAF50' }}>
                        <div className="approval-header">
                            <CheckCircle2 size={24} color="#4CAF50" />
                            <h3 style={{ color: '#fff' }}>¡Tu equipo está listo!</h3>
                        </div>
                        <div className="approval-content">
                            <p>
                                Tu reparación ha sido completada exitosamente. Total a pagar: <strong>{formatCurrency(repair.total_cost - repair.advance_payment)}</strong>.
                                <br />
                                Por favor agenda el día que pasarás a recoger tu equipo.
                            </p>
                            <div className="mt-md">
                                <label className="info-label block mb-xs" style={{ color: '#e0e0e0' }}>Día de recolección:</label>
                                <div className="flex gap-sm items-end">
                                    <input
                                        type="date"
                                        className="input"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            maxWidth: '200px'
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        value={technicalData.estimated_delivery ? technicalData.estimated_delivery.split('T')[0] : ''}
                                        onChange={(e) => setTechnicalData(prev => ({ ...prev, estimated_delivery: e.target.value }))}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        style={{ background: '#4CAF50', borderColor: '#4CAF50' }}
                                        onClick={async () => {
                                            if (!technicalData.estimated_delivery) {
                                                alert('Por favor selecciona una fecha.');
                                                return;
                                            }
                                            try {
                                                setUpdatingStatus(true);
                                                // Enviamos status 'ready' para confirmar la fecha sin cambiar estado
                                                await repairService.updateStatus(id, 'ready', 'Cliente agendó recolección', technicalData.estimated_delivery);
                                                await fetchRepairData();
                                                alert('¡Cita agendada correctamente!');
                                            } catch (err) {
                                                alert('Error: ' + err.message);
                                            } finally {
                                                setUpdatingStatus(false);
                                            }
                                        }}
                                        disabled={updatingStatus}
                                    >
                                        Agendar Cita
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="repair-grid">
                <div className="main-content">
                    {/* Información del Dispositivo */}
                    <section className="detail-card">
                        <div className="flex justify-between items-center mb-md">
                            <h2 className="m-0"><Smartphone size={20} /> Información del Equipo</h2>
                            {(isAdmin || user.role === 'technician') && (
                                <button
                                    onClick={() => setIsEditingTechnical(!isEditingTechnical)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    {isEditingTechnical ? 'Cancelar' : 'Editar Información'}
                                </button>
                            )}
                        </div>
                        {/* ... (contenido de información del equipo sin cambios) ... */}
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Dispositivo</span>
                                <span className="info-value">{repair.device_type_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Marca/Modelo</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.model}
                                        onChange={(e) => setTechnicalData({ ...technicalData, model: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.brand_name || repair.brand_other} - {repair.model}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Color</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.color}
                                        onChange={(e) => setTechnicalData({ ...technicalData, color: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.color || 'N/A'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">IMEI / Serie</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.imei}
                                        onChange={(e) => setTechnicalData({ ...technicalData, imei: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.imei || repair.serial_number || 'N/A'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Capacidad</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.storage_capacity}
                                        onChange={(e) => setTechnicalData({ ...technicalData, storage_capacity: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.storage_capacity || 'N/A'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Contraseña / Patrón</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.device_password}
                                        onChange={(e) => setTechnicalData({ ...technicalData, device_password: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.device_password || 'Ninguna'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Estado Batería</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.battery_health}
                                        onChange={(e) => setTechnicalData({ ...technicalData, battery_health: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.battery_health || 'N/A'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Cuenta / iCloud</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.account_status}
                                        onChange={(e) => setTechnicalData({ ...technicalData, account_status: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.account_status || 'N/A'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Estado Pantalla</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.screen_status}
                                        onChange={(e) => setTechnicalData({ ...technicalData, screen_status: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.screen_status || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-lg">
                            <span className="info-label">Descripción del Problema</span>
                            {isEditingTechnical ? (
                                <textarea
                                    className="input mt-xs"
                                    rows="3"
                                    value={technicalData.problem_description}
                                    onChange={(e) => setTechnicalData({ ...technicalData, problem_description: e.target.value })}
                                ></textarea>
                            ) : (
                                <p className="mt-xs">{repair.problem_description}</p>
                            )}
                        </div>
                    </section>

                    {/* Detalle del Servicio */}
                    <section className="detail-card">
                        <div className="flex justify-between items-center mb-md">
                            <h2 className="m-0"><Wrench size={20} /> Detalle del Servicio</h2>
                            {(isAdmin || user.role === 'technician') && (
                                <button
                                    onClick={() => setIsEditingTechnical(!isEditingTechnical)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    {isEditingTechnical ? 'Cancelar' : 'Editar Servicio'}
                                </button>
                            )}
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Servicio Solicitado</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.service_requested}
                                        onChange={(e) => setTechnicalData({ ...technicalData, service_requested: e.target.value })}
                                        placeholder="Descripción del servicio"
                                    />
                                ) : (
                                    <span className="info-value">{repair.service_name || repair.service_requested || 'General'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Prioridad</span>
                                {isEditingTechnical ? (
                                    <select
                                        className="select select-sm"
                                        value={technicalData.priority}
                                        onChange={(e) => setTechnicalData({ ...technicalData, priority: e.target.value })}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                ) : (
                                    <span className={`status-pill ${repair.priority}`}>
                                        {repair.priority === 'urgent' ? 'Urgente' : 'Normal'}
                                    </span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Entrega Estimada</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="date"
                                        className="input input-sm"
                                        value={technicalData.estimated_delivery}
                                        onChange={(e) => setTechnicalData({ ...technicalData, estimated_delivery: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">
                                        {repair.estimated_delivery
                                            ? new Date(repair.estimated_delivery).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })
                                            : 'No definida'}
                                    </span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Técnico Asignado</span>
                                {isEditingTechnical ? (
                                    <select
                                        className="select select-sm"
                                        value={technicalData.technician_id}
                                        onChange={(e) => setTechnicalData({ ...technicalData, technician_id: e.target.value })}
                                    >
                                        <option value="">No asignado</option>
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="info-value">
                                        {repair.technician_first_name
                                            ? `${repair.technician_first_name} ${repair.technician_last_name}`
                                            : 'No asignado'}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isEditingTechnical && (
                            <div className="flex justify-end mt-md">
                                <button
                                    onClick={handleUpdateStatus}
                                    className="btn btn-primary btn-sm"
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? 'Guardando...' : 'Guardar Datos del Servicio'}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Inspección de Entrada */}
                    <section className="detail-card">
                        <h2><ClipboardCheck size={20} /> Inspección de Entrada</h2>
                        <div className="info-grid mb-md">
                            <div className="info-item">
                                <span className="info-label">Condición Física</span>
                                {isEditingTechnical ? (
                                    <div className="rating-selector sm">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                className={`rating-btn ${technicalData.physical_condition === v ? 'active' : ''}`}
                                                onClick={() => setTechnicalData({ ...technicalData, physical_condition: v })}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="info-value">
                                        <div className="rating-display">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <div key={v} className={`rating-dot ${repair.physical_condition >= v ? 'active' : ''}`}></div>
                                            ))}
                                            <span className="ml-sm text-muted">({repair.physical_condition}/5)</span>
                                        </div>
                                    </span>
                                )}
                            </div>
                            <div className="info-item">
                                <span className="info-label">Accesorios</span>
                                {isEditingTechnical ? (
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        value={technicalData.accessories_received}
                                        onChange={(e) => setTechnicalData({ ...technicalData, accessories_received: e.target.value })}
                                    />
                                ) : (
                                    <span className="info-value">{repair.accessories_received || 'Ninguno'}</span>
                                )}
                            </div>
                        </div>
                        <div className="mb-md">
                            <span className="info-label">Daños Reportados</span>
                            {isEditingTechnical ? (
                                <textarea
                                    className="input mt-xs"
                                    rows="2"
                                    value={technicalData.existing_damage}
                                    onChange={(e) => setTechnicalData({ ...technicalData, existing_damage: e.target.value })}
                                ></textarea>
                            ) : (
                                <p className="mt-xs text-secondary">{repair.existing_damage || 'Sin daños reportados'}</p>
                            )}
                        </div>
                        <div className="mb-md">
                            <span className="info-label">Observaciones Técnicas</span>
                            {isEditingTechnical ? (
                                <textarea
                                    className="input mt-xs"
                                    rows="3"
                                    value={technicalData.technical_observations}
                                    onChange={(e) => setTechnicalData({ ...technicalData, technical_observations: e.target.value })}
                                    placeholder="Detalles técnicos encontrados..."
                                ></textarea>
                            ) : (
                                <p className="mt-xs text-primary">{repair.technical_observations || 'Sin observaciones adicionales'}</p>
                            )}
                        </div>
                        {isEditingTechnical && (
                            <div className="flex justify-end mt-md">
                                <button
                                    onClick={handleUpdateStatus}
                                    className="btn btn-primary btn-sm"
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? 'Guardando...' : 'Guardar Inspección'}
                                </button>
                            </div>
                        )}
                        {repair.function_checklist && (
                            <div className="checklist-display">
                                <span className="info-label mb-xs block">Pruebas Funcionales</span>
                                <div className="checklist-grid-detail">
                                    {Object.entries(typeof repair.function_checklist === 'string' ? JSON.parse(repair.function_checklist) : repair.function_checklist).map(([key, value]) => (
                                        <div key={key} className={`checklist-badge ${value ? 'success' : 'fail'}`}>
                                            {value ? <CheckCircle2 size={12} /> : <X size={12} />}
                                            <span className="capitalize">{key === 'display' ? 'Pantalla' : key}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Información Económica */}
                    <section className="detail-card">
                        <div className="flex justify-between items-center mb-md">
                            <h2 className="m-0"><CreditCard size={20} /> Resumen Económico</h2>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsEditingCosts(!isEditingCosts)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    {isEditingCosts ? 'Cancelar' : 'Editar Costos'}
                                </button>
                            )}
                        </div>

                        {isEditingCosts ? (
                            <div className="info-grid py-sm">
                                <div className="form-group">
                                    <label className="info-label">Diagnóstico</label>
                                    <div className="relative">
                                        <span className="absolute left-sm top-1/2 -translate-y-1/2 text-muted">$</span>
                                        <input
                                            type="number"
                                            value={costs.diagnosis_cost}
                                            onChange={(e) => setCosts({ ...costs, diagnosis_cost: e.target.value })}
                                            className="input pl-xl"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="info-label">Mano de Obra</label>
                                    <div className="relative">
                                        <span className="absolute left-sm top-1/2 -translate-y-1/2 text-muted">$</span>
                                        <input
                                            type="number"
                                            value={costs.labor_cost}
                                            onChange={(e) => setCosts({ ...costs, labor_cost: e.target.value })}
                                            className="input pl-xl"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="info-label">Refacciones</label>
                                    <div className="relative">
                                        <span className="absolute left-sm top-1/2 -translate-y-1/2 text-muted">$</span>
                                        <input
                                            type="number"
                                            value={costs.parts_cost}
                                            onChange={(e) => setCosts({ ...costs, parts_cost: e.target.value })}
                                            className="input pl-xl"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="info-label">Descuento</label>
                                    <div className="relative">
                                        <span className="absolute left-sm top-1/2 -translate-y-1/2 text-muted">$</span>
                                        <input
                                            type="number"
                                            value={costs.discount}
                                            onChange={(e) => setCosts({ ...costs, discount: e.target.value })}
                                            className="input pl-xl"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-md w-full col-span-full">
                                    <button
                                        onClick={handleUpdateStatus}
                                        className="btn btn-primary btn-sm"
                                        disabled={updatingStatus}
                                    >
                                        {updatingStatus ? 'Guardando...' : 'Guardar Costos'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Costo Total</span>
                                    <span className="info-value font-bold text-primary">{formatCurrency(repair.total_cost)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Anticipo</span>
                                    <span className="info-value">{formatCurrency(repair.advance_payment)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Pendiente</span>
                                    <span className="info-value text-error">{formatCurrency(repair.total_cost - repair.advance_payment)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Garantía</span>
                                    <span className="info-value">{repair.warranty_days} días</span>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Galería de Imágenes */}
                    <section className="detail-card">
                        <div className="flex justify-between items-center mb-md">
                            <h2 className="m-0"><ImageIcon size={20} /> Imágenes del Equipo</h2>
                            {isAdmin && (
                                <label className="btn btn-secondary btn-sm pointer">
                                    <Plus size={16} /> Subir Fotos
                                    <input
                                        type="file"
                                        multiple
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploadingImages}
                                    />
                                </label>
                            )}
                        </div>

                        {uploadingImages && <div className="text-center py-md"><div className="spinner sm"></div> Subiendo...</div>}

                        <div className="image-gallery">
                            {repair.images?.length > 0 ? (
                                repair.images.map((img) => (
                                    <div key={img.id} className="gallery-item">
                                        <img
                                            src={`${BACKEND_URL}${img.image_path}`}
                                            alt="Repair"
                                            onClick={() => window.open(`${BACKEND_URL}${img.image_path}`, '_blank')}
                                        />
                                        {isAdmin && (
                                            <button
                                                className="delete-img-btn"
                                                onClick={() => handleDeleteImage(img.id)}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                        <span className="img-type-badge">{img.image_type === 'before' ? 'Inicial' : img.image_type === 'after' ? 'Final' : 'Proceso'}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted text-center w-full py-lg">No hay imágenes registradas</p>
                            )}
                        </div>
                    </section>

                    {/* Notas y Comunicación */}
                    <section className="detail-card">
                        <h2><MessageSquare size={20} /> Notas y Seguimiento</h2>
                        <div className="notes-container">
                            {repair.notes?.length > 0 ? (
                                repair.notes.map((note) => (
                                    <div key={note.id} className={`note-item ${note.is_internal ? 'internal' : ''}`}>
                                        <div className="note-header">
                                            <span className="note-author">
                                                {note.first_name} {note.last_name}
                                                {note.is_internal && <span className="internal-badge ml-sm">(Interna)</span>}
                                            </span>
                                            <span className="note-date">{formatDate(note.created_at)}</span>
                                        </div>
                                        <p className="note-body">{note.note}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted text-center py-md">No hay notas registradas</p>
                            )}
                        </div>

                        <form onSubmit={handleAddNote} className="note-input-area">
                            <textarea
                                placeholder="Añadir un comentario o nota..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="input"
                                rows="3"
                                required
                            ></textarea>
                            <div className="flex justify-between items-center">
                                {isAdmin && (
                                    <label className="internal-toggle">
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                        />
                                        Nota interna (Solo personal)
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={addingNote || !noteText.trim()}
                                >
                                    <Send size={16} /> {addingNote ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                <div className="side-content">
                    {/* Información del Cliente (Solo Admin) */}
                    {isAdmin && (
                        <section className="detail-card">
                            <h2><User size={20} /> Cliente</h2>
                            <div className="flex-col gap-sm">
                                <div className="info-item">
                                    <span className="info-label">Nombre</span>
                                    <span className="info-value">{repair.customer_first_name} {repair.customer_last_name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{repair.customer_email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Teléfono</span>
                                    <span className="info-value">{repair.customer_phone}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Historial de Estados */}
                    <section className="detail-card">
                        <h2><Clock size={20} /> Línea de Tiempo</h2>
                        <div className="timeline">
                            {repair.history?.map((item, index) => (
                                <div key={item.id} className={`timeline-item ${index === 0 ? 'active' : ''}`}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="timeline-status">{statusLabels[item.status]}</span>
                                            <span className="timeline-date">{formatDate(item.created_at)}</span>
                                        </div>
                                        {item.notes && <p className="timeline-notes">{item.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Garantía */}
                    <section className="detail-card">
                        <h2><ShieldCheck size={20} /> Garantía</h2>
                        <div className="info-item">
                            <span className="info-label">Estado</span>
                            <span className={`info-value ${repair.status === 'delivered' ? 'text-success' : 'text-muted'}`}>
                                {repair.status === 'delivered' ? 'Activa' : 'Se activará al entregar'}
                            </span>
                        </div>
                        <div className="info-item mt-md">
                            <span className="info-label">{repair.status === 'delivered' ? 'Expira el' : 'Duración pactada'}</span>
                            <span className="info-value">
                                {repair.status === 'delivered'
                                    ? formatDate(repair.warranty_expires)
                                    : `${repair.warranty_days} días`}
                            </span>
                        </div>
                    </section>
                </div>
            </div>

            <SignatureModal
                isOpen={showSigModal}
                onClose={() => setShowSigModal(false)}
                onSave={handleSignatureSave}
                title={sigType === 'approval' ? 'Aprobar Cotización' : 'Confirmar Entrega'}
                description={sigType === 'approval'
                    ? 'Por favor firma para autorizar la reparación y aceptar el costo estimado.'
                    : 'Por favor firma para confirmar la recepción del equipo y aceptación de la garantía.'}
            />
        </div >
    );
}
