const express = require('express');
const controllerUser = require('../controllers/user.controller');
const controllerAuth = require('../controllers/Auth.controller');
const jwt = require('../services/jwt.js');

const md_autenticacion = require('../middlewares/authentication');
const passport = require('passport');
require('./../middlewares/google.js');
// poder usar la rutas.
const api = express.Router();

// metodos Get
api.get('/viewUsers', controllerUser.viewUser);// ruta actualizada 🆗
api.get('/userFindId', [md_autenticacion.Auth], controllerUser.userFindId);

// metodos Post
api.post('/signUp', controllerAuth.userRegistration); // ruta actualizada 🆗
api.post('/login', controllerAuth.loginUser); // ruta actualizada 🆗

api.get('/google', passport.authenticate('auth-google', {scope: ['profile','email'],
}));

api.get('/google/callback', passport.authenticate('auth-google', {failureRedirect:'/'}), (req, res) => {
	console.log('estamos en call backs');
	const result = controllerAuth.getUserByEmail(req.user.emails[0].value);
	console.log(result);

	const token = jwt.crearToken(result);

	console.log(result);
	res.redirect(
		`memcaps://app/login?firstName=${req.user.name.givenName}/lastName=${req.user.name.familyName}/email=${req.user.emails[0].value}/token=${token}`);
});

api.get('/hola12', (req, res) => {
	console.log(req.user);
	if (req.isAuthenticated()) {
		res.send(`<h1>you are logged in </h1> <span>${JSON.stringify(req.user, null,2)} </span>`);
	} else {
		res.redirect('/');
	}
});

// metodos Put
api.put('/updateUser/:idUser', [md_autenticacion.Auth], controllerUser.updateUser); // ruta actualizada 🆗

// metodos Delete
api.delete('/deleteUser/:idUser', [md_autenticacion.Auth], controllerUser.deleteUser); // ruta actualizada 🆗

module.exports = api;
