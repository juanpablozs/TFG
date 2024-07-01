const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

function getUserLinks(userId) {
  return [
    { rel: 'self', method: 'GET', href: `/usuarios/${userId}` },
    { rel: 'update', method: 'PUT', href: `/usuarios/${userId}` },
    { rel: 'delete', method: 'DELETE', href: `/usuarios/${userId}` },
  ];
}

router.post('/registro', async (req, res) => {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const result = await db.collection('usuarios').insertOne(req.body);
    const user = result.ops[0];
    user.links = getUserLinks(user._id);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el usuario' });
  } finally {
    await client.close();
  }
});

router.post('/login', async (req, res) => {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('usuarios').findOne({ email: req.body.email, password: req.body.password });
    if (user) {
      user.links = getUserLinks(user._id);
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión del usuario' });
  } finally {
    await client.close();
  }
});

module.exports = router;
