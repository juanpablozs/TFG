const express = require('express');
const router = express.Router();
const Equipo = require('../models/equipo');
const Jugador = require('../models/jugador');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const createLinks = (req, id) => {
  return [
    { rel: 'self', method: 'GET', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'update', method: 'PUT', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'delete', method: 'DELETE', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'players', method: 'GET', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}/jugadores` }
  ];
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, name, code, city } = req.query;

    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (code) {
      query.code = { $regex: code, $options: 'i' };
    }
    if (city) {
      query['venue.city'] = { $regex: city, $options: 'i' };
    }

    const equipos = await Equipo.find(query)
      .select('-national -venue.surface')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Equipo.countDocuments(query);

    const equiposWithLinks = equipos.map(equipo => {
      const equipoObject = equipo.toObject();
      equipoObject.links = createLinks(req, equipo._id);
      return equipoObject;
    });

    res.json({
      equipos: equiposWithLinks,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { teamId, name, venue } = req.body;

  if (!teamId || !name || !venue || !venue.name) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  const existingEquipo = await Equipo.findOne({ teamId });
  if (existingEquipo) {
    return res.status(400).json({ message: 'El equipo con este ID ya existe' });
  }

  const equipo = new Equipo(req.body);

  try {
    const newEquipo = await equipo.save();
    const equipoObject = newEquipo.toObject();
    equipoObject.links = createLinks(req, newEquipo._id);
    res.status(201).json(equipoObject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const equipo = await Equipo.findById(req.params.id).select('-national -venue.surface');
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });
    const equipoObject = equipo.toObject();
    equipoObject.links = createLinks(req, equipo._id);
    res.json(equipoObject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const updatedEquipo = await Equipo.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-national -venue.surface');
    if (!updatedEquipo) return res.status(404).json({ message: 'Equipo no encontrado' });
    const equipoObject = updatedEquipo.toObject();
    equipoObject.links = createLinks(req, updatedEquipo._id);
    res.json(equipoObject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const deletedEquipo = await Equipo.findByIdAndDelete(req.params.id).select('-national -venue.surface');
    if (!deletedEquipo) return res.status(404).json({ message: 'Equipo no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/jugadores', async (req, res) => {
  try {
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    const jugadores = await Jugador.find({ teamId: equipo.teamId }).select('-injured');
    const jugadoresWithLinks = jugadores.map(jugador => {
      const jugadorObject = jugador.toObject();
      jugadorObject.links = [
        { rel: 'self', method: 'GET', href: `${req.protocol}://${req.get('host')}/jugadores/${jugador._id}` },
        { rel: 'update', method: 'PUT', href: `${req.protocol}://${req.get('host')}/jugadores/${jugador._id}` },
        { rel: 'delete', method: 'DELETE', href: `${req.protocol}://${req.get('host')}/jugadores/${jugador._id}` }
      ];
      return jugadorObject;
    });

    res.json(jugadoresWithLinks);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores del equipo' });
  }
});

module.exports = router;
