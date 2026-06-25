const rateLimit = require('express-rate-limit');

// Limiter para peticiones generales
exports.limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Limita cada IP a 1000 peticiones por ventana (antes 100)
    standardHeaders: true, // Retorna info de límite en headers de respuesta
    legacyHeaders: false,
    message: {
        message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.'
    }
});

// Limiter más estricto para endpoints de autenticación
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Limita cada IP a 50 intentos de login (antes 15)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Demasiados intentos de inicio de sesión. Bloqueado temporalmente por 15 minutos.'
    }
});
