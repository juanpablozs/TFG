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

async function fetchMatchesAndStatistics(season, startIndex = 0, endIndex = 10) {
  try {
    const matchesData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
      league: 140,
      season: season
    });
    const matches = matchesData.response.slice(startIndex, endIndex);

    const matchesWithStats = await Promise.all(matches.map(async match => {
      const statsData = await fetchWithRetry('https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics', {
        fixture: match.fixture.id
      });
      return { ...match, statistics: statsData.response };
    }));

    return matchesWithStats;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function getStatValue(statistics, type) {
  const stat = statistics.find(stat => stat.type === type);
  return stat ? stat.value : 'N/A';
}

async function loadToMongo(matches, season) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('footballDB');
    const collectionName = `matches_${season}`;
    const matchesCollection = db.collection(collectionName);

    await matchesCollection.insertMany(matches.map(match => ({
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

    console.log(`Matches and statistics for season ${season} loaded successfully`);
  } catch (error) {
    console.error('Error loading data into MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    const season = 2022;
    const startIndex = parseInt(process.argv[2], 10) || 0;
    const endIndex = parseInt(process.argv[3], 10) || 20;
    const matches = await fetchMatchesAndStatistics(season, startIndex, endIndex);
    await loadToMongo(matches, season);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
