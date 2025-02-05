const PizzaCamperoDataModel = require("../../models/DatapizzaCampero/pizzaCamperoData.model");
const validator = require("validator"); // Asegúrate de instalar la librería validator

async function RegistrarData(req, res) {
  try {
    const {
      name,
      lastname,
      email,
      phone,
      dpi,
      dateOfBirth,
      country,
      terminosCondiciones,
    } = req.body;

    if (
      !name ||
      !lastname ||
      !email ||
      !phone ||
      !dpi ||
      !dateOfBirth ||
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

    const calculateAge = (dob) => {
      const diff = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const age = calculateAge(dateOfBirth);

    if (age < 18) {
      console.log("Debe ser mayor de edad para registrarse.");
      return res.status(400).json({
        success: false,
        message: "Debe ser mayor de edad para registrarse.",
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
        lastname,
        email,
        phone,
        dpi,
        age,
        dateOfBirth,
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

module.exports = {
  RegistrarData,
};
