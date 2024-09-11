from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'models_prediction/match_result_model.pkl'

# Cargar el modelo al iniciar el servicio
def load_model():
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Modelo cargado correctamente.")
    else:
        model = None
        print("Modelo no encontrado.")
    return model

model = load_model()

# Definir los nombres de las características esperadas
feature_columns = ['home_shotsOnGoal', 'home_shotsOffGoal', 'home_totalShots',
                   'home_blockedShots', 'home_shotsInsideBox', 'home_shotsOutsideBox',
                   'home_cornerKicks', 'home_goalkeeperSaves', 'home_totalPasses',
                   'home_accuratePasses', 'home_expectedGoals',
                   'away_shotsOnGoal', 'away_shotsOffGoal', 'away_totalShots',
                   'away_blockedShots', 'away_shotsInsideBox', 'away_shotsOutsideBox',
                   'away_cornerKicks', 'away_goalkeeperSaves', 'away_totalPasses',
                   'away_accuratePasses', 'away_expectedGoals']

# Definir el mapeo de las predicciones numéricas a resultados comprensibles
prediction_mapping = {0: 'Home Win', 1: 'Away Win', 2: 'Draw'}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json['features']
        
        # Convertir los datos en una lista de listas (índices numéricos)
        data_array = [list(data.values())]

        print("Datos para predicción: ", data_array)

        # Realizar la predicción
        prediction = model.predict(data_array)
        
        # Asegurarse de que la predicción sea de tipo nativo de Python (int en lugar de int64)
        prediction = int(prediction[0])

        # Traducir la predicción numérica a resultado claro
        prediction_label = prediction_mapping.get(prediction, "Unknown")

        return jsonify({'prediction': prediction_label})
    except Exception as e:
        print(f"Error en predicción: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
