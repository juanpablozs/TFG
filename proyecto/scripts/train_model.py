import pandas as pd
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import joblib

X_train = pd.read_csv('data/X_train.csv')
y_train = pd.read_csv('data/y_train.csv').values.ravel()

model = make_pipeline(StandardScaler(), SVC(probability=True))

model.fit(X_train, y_train)

joblib.dump(model, 'models_prediction/match_result_model.pkl')
