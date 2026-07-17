const db = require('../config/database');

// Rastrear reparación o venta/compra por número de ticket (público, sin auth)
exports.trackRepair = async (req, res) => {
    try {
        const ticketCode = req.params.ticket.trim().toUpperCase();

        if (!ticketCode || ticketCode.length < 5) {
            return res.status(400).json({ message: 'Número de ticket inválido.' });
        }

        // Si empieza con VTA-, buscamos en la tabla de ventas
        if (ticketCode.startsWith('VTA-')) {
            const [sales] = await db.query(`
                SELECT 
                    s.id,
                    s.sale_number,
                    s.subtotal,
                    s.discount,
                    s.tax,
                    s.total,
                    s.payment_method,
                    s.amount_received,
                    s.change_amount,
                    s.status,
                    s.notes,
                    s.created_at,
                    u.first_name as customer_first_name,
                    u.last_name as customer_last_name,
                    u.phone as customer_phone,
                    u.email as customer_email,
                    c.first_name as cashier_first_name,
                    c.last_name as cashier_last_name,
                    r.ticket_number as repair_ticket,
                    r.warranty_days as repair_warranty_days,
                    r.warranty_expires as repair_warranty_expires,
                    s.repair_id
                FROM sales s
                LEFT JOIN users u ON s.customer_id = u.id
                LEFT JOIN users c ON s.cashier_id = c.id
                LEFT JOIN repairs r ON s.repair_id = r.id
                WHERE s.sale_number = ?
            `, [ticketCode]);

            if (sales.length === 0) {
                return res.status(404).json({ message: 'No se encontró ningún pedido o venta con ese número.' });
            }

            const sale = sales[0];

            // Obtener ítems de la venta
            const [items] = await db.query(`
                SELECT 
                    si.id,
                    si.description,
                    si.quantity,
                    si.unit_price,
                    si.discount,
                    si.total,
                    p.name as product_name,
                    p.sku,
                    sc.name as service_name
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                LEFT JOIN services_catalog sc ON si.service_id = sc.id
                WHERE si.sale_id = ?
            `, [sale.id]);

            // Si tiene reparación asociada, traemos los datos completos
            let repairData = null;
            if (sale.repair_id) {
                const [repairs] = await db.query(`
                    SELECT 
                        r.id,
                        r.ticket_number,
                        r.model,
                        r.status,
                        r.payment_status,
                        r.priority,
                        r.estimated_delivery,
                        r.warranty_days,
                        r.warranty_expires,
                        r.physical_condition,
                        r.existing_damage,
                        r.function_checklist,
                        r.problem_description,
                        r.service_requested,
                        r.technical_observations,
                        r.diagnosis_cost,
                        r.labor_cost,
                        r.parts_cost,
                        r.discount,
                        r.total_cost,
                        r.advance_payment,
                        r.created_at,
                        r.started_at,
                        r.completed_at,
                        r.delivered_at,
                        r.parent_repair_id,
                        pr.ticket_number as parent_ticket_number,
                        dt.name as device_type_name,
                        b.name as brand_name,
                        r.brand_other
                    FROM repairs r
                    LEFT JOIN device_types dt ON r.device_type_id = dt.id
                    LEFT JOIN brands b ON r.brand_id = b.id
                    LEFT JOIN repairs pr ON r.parent_repair_id = pr.id
                    WHERE r.id = ?
                `, [sale.repair_id]);

                if (repairs.length > 0) {
                    repairData = repairs[0];
                    // Historial de estados
                    const [history] = await db.query(`
                        SELECT status, notes, created_at
                        FROM repair_status_history
                        WHERE repair_id = ?
                        ORDER BY created_at ASC
                    `, [sale.repair_id]);
                    // Notas públicas
                    const [notes] = await db.query(`
                        SELECT rn.note, rn.created_at, u.first_name
                        FROM repair_notes rn
                        LEFT JOIN users u ON rn.user_id = u.id
                        WHERE rn.repair_id = ? AND rn.is_internal = FALSE
                        ORDER BY rn.created_at DESC
                    `, [sale.repair_id]);

                    repairData.history = history;
                    repairData.notes = notes;
                }
            }

            return res.json({
                is_sale: true,
                is_repair: !!repairData,
                repair: repairData,
                ...sale,
                items
            });
        }

        // De lo contrario, buscamos en la tabla de reparaciones
        const [repairs] = await db.query(`
            SELECT 
                r.id,
                r.ticket_number,
                r.model,
                r.status,
                r.payment_status,
                r.priority,
                r.estimated_delivery,
                r.warranty_days,
                r.warranty_expires,
                r.physical_condition,
                r.existing_damage,
                r.function_checklist,
                r.problem_description,
                r.service_requested,
                r.technical_observations,
                r.diagnosis_cost,
                r.labor_cost,
                r.parts_cost,
                r.discount,
                r.total_cost,
                r.advance_payment,
                r.created_at,
                r.started_at,
                r.completed_at,
                r.delivered_at,
                r.parent_repair_id,
                pr.ticket_number as parent_ticket_number,
                dt.name as device_type_name,
                b.name as brand_name,
                r.brand_other,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name
            FROM repairs r
            LEFT JOIN device_types dt ON r.device_type_id = dt.id
            LEFT JOIN brands b ON r.brand_id = b.id
            LEFT JOIN users u ON r.customer_id = u.id
            LEFT JOIN repairs pr ON r.parent_repair_id = pr.id
            WHERE r.ticket_number = ?
        `, [ticketCode]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'No se encontró ninguna reparación con ese número de ticket.' });
        }

        const repair = repairs[0];

        // Obtener historial de estados (sin datos internos)
        const [history] = await db.query(`
            SELECT 
                rsh.status,
                rsh.notes,
                rsh.created_at
            FROM repair_status_history rsh
            WHERE rsh.repair_id = ?
            ORDER BY rsh.created_at ASC
        `, [repair.id]);

        // Obtener notas públicas (no internas)
        const [notes] = await db.query(`
            SELECT 
                rn.note,
                rn.created_at,
                u.first_name
            FROM repair_notes rn
            LEFT JOIN users u ON rn.user_id = u.id
            WHERE rn.repair_id = ?
            AND rn.is_internal = FALSE
            ORDER BY rn.created_at DESC
        `, [repair.id]);

        res.json({
            is_sale: false,
            is_repair: true,
            ...repair,
            history,
            notes
        });
    } catch (error) {
        console.error('[PUBLIC] Error al rastrear:', error);
        res.status(500).json({ message: 'Error al realizar el rastreo.' });
    }
};


// Obtener configuración de tema (público, sin auth)
exports.getTheme = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');

        const theme = {
            accent_color: '#e63358',
            border_radius: '12px',
            business_name: 'Sys-Teck',
            business_logo: '',
            landing_show_stats: 'true',
            landing_show_why: 'true',
            landing_show_services: 'true',
            landing_show_process: 'true',
            landing_show_testimonials: 'true',
            landing_show_cta: 'true',
            landing_show_contact: 'true'
        };

        rows.forEach(row => {
            theme[row.setting_key] = row.setting_value;
        });

        // Obtener reseñas reales de clientes desde la base de datos
        let reviews = [];
        try {
            const [reviewRows] = await db.query(`
                SELECT 
                    CONCAT(u.first_name, ' ', SUBSTRING(u.last_name, 1, 1), '.') as name,
                    r.review_text as text,
                    CONCAT(COALESCE(b.name, r.brand_other, 'Equipo'), ' ', r.model) as device,
                    r.rating
                FROM repairs r
                JOIN users u ON r.customer_id = u.id
                LEFT JOIN brands b ON r.brand_id = b.id
                WHERE r.rating IS NOT NULL AND r.review_text IS NOT NULL AND r.review_text != ''
                ORDER BY r.updated_at DESC
                LIMIT 6
            `);
            reviews = reviewRows;
        } catch (e) {
            console.warn('[PUBLIC] Error al consultar reseñas de base de datos:', e.message);
        }

        theme.reviews = reviews;

        res.json(theme);
    } catch (error) {
        console.error('[PUBLIC] Error al obtener tema:', error);
        // Return defaults even on error so the frontend doesn't break
        res.json({
            accent_color: '#e63358',
            border_radius: '12px',
            business_name: 'Sys-Teck',
            business_logo: ''
        });
    }
};

// =====================================================
// Catálogo público de servicios (sin auth)
// =====================================================
exports.getCatalogServices = async (req, res) => {
    try {
        const { device_type_id } = req.query;

        let query = `
            SELECT s.id, s.name, s.description, s.base_price, s.estimated_time,
                   s.device_type_id, dt.name as device_type_name, dt.icon as device_type_icon
            FROM services_catalog s
            LEFT JOIN device_types dt ON s.device_type_id = dt.id
            WHERE s.is_active = TRUE
        `;
        const params = [];

        if (device_type_id) {
            query += ' AND (s.device_type_id = ? OR s.device_type_id IS NULL)';
            params.push(device_type_id);
        }

        query += ' ORDER BY dt.name, s.name';

        const [services] = await db.query(query, params);

        // Obtener tipos de dispositivo activos para filtros
        const [deviceTypes] = await db.query(
            'SELECT id, name, icon FROM device_types WHERE is_active = TRUE ORDER BY name'
        );

        res.json({ services, deviceTypes });
    } catch (error) {
        console.error('[PUBLIC] Error al obtener catálogo de servicios:', error);
        res.status(500).json({ message: 'Error al obtener servicios.' });
    }
};

// =====================================================
// Catálogo público de productos (sin auth)
// =====================================================
exports.getCatalogProducts = async (req, res) => {
    try {
        const { category_id, search, page = 1, limit = 24 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.id, p.name, p.description, p.sale_price, p.stock, p.is_unique,
                   p.category_id, pc.name as category_name, pc.color as category_color
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
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term);
        }

        // Count
        let countQuery = query.replace(/SELECT p\.id,[\s\S]*?FROM products p/, 'SELECT COUNT(*) as total FROM products p');
        const [countResult] = await db.query(countQuery, params);

        query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await db.query(query, params);

        // Obtener categorías activas para filtros
        const [categories] = await db.query(
            'SELECT id, name, color FROM product_categories WHERE is_active = TRUE ORDER BY name'
        );

        res.json({
            products,
            categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('[PUBLIC] Error al obtener catálogo de productos:', error);
        res.status(500).json({ message: 'Error al obtener productos.' });
    }
};
