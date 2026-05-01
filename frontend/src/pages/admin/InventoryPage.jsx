import { useState, useEffect } from 'react';
import {
    Package, Plus, Search, Edit3, Trash2, X, ArrowDownCircle,
    ArrowUpCircle, AlertTriangle, DollarSign, PackageX, Boxes
} from 'lucide-react';
import { inventoryService } from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import './InventoryPage.css';

export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);

    // Modals
    const [showProductModal, setShowProductModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [stockProduct, setStockProduct] = useState(null);

    // Form state
    const [form, setForm] = useState({
        name: '', sku: '', barcode: '', description: '',
        category_id: '', purchase_price: '', sale_price: '',
        stock: '', min_stock: '5'
    });

    const [stockForm, setStockForm] = useState({
        type: 'in', quantity: '', notes: ''
    });

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [prodData, catData, statsData] = await Promise.all([
                inventoryService.getProducts({ limit: 200 }),
                inventoryService.getCategories(),
                inventoryService.getStats()
            ]);
            setProducts(prodData.products || []);
            setCategories(catData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Filtered products ───
    const filtered = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
        const matchCategory = !filterCategory || p.category_id == filterCategory;
        const matchStock = !filterLowStock || p.stock <= p.min_stock;
        return matchSearch && matchCategory && matchStock;
    });

    // ─── Product CRUD ───
    const openNewProduct = () => {
        setEditingProduct(null);
        setForm({ name: '', sku: '', barcode: '', description: '', category_id: '', purchase_price: '', sale_price: '', stock: '0', min_stock: '5' });
        setShowProductModal(true);
    };

    const openEditProduct = (product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            sku: product.sku || '',
            barcode: product.barcode || '',
            description: product.description || '',
            category_id: product.category_id || '',
            purchase_price: product.purchase_price || '',
            sale_price: product.sale_price || '',
            stock: product.stock,
            min_stock: product.min_stock
        });
        setShowProductModal(true);
    };

    const handleSaveProduct = async () => {
        if (!form.name || !form.sale_price) {
            showToast('Nombre y precio de venta son obligatorios', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editingProduct) {
                await inventoryService.updateProduct(editingProduct.id, form);
                showToast('Producto actualizado');
            } else {
                await inventoryService.createProduct(form);
                showToast('Producto creado');
            }
            setShowProductModal(false);
            loadAll();
        } catch (err) {
            showToast(err.message || 'Error al guardar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
            await inventoryService.deleteProduct(id);
            showToast('Producto eliminado');
            loadAll();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // ─── Stock Movement ───
    const openStockModal = (product) => {
        setStockProduct(product);
        setStockForm({ type: 'in', quantity: '', notes: '' });
        setShowStockModal(true);
    };

    const handleStockMovement = async () => {
        if (!stockForm.quantity || parseInt(stockForm.quantity) <= 0) {
            showToast('Cantidad inválida', 'error');
            return;
        }
        setSaving(true);
        try {
            await inventoryService.addStockMovement({
                product_id: stockProduct.id,
                type: stockForm.type,
                quantity: parseInt(stockForm.quantity),
                notes: stockForm.notes
            });
            showToast(`Stock ${stockForm.type === 'in' ? 'ingresado' : 'retirado'}`);
            setShowStockModal(false);
            loadAll();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return <div className="loading-screen"><div className="spinner"></div><p>Cargando inventario...</p></div>;
    }

    return (
        <div className="inventory-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Inventario</h1>
                    <p>Gestión de productos y stock</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={openNewProduct} id="btn-new-product">
                        <Plus size={16} /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="inventory-stats">
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        <Package size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.totalProducts || 0}</div>
                        <div className="inv-stat-label">Productos</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.lowStockCount || 0}</div>
                        <div className="inv-stat-label">Bajo Stock</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        <PackageX size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.outOfStockCount || 0}</div>
                        <div className="inv-stat-label">Sin Stock</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{formatCurrency(stats.totalInventoryValue || 0)}</div>
                        <div className="inv-stat-label">Valor Total</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="inventory-table-actions">
                <div className="filters-bar" style={{ marginBottom: 0 }}>
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            className="input"
                            placeholder="Buscar producto o SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            id="inv-search"
                        />
                    </div>
                    <div className="filter-group">
                        <select className="select select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="">Todas las categorías</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button
                        className={`btn btn-sm ${filterLowStock ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterLowStock(!filterLowStock)}
                    >
                        <AlertTriangle size={14} /> Bajo Stock
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>P. Compra</th>
                            <th>P. Venta</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state">
                                        <Package size={36} className="empty-icon" />
                                        <h3>Sin productos</h3>
                                        <p>Agrega tu primer producto</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.id}>
                                    <td><span className="font-mono" style={{ fontSize: 'var(--font-xs)' }}>{p.sku}</span></td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                                        {p.barcode && <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>{p.barcode}</span>}
                                    </td>
                                    <td>
                                        {p.category_name && (
                                            <span className="category-badge">
                                                <span className="category-dot" style={{ background: p.category_color }}></span>
                                                {p.category_name}
                                            </span>
                                        )}
                                    </td>
                                    <td>{formatCurrency(p.purchase_price)}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.sale_price)}</td>
                                    <td>
                                        <span className={`stock-cell ${p.stock === 0 ? 'stock-out' : p.stock <= p.min_stock ? 'stock-low' : 'stock-ok'}`}>
                                            {p.stock}
                                        </span>
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginLeft: 4 }}>/ mín {p.min_stock}</span>
                                    </td>
                                    <td>
                                        <div className="product-actions">
                                            <button className="btn btn-ghost btn-icon" title="Agregar stock" onClick={() => openStockModal(p)}>
                                                <Boxes size={15} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => openEditProduct(p)}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" title="Eliminar" onClick={() => handleDeleteProduct(p.id)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ═══ Product Modal ═══ */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}><X size={16} /></button>
                        </div>
                        <div className="product-form">
                            <div className="input-group full-width">
                                <label>Nombre *</label>
                                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Mica templada iPhone 15" id="pf-name" />
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>SKU</label>
                                    <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generado" />
                                </div>
                                <div className="input-group">
                                    <label>Código de Barras</label>
                                    <input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Opcional" />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Categoría</label>
                                <div className="category-select-grid">
                                    {categories.map(c => (
                                        <button
                                            key={c.id}
                                            className={`category-select-pill ${form.category_id == c.id ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, category_id: c.id })}
                                            type="button"
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Precio de Compra</label>
                                    <input className="input" type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="$0.00" />
                                </div>
                                <div className="input-group">
                                    <label>Precio de Venta *</label>
                                    <input className="input" type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="$0.00" id="pf-price" />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Stock Inicial</label>
                                    <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Stock Mínimo</label>
                                    <input className="input" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Descripción</label>
                                <textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del producto..." />
                            </div>

                            <div className="flex gap-sm" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
                                <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSaveProduct} disabled={saving} id="pf-save">
                                    {saving ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Producto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Stock Movement Modal ═══ */}
            {showStockModal && stockProduct && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Movimiento de Stock</h3>
                            <button className="modal-close" onClick={() => setShowStockModal(false)}><X size={16} /></button>
                        </div>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-3)' }}>
                            <strong>{stockProduct.name}</strong> — Stock actual: <strong>{stockProduct.stock}</strong>
                        </p>

                        <div className="stock-movement-type">
                            <button
                                className={`stock-type-btn ${stockForm.type === 'in' ? 'selected-in' : ''}`}
                                onClick={() => setStockForm({ ...stockForm, type: 'in' })}
                            >
                                <ArrowDownCircle size={16} /> Entrada
                            </button>
                            <button
                                className={`stock-type-btn ${stockForm.type === 'out' ? 'selected-out' : ''}`}
                                onClick={() => setStockForm({ ...stockForm, type: 'out' })}
                            >
                                <ArrowUpCircle size={16} /> Salida
                            </button>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                            <label>Cantidad</label>
                            <input
                                className="input"
                                type="number"
                                min="1"
                                value={stockForm.quantity}
                                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                                placeholder="0"
                                id="sf-qty"
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--sp-3)' }}>
                            <label>Notas (opcional)</label>
                            <input
                                className="input"
                                value={stockForm.notes}
                                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                                placeholder="Razón del movimiento..."
                            />
                        </div>

                        <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancelar</button>
                            <button
                                className={`btn ${stockForm.type === 'in' ? 'btn-primary' : 'btn-danger'}`}
                                onClick={handleStockMovement}
                                disabled={saving}
                                id="sf-save"
                            >
                                {saving ? 'Guardando...' : stockForm.type === 'in' ? 'Registrar Entrada' : 'Registrar Salida'}
                            </button>
                        </div>
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
