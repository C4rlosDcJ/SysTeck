import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/api';
import { STATUS_LABELS, STATUS_COLORS, formatCurrency } from '../../utils/constants';
import {
    Search, X, Wrench, User, Package, Hash, ArrowRight,
    Command, Smartphone, Mail, Phone
} from 'lucide-react';
import './GlobalSearch.css';

export default function GlobalSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ repairs: [], customers: [], products: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults({ repairs: [], customers: [], products: [] });
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced search
    const doSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setResults({ repairs: [], customers: [], products: [] });
            return;
        }
        setLoading(true);
        try {
            const data = await searchService.globalSearch(q);
            setResults(data);
            setSelectedIndex(0);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(query), 250);
        return () => clearTimeout(debounceRef.current);
    }, [query, doSearch]);

    // Build flat list of navigable results
    const allItems = [
        ...results.repairs.map(r => ({ type: 'repair', data: r })),
        ...results.customers.map(c => ({ type: 'customer', data: c })),
        ...results.products.map(p => ({ type: 'product', data: p })),
    ];

    const totalResults = allItems.length;

    // Keyboard nav
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && totalResults > 0) {
            e.preventDefault();
            navigateToItem(allItems[selectedIndex]);
        }
    };

    const navigateToItem = (item) => {
        if (!item) return;
        onClose();
        if (item.type === 'repair') {
            navigate(`/admin/reparaciones/${item.data.id}`);
        } else if (item.type === 'customer') {
            navigate('/admin/clientes');
        } else if (item.type === 'product') {
            navigate('/admin/inventario');
        }
    };

    if (!isOpen) return null;

    let currentFlatIndex = 0;

    return (
        <div className="gs-overlay" onClick={onClose}>
            <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
                {/* Search Input */}
                <div className="gs-input-row">
                    <Search size={20} className="gs-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar tickets, clientes, productos..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="gs-input"
                        id="global-search-input"
                    />
                    <div className="gs-shortcut-hint">
                        ESC
                    </div>
                </div>

                {/* Results */}
                <div className="gs-results">
                    {loading && (
                        <div className="gs-loading">
                            <div className="spinner-small"></div>
                            <span>Buscando...</span>
                        </div>
                    )}

                    {!loading && query.length >= 2 && totalResults === 0 && (
                        <div className="gs-empty">
                            <Search size={32} />
                            <p>No se encontraron resultados para "<strong>{query}</strong>"</p>
                        </div>
                    )}

                    {!loading && query.length < 2 && (
                        <div className="gs-hint">
                            <Command size={20} />
                            <p>Escribe al menos 2 caracteres para buscar</p>
                            <div className="gs-hint-tags">
                                <span>Tickets</span>
                                <span>Clientes</span>
                                <span>Productos</span>
                                <span>IMEI / Serie</span>
                            </div>
                        </div>
                    )}

                    {/* Repairs */}
                    {results.repairs.length > 0 && (
                        <div className="gs-group">
                            <div className="gs-group-header">
                                <Wrench size={14} />
                                <span>Reparaciones</span>
                                <span className="gs-group-count">{results.repairs.length}</span>
                            </div>
                            {results.repairs.map((repair) => {
                                const idx = currentFlatIndex++;
                                return (
                                    <div
                                        key={`r-${repair.id}`}
                                        className={`gs-item ${idx === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => navigateToItem({ type: 'repair', data: repair })}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <div className="gs-item-icon repair-icon">
                                            <Hash size={14} />
                                        </div>
                                        <div className="gs-item-info">
                                            <div className="gs-item-title">
                                                <span className="gs-ticket">{repair.ticket_number}</span>
                                                <span className="gs-model">
                                                    {repair.brand_name} {repair.model}
                                                </span>
                                            </div>
                                            <div className="gs-item-meta">
                                                {repair.customer_first_name} {repair.customer_last_name}
                                            </div>
                                        </div>
                                        <span
                                            className="gs-status-dot"
                                            style={{ background: STATUS_COLORS[repair.status] }}
                                            title={STATUS_LABELS[repair.status]}
                                        ></span>
                                        <ArrowRight size={14} className="gs-arrow" />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Customers */}
                    {results.customers.length > 0 && (
                        <div className="gs-group">
                            <div className="gs-group-header">
                                <User size={14} />
                                <span>Clientes</span>
                                <span className="gs-group-count">{results.customers.length}</span>
                            </div>
                            {results.customers.map((customer) => {
                                const idx = currentFlatIndex++;
                                return (
                                    <div
                                        key={`c-${customer.id}`}
                                        className={`gs-item ${idx === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => navigateToItem({ type: 'customer', data: customer })}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <div className="gs-item-icon customer-icon">
                                            <User size={14} />
                                        </div>
                                        <div className="gs-item-info">
                                            <div className="gs-item-title">
                                                {customer.first_name} {customer.last_name}
                                            </div>
                                            <div className="gs-item-meta">
                                                {customer.email && <span><Mail size={10} /> {customer.email}</span>}
                                                {customer.phone && <span><Phone size={10} /> {customer.phone}</span>}
                                                <span>{customer.total_repairs} reparaciones</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="gs-arrow" />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Products */}
                    {results.products.length > 0 && (
                        <div className="gs-group">
                            <div className="gs-group-header">
                                <Package size={14} />
                                <span>Productos</span>
                                <span className="gs-group-count">{results.products.length}</span>
                            </div>
                            {results.products.map((product) => {
                                const idx = currentFlatIndex++;
                                return (
                                    <div
                                        key={`p-${product.id}`}
                                        className={`gs-item ${idx === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => navigateToItem({ type: 'product', data: product })}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <div className="gs-item-icon product-icon">
                                            <Package size={14} />
                                        </div>
                                        <div className="gs-item-info">
                                            <div className="gs-item-title">{product.name}</div>
                                            <div className="gs-item-meta">
                                                {product.sku && <span>SKU: {product.sku}</span>}
                                                <span>{formatCurrency(product.sale_price)}</span>
                                                <span>{product.stock} en stock</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="gs-arrow" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="gs-footer">
                    <span><kbd>↑↓</kbd> navegar</span>
                    <span><kbd>↵</kbd> abrir</span>
                    <span><kbd>esc</kbd> cerrar</span>
                </div>
            </div>
        </div>
    );
}
