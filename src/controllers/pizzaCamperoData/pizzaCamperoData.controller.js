const PizzaCamperoDataModel = require("../../models/DatapizzaCampero/pizzaCamperoData.model");
const validator = require("validator"); // Asegúrate de instalar la librería validator
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");

async function RegistrarData(req, res) {
  try {
    const { name, email, phone, dpi, country, terminosCondiciones } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !dpi ||
      !country ||
      terminosCondiciones !== true
    ) {
      console.log(
        "Todos los campos son requeridos y los términos y condiciones deben ser aceptados."
      );
      return res.status(400).json({
        success: false,
        message:
          "Todos los campos son requeridos y los términos y condiciones deben ser aceptados.",
      });
    }

    if (!validator.isEmail(email)) {
      console.log("El correo electrónico no es válido.");
      return res.status(400).json({
        success: false,
        message: "El correo electrónico no es válido.",
      });
    }

    if (!/^\+\d{1,3}\d{8}$/.test(phone)) {
      console.log(
        "El número de teléfono debe tener un prefijo de país seguido de exactamente 8 dígitos."
      );
      return res.status(400).json({
        success: false,
        message:
          "El número de teléfono debe tener un prefijo de país seguido de exactamente 8 dígitos.",
      });
    }

    if (country === "Guatemala" && !/^\d{13}$/.test(dpi)) {
      console.log("El DPI de Guatemala debe tener exactamente 13 dígitos.");
      return res.status(400).json({
        success: false,
        message: "El DPI debe tener exactamente 13 dígitos.",
      });
    }

    if (country === "El Salvador" && !/^\d{9}$/.test(dpi)) {
      console.log("El DUI de El Salvador debe tener exactamente 9 dígitos.");
      return res.status(400).json({
        success: false,
        message: "DUI debe tener exactamente 9 dígitos.",
      });
    }

    const existingData = await PizzaCamperoDataModel.findOne({
      $or: [{ email: email }, { dpi: dpi }],
    });

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
    } else {
      const newData = new PizzaCamperoDataModel({
        name,
        email,
        phone,
        dpi,
        country,
        terminosCondiciones,
      });

      await newData.save();

      res.status(200).json({
        success: true,
        message: newData,
      });
    }
  } catch (error) {
    console.error("Error al registrar los datos:", error);
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor. Por favor, inténtelo de nuevo más tarde.",
    });
  }
}

async function ObtenerGanadores(req, res) {
  try {
    const {
      filtro,
      pais,
      page = 1,
      limit = 100,
      fechaInicio,
      fechaFin,
    } = req.query;

    let match = { winner: true };

    if (filtro && filtro !== "todos") {
      match.prize = filtro;
    } else if (filtro === "todos") {
      match = {}; // Obtener todos los registros sin filtrar por winner
    }

    if (pais && (pais === "Guatemala" || pais === "El Salvador")) {
      match.country = pais;
    }

    // 🔹 Convertir fechas a UTC desde la zona horaria de Guatemala
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

    const datos = await PizzaCamperoDataModel.aggregate(pipeline);

    const totalRegistros = await PizzaCamperoDataModel.countDocuments(match);

    const totalParticipacionesGeneral = await PizzaCamperoDataModel.aggregate([
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
}

async function GenerarReporteExcel(req, res) {
  try {
    const { filtro, pais, fechaInicio, fechaFin } = req.query;

    let match = { winner: true };

    if (filtro && filtro !== "todos") {
      match.prize = filtro;
    } else if (filtro === "todos") {
      match = {}; // Obtener todos los registros sin filtrar por winner
    }

    if (pais && (pais === "Guatemala" || pais === "El Salvador")) {
      match.country = pais;
    }

    // 🔹 Convertir fechas a UTC desde la zona horaria de Guatemala
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

    const datos = await PizzaCamperoDataModel.find(match);

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte de Ganadores");

    // Añadir encabezados
    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Teléfono", key: "phone", width: 15 },
      { header: "DPI", key: "dpi", width: 20 },
      { header: "País", key: "country", width: 15 },
      { header: "Premio", key: "prize", width: 20 },
      { header: "Fecha de Creación", key: "createdAt", width: 25 },
      { header: "Fecha de Actualización", key: "updatedAt", width: 25 },
    ];

    // Añadir filas
    datos.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        email: item.email,
        phone: item.phone,
        dpi: item.dpi,
        country: item.country,
        prize: item.prize,
        createdAt: moment(item.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    // Obtener la fecha y hora actual del servidor
    const fechaHoraActual = moment().format("YYYYMMDD_HHmmss");

    // Configurar el tipo de contenido y el nombre del archivo
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Ganadores_${fechaHoraActual}.xlsx`
    );

    // Enviar el archivo Excel
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al generar el reporte Excel:", error);
    res.status(500).json({
      success: false,
      message:
        "Error interno del servidor. Por favor, inténtelo de nuevo más tarde.",
    });
  }
}

module.exports = {
  RegistrarData,
  ObtenerGanadores,
  GenerarReporteExcel,
};
