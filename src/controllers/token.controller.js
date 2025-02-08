/* eslint-disable no-unused-vars */
const crypto = require("crypto");
const TokenCollection = require("../models/tokens/tokenCollection.model");
const Collections = require("../models/tokens/collections.model");
const Token = require("../models/tokens/tokenUnitary.model");
const fs = require("fs-extra");
const User = require("../models/user.model");
const io = require("./../../Server");

const { UploadImg } = require("../utils/cloudinary");
const { default: mongoose } = require("mongoose");
const PotentialUsers = require("../models/potentialUsers/potentialUsers.model");

const PizzaCamperoDataModel = require("../models/DatapizzaCampero/pizzaCamperoData.model");

// function agregarTokenAColecion(req, res) {
//   const parameters = req.body;
//   const { tokenAmount } = parameters;

//   Community.find(
//     { nameCommunity: parameters.nameCommunity, idOwner: req.user.sub },
//     (err, test) => {
//       if (test.length === 0) {
//         return res.status(500).send({ message: 'esta comunidad no te pertenece' });
//       }

//       Collections.find(
//         { author: parameters.nameCommunity, nameCollection: parameters.nameCollection },
//         (err, collectionfind) => {
//           if (collectionfind.length === 0) {
//             return res.status(500).send({ message: 'error nose encontraron similitudes' });
//           }

//           TokenCollection.find(
//             { author: parameters.nameCommunity, idCollection: collectionfind[0]._id },
//             (err, tokenFind) => {
//               for (let i = 0; i < tokenAmount; i += 1) {
//                 const { min } = parameters;
//                 const { max } = parameters;
//                 const randomNumber = Math.floor(Math.random()
//                 * (parseInt(max) - parseInt(min) + 1)) + parseInt(min);
//                 const modeloToken = new TokenCollection();
//                 const randomBytes = crypto.randomBytes(32).toString('hex');
//                 const hash = crypto.createHash('sha256').update(parameters.name + randomBytes).digest('hex');

//                 modeloToken.hash = hash;
//                 modeloToken.title = parameters.title;
//                 modeloToken.desc = parameters.desc;
//                 modeloToken.numertoken = tokenFind.length + i + 1;
//                 // modeloToken.img.imgId = '';
//                 // modeloToken.img.imgUrl = '';
//                 modeloToken.idCollection = collectionfind[0]._id;
//                 modeloToken.author = parameters.nameCommunity;
//                 modeloToken.price = randomNumber;

//                 modeloToken.save((err, saveToken) => {
//                   if (err) {
//                     return res.status(500).send({ message: 'error en la peticion del token' });
//                   }
//                   if (!saveToken) {
//                     return res.status(500).send({ message: 'error la peticion de token esta vacias' });
//                   }
//                 });
//               }

//               return res.status(200).send({ message: `${tokenAmount} tokens created and saved successfully.` });
//             });
//     });
//     });
// }

async function addTokenToCollection(req, res) {
  try {
    const parameters = req.body;
    const { tokenAmount } = parameters;
    const tokens = [];
    let result = {};

    const community = await Community.findOne({
      nameCommunity: parameters.nameCommunity,
      nameOwner: req.user.nickName,
    });

    if (!community) {
      return res
        .status(500)
        .send({ message: "Esta comunidad no te pertenece" });
    }

    if (tokenAmount > 1000) {
      return res.status(500).send({ message: "Se supera el límite permitido" });
    }

    const collectionFind = await Collections.findOne({
      author: parameters.nameCommunity,
      nameCollection: parameters.nameCollection,
    });

    console.log(parameters.nameCollection, "nameCollection");
    console.log(parameters.nameCommunity, "nameCommunity");

    if (!collectionFind) {
      return res
        .status(500)
        .send({ message: "Error, no se encontraron similitudes" });
    }

    const tokenFind = await TokenCollection.find({
      author: parameters.nameCommunity,
      idCollection: collectionFind._id,
    });

    if (req.files?.image) {
      // Subir la imagen a Cloudinary y obtener el resultado
      result = await UploadImg(req.files.image.tempFilePath);
      // Guardar la información de la imagen en el modelo de usuario

      // Verificar si el archivo temporal existe antes de intentar eliminarlo
      if (fs.existsSync(req.files.image.tempFilePath)) {
        await fs.unlink(req.files.image.tempFilePath);
      } else {
        console.warn("El archivo temporal no existe.");
      }
    }

    for (let i = 0; i < tokenAmount; i++) {
      const modelToken = new TokenCollection();
      const randomBytes = crypto.randomBytes(32).toString("hex");
      const hash = crypto
        .createHash("sha256")
        .update(parameters.name + randomBytes)
        .digest("hex");

      modelToken.hash = hash;
      modelToken.title = parameters.title;
      modelToken.desc = parameters.desc;
      modelToken.numertoken = tokenFind.length + i + 1;
      modelToken.idCollection = collectionFind._id;
      modelToken.author = parameters.nameCommunity;
      modelToken.price = parameters.price * 100;

      modelToken.img.imgUrl = result.secure_url;
      modelToken.img.imgId = result.public_id;

      tokens.push(modelToken);
    }

    await TokenCollection.insertMany(tokens);
    return res.status(200).send({
      message: `${tokenAmount} tokens creados y guardados exitosamente.`,
    });
  } catch (error) {
    console.error("Error al agregar tokens a la colección:", error);
    return res
      .status(500)
      .send({ error: "Hubo un error al agregar tokens a la colección" });
  }
}

async function addTokenToCollectionNew(req, res) {
  try {
    const parameters = req.body;
    const {
      tokenAmount,
      colletionId,
      name,
      title,
      desc,
      price,
      category,
      subTitle,
    } = parameters;
    const tokens = [];
    let result = {};

    // Limitar la cantidad de tokens para evitar sobrecarga
    if (tokenAmount > 10000) {
      return res.status(500).send({ message: "Se supera el límite permitido" });
    }

    // Buscar la colección del usuario
    const collectionFind = await Collections.findOne({
      author: req.user.sub,
      _id: colletionId,
    });

    if (!collectionFind) {
      return res
        .status(500)
        .send({ message: "Error, no se encontró la colección." });
    }

    // Obtener el número actual de tokens en la colección
    const tokenCount = await TokenCollection.countDocuments({
      idCollection: colletionId,
    });

    // Procesar la imagen si está presente
    if (req.files?.image) {
      result = await UploadImg(req.files.image.tempFilePath);

      if (fs.existsSync(req.files.image.tempFilePath)) {
        fs.unlink(req.files.image.tempFilePath, (err) => {
          if (err) console.error("Error al eliminar archivo temporal:", err);
        });
      } else {
        console.warn("El archivo temporal no existe.");
      }
    }

    // Generar los tokens
    for (let i = 0; i < tokenAmount; i++) {
      const modelToken = new TokenCollection();
      const randomBytes = crypto.randomBytes(32).toString("hex");
      const hash = crypto
        .createHash("sha256")
        .update(name + randomBytes)
        .digest("hex");

      modelToken.hash = hash;
      modelToken.title = title;
      modelToken.subTitle = subTitle;
      modelToken.desc = desc;
      modelToken.author = req.user.sub;
      modelToken.price = price * 100;
      modelToken.idCollection = colletionId;
      modelToken.category = category;
      modelToken.numertoken = tokenCount + i + 1;

      // Si hay una imagen, se asocia al token
      // modelToken.img.imgUrl = result.secure_url;
      // modelToken.img.imgId = result.public_id;

      tokens.push(modelToken);
    }

    // Insertar tokens en lotes para evitar sobrecargar la base de datos
    const batchSize = 1000;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await TokenCollection.insertMany(batch);
    }

    return res.status(200).send({
      message: `${tokenAmount} tokens creados y guardados exitosamente.`,
    });
  } catch (error) {
    console.error("Error al agregar tokens a la colección:", error);
    return res
      .status(500)
      .send({ error: "Hubo un error al agregar tokens a la colección" });
  }
}

async function createCollection(req, res) {
  try {
    const modelCollections = new Collections();
    const idUsuario = req.user.sub;

    const parameters = req.body;
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(parameters.nameCollection + randomBytes)
      .digest("hex");

    if (!parameters.nameCollection || !parameters.desc) {
      return res.status(500).send({ message: "Datos obligatorios faltantes" });
    }

    Collections.find(
      { nameCollection: parameters.nameCollection },
      async (err, collectionsName) => {
        if (collectionsName.length > 0) {
          return res
            .status(500)
            .send({ message: "Este nombre ya se está utilizando" });
        }

        modelCollections.hash = hash;
        modelCollections.nameCollection = parameters.nameCollection;
        modelCollections.desc = parameters.desc;
        modelCollections.author = idUsuario;

        if (req.files?.image) {
          // Subir la imagen a Cloudinary y obtener el resultado
          const result = await UploadImg(req.files.image.tempFilePath);
          // Guardar la información de la imagen en el modelo de usuario

          modelCollections.img.imgUrl = result.secure_url;
          modelCollections.img.imgId = result.public_id;

          // Verificar si el archivo temporal existe antes de intentar eliminarlo
          if (fs.existsSync(req.files.image.tempFilePath)) {
            await fs.unlink(req.files.image.tempFilePath);
          } else {
            console.warn("El archivo temporal no existe.");
          }
        }

        modelCollections.save((err, collectionSave) => {
          if (err || !collectionSave) {
            console.error(
              "Error al ejecutar la petición de guardar la colección:",
              err
            );
            return res
              .status(500)
              .send({ message: "Error al guardar la colección" });
          }

          return res.status(200).send({ message: collectionSave });
        });
      }
    );
  } catch (error) {
    console.error("Error al crear la colección:", error);
    return res
      .status(500)
      .send({ message: "Hubo un error al crear la colección" });
  }
}

async function updateCollection(req, res) {
  try {
    const collectionId = req.params.collectionId;

    const parameters = req.body;
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(parameters.nameCollection + randomBytes)
      .digest("hex");

    if (!parameters.nameCollection || !parameters.desc) {
      return res.status(500).send({ message: "Datos obligatorios faltantes" });
    }

    Collections.findById({ _id: collectionId }, async (err, findColection) => {
      if (!findColection) {
        return res.status(500).send({ message: "No se encontro la coleccion" });
      }

      findColection.hash = hash;
      findColection.nameCollection = parameters.nameCollection;
      findColection.desc = parameters.desc;

      if (req.files?.image) {
        // Subir la imagen a Cloudinary y obtener el resultado
        const result = await UploadImg(req.files.image.tempFilePath);
        // Guardar la información de la imagen en el modelo de usuario

        findColection.img.imgUrl = result.secure_url;
        findColection.img.imgId = result.public_id;

        // Verificar si el archivo temporal existe antes de intentar eliminarlo
        if (fs.existsSync(req.files.image.tempFilePath)) {
          await fs.unlink(req.files.image.tempFilePath);
        } else {
          console.warn("El archivo temporal no existe.");
        }
      }

      findColection.save((err, collectionSave) => {
        if (err || !collectionSave) {
          console.error(
            "Error al ejecutar la petición de guardar la colección:",
            err
          );
          return res
            .status(500)
            .send({ message: "Error al guardar la colección" });
        }

        return res.status(200).send({ message: collectionSave });
      });
    });
  } catch (error) {
    console.error("Error al crear la colección:", error);
    return res
      .status(500)
      .send({ message: "Hubo un error al crear la colección" });
  }
}

async function viewTokenById(req, res) {
  try {
    const tokensFid = await TokenCollection.findById({
      _id: req.params.tokenId,
    }).exec();

    if (!tokensFid) {
      return res.status(404).send({
        message: "No se encontro ningun token",
      });
    }

    res.status(200).send({ message: tokensFid });
  } catch (error) {
    console.error("Error al buscar tokens:", error);
    res.status(500).send({ error: "Hubo un error al buscar el token" });
  }
}

async function getTicketsByColletion(req, res) {
  try {
    const tickets = await TokenCollection.find({
      idCollection: req.params.idColletion,
    }).exec();

    if (!tickets) {
      return res.status(404).send({
        message: "No se encontro ningun token",
      });
    }

    res.status(200).send({ tickets });
  } catch (error) {
    console.error("Error al buscar tokens:", error);
    res.status(500).send({ error: "Hubo un error al buscar el token" });
  }
}

async function viewToken(req, res) {
  try {
    const tokensFid = await TokenCollection.find({
      author: req.params.author,
      adquirido: false, // Filtrar por tokens no adquiridos
    }).exec();

    if (tokensFid.length === 0) {
      return res.status(404).send({
        message: "No se encontraron tokens no adquiridos para esta colección",
      });
    }

    res.status(200).send({ message: tokensFid });
  } catch (error) {
    console.error("Error al buscar tokens:", error);
    res.status(500).send({ error: "Hubo un error al buscar tokens" });
  }
}

const getCollectionsByAuthorId = async (req, res) => {
  const { authorId } = req.params;

  try {
    const collections = await Collections.find({ author: authorId });

    if (!collections) {
      return res
        .status(404)
        .json({ message: "No collections found for this author" });
    }

    res.status(200).json({ message: collections });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function findCollectionByName(req, res) {
  const { name } = req.params; // Supongamos que el nombre se pasa como parámetro en la URL
  console.log(name);
  try {
    // Buscar la colección por su nombre
    const collection = await Collections.find({ author: name });

    if (collection) {
      // Si se encuentra la colección, devolverla en la respuesta
      return res.status(200).send({ message: collection });
    } else {
      // Si no se encuentra la colección, devolver un mensaje de error
      return res
        .status(404)
        .send({ message: "No se encontró ninguna colección con ese nombre." });
    }
  } catch (error) {
    // Manejar errores
    console.error("Error al buscar la colección:", error);
    return res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function findCollectionById(req, res) {
  const { collectionId } = req.params;
  try {
    // Buscar la colección por su nombre
    const collection = await Collections.findById({ _id: collectionId });

    if (collection) {
      // Si se encuentra la colección, devolverla en la respuesta
      return res.status(200).send({ message: collection });
    } else {
      // Si no se encuentra la colección, devolver un mensaje de error
      return res
        .status(404)
        .send({ message: "No se encontró ninguna colección con ese nombre." });
    }
  } catch (error) {
    // Manejar errores
    console.error("Error al buscar la colección:", error);
    return res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function findCollectionByUser(req, res) {
  try {
    // Buscar la colección por su nombre
    const collection = await Collections.find({ author: req.user.sub });

    if (collection) {
      // Si se encuentra la colección, devolverla en la respuesta
      return res.status(200).send({ message: collection });
    } else {
      // Si no se encuentra la colección, devolver un mensaje de error
      return res
        .status(404)
        .send({ message: "No se encontró ninguna colección con ese nombre." });
    }
  } catch (error) {
    // Manejar errores
    console.error("Error al buscar la colección:", error);
    return res.status(500).send({ message: "Error interno del servidor." });
  }
}

function tokensSolos(req, res) {
  Token.find((err, tokenOne) => {
    console.log(tokenOne);
  });
}

async function redeemTicket(req, res) {
  try {
    const idTicket = req.params.idTicket;
    const idUsuario = req.user.sub;

    const nuevoBuyerId = req.body.buyerid;

    // Validar si los IDs son válidos
    if (!idTicket || !idUsuario) {
      return res
        .status(400)
        .send({ message: "Se requieren IDs de ticket y usuario válidos." });
    }

    // Verificar si el usuario ya ha adquirido el ticket
    const usuario = await User.findById(idUsuario);
    if (!usuario) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún usuario con ese ID." });
    }
    if (usuario.ticketsObtained.includes(idTicket)) {
      return res
        .status(400)
        .send({ message: "El usuario ya ha adquirido este ticket." });
    }

    // Actualizar el ticket
    const ticketActualizado = await TokenCollection.findByIdAndUpdate(
      idTicket,
      { buyerid: nuevoBuyerId, adquirido: true },
      { new: true }
    );

    if (!ticketActualizado) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún ticket con ese ID." });
    }

    // Agregar el ticket a los tokens obtenidos del usuario
    usuario.ticketsObtained.push(ticketActualizado);

    // Guardar los cambios en el usuario
    await usuario.save();

    res.status(200).send({
      message: "Ticket redimido exitosamente.",
      ticket: ticketActualizado,
    });
  } catch (error) {
    console.error("Error al redimir el ticket:", error);
    res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function redeemTicketPizzaCampero(req, res) {
  try {
    const idbuyer = req.params.idbuyer; // ID del documento PizzaCamperoData a actualizar

    console.log("ID del comprador:", idbuyer);

    // Buscar el documento PizzaCamperoData correspondiente al idbuyer
    const pizzaCamperoData = await PizzaCamperoDataModel.findOne({
      _id: idbuyer,
    });
    if (!pizzaCamperoData) {
      console.log("No se encontró el Usuario con ID:", idbuyer);
      return res.status(404).json({ message: "No se encontró el comprador" });
    }

    // Verificar si el comprador ya ha ganado
    if (pizzaCamperoData.winner === true) {
      console.log("El comprador ya ha ganado un premio.");
      return res.status(400).json({
        message: "Ya has ganado un premio.",
      });
    }

    // Definir las categorías y sus probabilidades según el país
    const categoriesByCountry = {
      Guatemala: {
        "PS5-G": 0.00053,
        "GIFTCARD-G-25": 0.00526,
        "GIFTCARD-G-50": 0.00369,
        "GIFTCARD-G-100": 0.00421,
        "PIZZA-G": 0.03896,
      },
      "El Salvador": {
        "PS5-S": 0.0006988,
        "GIFTCARD-S-25": 0.00699,
        "GIFTCARD-S-50": 0.00559,
        "GIFTCARD-S-100": 0.00489,
        "PIZZA-S": 0.0517,
      },
    };

    const country = pizzaCamperoData.country;
    const categories =
      categoriesByCountry[country] || categoriesByCountry["Guatemala"];

    // Generar un número aleatorio entre 0 y 100
    const randomNumber = Math.random() * 100;
    console.log("Número aleatorio generado:", randomNumber);

    // Determinar la categoría del ticket basado en la probabilidad
    let category = "participacion"; // Por defecto es participación
    let accumulatedProbability = 0;

    for (const [key, value] of Object.entries(categories)) {
      accumulatedProbability += value;
      if (randomNumber < accumulatedProbability) {
        category = key;
        break;
      }
    }

    console.log(`Buscando ticket de "${category}"...`);

    // Buscar un ticket disponible de la categoría determinada y autor específico
    let ticket = await TokenCollection.findOne({
      canjeado: false,
      category: category,
      author: "6712c51f0fbdd0960c77ade3",
    });

    // Si no hay tickets de la categoría determinada, buscar un ticket de "participacion"
    if (!ticket) {
      console.log(
        `No se encontró ticket de "${category}". Buscando ticket de "participacion"...`
      );
      ticket = await TokenCollection.findOne({
        canjeado: false,
        category: "participacion",
        author: "6712c51f0fbdd0960c77ade3",
      });
      category = "participacion"; // Confirmar que encontramos un ticket de "participacion"
    }

    if (!ticket) {
      console.log("No se encontró ningún ticket disponible para canjear.");
      return res
        .status(404)
        .json({ message: "No hay tickets disponibles para canjear" });
    }

    // Actualizar el ticket encontrado
    ticket.canjeado = true;
    ticket.buyerid = idbuyer;
    ticket.adquirido = true;
    await ticket.save();
    console.log("Ticket actualizado y guardado.");

    // Actualizar el campo winner en el documento PizzaCamperoData
    pizzaCamperoData.winner = [
      "PS5-G",
      "GIFTCARD-G-25",
      "GIFTCARD-G-50",
      "GIFTCARD-G-100",
      "PIZZA-G",
      "PS5-S",
      "GIFTCARD-S-25",
      "GIFTCARD-S-50",
      "GIFTCARD-S-100",
      "PIZZA-S",
    ].includes(category);
    pizzaCamperoData.hasRegistered = true;
    if (
      [
        "PS5-G",
        "GIFTCARD-G-25",
        "GIFTCARD-G-50",
        "GIFTCARD-G-100",
        "PIZZA-G",
        "PS5-S",
        "GIFTCARD-S-25",
        "GIFTCARD-S-50",
        "GIFTCARD-S-100",
        "PIZZA-S",
      ].includes(category)
    ) {
      pizzaCamperoData.prize = category;
    }

    pizzaCamperoData.ticketsCollected.push(ticket);

    // Guardar los cambios en el documento PizzaCamperoData
    await pizzaCamperoData.save();
    console.log("Datos del comprador actualizados y guardados.");

    // Devolver el ticket actualizado como respuesta
    res.status(200).json({
      message: "Ticket canjeado exitosamente",
      ticket,
      registro: pizzaCamperoData,
    });
  } catch (error) {
    console.log("Error en la operación:", error.message);
    // Manejo de errores
    res.status(500).json({ error: error.message });
  }
}

async function burnTicket(req, res) {
  try {
    const idDocumento = req.params.idTicket; // ID del documento a actualizar

    console.log(idDocumento);
    // Validar si el ID es válido
    if (!idDocumento) {
      return res
        .status(400)
        .send({ message: "Se requiere un ID de documento válido." });
    }

    // Buscar el ticket en la base de datos
    const ticket = await TokenCollection.findById(idDocumento);

    // Comprobar si el ticket existe
    if (!ticket) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún ticket con ese ID." });
    }

    // Comprobar si el ticket ya ha sido canjeado
    if (ticket.canjeado) {
      return res
        .status(400)
        .send({ message: "El ticket ya ha sido canjeado." });
    }

    // Actualizar el documento
    const documentoActualizado = await TokenCollection.findByIdAndUpdate(
      idDocumento,
      { canjeado: true },
      { new: true }
    );

    // Comprobar si se actualizó el documento
    if (!documentoActualizado) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún documento con ese ID." });
    }
    // io.on('connection', (socket) => {
    // 	console.log('Un cliente se ha conectado');
    // });
    // io.on('documentoActualizado', { documento: documentoActualizado });
    console.log(io);
    res.status(200).send({
      message: "Documento actualizado con éxito.",
      documento: documentoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el documento:", error);
    res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function deleteOneTicket(req, res) {
  try {
    const idTicket = req.params.idTicket; // ID del documento a eliminar

    // Buscar el ticket en la base de datos
    const ticket = await TokenCollection.findByIdAndDelete({ _id: idTicket });

    // Comprobar si el ticket existe
    if (!ticket) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún ticket con ese ID." });
    }

    res.status(200).send({
      message: "Ticket eliminado exitosamente.",
    });
  } catch (error) {
    console.error("Error al actualizar el documento:", error);
    res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function deleteManyTicket(req, res) {
  try {
    const { idTickets } = req.body; // Arreglo  de ids de los tickets

    // Buscar el ticket en la base de datos
    const tickets = await TokenCollection.deleteMany({ idTickets });

    // Comprobar si el ticket existe
    if (!tickets) {
      return res
        .status(404)
        .send({ message: "No se encontró ningún ticket con ese ID." });
    }

    res.status(200).send({
      message: "Los tickets fuerion eliminado exitosamente.",
    });
  } catch (error) {
    console.error("Error al actualizar el documento:", error);
    res.status(500).send({ message: "Error interno del servidor." });
  }
}

async function createCollectionWithTickets(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      nameCollection,
      desc,
      author,
      title,
      subTitle,
      ticketDesc,
      price,
      tokenAmount,
      categoryTiket,
      idEvent,
    } = req.body;
    const collectionImg = req.files.collectionImg;
    const ticketImg = req.files.ticketImg;

    // Subir la imagen de la colección
    const collectionImgResult = await UploadImg(collectionImg.tempFilePath);

    // Crear la colección
    const collection = new Collections({
      hash: crypto.randomBytes(16).toString("hex"),
      nameCollection,
      desc,
      img: {
        imgUrl: collectionImgResult.secure_url,
        imgId: collectionImgResult.public_id,
      },
      author,
      idEvent: idEvent,
    });

    const savedCollection = await collection.save({ session });

    // Subir la imagen de los tickets
    const ticketImgResult = await UploadImg(ticketImg.tempFilePath);

    // Generar tickets
    const tickets = [];
    for (let i = 0; i < tokenAmount; i++) {
      const randomBytes = crypto.randomBytes(32).toString("hex");
      const hash = crypto
        .createHash("sha256")
        .update(nameCollection + randomBytes)
        .digest("hex");

      const ticket = new TokenCollection({
        hash: hash,
        numertoken: i + 1,
        title: title,
        subTitle: subTitle,
        desc: ticketDesc,
        img: {
          imgUrl: ticketImgResult.secure_url,
          imgId: ticketImgResult.public_id,
        },
        price: price * 100,
        author: author,
        idCollection: savedCollection._id,
        category: categoryTiket,
      });

      tickets.push(ticket);
    }

    const savedTickets = await TokenCollection.insertMany(tickets, { session });

    await session.commitTransaction();
    session.endSession();

    // Eliminar archivos temporales
    if (collectionImg && fs.existsSync(collectionImg.tempFilePath)) {
      await fs.unlink(collectionImg.tempFilePath);
    }
    if (ticketImg && fs.existsSync(ticketImg.tempFilePath)) {
      await fs.unlink(ticketImg.tempFilePath);
    }

    res
      .status(201)
      .json({ collection: savedCollection, tickets: savedTickets });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating collection and tickets", error });
  }
}

module.exports = {
  addTokenToCollection,
  addTokenToCollectionNew,
  createCollection,
  updateCollection,
  viewToken,
  getTicketsByColletion,
  viewTokenById,
  tokensSolos,
  findCollectionByName,
  findCollectionByUser,
  findCollectionById,
  redeemTicket,
  burnTicket,
  deleteOneTicket,
  deleteManyTicket,
  createCollectionWithTickets,
  getCollectionsByAuthorId,

  redeemTicketPizzaCampero,
};
