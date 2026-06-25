const db = require('../config/database');

// Rastrear reparación por número de ticket (público, sin auth)
exports.trackRepair = async (req, res) => {
    try {
        const { ticket } = req.params;

        if (!ticket || ticket.length < 5) {
            return res.status(400).json({ message: 'Número de ticket inválido.' });
        }

        const [repairs] = await db.query(`
            SELECT 
                r.ticket_number,
                r.model,
                r.status,
                r.priority,
                r.estimated_delivery,
                r.warranty_days,
                r.warranty_expires,
                r.created_at,
                r.started_at,
                r.completed_at,
                r.delivered_at,
                dt.name as device_type_name,
                b.name as brand_name,
                r.brand_other
            FROM repairs r
            LEFT JOIN device_types dt ON r.device_type_id = dt.id
            LEFT JOIN brands b ON r.brand_id = b.id
            WHERE r.ticket_number = ?
        `, [ticket.trim().toUpperCase()]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'No se encontró ninguna reparación con ese número de ticket.' });
        }

        const repair = repairs[0];

        // Obtener historial de estados (sin datos internos)
        const [history] = await db.query(`
            SELECT 
                rsh.status,
                rsh.created_at
            FROM repair_status_history rsh
            WHERE rsh.repair_id = (SELECT id FROM repairs WHERE ticket_number = ?)
            ORDER BY rsh.created_at ASC
        `, [ticket.trim().toUpperCase()]);

        // Obtener notas públicas (no internas)
        const [notes] = await db.query(`
            SELECT 
                rn.note,
                rn.created_at,
                u.first_name
            FROM repair_notes rn
            LEFT JOIN users u ON rn.user_id = u.id
            WHERE rn.repair_id = (SELECT id FROM repairs WHERE ticket_number = ?)
            AND rn.is_internal = FALSE
            ORDER BY rn.created_at DESC
        `, [ticket.trim().toUpperCase()]);

        res.json({
            ...repair,
            history,
            notes
        });
    } catch (error) {
        console.error('[PUBLIC] Error al rastrear reparación:', error);
        res.status(500).json({ message: 'Error al buscar la reparación.' });
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
