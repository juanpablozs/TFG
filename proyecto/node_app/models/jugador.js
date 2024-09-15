const mongoose = require('mongoose');

const jugadorSchema = new mongoose.Schema({
  playerId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  firstname: String,
  lastname: String,
  age: { type: Number, required: true },
  birth: {
    date: String,
    place: String,
    country: String
  },
  nationality: String,
  height: String,
  weight: String,
  photo: String,
  teamId: { type: Number, required: true },
  teamName: { type: String, required: true },
  position: { type: String, required: true }
});

module.exports = mongoose.model('Jugador', jugadorSchema, 'players');
