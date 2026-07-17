import { useState, useEffect } from 'react';
import {
    Package, Plus, Search, Edit3, Trash2, X, ArrowDownCircle,
    ArrowUpCircle, AlertTriangle, DollarSign, PackageX, Boxes,
    Tag, Palette, Check, FolderPlus
} from 'lucide-react';
import { inventoryService } from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import './InventoryPage.css';

// Predefined palette colors for category indicators
const CATEGORY_COLORS = [
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f59e0b', // Naranja/Amarillo
    '#ef4444', // Rojo
    '#a855f7', // Púrpura
    '#ec4899', // Rosa
    '#06b6d4', // Cyan
    '#6b7280'  // Gris
];

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
    const [showCategoryCreator, setShowCategoryCreator] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [stockProduct, setStockProduct] = useState(null);

    // Form state
    const [form, setForm] = useState({
        name: '', sku: '', barcode: '', description: '',
        category_id: '', purchase_price: '', sale_price: '',
        stock: '', min_stock: '5', is_unique: false
    });

    const [stockForm, setStockForm] = useState({
        type: 'in', quantity: '', notes: ''
    });

    // Category Creator State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

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
            showToast('Error al cargar datos del inventario', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filtered products
    const filtered = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
        const matchCategory = !filterCategory || p.category_id == filterCategory;
        const matchStock = !filterLowStock || p.stock <= p.min_stock;
        return matchSearch && matchCategory && matchStock;
    });

    // Product CRUD
    const openNewProduct = () => {
        setEditingProduct(null);
        setForm({ name: '', sku: '', barcode: '', description: '', category_id: '', purchase_price: '', sale_price: '', stock: '0', min_stock: '5', is_unique: false });
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
            min_stock: product.min_stock,
            is_unique: !!product.is_unique
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

    // Category Creation
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showToast('Por favor, indica un nombre de categoría', 'error');
            return;
        }
        setSaving(true);
        try {
            const response = await inventoryService.createCategory({
                name: newCategoryName.trim(),
                color: newCategoryColor
            });
            showToast('Categoría creada exitosamente');
            // Refresh categories list
            const updatedCategories = await inventoryService.getCategories();
            setCategories(updatedCategories || []);
            // Set the new category in the form
            if (response && response.id) {
                setForm(prev => ({ ...prev, category_id: response.id }));
            } else {
                // Fallback matching by name
                const matching = (updatedCategories || []).find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
                if (matching) {
                    setForm(prev => ({ ...prev, category_id: matching.id }));
                }
            }
            // Reset state
            setNewCategoryName('');
            setShowCategoryCreator(false);
        } catch (err) {
            showToast(err.message || 'Error al guardar categoría', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Stock Movement
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
                    <p className="text-muted">Administra el stock y cataloga tus productos</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => {
                        setNewCategoryName('');
                        setShowCategoryCreator(true);
                    }}>
                        <FolderPlus size={16} /> Crear Categoría
                    </button>
                    <button className="btn btn-primary" onClick={openNewProduct} id="btn-new-product">
                        <Plus size={16} /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="inventory-stats">
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        <Package size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.totalProducts || 0}</div>
                        <div className="inv-stat-label">Productos</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.lowStockCount || 0}</div>
                        <div className="inv-stat-label">Bajo Stock</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        <PackageX size={22} />
                    </div>
                    <div>
                        <div className="inv-stat-value">{stats.outOfStockCount || 0}</div>
                        <div className="inv-stat-label">Sin Stock</div>
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#10b981' }}>
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
                <div className="filters-bar">
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
                        <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="">Todas las categorías</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button
                        className={`btn ${filterLowStock ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        style={{ height: '40px' }}
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
                                        <h3>Sin productos encontrados</h3>
                                        <p>Agrega productos o modifica los criterios de búsqueda.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.id}>
                                    <td><span className="font-mono" style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>{p.sku || 'N/A'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.name}</span>
                                            {p.is_unique ? (
                                                <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--color-border-strong)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.02em' }}>Único</span>
                                            ) : null}
                                        </div>
                                        {p.barcode && <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{p.barcode}</span>}
                                    </td>
                                    <td>
                                        {p.category_name ? (
                                            <span className="category-badge">
                                                <span className="category-dot" style={{ background: p.category_color || 'var(--color-primary)' }}></span>
                                                {p.category_name}
                                            </span>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>Sin categoría</span>
                                        )}
                                    </td>
                                    <td>{formatCurrency(p.purchase_price)}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-text)' }}>{formatCurrency(p.sale_price)}</td>
                                    <td>
                                        {p.is_unique ? (
                                            <span className={`stock-cell ${p.stock === 0 ? 'stock-out' : 'stock-ok'}`} style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 700 }}>
                                                {p.stock === 0 ? 'Agotado' : 'Disponible'}
                                            </span>
                                        ) : (
                                            <>
                                                <span className={`stock-cell ${p.stock === 0 ? 'stock-out' : p.stock <= p.min_stock ? 'stock-low' : 'stock-ok'}`}>
                                                    {p.stock}
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginLeft: 6 }}>/ mín {p.min_stock}</span>
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        <div className="product-actions">
                                            <button className="btn btn-ghost btn-icon" title="Agregar/Retirar stock" onClick={() => openStockModal(p)}>
                                                <Boxes size={15} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => openEditProduct(p)}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon btn-danger" title="Eliminar" onClick={() => handleDeleteProduct(p.id)}>
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

            {/* Product Modal */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}><X size={16} /></button>
                        </div>
                        <div className="product-form">
                            <div className="input-group full-width">
                                <label>Nombre del Producto *</label>
                                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Mica templada iPhone 15" id="pf-name" />
                            </div>

                            <div className="form-grid">
                                <div className="input-group">
                                    <label>SKU</label>
                                    <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ej. MIC-IPH15" />
                                </div>
                                <div className="input-group">
                                    <label>Código de Barras</label>
                                    <input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Código de barras..." />
                                </div>
                            </div>

                            <div className="category-select-container">
                                <div className="category-select-header">
                                    <label>Categoría</label>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--color-primary)', fontWeight: 600, padding: 0 }}
                                        onClick={() => setShowCategoryCreator(true)}
                                    >
                                        + Nueva Categoría
                                    </button>
                                </div>
                                {categories.length === 0 ? (
                                    <p className="text-muted" style={{ fontSize: 'var(--font-xs)', padding: 'var(--sp-2) 0' }}>No hay categorías. Crea una usando el botón de arriba.</p>
                                ) : (
                                    <div className="category-select-grid">
                                        {categories.map(c => (
                                            <button
                                                key={c.id}
                                                className={`category-select-pill ${form.category_id == c.id ? 'selected' : ''}`}
                                                onClick={() => setForm({ ...form, category_id: c.id })}
                                                type="button"
                                            >
                                                <span className="category-dot" style={{ backgroundColor: c.color || 'var(--color-primary)', width: '6px', height: '6px', marginRight: '2px' }} />
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
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

                            <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', margin: 'var(--sp-2) 0' }}>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                     <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-text)' }}>¿Producto Único?</span>
                                     <span className="text-muted" style={{ fontSize: 'var(--font-xs)', lineHeight: 1.3 }}>Venta única de inventario (ej. celular usado, equipo específico). Al venderse se agota.</span>
                                 </div>
                                 <label className="switch-wrapper" style={{ position: 'relative', display: 'inline-block', width: '42px', height: '22px', flexShrink: 0 }}>
                                     <input
                                         type="checkbox"
                                         checked={form.is_unique}
                                         onChange={(e) => {
                                             const isChecked = e.target.checked;
                                             setForm({
                                                 ...form,
                                                 is_unique: isChecked,
                                                 stock: isChecked ? '1' : form.stock,
                                                 min_stock: isChecked ? '0' : form.min_stock
                                             });
                                         }}
                                         style={{ opacity: 0, width: 0, height: 0 }}
                                     />
                                     <span className="slider" style={{
                                         position: 'absolute',
                                         cursor: 'pointer',
                                         top: 0,
                                         left: 0,
                                         right: 0,
                                         bottom: 0,
                                         backgroundColor: form.is_unique ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                                         border: `1.5px solid ${form.is_unique ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                                         transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                         borderRadius: '22px'
                                     }}>
                                         <span style={{
                                             position: 'absolute',
                                             content: '""',
                                             height: '14px',
                                             width: '14px',
                                             left: form.is_unique ? '23px' : '3px',
                                             bottom: '2.5px',
                                             backgroundColor: form.is_unique ? 'var(--color-primary-contrast)' : 'var(--color-text-secondary)',
                                             transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                             borderRadius: '50%'
                                         }} />
                                     </span>
                                 </label>
                             </div>

                             <div className="form-grid">
                                 <div className="input-group">
                                     <label>Stock Inicial</label>
                                     <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} disabled={editingProduct !== null || form.is_unique} />
                                 </div>
                                 <div className="input-group">
                                     <label>Stock Mínimo</label>
                                     <input className="input" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} disabled={form.is_unique} />
                                 </div>
                             </div>

                             <div className="input-group">
                                 <label>Descripción del Producto</label>
                                 <textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles o especificaciones..." />
                             </div>

                            <div className="flex gap-sm" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
                                <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSaveProduct} disabled={saving} id="pf-save">
                                    {saving ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Standalone Category Creator Modal */}
            {showCategoryCreator && (
                <div className="modal-overlay" onClick={() => setShowCategoryCreator(false)} style={{ zIndex: 1100 }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag className="text-primary" size={20} /> Crear Nueva Categoría
                            </h3>
                            <button className="modal-close" onClick={() => setShowCategoryCreator(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginTop: 'var(--sp-2)' }}>
                            <div className="input-group">
                                <label>Nombre de la Categoría *</label>
                                <input
                                    className="input"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ej. Pantallas, Accesorios, Herramientas..."
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Palette size={14} /> Color de Indicador
                                </label>
                                <div className="color-picker-grid">
                                    {CATEGORY_COLORS.map(color => (
                                        <div
                                            key={color}
                                            className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                                            style={{ backgroundColor: color, color: color }}
                                            onClick={() => setNewCategoryColor(color)}
                                        >
                                            {newCategoryColor === color && <Check size={12} style={{ color: '#fff', margin: '4px' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: 'var(--sp-2)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryCreator(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Movement Modal */}
            {showStockModal && stockProduct && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Movimiento de Stock</h3>
                            <button className="modal-close" onClick={() => setShowStockModal(false)}><X size={16} /></button>
                        </div>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-3)' }}>
                            <strong>{stockProduct.name}</strong> — Stock actual: <strong className="text-primary">{stockProduct.stock}</strong>
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
                            <label>Notas / Razón del movimiento</label>
                            <input
                                className="input"
                                value={stockForm.notes}
                                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                                placeholder="Ej: Compra a proveedor, desecho..."
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
