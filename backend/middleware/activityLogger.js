const db = require('../config/database');

module.exports = async (req, res, next) => {
    // Captura el método original res.send para registrar la actividad tras finalizar la respuesta
    const originalSend = res.send;

    res.send = function (body) {
        // Ejecuta el envío original
        res.send = originalSend;
        res.send(body);

        // Registrar en segundo plano para no demorar la respuesta al cliente
        // Solo registrar acciones de modificación (POST, PUT, DELETE) que sean exitosas (2xx)
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
            // Ignorar ciertas rutas como login/registro si no se desea guardar contraseñas o datos muy pesados
            if (req.originalUrl.includes('/api/auth/login')) return;

            const userId = req.user ? req.user.id : null;
            const userEmail = req.user ? req.user.email : 'System/Anonymous';
            const action = `${req.method} ${req.originalUrl}`;
            const details = JSON.stringify({
                body: req.body,
                params: req.params,
                query: req.query,
                ip: req.ip || req.headers['x-forwarded-for']
            });

            db.query(
                `INSERT INTO activity_logs (user_id, user_email, action, details) VALUES (?, ?, ?, ?)`,
                [userId, userEmail, action, details]
            ).catch(err => {
                console.error('[LOG ERROR] No se pudo escribir log de actividad:', err);
            });
        }
    };

    next();
};
