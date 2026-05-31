const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Rastrear reparación por ticket (sin autenticación)
router.get('/track/:ticket', publicController.trackRepair);

module.exports = router;
