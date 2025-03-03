const controllerChokis = require("../../controllers/chokisController/chokis.controller");

const express = require("express");

const api = express.Router();

api.post("/RegistrarDataChokis", controllerChokis.guardarDatos);

api.get("/ObtenerDatos", controllerChokis.obtenerData);

module.exports = api;
