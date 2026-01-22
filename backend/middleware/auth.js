const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener usuario de la base de datos
        const [users] = await db.query(
            'SELECT id, email, first_name, last_name, phone, role, is_active FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado.' });
        }

        if (!users[0].is_active) {
            return res.status(401).json({ message: 'Cuenta desactivada.' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('[AUTH] Error de autenticación:', error.message);
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

// Middleware para verificar rol de admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

// Middleware para verificar rol de técnico o admin
const isTechnicianOrAdmin = (req, res, next) => {
    if (req.user.role !== 'technician' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de técnico o administrador.' });
    }
    next();
};

module.exports = { auth, isAdmin, isTechnicianOrAdmin };
