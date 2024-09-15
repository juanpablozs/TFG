const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const usuariosRouter = require('./routes/usuarios');
const partidosRouter = require('./routes/partidos');
const equiposRouter = require('./routes/equipos');
const jugadoresRouter = require('./routes/jugadores');
const prediccionesRouter = require('./routes/predicciones');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/usuarios', usuariosRouter);
app.use('/partidos', partidosRouter);
app.use('/equipos', equiposRouter);
app.use('/jugadores', jugadoresRouter);
app.use('/predicciones', prediccionesRouter);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Conectado a la base de datos'));

module.exports = app;