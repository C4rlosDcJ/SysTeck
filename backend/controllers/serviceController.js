const db = require('../config/database');

// Obtener todos los servicios
exports.getAll = async (req, res) => {
    try {
        const { device_type_id, active_only } = req.query;

        let query = `
      SELECT s.*, dt.name as device_type_name
      FROM services_catalog s
      LEFT JOIN device_types dt ON s.device_type_id = dt.id
      WHERE 1=1
    `;
        const params = [];

        if (active_only === 'true') {
            query += ' AND s.is_active = TRUE';
        }
        if (device_type_id) {
            query += ' AND (s.device_type_id = ? OR s.device_type_id IS NULL)';
            params.push(device_type_id);
        }

        query += ' ORDER BY s.device_type_id, s.name';

        const [services] = await db.query(query, params);
        res.json(services);
    } catch (error) {
        console.error('[SERVICES] Error al obtener servicios:', error);
        res.status(500).json({ message: 'Error al obtener servicios.' });
    }
};

// Obtener un servicio por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const [services] = await db.query(`
      SELECT s.*, dt.name as device_type_name
      FROM services_catalog s
      LEFT JOIN device_types dt ON s.device_type_id = dt.id
      WHERE s.id = ?
    `, [id]);

        if (services.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }

        res.json(services[0]);
    } catch (error) {
        console.error('[SERVICES] Error al obtener servicio:', error);
        res.status(500).json({ message: 'Error al obtener servicio.' });
    }
};

// Crear servicio (admin)
exports.create = async (req, res) => {
    try {
        const { name, description, device_type_id, base_price, estimated_time } = req.body;

        const [result] = await db.query(`
      INSERT INTO services_catalog (name, description, device_type_id, base_price, estimated_time)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description, device_type_id || null, base_price, estimated_time]);

        res.status(201).json({
            message: 'Servicio creado exitosamente.',
            service: { id: result.insertId, name }
        });
    } catch (error) {
        console.error('[SERVICES] Error al crear servicio:', error);
        res.status(500).json({ message: 'Error al crear servicio.' });
    }
};

// Actualizar servicio (admin)
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, device_type_id, base_price, estimated_time, is_active } = req.body;

        await db.query(`
      UPDATE services_catalog SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        device_type_id = ?,
        base_price = COALESCE(?, base_price),
        estimated_time = COALESCE(?, estimated_time),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [name, description, device_type_id, base_price, estimated_time, is_active, id]);

        res.json({ message: 'Servicio actualizado exitosamente.' });
    } catch (error) {
        console.error('[SERVICES] Error al actualizar servicio:', error);
        res.status(500).json({ message: 'Error al actualizar servicio.' });
    }
};

// Eliminar servicio (admin)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM services_catalog WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }

        res.json({ message: 'Servicio eliminado exitosamente.' });
    } catch (error) {
        console.error('[SERVICES] Error al eliminar servicio:', error);
        res.status(500).json({ message: 'Error al eliminar servicio.' });
    }
};

// === TIPOS DE DISPOSITIVO ===

exports.getDeviceTypes = async (req, res) => {
    try {
        const { all } = req.query;
        let query = 'SELECT * FROM device_types';
        if (all !== 'true') {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY name';
        const [types] = await db.query(query);
        res.json(types);
    } catch (error) {
        console.error('[SERVICES] Error al obtener tipos de dispositivo:', error);
        res.status(500).json({ message: 'Error al obtener tipos de dispositivo.' });
    }
};

exports.createDeviceType = async (req, res) => {
    try {
        const { name, is_active } = req.body;
        const [result] = await db.query(
            'INSERT INTO device_types (name, is_active) VALUES (?, ?)',
            [name, is_active !== undefined ? is_active : true]
        );
        res.status(201).json({ message: 'Tipo de dispositivo creado.', id: result.insertId });
    } catch (error) {
        console.error('[SERVICES] Error al crear tipo de dispositivo:', error);
        res.status(500).json({ message: 'Error al crear tipo de dispositivo.' });
    }
};

exports.updateDeviceType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_active } = req.body;
        await db.query(
            'UPDATE device_types SET name = COALESCE(?, name), is_active = COALESCE(?, is_active) WHERE id = ?',
            [name, is_active, id]
        );
        res.json({ message: 'Tipo de dispositivo actualizado.' });
    } catch (error) {
        console.error('[SERVICES] Error al actualizar tipo de dispositivo:', error);
        res.status(500).json({ message: 'Error al actualizar tipo de dispositivo.' });
    }
};

exports.deleteDeviceType = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar si hay servicios asociados
        const [services] = await db.query('SELECT id FROM services_catalog WHERE device_type_id = ? LIMIT 1', [id]);
        if (services.length > 0) {
            return res.status(400).json({ message: 'No se puede eliminar: tiene servicios asociados.' });
        }
        await db.query('DELETE FROM device_types WHERE id = ?', [id]);
        res.json({ message: 'Tipo de dispositivo eliminado.' });
    } catch (error) {
        console.error('[SERVICES] Error al eliminar tipo de dispositivo:', error);
        res.status(500).json({ message: 'Error al eliminar tipo de dispositivo.' });
    }
};

// === MARCAS ===

exports.getBrands = async (req, res) => {
    try {
        const { all } = req.query;
        let query = 'SELECT * FROM brands';
        if (all !== 'true') {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY name';
        const [brands] = await db.query(query);
        res.json(brands);
    } catch (error) {
        console.error('[SERVICES] Error al obtener marcas:', error);
        res.status(500).json({ message: 'Error al obtener marcas.' });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const { name, is_active } = req.body;
        const [result] = await db.query(
            'INSERT INTO brands (name, is_active) VALUES (?, ?)',
            [name, is_active !== undefined ? is_active : true]
        );
        res.status(201).json({ message: 'Marca creada.', id: result.insertId });
    } catch (error) {
        console.error('[SERVICES] Error al crear marca:', error);
        res.status(500).json({ message: 'Error al crear marca.' });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_active } = req.body;
        await db.query(
            'UPDATE brands SET name = COALESCE(?, name), is_active = COALESCE(?, is_active) WHERE id = ?',
            [name, is_active, id]
        );
        res.json({ message: 'Marca actualizada.' });
    } catch (error) {
        console.error('[SERVICES] Error al actualizar marca:', error);
        res.status(500).json({ message: 'Error al actualizar marca.' });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM brands WHERE id = ?', [id]);
        res.json({ message: 'Marca eliminada.' });
    } catch (error) {
        console.error('[SERVICES] Error al eliminar marca:', error);
        res.status(500).json({ message: 'Error al eliminar marca.' });
    }
};
