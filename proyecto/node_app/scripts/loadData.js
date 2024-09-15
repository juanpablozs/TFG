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
  }

  return players;
}

async function fetchData() {
  try {
    const teamsData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/teams', {
      league: 140,
      season: 2023
    });
    const teams = teamsData.response;

    const matchesData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
      league: 140,
      season: 2023
    });
    const matches = matchesData.response;

    const matchesWithStats = await Promise.all(matches.map(async match => {
      const statsData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics', {
        fixture: match.fixture.id
      });
      return { ...match, statistics: statsData.response };
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
        stats: {
          shotsOnGoal: getStatValue(stat.statistics, 'Shots on Goal'),
          shotsOffGoal: getStatValue(stat.statistics, 'Shots off Goal'),
          totalShots: getStatValue(stat.statistics, 'Total Shots'),
          blockedShots: getStatValue(stat.statistics, 'Blocked Shots'),
          shotsInsideBox: getStatValue(stat.statistics, 'Shots insidebox'),
          shotsOutsideBox: getStatValue(stat.statistics, 'Shots outsidebox'),
          fouls: getStatValue(stat.statistics, 'Fouls'),
          cornerKicks: getStatValue(stat.statistics, 'Corner Kicks'),
          offsides: getStatValue(stat.statistics, 'Offsides'),
          possession: getStatValue(stat.statistics, 'Ball Possession'),
          yellowCards: getStatValue(stat.statistics, 'Yellow Cards'),
          redCards: getStatValue(stat.statistics, 'Red Cards'),
          goalkeeperSaves: getStatValue(stat.statistics, 'Goalkeeper Saves'),
          totalPasses: getStatValue(stat.statistics, 'Total passes'),
          accuratePasses: getStatValue(stat.statistics, 'Passes accurate'),
          passPercentage: getStatValue(stat.statistics, 'Passes %'),
          expectedGoals: getStatValue(stat.statistics, 'expected_goals'),
          goalsPrevented: getStatValue(stat.statistics, 'goals_prevented')
        }
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
