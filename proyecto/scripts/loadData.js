const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Cargar variables de entorno desde el archivo .env

const apiKey = process.env.API_FOOTBALL_KEY;
const mongoUri = process.env.MONGO_URI;

async function fetchPlayersForTeam(teamId) {
  let players = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/players`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      },
      params: {
        team: teamId,
        season: 2023,
        page: page
      }
    });

    players.push(...response.data.response);
    totalPages = response.data.paging.total; // Asume que la respuesta contiene un objeto `paging` con `total` páginas
    page++;
  }

  return players;
}

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

    const matchesWithStats = await Promise.all(matches.map(async match => {
      const statsResponse = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        },
        params: {
          fixture: match.fixture.id
        }
      });
      return { ...match, statistics: statsResponse.data.response };
    }));

    const players = [];
    for (const team of teams) {
      const teamPlayers = await fetchPlayersForTeam(team.team.id);
      players.push(...teamPlayers);
    }

    return { teams, matches: matchesWithStats, players };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function getStatValue(statistics, type) {
  const stat = statistics.find(stat => stat.type === type);
  return stat ? stat.value : 'N/A';
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
      code: team.team.code,
      country: team.team.country,
      founded: team.team.founded,
      national: team.team.national,
      logo: team.team.logo,
      venue: {
        id: team.venue.id,
        name: team.venue.name,
        address: team.venue.address,
        city: team.venue.city,
        capacity: team.venue.capacity,
        surface: team.venue.surface,
        image: team.venue.image
      }
    })));

    await matchesCollection.insertMany(data.matches.map(match => ({
      matchId: match.fixture.id,
      referee: match.fixture.referee,
      timezone: match.fixture.timezone,
      date: match.fixture.date,
      timestamp: match.fixture.timestamp,
      periods: match.fixture.periods,
      venue: match.fixture.venue,
      status: match.fixture.status,
      league: match.league,
      teams: match.teams,
      goals: match.goals,
      score: match.score,
      statistics: match.statistics.map(stat => ({
        team: stat.team,
        stats: stat.statistics
      }))
    })));

    await playersCollection.insertMany(data.players.map(player => ({
      playerId: player.player.id,
      name: player.player.name,
      firstname: player.player.firstname,
      lastname: player.player.lastname,
      age: player.player.age,
      birth: player.player.birth,
      nationality: player.player.nationality,
      height: player.player.height,
      weight: player.player.weight,
      injured: player.player.injured,
      photo: player.player.photo,
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
