const db = require('../config/database');
const { sendEmail } = require('../services/emailService');

// Generar número de ticket único
const generateTicketNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REP-${year}${month}${day}-${random}`;
};

// Obtener todas las reparaciones
exports.getAll = async (req, res) => {
    try {
        const { status, customer_id, technician_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT r.*, 
        u.first_name as customer_first_name, u.last_name as customer_last_name, u.email as customer_email, u.phone as customer_phone,
        t.first_name as technician_first_name, t.last_name as technician_last_name,
        dt.name as device_type_name,
        b.name as brand_name
      FROM repairs r
      LEFT JOIN users u ON r.customer_id = u.id
      LEFT JOIN users t ON r.technician_id = t.id
      LEFT JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN brands b ON r.brand_id = b.id
      WHERE 1=1
    `;

        const params = [];

        // Filtrar por rol
        if (req.user.role === 'client') {
            query += ' AND r.customer_id = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'technician') {
            query += ' AND r.technician_id = ?';
            params.push(req.user.id);
        }

        // Filtros opcionales
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }
        if (customer_id && req.user.role === 'admin') {
            query += ' AND r.customer_id = ?';
            params.push(customer_id);
        }
        if (technician_id && req.user.role === 'admin') {
            query += ' AND r.technician_id = ?';
            params.push(technician_id);
        }

        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [repairs] = await db.query(query, params);

        // Contar total
        let countQuery = 'SELECT COUNT(*) as total FROM repairs WHERE 1=1';
        const countParams = [];

        if (req.user.role === 'client') {
            countQuery += ' AND customer_id = ?';
            countParams.push(req.user.id);
        }
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            repairs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('[REPAIRS] Error al obtener reparaciones:', error);
        res.status(500).json({ message: 'Error al obtener reparaciones.' });
    }
};

// Obtener una reparación por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const [repairs] = await db.query(`
      SELECT r.*, 
        u.first_name as customer_first_name, u.last_name as customer_last_name, u.email as customer_email, u.phone as customer_phone, u.address as customer_address,
        t.first_name as technician_first_name, t.last_name as technician_last_name,
        dt.name as device_type_name,
        b.name as brand_name,
        s.name as service_name
      FROM repairs r
      LEFT JOIN users u ON r.customer_id = u.id
      LEFT JOIN users t ON r.technician_id = t.id
      LEFT JOIN device_types dt ON r.device_type_id = dt.id
      LEFT JOIN brands b ON r.brand_id = b.id
      LEFT JOIN services_catalog s ON r.service_id = s.id
      WHERE r.id = ?
    `, [id]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'Reparación no encontrada.' });
        }

        const repair = repairs[0];

        // Verificar acceso
        if (req.user.role === 'client' && repair.customer_id !== req.user.id) {
            return res.status(403).json({ message: 'Acceso denegado.' });
        }

        // Obtener imágenes
        const [images] = await db.query(
            'SELECT * FROM repair_images WHERE repair_id = ? ORDER BY uploaded_at',
            [id]
        );

        // Obtener historial de estados
        const [history] = await db.query(`
      SELECT rsh.*, u.first_name, u.last_name
      FROM repair_status_history rsh
      LEFT JOIN users u ON rsh.changed_by = u.id
      WHERE rsh.repair_id = ?
      ORDER BY rsh.created_at DESC
    `, [id]);

        // Obtener notas (solo admin/técnico ven las internas)
        let notesQuery = 'SELECT rn.*, u.first_name, u.last_name FROM repair_notes rn LEFT JOIN users u ON rn.user_id = u.id WHERE rn.repair_id = ?';
        if (req.user.role === 'client') {
            notesQuery += ' AND rn.is_internal = FALSE';
        }
        notesQuery += ' ORDER BY rn.created_at DESC';

        const [notes] = await db.query(notesQuery, [id]);

        res.json({
            ...repair,
            images,
            history,
            notes
        });
    } catch (error) {
        console.error('[REPAIRS] Error al obtener reparación:', error);
        res.status(500).json({ message: 'Error al obtener reparación.' });
    }
};

// Crear nueva reparación
exports.create = async (req, res) => {
    try {
        const {
            customer_id,
            device_type_id,
            brand_id,
            brand_other,
            model,
            color,
            storage_capacity,
            serial_number,
            imei,
            device_password,
            accessories_received,
            physical_condition,
            existing_damage,
            function_checklist,
            problem_description,
            service_requested,
            service_id,
            priority,
            estimated_delivery,
            diagnosis_cost,
            labor_cost,
            parts_cost,
            discount,
            advance_payment,
            warranty_days,
            battery_health,
            screen_status,
            account_status,
            technical_observations,
            technician_id
        } = req.body;

        // Obtener garantía por defecto si no se especifica
        let finalWarrantyDays = warranty_days;
        if (!finalWarrantyDays) {
            const [settings] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "default_warranty_days"');
            finalWarrantyDays = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;
        }

        // Si es cliente, usar su propio ID
        const finalCustomerId = req.user.role === 'client' ? req.user.id : customer_id;

        if (!finalCustomerId) {
            return res.status(400).json({ message: 'Se requiere ID del cliente.' });
        }

        const ticketNumber = generateTicketNumber();

        // Calcular total
        const total = (parseFloat(diagnosis_cost) || 0) + (parseFloat(labor_cost) || 0) +
            (parseFloat(parts_cost) || 0) - (parseFloat(discount) || 0);

        // Calcular fecha de expiración de garantía
        const warrantyExpires = new Date();
        warrantyExpires.setDate(warrantyExpires.getDate() + (warranty_days || 30));

        const [result] = await db.query(`
        ticket_number, customer_id, device_type_id, brand_id, brand_other, model, color,
        storage_capacity, serial_number, imei, device_password, accessories_received,
        physical_condition, existing_damage, function_checklist, problem_description,
        service_requested, service_id, priority, estimated_delivery, diagnosis_cost,
        labor_cost, parts_cost, discount, total_cost, advance_payment, warranty_days, 
        warranty_expires, battery_health, screen_status, account_status, technical_observations, technician_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            ticketNumber, finalCustomerId, device_type_id, brand_id || null, brand_other || null,
            model, color, storage_capacity, serial_number, imei, device_password, accessories_received,
            physical_condition, existing_damage, JSON.stringify(function_checklist), problem_description,
            service_requested, service_id || null, priority || 'normal', estimated_delivery || null,
            diagnosis_cost || 0, labor_cost || 0, parts_cost || 0, discount || 0, total,
            advance_payment || 0, finalWarrantyDays, null,
            battery_health || null, screen_status || null, account_status || null,
            technical_observations || null, technician_id || null
        ]);

        // Registrar en historial
        await db.query(
            'INSERT INTO repair_status_history (repair_id, status, notes, changed_by) VALUES (?, ?, ?, ?)',
            [result.insertId, 'received', 'Reparación creada', req.user.id]
        );

        // Obtener datos del cliente para email
        const [customers] = await db.query(
            'SELECT first_name, last_name, email FROM users WHERE id = ?',
            [finalCustomerId]
        );

        // Enviar email de confirmación
        if (customers.length > 0 && customers[0].email) {
            await sendEmail(customers[0].email, 'repairCreated', {
                repair: { ticket_number: ticketNumber, model, problem_description },
                customer: customers[0]
            });
        }

        res.status(201).json({
            message: 'Reparación creada exitosamente.',
            repair: {
                id: result.insertId,
                ticket_number: ticketNumber
            }
        });
    } catch (error) {
        console.error('[REPAIRS] Error al crear reparación:', error);
        res.status(500).json({ message: 'Error al crear reparación.' });
    }
};

// Actualizar reparación
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verificar que existe
        const [existing] = await db.query('SELECT * FROM repairs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Reparación no encontrada.' });
        }

        // Recalcular total si hay cambios en costos
        if (updates.diagnosis_cost !== undefined || updates.labor_cost !== undefined ||
            updates.parts_cost !== undefined || updates.discount !== undefined) {

            const diag = updates.diagnosis_cost !== undefined ? parseFloat(updates.diagnosis_cost) : parseFloat(existing[0].diagnosis_cost);
            const labor = updates.labor_cost !== undefined ? parseFloat(updates.labor_cost) : parseFloat(existing[0].labor_cost);
            const parts = updates.parts_cost !== undefined ? parseFloat(updates.parts_cost) : parseFloat(existing[0].parts_cost);
            const disc = updates.discount !== undefined ? parseFloat(updates.discount) : parseFloat(existing[0].discount);

            updates.total_cost = (diag || 0) + (labor || 0) + (parts || 0) - (disc || 0);
        }

        // Construir query dinámico
        const allowedFields = [
            'technician_id', 'brand_id', 'brand_other', 'model', 'color', 'storage_capacity',
            'serial_number', 'imei', 'device_password', 'accessories_received', 'physical_condition',
            'existing_damage', 'function_checklist', 'problem_description', 'service_requested',
            'service_id', 'priority', 'estimated_delivery', 'diagnosis_cost', 'labor_cost',
            'parts_cost', 'discount', 'status', 'total_cost', 'advance_payment', 'warranty_days',
            'warranty_expires', 'battery_health', 'screen_status', 'account_status', 'technical_observations'
        ];

        const setClauses = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(field === 'function_checklist' ? JSON.stringify(updates[field]) : updates[field]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar.' });
        }

        values.push(id);
        await db.query(`UPDATE repairs SET ${setClauses.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Reparación actualizada exitosamente.' });
    } catch (error) {
        console.error('[REPAIRS] Error al actualizar reparación:', error);
        res.status(500).json({ message: 'Error al actualizar reparación.' });
    }
};

// Cambiar estado de reparación
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = [
            'received', 'diagnosing', 'waiting_approval', 'waiting_parts',
            'repairing', 'quality_check', 'ready', 'delivered', 'cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado inválido.' });
        }

        // Verificar que existe
        const [existing] = await db.query(`
      SELECT r.*, u.first_name, u.last_name, u.email 
      FROM repairs r 
      LEFT JOIN users u ON r.customer_id = u.id 
      WHERE r.id = ?
    `, [id]);

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Reparación no encontrada.' });
        }

        const repair = existing[0];

        // Actualizar estado
        let updateQuery = 'UPDATE repairs SET status = ?';
        const updateParams = [status];

        // Agregar timestamps según el estado
        if (status === 'repairing' && !repair.started_at) {
            updateQuery += ', started_at = NOW()';
        } else if (status === 'ready' || status === 'delivered') {
            updateQuery += ', completed_at = NOW()';
            if (status === 'delivered') {
                updateQuery += ', delivered_at = NOW(), warranty_expires = DATE_ADD(NOW(), INTERVAL warranty_days DAY)';
            }
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await db.query(updateQuery, updateParams);

        // Registrar en historial
        await db.query(
            'INSERT INTO repair_status_history (repair_id, status, notes, changed_by) VALUES (?, ?, ?, ?)',
            [id, status, notes || null, req.user.id]
        );

        // Enviar email de notificación
        if (repair.email) {
            const template = status === 'ready' ? 'repairReady' : 'statusChanged';
            await sendEmail(repair.email, template, {
                repair: { ticket_number: repair.ticket_number, model: repair.model, total_cost: repair.total_cost },
                customer: { first_name: repair.first_name },
                newStatus: status
            });
        }

        res.json({ message: 'Estado actualizado exitosamente.' });
    } catch (error) {
        console.error('[REPAIRS] Error al actualizar estado:', error);
        res.status(500).json({ message: 'Error al actualizar estado.' });
    }
};

// Agregar nota
exports.addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, is_internal } = req.body;

        // Solo admin/técnico pueden agregar notas internas
        const finalIsInternal = req.user.role !== 'client' && is_internal;

        await db.query(
            'INSERT INTO repair_notes (repair_id, user_id, note, is_internal) VALUES (?, ?, ?, ?)',
            [id, req.user.id, note, finalIsInternal]
        );

        res.status(201).json({ message: 'Nota agregada exitosamente.' });
    } catch (error) {
        console.error('[REPAIRS] Error al agregar nota:', error);
        res.status(500).json({ message: 'Error al agregar nota.' });
    }
};

// Eliminar reparación (solo admin)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM repairs WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Reparación no encontrada.' });
        }

        res.json({ message: 'Reparación eliminada exitosamente.' });
    } catch (error) {
        console.error('[REPAIRS] Error al eliminar reparación:', error);
        res.status(500).json({ message: 'Error al eliminar reparación.' });
    }
};
