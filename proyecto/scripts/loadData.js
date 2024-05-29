const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Cargar variables de entorno desde el archivo .env

const apiKey = process.env.API_FOOTBALL_KEY;
const mongoUri = process.env.MONGO_URI;

async function fetchData() {
  try {
    const teamsResponse = await axios.get('https://api-football-v1.p.rapidapi.com/v3/teams?league=140&season=2023', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    const teams = teamsResponse.data.response;

    const matchesResponse = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures?league=140&season=2023', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    const matches = matchesResponse.data.response;

    const players = [];
    for (const team of teams) {
      const playersResponse = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/players?team=${team.team.id}&season=2023`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      });
      players.push(...playersResponse.data.response);
    }

    return { teams, matches, players };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function loadToMongo(data) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('footballDB');
    const teamsCollection = db.collection('teams');
    const matchesCollection = db.collection('matches');
    const playersCollection = db.collection('players');

    await teamsCollection.insertMany(data.teams.map(team => ({
      teamId: team.team.id,
      name: team.team.name,
      logo: team.team.logo,
      players: data.players.filter(player => player.statistics && player.statistics[0].team.id === team.team.id).map(player => ({
        playerId: player.player.id,
        name: player.player.name,
        position: player.statistics[0].games.position
      }))
    })));

    await matchesCollection.insertMany(data.matches.map(match => ({
      matchId: match.fixture.id,
      date: match.fixture.date,
      homeTeamId: match.teams.home.id,
      awayTeamId: match.teams.away.id,
      homeGoals: match.goals.home,
      awayGoals: match.goals.away,
      statistics: {
        possession: match.statistics && match.statistics[0] && match.statistics[0].type === 'Possession' ? match.statistics[0].value : 'N/A',
        shotsOnTarget: match.statistics && match.statistics[0] && match.statistics[0].type === 'Shots on Target' ? match.statistics[0].value : 0,
        fouls: match.statistics && match.statistics[0] && match.statistics[0].type === 'Fouls' ? match.statistics[0].value : 0,
        yellowCards: match.statistics && match.statistics[0] && match.statistics[0].type === 'Yellow Cards' ? match.statistics[0].value : 0,
        redCards: match.statistics && match.statistics[0] && match.statistics[0].type === 'Red Cards' ? match.statistics[0].value : 0
      }
    })));

    await playersCollection.insertMany(data.players.map(player => ({
      playerId: player.player.id,
      name: player.player.name,
      teamId: player.statistics[0].team.id,
      teamName: player.statistics[0].team.name,
      position: player.statistics[0].games.position
    })));

    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data into MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    const data = await fetchData();
    await loadToMongo(data);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
