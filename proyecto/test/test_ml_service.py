import sys
import os
import pytest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_service import app


@pytest.fixture
def client():
    """Fixture para configurar el cliente de pruebas de Flask"""
    with app.test_client() as client:
        yield client

def test_predict_missing_data(client):
    """Prueba con datos faltantes para predicción"""
    payload = {
        'features': {
            'home_shotsOnGoal': 5,
            'away_totalShots': 12
        }
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 500
    json_data = response.get_json()
    assert 'error' in json_data
    assert 'Error en predicción' in json_data['error']

def test_predict_home_win(client):
    """Prueba para una victoria local (home win)"""
    payload = {
        'features': {
            'home_shotsOnGoal': 10,
            'home_shotsOffGoal': 8,
            'home_totalShots': 18,
            'home_blockedShots': 4,
            'home_shotsInsideBox': 12,
            'home_shotsOutsideBox': 6,
            'home_cornerKicks': 7,
            'home_goalkeeperSaves': 5,
            'home_totalPasses': 500,
            'home_accuratePasses': 450,
            'home_expectedGoals': 2.5,
            'away_shotsOnGoal': 2,
            'away_shotsOffGoal': 3,
            'away_totalShots': 5,
            'away_blockedShots': 1,
            'away_shotsInsideBox': 3,
            'away_shotsOutsideBox': 2,
            'away_cornerKicks': 2,
            'away_goalkeeperSaves': 4,
            'away_totalPasses': 300,
            'away_accuratePasses': 250,
            'away_expectedGoals': 0.8
        }
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'prediction' in json_data
    assert json_data['prediction'] == 'Victoria Local'

def test_predict_away_win(client):
    """Prueba para una victoria visitante (away win)"""
    payload = {
        'features': {
            'home_shotsOnGoal': 2,
            'home_shotsOffGoal': 3,
            'home_totalShots': 5,
            'home_blockedShots': 1,
            'home_shotsInsideBox': 3,
            'home_shotsOutsideBox': 2,
            'home_cornerKicks': 2,
            'home_goalkeeperSaves': 4,
            'home_totalPasses': 300,
            'home_accuratePasses': 250,
            'home_expectedGoals': 0.8,
            'away_shotsOnGoal': 10,
            'away_shotsOffGoal': 8,
            'away_totalShots': 18,
            'away_blockedShots': 4,
            'away_shotsInsideBox': 12,
            'away_shotsOutsideBox': 6,
            'away_cornerKicks': 7,
            'away_goalkeeperSaves': 5,
            'away_totalPasses': 500,
            'away_accuratePasses': 450,
            'away_expectedGoals': 2.5
        }
    }
    response = client.post('/predict', json=payload)
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'prediction' in json_data
    assert json_data['prediction'] == 'Victoria Visitante'