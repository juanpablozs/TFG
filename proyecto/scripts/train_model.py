import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score
import joblib

# Cargar los datos de entrenamiento y prueba
X_train = pd.read_csv('data/X_train.csv')
y_train = pd.read_csv('data/y_train.csv').values.ravel()
X_test = pd.read_csv('data/X_test.csv')
y_test = pd.read_csv('data/y_test.csv').values.ravel()

# Cargar el scaler guardado
scaler = joblib.load('models_prediction/scaler.pkl')

# Aplicar el escalado a los datos de prueba (X_test)
X_test_scaled = scaler.transform(X_test)

# Crear el modelo Logistic Regression con balanceo de clases
logistic_model = LogisticRegression(solver='lbfgs', max_iter=500, class_weight='balanced')

# Entrenar el modelo
logistic_model.fit(X_train, y_train)

# Evaluar el rendimiento del modelo en los datos de prueba
y_pred_logistic = logistic_model.predict(X_test_scaled)

# Imprimir el informe de clasificación
print("Informe de clasificación Logistic Regression:")
print(classification_report(y_test, y_pred_logistic))

# Imprimir la matriz de confusión
print("Matriz de confusión Logistic Regression:")
print(confusion_matrix(y_test, y_pred_logistic))

# Validación cruzada para el modelo Logistic Regression
logistic_cross_val_scores = cross_val_score(logistic_model, X_train, y_train, cv=5)
print(f"Precisión promedio Logistic Regression en validación cruzada: {logistic_cross_val_scores.mean()}\n")

# Guardar el modelo entrenado
joblib.dump(logistic_model, 'models_prediction/logistic_match_result_model.pkl')
