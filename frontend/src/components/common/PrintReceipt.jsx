import { Printer, X } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/constants';
import './PrintReceipt.css';

export default function PrintReceipt({ isOpen, onClose, data, type = 'repair', settings = {} }) {
    if (!isOpen || !data) return null;

    const businessName = settings.business_name || 'SysTeck';
    const contactEmail = settings.contact_email || '';
    const contactPhone = settings.contact_phone || '';
    const contactAddress = settings.business_address || 'Dirección de la empresa';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="print-receipt-overlay" onClick={onClose}>
            <div className="print-receipt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="print-receipt-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        <X size={16} /> Cerrar
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint}>
                        <Printer size={16} /> Imprimir
                    </button>
                </div>

                <div className="receipt-print-area">
                    {type === 'repair' ? (
                        /* ================= REPAIR RECEIPT (ORDER / DELIVERY) ================= */
                        <div className="thermal-receipt">
                            <div className="receipt-header-info">
                                <h2>{businessName}</h2>
                                <p>{contactAddress}</p>
                                {contactPhone && <p>Tel: {contactPhone}</p>}
                                {contactEmail && <p>{contactEmail}</p>}
                                <div className="divider-dashed"></div>
                                <h3>ORDEN DE SERVICIO</h3>
                                <p className="bold">Ticket: {data.ticket_number}</p>
                                <p>Fecha: {formatDateTime(data.created_at)}</p>
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-section">
                                <p className="bold">CLIENTE:</p>
                                <p>{data.customer_first_name || data.first_name} {data.customer_last_name || data.last_name}</p>
                                {data.customer_phone && <p>Tel: {data.customer_phone}</p>}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-section">
                                <p className="bold">DISPOSITIVO:</p>
                                <p>{data.brand_name === 'Otro' ? data.brand_other : data.brand_name} {data.model}</p>
                                {data.color && <p>Color: {data.color}</p>}
                                {(data.imei || data.serial_number) && (
                                    <p>S/N / IMEI: {data.imei || data.serial_number}</p>
                                )}
                                {data.physical_condition && <p>Condición física: {data.physical_condition}/5</p>}
                                {data.accessories_received && <p>Accesorios: {data.accessories_received}</p>}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-section">
                                <p className="bold">SERVICIO / FALLA:</p>
                                <p>{data.service_name || data.service_requested || 'Reparación General'}</p>
                                {data.problem_description && (
                                    <p className="italic">"{data.problem_description}"</p>
                                )}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-section costs-summary">
                                <div className="cost-row">
                                    <span>Mano de Obra:</span>
                                    <span>{formatCurrency(data.labor_cost)}</span>
                                </div>
                                <div className="cost-row">
                                    <span>Refacciones:</span>
                                    <span>{formatCurrency(data.parts_cost)}</span>
                                </div>
                                <div className="cost-row">
                                    <span>Diagnóstico:</span>
                                    <span>{formatCurrency(data.diagnosis_cost)}</span>
                                </div>
                                {parseFloat(data.discount) > 0 && (
                                    <div className="cost-row discount">
                                        <span>Descuento:</span>
                                        <span>-{formatCurrency(data.discount)}</span>
                                    </div>
                                )}
                                <div className="divider-dashed"></div>
                                <div className="cost-row bold total-row">
                                    <span>TOTAL:</span>
                                    <span>{formatCurrency(data.total_cost)}</span>
                                </div>
                                {parseFloat(data.advance_payment) > 0 && (
                                    <div className="cost-row advance">
                                        <span>Anticipo:</span>
                                        <span>-{formatCurrency(data.advance_payment)}</span>
                                    </div>
                                )}
                                <div className="cost-row bold balance-row">
                                    <span>RESTA:</span>
                                    <span>{formatCurrency(parseFloat(data.total_cost) - parseFloat(data.advance_payment || 0))}</span>
                                </div>
                            </div>

                            <div className="divider-dashed"></div>

                            {data.signature_approval && (
                                <div className="signature-area">
                                    <p className="bold">FIRMA DE CONFORMIDAD:</p>
                                    <img src={data.signature_approval} alt="Firma de conformidad" className="signature-img" />
                                </div>
                            )}

                            <div className="receipt-footer-notes">
                                <p className="bold">TÉRMINOS Y CONDICIONES</p>
                                <p>Toda reparación cuenta con {data.warranty_days || 30} días de garantía sobre las refacciones cambiadas y mano de obra.</p>
                                <p>Equipos no reclamados después de 30 días de su fecha de entrega estimada causarán recargos de almacenaje.</p>
                                <p>¡Gracias por su confianza!</p>
                            </div>
                        </div>
                    ) : (
                        /* ================= POS / SALE RECEIPT ================= */
                        <div className="thermal-receipt">
                            <div className="receipt-header-info">
                                <h2>{businessName}</h2>
                                <p>{contactAddress}</p>
                                {contactPhone && <p>Tel: {contactPhone}</p>}
                                {contactEmail && <p>{contactEmail}</p>}
                                <div className="divider-dashed"></div>
                                <h3>COMPROBANTE DE COMPRA</h3>
                                <p className="bold">Venta: {data.sale_number}</p>
                                <p>Fecha: {formatDateTime(data.created_at)}</p>
                                {data.customer_first_name && (
                                    <p>Cliente: {data.customer_first_name} {data.customer_last_name}</p>
                                )}
                                <p>Cajero: {data.cashier_first_name} {data.cashier_last_name}</p>
                                {data.repair_ticket && (
                                    <p className="bold" style={{ color: 'var(--color-primary)' }}>
                                        Reparación: {data.repair_ticket}
                                    </p>
                                )}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-items-list">
                                {data.items?.map((item, idx) => (
                                    <div key={idx} className="receipt-item-row">
                                        <div className="item-desc">
                                            {item.quantity}x {item.description}
                                        </div>
                                        <div className="item-price">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-section costs-summary">
                                <div className="cost-row">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(data.subtotal)}</span>
                                </div>
                                {parseFloat(data.discount) > 0 && (
                                    <div className="cost-row discount">
                                        <span>Descuento:</span>
                                        <span>-{formatCurrency(data.discount)}</span>
                                    </div>
                                )}
                                <div className="cost-row bold total-row">
                                    <span>TOTAL:</span>
                                    <span>{formatCurrency(data.total)}</span>
                                </div>
                                <div className="cost-row">
                                    <span>Método de pago:</span>
                                    <span>
                                        {data.payment_method === 'cash' ? 'Efectivo' :
                                         data.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}
                                    </span>
                                </div>
                                {data.payment_method === 'cash' && (
                                    <>
                                        <div className="cost-row">
                                            <span>Monto recibido:</span>
                                            <span>{formatCurrency(data.amount_received)}</span>
                                        </div>
                                        <div className="cost-row bold change-row">
                                            <span>CAMBIO:</span>
                                            <span>{formatCurrency(data.change_amount)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="divider-dashed"></div>

                            <div className="receipt-footer-notes">
                                <p>Conserve este ticket como comprobante</p>
                                <p>¡Muchas gracias por su preferencia!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
