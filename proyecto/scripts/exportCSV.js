const fs = require('fs');
const { MongoClient } = require('mongodb');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

async function fetchMatches() {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('footballDB');
    const matches = await db.collection('matches').find({}).toArray();
    return matches;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  } finally {
    await client.close();
  }
}

function flattenMatch(match) {
  const { matchId, referee, timezone, date, timestamp, periods, venue, status, league, teams, goals, score, statistics } = match;
  const result = goals.home > goals.away ? 'Home Win' : goals.home < goals.away ? 'Away Win' : 'Draw';

  const homeStats = statistics.find(stat => stat.team.id === teams.home.id) || {};
  const awayStats = statistics.find(stat => stat.team.id === teams.away.id) || {};

  const flattenStats = (stats) => {
    const defaultStats = {
      shotsOnGoal: 0,
      shotsOffGoal: 0,
      totalShots: 0,
      blockedShots: 0,
      shotsInsideBox: 0,
      shotsOutsideBox: 0,
      fouls: 0,
      cornerKicks: 0,
      offsides: 0,
      possession: '0%',
      yellowCards: 0,
      redCards: 0,
      goalkeeperSaves: 0,
      totalPasses: 0,
      accuratePasses: 0,
      passPercentage: '0%',
      expectedGoals: '0',
      goalsPrevented: '0'
    };
    return { ...defaultStats, ...stats };
  };

  return {
    matchId,
    referee,
    timezone,
    date,
    timestamp,
    period_first: periods.first,
    period_second: periods.second,
    venue_id: venue.id,
    venue_name: venue.name,
    venue_city: venue.city,
    status_long: status.long,
    status_short: status.short,
    status_elapsed: status.elapsed,
    league_id: league.id,
    league_name: league.name,
    league_country: league.country,
    league_logo: league.logo,
    league_flag: league.flag,
    league_season: league.season,
    league_round: league.round,
    home_team_id: teams.home.id,
    home_team_name: teams.home.name,
    home_team_logo: teams.home.logo,
    home_team_winner: teams.home.winner,
    away_team_id: teams.away.id,
    away_team_name: teams.away.name,
    away_team_logo: teams.away.logo,
    away_team_winner: teams.away.winner,
    goals_home: goals.home,
    goals_away: goals.away,
    halftime_home: score.halftime.home,
    halftime_away: score.halftime.away,
    fulltime_home: score.fulltime.home,
    fulltime_away: score.fulltime.away,
    extratime_home: score.extratime.home,
    extratime_away: score.extratime.away,
    penalty_home: score.penalty.home,
    penalty_away: score.penalty.away,
    home_shotsOnGoal: flattenStats(homeStats.stats).shotsOnGoal,
    home_shotsOffGoal: flattenStats(homeStats.stats).shotsOffGoal,
    home_totalShots: flattenStats(homeStats.stats).totalShots,
    home_blockedShots: flattenStats(homeStats.stats).blockedShots,
    home_shotsInsideBox: flattenStats(homeStats.stats).shotsInsideBox,
    home_shotsOutsideBox: flattenStats(homeStats.stats).shotsOutsideBox,
    home_fouls: flattenStats(homeStats.stats).fouls,
    home_cornerKicks: flattenStats(homeStats.stats).cornerKicks,
    home_offsides: flattenStats(homeStats.stats).offsides,
    home_possession: flattenStats(homeStats.stats).possession,
    home_yellowCards: flattenStats(homeStats.stats).yellowCards,
    home_redCards: flattenStats(homeStats.stats).redCards,
    home_goalkeeperSaves: flattenStats(homeStats.stats).goalkeeperSaves,
    home_totalPasses: flattenStats(homeStats.stats).totalPasses,
    home_accuratePasses: flattenStats(homeStats.stats).accuratePasses,
    home_passPercentage: flattenStats(homeStats.stats).passPercentage,
    home_expectedGoals: flattenStats(homeStats.stats).expectedGoals,
    home_goalsPrevented: flattenStats(homeStats.stats).goalsPrevented,
    away_shotsOnGoal: flattenStats(awayStats.stats).shotsOnGoal,
    away_shotsOffGoal: flattenStats(awayStats.stats).shotsOffGoal,
    away_totalShots: flattenStats(awayStats.stats).totalShots,
    away_blockedShots: flattenStats(awayStats.stats).blockedShots,
    away_shotsInsideBox: flattenStats(awayStats.stats).shotsInsideBox,
    away_shotsOutsideBox: flattenStats(awayStats.stats).shotsOutsideBox,
    away_fouls: flattenStats(awayStats.stats).fouls,
    away_cornerKicks: flattenStats(awayStats.stats).cornerKicks,
    away_offsides: flattenStats(awayStats.stats).offsides,
    away_possession: flattenStats(awayStats.stats).possession,
    away_yellowCards: flattenStats(awayStats.stats).yellowCards,
    away_redCards: flattenStats(awayStats.stats).redCards,
    away_goalkeeperSaves: flattenStats(awayStats.stats).goalkeeperSaves,
    away_totalPasses: flattenStats(awayStats.stats).totalPasses,
    away_accuratePasses: flattenStats(awayStats.stats).accuratePasses,
    away_passPercentage: flattenStats(awayStats.stats).passPercentage,
    away_expectedGoals: flattenStats(awayStats.stats).expectedGoals,
    away_goalsPrevented: flattenStats(awayStats.stats).goalsPrevented,
    resultado: result
  };
}

async function exportToCSV() {
  try {
    const matches = await fetchMatches();
    const flattenedMatches = matches.map(flattenMatch);

    const csvWriter = createCsvWriter({
      path: 'data/matches.csv',
      header: Object.keys(flattenedMatches[0]).map(key => ({ id: key, title: key }))
    });

    await csvWriter.writeRecords(flattenedMatches);
    console.log('Exported matches to data/matches.csv');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
  }
}

exportToCSV();
