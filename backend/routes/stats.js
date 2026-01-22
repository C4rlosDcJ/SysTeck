const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { auth, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren auth y admin
router.use(auth, isAdmin);

router.get('/dashboard', statsController.getDashboard);
router.get('/revenue', statsController.getRevenue);
router.get('/technicians', statsController.getTechniciansStats);

module.exports = router;
