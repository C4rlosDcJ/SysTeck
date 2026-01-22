const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validationResult } = require('express-validator');

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, first_name, last_name, phone, address } = req.body;

        // Verificar si el email ya existe
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const [result] = await db.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, address, role) 
       VALUES (?, ?, ?, ?, ?, ?, 'client')`,
            [email, hashedPassword, first_name, last_name, phone || null, address || null]
        );

        // Generar token
        const token = jwt.sign(
            { id: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            token,
            user: {
                id: result.insertId,
                email,
                first_name,
                last_name,
                phone,
                role: 'client'
            }
        });
    } catch (error) {
        console.error('[AUTH] Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario.' });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const [users] = await db.query(
            'SELECT id, email, password, first_name, last_name, phone, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Generar token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('[AUTH] Error en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión.' });
    }
};

// Obtener usuario actual
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, email, first_name, last_name, phone, address, role, avatar, created_at 
       FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('[AUTH] Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener información del usuario.' });
    }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
    try {
        const { first_name, last_name, phone, address } = req.body;

        await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE id = ?`,
            [first_name, last_name, phone, address, req.user.id]
        );

        res.json({ message: 'Perfil actualizado exitosamente.' });
    } catch (error) {
        console.error('[AUTH] Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error al actualizar perfil.' });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Obtener contraseña actual
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar contraseña actual
        const isValid = await bcrypt.compare(current_password, users[0].password);
        if (!isValid) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta.' });
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error('[AUTH] Error al cambiar contraseña:', error);
        res.status(500).json({ message: 'Error al cambiar contraseña.' });
    }
};

// Obtener técnicos y administradores (staff)
exports.getTechnicians = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, first_name, last_name, email FROM users WHERE role IN ('technician', 'admin') AND is_active = TRUE"
        );
        res.json(users);
    } catch (error) {
        console.error('[AUTH] Error al obtener técnicos:', error);
        res.status(500).json({ message: 'Error al obtener técnicos.' });
    }
};
