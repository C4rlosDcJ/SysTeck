const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, isAdmin } = require('../middleware/auth');

// Todas las rutas de configuración requieren admin
router.use(auth, isAdmin);

router.get('/', settingsController.getAll);
router.post('/', settingsController.update);

module.exports = router;
