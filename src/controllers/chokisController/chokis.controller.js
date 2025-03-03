const ChokisModel = require("../../models/DataChokis/chokisData.model");

// Función para calcular la edad a partir de la fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// Función para validar el formato del correo electrónico
const validarCorreo = (correo) => {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return regex.test(correo);
};

// Función para guardar los datos
const guardarDatos = async (req, res) => {
  try {
    const { nombreCompleto, fechaNacimiento, correo } = req.body;

    // Validar el formato del correo electrónico
    if (!validarCorreo(correo)) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico no es válido.",
      });
    }

    // Verificar si el correo ya está registrado en la base de datos
    const existingData = await ChokisModel.findOne({ correo });
    if (existingData) {
      if (existingData.winner) {
        console.log(
          "El usuario ya ha ganado un premio y no puede participar más."
        );
        return res.status(400).json({
          success: false,
          message:
            "El usuario ya ha ganado un premio y no puede participar más.",
        });
      }

      return res.status(200).json({
        success: true,
        message: existingData,
      });
    }

    // Calcular la edad a partir de la fecha de nacimiento
    const edad = calcularEdad(fechaNacimiento);

    // Crear una nueva instancia del modelo con los datos recibidos
    const nuevoRegistro = new ChokisModel({
      nombreCompleto,
      fechaNacimiento,
      correo,
      edad,
    });

    // Guardar el nuevo registro en la base de datos
    await nuevoRegistro.save();

    // Enviar una respuesta exitosa
    res.status(201).json({
      success: true,
      message: nuevoRegistro,
    });
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor. Por favor, inténtelo de nuevo más tarde.",
    });
  }
};

const obtenerGanadores = async (req, res) => {
  try {
    const { filtro, page = 1, limit = 100, fechaInicio, fechaFin } = req.query;

    let match = {};

    if (filtro && filtro !== "todos" && filtro !== "ganadores") {
      match.prize = filtro;
    } else if (filtro === "todos") {
      match = {}; // Obtener todos los registros sin filtrar por winner
    } else if (filtro === "ganadores") {
      match.winner = true;
    }

    // Convertir fechas a UTC desde la zona horaria de Guatemala
    if (fechaInicio || fechaFin) {
      match.createdAt = {};
      if (fechaInicio) {
        match.createdAt.$gte = moment
          .tz(fechaInicio + "T00:00:00", "America/Guatemala")
          .utc()
          .toDate();
      }
      if (fechaFin) {
        match.createdAt.$lte = moment
          .tz(fechaFin + "T23:59:59", "America/Guatemala")
          .utc()
          .toDate();
      }
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $addFields: {
          totalTicketsCollected: {
            $size: { $ifNull: ["$ticketsCollected", []] },
          },
          createdAtFecha: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$createdAt" },
              timezone: "America/Guatemala",
            },
          },
          createdAtHora: {
            $dateToString: {
              format: "%H:%M:%S",
              date: { $toDate: "$createdAt" },
              timezone: "America/Guatemala",
            },
          },
          updatedAtFecha: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$updatedAt" },
              timezone: "America/Guatemala",
            },
          },
          updatedAtHora: {
            $dateToString: {
              format: "%H:%M:%S",
              date: { $toDate: "$updatedAt" },
              timezone: "America/Guatemala",
            },
          },
        },
      },
      {
        $project: {
          ticketsCollected: 0,
        },
      },
    ];

    const datos = await ChokisModel.aggregate(pipeline);

    const totalRegistros = await ChokisModel.countDocuments(match);

    const totalParticipacionesGeneral = await ChokisModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: { $size: { $ifNull: ["$ticketsCollected", []] } } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: datos,
      totalRegistros,
      totalParticipacionesGeneral: totalParticipacionesGeneral[0]?.total || 0,
      totalPages: Math.ceil(totalRegistros / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor. Inténtelo de nuevo más tarde.",
    });
  }
};

module.exports = {
  guardarDatos,
  obtenerGanadores,
};
