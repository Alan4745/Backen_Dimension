const mongoose = require("mongoose");
const { Schema } = mongoose;

// Definir el esquema para el formulario de registro
const chokisDataSchema = new Schema(
  {
    nombreCompleto: {
      type: String,
      required: true,
    },
    fechaNacimiento: {
      type: Date,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
    },
    edad: {
      type: Number,
      min: 0,
    },
    ticketsCollected: {
      type: [Schema.Types.Mixed], // Array que puede contener cualquier tipo de datos
      default: [], // Valor por defecto es un array vacío
    },
    prize: {
      type: String,
      default: "",
    },
    winner: {
      type: Boolean,
      default: false, // Inicialmente no se considera ganador
    },
    hasRegistered: {
      type: Boolean,
      default: false, // Por defecto, aún no se ha registrado
    },
    grandPrize: {
      type: String,
      default: "", // Valor por defecto es una cadena vacía
    },
  },
  {
    timestamps: true, // Añade campos createdAt y updatedAt automáticamente
  }
);

// Exportar el modelo
module.exports = mongoose.model("ChokisData", chokisDataSchema);
