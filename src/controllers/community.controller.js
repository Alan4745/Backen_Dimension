const community = require('../models/community.model');
const user = require('../models/user.model');
const { UploadImg } = require('../utils/cloudinary');
const fs = require('fs-extra');

async function registerCommunity(req, res) {
	const communityModels = new community();
	const parameters = req.body;

	try {
		const communityName = await community.find({ nameCommunity: parameters.nameCommunity });
		if (communityName.length > 0) {
			return res.status(500).send({ message: 'este nombre de la comunidad ya esta en uso' });
		}

		if (req.files?.imagePer) {
			// Subir la imagen a Cloudinary y obtener el resultado
			const result = await UploadImg(req.files.imagePer.tempFilePath);
			// Guardar la información de la imagen en el modelo de usuario
			communityModels.config.imagePer.secure_url = result.secure_url;
			communityModels.config.imagePer.public_id = result.public_id;

			// Verificar si el archivo temporal existe antes de intentar eliminarlo
			if (fs.existsSync(req.files.imagePer.tempFilePath)) {
				await fs.unlink(req.files.imagePer.tempFilePath);
			} else {
				console.warn('El archivo temporal no existe.');
			}
		}

		if (req.files?.bannerUrl) {
			// Subir la imagen a Cloudinary y obtener el resultado
			const result = await UploadImg(req.files.bannerUrl.tempFilePath);
			// Guardar la información de la imagen en el modelo de usuario
			communityModels.config.bannerUrl.secure_url = result.secure_url;
			communityModels.config.bannerUrl.public_id = result.public_id;

			// Verificar si el archivo temporal existe antes de intentar eliminarlo
			if (fs.existsSync(req.files.bannerUrl.tempFilePath)) {
				await fs.unlink(req.files.bannerUrl.tempFilePath);
			} else {
				console.warn('El archivo temporal no existe.');
			}
		}


		// const bannerUrl = await UploadImg(parameters.bannerUrl);
		// console.log(bannerUrl);

		communityModels.nameCommunity = parameters.nameCommunity;
		communityModels.desc = parameters.desc;
		communityModels.followers = [];
		communityModels.followings = [];
		communityModels.category = JSON.parse(parameters.categorias);
		communityModels.idOwner = req.user.sub;
		communityModels.nameOwner = req.user.nickName;
		communityModels.administrators = [];


		const savedCommunity = await communityModels.save();
		if (!savedCommunity) {
			return res.status(500).send({ message: 'err al guardar en la comunidad' });
		}

		return res.status(200).send({ message: savedCommunity });
	} catch (error) {
		return res.status(500).send({ message: 'err en la peticion' });
	}
}

function editarCommunida(req, res) {
	const { idCommuunity } = req.params;
	const parameters = req.body;

	delete parameters.followers;
	delete parameters.category;
	delete parameters.administrators;
	delete parameters.idUsuario;

	community.findOne({ _id: idCommuunity }, (err, communityById) => {
		if (err) {
			return res.status(500).send({ err: 'error en la petecion' });
		}
		if (!communityById) {
			return res.status(500).send({ err: 'error en la petecion' });
		}
		// verificamos que si el usuario le pertenece el perfil
		if (req.user.sub !== communityById.idUsuario) {
			return res.status(500).send({
				mensaje: 'No tiene los permisos para editar este Tu comunidad.',
			});
		}

		community.findByIdAndUpdate(
			{ _id: idCommuunity },
			parameters,
			{ new: true },
			(err, communityUpdate) => {
				if (err) {
					return res.status(500).send({ err: 'error en la peticion' });
				}
				if (!communityUpdate) {
					return res
						.status(500)
						.send({ err: 'erro al actualizar la comunidad' });
				}

				return res.status(200).send({ mensaje: communityUpdate });
			}
		);
		// return res.status(200).send({ mensaje: communityById });
	});
}

function editarCategoryCommunidad(req, res) {
	const { idCommuunity } = req.params;
	const parameters = req.body;
	community.findByIdAndUpdate(
		{ _id: idCommuunity },
		{ $push: { category: parameters.category } },
		{ new: true },
		(err, communityCategory) => {
			if (err) {
				return res.status(500).send({ err: 'error en la peticion' });
			}
			if (!communityCategory) {
				return res.status(500).send({ err: 'error al actualizar la category' });
			}
			return res.status(200).send({ mensaje: communityCategory });
		}
	);
}

function deleteCategory(req, res) {
	const { idCommuunity } = req.params;
	const parameters = req.body;
	community.findByIdAndUpdate(
		{ _id: idCommuunity },
		{ $pull: { category: parameters.category } },
		{ new: true },
		(err, communityCategory) => {
			if (err) {
				return res.status(500).send({ err: 'error en la peticion' });
			}
			if (!communityCategory) {
				return res.status(500).send({ err: 'error al actualizar la category' });
			}
			return res.status(200).send({ mensaje: communityCategory });
		}
	);
}

function deleteCommunity(req, res) {
	const { idCommuunity } = req.params;

	community.findOne({ _id: idCommuunity }, (err, communityById) => {
		if (err) {
			return res.status(500).send({ err: 'error en la petecion' });
		}
		if (!communityById) {
			return res.status(500).send({ err: 'error en la petecion' });
		}
		// verificamos que si el usuario le pertenece el perfil
		if (req.user.sub !== communityById.idUsuario) {
			return res
				.status(500)
				.send({ mensaje: 'Solo el Dueño puede eliminar la comunidad' });
		}

		community.findByIdAndDelete(
			{ _id: idCommuunity },
			(err, communityDelete) => {
				if (err) {
					return res.status(500).send({ err: 'error en la peticion' });
				}
				if (!communityDelete) {
					return res
						.status(500)
						.send({ err: 'error al eliminar la comunidad' });
				}

				return res.status(200).send({ mensaje: communityDelete });
			}
		);
	});
}

async function viewCommunityId(req, res) {
	try {
		const { idCommunity } = req.params;

		// Buscar la comunidad por su identificador
		const communityFindId = await community.findOne({ _id: idCommunity });

		// Verificar si la búsqueda fue exitosa
		if (!communityFindId) {
			return res.status(404).send({ message: 'Comunidad no encontrada.' });
		}

		// Enviar la información de la comunidad encontrada
		return res.status(200).send({ message: communityFindId });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}

function followersCommunity(req, res) {
	const { idCommuunity } = req.params;
	community.findOne({ _id: idCommuunity }, (err, communityOne) => {
		const userInclud = communityOne.followers.includes(req.user.sub);
		if (userInclud) {
			community.findByIdAndUpdate(
				{ _id: idCommuunity },
				{ $pull: { followers: req.user.sub } },
				{ new: true },
				(err, communityFollowers) => {
					if (err) {
						return res.status(500).send({ err: 'error en la peticion' });
					}
					if (!communityFollowers) {
						return res.status(500).send({ err: 'error en communityFollowers' });
					}
					return res.status(200).send({ mensaje: communityFollowers });
				}
			);
		} else {
			community.findByIdAndUpdate(
				{ _id: idCommuunity },
				{ $push: { followers: req.user.sub } },
				{ new: true },
				(err, communityUnFollowers) => {
					if (err) {
						return res.status(500).send({ err: 'error en la peticion' });
					}
					if (!communityUnFollowers) {
						return res.status(500).send({ err: 'error en communityFollowers' });
					}
					return res.status(200).send({ mensaje: communityUnFollowers });
				}
			);
		}
	});
}

function addAdmin(req, res) {
	const { idCommuunity } = req.params;
	const parameters = req.body;

	community.findOne({ _id: idCommuunity }, (err, communityOne) => {
		const userInclud = communityOne.administrators.includes(parameters.idUser);
		if (userInclud) {
			return res.status(500).send({ err: 'el usuario ya esta como admin' });
		}
		community.findByIdAndUpdate(
			{ _id: idCommuunity },
			{ $push: { administrators: parameters.idUser } },
			{ new: true },
			(err, communityUpdateAdmin) => {
				if (err) {
					return res
						.status(500)
						.send({ err: 'error en la peticion de comunidad administrador' });
				}
				if (!communityUpdateAdmin) {
					return res
						.status(500)
						.send({ err: 'no se pudo en la peticion comunidad administrador' });
				}
				return res.status(200).send({ mensaje: communityUpdateAdmin });
			}
		);
	});
}

function deleteAdmin(req, res) {
	const { idCommuunity } = req.params;
	const parameters = req.body;
	community.findOne({ _id: idCommuunity }, (err, communityOne) => {
		const userInclud = communityOne.administrators.includes(parameters.idUser);
		if (userInclud) {
			community.findByIdAndUpdate(
				{ _id: idCommuunity },
				{ $pull: { administrators: parameters.idUser } },
				{ new: true },
				(err, communityUpdateAdmin1) => {
					if (err) {
						return res
							.status(500)
							.send({ err: 'error en la peticion de comunidad administrador' });
					}
					if (!communityUpdateAdmin1) {
						return res.status(500).send({
							err: 'no se pudo en la peticion comunidad administrador',
						});
					}
					return res.status(200).send({ mensaje: communityUpdateAdmin1 });
				}
			);
		} else {
			return res
				.status(200)
				.send({ mesaje: 'Este usuario no tiene rol de admin' });
		}
	});
}

// Metodo actualizado🆗
async function followersView(req, res) {
	try {
		const { idCommunity } = req.params;

		// Buscar la comunidad por su identificador
		const communityUser = await community.findOne({ _id: idCommunity });
		// Verificar si la búsqueda de la comunidad fue exitosa
		if (!communityUser) {
			return res.status(404).send({ message: 'Comunidad no encontrada.' });
		}
		// Encontrar los usuarios que son seguidores de la comunidad
		const userFollowers = await user.find({
			_id: { $in: communityUser.followers },
		});
		console.log(communityUser.followers);
		// Enviar la lista de seguidores de la comunidad
		return res.status(200).send({ mensaje: userFollowers });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}
// Metodo actualizado 🆗
async function youCommunity(req, res) {
	try {
		// Buscar las comunidades propiedad del usuario actual
		const youCommunityFind = await community.find({ idOwner: req.user.sub });

		// Enviar la lista de comunidades encontradas
		return res.status(200).send({ message: youCommunityFind });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}

// Metodo actualizado 🆗
async function obtenercomunidades(req, res) {
	try {
		// Buscar todas las comunidades
		const Comunidades = await community.find();

		// Enviar la lista de comunidades encontradas
		return res.status(200).send({ message: Comunidades });
	} catch (error) {
		console.error('An error occurred:', error);
		return res.status(500).send({ message: 'Internal server error.' });
	}
}


const obtenerTendenciasComunidades = async (req, res) => {
	try {
		console.log('estamoa aca');
		// Obtener las comunidades tendencia
		const tendencias = await community.find().sort({ followers: -1 }).limit(10);

		// Verificar si se encontraron comunidades tendencia
		if (tendencias.length === 0) {
			return res.status(404).json({ message: 'No se encontraron comunidades tendencia' });
		}
  
		// Devolver las comunidades tendencia
		res.status(200).send({ message: tendencias });
	} catch (error) {
		console.error('Error al obtener las tendencias de las comunidades:', error);
		res.status(500).json({ message: 'Error del servidor al obtener las tendencias de las comunidades' });
	}
};
  
const recomendarComunidadesPorCategorias = async (req, res) => {
	try {
	// Obtener el ID del usuario actual (suponiendo que está autenticado)
		const userId = req.user.sub;
  
		// Obtener los gustos o categorías del usuario
		const usuario = await user.findById(userId);
		const categoriasUsuario = usuario.gustos;
  
		// Buscar comunidades que coincidan con al menos una de las categorías del usuario
		const comunidadesRecomendadas = await community.find({ category: { $in: categoriasUsuario } }).limit(10);
	
		// Verificar si se encontraron comunidades recomendadas
		if (comunidadesRecomendadas.length === 0) {
			return res.status(404).json({ message: 'No se encontraron comunidades recomendadas para estas categorías' });
		}
  
		// Devolver las comunidades recomendadas
		res.status(200).send({ message: comunidadesRecomendadas });
	} catch (error) {
		console.error('Error al recomendar comunidades por categorías:', error);
		res.status(500).json({ message: 'Error del servidor al recomendar comunidades por categorías' });
	}
};

const obtenerComunidadesSinCategoria = async (req, res) => {
	try {
	// Buscar comunidades que tengan la categoría igual a "sin categoría"
		const comunidadesSinCategoria = await community.find({ category: 'sin categoria'}).limit(10);
	
		// Verificar si se encontraron comunidades sin categoría
		if (comunidadesSinCategoria.length === 0) {
			return res.status(404).json({ message: 'No se encontraron comunidades sin categoría' });
		}
  
		// Devolver las comunidades sin categoría
		res.status(200).send({ message: comunidadesSinCategoria });
	} catch (error) {
		console.error('Error al obtener comunidades sin categoría:', error);
		res.status(500).json({ message: 'Error del servidor al obtener comunidades sin categoría' });
	}
};



module.exports = {
	registerCommunity,
	editarCommunida,
	editarCategoryCommunidad,
	deleteCommunity,
	viewCommunityId,
	followersCommunity,
	addAdmin,
	followersView,
	deleteAdmin,
	deleteCategory,
	youCommunity,
	obtenercomunidades,
	obtenerTendenciasComunidades,
	recomendarComunidadesPorCategorias,
	obtenerComunidadesSinCategoria
};
