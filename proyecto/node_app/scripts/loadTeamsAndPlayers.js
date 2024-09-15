const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const apiKey = process.env.API_FOOTBALL_KEY;
const mongoUri = process.env.MONGO_URI;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, params, retries = 3, delayMs = 60000) {
  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      },
      params
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.warn(`Rate limit exceeded, retrying in ${delayMs / 1000} seconds...`);
      await delay(delayMs);
      return fetchWithRetry(url, params, retries - 1, delayMs);
    } else {
      throw error;
    }
  }
}

async function fetchPlayersForTeam(teamId) {
  let players = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/players', {
      team: teamId,
      season: 2023,
      page: page
    });

    players.push(...data.response);
    totalPages = data.paging.total;
    page++;

    if (page <= totalPages) {
      await delay(1000);
    }
  }

  return players;
}

async function fetchTeamsAndPlayers(startIndex = 0, endIndex = 5) {
  try {
    const teamsData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/teams', {
      league: 140,
      season: 2023
    });
    const teams = teamsData.response.slice(startIndex, endIndex);

    const players = [];
    for (const team of teams) {
      const teamPlayers = await fetchPlayersForTeam(team.team.id);
      players.push(...teamPlayers);
    }

    return { teams, players };
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

    console.log('Teams and players loaded successfully');
  } catch (error) {
    console.error('Error loading data into MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    const startIndex = parseInt(process.argv[2], 10) || 0;
    const endIndex = parseInt(process.argv[3], 10) || 5;
    const data = await fetchTeamsAndPlayers(startIndex, endIndex);
    await loadToMongo(data);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
