const db = require('../config/database');

// Búsqueda global
exports.search = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ repairs: [], customers: [], products: [] });
        }

        const searchTerm = `%${q.trim()}%`;

        // Buscar reparaciones
        const [repairs] = await db.query(`
            SELECT r.id, r.ticket_number, r.model, r.status, r.created_at,
                u.first_name as customer_first_name, u.last_name as customer_last_name,
                b.name as brand_name, dt.name as device_type_name
            FROM repairs r
            LEFT JOIN users u ON r.customer_id = u.id
            LEFT JOIN brands b ON r.brand_id = b.id
            LEFT JOIN device_types dt ON r.device_type_id = dt.id
            WHERE r.ticket_number LIKE ?
                OR r.model LIKE ?
                OR r.imei LIKE ?
                OR r.serial_number LIKE ?
                OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

        // Buscar clientes
        const [customers] = await db.query(`
            SELECT id, first_name, last_name, email, phone,
                (SELECT COUNT(*) FROM repairs WHERE customer_id = users.id) as total_repairs
            FROM users
            WHERE role = 'client'
            AND (
                CONCAT(first_name, ' ', last_name) LIKE ?
                OR email LIKE ?
                OR phone LIKE ?
            )
            ORDER BY first_name ASC
            LIMIT 8
        `, [searchTerm, searchTerm, searchTerm]);

        // Buscar productos del inventario
        let products = [];
        try {
            const [prodResults] = await db.query(`
                SELECT p.id, p.name, p.sku, p.sale_price, p.stock,
                    c.name as category_name
                FROM products p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.name LIKE ?
                    OR p.sku LIKE ?
                    OR p.barcode LIKE ?
                ORDER BY p.name ASC
                LIMIT 8
            `, [searchTerm, searchTerm, searchTerm]);
            products = prodResults;
        } catch (e) {
            // Products table might not exist yet, that's OK
        }

        res.json({ repairs, customers, products });
    } catch (error) {
        console.error('[SEARCH] Error en búsqueda global:', error);
        res.status(500).json({ message: 'Error en la búsqueda.' });
    }
};
