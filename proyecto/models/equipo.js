const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  address: String,
  city: String,
  capacity: Number,
  image: String
});

const equipoSchema = new mongoose.Schema({
  teamId: { type: Number, required: true },
  name: { type: String, required: true },
  code: String,
  country: String,
  founded: Number,
  logo: String,
  venue: { type: venueSchema, required: true }
});

module.exports = mongoose.model('Equipo', equipoSchema, 'teams');
