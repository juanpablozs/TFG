import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

# Cargar los datos
data = pd.read_csv('data/matches.csv')

# Definir las características (features) y la etiqueta (label)
features = data[['home_shotsOnGoal', 'home_shotsOffGoal', 'home_totalShots', 
                 'home_blockedShots', 'home_shotsInsideBox', 'home_shotsOutsideBox',
                 'home_cornerKicks', 'home_goalkeeperSaves', 'home_totalPasses', 
                 'home_accuratePasses', 'home_expectedGoals',
                 'away_shotsOnGoal', 'away_shotsOffGoal', 'away_totalShots',
                 'away_blockedShots', 'away_shotsInsideBox', 'away_shotsOutsideBox',
                 'away_cornerKicks', 'away_goalkeeperSaves', 'away_totalPasses', 
                 'away_accuratePasses', 'away_expectedGoals']]

# Imputar valores faltantes
imputer = SimpleImputer(strategy='mean')
features_imputed = imputer.fit_transform(features)

# Codificar las etiquetas
label_encoder = LabelEncoder()
labels = label_encoder.fit_transform(data['resultado'])

# Escalar las características, pero mantener los nombres de columnas
scaler = StandardScaler()
features_normalized = pd.DataFrame(scaler.fit_transform(features_imputed), columns=features.columns)

# Separar los datos en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(features_normalized, labels, test_size=0.2, random_state=42)

# Guardar los conjuntos de datos con nombres de columnas
X_train.to_csv('data/X_train.csv', index=False)
X_test.to_csv('data/X_test.csv', index=False)
pd.DataFrame(y_train, columns=['resultado']).to_csv('data/y_train.csv', index=False)
pd.DataFrame(y_test, columns=['resultado']).to_csv('data/y_test.csv', index=False)
