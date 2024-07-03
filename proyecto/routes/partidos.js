const express = require('express');
const router = express.Router();
const Partido = require('../models/partido');
const authenticateToken = require('../middleware/auth');

const createLinks = (req, id) => {
  return [
    { rel: 'self', method: 'GET', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'update', method: 'PUT', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'delete', method: 'DELETE', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'statistics', method: 'GET', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}/estadisticas` }
  ];
};

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

    const partidosWithLinks = partidos.map(partido => {
      const partidoObject = partido.toObject();
      partidoObject.links = createLinks(req, partido._id);
      return partidoObject;
    });

    res.json({
      partidos: partidosWithLinks,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { matchId, date, teams, goals, statistics } = req.body;

  if (!matchId || !teams || !teams.home || !teams.away || !goals || goals.home === undefined || goals.away === undefined) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  const existingPartido = await Partido.findOne({ matchId });
  if (existingPartido) {
    return res.status(400).json({ message: 'El partido con este ID ya existe' });
  }

  const partido = new Partido({
    matchId,
    date,
    teams,
    goals,
    statistics
  });

  try {
    const newPartido = await partido.save();
    const partidoObject = newPartido.toObject();
    partidoObject.links = createLinks(req, newPartido._id);
    res.status(201).json(partidoObject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const partido = await Partido.findById(req.params.id).select('matchId date teams goals statistics');
    if (!partido) return res.status(404).json({ message: 'Partido no encontrado' });
    const partidoObject = partido.toObject();
    partidoObject.links = createLinks(req, partido._id);
    res.json(partidoObject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedPartido = await Partido.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('matchId date teams goals statistics');
    if (!updatedPartido) return res.status(404).json({ message: 'Partido no encontrado' });
    const partidoObject = updatedPartido.toObject();
    partidoObject.links = createLinks(req, updatedPartido._id);
    res.json(partidoObject);
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

router.get('/:id/estadisticas', async (req, res) => {
  try {
    const partido = await Partido.findById(req.params.id).select('statistics');
    if (!partido) return res.status(404).json({ message: 'Partido no encontrado' });
    res.json({
      id: partido._id,
      estadisticas: partido.statistics,
      links: createLinks(req, partido._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
