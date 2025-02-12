const controllerRegistrarData = require("../../controllers/pizzaCamperoData/pizzaCamperoData.controller");

const express = require("express");

const api = express.Router();

api.post("/RegistrarDataPizza", controllerRegistrarData.RegistrarData);

// aca necesito tener los ejempos de las rutas que puedo llegar a utilizar
// por ejemplo esta ess para obtener todos los datos http://localhost:3000/api/ObtenerGanadores?filtro=todos
api.get("/ObtenerGanadores", controllerRegistrarData.ObtenerGanadores);

api.get("/GenerarReporteExcel", controllerRegistrarData.GenerarReporteExcel);

module.exports = api;
