const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const mongoUri = process.env.MONGO_URI;

const { authenticateToken } = require('../middleware/auth');

const generateLinks = (resource, id) => {
  return [
    { rel: 'self', href: `${resource}/${id}`, method: 'GET' },
    { rel: 'update', href: `${resource}/${id}`, method: 'PUT' },
    { rel: 'delete', href: `${resource}/${id}`, method: 'DELETE' }
  ];
};

router.post('/registro', async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('usuarios').insertOne({ username, email, password: hashedPassword, role });

    const user = await db.collection('usuarios').findOne({ _id: result.insertedId });
    user.links = generateLinks('/usuarios', user._id);

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  } finally {
    await client.close();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('usuarios').findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión del usuario' });
  } finally {
    await client.close();
  }
});

router.post('/recuperar', async (req, res) => {
  const { email } = req.body;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('usuarios').findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = Date.now() + 3600000;

    await db.collection('usuarios').updateOne({ email }, { $set: { resetToken: token, resetTokenExpiration: tokenExpiration } });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Para restablecer su contraseña, haga clic en el siguiente enlace: ${process.env.BASE_URL}/usuarios/reset/${token}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo de recuperación' });
      } else {
        console.log('Correo enviado:', info.response);
        res.json({ message: 'Correo de recuperación enviado' });
      }
    });
  } catch (error) {
    console.error('Error en la ruta de recuperación:', error);
    res.status(500).json({ message: 'Error al enviar el correo de recuperación' });
  } finally {
    await client.close();
  }
});

router.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('usuarios').findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('usuarios').updateOne({ _id: user._id }, { $set: { password: hashedPassword, resetToken: null, resetTokenExpiration: null } });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  } finally {
    await client.close();
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = new MongoClient(mongoUri);

  if (req.user.id !== id) {
    return res.status(403).json({ message: 'No tienes permiso para ver este usuario' });
  }

  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) }, { projection: { email: 1, username: 1 } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el usuario' });
  } finally {
    await client.close();
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  const client = new MongoClient(mongoUri);

  if (req.user.id !== id) {
    return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  try {
    await client.connect();
    const db = client.db();

    const updatedUser = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updatedUser.matchedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });
    res.json({ message: 'Usuario actualizado correctamente', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  } finally {
    await client.close();
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = new MongoClient(mongoUri);

  if (req.user.id !== id) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar este usuario' });
  }

  try {
    await client.connect();
    const db = client.db();

    const deletedUser = await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });

    if (deletedUser.deletedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  } finally {
    await client.close();
  }
});

module.exports = router;
