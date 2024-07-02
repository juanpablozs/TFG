const express = require('express');
const router = express.Router();
const Partido = require('../models/partido');
const authenticateToken = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, team, date } = req.query;

    const query = {};
    if (team) {
      query['$or'] = [
        { 'teams.home.name': team },
        { 'teams.away.name': team }
      ];
    }
    if (date) {
      query.date = { $gte: new Date(date) };
    }

    const partidos = await Partido.find(query)
      .select('matchId date teams goals statistics')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Partido.countDocuments(query);

    res.json({
      partidos,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', authenticateToken, async (req, res) => {
  const partido = new Partido(req.body);
  try {
    const newPartido = await partido.save();
    res.status(201).json(newPartido);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const partido = await Partido.findById(req.params.id).select('matchId date teams goals statistics');
    if (!partido) return res.status(404).json({ message: 'Partido no encontrado' });
    res.json(partido);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedPartido = await Partido.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('matchId date teams goals statistics');
    if (!updatedPartido) return res.status(404).json({ message: 'Partido no encontrado' });
    res.json(updatedPartido);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedPartido = await Partido.findByIdAndDelete(req.params.id).select('matchId date teams goals statistics');
    if (!deletedPartido) return res.status(404).json({ message: 'Partido no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
