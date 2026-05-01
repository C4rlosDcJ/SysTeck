const db = require('../config/database');

// =====================================================
// Categorías de productos
// =====================================================
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM product_categories WHERE is_active = TRUE ORDER BY name'
        );
        res.json(categories);
    } catch (error) {
        console.error('[INVENTORY] Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error al obtener categorías.' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name) return res.status(400).json({ message: 'El nombre es obligatorio.' });

        const [result] = await db.query(
            'INSERT INTO product_categories (name, description, color) VALUES (?, ?, ?)',
            [name, description || null, color || '#6366f1']
        );
        res.status(201).json({ id: result.insertId, message: 'Categoría creada.' });
    } catch (error) {
        console.error('[INVENTORY] Error al crear categoría:', error);
        res.status(500).json({ message: 'Error al crear categoría.' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, is_active } = req.body;
        await db.query(
            'UPDATE product_categories SET name = ?, description = ?, color = ?, is_active = ? WHERE id = ?',
            [name, description, color, is_active !== undefined ? is_active : true, id]
        );
        res.json({ message: 'Categoría actualizada.' });
    } catch (error) {
        console.error('[INVENTORY] Error al actualizar categoría:', error);
        res.status(500).json({ message: 'Error al actualizar categoría.' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE product_categories SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ message: 'Categoría desactivada.' });
    } catch (error) {
        console.error('[INVENTORY] Error al eliminar categoría:', error);
        res.status(500).json({ message: 'Error al eliminar categoría.' });
    }
};

// =====================================================
// Productos
// =====================================================
exports.getProducts = async (req, res) => {
    try {
        const { category_id, search, low_stock, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, pc.name as category_name, pc.color as category_color
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.is_active = TRUE
        `;
        const params = [];

        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }
        if (search) {
            query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        if (low_stock === 'true') {
            query += ' AND p.stock <= p.min_stock';
        }

        query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await db.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE';
        const countParams = [];
        if (category_id) {
            countQuery += ' AND category_id = ?';
            countParams.push(category_id);
        }
        if (search) {
            countQuery += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
            const term = `%${search}%`;
            countParams.push(term, term, term);
        }
        if (low_stock === 'true') {
            countQuery += ' AND stock <= min_stock';
        }
        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('[INVENTORY] Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos.' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await db.query(
            `SELECT p.*, pc.name as category_name, pc.color as category_color
             FROM products p
             LEFT JOIN product_categories pc ON p.category_id = pc.id
             WHERE p.id = ?`,
            [id]
        );
        if (products.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json(products[0]);
    } catch (error) {
        console.error('[INVENTORY] Error al obtener producto:', error);
        res.status(500).json({ message: 'Error al obtener producto.' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { sku, barcode, name, description, category_id, purchase_price, sale_price, stock, min_stock } = req.body;

        if (!name || !sale_price) {
            return res.status(400).json({ message: 'Nombre y precio de venta son obligatorios.' });
        }

        // Generar SKU automático si no se proporciona
        const finalSku = sku || `PRD-${Date.now().toString(36).toUpperCase()}`;

        const [result] = await db.query(
            `INSERT INTO products (sku, barcode, name, description, category_id, purchase_price, sale_price, stock, min_stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalSku, barcode || null, name, description || null, category_id || null,
             purchase_price || 0, sale_price, stock || 0, min_stock || 5]
        );

        // Registrar movimiento de stock inicial si hay stock
        if (stock && stock > 0) {
            await db.query(
                `INSERT INTO stock_movements (product_id, type, quantity, reference, notes, created_by)
                 VALUES (?, 'in', ?, 'INITIAL', 'Stock inicial', ?)`,
                [result.insertId, stock, req.user.id]
            );
        }

        res.status(201).json({ id: result.insertId, sku: finalSku, message: 'Producto creado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El SKU o código de barras ya existe.' });
        }
        console.error('[INVENTORY] Error al crear producto:', error);
        res.status(500).json({ message: 'Error al crear producto.' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { sku, barcode, name, description, category_id, purchase_price, sale_price, stock, min_stock } = req.body;

        // Obtener stock actual para calcular diferencia
        const [existing] = await db.query('SELECT stock FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        await db.query(
            `UPDATE products SET sku = ?, barcode = ?, name = ?, description = ?, category_id = ?,
             purchase_price = ?, sale_price = ?, stock = ?, min_stock = ? WHERE id = ?`,
            [sku, barcode || null, name, description || null, category_id || null,
             purchase_price || 0, sale_price, stock, min_stock || 5, id]
        );

        // Registrar movimiento si cambió el stock
        const oldStock = existing[0].stock;
        if (stock !== undefined && stock !== oldStock) {
            const diff = stock - oldStock;
            await db.query(
                `INSERT INTO stock_movements (product_id, type, quantity, reference, notes, created_by)
                 VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?)`,
                [id, diff > 0 ? 'in' : 'adjustment', Math.abs(diff),
                 `Ajuste manual: ${oldStock} → ${stock}`, req.user.id]
            );
        }

        res.json({ message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El SKU o código de barras ya existe.' });
        }
        console.error('[INVENTORY] Error al actualizar producto:', error);
        res.status(500).json({ message: 'Error al actualizar producto.' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ message: 'Producto desactivado.' });
    } catch (error) {
        console.error('[INVENTORY] Error al eliminar producto:', error);
        res.status(500).json({ message: 'Error al eliminar producto.' });
    }
};

// =====================================================
// Stock Movements
// =====================================================
exports.addStockMovement = async (req, res) => {
    try {
        const { product_id, type, quantity, reference, notes } = req.body;

        if (!product_id || !type || !quantity) {
            return res.status(400).json({ message: 'Producto, tipo y cantidad son obligatorios.' });
        }

        // Actualizar stock del producto
        const operator = type === 'in' ? '+' : '-';
        await db.query(
            `UPDATE products SET stock = stock ${operator} ? WHERE id = ?`,
            [Math.abs(quantity), product_id]
        );

        await db.query(
            `INSERT INTO stock_movements (product_id, type, quantity, reference, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [product_id, type, Math.abs(quantity), reference || null, notes || null, req.user.id]
        );

        res.status(201).json({ message: 'Movimiento de stock registrado.' });
    } catch (error) {
        console.error('[INVENTORY] Error al agregar movimiento:', error);
        res.status(500).json({ message: 'Error al registrar movimiento de stock.' });
    }
};

exports.getStockMovements = async (req, res) => {
    try {
        const { product_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT sm.*, p.name as product_name, p.sku,
                   u.first_name, u.last_name
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (product_id) {
            query += ' AND sm.product_id = ?';
            params.push(product_id);
        }

        query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [movements] = await db.query(query, params);
        res.json(movements);
    } catch (error) {
        console.error('[INVENTORY] Error al obtener movimientos:', error);
        res.status(500).json({ message: 'Error al obtener movimientos de stock.' });
    }
};

// =====================================================
// Estadísticas de inventario
// =====================================================
exports.getInventoryStats = async (req, res) => {
    try {
        const [totalProducts] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
        const [lowStock] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND stock <= min_stock');
        const [outOfStock] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND stock = 0');
        const [totalValue] = await db.query('SELECT SUM(stock * sale_price) as value FROM products WHERE is_active = TRUE');

        res.json({
            totalProducts: totalProducts[0].count,
            lowStockCount: lowStock[0].count,
            outOfStockCount: outOfStock[0].count,
            totalInventoryValue: totalValue[0].value || 0
        });
    } catch (error) {
        console.error('[INVENTORY] Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas de inventario.' });
    }
};
