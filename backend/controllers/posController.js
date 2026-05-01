const db = require('../config/database');

// Generar número de venta
const generateSaleNumber = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VTA-${y}${m}${d}-${rand}`;
};

// =====================================================
// Crear venta (checkout del POS)
// =====================================================
exports.createSale = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            customer_id, repair_id, items, discount = 0,
            payment_method, amount_received, notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'La venta debe tener al menos un ítem.' });
        }

        // Calcular subtotal
        let subtotal = 0;
        for (const item of items) {
            const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);
            subtotal += itemTotal;
        }

        const total = subtotal - (parseFloat(discount) || 0);
        const changeAmount = payment_method === 'cash'
            ? Math.max(0, (parseFloat(amount_received) || 0) - total)
            : 0;

        const saleNumber = generateSaleNumber();

        // Insertar cabecera de venta
        const [saleResult] = await connection.query(
            `INSERT INTO sales (sale_number, customer_id, repair_id, cashier_id, subtotal, discount, total,
             payment_method, amount_received, change_amount, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [saleNumber, customer_id || null, repair_id || null, req.user.id,
             subtotal, discount || 0, total, payment_method || 'cash',
             amount_received || total, changeAmount, notes || null]
        );

        const saleId = saleResult.insertId;

        // Insertar ítems y descontar stock
        for (const item of items) {
            const itemTotal = (item.unit_price * item.quantity) - (item.discount || 0);

            await connection.query(
                `INSERT INTO sale_items (sale_id, product_id, service_id, description, quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.product_id || null, item.service_id || null,
                 item.description, item.quantity, item.unit_price, item.discount || 0, itemTotal]
            );

            // Descontar stock si es producto
            if (item.product_id) {
                await connection.query(
                    'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                    [item.quantity, item.product_id]
                );

                // Registrar movimiento de stock
                await connection.query(
                    `INSERT INTO stock_movements (product_id, type, quantity, reference, notes, created_by)
                     VALUES (?, 'out', ?, ?, 'Venta POS', ?)`,
                    [item.product_id, item.quantity, saleNumber, req.user.id]
                );
            }
        }

        // Si la venta está vinculada a una reparación, actualizar estado de pago
        if (repair_id) {
            const [repair] = await connection.query(
                'SELECT total_cost, advance_payment FROM repairs WHERE id = ?',
                [repair_id]
            );

            if (repair.length > 0) {
                const totalRepairCost = parseFloat(repair[0].total_cost) || 0;
                const previousPayments = parseFloat(repair[0].advance_payment) || 0;
                const totalPaid = previousPayments + total;

                let paymentStatus = 'partial';
                if (totalPaid >= totalRepairCost) {
                    paymentStatus = 'paid';
                }

                await connection.query(
                    'UPDATE repairs SET payment_status = ?, advance_payment = ? WHERE id = ?',
                    [paymentStatus, totalPaid, repair_id]
                );
            }
        }

        await connection.commit();

        res.status(201).json({
            message: 'Venta registrada exitosamente.',
            sale: {
                id: saleId,
                sale_number: saleNumber,
                total,
                change_amount: changeAmount
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('[POS] Error al crear venta:', error);
        res.status(500).json({ message: 'Error al registrar venta.' });
    } finally {
        connection.release();
    }
};

// =====================================================
// Obtener ventas (historial)
// =====================================================
exports.getSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, date_from, date_to, payment_method, cashier_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*,
                u.first_name as customer_first_name, u.last_name as customer_last_name,
                c.first_name as cashier_first_name, c.last_name as cashier_last_name,
                r.ticket_number as repair_ticket
            FROM sales s
            LEFT JOIN users u ON s.customer_id = u.id
            LEFT JOIN users c ON s.cashier_id = c.id
            LEFT JOIN repairs r ON s.repair_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (date_from) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(date_to);
        }
        if (payment_method) {
            query += ' AND s.payment_method = ?';
            params.push(payment_method);
        }
        if (cashier_id) {
            query += ' AND s.cashier_id = ?';
            params.push(cashier_id);
        }

        // Count first
        let countQuery = query.replace(/SELECT s\.\*,[\s\S]*?FROM sales s/, 'SELECT COUNT(*) as total FROM sales s');
        const [countResult] = await db.query(countQuery, params);

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [sales] = await db.query(query, params);

        res.json({
            sales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('[POS] Error al obtener ventas:', error);
        res.status(500).json({ message: 'Error al obtener ventas.' });
    }
};

// =====================================================
// Obtener detalle de venta
// =====================================================
exports.getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const [sales] = await db.query(`
            SELECT s.*,
                u.first_name as customer_first_name, u.last_name as customer_last_name,
                u.phone as customer_phone, u.email as customer_email,
                c.first_name as cashier_first_name, c.last_name as cashier_last_name,
                r.ticket_number as repair_ticket
            FROM sales s
            LEFT JOIN users u ON s.customer_id = u.id
            LEFT JOIN users c ON s.cashier_id = c.id
            LEFT JOIN repairs r ON s.repair_id = r.id
            WHERE s.id = ?
        `, [id]);

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Venta no encontrada.' });
        }

        // Obtener ítems
        const [items] = await db.query(
            `SELECT si.*, p.sku, p.name as product_name
             FROM sale_items si
             LEFT JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = ?`,
            [id]
        );

        res.json({ ...sales[0], items });
    } catch (error) {
        console.error('[POS] Error al obtener detalle de venta:', error);
        res.status(500).json({ message: 'Error al obtener venta.' });
    }
};

// =====================================================
// Cancelar venta
// =====================================================
exports.cancelSale = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const [sales] = await connection.query('SELECT * FROM sales WHERE id = ?', [id]);

        if (sales.length === 0) {
            return res.status(404).json({ message: 'Venta no encontrada.' });
        }

        if (sales[0].status === 'cancelled') {
            return res.status(400).json({ message: 'La venta ya está cancelada.' });
        }

        // Obtener items para devolver stock
        const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [id]);

        for (const item of items) {
            if (item.product_id) {
                await connection.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );

                await connection.query(
                    `INSERT INTO stock_movements (product_id, type, quantity, reference, notes, created_by)
                     VALUES (?, 'in', ?, ?, 'Cancelación de venta', ?)`,
                    [item.product_id, item.quantity, sales[0].sale_number, req.user.id]
                );
            }
        }

        await connection.query('UPDATE sales SET status = ? WHERE id = ?', ['cancelled', id]);

        await connection.commit();
        res.json({ message: 'Venta cancelada exitosamente.' });
    } catch (error) {
        await connection.rollback();
        console.error('[POS] Error al cancelar venta:', error);
        res.status(500).json({ message: 'Error al cancelar venta.' });
    } finally {
        connection.release();
    }
};

// =====================================================
// Estadísticas de ventas
// =====================================================
exports.getSalesStats = async (req, res) => {
    try {
        // Ventas de hoy
        const [todaySales] = await db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
             FROM sales WHERE DATE(created_at) = CURDATE() AND status = 'completed'`
        );

        // Ventas de la semana
        const [weekSales] = await db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
             FROM sales WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status = 'completed'`
        );

        // Ventas del mes
        const [monthSales] = await db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
             FROM sales WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status = 'completed'`
        );

        // Ventas por día (últimos 30 días)
        const [dailySales] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as total
             FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = 'completed'
             GROUP BY DATE(created_at) ORDER BY date ASC`
        );

        // Ventas por método de pago (mes actual)
        const [byPaymentMethod] = await db.query(
            `SELECT payment_method, COUNT(*) as count, SUM(total) as total
             FROM sales WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status = 'completed'
             GROUP BY payment_method`
        );

        // Productos más vendidos (mes actual)
        const [topProducts] = await db.query(
            `SELECT si.description, SUM(si.quantity) as total_qty, SUM(si.total) as total_revenue
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             WHERE YEAR(s.created_at) = YEAR(CURDATE()) AND MONTH(s.created_at) = MONTH(CURDATE()) AND s.status = 'completed'
             GROUP BY si.description
             ORDER BY total_qty DESC LIMIT 10`
        );

        res.json({
            today: todaySales[0],
            week: weekSales[0],
            month: monthSales[0],
            dailySales,
            byPaymentMethod,
            topProducts
        });
    } catch (error) {
        console.error('[POS] Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas de ventas.' });
    }
};

// =====================================================
// Obtener reparaciones cobrables (para pestaña en POS)
// =====================================================
exports.getBillableRepairs = async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT r.id, r.ticket_number, r.status, r.payment_status,
                r.total_cost, r.advance_payment, r.diagnosis_cost, r.labor_cost,
                r.parts_cost, r.discount,
                r.model, r.problem_description, r.service_requested,
                u.first_name as customer_first_name, u.last_name as customer_last_name,
                u.id as customer_id, u.phone as customer_phone,
                dt.name as device_type_name,
                b.name as brand_name, r.brand_other,
                sc.name as service_name
            FROM repairs r
            LEFT JOIN users u ON r.customer_id = u.id
            LEFT JOIN device_types dt ON r.device_type_id = dt.id
            LEFT JOIN brands b ON r.brand_id = b.id
            LEFT JOIN services_catalog sc ON r.service_id = sc.id
            WHERE r.status IN ('ready', 'quality_check', 'waiting_approval', 'repairing')
              AND (r.payment_status IS NULL OR r.payment_status != 'paid')
              AND r.total_cost > 0
        `;
        const params = [];

        if (search) {
            query += ` AND (r.ticket_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR r.model LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY FIELD(r.status, "ready", "quality_check", "repairing", "waiting_approval"), r.created_at DESC LIMIT 50';

        const [repairs] = await db.query(query, params);

        // Calculate balance for each
        const result = repairs.map(r => ({
            ...r,
            balance: Math.max(0, (parseFloat(r.total_cost) || 0) - (parseFloat(r.advance_payment) || 0))
        }));

        res.json(result);
    } catch (error) {
        console.error('[POS] Error al obtener reparaciones cobrables:', error);
        res.status(500).json({ message: 'Error al obtener reparaciones.' });
    }
};

// =====================================================
// Obtener una reparación específica para POS (deep-link)
// =====================================================
exports.getRepairForPOS = async (req, res) => {
    try {
        const { id } = req.params;

        const [repairs] = await db.query(`
            SELECT r.id, r.ticket_number, r.status, r.payment_status,
                r.total_cost, r.advance_payment, r.diagnosis_cost, r.labor_cost,
                r.parts_cost, r.discount,
                r.model, r.problem_description, r.service_requested,
                u.first_name as customer_first_name, u.last_name as customer_last_name,
                u.id as customer_id, u.phone as customer_phone, u.email as customer_email,
                dt.name as device_type_name,
                b.name as brand_name, r.brand_other,
                sc.name as service_name
            FROM repairs r
            LEFT JOIN users u ON r.customer_id = u.id
            LEFT JOIN device_types dt ON r.device_type_id = dt.id
            LEFT JOIN brands b ON r.brand_id = b.id
            LEFT JOIN services_catalog sc ON r.service_id = sc.id
            WHERE r.id = ?
        `, [id]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'Reparación no encontrada.' });
        }

        const r = repairs[0];
        r.balance = Math.max(0, (parseFloat(r.total_cost) || 0) - (parseFloat(r.advance_payment) || 0));

        res.json(r);
    } catch (error) {
        console.error('[POS] Error al obtener reparación para POS:', error);
        res.status(500).json({ message: 'Error al obtener reparación.' });
    }
};
