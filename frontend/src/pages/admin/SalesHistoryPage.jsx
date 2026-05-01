import { useState, useEffect } from 'react';
import {
    Receipt, Search, Eye, XCircle, Printer, DollarSign,
    TrendingUp, ShoppingBag, CreditCard, Banknote, ArrowRightLeft, Calendar
} from 'lucide-react';
import { posService } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/constants';
import './SalesHistoryPage.css';

const PAYMENT_LABELS = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    mixed: 'Mixto'
};

const PAYMENT_ICONS = {
    cash: Banknote,
    card: CreditCard,
    transfer: ArrowRightLeft
};

export default function SalesHistoryPage() {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [page, setPage] = useState(1);

    // Detail modal
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadSales();
        loadStats();
    }, [page, dateFrom, dateTo, paymentMethod]);

    const loadSales = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (paymentMethod) params.payment_method = paymentMethod;

            const data = await posService.getSales(params);
            setSales(data.sales || []);
            setPagination(data.pagination || {});
        } catch (err) {
            console.error('Error loading sales:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await posService.getStats();
            setStats(data);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const viewSaleDetail = async (saleId) => {
        setLoadingDetail(true);
        setShowDetail(true);
        try {
            const detail = await posService.getSaleById(saleId);
            setSelectedSale(detail);
        } catch (err) {
            showToast('Error al cargar detalle', 'error');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCancelSale = async (id) => {
        if (!confirm('¿Cancelar esta venta? Se repondrá el stock automáticamente.')) return;
        try {
            await posService.cancelSale(id);
            showToast('Venta cancelada');
            setShowDetail(false);
            loadSales();
            loadStats();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="sales-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Historial de Ventas</h1>
                    <p>Registro completo de todas las transacciones POS</p>
                </div>
            </div>

            {/* Stats */}
            <div className="sales-stats">
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="sales-stat-value">{formatCurrency(stats.today?.total || 0)}</div>
                        <div className="sales-stat-count">{stats.today?.count || 0} ventas</div>
                        <div className="sales-stat-label">Hoy</div>
                    </div>
                </div>
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="sales-stat-value">{formatCurrency(stats.week?.total || 0)}</div>
                        <div className="sales-stat-count">{stats.week?.count || 0} ventas</div>
                        <div className="sales-stat-label">Esta Semana</div>
                    </div>
                </div>
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <div className="sales-stat-value">{formatCurrency(stats.month?.total || 0)}</div>
                        <div className="sales-stat-count">{stats.month?.count || 0} ventas</div>
                        <div className="sales-stat-label">Este Mes</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="sales-filters">
                <div className="filter-group">
                    <Calendar size={14} />
                    <input
                        type="date"
                        className="input input-sm date-input"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>a</span>
                    <input
                        type="date"
                        className="input input-sm date-input"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="select select-sm"
                    value={paymentMethod}
                    onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
                    style={{ width: 150 }}
                >
                    <option value="">Todos los pagos</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                </select>
            </div>

            {/* Sales Table */}
            {loading ? (
                <div className="loading-state"><div className="spinner"></div></div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No. Venta</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Cajero</th>
                                    <th>Método</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="empty-state">
                                                <Receipt size={36} className="empty-icon" />
                                                <h3>Sin ventas</h3>
                                                <p>Las ventas del POS aparecerán aquí</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map(sale => {
                                        const PayIcon = PAYMENT_ICONS[sale.payment_method] || Banknote;
                                        return (
                                            <tr key={sale.id}>
                                                <td><span className="sale-number">{sale.sale_number}</span></td>
                                                <td style={{ fontSize: 'var(--font-xs)' }}>
                                                    {formatDateTime(sale.created_at)}
                                                </td>
                                                <td>
                                                    {sale.customer_first_name
                                                        ? `${sale.customer_first_name} ${sale.customer_last_name}`
                                                        : <span style={{ color: 'var(--color-text-muted)' }}>Público general</span>
                                                    }
                                                </td>
                                                <td style={{ fontSize: 'var(--font-xs)' }}>
                                                    {sale.cashier_first_name} {sale.cashier_last_name}
                                                </td>
                                                <td>
                                                    <span className={`payment-badge payment-${sale.payment_method}`}>
                                                        <PayIcon size={12} />
                                                        {PAYMENT_LABELS[sale.payment_method]}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
                                                <td>
                                                    <span className={`sale-status-${sale.status}`}>
                                                        {sale.status === 'completed' ? 'Completada' :
                                                         sale.status === 'cancelled' ? 'Cancelada' : sale.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-ghost btn-icon" onClick={() => viewSaleDetail(sale.id)} title="Ver detalle">
                                                        <Eye size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Anterior
                            </button>
                            <span className="page-info">
                                Página {page} de {pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ═══ Sale Detail Modal ═══ */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        {loadingDetail ? (
                            <div className="loading-state" style={{ minHeight: 200 }}><div className="spinner"></div></div>
                        ) : selectedSale ? (
                            <>
                                <div className="modal-header">
                                    <h3 className="modal-title">
                                        <Receipt size={18} style={{ color: 'var(--color-primary)' }} />
                                        {selectedSale.sale_number}
                                    </h3>
                                    <button className="modal-close" onClick={() => setShowDetail(false)}>
                                        <XCircle size={16} />
                                    </button>
                                </div>

                                <div className="sale-detail-grid">
                                    <div>
                                        <div className="sale-detail-label">Fecha</div>
                                        <div className="sale-detail-value">{formatDateTime(selectedSale.created_at)}</div>
                                    </div>
                                    <div>
                                        <div className="sale-detail-label">Cajero</div>
                                        <div className="sale-detail-value">{selectedSale.cashier_first_name} {selectedSale.cashier_last_name}</div>
                                    </div>
                                    <div>
                                        <div className="sale-detail-label">Cliente</div>
                                        <div className="sale-detail-value">
                                            {selectedSale.customer_first_name
                                                ? `${selectedSale.customer_first_name} ${selectedSale.customer_last_name}`
                                                : 'Público general'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="sale-detail-label">Método de Pago</div>
                                        <div className="sale-detail-value">{PAYMENT_LABELS[selectedSale.payment_method]}</div>
                                    </div>
                                    {selectedSale.repair_ticket && (
                                        <div>
                                            <div className="sale-detail-label">Reparación Vinculada</div>
                                            <div className="sale-detail-value" style={{ color: 'var(--color-info)' }}>
                                                {selectedSale.repair_ticket}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="sale-items-list">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Descripción</th>
                                                <th>Cant</th>
                                                <th>P. Unit</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSale.items?.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.description}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unit_price)}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="sale-total-section">
                                    <div className="sale-total-row">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(selectedSale.subtotal)}</span>
                                    </div>
                                    {parseFloat(selectedSale.discount) > 0 && (
                                        <div className="sale-total-row">
                                            <span>Descuento</span>
                                            <span>-{formatCurrency(selectedSale.discount)}</span>
                                        </div>
                                    )}
                                    <div className="sale-total-row grand">
                                        <span>Total</span>
                                        <span>{formatCurrency(selectedSale.total)}</span>
                                    </div>
                                    {selectedSale.payment_method === 'cash' && (
                                        <>
                                            <div className="sale-total-row">
                                                <span>Recibido</span>
                                                <span>{formatCurrency(selectedSale.amount_received)}</span>
                                            </div>
                                            <div className="sale-total-row" style={{ color: 'var(--color-success)' }}>
                                                <span>Cambio</span>
                                                <span>{formatCurrency(selectedSale.change_amount)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-sm" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-4)' }}>
                                    {selectedSale.status === 'completed' && (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelSale(selectedSale.id)}>
                                            <XCircle size={14} /> Cancelar Venta
                                        </button>
                                    )}
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowDetail(false)}>
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`pos-toast ${toast.type}`} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
