const db = require('../config/database');

// Generar número de venta (VTA-WEB-...)
const generateSaleNumber = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VTA-${y}${m}${d}-${rand}`;
};

// =====================================================
// Crear venta pendiente (checkout del cliente en tienda)
// =====================================================
exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { items, notes } = req.body;
        const customerId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe tener al menos un ítem.' });
        }

        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            if (!item.item_type || !item.quantity || item.quantity < 1) {
                return res.status(400).json({ message: 'Cada ítem debe tener tipo y cantidad válidos.' });
            }

            if (item.item_type === 'product' && item.product_id) {
                // Verificar stock
                const [products] = await connection.query(
                    'SELECT id, name, sale_price, stock FROM products WHERE id = ? AND is_active = TRUE',
                    [item.product_id]
                );
                if (products.length === 0) {
                    return res.status(400).json({ message: `Producto no encontrado: ${item.product_id}` });
                }
                const product = products[0];
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
                    });
                }
                const itemTotal = product.sale_price * item.quantity;
                subtotal += itemTotal;
                validatedItems.push({
                    product_id: product.id,
                    service_id: null,
                    description: product.name,
                    quantity: item.quantity,
                    unit_price: product.sale_price,
                    total: itemTotal
                });
            } else if (item.item_type === 'service' && item.service_id) {
                // Verificar servicio
                const [services] = await connection.query(
                    'SELECT id, name, base_price FROM services_catalog WHERE id = ? AND is_active = TRUE',
                    [item.service_id]
                );
                if (services.length === 0) {
                    return res.status(400).json({ message: `Servicio no encontrado: ${item.service_id}` });
                }
                const service = services[0];
                const itemTotal = service.base_price * item.quantity;
                subtotal += itemTotal;
                validatedItems.push({
                    product_id: null,
                    service_id: service.id,
                    description: service.name,
                    quantity: item.quantity,
                    unit_price: service.base_price,
                    total: itemTotal
                });
            } else {
                return res.status(400).json({ message: 'Cada ítem debe ser un producto o servicio válido.' });
            }
        }

        const saleNumber = generateSaleNumber();

        // Insertar en tabla sales con status 'pending' y cashier_id = NULL
        const [saleResult] = await connection.query(
            `INSERT INTO sales (sale_number, customer_id, cashier_id, subtotal, discount, total, payment_method, amount_received, change_amount, status, notes)
             VALUES (?, ?, NULL, ?, 0, ?, 'cash', 0, 0, 'pending', ?)`,
            [saleNumber, customerId, subtotal, subtotal, notes || 'Pedido creado por el cliente en línea']
        );

        const saleId = saleResult.insertId;

        // Insertar ítems en sale_items
        for (const item of validatedItems) {
            await connection.query(
                `INSERT INTO sale_items (sale_id, product_id, service_id, description, quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
                [saleId, item.product_id, item.service_id, item.description, item.quantity, item.unit_price, item.total]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Pedido registrado en caja exitosamente.',
            order: {
                id: saleId,
                order_number: saleNumber,
                total: subtotal
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('[ORDERS/SALES] Error al crear pedido en línea:', error);
        res.status(500).json({ message: 'Error al registrar pedido en línea.' });
    } finally {
        connection.release();
    }
};

// =====================================================
// Obtener ventas pendientes/completadas de clientes
// =====================================================
exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, date_from, date_to, search } = req.query;
        const offset = (page - 1) * limit;
        const isAdmin = req.user.role === 'admin';

        let query = `
            SELECT s.*,
                s.sale_number as order_number,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email,
                u.phone as customer_phone,
                (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
            FROM sales s
            LEFT JOIN users u ON s.customer_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (!isAdmin) {
            // El cliente solo ve sus compras/pedidos
            query += ' AND s.customer_id = ?';
            params.push(req.user.id);
        }

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        if (search) {
            query += ' AND (s.sale_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        if (date_from) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(date_to);
        }

        // Count
        let countQuery = query.replace(/SELECT s\.\*,[\s\S]*?FROM sales s/, 'SELECT COUNT(*) as total FROM sales s');
        const [countResult] = await db.query(countQuery, params);

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [sales] = await db.query(query, params);

        res.json({
            orders: sales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('[ORDERS/SALES] Error al obtener pedidos:', error);
        res.status(500).json({ message: 'Error al obtener pedidos.' });
    }
};

// =====================================================
// Obtener detalle de venta/pedido
// =====================================================
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.role === 'admin';

        let query = `
            SELECT s.*,
                s.sale_number as order_number,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email,
                u.phone as customer_phone
            FROM sales s
            LEFT JOIN users u ON s.customer_id = u.id
            WHERE s.id = ?
        `;
        const params = [id];

        if (!isAdmin) {
            query += ' AND s.customer_id = ?';
            params.push(req.user.id);
        }

        const [sales] = await db.query(query, params);

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Obtener ítems
        const [items] = await db.query(
            `SELECT si.*, p.name as product_name, p.sku, sc.name as service_name
             FROM sale_items si
             LEFT JOIN products p ON si.product_id = p.id
             LEFT JOIN services_catalog sc ON si.service_id = sc.id
             WHERE si.sale_id = ?`,
            [id]
        );

        res.json({ ...sales[0], items });
    } catch (error) {
        console.error('[ORDERS/SALES] Error al obtener detalle:', error);
        res.status(500).json({ message: 'Error al obtener detalle.' });
    }
};

// =====================================================
// Cambiar estado (reutilizado o cancelado)
// =====================================================
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['completed', 'cancelled', 'refunded', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado inválido.' });
        }

        await db.query('UPDATE sales SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Estado del pedido actualizado.' });
    } catch (error) {
        console.error('[ORDERS/SALES] Error al actualizar estado:', error);
        res.status(500).json({ message: 'Error al actualizar estado.' });
    }
};

// =====================================================
// Cancelar pedido
// =====================================================
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const isStaff = req.user.role === 'admin' || req.user.role === 'technician';

        let query = 'SELECT * FROM sales WHERE id = ?';
        const params = [id];

        if (!isStaff) {
            query += ' AND customer_id = ?';
            params.push(req.user.id);
        }

        const [sales] = await db.query(query, params);

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        const sale = sales[0];

        if (sale.status !== 'pending' && !isStaff) {
            return res.status(400).json({ message: 'Solo puedes cancelar pedidos pendientes.' });
        }

        await db.query("UPDATE sales SET status = 'cancelled' WHERE id = ?", [id]);
        res.json({ message: 'Pedido cancelado exitosamente.' });
    } catch (error) {
        console.error('[ORDERS/SALES] Error al cancelar:', error);
        res.status(500).json({ message: 'Error al cancelar.' });
    }
};

// =====================================================
// Editar/Actualizar pedido (por parte del cliente)
// =====================================================
exports.updateOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { items, notes } = req.body;
        const customerId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe tener al menos un ítem.' });
        }

        // Buscar pedido y verificar que pertenece al cliente y está pendiente
        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE id = ? AND customer_id = ?',
            [id, customerId]
        );

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        const sale = sales[0];
        if (sale.status !== 'pending') {
            return res.status(400).json({ message: 'Solo puedes editar pedidos en estado pendiente.' });
        }

        let subtotal = 0;
        const validatedItems = [];

        // Validar los nuevos ítems
        for (const item of items) {
            if (!item.item_type || !item.quantity || item.quantity < 1) {
                return res.status(400).json({ message: 'Cada ítem debe tener tipo y cantidad válidos.' });
            }

            if (item.item_type === 'product' && item.product_id) {
                const [products] = await connection.query(
                    'SELECT id, name, sale_price, stock FROM products WHERE id = ? AND is_active = TRUE',
                    [item.product_id]
                );
                if (products.length === 0) {
                    return res.status(400).json({ message: `Producto no encontrado: ${item.product_id}` });
                }
                const product = products[0];
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
                    });
                }
                const itemTotal = product.sale_price * item.quantity;
                subtotal += itemTotal;
                validatedItems.push({
                    product_id: product.id,
                    service_id: null,
                    description: product.name,
                    quantity: item.quantity,
                    unit_price: product.sale_price,
                    total: itemTotal
                });
            } else if (item.item_type === 'service' && item.service_id) {
                const [services] = await connection.query(
                    'SELECT id, name, base_price FROM services_catalog WHERE id = ? AND is_active = TRUE',
                    [item.service_id]
                );
                if (services.length === 0) {
                    return res.status(400).json({ message: `Servicio no encontrado: ${item.service_id}` });
                }
                const service = services[0];
                const itemTotal = service.base_price * item.quantity;
                subtotal += itemTotal;
                validatedItems.push({
                    product_id: null,
                    service_id: service.id,
                    description: service.name,
                    quantity: item.quantity,
                    unit_price: service.base_price,
                    total: itemTotal
                });
            } else {
                return res.status(400).json({ message: 'Cada ítem debe ser un producto o servicio válido.' });
            }
        }

        // Actualizar datos del pedido
        await connection.query(
            `UPDATE sales 
             SET subtotal = ?, total = ?, notes = ?
             WHERE id = ?`,
            [subtotal, subtotal, notes || sale.notes, id]
        );

        // Eliminar ítems antiguos
        await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

        // Insertar los nuevos ítems
        for (const item of validatedItems) {
            await connection.query(
                `INSERT INTO sale_items (sale_id, product_id, service_id, description, quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
                [id, item.product_id, item.service_id, item.description, item.quantity, item.unit_price, item.total]
            );
        }

        await connection.commit();
        res.json({ message: 'Pedido actualizado exitosamente.' });
    } catch (error) {
        await connection.rollback();
        console.error('[ORDERS] Error al actualizar pedido:', error);
        res.status(500).json({ message: 'Error al actualizar el pedido.' });
    } finally {
        connection.release();
    }
};

// =====================================================
// Estadísticas simplificadas
// =====================================================
exports.getOrderStats = async (req, res) => {
    try {
        const [pending] = await db.query(
            "SELECT COUNT(*) as count FROM sales WHERE status = 'pending'"
        );
        res.json({
            pendingCount: pending[0].count,
            inProgressCount: 0,
            readyCount: 0,
            totalRevenue: 0
        });
    } catch (error) {
        console.error('[ORDERS/SALES] Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas.' });
    }
};
