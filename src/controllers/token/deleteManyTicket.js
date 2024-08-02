/* eslint-disable no-unused-vars */
// const crypto = require("crypto");
const TokenCollection = require("../../models/tokens/tokenCollection.model");
// const Collections = require("../../models/tokens/collections.model");
// const Token = require("../../models/tokens/tokenUnitary.model");
// const fs = require("fs-extra");
// const User = require("../../models/user.model");
// const io = require("../../../Server");

// const { UploadImg } = require("../../utils/cloudinary");
// const { default: mongoose } = require("mongoose");

async function deleteManyTicket(req, res) {
    try {
      const {idTickets} = req.body; // Arreglo  de ids de los tickets
  
      // Buscar el ticket en la base de datos
      const tickets = await TokenCollection.deleteMany({idTickets});
  
      // Comprobar si el ticket existe
      if (!tickets) {
        return res
          .status(404)
          .send({ message: "No se encontró ningún ticket con ese ID." });
      }
  
      res.status(200).send({
        message: "Los tickets fuerion eliminado exitosamente."
      });
    } catch (error) {
      console.error("Error al actualizar el documento:", error);
      res.status(500).send({ message: "Error interno del servidor." });
    }
}

module.exports = { deleteManyTicket }