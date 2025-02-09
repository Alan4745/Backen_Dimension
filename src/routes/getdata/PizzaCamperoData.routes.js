const controllerRegistrarData = require("../../controllers/pizzaCamperoData/pizzaCamperoData.controller");

const express = require("express");

const api = express.Router();

api.post("/RegistrarDataPizza", controllerRegistrarData.RegistrarData);
// Parámetros de consulta:
// - filtro: El tipo de premio (opcional)
// - pais: El país (opcional)
// - page: El número de página para la paginación (opcional, por defecto 1)
// - limit: El número de registros por página (opcional, por defecto 100)
// Ejemplo de uso:
// curl -X GET "http://localhost:3000/api/ObtenerGanadores?filtro=PS5-G&pais=Guatemala&page=1&limit=100"
api.get("/ObtenerGanadores", controllerRegistrarData.ObtenerGanadores);

module.exports = api;
