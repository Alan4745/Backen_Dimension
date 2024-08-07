const jwt_simple = require('jwt-simple');
const moment = require('moment');

const claveSecreta = 'clave_secreta_DIMENSIO';

exports.crearToken = function (user) {
	const payload = {
		sub: user._id,
		nickName: user.nickName,
		email: user.email,
		rol: user.rol,
		iat: moment().unix(),
		exp: moment().day(7, 'days').unix(),
	};

	return jwt_simple.encode(payload, claveSecreta);
};