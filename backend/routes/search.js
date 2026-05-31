const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// Búsqueda global (solo admin)
router.get('/', auth, isAdmin, searchController.search);

module.exports = router;
