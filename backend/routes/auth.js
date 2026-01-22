const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Registro
router.post('/register', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('first_name').notEmpty().withMessage('El nombre es requerido'),
    body('last_name').notEmpty().withMessage('El apellido es requerido')
], authController.register);

// Login
router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], authController.login);

// Obtener usuario actual (requiere auth)
router.get('/me', auth, authController.getMe);

// Obtener técnicos (solo admin/staff)
router.get('/technicians', auth, authController.getTechnicians);

// Actualizar perfil (requiere auth)
router.put('/profile', auth, authController.updateProfile);

// Cambiar contraseña (requiere auth)
router.put('/change-password', auth, [
    body('current_password').notEmpty().withMessage('Contraseña actual requerida'),
    body('new_password').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], authController.changePassword);

module.exports = router;
