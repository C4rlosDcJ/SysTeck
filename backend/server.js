const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { limiter } = require('./middleware/rateLimiter');
const activityLogger = require('./middleware/activityLogger');
require('dotenv').config();

const app = express();

// Helmet.js para cabeceras de seguridad HTTP
app.use(helmet({
    crossOriginResourcePolicy: false, // Permitir cargar imágenes locales en frontend
}));

// Rate limiting general
app.use('/api/', limiter);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Activity logger para operaciones CRUD
app.use('/api', activityLogger);

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/services', require('./routes/services'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/pos', require('./routes/pos'));
app.use('/api/public', require('./routes/public'));
app.use('/api/search', require('./routes/search'));

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SysTeck API funcionando correctamente' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // 1. Inicializar base de datos si no existe
        const dbInit = require('./config/dbInit');
        await dbInit();

        // 2. Verificar la conexión del pool
        const db = require('./config/database');
        const connection = await db.getConnection();
        console.log('[DB] Conexión a MySQL verificada y lista para consultas.');
        connection.release();

        // 3. Levantar el servidor Express
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                           ║
║   SysTeck API Server                                     ║
║   ───────────────────────────────────────────────────    ║
║   Servidor corriendo en: http://localhost:${PORT}          ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Error fatal al arrancar el servidor backend:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
