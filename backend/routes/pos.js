const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const posController = require('../controllers/posController');

// Todas las rutas requieren autenticación y ser admin
router.use(auth);
router.use(isAdmin);

// Ventas
router.post('/sales', posController.createSale);
router.get('/sales', posController.getSales);
router.get('/sales/stats', posController.getSalesStats);
router.get('/sales/:id', posController.getSaleById);
router.put('/sales/:id/cancel', posController.cancelSale);

// Reparaciones cobrables
router.get('/repairs/billable', posController.getBillableRepairs);
router.get('/repairs/:id', posController.getRepairForPOS);

module.exports = router;
