import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    ShoppingCart, Search, Package, Wrench, X, Plus, Minus, Trash2,
    CreditCard, Banknote, ArrowRightLeft, Printer, CheckCircle2,
    User, ShoppingBag, ClipboardList, Hash, AlertCircle
} from 'lucide-react';
import { inventoryService, posService, customerService, servicesCatalog, settingsService, repairService } from '../../services/api';
import { formatCurrency, STATUS_LABELS } from '../../utils/constants';
import PrintReceipt from '../../components/common/PrintReceipt';
import SignatureModal from '../../components/common/SignatureModal';
import './POSPage.css';

export default function POSPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // ─── State ───
    const [mode, setMode] = useState('products'); // 'products' | 'services' | 'repairs'
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [loading, setLoading] = useState(true);

    // Billable repairs
    const [billableRepairs, setBillableRepairs] = useState([]);
    const [repairSearch, setRepairSearch] = useState('');

    // Customer
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // Repair link
    const [linkedRepair, setLinkedRepair] = useState(null);

    // Receipt modal
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [settings, setSettings] = useState({});
    const [showSigModal, setShowSigModal] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const searchRef = useRef(null);
    const customerSearchTimeout = useRef(null);
    const loadedRepairIdRef = useRef(null);

    // ─── Load data ───
    useEffect(() => {
        loadData();
    }, []);

    // ─── Deep-link: load repair from URL ───
    useEffect(() => {
        const repairId = searchParams.get('repair_id');
        if (repairId) {
            loadRepairFromURL(repairId);
        }
    }, [searchParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catData, prodData, svcData, repairsData, settingsData] = await Promise.allSettled([
                inventoryService.getCategories(),
                inventoryService.getProducts({ limit: 200 }),
                servicesCatalog.getAll({ limit: 200 }),
                posService.getBillableRepairs(),
                settingsService.getAll()
            ]);
            if (catData.status === 'fulfilled') setCategories(catData.value || []);
            if (prodData.status === 'fulfilled') setProducts(prodData.value?.products || []);
            if (svcData.status === 'fulfilled') {
                const val = svcData.value;
                setServices(Array.isArray(val) ? val : val?.services || []);
            }
            if (repairsData.status === 'fulfilled') setBillableRepairs(repairsData.value || []);
            if (settingsData.status === 'fulfilled') setSettings(settingsData.value || {});
        } catch (err) {
            console.error('Error loading POS data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRepairFromURL = async (repairId) => {
        if (loadedRepairIdRef.current === repairId) return;
        loadedRepairIdRef.current = repairId;
        try {
            const repair = await posService.getRepairForPOS(repairId);
            if (repair) {
                addRepairToCart(repair);
                // Clean URL param safely without mutating state directly
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('repair_id');
                setSearchParams(newParams, { replace: true });
            }
        } catch (err) {
            console.error('Error loading repair for POS:', err);
            showToast('No se pudo cargar la reparación', 'error');
        }
    };

    // ─── Load billable repairs (with search) ───
    useEffect(() => {
        if (mode !== 'repairs') return;
        const timeout = setTimeout(async () => {
            try {
                const params = {};
                if (repairSearch.trim()) params.search = repairSearch;
                const data = await posService.getBillableRepairs(params);
                setBillableRepairs(data || []);
            } catch (err) {
                console.error(err);
            }
        }, repairSearch ? 300 : 0);
        return () => clearTimeout(timeout);
    }, [mode, repairSearch]);

    // ─── Filtered items ───
    const filteredProducts = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
            (p.barcode && p.barcode.includes(search));
        const matchCategory = !selectedCategory || p.category_id === selectedCategory;
        return matchSearch && matchCategory;
    });

    const filteredServices = services.filter(s => {
        return !search || s.name.toLowerCase().includes(search.toLowerCase());
    });

    // ─── Cart operations ───
    const addToCart = useCallback((item, type = 'product') => {
        setCart(prev => {
            const key = type === 'product' ? `p-${item.id}` : `s-${item.id}`;
            const existing = prev.find(i => i.key === key);

            if (existing) {
                if (type === 'product' && existing.quantity >= item.stock) {
                    showToast('Sin stock disponible', 'error');
                    return prev;
                }
                return prev.map(i =>
                    i.key === key ? { ...i, quantity: i.quantity + 1 } : i
                );
            }

            return [...prev, {
                key,
                type,
                product_id: type === 'product' ? item.id : null,
                service_id: type === 'service' ? item.id : null,
                description: item.name,
                unit_price: parseFloat(type === 'product' ? item.sale_price : item.base_price) || 0,
                quantity: 1,
                discount: 0,
                maxStock: type === 'product' ? item.stock : 999
            }];
        });
    }, []);

    const addRepairToCart = (repair) => {
        const key = `r-${repair.id}`;

        // Auto-set customer from repair
        if (repair.customer_id && !selectedCustomer) {
            setSelectedCustomer({
                id: repair.customer_id,
                first_name: repair.customer_first_name,
                last_name: repair.customer_last_name,
                phone: repair.customer_phone
            });
        }

        // Link the repair
        setLinkedRepair({
            id: repair.id,
            ticket_number: repair.ticket_number
        });

        // Build repair description
        const device = `${repair.brand_name || repair.brand_other || ''} ${repair.model || ''}`.trim();
        const serviceName = repair.service_name || repair.service_requested || 'Reparación';
        const description = `${serviceName} — ${device} (${repair.ticket_number})`;

        // The amount to charge is the remaining balance
        const balance = repair.balance || (parseFloat(repair.total_cost) - parseFloat(repair.advance_payment || 0));

        // Build itemized breakdown for the cart
        const items = [];

        // Add as a single "repair charge" line with the full balance
        items.push({
            key,
            type: 'repair',
            product_id: null,
            service_id: null,
            repair_id: repair.id,
            description,
            unit_price: Math.max(0, balance),
            quantity: 1,
            discount: 0,
            maxStock: 1,
            isRepair: true
        });

        setCart(prev => {
            const existing = prev.find(i => i.key === key);
            if (existing) {
                return prev;
            }
            showToast(`Reparación ${repair.ticket_number} agregada`);
            return [...prev, ...items];
        });
    };

    const updateQuantity = (key, delta) => {
        setCart(prev => prev.map(item => {
            if (item.key !== key) return item;
            // Repairs can't change quantity
            if (item.type === 'repair') return item;
            const newQty = item.quantity + delta;
            if (newQty < 1) return item;
            if (item.type === 'product' && newQty > item.maxStock) {
                showToast('Stock insuficiente', 'error');
                return item;
            }
            return { ...item, quantity: newQty };
        }));
    };

    const removeFromCart = (key) => {
        const item = cart.find(i => i.key === key);
        // If removing a repair, also unlink it
        if (item?.type === 'repair') {
            setLinkedRepair(null);
        }
        setCart(prev => prev.filter(i => i.key !== key));
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setAmountReceived('');
        setSelectedCustomer(null);
        setLinkedRepair(null);
    };

    // ─── Calculations ───
    const subtotal = cart.reduce((sum, item) =>
        sum + (item.unit_price * item.quantity) - (item.discount || 0), 0
    );
    const total = Math.max(0, subtotal - (parseFloat(discount) || 0));
    const changeAmount = paymentMethod === 'cash'
        ? Math.max(0, (parseFloat(amountReceived) || 0) - total)
        : 0;

    // ─── Customer search ───
    const handleCustomerSearch = (value) => {
        setCustomerSearch(value);
        if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current);

        if (value.length < 2) {
            setCustomerResults([]);
            setShowCustomerResults(false);
            return;
        }

        customerSearchTimeout.current = setTimeout(async () => {
            try {
                const data = await customerService.getAll({ search: value, limit: 5 });
                setCustomerResults(data.customers || []);
                setShowCustomerResults(true);
            } catch (err) {
                console.error(err);
            }
        }, 300);
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setShowCustomerResults(false);
    };

    // ─── Checkout ───
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total) {
            showToast('Monto recibido insuficiente', 'error');
            return;
        }

        // Si hay una reparación vinculada en el carrito, requerimos la firma del cliente
        if (linkedRepair) {
            setShowSigModal(true);
            return;
        }

        // De lo contrario, cobro directo tradicional
        await completeCheckout(null);
    };

    const completeCheckout = async (signatureData) => {
        setShowSigModal(false);
        try {
            const saleData = {
                customer_id: selectedCustomer?.id || null,
                repair_id: linkedRepair?.id || null,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    service_id: item.service_id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount: item.discount || 0
                })),
                discount: parseFloat(discount) || 0,
                payment_method: paymentMethod,
                amount_received: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
                notes: signatureData ? 'Cobrado en POS con firma de conformidad' : (linkedRepair ? 'Cobrado en POS sin firma de conformidad' : null)
            };

            const result = await posService.createSale(saleData);
            
            // Si hay reparación vinculada, actualizar estado en backend a 'delivered' con la firma
            if (linkedRepair) {
                const note = signatureData ? 'Equipo entregado al cliente con firma (cobrado en POS)' : 'Equipo entregado al cliente (sin firma - cobrado en POS)';
                await repairService.updateStatus(linkedRepair.id, 'delivered', note, null, signatureData);
            }

            const saleDetail = await posService.getSaleById(result.sale.id);
            setLastSale(saleDetail);
            setShowReceipt(true);
            showToast(`Venta ${result.sale.sale_number} registrada`, 'success');
            clearCart();
            loadData();
        } catch (err) {
            showToast(err.message || 'Error al procesar venta', 'error');
        }
    };

    // ─── Toast ───
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── Render ───
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Cargando punto de venta...</p>
            </div>
        );
    }

    return (
        <div className="pos-layout">
            {/* ═══ LEFT: Catalog ═══ */}
            <div className="pos-catalog">
                <div className="pos-catalog-header">
                    <h1>
                        <ShoppingBag size={22} className="pos-icon" />
                        Punto de Venta
                    </h1>
                    <div className="pos-search-row">
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                ref={searchRef}
                                type="text"
                                className="input"
                                placeholder={
                                    mode === 'products' ? 'Buscar producto, SKU o código...' :
                                    mode === 'services' ? 'Buscar servicio...' :
                                    'Buscar ticket, cliente o modelo...'
                                }
                                value={mode === 'repairs' ? repairSearch : search}
                                onChange={(e) => mode === 'repairs' ? setRepairSearch(e.target.value) : setSearch(e.target.value)}
                                id="pos-search"
                            />
                        </div>
                        <div className="pos-mode-toggle">
                            <button
                                className={mode === 'products' ? 'active' : ''}
                                onClick={() => { setMode('products'); setSearch(''); }}
                            >
                                <Package size={14} /> Productos
                            </button>
                            <button
                                className={mode === 'services' ? 'active' : ''}
                                onClick={() => { setMode('services'); setSearch(''); }}
                            >
                                <Wrench size={14} /> Servicios
                            </button>
                            <button
                                className={`${mode === 'repairs' ? 'active' : ''} ${billableRepairs.length > 0 ? 'has-badge' : ''}`}
                                onClick={() => { setMode('repairs'); setRepairSearch(''); }}
                            >
                                <ClipboardList size={14} /> Reparaciones
                                {billableRepairs.length > 0 && (
                                    <span className="mode-badge">{billableRepairs.length}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories filter (products only) */}
                {mode === 'products' && categories.length > 0 && (
                    <div className="pos-categories">
                        <button
                            className={`pos-category-chip ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`pos-category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{ '--cat-color': cat.color }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── Content Grid ─── */}
                <div className="pos-products-grid">
                    {mode === 'products' ? (
                        /* ── Products Tab ── */
                        filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="pos-product-card"
                                    style={{ '--cat-color': product.category_color }}
                                    onClick={() => product.stock > 0 && addToCart(product, 'product')}
                                >
                                    <span className="pos-product-name">{product.name}</span>
                                    <span className="pos-product-meta">{product.sku}</span>
                                    <span className="pos-product-price">{formatCurrency(product.sale_price)}</span>
                                    <span className={`pos-product-stock ${
                                        product.stock === 0 ? 'no-stock' :
                                        product.stock <= product.min_stock ? 'low-stock' : 'in-stock'
                                    }`}>
                                        {product.stock === 0 ? 'Sin stock' :
                                         product.stock <= product.min_stock ? `¡${product.stock} uds!` :
                                         `${product.stock} uds`}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <Package size={40} className="empty-icon" />
                                <h3>Sin productos</h3>
                                <p>Agrega productos desde Inventario</p>
                            </div>
                        )
                    ) : mode === 'services' ? (
                        /* ── Services Tab ── */
                        filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <div
                                    key={service.id}
                                    className="pos-service-card"
                                    onClick={() => addToCart(service, 'service')}
                                >
                                    <span className="pos-product-name">{service.name}</span>
                                    <span className="pos-product-meta">{service.estimated_time || ''}</span>
                                    <span className="pos-product-price">{formatCurrency(service.base_price)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <Wrench size={40} className="empty-icon" />
                                <h3>Sin servicios</h3>
                                <p>Agrega servicios desde el catálogo</p>
                            </div>
                        )
                    ) : (
                        /* ── Repairs Tab ── */
                        billableRepairs.length > 0 ? (
                            billableRepairs.map(repair => {
                                const isInCart = cart.some(i => i.key === `r-${repair.id}`);
                                return (
                                    <div
                                        key={repair.id}
                                        className={`pos-repair-card ${isInCart ? 'in-cart' : ''}`}
                                        onClick={() => !isInCart && addRepairToCart(repair)}
                                    >
                                        <div className="repair-card-header">
                                            <span className="repair-card-ticket">
                                                <Hash size={12} />
                                                {repair.ticket_number}
                                            </span>
                                            <span className={`status-badge-mini status-${repair.status}`}>
                                                {STATUS_LABELS[repair.status]}
                                            </span>
                                        </div>
                                        <span className="pos-product-name">
                                            {repair.brand_name || repair.brand_other} {repair.model}
                                        </span>
                                        <span className="pos-product-meta">
                                            {repair.customer_first_name} {repair.customer_last_name}
                                        </span>
                                        <span className="pos-product-meta" style={{ fontSize: '0.65rem' }}>
                                            {repair.service_name || repair.service_requested || 'Reparación'}
                                        </span>
                                        <div className="repair-card-pricing">
                                            <div className="repair-price-row">
                                                <span>Total:</span>
                                                <span>{formatCurrency(repair.total_cost)}</span>
                                            </div>
                                            {parseFloat(repair.advance_payment) > 0 && (
                                                <div className="repair-price-row advance">
                                                    <span>Anticipo:</span>
                                                    <span>-{formatCurrency(repair.advance_payment)}</span>
                                                </div>
                                            )}
                                            <div className="repair-price-row balance">
                                                <span>Saldo:</span>
                                                <span>{formatCurrency(repair.balance)}</span>
                                            </div>
                                        </div>
                                        {isInCart && (
                                            <span className="repair-in-cart-badge">
                                                <CheckCircle2 size={12} /> En carrito
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                <ClipboardList size={40} className="empty-icon" />
                                <h3>Sin reparaciones pendientes</h3>
                                <p>Las reparaciones listas para cobrar aparecerán aquí</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* ═══ RIGHT: Cart ═══ */}
            <div className="pos-cart">
                <div className="pos-cart-header">
                    <h2>
                        <ShoppingCart size={18} />
                        Carrito
                        {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
                    </h2>
                    {cart.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={clearCart}>
                            <Trash2 size={14} /> Limpiar
                        </button>
                    )}
                </div>

                {/* Customer Selector */}
                <div className="pos-customer-select">
                    <label>Cliente {linkedRepair ? '' : '(opcional)'}</label>
                    {selectedCustomer ? (
                        <div className="selected-customer">
                            <span className="customer-name">
                                <User size={14} style={{ marginRight: 6, opacity: 0.5 }} />
                                {selectedCustomer.first_name} {selectedCustomer.last_name}
                            </span>
                            {!linkedRepair && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="customer-search-input">
                            <input
                                className="input"
                                placeholder="Buscar cliente..."
                                value={customerSearch}
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                                id="pos-customer-search"
                            />
                            {showCustomerResults && customerResults.length > 0 && (
                                <div className="customer-results">
                                    {customerResults.map(c => (
                                        <div
                                            key={c.id}
                                            className="customer-result-item"
                                            onClick={() => selectCustomer(c)}
                                        >
                                            <span>{c.first_name} {c.last_name}</span>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                                                {c.phone || c.email}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Linked Repair */}
                {linkedRepair && (
                    <div className="pos-repair-link">
                        <div className="repair-link-badge">
                            <Wrench size={14} />
                            <span>Reparación vinculada: </span>
                            <span className="ticket-num">{linkedRepair.ticket_number}</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                setLinkedRepair(null);
                                // Remove repair items from cart
                                setCart(prev => prev.filter(i => i.type !== 'repair'));
                            }} style={{ marginLeft: 'auto' }}>
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Cart Items */}
                <div className="pos-cart-items">
                    {cart.length === 0 ? (
                        <div className="pos-cart-empty">
                            <ShoppingCart size={36} style={{ opacity: 0.2 }} />
                            <p>Carrito vacío</p>
                            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                                Selecciona productos, servicios o una reparación
                            </p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.key} className={`cart-item ${item.isRepair ? 'cart-item-repair' : ''}`}>
                                <div className="cart-item-info">
                                    <div className="cart-item-name">
                                        {item.isRepair && <Wrench size={12} className="cart-repair-icon" />}
                                        {item.description}
                                    </div>
                                    <div className="cart-item-price">
                                        {item.isRepair ? 'Saldo pendiente' : `${formatCurrency(item.unit_price)} c/u`}
                                    </div>
                                </div>
                                {!item.isRepair && (
                                    <div className="cart-item-qty">
                                        <button onClick={() => updateQuantity(item.key, -1)}>
                                            <Minus size={12} />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.key, 1)}>
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                )}
                                <div className="cart-item-total">
                                    {formatCurrency(item.unit_price * item.quantity)}
                                </div>
                                <button className="cart-item-remove" onClick={() => removeFromCart(item.key)}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer: Totals + Checkout */}
                {cart.length > 0 && (
                    <div className="pos-cart-footer">
                        <div className="cart-totals">
                            <div className="cart-total-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="cart-total-row cart-discount-row">
                                <span>Descuento</span>
                                <input
                                    type="number"
                                    className="input input-sm"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    min="0"
                                    id="pos-discount"
                                />
                            </div>
                            <div className="cart-total-row grand-total">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="pos-payment-methods">
                            <button
                                className={`payment-method-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <Banknote size={18} />
                                Efectivo
                            </button>
                            <button
                                className={`payment-method-btn ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <CreditCard size={18} />
                                Tarjeta
                            </button>
                            <button
                                className={`payment-method-btn ${paymentMethod === 'transfer' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('transfer')}
                            >
                                <ArrowRightLeft size={18} />
                                Transferencia
                            </button>
                        </div>

                        {/* Cash input */}
                        {paymentMethod === 'cash' && (
                            <div className="cash-input-row">
                                <label>Recibido:</label>
                                <input
                                    type="number"
                                    className="input input-sm"
                                    placeholder="$0.00"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    id="pos-amount-received"
                                />
                                {parseFloat(amountReceived) > 0 && (
                                    <span className="change-display">
                                        Cambio: {formatCurrency(changeAmount)}
                                    </span>
                                )}
                            </div>
                        )}

                        <button
                            className="pos-checkout-btn"
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || (paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total)}
                            id="pos-checkout"
                        >
                            <CheckCircle2 size={20} />
                            Cobrar {formatCurrency(total)}
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ Receipt Modal ═══ */}
            <PrintReceipt
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                data={lastSale}
                type="pos"
                settings={settings}
            />

            <SignatureModal
                isOpen={showSigModal}
                onClose={() => setShowSigModal(false)}
                onSave={completeCheckout}
                title="Confirmar Entrega de Equipo"
                description="Por favor firme para confirmar la recepción y entrega de conformidad de su equipo."
            />

            {/* Toast */}
            {toast && (
                <div className={`pos-toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
