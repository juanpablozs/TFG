from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'models_prediction/logistic_match_result_model.pkl'
SCALER_PATH = 'models_prediction/scaler.pkl'

def load_model_and_scaler():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("Modelo y scaler cargados correctamente.")
    else:
        model, scaler = None, None
        print("Modelo o scaler no encontrado.")
    return model, scaler

model, scaler = load_model_and_scaler()

feature_columns = ['home_shotsOnGoal', 'home_shotsOffGoal', 'home_totalShots',
                   'home_blockedShots', 'home_shotsInsideBox', 'home_shotsOutsideBox',
                   'home_cornerKicks', 'home_goalkeeperSaves', 'home_totalPasses',
                   'home_accuratePasses', 'home_expectedGoals',
                   'away_shotsOnGoal', 'away_shotsOffGoal', 'away_totalShots',
                   'away_blockedShots', 'away_shotsInsideBox', 'away_shotsOutsideBox',
                   'away_cornerKicks', 'away_goalkeeperSaves', 'away_totalPasses',
                   'away_accuratePasses', 'away_expectedGoals']

prediction_mapping = {0: 'Victoria Visitante', 1: 'Empate', 2: 'Victoria Local'}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json['features']
        
        data_df = pd.DataFrame([list(data.values())], columns=feature_columns)

        print("Datos organizados para predicción (con nombres de columnas):")
        print(data_df)

        data_scaled = scaler.transform(data_df)

        print("Datos escalados para predicción:")
        print(data_scaled)

        prediction = model.predict(data_scaled)

        prediction = int(prediction[0])

        prediction_label = prediction_mapping.get(prediction, "Unknown")

        return jsonify({'prediction': prediction_label})
    except Exception as e:
        print(f"Error en predicción: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
