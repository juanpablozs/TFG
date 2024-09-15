import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score
import joblib


X_train = pd.read_csv('data/X_train.csv').values
y_train = pd.read_csv('data/y_train.csv').values.ravel()
X_test = pd.read_csv('data/X_test.csv').values
y_test = pd.read_csv('data/y_test.csv').values.ravel()


logistic_model = LogisticRegression(solver='lbfgs', max_iter=500)
logistic_model.fit(X_train, y_train)


y_pred_logistic = logistic_model.predict(X_test)
print("Informe de clasificación Logistic Regression:")
print(classification_report(y_test, y_pred_logistic))
print("Matriz de confusión Logistic Regression:")
print(confusion_matrix(y_test, y_pred_logistic))


logistic_cross_val_scores = cross_val_score(logistic_model, X_train, y_train, cv=5)
print(f"Precisión promedio Logistic Regression en validación cruzada: {logistic_cross_val_scores.mean()}\n")


joblib.dump(logistic_model, 'models_prediction/logistic_match_result_model.pkl')
