const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  shotsOnGoal: Number,
  shotsOffGoal: Number,
  totalShots: Number,
  blockedShots: Number,
  shotsInsideBox: Number,
  shotsOutsideBox: Number,
  fouls: Number,
  cornerKicks: Number,
  offsides: Number,
  possession: String,
  yellowCards: Number,
  redCards: Number,
  goalkeeperSaves: Number,
  totalPasses: Number,
  accuratePasses: Number,
  passPercentage: String,
  expectedGoals: String
});

const teamSchema = new mongoose.Schema({
  id: Number,
  name: String,
  logo: String,
  winner: Boolean,
});

const partidoSchema = new mongoose.Schema({
  matchId: Number,
  date: Date,
  teams: {
    home: teamSchema,
    away: teamSchema
  },
  goals: {
    home: Number,
    away: Number
  },
  statistics: [{
    team: teamSchema,
    stats: statsSchema
  }]
});

module.exports = mongoose.model('Partido', partidoSchema, 'matches');
