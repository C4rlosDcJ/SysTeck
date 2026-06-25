const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Rastrear reparación por ticket (sin autenticación)
router.get('/track/:ticket', publicController.trackRepair);

// Obtener tema visual (público, sin autenticación)
router.get('/theme', publicController.getTheme);

module.exports = router;
