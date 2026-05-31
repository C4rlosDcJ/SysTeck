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
