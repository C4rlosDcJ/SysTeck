const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Rastrear reparación por ticket (sin autenticación)
router.get('/track/:ticket', publicController.trackRepair);

// Obtener tema visual (público, sin autenticación)
router.get('/theme', publicController.getTheme);

// Catálogo público (sin autenticación)
router.get('/catalog/services', publicController.getCatalogServices);
router.get('/catalog/products', publicController.getCatalogProducts);

module.exports = router;
