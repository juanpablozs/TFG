const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

const generateToken = () => {
  const user = { id: 1, username: 'admin', role: 'admin' };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

describe('Rutas de equipos', () => {
  it('Debería devolver una lista de equipos en GET /equipos', async () => {
    const response = await request(app).get('/equipos');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.equipos)).toBeTruthy();
  });

  it('Debería crear un nuevo equipo en POST /equipos', async () => {
    const newTeam = {
      teamId: 1,
      name: 'Real Madrid',
      venue: { name: 'Santiago Bernabéu' }
    };

    const token = generateToken();

    const response = await request(app)
      .post('/equipos')
      .set('Authorization', `Bearer ${token}`)
      .send(newTeam);
      
    if (response.statusCode === 400) {
      expect(response.body.message).toBe('El equipo con este ID ya existe');
    } else {
      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('Real Madrid');
    }
  });
});

describe('Rutas de jugadores', () => {
  it('Debería devolver una lista de jugadores en GET /jugadores', async () => {
    const response = await request(app).get('/jugadores');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.jugadores)).toBeTruthy();
  });

  it('Debería crear un nuevo jugador en POST /jugadores', async () => {
    const newPlayer = {
      playerId: 10,
      name: 'Lionel Messi',
      teamId: 1,
      position: 'Forward',
      age: 35
    };

    const token = generateToken();

    const response = await request(app)
      .post('/jugadores')
      .set('Authorization', `Bearer ${token}`)
      .send(newPlayer);
        
    if (response.statusCode === 400) {
      expect(response.body.message).toBe('El jugador con este ID ya existe');
    } else {
      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('Lionel Messi');
    }
  });
});

describe('Predicciones', () => {
  it('Debería devolver una predicción válida para datos de entrada correctos en POST /predicciones', async () => {
    const predictionData = {
      features: {
        home_shotsOnGoal: 10,
        home_shotsOffGoal: 5,
        home_totalShots: 15,
        home_blockedShots: 2,
        home_shotsInsideBox: 8,
        home_shotsOutsideBox: 7,
        home_cornerKicks: 4,
        home_goalkeeperSaves: 3,
        home_totalPasses: 500,
        home_accuratePasses: 450,
        home_expectedGoals: 2.1,
        away_shotsOnGoal: 5,
        away_shotsOffGoal: 3,
        away_totalShots: 8,
        away_blockedShots: 1,
        away_shotsInsideBox: 4,
        away_shotsOutsideBox: 4,
        away_cornerKicks: 3,
        away_goalkeeperSaves: 5,
        away_totalPasses: 300,
        away_accuratePasses: 250,
        away_expectedGoals: 1.0
      }
    };

    const token = generateToken();

    const response = await request(app)
      .post('/predicciones')
      .set('Authorization', `Bearer ${token}`)
      .send(predictionData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('prediction');
  });
});
