const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usuariosRouter = require('./routes/usuarios');
const partidosRouter = require('./routes/partidos');
const prediccionesRouter = require('./routes/predicciones');
const equiposRouter = require('./routes/equipos');
const jugadoresRouter = require('./routes/jugadores');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/usuarios', usuariosRouter);
app.use('/partidos', partidosRouter);
app.use('/predicciones', prediccionesRouter);
app.use('/equipos', equiposRouter);
app.use('/jugadores', jugadoresRouter);

module.exports = app;
