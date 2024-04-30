const User = require('../models/user.model');

// function updateUser(req, res) {
// 	const { idUser } = req.params.idUser;
// 	const parameters = req.body;

// 	// Eliminadadon la entrada de de los siguientes parametros
// 	delete parameters.password;
// 	delete parameters.rol;
// 	delete parameters.email;

// 	// verificamos que si el usuario le pertenece el perfil
// 	if (req.user.sub !== idUser) {
// 		return res.status(500).send({ mensaje: 'No tiene los permisos para editar este Usuario.' });
// 	}

// 	User.findByIdAndUpdate(idUser, parameters, { new: true }, (err, userUpdate) => {
// 		if (err) return res.status(500).send({ message: 'Erro en la pericion' });
// 		if (!userUpdate) return res.status(500).send({ message: 'error Al Editar el usuario' });

// 		return res.status(200).send({ UserInfo: userUpdate });
// 	});
// }

async function updateUser(req, res) {
	try {
		const { idUser } = req.params;
		const parameters = req.body;

		// Eliminando la entrada de los siguientes parámetros
		delete parameters.password;
		delete parameters.rol;
		delete parameters.email;

		// Verificamos si el usuario le pertenece al perfil
		if (req.user.sub !== idUser) {
			return res
				.status(403)
				.send({ mensaje: 'No tiene los permisos para editar este usuario.' });
		}

		// Actualizar el usuario y obtener el resultado actualizado
		const userUpdate = await User.findByIdAndUpdate(idUser, parameters, {
			new: true,
		});

		// Verificar si la actualización fue exitosa
		if (!userUpdate) {
			return res.status(500).send({ message: 'Error al editar el usuario.' });
		}

		// Enviar la información actualizada del usuario
		return res.status(200).send({ message: userUpdate });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}

async function deleteUser(req, res) {
	try {
		const { idUser } = req.params;

		// Verificar si el usuario tiene los permisos para eliminar este usuario
		if (req.user.sub !== idUser) {
			return res
				.status(403)
				.send({ mensaje: 'No tiene los permisos para eliminar este usuario.' });
		}

		// Eliminar el usuario y obtener el resultado eliminado
		const userDelete = await User.findByIdAndDelete(idUser);

		// Verificar si la eliminación fue exitosa
		if (!userDelete) {
			return res.status(500).send({ message: 'Error al eliminar el usuario.' });
		}

		// Enviar la información del usuario eliminado
		return res.status(200).send({ message: userDelete });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}

async function viewUser(req, res) {
	try {
		const usersView = await User.find().exec();
		res.status(200).send({ UserInfo: usersView });
	} catch (error) {
		console.error('Error al buscar usuarios:', error);
		res.status(500).send({ error: 'Hubo un error al buscar usuarios' });
	}
}

async function userFindId(req, res) {
	try {
		let findUser = await User.findOne({ _id: req.user.sub});
		res.status(200).send({ message: findUser });

	} catch (error) {
		console.error('Error al buscar usuarios:', error);
		res.status(500).send({ error: 'Hubo un error al buscar usuarios' });
	}
}

module.exports = {
	updateUser,
	deleteUser,
	viewUser,
	userFindId,
};
