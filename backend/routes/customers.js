const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { auth, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren auth y admin
router.use(auth, isAdmin);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.get('/:id/repairs', customerController.getRepairs);
router.post('/', customerController.create);
router.put('/:id', customerController.update);

module.exports = router;
