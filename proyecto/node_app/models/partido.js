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
  id: { type: Number, required: true },
  name: { type: String, required: true },
  logo: String,
  winner: { type: Boolean, required: true },
});

const partidoSchema = new mongoose.Schema({
  matchId: { type: Number, required: true },
  date: Date,
  teams: {
    home: { type: teamSchema, required: true },
    away: { type: teamSchema, required: true }
  },
  goals: {
    home: { type: Number, required: true },
    away: { type: Number, required: true }
  },
  statistics: [{
    team: teamSchema,
    stats: statsSchema
  }]
});

module.exports = mongoose.model('Partido', partidoSchema, 'matches');
