const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { auth, isAdmin } = require('../middleware/auth');

// Rutas públicas (catálogo)
router.get('/', serviceController.getAll);
router.get('/device-types', serviceController.getDeviceTypes);
router.get('/brands', serviceController.getBrands);
router.get('/:id', serviceController.getById);

// Rutas de tipos de dispositivo
router.post('/device-types', auth, isAdmin, serviceController.createDeviceType);
router.put('/device-types/:id', auth, isAdmin, serviceController.updateDeviceType);
router.delete('/device-types/:id', auth, isAdmin, serviceController.deleteDeviceType);

// Rutas de marcas
router.post('/brands', auth, isAdmin, serviceController.createBrand);
router.put('/brands/:id', auth, isAdmin, serviceController.updateBrand);
router.delete('/brands/:id', auth, isAdmin, serviceController.deleteBrand);

// Rutas de servicios (admin)
router.post('/', auth, isAdmin, serviceController.create);
router.put('/:id', auth, isAdmin, serviceController.update);
router.delete('/:id', auth, isAdmin, serviceController.delete);

module.exports = router;
