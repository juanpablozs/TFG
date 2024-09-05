const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const joblib = require('joblib');
const path = require('path');
const modelPath = path.join(__dirname, '../models_prediction/match_result_model.pkl');
const csv = require('csv-parser');
const fs = require('fs');
const { SVC } = require('sklearn/svm');
const { StandardScaler } = require('sklearn/preprocessing');
const { make_pipeline } = require('sklearn/utils');

// Cargar el modelo entrenado al iniciar el servidor
let model;
try {
    model = joblib.load(modelPath);
    console.log('Modelo cargado correctamente.');
} catch (error) {
    console.error('Error al cargar el modelo:', error.message);
}

// Helper para cargar los datos CSV
async function loadCSVData(filePath) {
    const data = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => data.push(Object.values(row).map(Number)))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

// Ruta para realizar predicciones
router.post('/', authenticateToken, async (req, res) => {
    try {
        const features = req.body.features; // Las características de entrada del usuario deben ser pasadas como JSON
        if (!model) {
            return res.status(500).json({ message: 'Modelo no cargado, contacte al administrador' });
        }
        const prediction = model.predict([features]);
        res.json({ prediction: prediction[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error al realizar la predicción', error: error.message });
    }
});

// Ruta para reentrenar y actualizar el modelo (solo para administradores)
router.post('/actualizar', authenticateToken, async (req, res) => {
    // Solo el administrador puede reentrenar el modelo
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No tienes permiso para actualizar el modelo' });
    }

    try {
        // Cargar los datos de entrenamiento desde los archivos CSV
        const X_train = await loadCSVData(path.join(__dirname, '../data/X_train.csv'));
        const y_train = (await loadCSVData(path.join(__dirname, '../data/y_train.csv'))).flat(); // Flatten para obtener una sola dimensión

        // Crear un nuevo pipeline de SVM y normalización
        const newModel = make_pipeline(new StandardScaler(), new SVC({ probability: true }));

        // Reentrenar el modelo
        newModel.fit(X_train, y_train);

        // Guardar el nuevo modelo en el directorio de predicciones
        joblib.dump(newModel, modelPath);

        // Actualizar el modelo en memoria para predicciones futuras
        model = newModel;

        res.json({ message: 'Modelo reentrenado y actualizado correctamente.' });
    } catch (error) {
        console.error('Error al reentrenar el modelo:', error.message);
        res.status(500).json({ message: 'Error al reentrenar el modelo', error: error.message });
    }
});

module.exports = router;
