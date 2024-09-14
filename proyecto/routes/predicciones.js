const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

// URL del servicio de Machine Learning en Python
const ML_SERVICE_URL = 'http://localhost:5000';

function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

// Ruta para realizar predicciones
router.post('/', authenticateToken, async (req, res) => {
    try {
        const features = req.body.features;

        if (!features || typeof features !== 'object') {
            return res.status(400).json({ message: 'Datos de características faltantes o formato inválido. Debe ser un objeto JSON.' });
        }

        const requiredFeatures = [
            'home_shotsOnGoal', 'home_shotsOffGoal', 'home_totalShots', 'home_blockedShots',
            'home_shotsInsideBox', 'home_shotsOutsideBox', 'home_cornerKicks', 'home_goalkeeperSaves',
            'home_totalPasses', 'home_accuratePasses', 'home_expectedGoals', 'away_shotsOnGoal',
            'away_shotsOffGoal', 'away_totalShots', 'away_blockedShots', 'away_shotsInsideBox',
            'away_shotsOutsideBox', 'away_cornerKicks', 'away_goalkeeperSaves', 'away_totalPasses',
            'away_accuratePasses', 'away_expectedGoals'
        ];

        const missingFeatures = requiredFeatures.filter(f => !(f in features));
        if (missingFeatures.length > 0) {
            return res.status(400).json({ message: `Faltan características: ${missingFeatures.join(', ')}` });
        }

        const invalidTypes = requiredFeatures.filter(f => !isValidNumber(features[f]));
        if (invalidTypes.length > 0) {
            return res.status(400).json({ message: `Las siguientes características deben ser números: ${invalidTypes.join(', ')}` });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/predict`, { features });

        res.json({ prediction: response.data.prediction });
    } catch (error) {
        console.error('Error al realizar la predicción:', error.message);
        res.status(500).json({ message: 'Error al realizar la predicción', error: error.message });
    }
});

// Ruta para reentrenar y actualizar el modelo (solo para administradores)
router.post('/actualizar', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No tienes permiso para actualizar el modelo' });
    }

    try {
        const response = await axios.post(`${ML_SERVICE_URL}/retrain`);
        const { message, classification_report, confusion_matrix, cross_val_mean } = response.data;

        res.json({
            message,
            classification_report,
            confusion_matrix,
            cross_val_mean
        });
    } catch (error) {
        console.error('Error al reentrenar el modelo:', error.message);
        res.status(500).json({ message: 'Error al reentrenar el modelo', error: error.message });
    }
});


module.exports = router;
