/* eslint-disable camelcase */
const express = require('express');
const controllerUser = require('../controllers/user.controller');

const md_autenticacion = require('../middlewares/authentication');

// poder usar la rutas.
const api = express.Router();

api.get('/viewUsers', controllerUser.viewUser);
api.post('/signUp', controllerUser.userRegistration);
api.post('/login', controllerUser.loginUser);
api.put('/updateUser/:idUser', [md_autenticacion.Auth], controllerUser.updateUser);
api.put('/followMe/:idUser', [md_autenticacion.Auth], controllerUser.followers);
api.delete('/deleteUser/:idUser', [md_autenticacion.Auth], controllerUser.deleteUser);

module.exports = api;
