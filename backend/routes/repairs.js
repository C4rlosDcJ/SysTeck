const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { auth, isAdmin, isTechnicianOrAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Listar reparaciones (filtradas por rol)
router.get('/', repairController.getAll);

// Obtener detalle de reparación
router.get('/:id', repairController.getById);

// Crear reparación (admin/técnico pueden crear para cualquier cliente, cliente solo para sí mismo)
router.post('/', repairController.create);

// Actualizar reparación (solo admin/técnico)
router.put('/:id', isTechnicianOrAdmin, repairController.update);

// Cambiar estado (solo admin/técnico)
router.put('/:id/status', isTechnicianOrAdmin, repairController.updateStatus);

// Agregar nota
router.post('/:id/notes', repairController.addNote);

// Eliminar reparación (solo admin)
router.delete('/:id', isAdmin, repairController.delete);

module.exports = router;
