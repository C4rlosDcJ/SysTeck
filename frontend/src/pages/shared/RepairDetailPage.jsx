import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repairService, userService, settingsService, uploadService, BACKEND_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABELS, STATUS_COLORS, formatCurrency, formatDate } from '../../utils/constants';
import {
    Wrench, Clock, User, MessageSquare, AlertCircle, CheckCircle2,
    ChevronLeft, Smartphone, CreditCard, ShieldCheck, Send, Plus, X,
    Image as ImageIcon, DollarSign, Save as SaveIcon, ClipboardCheck,
    Printer, PenTool, Edit3, ShoppingCart
} from 'lucide-react';
import SignatureModal from '../../components/common/SignatureModal';
import { generateServiceTicket } from '../../utils/pdfGenerator';
import './RepairDetailPage.css';

export default function RepairDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();
    
    const [repair, setRepair] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [settings, setSettings] = useState({});

    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [warrantyDays, setWarrantyDays] = useState(30);

    const [costs, setCosts] = useState({ diagnosis_cost: 0, labor_cost: 0, parts_cost: 0, discount: 0 });
    const [isEditingCosts, setIsEditingCosts] = useState(false);
    
    const [uploadingImages, setUploadingImages] = useState(false);
    const [showSigModal, setShowSigModal] = useState(false);
    const [sigType, setSigType] = useState(null);

    const [isEditingTechnical, setIsEditingTechnical] = useState(false);
    const [technicalData, setTechnicalData] = useState({});
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [noteText, setNoteText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await fetchRepairData();
            await fetchTechnicians();
            await fetchSettings();
        };
        loadData();
    }, [id]);

    const fetchSettings = async () => {
        try { setSettings(await settingsService.getAll()); } catch (err) {}
    };

    const fetchTechnicians = async () => {
        try { setTechnicians(await userService.getTechnicians() || []); } catch (err) {}
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
            setError('No se pudo cargar la información de la reparación.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignatureSave = async (signatureData) => {
        setShowSigModal(false);
        try {
            setUpdatingStatus(true);
            if (sigType === 'approval') {
                await repairService.updateStatus(id, 'repairing', 'Cotización aprobada por el cliente con firma', technicalData.estimated_delivery, signatureData);
                alert('¡Reparación aprobada correctamente!');
            } else if (sigType === 'delivery') {
                await repairService.updateStatus(id, 'delivered', 'Equipo entregado al cliente', null, signatureData);
                alert('¡Equipo entregado y garantía activada!');
            }
            await fetchRepairData();
        } catch (err) { alert('Error al guardar firma: ' + err.message); } 
        finally { setUpdatingStatus(false); }
    };

    const handlePrintTicket = () => {
        try { generateServiceTicket(repair, settings); } 
        catch (error) { alert('No se pudo generar el ticket. Por favor intenta de nuevo.'); }
    };

    const handleUpdateStatus = async (e) => {
        if(e) e.preventDefault();
        try {
            setUpdatingStatus(true);
            const updates = {};
            if (parseInt(warrantyDays) !== parseInt(repair.warranty_days)) updates.warranty_days = warrantyDays;

            if (isEditingCosts) {
                updates.diagnosis_cost = Number(costs.diagnosis_cost) || 0;
                updates.labor_cost = Number(costs.labor_cost) || 0;
                updates.parts_cost = Number(costs.parts_cost) || 0;
                updates.discount = Number(costs.discount) || 0;
            }

            if (isEditingTechnical) {
                Object.assign(updates, technicalData);
                if(!updates.estimated_delivery) updates.estimated_delivery = null;
            }

            if (Object.keys(updates).length > 0) await repairService.update(id, updates);

            if (newStatus !== repair.status) {
                if (newStatus === 'delivered') {
                    setSigType('delivery');
                    setShowSigModal(true);
                    setIsEditingCosts(false); setIsEditingTechnical(false); setUpdatingStatus(false);
                    await fetchRepairData();
                    return;
                }
                await repairService.updateStatus(id, newStatus, statusNote);
                setStatusNote('');
            }

            setIsEditingCosts(false); setIsEditingTechnical(false);
            await fetchRepairData();
        } catch (err) { alert('Error al actualizar: ' + err.message); } 
        finally { setUpdatingStatus(false); }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        try {
            setUploadingImages(true);
            await uploadService.uploadImages(id, files, 'during');
            await fetchRepairData();
        } catch (err) { alert('Error al subir imágenes: ' + err.message); } 
        finally { setUploadingImages(false); }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;
        try {
            await uploadService.deleteImage(imageId);
            await fetchRepairData();
        } catch (err) { alert('Error al eliminar imagen: ' + err.message); }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        try {
            setAddingNote(true);
            await repairService.addNote(id, noteText, isInternal);
            setNoteText(''); setIsInternal(false);
            await fetchRepairData();
        } catch (err) { alert('Error al agregar nota: ' + err.message); } 
        finally { setAddingNote(false); }
    };

    // Derived values
    const progressPercent = repair ? Math.min(100, Math.max(0, (Object.keys(STATUS_LABELS).indexOf(repair.status) / (Object.keys(STATUS_LABELS).length - 1)) * 100)) : 0;
    const currentStatusColor = repair ? (STATUS_COLORS[repair.status] || '#6b7280') : '#6b7280';

    if (loading) return <div className="loading-state"><div className="spinner"></div><p>Cargando información...</p></div>;
    
    if (error || !repair) return (
        <div className="error-state">
            <AlertCircle size={48} color="var(--color-error)" />
            <h3>Error</h3><p>{error || 'Reparación no encontrada'}</p>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">Regresar</button>
        </div>
    );

    return (
        <div className="repair-detail-page">
            
            {/* ── Page Header & Progress Bar ── */}
            <header className="page-header detail-header">
                <div className="detail-header-top">
                    <div className="flex items-center gap-md">
                        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1>{repair.brand_name || repair.brand_other} {repair.model}</h1>
                            <p className="ticket-id">Ticket #{repair.ticket_number}</p>
                        </div>
                    </div>
                    <div className="detail-header-actions">
                        {(repair.status === 'ready' || repair.status === 'delivered') && (
                            <button onClick={handlePrintTicket} className="btn btn-secondary">
                                <Printer size={16} /> Imprimir Ticket
                            </button>
                        )}
                        <span className={`badge big-badge status-${repair.status}`}>
                            {STATUS_LABELS[repair.status]}
                        </span>
                    </div>
                </div>

                {/* Progress Bar (Visual) */}
                <div className="status-progress-bar mt-lg">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%`, backgroundColor: currentStatusColor }} />
                    </div>
                </div>
            </header>

            {/* ── Action Cards (Admin update / Client approve) ── */}
            <div className="detail-action-cards">
                {isAdmin && (
                    <div className="card highlight-card">
                        <div className="card-header"><Edit3 size={18}/> <h3>Actualizar Estado</h3></div>
                        <div className="update-status-row">
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="select">
                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Nota opcional..." value={statusNote} onChange={e => setStatusNote(e.target.value)} className="input flex-1" />
                            <div className="warranty-input">
                                <span className="text-sm text-muted">Garantía (días):</span>
                                <input type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} className="input input-sm w-16 text-center" />
                            </div>
                            <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updatingStatus || (newStatus === repair.status && parseInt(warrantyDays) === parseInt(repair.warranty_days) && !isEditingCosts && !isEditingTechnical)}>
                                <SaveIcon size={16} /> {updatingStatus ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                )}

                {repair.status === 'waiting_approval' && !isAdmin && (
                    <div className="card warning-card">
                        <div className="card-header text-warning"><AlertCircle size={20} /> <h3>Aprobación Pendiente</h3></div>
                        <p className="mt-xs">El costo estimado es de <strong>{formatCurrency(repair.total_cost)}</strong>. Por favor confirma para proceder.</p>
                        <div className="flex gap-md mt-sm">
                            <button className="btn btn-primary" onClick={() => { setSigType('approval'); setShowSigModal(true); }} disabled={updatingStatus}><PenTool size={16} /> Aprobar</button>
                            <button className="btn btn-danger" onClick={async () => {
                                if (window.confirm('¿Rechazar esta cotización? La reparación será cancelada.')) {
                                    setUpdatingStatus(true);
                                    await repairService.updateStatus(id, 'cancelled', 'Rechazada por el cliente');
                                    await fetchRepairData();
                                    setUpdatingStatus(false);
                                }
                            }} disabled={updatingStatus}><X size={16} /> Rechazar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Main Layout ── */}
            <div className="detail-layout mt-lg">
                <div className="detail-main-col">
                    
                    {/* Dispositivo y Servicio */}
                    <section className="card">
                        <div className="card-header spread">
                            <div className="flex items-center gap-xs"><Smartphone size={18} className="text-primary"/> <h3>Dispositivo y Servicio</h3></div>
                            {(isAdmin || user.role === 'technician') && (
                                <button onClick={() => setIsEditingTechnical(!isEditingTechnical)} className="btn btn-ghost btn-sm text-muted">
                                    {isEditingTechnical ? 'Cancelar' : 'Editar'}
                                </button>
                            )}
                        </div>
                        
                        <div className="info-grid mt-sm">
                            <div className="info-item">
                                <label>Dispositivo</label>
                                <span>{repair.device_type_name} — {repair.brand_name || repair.brand_other} {repair.model}</span>
                            </div>
                            <div className="info-item">
                                <label>Color y Capacidad</label>
                                {isEditingTechnical ? (
                                    <div className="flex gap-xs">
                                        <input type="text" className="input input-sm" value={technicalData.color} onChange={e => setTechnicalData({...technicalData, color: e.target.value})} placeholder="Color"/>
                                        <input type="text" className="input input-sm" value={technicalData.storage_capacity} onChange={e => setTechnicalData({...technicalData, storage_capacity: e.target.value})} placeholder="GB"/>
                                    </div>
                                ) : <span>{repair.color || 'N/A'} • {repair.storage_capacity ? repair.storage_capacity + 'GB' : 'N/A'}</span>}
                            </div>
                            <div className="info-item">
                                <label>IMEI / Serie</label>
                                {isEditingTechnical ? (
                                    <input type="text" className="input input-sm" value={technicalData.imei} onChange={e => setTechnicalData({...technicalData, imei: e.target.value})} />
                                ) : <span>{repair.imei || repair.serial_number || 'N/A'}</span>}
                            </div>
                            <div className="info-item">
                                <label>Contraseña / Patrón</label>
                                {isEditingTechnical ? (
                                    <input type="text" className="input input-sm" value={technicalData.device_password} onChange={e => setTechnicalData({...technicalData, device_password: e.target.value})} />
                                ) : <span>{repair.device_password || 'Ninguna'}</span>}
                            </div>
                            
                            <div className="info-item col-span-full">
                                <label>Problema Reportado</label>
                                {isEditingTechnical ? (
                                    <textarea className="input mt-xs" rows="2" value={technicalData.problem_description} onChange={e => setTechnicalData({...technicalData, problem_description: e.target.value})}></textarea>
                                ) : <p className="text-body mt-xs">{repair.problem_description}</p>}
                            </div>

                            <div className="divider col-span-full"></div>

                            <div className="info-item">
                                <label>Servicio Asignado</label>
                                {isEditingTechnical ? (
                                    <input type="text" className="input input-sm" value={technicalData.service_requested} onChange={e => setTechnicalData({...technicalData, service_requested: e.target.value})} />
                                ) : <span>{repair.service_name || repair.service_requested || 'General'}</span>}
                            </div>
                            <div className="info-item">
                                <label>Técnico a cargo</label>
                                {isEditingTechnical ? (
                                    <select className="select select-sm" value={technicalData.technician_id} onChange={e => setTechnicalData({...technicalData, technician_id: e.target.value})}>
                                        <option value="">No asignado</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                    </select>
                                ) : <span>{repair.technician_first_name ? `${repair.technician_first_name} ${repair.technician_last_name}` : 'No asignado'}</span>}
                            </div>
                            <div className="info-item">
                                <label>Prioridad</label>
                                {isEditingTechnical ? (
                                    <select className="select select-sm" value={technicalData.priority} onChange={e => setTechnicalData({...technicalData, priority: e.target.value})}>
                                        <option value="normal">Normal</option><option value="urgent">Urgente</option>
                                    </select>
                                ) : <span className={`badge ${repair.priority === 'urgent' ? 'bg-error-muted text-error' : 'bg-bg-elevated text-text'}`}>{repair.priority === 'urgent' ? 'Urgente' : 'Normal'}</span>}
                            </div>
                            <div className="info-item">
                                <label>Entrega Estimada</label>
                                {isEditingTechnical ? (
                                    <input type="date" className="input input-sm" value={technicalData.estimated_delivery} onChange={e => setTechnicalData({...technicalData, estimated_delivery: e.target.value})} />
                                ) : <span>{repair.estimated_delivery ? formatDate(repair.estimated_delivery).split(',')[0] : 'No definida'}</span>}
                            </div>
                        </div>

                        {isEditingTechnical && (
                            <div className="flex justify-end mt-md">
                                <button onClick={handleUpdateStatus} className="btn btn-primary" disabled={updatingStatus}>Guardar Cambios</button>
                            </div>
                        )}
                    </section>
                    
                    {/* Inspección */}
                    <section className="card">
                        <div className="card-header"><ClipboardCheck size={18} className="text-primary"/> <h3>Inspección Inicial</h3></div>
                        <div className="info-grid mt-sm">
                            <div className="info-item">
                                <label>Condición Física</label>
                                <div className="rating-display mt-xs">
                                    {[1, 2, 3, 4, 5].map(v => <div key={v} className={`rating-dot inline-block w-2 h-2 rounded-full mr-1 ${repair.physical_condition >= v ? 'bg-primary' : 'bg-bg-elevated'}`}></div>)}
                                    <span className="text-xs text-muted ml-sm">{repair.physical_condition}/5</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <label>Accesorios recibidos</label>
                                <span>{repair.accessories_received || 'Ninguno'}</span>
                            </div>
                            <div className="info-item col-span-full">
                                <label>Daños previos</label>
                                <span className="text-muted">{repair.existing_damage || 'Sin reporte de daños'}</span>
                            </div>
                            <div className="info-item col-span-full">
                                <label>Observaciones del técnico</label>
                                <span className="text-muted">{repair.technical_observations || 'Ninguna'}</span>
                            </div>

                            {repair.function_checklist && (
                                <div className="info-item col-span-full mt-sm">
                                    <label>Checklist Funcional</label>
                                    <div className="flex gap-sm flex-wrap mt-xs">
                                        {Object.entries(typeof repair.function_checklist === 'string' ? JSON.parse(repair.function_checklist) : repair.function_checklist).map(([key, value]) => (
                                            <div key={key} className={`badge text-xs ${value ? 'bg-success-muted text-success' : 'bg-error-muted text-error'}`}>
                                                {value ? <CheckCircle2 size={12}/> : <X size={12}/>} <span className="capitalize ml-xs">{key}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Imágenes */}
                    <section className="card">
                        <div className="card-header spread">
                            <div className="flex items-center gap-xs"><ImageIcon size={18} className="text-primary"/> <h3>Imágenes del Equipo</h3></div>
                            {isAdmin && (
                                <label className="btn btn-ghost btn-sm text-primary pointer">
                                    <Plus size={16} /> Agregar
                                    <input type="file" multiple hidden accept="image/*" onChange={handleFileUpload} disabled={uploadingImages}/>
                                </label>
                            )}
                        </div>
                        {uploadingImages && <div className="text-center py-md text-sm text-muted">Subiendo imágenes...</div>}
                        
                        <div className="image-gallery mt-md">
                            {repair.images?.length > 0 ? repair.images.map((img) => (
                                <div key={img.id} className="gallery-thumbnail">
                                    <img src={`${BACKEND_URL}${img.image_path}`} alt="Repair" onClick={() => window.open(`${BACKEND_URL}${img.image_path}`, '_blank')} />
                                    {isAdmin && <button className="delete-btn" onClick={() => handleDeleteImage(img.id)}><X size={12}/></button>}
                                </div>
                            )) : <p className="text-muted text-sm text-center py-lg">No hay fotos registradas</p>}
                        </div>
                    </section>

                    {/* Notas */}
                    <section className="card">
                        <div className="card-header"><MessageSquare size={18} className="text-primary"/> <h3>Seguimiento y Notas</h3></div>
                        
                        <div className="notes-list mt-md">
                            {repair.notes?.length > 0 ? repair.notes.map((note) => (
                                <div key={note.id} className={`note-bubble ${note.is_internal ? 'internal-bubble' : ''}`}>
                                    <div className="note-bubble-head">
                                        <strong>{note.first_name} {note.last_name} {note.is_internal && <span className="text-xs text-warning ml-xs">(Interna)</span>}</strong>
                                        <span className="text-xs text-muted">{formatDate(note.created_at)}</span>
                                    </div>
                                    <p>{note.note}</p>
                                </div>
                            )) : <p className="text-muted text-sm text-center py-md">No hay notas registradas</p>}
                        </div>

                        <form onSubmit={handleAddNote} className="note-form mt-md pt-md border-t border-border">
                            <textarea placeholder="Escribe un comentario..." value={noteText} onChange={e => setNoteText(e.target.value)} className="input" rows="2" required></textarea>
                            <div className="flex justify-between items-center mt-sm">
                                {isAdmin && (
                                    <label className="flex items-center gap-xs text-sm text-muted cursor-pointer">
                                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}/> Nota interna (solo staff)
                                    </label>
                                )}
                                <button type="submit" className="btn btn-primary btn-sm ml-auto" disabled={addingNote || !noteText.trim()}>Enviar <Send size={14} className="ml-xs"/></button>
                            </div>
                        </form>
                    </section>

                </div>

                <div className="detail-sidebar-col">
                    
                    {/* Costos */}
                    <div className="card sticky-card">
                        <div className="card-header spread">
                            <div className="flex items-center gap-xs"><DollarSign size={18} className="text-success"/> <h3>Presupuesto</h3></div>
                            {isAdmin && (
                                <button onClick={() => setIsEditingCosts(!isEditingCosts)} className="btn btn-ghost btn-sm text-muted">
                                    {isEditingCosts ? 'Cancelar' : 'Editar'}
                                </button>
                            )}
                        </div>

                        {/* Payment status badge */}
                        {repair.payment_status && (
                            <div className="mt-sm">
                                <span className={`badge text-xs ${
                                    repair.payment_status === 'paid' ? 'bg-success-muted text-success' :
                                    repair.payment_status === 'partial' ? 'bg-warning-muted text-warning' :
                                    'bg-error-muted text-error'
                                }`}>
                                    {repair.payment_status === 'paid' ? '✓ Pagado' :
                                     repair.payment_status === 'partial' ? '◐ Pago Parcial' :
                                     '○ Pendiente de Pago'}
                                </span>
                            </div>
                        )}

                        {isEditingCosts ? (
                            <div className="mt-md flex flex-col gap-sm">
                                <div className="flex justify-between items-center"><span className="text-sm text-muted">Diagnóstico</span> <input type="number" className="input input-sm w-24 text-right" value={costs.diagnosis_cost} onChange={e => setCosts({...costs, diagnosis_cost: e.target.value})}/></div>
                                <div className="flex justify-between items-center"><span className="text-sm text-muted">Mano de Obra</span> <input type="number" className="input input-sm w-24 text-right" value={costs.labor_cost} onChange={e => setCosts({...costs, labor_cost: e.target.value})}/></div>
                                <div className="flex justify-between items-center"><span className="text-sm text-muted">Refacciones</span> <input type="number" className="input input-sm w-24 text-right" value={costs.parts_cost} onChange={e => setCosts({...costs, parts_cost: e.target.value})}/></div>
                                <div className="flex justify-between items-center"><span className="text-sm text-muted">Descuento (-)</span> <input type="number" className="input input-sm w-24 text-right text-error" value={costs.discount} onChange={e => setCosts({...costs, discount: e.target.value})}/></div>
                                <button onClick={handleUpdateStatus} className="btn btn-primary btn-sm mt-sm w-full">Guardar Costos</button>
                            </div>
                        ) : (
                            <div className="mt-md flex flex-col gap-sm">
                                <div className="flex justify-between text-sm"><span>Total Estimado</span> <strong className="text-lg">{formatCurrency(repair.total_cost)}</strong></div>
                                <div className="flex justify-between text-sm text-success"><span>Anticipo</span> <span>{formatCurrency(repair.advance_payment)}</span></div>
                                <div className="divider my-1"></div>
                                <div className="flex justify-between text-md font-bold text-error"><span>Restante</span> <span>{formatCurrency(repair.total_cost - repair.advance_payment)}</span></div>
                            </div>
                        )}

                        {/* Cobrar en POS button */}
                        {isAdmin && repair.total_cost > 0 && repair.payment_status !== 'paid' && (
                            <button
                                className="btn btn-primary w-full mt-md"
                                onClick={() => navigate(`/admin/pos?repair_id=${repair.id}`)}
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                            >
                                <ShoppingCart size={16} />
                                Cobrar en POS — {formatCurrency(repair.total_cost - (repair.advance_payment || 0))}
                            </button>
                        )}
                    </div>

                    {/* Cliente */}
                    {isAdmin && (
                        <div className="card">
                            <div className="card-header"><User size={18}/> <h3>Cliente</h3></div>
                            <div className="mt-sm text-sm flex flex-col gap-xs">
                                <strong>{repair.customer_first_name} {repair.customer_last_name}</strong>
                                <span className="text-muted">{repair.customer_email}</span>
                                <span className="text-muted">{repair.customer_phone}</span>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="card bg-transparent border-0 shadow-none px-0">
                        <div className="card-header mb-md px-md"><Clock size={18} className="text-primary"/> <h3 className="m-0">Línea de Tiempo</h3></div>
                        <div className="modern-timeline">
                            {repair.history?.map((item, index) => (
                                <div key={item.id} className={`mtl-item ${index === 0 ? 'mlt-active' : ''}`}>
                                    <div className="mtl-dot" style={{backgroundColor: STATUS_COLORS[item.status] || '#888', borderColor: index===0 ? `${STATUS_COLORS[item.status]}40` : 'transparent'}}></div>
                                    <div className="mtl-content">
                                        <strong>{STATUS_LABELS[item.status]}</strong>
                                        <span className="mtl-date">{formatDate(item.created_at)}</span>
                                        {item.notes && <p className="mtl-notes">{item.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <SignatureModal isOpen={showSigModal} onClose={() => setShowSigModal(false)} onSave={handleSignatureSave} title={sigType === 'approval' ? 'Aprobar Cotización' : 'Confirmar Entrega'} description="..." />
        </div>
    );
}
