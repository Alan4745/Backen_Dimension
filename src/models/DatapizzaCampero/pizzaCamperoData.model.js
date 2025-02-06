const mongoose = require("mongoose");
const { Schema } = mongoose;

// Definir el esquema para el formulario de registro
const dataPizzaCamperoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // Asegurarse de que el correo electrónico sea único
    },
    phone: {
      type: String,
      required: true,
    },

    // Campo que indica si el usuario ya se ha registrado
    hasRegistered: {
      type: Boolean,
      default: false, // Por defecto, aún no se ha registrado
    },
    // Campo que indica si el usuario es un ganador
    winner: {
      type: Boolean,
      default: false, // Inicialmente no se considera ganador
    },
    // Campo para almacenar los tickets recogidos
    ticketsCollected: {
      type: [Schema.Types.Mixed], // Array que puede contener cualquier tipo de datos
      default: [], // Valor por defecto es un array vacío
    },
    // Nuevo campo para DPI
    dpi: {
      type: String,
      required: true,
    },
    // Nuevo campo para premio en inglés
    prize: {
      type: String,
      default: "",
    },
    // Nuevo campo para país en inglés
    country: {
      type: String,
      required: true,
    },
    // Nuevo campo para términos y condiciones
    terminosCondiciones: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true, // Añade campos createdAt y updatedAt automáticamente
  }
);

// Exportar el modelo
module.exports = mongoose.model("DataPizzaCampero", dataPizzaCamperoSchema);
