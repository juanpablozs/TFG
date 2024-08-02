import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

data = pd.read_csv('data/matches.csv')

features = data[['home_shotsOnGoal', 'home_shotsOffGoal', 'home_totalShots', 
                 'home_blockedShots', 'home_shotsInsideBox', 'home_shotsOutsideBox',
                 'home_fouls', 'home_cornerKicks', 'home_offsides',
                 'home_possession', 'home_yellowCards', 'home_redCards',
                 'home_goalkeeperSaves', 'home_totalPasses', 'home_accuratePasses',
                 'home_passPercentage', 'home_expectedGoals', 'home_goalsPrevented',
                 'away_shotsOnGoal', 'away_shotsOffGoal', 'away_totalShots',
                 'away_blockedShots', 'away_shotsInsideBox', 'away_shotsOutsideBox',
                 'away_fouls', 'away_cornerKicks', 'away_offsides',
                 'away_possession', 'away_yellowCards', 'away_redCards',
                 'away_goalkeeperSaves', 'away_totalPasses', 'away_accuratePasses',
                 'away_passPercentage', 'away_expectedGoals', 'away_goalsPrevented']]

label_encoder = LabelEncoder()
labels = label_encoder.fit_transform(data['resultado'])

X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)

X_train.to_csv('data/X_train.csv', index=False)
X_test.to_csv('data/X_test.csv', index=False)
pd.DataFrame(y_train, columns=['resultado']).to_csv('data/y_train.csv', index=False)
pd.DataFrame(y_test, columns=['resultado']).to_csv('data/y_test.csv', index=False)
