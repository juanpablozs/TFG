import pandas as pd
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
import joblib

# Cargar los datos de entrenamiento y prueba con los nombres de las columnas
X_train = pd.read_csv('data/X_train.csv')
y_train = pd.read_csv('data/y_train.csv').values.ravel()
X_test = pd.read_csv('data/X_test.csv')
y_test = pd.read_csv('data/y_test.csv').values.ravel()


# Crear el modelo con balanceo de clases
model = make_pipeline(SVC(kernel='linear', probability=True, class_weight='balanced'))

# Entrenar el modelo
model.fit(X_train, y_train)

# Evaluar el rendimiento del modelo en los datos de prueba
y_pred = model.predict(X_test)

# Imprimir el informe de clasificación
print("Informe de clasificación:")
print(classification_report(y_test, y_pred))

# Imprimir la matriz de confusión
print("Matriz de confusión:")
print(confusion_matrix(y_test, y_pred))

svm_cross_val_scores = cross_val_score(model, X_train, y_train, cv=5)
print(f"Precisión promedio SVM en validación cruzada: {svm_cross_val_scores.mean()}\n")

# Guardar el modelo entrenado
joblib.dump(model, 'models_prediction/svm_match_result_model.pkl')
