const express = require('express');
const router = express.Router();
const Jugador = require('../models/jugador');
const Equipo = require('../models/equipo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const createLinks = (req, id) => {
  return [
    { rel: 'self', method: 'GET', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'update', method: 'PUT', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` },
    { rel: 'delete', method: 'DELETE', href: `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}` }
  ];
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, name, teamName, position } = req.query;

    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (teamName) {
      query.teamName = { $regex: teamName, $options: 'i' };
    }
    if (position) {
      query.position = { $regex: position, $options: 'i' };
    }

    const jugadores = await Jugador.find(query)
      .select('-injured')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Jugador.countDocuments(query);

    const jugadoresWithLinks = jugadores.map(jugador => {
      const jugadorObject = jugador.toObject();
      jugadorObject.links = createLinks(req, jugador._id);
      return jugadorObject;
    });

    res.json({
      jugadores: jugadoresWithLinks,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores' });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { playerId, teamId, name, position, age } = req.body;

  if (!playerId || !teamId || !name || !position || !age) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const existingPlayer = await Jugador.findOne({ playerId });
    if (existingPlayer) {
      return res.status(400).json({ message: 'El jugador con este ID ya existe' });
    }

    const equipo = await Equipo.findOne({ teamId });
    if (!equipo) {
      return res.status(400).json({ message: 'El equipo con este ID no existe' });
    }

    const jugador = new Jugador({
      playerId,
      name,
      position,
      age,
      teamId,
      teamName: equipo.name,
      ...req.body
    });

    const newJugador = await jugador.save();
    const jugadorObject = newJugador.toObject();
    jugadorObject.links = createLinks(req, newJugador._id);
    res.status(201).json(jugadorObject);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el jugador' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id).select('-injured');
    if (!jugador) return res.status(404).json({ message: 'Jugador no encontrado' });
    const jugadorObject = jugador.toObject();
    jugadorObject.links = createLinks(req, jugador._id);
    res.json(jugadorObject);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el jugador' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const updatedJugador = await Jugador.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-injured');
    if (!updatedJugador) return res.status(404).json({ message: 'Jugador no encontrado' });
    const jugadorObject = updatedJugador.toObject();
    jugadorObject.links = createLinks(req, updatedJugador._id);
    res.json(jugadorObject);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el jugador' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const deletedJugador = await Jugador.findByIdAndDelete(req.params.id).select('-injured');
    if (!deletedJugador) return res.status(404).json({ message: 'Jugador no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el jugador' });
  }
});

module.exports = router;
