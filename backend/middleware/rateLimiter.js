const rateLimit = require('express-rate-limit');

// Limiter para peticiones generales
exports.limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita cada IP a 100 peticiones por ventana
    standardHeaders: true, // Retorna info de límite en headers de respuesta
    legacyHeaders: false,
    message: {
        message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.'
    }
});

// Limiter más estricto para endpoints de autenticación
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // Limita cada IP a 15 intentos de login
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Demasiados intentos de inicio de sesión. Bloqueado temporalmente por 15 minutos.'
    }
});
