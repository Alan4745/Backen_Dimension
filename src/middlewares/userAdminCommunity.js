const community = require('../models/community.model');
// const ConversationModel = require('../models/Conversation.model');

exports.AdminComunity = function (req, res, next) {
	community.findOne({ _id: req.params.idCommunity }, (err, community1) => {
		console.log(req.params.idCommunity);
		if (!community1) {
			return res.status(500).send({ message: 'no se encontro la comunidad' });
		}
		const userOwner = community1.idOwner === req.user.sub;
		// console.log(userOwner);
		const userInclud = community1.administrators.includes(req.user.sub);
		// console.log(!userOwner && !userInclud);
		if (!userOwner && !userInclud) { return res.status(403).send({ mensaje: 'Solo puede acceder el ADMIN' }); }
		next();
	});
};

exports.ownerCommunity = function (req, res, next) {
	community.findOne({ _id: req.params.idCommunity }, (err, community1) => {
		if (!community1) {
			return res.status(500).send({err: 'no se a encontrado la comunidad'});
		}
		const userOwner = community1.idOwner === req.user.sub;
		if (!userOwner) { return res.status(403).send({ mensaje: 'Solo puede acceder el Dueño' }); }
		next();
	});
};
