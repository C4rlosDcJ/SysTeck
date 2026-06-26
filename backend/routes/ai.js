const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { auth, isTechnicianOrAdmin } = require('../middleware/auth');

// 1. Diagnóstico Inteligente (requiere auth)
router.post('/diagnose', auth, async (req, res) => {
    try {
        const { deviceType, brand, model, description, serviceRequested } = req.body;
        if (!description) {
            return res.status(400).json({ message: 'Se requiere una descripción de la falla para diagnosticar.' });
        }

        const diagnosis = await aiService.generateDiagnosis(deviceType, brand, model, description, serviceRequested);
        res.json(diagnosis);
    } catch (error) {
        console.error('[AI ROUTE] Error en diagnóstico:', error);
        res.status(500).json({ message: error.message || 'Error al procesar el diagnóstico con la IA.' });
    }
});

// 1b. Auto-completado de cotizaciones conversacionales (requiere auth)
router.post('/parse-quote', auth, async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ message: 'Se requiere una descripción para analizar.' });
        }

        const quoteDetails = await aiService.parseQuote(description);
        res.json(quoteDetails);
    } catch (error) {
        console.error('[AI ROUTE] Error en parse-quote:', error);
        res.status(500).json({ message: error.message || 'Error al analizar la cotización con la IA.' });
    }
});

// 2. Profesionalización de notas técnicas (requiere auth y ser técnico/admin)
router.post('/improve-note', auth, isTechnicianOrAdmin, async (req, res) => {
    try {
        const { note } = req.body;
        if (!note) {
            return res.status(400).json({ message: 'Se requiere la nota técnica.' });
        }

        const improvedNote = await aiService.improveNote(note);
        res.json({ note: improvedNote });
    } catch (error) {
        console.error('[AI ROUTE] Error al profesionalizar nota:', error);
        res.status(500).json({ message: error.message || 'Error al procesar la nota con la IA.' });
    }
});

// 3. Chat de soporte virtual (Público)
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Se requiere un mensaje.' });
        }

        const reply = await aiService.chatSupport(message, history || []);
        res.json({ reply });
    } catch (error) {
        console.error('[AI ROUTE] Error en chat de soporte:', error);
        res.status(500).json({ message: error.message || 'Error al procesar el chat con la IA.' });
    }
});

module.exports = router;
